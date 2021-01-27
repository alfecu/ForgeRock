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
var displayUtils = require('idg/utils/displayUtils.js');
var c = require('idg/utils/campaign.js');
var validate = require('idg/utils/validations.js');

var queryParams = null;
var CERTIFICATION_TYPE = 'user'; // default to user
var CERT_REPO_PATH = null;
var EVENT_REPO_PATH = null;

run();
function run() {
  queryParams = request.additionalParameters;
  var LOGGED_IN_USER_ID = idmUtils.getUserIdFromCookie(context);

  /*
   * GET /governance/certificationEventDetails/type/<campaign id>/<stage index>/<event index>
   */
  if (
    utils.methodIs('READ') &&
    utils.urlParamsCount(request.resourcePath, 4)
  ) {

    // NOTE: get campaign id, stage index, and event index from request
    var url = request.resourcePath;
    var urlSegments = url.split('/');
    CERTIFICATION_TYPE = urlSegments[0];
    var CAMPAIGN_ID = urlSegments[1];
    var STAGE_INDEX = Number(urlSegments[2]);
    var EVENT_INDEX = Number(urlSegments[3]);
    CERT_REPO_PATH = CERTIFICATION_TYPE === 'user' ? CONSTANT.REPO_PATH.USER_CERT : CONSTANT.REPO_PATH.OBJECT_CERT;
    EVENT_REPO_PATH = CERTIFICATION_TYPE === 'user' ? CONSTANT.REPO_PATH.USER_EVENT : CONSTANT.REPO_PATH.OBJECT_EVENT;

    // NOTE: get repo object with certId provided
    var campaignObject = openidm.read(CERT_REPO_PATH + CAMPAIGN_ID);

    // NOTE: check if stage index exists in campaignObject
    if (!__.indexExists(campaignObject.stages, STAGE_INDEX)) {
      __.requestError('Stage index does not exist in campaign.', 400);
    }

    // NOTE: check if event index exists in stage
    var EVENT = c.getEvent(CAMPAIGN_ID, STAGE_INDEX, EVENT_INDEX, CERTIFICATION_TYPE);
    var idMap = {};

    var eventInProgress = EVENT.status.equalsIgnoreCase('in-progress');
    var eventReviewed = EVENT.status.equalsIgnoreCase('reviewed');

    // NOTE: check event certifierType, if it's role check if current user has the role
    // if user doesn't; throw error.
    // if it's 'user' or 'manager' check if certifierId matches current user Id
    // if user doesn't throw error.
    var CERTIFIER_TYPE = EVENT.certifierType;
    var CERTIFIER_ID = EVENT.certifierId;
    validate.certifierId(CERTIFIER_ID, CERTIFIER_TYPE, LOGGED_IN_USER_ID);
    var ACTING_ID = CERTIFIER_ID || queryParams.actingId;
    // note: If CERTIFIER_ID is not a long id, then it must be a user id, and hence must be converted to a proper acting id.
    ACTING_ID = (CERTIFIER_ID && !idmUtils.isLongOwnerId(CERTIFIER_ID)) ? idmUtils.ensureUserIdLong(ACTING_ID) : ACTING_ID;
    validate.actingId(ACTING_ID, LOGGED_IN_USER_ID);
    if (eventInProgress || eventReviewed) {
      if (EVENT.certifierType === CONSTANT.CERTIFIER_TYPE.AUTH_ROLE || EVENT.certifierType === CONSTANT.CERTIFIER_TYPE.GROUP) {
        if (!EVENT.claimedBy || EVENT.claimedBy === null || EVENT.claimedBy === '') {
          EVENT.actions = CONSTANT.GROUP_EVENT_ACTIONS;
        }
        else if (EVENT.claimedBy !== idmUtils.ensureUserIdShort(LOGGED_IN_USER_ID)) {
          EVENT.actions = [ 'comment '];
        }
        else {
          EVENT.actions = CONSTANT.USER_EVENT_ACTIONS;
        }
      }
      else if (EVENT.certifierType === CONSTANT.CERTIFIER_TYPE.ENTITLEMENT_OWNER) {
        if (c.isClaimActionAvailableForEvent(EVENT, ACTING_ID, LOGGED_IN_USER_ID)) {
          EVENT.actions = [ 'claim', 'comment' ];
        }
        else if (c.isCertifyRevokeAbstainActionAvailableForEvent(EVENT, ACTING_ID, LOGGED_IN_USER_ID)) {
          EVENT.actions = CONSTANT.USER_EVENT_ACTIONS;
        }
      }
      else {
        EVENT.actions = CONSTANT.USER_EVENT_ACTIONS;
      }
    }
    
    EVENT = displayUtils.addDisplayNamesToEvent(EVENT, null, idMap, CERTIFICATION_TYPE);

    // NOTE: get same event index for other stages and build "stages" array
    // including the target EVENT 
    var _events = [];
    campaignObject.stages.forEach(function(stg) {
      if (stg.stageIndex === STAGE_INDEX) {
        EVENT.stageName = stg.name;
        utils.addDataToEntitlements(EVENT);
        _events.push(EVENT);
        return;
      }

      var _event = c.getEvent(CAMPAIGN_ID, stg.stageIndex, EVENT_INDEX, CERTIFICATION_TYPE);
      _event.stageName = stg.name;
      _event = displayUtils.addDisplayNamesToEvent(_event, null, idMap, CERTIFICATION_TYPE);
      _events.push(_event);
    });

    // remove entitlements that our user is not the certifier for
    // NOTE(ML): this is BEFORE processEvents because we want the completed counts to target YOUR entitlements only, not ALL entitlements in the event
    _events.forEach(function(event) {
      // Add parent property and attribute index to each nested entitlement
      utils.addDataToEntitlements(event);
      if (event['certifierType'].equalsIgnoreCase('entitlementOwner') && event.stageIndex === STAGE_INDEX) {
        var eventData = event.eventData;
        var detail_groups = eventData.managedObject.concat(eventData.application);
        // only keep the entitlements that belong to the id you are viewing the cert as, and non-certifiable details
        detail_groups.forEach(function(detail_group) {
          var details = c.getDetailsInDetailGroupNotCertifiableOrForCertifierId(detail_group, ACTING_ID);
          c.setDetailsInDetailGroup(detail_group, details);
        });
        // only keep detail groups that have details in them
        eventData.managedObject = eventData.managedObject.filter(c.isDetailGroupHasDetails);
        eventData.application = eventData.application.filter(c.isDetailGroupHasDetails);
      }
    });

    // Get the visible entitlements in the active stage
    var active_managed_attributes = [];
    var active_managed_objects = [];
    var active_applications = [];
    var can_view_metadata = false;
    _events[STAGE_INDEX].eventData.managedObject.forEach(function(mo) {
      if (mo.values.length === 0) {
        active_managed_attributes.push(mo.attributeName);
      } else {
        mo.values.forEach(function(val) {
          active_managed_objects.push(val.fieldValue || val.attributeValue);
        });
      }
    });
    _events[STAGE_INDEX].eventData.application.forEach(function(app) {
      active_applications.push(app.connector);
    });
    if (_events[STAGE_INDEX].eventData.metadata && _events[STAGE_INDEX].eventData.metadata.length > 0) {
      can_view_metadata = true;
    }
    
    // Filter other stages based on what is in active stage
    _events.forEach(function(event) {
      if (event.stageIndex !== STAGE_INDEX) {
        var managed_objects = event.eventData.managedObject;
        managed_objects.forEach(function(mo) {
          if (mo.values.length !== 0) {
            mo.values = mo.values.filter(function (val) {
              var filterValue = val.fieldValue || val.attributeValue
              return _.includes(active_managed_objects, filterValue);
            });
          }
        });
        managed_objects = managed_objects.filter(function(mo) {
          return ((mo.attributeName && _.includes(active_managed_attributes, mo.attributeName)) ||
                   mo.values.length !== 0)
        });

        var applications = event.eventData.application;
        applications = applications.filter(function(app) {
          return _.includes(active_applications, app.connector); 
        });
        event.eventData.managedObject = managed_objects;
        event.eventData.application = applications;
        // If current stage does not have certifiable metadata, hide it in other stages
        if (!can_view_metadata) {
          event.eventData.metadata = [];
        }
      }
    });

    // NOTE: add metadata to eventData
    processEvents(_events, STAGE_INDEX);

    /*
     * NOTE: add target user info (firstName, lastName, email)
     */
    var targetInfo = {};
    if (CERTIFICATION_TYPE === 'user') {
      targetInfo = {
        userName: EVENT.userName,
        firstName: EVENT.firstName,
        lastName: EVENT.lastName,
        email: EVENT.email
      }
    }
    else {
      targetInfo = {
        name: EVENT.name,
        description: EVENT.description,
      }
    };

    return {
      actingId: ACTING_ID,
      campaignInfo: _.omit(campaignObject, 'stages'),
      currentStage: STAGE_INDEX,
      targetInfo: targetInfo,
      // warning: these are NOT STAGES, these are EVENTS!  The key should be renamed 'events', but we would need to fix it in other places too.  Leave for now.
      stages: _events,
    };
  }//end:GET

  /*
   * Request not supported. Respond with bad request
   */
  __.requestError('Request not supported.', 400);

}//end:run

/*
 * Function processEvents
 */
function processEvents(events, STAGE_INDEX) {
  var glossary = {};

  events.forEach(function(_event, index) {
    var totals = {
      _complete: 0,
      _incomplete: 0,
      _certified: 0,
      _revoked: 0,
      _abstained: 0,
    }
    var isActiveStage = STAGE_INDEX === index;
    var eventInProgress = _event.status.equalsIgnoreCase('in-progress');
    var eventReviewed = _event.status.equalsIgnoreCase('reviewed');
    var addActions = isActiveStage && (eventInProgress || eventReviewed);

    _event.eventData.managedObject.forEach(function(mo) {
      if (!mo.values.length) {
        processEntitlement(mo, totals, addActions);     
      }
      mo.values.forEach(function(val) {
        processEntitlement(val, totals, addActions);
      });
    });

    _event.eventData.application.forEach(function(app) {
      processEntitlement(app, totals, addActions);

      app.attributes.forEach(function(attr) {
        processEntitlement(attr, totals, addActions);
      });
    });

    if (_event.eventData.metadata) {
      _event.eventData.metadata.forEach(function(mo) {
        processEntitlement(mo, totals, addActions)       
      });
    }

    // NOTE: set event complete and incomplete properties
    _event.complete = totals._complete;
    _event.incomplete = totals._incomplete;
    _event.total = totals._complete + totals._incomplete;
    _event.totalCertified = totals._certified;
    _event.totalRevoked = totals._revoked;
    _event.totalAbstained = totals._abstained;

    //utils.addMetadataToEvent(_event, glossary);

  });//end:events.forEach
}//end:processEvents

function processEntitlement(entitlement, totals, addActions) {
  var outcomeIsEmpty = false;

  if (entitlement.certifiable === 1) {
    if (_.isEmpty(entitlement.outcome)) {
      // NOTE: count incomplete
      totals._incomplete += 1;
      outcomeIsEmpty = true;
    } else {
      // NOTE: count complete
      totals._complete += 1;
      switch (entitlement.outcome) {
      case 'certify':
        totals._certified += 1;
        break;
      case 'revoke':
        totals._revoked += 1;
        break;
      case 'abstain':
        totals._abstained += 1;
        break;
      }
    }
  }

  // NOTE: add managedObject value actions
  if (addActions && entitlement.certifiable) {
    if (outcomeIsEmpty) {
      entitlement.actions =
        CONSTANT.EVENT_DETAIL_ATTR_ACTIONS
        .filter(function(action) {
          return action !== 'reset';
        });
    } else {
      entitlement.actions = CONSTANT.EVENT_DETAIL_ATTR_ACTIONS;
    }
  } 
}