/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
var _ = require('commons/lib/lodash4.js');
var __ = require('commons/utils/jsUtils.js');
var moment = require('commons/lib/moment.js');
var idmUtils = require('commons/utils/idmUtils.js');
var CONSTANT = require('idg/utils/globalConstants.js');
var utils = require('idg/utils/generalUtilities.js');
var moment = require('commons/lib/moment.js')
var qf = require('idg/utils/queryFilter.js');
var c = require('idg/utils/campaign.js');

// CONSTANTS
var outcome = 'nothing to process';
var CERTIFICATION_TYPE = certType;
var NOTIFICATION_PATH = null;
var CERT_REPO_PATH = null
var EVENT_REPO_PATH = null;

/*
  NOTE: find stage where deadline is past due and it hasn't been "expired"
  already (should be 1 stage only). If criteria is not met for any stage, exit.
*/
var STAGE = null;
var STAGE_INDEX = -1;
var today = moment().format();

run();
function run() {

  setCertificationPaths(CERTIFICATION_TYPE);

  var params = {
    _queryFilter: qf.getObjectsToEscalate(moment().format(), 'certification')
  }
  var certsToEscalate = openidm.query(CERT_REPO_PATH, params).result
  _.forEach(certsToEscalate, function(certToEscalate) {

    var campaignObject = __.cloneDeep(certToEscalate);
    var CAMPAIGN_NAME = campaignObject.name;
    var CAMPAIGN_ID = campaignObject._id;
    
    for (var i in campaignObject.stages) {
      var stg = campaignObject.stages[i];
      
      if (stg.completionDate) {
        continue;
      }

      var escalationExpired = moment(stg.escalationDate).format() <= today;
      var wasEscalated = stg.escalated && (!stg.escalationSchedule || (stg.escalationSchedule && _.isEmpty(stg.escalationSchedule)));

      if (escalationExpired) {
        // If escalation is complete for this certification
        if (wasEscalated) {
          continue;
        }
        STAGE = stg;
        STAGE_INDEX = i;
        break;
      }
    }

    // NOTE: Only process if STAGE was found
    if (!_.isEmpty(STAGE) && STAGE_INDEX !== -1) {

      // NOTE: send email to all unique certifers for expired events ONLY
      // (certifiers for the stage that triggered the script only regardless
      // of onExpire flag setting.
      _sendNotifications(CAMPAIGN_ID, STAGE_INDEX, CAMPAIGN_NAME, STAGE);

      if (!STAGE.escalationSchedule || (STAGE.escalationSchedule && _.isEmpty(STAGE.escalationSchedule))) {
        STAGE.escalated = true;
      }

      // If schedule exists and is not depleted
      if (STAGE.escalationSchedule && STAGE.escalationSchedule.length > 0) {
        var nextEscalation = STAGE.escalationSchedule.shift();
        var nextIntervalType = nextEscalation.intervalType || 'days';
        STAGE.escalationDate = moment(STAGE.deadline).subtract(nextEscalation.interval, nextIntervalType).format();
        STAGE.escalationType = nextEscalation.escalationType;
        if (STAGE.escalationType === CONSTANT.ESCALATION_TYPE.MANAGER) {
          STAGE.escalationName = null;
          STAGE.escalationId = null;
        }
        else if (STAGE.escalationType === CONSTANT.ESCALATION_TYPE.AUTH_ROLE || STAGE.escalationType === CONSTANT.ESCALATION_TYPE.GROUP) {
          STAGE.escalationName = nextEscalation.escalationId;
          STAGE.escalationId = nextEscalation.escalationId;
        }
        else if (STAGE.escalationType === CONSTANT.ESCALATION_TYPE.USER) {
          STAGE.escalationName = idmUtils.getUserName(nextEscalation.escalationId);
          STAGE.escalationId = idmUtils.ensureUserIdShort(nextEscalation.escalationId);
        }
        
      }

      campaignObject = c.updateCampaignInformation(campaignObject, CERTIFICATION_TYPE);

      // NOTE: update repo object for campaign
      var updatedCampaign = openidm.update(CERT_REPO_PATH + CAMPAIGN_ID, null, campaignObject);

      /*
      * CREATE AUDIT ENTRY
      */
      var timeStamp = moment().format();
      var auditEntry = {
        timestamp: timeStamp,
        eventName: 'certification-audit',
        transactionId: timeStamp,
        userId: 'system',
        runAs: 'system',
        objectId: CERT_REPO_PATH + CAMPAIGN_ID,
        operation: 'ESCALATION',
        before: certToEscalate,
        after: updatedCampaign,
        changedFields: [],
        revision: updatedCampaign._rev,
        passwordChanged: false,
        message: 'Certification number: ' + CAMPAIGN_ID + ' has escalated. Stage that triggered escalation: ' + STAGE_INDEX,
        status: 'SUCCESS'
      };

      utils.createAuditEvent(openidm, auditEntry);

      outcome = 'processed.';
    }//end:if

    logger.warn('Certification escalation script done: ' + outcome);
  });
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * HELPER FUNCTIONS
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/*
 * Function _sendNotifications
 */
function _sendNotifications(campaign_id, stage_index, campaign_name, stage) {
  var stage_name = stage.name;
  // make an escalator -> certifiers dictionary
  var dict = getEscalatorIdToCertifierIdsDictOfStage(campaign_id, stage_index, stage);
  // send notification to each escalator
  _.forOwn(dict, function(certifier_user_ids, escalator_user_id) {
    _sendNotificationToEscalator(escalator_user_id, certifier_user_ids, campaign_name, stage_name);
  });
}

function _makeHtmlString(user_ids) {
  var user_short_ids = _.map(user_ids, utils.ensureUserIdShort);
  var query_filter = qf.isIdIn(user_short_ids);
  var users = idmUtils.queryManagedUsers(query_filter, ['userName', 'givenName', 'sn'], 'QUERY');
  var user_strings = _.map(users, function(u) {
    return __.capitalize(u.givenName) + ' ' + __.capitalize(u.sn) + ' ' + '(' + u.userName + ')'
  });
  var string = user_strings.join(',<br>');
  return string
}

function _sendNotificationToEscalator(escalator_id, user_ids, campaign_name, stage_name) {
  var params = {
    certificationName: campaign_name,
    stageName: stage_name,
    data: _makeHtmlString(user_ids),
  };
  utils.sendNotificationToUser(escalator_id, NOTIFICATION_PATH, params);
}

function getEscalatorIdToCertifierIdsDictOfStage(campaign_id, stage_index, stage) {
  // Make a dictionary where each key is an escalator *user* id and the corresonding value is an array of certifier *user* ids.
  var dict = {};
  var escalation_type = stage.escalationType;
  var escalator_ids = [];

  if (!escalation_type) {
    // no escalation was specified for the stage in the first place
    return dict;
  }
  else if (escalation_type === CONSTANT.ESCALATION_TYPE.USER) {
    // the escalator was listed on creation
    var escalator_id = idmUtils.ensureUserIdLong(stage['escalationId']);
    escalator_ids.push(escalator_id);
  }
  else if (escalation_type === CONSTANT.ESCALATION_TYPE.AUTH_ROLE || STAGE.escalationType === CONSTANT.ESCALATION_TYPE.GROUP) {
    // the escalator is a role listed on creation
    if (idmUtils.isLongRoleId(stage['escalationId'])) {
      escalator_ids = idmUtils.getUserIdsFromRoleId(stage['escalationId']);
    }
  }

  // Get escalators for every active event
  var events = c.getEventsInStage(campaign_id, stage_index);
  var manager_dict = {};
  events.forEach(function(event) {
    var dict_more = {};
    var certifier_user_ids = c.getCertifierUserIdsOfEventCurrentlyAssigned(event);
    if (escalation_type === CONSTANT.ESCALATION_TYPE.MANAGER || escalation_type === 'Manager') {
      certifier_user_ids.forEach(function(certifier_user_id) {
        // if no entry exists in manager dict, get manager
        if (!_.hasIn(manager_dict, certifier_user_id)) {
          manager_dict[certifier_user_id] = idmUtils.getUserManagerId(certifier_user_id);
        }
        // if manager is in dict and is not null
        if (manager_dict[certifier_user_id]) {
          __.pushOntoValueArrayDict(dict_more, manager_dict[certifier_user_id], certifier_user_id);
        }
      });
    }
    else {
      escalator_ids.forEach(function(escalator_user_id) {
        __.pushAllOntoValueArrayDict(dict_more, escalator_user_id, certifier_user_ids);
      });
    }
    dict = __.mergeValueArrayDicts(dict, dict_more);
  });

  // make each values array unique
  _.forOwn(dict, function(values_array, key) {
    dict[key] = _.uniq(values_array);
  });

  return dict
}

function setCertificationPaths(certification_type) {
  if (certification_type === 'user') {
    NOTIFICATION_PATH = 'governance/sendNotification/CERTIFICATION_ESCALATED';
    EVENT_REPO_PATH = CONSTANT.REPO_PATH.USER_EVENT;
    CERT_REPO_PATH = CONSTANT.REPO_PATH.USER_CERT;
  }
  else {
    NOTIFICATION_PATH = 'governance/sendNotification/OBJECT_CERTIFICATION_ESCALATED';
    EVENT_REPO_PATH = CONSTANT.REPO_PATH.OBJECT_EVENT;
    CERT_REPO_PATH = CONSTANT.REPO_PATH.OBJECT_CERT;
  }
}