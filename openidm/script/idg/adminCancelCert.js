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
var idmUtils = require('commons/utils/idmUtils.js');
var CONSTANT = require('idg/utils/globalConstants.js');
var utils = require('idg/utils/generalUtilities.js');
var c = require('idg/utils/campaign.js');
var queryParams = null;
var moment = require('commons/lib/moment.js');
var LOGGED_IN_USER_ID = null;
var LOGGED_IN_USERNAME = null;

var CERTIFICATION_TYPE = null;
var CANCEL_EMAIL_TEMPLATE =  'governance/sendNotification/CERTIFICATION_CANCELLED';
var CERTIFICATION_CANCELLATION_FAILURE_TEMPLATE = 'governance/sendNotification/CERTIFICATION_CANCELLATION_FAILURE_TEMPLATE';
var EVENT_REPO_PATH = null;
var CERT_REPO_PATH = null;

var cancelled = 'cancelled';
var signed_off = 'signed-off';
var reviewed = 'reviewed';
var in_progress = 'in-progress';


run();
function run() {
  queryParams = request.additionalParameters;
  LOGGED_IN_USER_ID = idmUtils.getUserIdFromCookie(context);
  LOGGED_IN_USERNAME = utils.getUserNameFromCookie(context);

  if (
    utils.methodIs('CREATE') &&
    _.isEmpty(queryParams) &&
    utils.urlParamsCount(request.resourcePath, 1)
  ) {
    /*
     * CANCEL ONE OR MORE ACTIVE CAMPAIGNS
     */

    CERTIFICATION_TYPE = request.resourcePath;
    setCertificationPaths(CERTIFICATION_TYPE);

    // NOTE: verify request body contains Ids { ids: [ 'sdf234234', '23sfsf' ] }
    var reqBody = request.content;

    if (!__.__isArray(reqBody.ids)) {
      __.requestError('You must provide an array of ids.', 400);
    }

    var certIds = reqBody.ids;
    var idsNotProcessed = [];

    //
    // NOTE: process all campaign Ids for cancellation
    //
    certIds.forEach(function(CAMPAIGN_ID) {
      var campaignObject = openidm.read(CERT_REPO_PATH + CAMPAIGN_ID);
      var originalCampaign = __.cloneDeep(campaignObject);

      // NOTE: If campaign is 'cancelled' or 'signed-off', then it is not active
      // and cannot be modified. return error message.
      if (
        campaignObject.status === cancelled ||
        campaignObject.status === signed_off||
        campaignObject.status === 'complete' ||
        campaignObject.cancellable === false
      ) {
        idsNotProcessed.push(CAMPAIGN_ID);
        return;
      }

      // NOTE: Set “cancelled” status to campaign
      // Update completion date and completed by
      campaignObject.status = cancelled;
      campaignObject.completedBy = 'managed/user/' + LOGGED_IN_USER_ID;
      campaignObject.completionDate = moment().format();

      campaignObject = c.updateCampaignInformation(campaignObject, CERTIFICATION_TYPE);

      // NOTE: 6. Update repo object
      var updatedCampaign = openidm.update(
        CERT_REPO_PATH + CAMPAIGN_ID, campaignObject._rev, campaignObject
      );

      // NOTE: 7. Create audit
      var timeStamp = moment().format();
      var auditEntry = {
        timestamp: timeStamp,
        eventName: 'certification-audit',
        userId: LOGGED_IN_USERNAME,
        runAs: LOGGED_IN_USERNAME,
        objectId: CERT_REPO_PATH + updatedCampaign._id,
        operation: 'CANCELLED',
        before: originalCampaign,
        after: updatedCampaign,
        changedFields: [],
        revision: updatedCampaign._rev,
        passwordChanged: false,
        message: 'Certification has been cancelled. Full id: ' + CERT_REPO_PATH + CAMPAIGN_ID,
        status: 'SUCCESS'
      };

      utils.createNewAuditEvent(openidm, context, auditEntry);

      // NOTE: cancel events in separate thread (because it might take a long time) and 
      // send response to client
      var th_campaignThread = java.lang.Thread(function() {
        try {
          logger.warn('========== adminCancelCert.js: THREAD STARTED FOR CAMPAIGN: ' + CAMPAIGN_ID + ' =====');
          // NOTE: clear out outcomes for event and event details where event wasn't signed-off
          // NOTE: set all events to cancelled
          var eventCertifiers = [];

          campaignObject.stages.forEach(function(stg) {
            var certEvents = c.getEventsInStage(CAMPAIGN_ID, stg.stageIndex, CERTIFICATION_TYPE);
            certEvents.forEach(function(_event) {
              var originalEvent = __.cloneDeep(_event);
              // collect certifier ids for notification
              if (
                _event.status === in_progress ||
                _event.status === reviewed
              ) {
                if (_event.certifierType === 'entitlementOwner') {
                  eventCertifiers = eventCertifiers.concat(c.getOpenCertifierIds(_event));
                }
                else
                  eventCertifiers.push(_getFullCertifierId(_event));
              }

              // Cancel events where status is not final
              if (!c.isFinal(_event)) {
                _event.outcome = null;
                _clearAllDetailsOutcome(_event);

                _event.status = cancelled;
                _event.completedBy = 'managed/user/' + LOGGED_IN_USER_ID;
                _event.completionDate = moment().format();
              }

              var updatedEvent = openidm.update(
                EVENT_REPO_PATH + _event._id, _event._rev, _event
              );
              var eventAuditEntry = {
                timestamp: moment().format(),
                eventName: 'certification-event-audit',
                userId: LOGGED_IN_USERNAME,
                runAs: LOGGED_IN_USERNAME,
                objectId: EVENT_REPO_PATH + updatedEvent._id,
                operation: 'CANCELLED',
                before: originalEvent,
                after: updatedEvent,
                changedFields: [],
                revision: updatedEvent._rev,
                passwordChanged: false,
                message: 'Certification event has been cancelled. Full id: ' + EVENT_REPO_PATH + updatedEvent._id,
                status: 'SUCCESS'
              };
              utils.createNewAuditEvent(openidm, context, eventAuditEntry);
            });//end:events.forEach
          });//end:stages.forEach

          // NOTE: 5. Send email to all unique certifierIds where event status
          // is "reviewed", "signed-off", or "in-progress"
          eventCertifiers = idmUtils.getUserIdsFromCertifierIds(eventCertifiers);

          // notify users
          var params = {
            id: CAMPAIGN_ID,
            certificationName: campaignObject.name,
          };
          utils.sendNotificationToUsers(eventCertifiers, CANCEL_EMAIL_TEMPLATE, params);

          logger.warn('========== adminCancelCert.js: SUCCESS: THREAD ENDED FOR CAMPAIGN: ' + CAMPAIGN_ID + ' =====');
        } catch(e) {
          logger.warn('adminCancelCert.js: ERROR: ' + e.stack);

          // NOTE: get all governance-administrator users
          var response = openidm.query('internal/role/governance-administrator/authzMembers', { '_queryFilter' : 'true' }, [ '_refResourceId' ]);
          var govAdminMembers = response ? response : [];
          var adminIds = _.map(govAdminMembers, '_refResourceId');
          // NOTE: send email to all admins
          var emailParams = {
            toEmailAddress: '',
            campaignName: campaignObject.name
          };
          _.forEach(adminIds, function(userId) {
            emailParams.toEmailAddress = userId;
            utils.sendNotification(CERTIFICATION_CANCELLATION_FAILURE_TEMPLATE, emailParams);
          });
          logger.warn('========== adminCancelCert.js: FAILURE(catch): THREAD ENDED FOR CAMPAIGN: ' + CAMPAIGN_ID + ' =====');
        }//end:catch
      });//end:Thread

      th_campaignThread.start();

    });//end:certIds.forEach

    // NOTE: 8. Return success message
    return {
      result: 'Certifications cancelled.',
      notProcessed: idsNotProcessed
    };

  }//end:POST

  __.requestError('Request not supported.', 400);

}//end:run

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * HELPER FUNCTIONS
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

/*
 * Function _clearAllDetailsOutcome
 */
function _clearAllDetailsOutcome(_event) {
  _event.eventData.managedObject.forEach(function(mo) {
    mo.values.forEach(function(val) {
      val.outcome = null;
    });
  });
  _event.eventData.application.forEach(function(app) {
    app.outcome = null;
    app.attributes.forEach(function(attr) {
      attr.outcome = null;
    });
  });
}

/*
 * Function _getFullCertifierId
 */
function _getFullCertifierId(_event) {
  if (_event.certifierType === 'authzRoles' || _event.certifierType === 'authzGroup') {
    return _event.certifierId;
  }
  else if (
    _event.certifierType.equalsIgnoreCase('user') ||
    _event.certifierType.equalsIgnoreCase('manager') ||
    _event.certifierType.equalsIgnoreCase('prevManager')
  ) {
    return 'managed/user/' + _event.certifierId;
  }
}

function setCertificationPaths(certification_type) {
  if (certification_type === 'user') {
    EVENT_REPO_PATH = CONSTANT.REPO_PATH.USER_EVENT;
    CERT_REPO_PATH = CONSTANT.REPO_PATH.USER_CERT;
  }
  else {
    EVENT_REPO_PATH = CONSTANT.REPO_PATH.OBJECT_EVENT;
    CERT_REPO_PATH = CONSTANT.REPO_PATH.OBJECT_CERT;
  }

}

