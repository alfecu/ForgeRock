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
var CONSTANT = require('idg/utils/globalConstants.js');
var utils = require('idg/utils/generalUtilities.js');
var qf = require('idg/utils/queryFilter.js');
var c = require('idg/utils/campaign.js');

// CONSTANTS
var SYSTEM = 'system';
var EXPIRED = 'expired';
var EXPIRE = 'expire';
var IN_PROGRESS = 'in-progress';

var outcome = 'nothing to process';
var CERTIFICATION_TYPE = certType;
var NOTIFICATION_PATH = null;
var CERT_REPO_PATH = null
var EVENT_REPO_PATH = null;
var CAMPAIGN_ID = null;
var CAMPAIGN_NAME = null;

/*
  NOTE: find stage where deadline is past due and it hasn't been "expired"
  already (should be 1 stage only). If criteria is not met for any stage, exit.
*/
var STAGE = null;
var STAGE_INDEX = -1;
var today = new Date();

run();
function run() {

  setCertificationPaths(CERTIFICATION_TYPE);

  var params = {
		_queryFilter: qf.getObjectsToExpire(moment().format(), 'certification')
	}
	var certsToExpire = openidm.query(CERT_REPO_PATH, params).result
	_.forEach(certsToExpire, function(certToExpire) {
    
    var campaignObject = __.cloneDeep(certToExpire);
    CAMPAIGN_ID = campaignObject._id;
    CAMPAIGN_NAME = campaignObject.name;

    for (var i in campaignObject.stages) {
      var tmp = campaignObject.stages[i];
      var deadlineExpired = tmp.deadline < moment().format();
      var stageExpireDone = tmp.expired;

      if (deadlineExpired) {
        if (stageExpireDone) {
          continue;
        }
        STAGE = tmp;
        STAGE_INDEX = i;
        break;
      }
    }

    STAGE_INDEX = Number(STAGE_INDEX);

    // NOTE: Only process if STAGE was found
    if (!_.isEmpty(STAGE) && STAGE_INDEX !== -1) {

      // NOTE: determine if it's last stage
      var isLastStage = false;
      var numberOfStages = campaignObject.stages.length;

      if (numberOfStages === (STAGE_INDEX + 1)) {
        isLastStage = true;
      }

      // NOTE: expire all events not-signed-off only
      // get index of events to expire (status not signed off)
      // in case it's needed for campaign wide expiration.
      var EVENTS_INDEXES = [];
      var _eventIndexes = [];

      // NOTE: get all events for CAMPAIGN_ID and STAGE_INDEX
      var EVENTS = c.getEventsInStage(CAMPAIGN_ID, STAGE_INDEX, CERTIFICATION_TYPE);

      // todo: change other stuff to use EXPIRING_EVENTS, then eliminate use of EVENTS_INDEXES
      var EXPIRING_EVENTS = c.getEventsInStageNotFinal(CAMPAIGN_ID, STAGE_INDEX, CERTIFICATION_TYPE);

      EVENTS.forEach(function(_event, index) {
        if (!c.isFinal(_event)) {
          _expireEvent(_event);
          utils.updateEventRepo(EVENT_REPO_PATH, _event);
          EVENTS_INDEXES.push(index);
          _eventIndexes.push(_event.eventIndex);
        }
      });

      // NOTE: for expired stage:
      // Get onExpire setting:
      // onExpire: stageOnly, entireCert
      var onExpire = campaignObject.onExpire;

      if (onExpire === 'stageOnly') {
        // NOTE: activate next stage for users
        if (!isLastStage) {
          var _nextStg = STAGE_INDEX + 1;
          _activateStage(campaignObject.stages[_nextStg], _nextStg);
        } else {
          campaignObject.status = EXPIRED;
        }
      }
      else if (onExpire === 'entireCert') {
        // NOTE: entireCert: expire all events not-signed-off on all stages
        // for all pending stages
        if (!isLastStage) {
          _expireEventsForPendingStages(
            campaignObject.stages,
            numberOfStages,
            STAGE_INDEX,
            _eventIndexes
          );
        }
        campaignObject.status = EXPIRED;
      }

      // NOTE: send email to all unique certifers for expired events ONLY
      // (certifiers for the stage that triggered the script only regardless
      // of onExpire flag setting.
      _sendNotifications(EXPIRING_EVENTS, CAMPAIGN_NAME, STAGE.name);

      // NOTE: set "expired" flag on stage. indicating that the
      // stage was processed for expiration.
      STAGE.expired = true;

      // NOTE: check if all subsequent stages are done, if so, initiate
      // remediation workflow.
      var nextStagesHaveNoCertifier = utils.nextStagesHaveNoCertifier(
        _.range((STAGE_INDEX + 1), numberOfStages),
        campaignObject,
        EVENT_REPO_PATH
      );

      // NOTE: if last stage. trigger remediation workflow
      if (isLastStage || nextStagesHaveNoCertifier) {
        var remProc = campaignObject.remediationProcess;
        if (!_.isEmpty(remProc) && !remProc.equalsIgnoreCase('None')) {
          EXPIRING_EVENTS.forEach(function(_event) {
            var workflowData = utils.buildWorkflowPayload(campaignObject, _event.eventIndex, _event, STAGE_INDEX, EVENT_REPO_PATH);
            var tempWorkflow = openidm.create('workflow/processinstance', null, workflowData);

            // NOTE: add comment to the event
            var comment = 'Remediation process id: ' + tempWorkflow._id;
            _event.comments.push({
              action: 'workflow',
              timeStamp: moment().format(),
              userId: 'SYSTEM',
              comment: comment 
            });

            // NOTE: update event repo object
            utils.updateEventRepo(EVENT_REPO_PATH, _event);
          });
        }

        // NOTE: Campaign cannot longer be cancelled by an Admin after 
        // workflow could have been initiated.
        campaignObject.cancellable = false;

        // NOTE: if ALL events in the campaign have a final status,
        // then sign-off campaign (update repo).
        if (c.canSignOffCampaign(CAMPAIGN_ID, CERTIFICATION_TYPE)) {
          campaignObject.status = 'signed-off';
          campaignObject.completionDate = moment().format();
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
        operation: 'EXPIRATION',
        before: certToExpire,
        after: updatedCampaign,
        changedFields: [],
        revision: updatedCampaign._rev,
        passwordChanged: false,
        message: 'Certification number: ' + CAMPAIGN_ID + ' has expired. Stage that triggered expiration: ' + STAGE_INDEX,
        status: 'SUCCESS'
      };
      utils.createAuditEvent(openidm, auditEntry);

      outcome = 'processed.';
    }//end:if

    logger.warn('expirationCert.js :: cert processed: ' + outcome);
  });
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * HELPER FUNCTIONS
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/*
 * Function _expireEventsForCampaign
 */
function _expireEventsForPendingStages(
  stages,
  numberOfStages,
  STAGE_INDEX,
  eventIndexes
) {
  _.range(STAGE_INDEX + 1, numberOfStages)
  .forEach(function(stageIndex) {
    stages[stageIndex].expired = true
    var stageEvents = c.getEventsInStage(CAMPAIGN_ID, stageIndex, CERTIFICATION_TYPE)
    stageEvents.forEach(function(_event) {
      if (!c.eventStatusIsFinal(_event)) {
        var eventIndex = _event.eventIndex
        //var evt = campaignObject.stages[stageIndex].events[eventIndex];
        query = 'campaignId eq "' + CAMPAIGN_ID + '" and stageIndex eq "' + stageIndex + '" and eventIndex eq "' + eventIndex + '"';
        params = { _queryFilter: query };
        queryResult = openidm.query(EVENT_REPO_PATH, params).result;

        if (!queryResult.length) {
          __.requestError('expirationCert.js :: _expireEventsForPendingStages: Event index: ' + idx + ' not found.', 404);
        }
        if (queryResult.length > 1) {
          __.requestError('expirationCert.js :: _expireEventsForPendingStages: More than 1 event found with eventIndex: ' + idx + '.', 400);
        }
        evt = queryResult[0];

        if (!c.eventStatusIsFinal(evt)) {
          _expireEvent(evt);
          utils.updateEventRepo(EVENT_REPO_PATH, evt);
        }
      }

    });
    stages[stageIndex].expired = true
  });
}


/*
 * Function _activateNextStage
 */
function _activateStage(stage, stageIndex) {
  var stageEvents = c.getEventsInStage(CAMPAIGN_ID, stageIndex, CERTIFICATION_TYPE)
  stageEvents.forEach(function(_event) {
    if (!c.eventStatusIsFinal(_event)) {
      var idx = _event.eventIndex;
      _query = 'campaignId eq "' + CAMPAIGN_ID + '" and stageIndex eq "' + stage.stageIndex + '" and eventIndex eq "' + idx + '"';
      _params = { _queryFilter: _query };
      queryResult = openidm.query(EVENT_REPO_PATH, _params).result;

      if (!queryResult.length) {
        __.requestError('expirationCert :: _activateStage: Event index: ' + idx + ' not found.', 404);
      }
      if (queryResult.length > 1) {
        __.requestError('expirationCert :: _activateStage: More than 1 event found with eventIndex: ' + idx + '.', 400);
      }
      evt = queryResult[0];

      if (evt && evt.status.equalsIgnoreCase('pending')) {
        evt.status = IN_PROGRESS;

        // Update event repo object
        utils.updateEventRepo(EVENT_REPO_PATH, evt);
      }
    }
  });
}


/*
 * Function _expireEventsForStage
 */
function _expireEvent(EVENT) {
  EVENT.status = EXPIRED;
  EVENT.outcome = EXPIRE;
  EVENT.completionDate = moment().format();

  EVENT.eventData.identity.forEach(function(idObj) {
    idObj.outcome = EXPIRE;
  });

  EVENT.eventData.managedObject.forEach(function(mo) {
    mo.outcome = EXPIRE;
    mo.values.forEach(function(val) {
      val.outcome = EXPIRE;
    });
  });

  EVENT.eventData.application.forEach(function(app) {
    app.outcome = EXPIRE;
    app.attributes.forEach(function(attr) {
      attr.outcome = EXPIRE;
    });
  });

  EVENT.eventData.metadata.forEach(function(mo) {
    mo.outcome = EXPIRE;
    mo.values.forEach(function(val) {
      val.outcome = EXPIRE;
    });
  });
}


/*
 * Function _sendNotifications
 */
function _sendNotifications(expiring_events, campaign_name, stage_name) {
  // Given the events whose certifiers need notifications, send one notification to each user
  var user_ids = c.getCertifierUserIdsOfEventsSingleOrOpen(expiring_events);
  // send a notification to each user
  var cert_name = campaign_name + " " + stage_name;
  _sendNotificationToUsers(user_ids, cert_name);
}

function _sendNotificationToUsers(user_ids, cert_name) {
  var params = {
    certificationName: cert_name,
  };
  utils.sendNotificationToUsers(user_ids, NOTIFICATION_PATH, params);
}

function setCertificationPaths(certification_type) {
  if (certification_type === 'user') {
    NOTIFICATION_PATH = 'governance/sendNotification/CERTIFICATION_EXPIRED';
    EVENT_REPO_PATH = CONSTANT.REPO_PATH.USER_EVENT;
    CERT_REPO_PATH = CONSTANT.REPO_PATH.USER_CERT;
  }
  else {
    NOTIFICATION_PATH = 'governance/sendNotification/OBJECT_CERTIFICATION_EXPIRED';
    EVENT_REPO_PATH = CONSTANT.REPO_PATH.OBJECT_EVENT;
    CERT_REPO_PATH = CONSTANT.REPO_PATH.OBJECT_CERT;
  }
}