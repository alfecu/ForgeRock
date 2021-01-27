/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
/* global request, context, openidm */
 /* eslint consistent-return: off */
var _ = require('commons/lib/lodash4.js');
var __ = require('commons/utils/jsUtils.js');
var moment = require('commons/lib/moment.js')
var CONSTANT = require('idg/utils/globalConstants.js');
var moment = require('commons/lib/moment.js')
var utils = require('idg/utils/generalUtilities.js');
var CERT_VALS = require('idg/utils/certificationValidations.js');

var queryParams = null;
var LOGGED_IN_USERNAME = null;
var CERTIFICATION_TYPE = 'user'; // default to user
var CERT_REPO_PATH = null;

run();
function run() {
  var _policyViolations = [];
  queryParams = request.additionalParameters;
  LOGGED_IN_USERNAME = utils.getUserNameFromCookie(context);
  /*
   * POST /governance/scheduledCertification/<type>?_action=create
   */
  if (utils.actionIs('CREATE', request.action) || utils.methodIs('CREATE')) {
    // On a create request, add the scheduled certification object with the specified fields and generate an id.
    // Return JSON formatted replica of request body if valid or policy validation errors if invalid

    var reqBody = request.content;
    CERTIFICATION_TYPE = reqBody.certObjectType;
    setCertificationPaths(CERTIFICATION_TYPE);

    reqBody.frequency = 'Scheduled';
    // Set certification type to 'Identity'
    reqBody.type = 'identity';

    // validate target filter
    var targetFilter = reqBody.targetFilter;
    CERT_VALS.validateTargetFilter(targetFilter, CERTIFICATION_TYPE);

    CERT_VALS.runAllPolicies(reqBody, _policyViolations);

    if (_policyViolations.length) {
      return {
        policyViolations: _policyViolations
      };
    }

    var scriptFields = {
      type: 'javascript',
      file: 'script/idg/certification.js',
      input: {}
    };

    var scriptObj = { script: scriptFields };
    var scheduleSpecific = {
      enabled: true,
      type: 'cron',
      schedule: reqBody.schedule,
      persisted: true,
      misfirePolicy: 'doNothing',
      invokeService: 'script',
      invokeContext: scriptObj
    }

    var createResponse = openidm.create('scheduler/job', null, scheduleSpecific);
    var id = createResponse._id;
    var schedulerObj = getSchedulerWithId(openidm, id);

    // NOTE: create corresponding repo object
    reqBody.nextRunDate = moment(schedulerObj.nextRunDate).format();
    reqBody.schedulerId = id;
    var repoObj = openidm.create(CERT_REPO_PATH, null, reqBody);

    // Update scheduler job with created cert id
    schedulerObj.invokeContext.script.input.scheduledCertId = repoObj._id;
    schedulerObj.invokeContext.script.input.certificationType = CERTIFICATION_TYPE === 'user' ? 'user' : 'object';
    var updateScheduler = openidm.update('scheduler/job/' + id, null, schedulerObj);
    
    var userName = utils.getUserNameFromCookie(context);
    var timeStamp = moment().format();
    var __version = getSchedulerPath(openidm, id) + id;
    var __message = 'Certification has been created. Full id: ' + __version;

    var auditEntry =  {
      timestamp: timeStamp,
      eventName: 'scheduled-certification',
      userId: userName,
      runAs: userName,
      objectId: __version,
      operation: 'CREATE',
      before: null,
      after: schedulerObj,
      changedFields: [],
      revision: 0,
      passwordChanged: false,
      message: __message,
      status: 'SUCCESS'
    };

    utils.createNewAuditEvent(openidm, context, auditEntry);

    return {
      result: { _id: repoObj._id }
    };

  } else if (
    utils.methodIs('READ') &&
    _.isEmpty(queryParams) &&
    utils.urlParamsCount(request.resourcePath, 2)
  ) {
    urlSegments = request.resourcePath.split('/');
    CERTIFICATION_TYPE = urlSegments[0]
    setCertificationPaths(CERTIFICATION_TYPE);
    /*
     * GET REQUEST FOR SPECIFIC ID
     */
    var repoObjId = urlSegments[1];
    var repoObj = openidm.read(CERT_REPO_PATH + repoObjId);
    var schObj = getSchedulerWithId(openidm, repoObj.schedulerId);

    if (_.isEmpty(schObj)) {
      return {
        result: "No scheduled job for this certification campaign exists"
      };
    }

    if (repoObj) {
      return {
        result: repoObj
      }
    }

    return {
      results: "That id corresponds with a scheduled object that is not a certification object"
    };

  } else if (
    utils.methodIs('READ') &&
    utils.urlParamsCount(request.resourcePath, 1)
  ) {
    CERTIFICATION_TYPE = request.resourcePath
    setCertificationPaths(CERTIFICATION_TYPE);
    var filter = queryParams.q ? 'name co "' + queryParams.q + '"' : 'true';
    var SORT_BY = queryParams.sortBy || 'name';
    /*
     * GET REQUEST FOR ALL SCHEDULED DEFINITIONS
     */
    var queryResults = openidm.query(CERT_REPO_PATH, { _queryFilter: filter, _sortKeys: SORT_BY });

    return {
      result: queryResults.result
    };
  }

  else if (
    utils.methodIs('ACTION') &&
    utils.actionIs('update', request.action) &&
    utils.urlParamsCount(request.resourcePath, 2)
  ) {
    urlSegments = request.resourcePath.split('/');
    CERTIFICATION_TYPE = urlSegments[0]
    var repoObjId = urlSegments[1];
    setCertificationPaths(CERTIFICATION_TYPE);

    /*
     * PUT REQUEST TO UPDATE AN SCHEDULED CERT DEFINITION
     */
    // var repoObjId = request.newResourceId;
    var repoObj = openidm.read(CERT_REPO_PATH + repoObjId);
    var schedulerId = repoObj.schedulerId;
    var schedulerObj = getSchedulerWithId(openidm, schedulerId);

    if (_.isEmpty(schedulerObj)) {
      return {
        content: "Id does not correspond to an existing scheduled certification object"
      }
    }
    var reqBody = _.assign(repoObj, request.content);
    reqBody.frequency = 'Scheduled';

    CERT_VALS.runAllPolicies(reqBody, _policyViolations);

    var scriptFields = {
      type: 'javascript',
      file: 'script/idg/certification.js',
      input: {
        scheduledCertId: repoObjId,
        certificationType: CERTIFICATION_TYPE,
      }
    };

    var scriptObj = { script: scriptFields };
    var scheduleSpecific = {
      enabled: true,
      type: 'cron',
      schedule: reqBody.schedule,
      persisted: true,
      misfirePolicy: 'doNothing',
      invokeService: 'script',
      invokeContext: scriptObj
    }

    var __version = getSchedulerPath(openidm, schedulerId) + schedulerId;
    var updatedResponse = openidm.update(__version, null, scheduleSpecific);
    var id = updatedResponse._id;

    var userName = utils.getUserNameFromCookie(context);
    var timeStamp = moment().format();
    var auditEntry =  {
      timestamp: timeStamp,
      eventName: 'scheduled-certification',
      userId: userName,
      runAs: userName,
      objectId: __version,
      operation: 'UPDATE',
      before: schedulerObj,
      after: updatedResponse,
      changedFields: [],
      revision: 0,
      passwordChanged: false,
      message: 'Certification has been updated. Full id: ' + __version,
      status: 'SUCCESS'
    };
    utils.createNewAuditEvent(openidm, context, auditEntry);

    // NOTE: update repo object with new values
    reqBody.nextRunDate = moment(updatedResponse.nextRunDate).format();
    openidm.update(CERT_REPO_PATH + repoObjId, repoObj._rev, reqBody);

    return {
      result: { _id: repoObjId }
    };
  }
  else if (
    utils.methodIs('ACTION') &&
    utils.actionIs('delete', request.action) &&
    utils.urlParamsCount(request.resourcePath, 1)
  ) {
    /*
     * DELETE ONE OR MORE SCHEDULED CERT DEFINITIONS
     */

    CERTIFICATION_TYPE = request.resourcePath
    setCertificationPaths(CERTIFICATION_TYPE);

    // NOTE: verify request body contains Ids { ids: [ 'sdf234234', '23sfsf' ] }
    var reqBody = request.content;

    if (!__.__isArray(reqBody.ids)) {
      __.requestError('You must provide an array of ids.', 400);
    }

    var certIds = reqBody.ids;
    var idsNotProcessed = [];

    // NOTE: process each id for deletion
    certIds.forEach(function(repoObjId) {
      var repoObj = openidm.read(CERT_REPO_PATH + repoObjId);
      var scheduleId = repoObj.schedulerId;
      var schedulerObj = getSchedulerWithId(openidm, scheduleId);

      if (_.isEmpty(schedulerObj)) {
        idsNotProcessed.push(repoObjId);
        return;
      }

      var schedulerPath = getSchedulerPath(openidm, scheduleId);
      openidm.delete(schedulerPath + scheduleId, null);

      // NOTE: delete corresponding repo object
      openidm.delete(CERT_REPO_PATH + repoObjId, repoObj._rev);

      var timeStamp = moment().format();
      var auditEntry = {
        timestamp: timeStamp,
        eventName: 'scheduled-certification-delete',
        userId: LOGGED_IN_USERNAME,
        runAs: LOGGED_IN_USERNAME,
        objectId: schedulerPath + scheduleId,
        operation: 'DELETE',
        before: schedulerObj,
        after: null,
        changedFields: [],
        revision: 0,
        passwordChanged: false,
        message: 'Certification has been deleted. Full id: ' + schedulerPath + scheduleId,
        status: 'SUCCESS'
      };

      utils.createNewAuditEvent(openidm, context, auditEntry);
    });

    return {
      result: 'Success. Ids not processed were not found in scheduled objects.',
      notProcessed: idsNotProcessed
    };
  }

  /*
   * REQUEST NOT SUPPORTED. RESPOND WITH BAD REQUEST
   */
  __.requestError('Request not supported by endpoint', 400);

}//end:run()

/* ~~~~~~~~~~~~~~~~~~~~
 * HELPER FUNCTIONS
 * ~~~~~~~~~~~~~~~~~ */

/*
 * Function getSchedulerPath
 */
function getSchedulerPath(openidm, id) {
  // Get scheduler in 5.0
  var schedulerObject = openidm.read('scheduler/job/' + id);

  // Get shceduler in <=4.5
  if (!schedulerObject) {
    return 'scheduler/';
  }
  return 'scheduler/job/';
}

/*
 * Function getSchedulerWithId
 */
function getSchedulerWithId(openidm, id) {
  // Get scheduler in 5.0
  var schedulerObject = openidm.read('scheduler/job/' + id);

  if (_.isEmpty(schedulerObject)) { // Get shceduler in <=4.5
      schedulerObject = openidm.read('scheduler/' + id);
  }
  return schedulerObject;
}

function setCertificationPaths(certification_type) {
  CERT_REPO_PATH = certification_type === 'user' ? CONSTANT.REPO_PATH.SCHEDULED_USER_CERT : CONSTANT.REPO_PATH.SCHEDULED_OBJECT_CERT;
}