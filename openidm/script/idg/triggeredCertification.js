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
var utils = require('idg/utils/generalUtilities.js');
var CONSTANT = require('idg/utils/globalConstants.js');
var moment = require('commons/lib/moment.js')
var CERT_VALS = require('idg/utils/certificationValidations.js');
var queryParams = null;
var CERT_REPO_PATH = null;

var LOGGED_IN_USERNAME = null;

run();
function run() {

  var _policyViolations = [];
  queryParams = request.additionalParameters;
  LOGGED_IN_USERNAME = utils.getUserNameFromCookie(context);

  /*
   * POST /governance/triggeredCertification/<<type>>?_action=create
   */
  if ((utils.actionIs('CREATE', request.action) || utils.methodIs('CREATE')) && utils.urlParamsCount(request.resourcePath, 1)) {
    // On a create request, add the scheduled certification object with the specified fields and generate an id.
    // Return JSON formatted replica of request body if valid or policy validation errors if invalid

    CERT_REPO_PATH = setCertificationPaths(request.resourcePath);

    var reqBody = request.content;
    reqBody.frequency = 'Event-based';
    // Set certification type to 'Identity'
    reqBody.type = 'identity';

    CERT_VALS.runAllPolicies(reqBody, _policyViolations);

    // NOTE: expression must be string type not object.
    // front end can't handle object and onUserUpdate script
    // is expecting string ¯\_(ツ)_/¯
    if (typeof reqBody.expression !== 'string') {
      reqBody.expression = JSON.stringify(reqBody.expression);
    }

    if (_policyViolations.length) {
      return {
        policyViolations: _policyViolations
      };
    }

    /*
     * SAVE CERTIFICATION
     */
    var newCert = openidm.create(CERT_REPO_PATH, null, reqBody);

    var userName = utils.getUserNameFromCookie(context);
    var timeStamp = moment().format();

    var auditEntry =  {
      timestamp: timeStamp,
      eventName: 'triggered-certification',
      userId: userName,
      runAs: userName,
      operation: 'CREATE',
      before: null,
      after: newCert,
      changedFields: [],
      revision: 0,
      passwordChanged: false,
      message: 'Certification has been created. Full id: ' + CERT_REPO_PATH + newCert._id,
      status: 'SUCCESS'
    };

    utils.createNewAuditEvent(openidm, context, auditEntry);

    return {
      result: newCert
    };

  }
  else if (
    utils.methodIs('READ') &&
    _.isEmpty(queryParams) &&
    utils.urlParamsCount(request.resourcePath, 2)
  ) {
    urlSegments = request.resourcePath.split('/');
    CERTIFICATION_TYPE = urlSegments[0];
    var certId = urlSegments[1];
    CERT_REPO_PATH = setCertificationPaths(CERTIFICATION_TYPE);
    /*
     * GET REQUEST FOR SPECIFIC ID
     */
		return {
      result: openidm.read(CERT_REPO_PATH + certId)
    }
  }
  else if (
    utils.methodIs('ACTION') &&
    utils.actionIs('update', request.action) &&
    utils.urlParamsCount(request.resourcePath, 2)
  ) {
    /*
     * POST REQUEST TO UPDATE A TRIGGERED CERT DEFINITION
     */
    urlSegments = request.resourcePath.split('/');
    CERTIFICATION_TYPE = urlSegments[0]
    var certId = urlSegments[1];
    CERT_REPO_PATH = setCertificationPaths(CERTIFICATION_TYPE);

    var certDef = openidm.read(CERT_REPO_PATH + certId);

    if (_.isEmpty(certDef)) {
      return {
        content: "Id does not correspond to an existing triggered certification object"
      }
    }

    var reqBody = _.assign(certDef, request.content);
    reqBody.frequency = 'Event-based';

    CERT_VALS.runAllPolicies(reqBody, _policyViolations);
    
    return {
      result: openidm.update(CERT_REPO_PATH + certId, null, reqBody)
    }
  }
  else if (
    utils.methodIs('READ') &&
    utils.queryParamsAre(['all']) &&
    utils.urlParamsCount(request.resourcePath, 1)
  ) {
    /*
     * GET ALL TRIGGERED CERT DEFINITIONS
     */
    CERT_REPO_PATH = setCertificationPaths(request.resourcePath);

    var res = openidm.query(
      CERT_REPO_PATH,
      { _queryFilter: 'true' }
    );

    var response = res.result.map(function(cert) {
      cert.numStages = cert.stages.length;
      return _.pick(cert, ['name', 'type', '_id']);
    });

    return {
      result: response
    };
  }
  else if (
    utils.methodIs('READ') &&
    queryParams.pageNumber && queryParams.pageSize && queryParams.sortBy &&
    utils.urlParamsCount(request.resourcePath, 1)
  ) {
    CERT_REPO_PATH = setCertificationPaths(request.resourcePath);
    
    // 'pageNumber', 'pageSize', 'sortBy'
    var pageNumber = parseInt(queryParams.pageNumber - 1);
    var pageSize = parseInt(queryParams.pageSize);
    var sortBy = queryParams.sortBy;
    var filter = queryParams.q ? 'name co "' + queryParams.q + '"' : 'true';
    var res = openidm.query(
      CERT_REPO_PATH,
      { 
        _queryFilter: filter, 
        _pageSize: pageSize,
        _pagedResultsOffset: pageNumber,
        _sortKeys: sortBy
      }
    );

    var response = res.result.map(function(cert) {
      cert.numStages = cert.stages.length;
      return cert;
    });

    return {
      result: response
    };
  }
  else if (
    utils.methodIs('ACTION') &&
    utils.actionIs('delete', request.action) &&
    utils.urlParamsCount(request.resourcePath, 1)
  ) {
    CERT_REPO_PATH = setCertificationPaths(request.resourcePath);
    /*
     * DELETE ONE OR MORE TRIGGERED CERT DEFINITIONS
     */

    // NOTE: verify request body contains Ids { ids: [ 'sdf234234', '23sfsf' ] }
    var reqBody = request.content;

    if (!__.__isArray(reqBody.ids)) {
      __.requestError('You must provide an array of ids.', 400);
    }

    var certIds = reqBody.ids;
    var idsNotProcessed = [];

    //
    // NOTE: process all campaign Ids for deletion
    //
    certIds.forEach(function(CAMPAIGN_ID) {
      var campaignObject = openidm.read(CERT_REPO_PATH + CAMPAIGN_ID);

      if (_.isEmpty(campaignObject)) {
        idsNotProcessed.push(CAMPAIGN_ID);
        return;
      }
      openidm.delete(CERT_REPO_PATH + CAMPAIGN_ID, campaignObject._rev);

      var timeStamp = moment().format();
      var auditEntry = {
        timestamp: timeStamp,
        eventName: 'triggered-certification-delete',
        userId: LOGGED_IN_USERNAME,
        runAs: LOGGED_IN_USERNAME,
        objectId: campaignObject._id,
        operation: 'DELETE',
        before: campaignObject,
        after: null,
        changedFields: [],
        revision: 0,
        passwordChanged: false,
        message: 'Certification has been deleted. Full id: ' + campaignObject._id,
        status: 'SUCCESS'
      };

      utils.createNewAuditEvent(openidm, context, auditEntry);
    });

    return {
      result: 'Triggered certifications deleted.',
      notProcessed: idsNotProcessed
    };

  }//end:else-if

  __.requestError('Request not supported.', 400);

}//end:run()

/* ~~~~~~~~~~~~~~~~~~~~
 * HELPER FUNCTIONS
 * ~~~~~~~~~~~~~~~~~ */

function setCertificationPaths(certification_type) {
  var repoPath = null
  if (certification_type === 'user') {
    repoPath = CONSTANT.REPO_PATH.TRIGGERED_USER_CERT
  }
  else if (certification_type === 'object') {
    repoPath = CONSTANT.REPO_PATH.TRIGGERED_OBJECT_CERT;
  }
  if (!repoPath) {
    __.requestError('Not a valid triggered certification type.', 400);
  }
  return repoPath;
}