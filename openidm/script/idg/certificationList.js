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
var qf = require('idg/utils/queryFilter.js');
var c = require('idg/utils/campaign.js');
var validate = require('idg/utils/validations.js');

var queryParams = null;
var CERTIFICATION_TYPE = 'user'; // default to user
var CERT_REPO_PATH = null;
var EVENT_REPO_PATH = null;

var LOGGED_IN_USER_ID = idmUtils.getUserIdFromCookie(context);

run();
function run() {

  queryParams = request.additionalParameters;

  /*
   * GET /governance/certificationList/<type>/<cert id>?stageIndex=1
   */
  if (
    utils.methodIs('READ') &&
    ((utils.urlParamsCount(request.resourcePath, 1)) || (utils.urlParamsCount(request.resourcePath, 2))) &&
    queryParams.type
  ) {
    // NOTE: get pagination information from request. Set defaults if not provided
    var PAGE_SIZE = Number(queryParams.pageSize);
    var PAGE_NUMBER = Number(queryParams.pageNumber);
    var SORT_BY = queryParams.sortBy || 'email';
    var FILTER = queryParams.q || false;
    var EVENT_TYPE = queryParams.type || CONSTANT.EVENT_TYPE.OPEN;
    var ACTING_ID = queryParams.actingId;
    validate.actingId(ACTING_ID, LOGGED_IN_USER_ID);

    var PAGE_OFFSET = (PAGE_NUMBER - 1) * PAGE_SIZE;

    if (EVENT_TYPE !== CONSTANT.EVENT_TYPE.CLOSED && EVENT_TYPE !== CONSTANT.EVENT_TYPE.OPEN) {
      __.requestError('type ' + EVENT_TYPE + ' not supported.', 400);
    }

    validate.sortByForCerts(SORT_BY);
       
    var url = request.resourcePath;
    var urlSegments = url.split('/');
    if (urlSegments.length > 1) {
      CERTIFICATION_TYPE = urlSegments[0];
      var CAMPAIGN_ID = urlSegments[1];
    }
    else {
      var CAMPAIGN_ID = request.resourcePath;
    }
 
    CERT_REPO_PATH = CERTIFICATION_TYPE === 'user' ? CONSTANT.REPO_PATH.USER_CERT : CONSTANT.REPO_PATH.OBJECT_CERT;
    EVENT_REPO_PATH = CERTIFICATION_TYPE === 'user' ? CONSTANT.REPO_PATH.USER_EVENT : CONSTANT.REPO_PATH.OBJECT_EVENT;
  
    // Need to grab the first event that belongs to the user to know what stage to look at by default
    var infoParams = {
      _sortKeys: 'expirationDate',
      _fields: ['_id', 'expirationDate', 'stageIndex', 'status'],
      _queryFilter: qf.isEventInStageForCertifierId(CAMPAIGN_ID, null, ACTING_ID),
    }

    var allEvents = openidm.query(EVENT_REPO_PATH, infoParams).result;
    firstEventIndex = allEvents && allEvents[0] ? allEvents[0].stageIndex : null;
    // NOTE: get Campaign ID and stage index from request

    var STAGE_INDEX = firstEventIndex;
    var SELECTED = Number(queryParams.selected) || STAGE_INDEX;
    
    // NOTE: fetch full Campaign repo object for ID provided
    var campaignObject = openidm.read(CERT_REPO_PATH + CAMPAIGN_ID);
    var STAGE = campaignObject.stages[STAGE_INDEX];
    var totals = {}

    // Calculate totals
    _.forEach(allEvents, function(singleEvent) {
      var stageName = campaignObject.stages[singleEvent.stageIndex].name;
      if (!totals[stageName]) {
        totals[stageName] = {};
      }
      if (!totals[stageName][singleEvent.status]) {
        totals[stageName][singleEvent.status] = 0;
      }
      totals[stageName][singleEvent.status] += 1;
    });
 
    if (_isStageIndexInCampaign(campaignObject, STAGE_INDEX)) {
       /*
        * NOTE: Filter out events in STAGE_INDEX to the ones that belong to the user.
        * or the ones that belong to user and are unclaimed (for group tasks).
        * i.e.: certifierId in event matches current user Id.
        */
      var CERTIFIER_TYPE = STAGE.certifierType;
 
      _queryCampaignId = '(campaignId eq "' + CAMPAIGN_ID + '" and !(status eq "empty"))';
      _queryEventStatus = EVENT_TYPE === CONSTANT.EVENT_TYPE.OPEN
        ? ' and !(status eq "pending") and !(status eq "terminated") and !(status eq "no-certifier") and !(status eq "signed-off") and !(certifierType eq "entitlementOwner" and closedCertifierIds co "'+ ACTING_ID + '")'
        : ' and ((status eq "signed-off") or (status eq "expired") or (status eq "cancelled"))';

      if (SELECTED != STAGE_INDEX) {
        _queryEventStatus = ''
      }

      var queryCertifier = '';
      if (CERTIFIER_TYPE === CONSTANT.CERTIFIER_TYPE.ENTITLEMENT_OWNER) {
        if (EVENT_TYPE === CONSTANT.EVENT_TYPE.OPEN) {
          queryCertifier = qf.isIdCertifier(ACTING_ID)
        } else {
          queryCertifier = qf.isIdClosedCertifier(ACTING_ID);
          _queryEventStatus = '' // Not necessary here
        }
      } 
      else {
        queryCertifier = qf.isIdCertifier(ACTING_ID);
      }
      _query1 = _queryCampaignId + ' and (stageIndex eq "'+ STAGE_INDEX + '")' + ' and ' + queryCertifier + _queryEventStatus;
 
 
       // Build search filter query
       querySearchFilter = '';
       var field_to_repo_key = {}
       if (CERTIFICATION_TYPE === 'user') {
        field_to_repo_key = utils.getDictOfFieldsToDisplayInUserTable();
       }
       else {
        field_to_repo_key = {
          'name': 'name',
          'description': 'description',
        }
      }
       var fields = _.keys(field_to_repo_key);
       if (FILTER) {
         for (var i = 0; i < fields.length; i++) {
          querySearchFilter += '/' + fields[i] + ' co "' + FILTER + '"'
           if (i < fields.length - 1) {
            querySearchFilter += ' or '
           }
           else {
            querySearchFilter += ')'
           }
         }
         _query1 += ' and (' + querySearchFilter;
       }
 
       // Build params object
       var params = {
         _queryFilter: _query1,
       };
       if (PAGE_SIZE) {
         params._pageSize = PAGE_SIZE;
       }
       if (PAGE_OFFSET) {
         params._pagedResultsOffset = PAGE_OFFSET || 0;
       }
       if (SORT_BY) {
         params._sortKeys = SORT_BY;
       }
       
       // Perform openidm query
       EVENTS_ACTIVE_STAGE = openidm.query(EVENT_REPO_PATH, params).result;
       STAGE.events = EVENTS_ACTIVE_STAGE;
 
       // NOTE (dani):
       // A task is created for a user when there's at least 1 event where the user
       // is the certifier or any of the user's roles matches the certifier Id for the event
       // for any stage in a campaign. When trying to retrieve the task summary via this endpoint,
       // if there are no events found that match the above criteria, it means the user used
       // is not a certifier for any of the events and should not be able to access the campaign
       // (this applies to open and closed tasks).
       if (_.isEmpty(EVENTS_ACTIVE_STAGE) && !FILTER) {
         __.requestError('User is not entitled to access this campaign (no active events found for this user, and no filter).', 403);
       }
 
       //
       // NOTE: add task actions
       //
       var allEventsHaveOutcome = true;
       var allEventsClosed = true;
       STAGE.events.forEach(function(_event) {
        if (
          CERTIFIER_TYPE === CONSTANT.CERTIFIER_TYPE.USER ||
          CERTIFIER_TYPE === CONSTANT.CERTIFIER_TYPE.MANAGER ||
          CERTIFIER_TYPE === CONSTANT.CERTIFIER_TYPE.PREV_MANAGER ||
          CERTIFIER_TYPE === CONSTANT.CERTIFIER_TYPE.ENTITLEMENT_OWNER
         ) {
           if (_.isEmpty(_event.outcome)) {
             allEventsHaveOutcome = false;
           }
         }
         if (!c.eventStatusIsFinal(_event)) {
           allEventsClosed = false;
         }
       });
 
       // here we determine which actions the user is allowed to take
       if (!allEventsClosed && EVENT_TYPE !== CONSTANT.EVENT_TYPE.CLOSED) {
         STAGE.actions = getStageActions(CAMPAIGN_ID, STAGE_INDEX, CERTIFIER_TYPE, ACTING_ID);
       }
       // NOTE: filter out events in other stages for the ones where eventIndex matches
       // eventIndex in the target stage's events
       queryEventIndexes =
           EVENTS_ACTIVE_STAGE
           .map(function(_event) { return 'eventIndex eq "' + _event.eventIndex + '"'; })
           .join(' or ');
 
       campaignObject.stages.forEach(function(stg) {
         if (stg.stageIndex === STAGE_INDEX) {
           return;
         }
         params._queryFilter = _queryCampaignId + ' and (stageIndex eq "' + stg.stageIndex + '")' + (EVENTS_ACTIVE_STAGE.length > 0 ? ' and (' + queryEventIndexes + ')' : ' ') + (FILTER ? ' and (' + querySearchFilter : '');
         stg.events = openidm.query(EVENT_REPO_PATH, params).result;
       });
 
 
       // add an actingId to top level campaign, for easy access
       campaignObject['actingId'] = ACTING_ID;
 
       /*
        * NOTE: add supplemental data for events (e.g. complete, incomplete)
        * and also REMOVE the following data: If an event contains an entitlement that our user is not the certifier for, remove the entitlement.
        */
       campaignObject.stages.forEach(function(stg) {
         stg.events.forEach(function(event) {
           if (event.status.equalsIgnoreCase(CONSTANT.STATUS.EMPTY)) {
             return;
           }
 
           // add an actingId to each event which says who the user is acting on behalf of
           event['actingId'] = ACTING_ID;
 
           // record whether each event should be an active row in the user cert list
           event.isRowInactive = !isRowForEventActive(event);
           event.isViewable = isRowViewable(event);
 
           // set complete / incomplete counts on each event
           var nums = c.getNumCompleteAndIncompleteInEvent(event, CERTIFIER_TYPE, ACTING_ID, LOGGED_IN_USER_ID);          
           event.complete = nums[0];
           event.incomplete = nums[1];
 
         });
       });
 
       /*
        * NOTE: get supplemental data for campaign
        */
       var eventsUserClaimedNotSignedOff = 0;
       var canSignOff = 0;
       var totalEvents = 0;
 
       if (CERTIFIER_TYPE === CONSTANT.CERTIFIER_TYPE.AUTH_ROLE || CERTIFIER_TYPE === CONSTANT.CERTIFIER_TYPE.GROUP) {
         STAGE.events.forEach(function(_event) {
           if (_event.status.equalsIgnoreCase(CONSTANT.STATUS.EMPTY)) {
             return;
           }
           // NOTE: get certifyAll
           if (
             !_event.status.equalsIgnoreCase('terminated') &&
             !_event.status.equalsIgnoreCase('signed-off') &&
             !_event.status.equalsIgnoreCase('reviewed') &&
             !_event.status.equalsIgnoreCase('certified') &&
             !_event.status.equalsIgnoreCase('revoked') &&
             _.isEmpty(_event.outcome) &&
             _event.claimedBy === LOGGED_IN_USER_ID
           ) {
             eventsUserClaimedNotSignedOff += 1;
           }
 
           // NOTE: get signOff
           if (
             !_event.status.equalsIgnoreCase('terminated') &&
             (
               _event.status.equalsIgnoreCase('reviewed') ||
               (_event.outcome && !_event.status.equalsIgnoreCase('signed-off'))
             ) &&
             _event.claimedBy === LOGGED_IN_USER_ID
           ) {
             canSignOff += 1;
           }
 
           // NOTE: get total events that belong to user
           if (_event.claimedBy === LOGGED_IN_USER_ID) {
             totalEvents += 1;
           }
 
         });//end:forEach
 
         campaignObject.certifyAll = eventsUserClaimedNotSignedOff > 0;
         campaignObject.signOff = canSignOff > 0;
       }
       else if (
         CERTIFIER_TYPE === CONSTANT.CERTIFIER_TYPE.USER ||
         CERTIFIER_TYPE === CONSTANT.CERTIFIER_TYPE.MANAGER ||
         CERTIFIER_TYPE === CONSTANT.CERTIFIER_TYPE.PREV_MANAGER ||
         CERTIFIER_TYPE === CONSTANT.CERTIFIER_TYPE.ENTITLEMENT_OWNER 
       ) {
         // NOTE: count total events
         totalEvents = STAGE.events.length;
 
         STAGE.events.forEach(function(_event) {
           if (_event.status.equalsIgnoreCase(CONSTANT.STATUS.EMPTY)) {
             return;
           }
           // NOTE: get signOff
           if (
             !_event.status.equalsIgnoreCase('terminated') &&
             (
               _event.status.equalsIgnoreCase('reviewed') ||
               (_event.outcome && !_event.status.equalsIgnoreCase('signed-off'))
             ) &&
             _event.certifierId === LOGGED_IN_USER_ID
           ) {
             canSignOff += 1;
           }
           if (CERTIFIER_TYPE === CONSTANT.CERTIFIER_TYPE.ENTITLEMENT_OWNER) {
             var eventData = _event.eventData;
             var detail_groups = eventData.managedObject.concat(eventData.application);
             // only keep the entitlements that belong to the id you are viewing the cert as, and non-certifiable details
             detail_groups.forEach(function(detail_group) {
               var details = c.getDetailsInDetailGroupNotCertifiableOrForCertifierId(detail_group, ACTING_ID);
               c.setDetailsInDetailGroup(detail_group, details);
             });
             // only keep detail groups that have details in them
             eventData.managedObject = eventData.managedObject.filter(c.isDetailGroupHasDetails);
             eventData.application = eventData.application.filter(c.isDetailGroupHasDetails);
             if (_event.incomplete === 0) {
               _event.ownerOutcome = c.getInheritedOutcomeOfEvent(_event);
             }
           }
         });//end:forEach
 
         campaignObject.signOff = canSignOff > 0;
       }
 
       // Set "complete", "incomplete", and "totalEvents" properties.
       // This info is specific to the current stage, not the entire campaign.
       var nums = c.getNumCompleteAndIncompleteInStageForCertifierId(CAMPAIGN_ID, STAGE_INDEX, CERTIFIER_TYPE, ACTING_ID, LOGGED_IN_USER_ID, CERTIFICATION_TYPE);
       campaignObject.complete = nums[0];
       campaignObject.incomplete = nums[1];
       campaignObject.eventsComplete = nums[2];
       campaignObject.eventsIncomplete = nums[3];
       campaignObject.totalEvents = totalEvents;

       campaignObject.firstEventStage = STAGE_INDEX;
       campaignObject.totals = totals;
       var id_map = {};
       campaignObject = displayUtils.addDisplayNamesToCampaign(campaignObject, null, id_map, false);

       return {
         result: campaignObject
       };
     }//end:if
 
     __.requestError('Stage index provided does not exist in campaign.', 400);
   }
 
   /*
    * Endpoint does not support request by client. Return bad request.
    */
   __.requestError('Request not supported by endpoint.', 400);
 }


/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * HELPER FUNCTIONS
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

/*
 * Function _isStageIndexInCampaign
 * @returns boolean
 */
function _isStageIndexInCampaign(campaignObject, stageIndex) {
  return !!(campaignObject.stages[stageIndex]);
}

/*
 * Function _numEventsWithOutcome
 * @returns boolean
 */
function _numEventsWithOutcome(eventsArr) {
  return eventsArr.filter(function(evt) {
    return !!evt.outcome;
  }).length;
}

/*
 * Function _numEventsSignedOff
 * @returns int
 */
function _numEventsSignedOff(eventsArr) {
  return eventsArr.filter(function(evt) {
    return evt.status == "signed-off";
  }).length;
}

function getStageActions(campaign_id, stage_index, certifier_type, certifier_id) {
  // get the list of all possible actions the user is allowed to perform on the stage
  var actions = [];
  var ownEvents = getOwnEvents(campaign_id, stage_index, certifier_type, certifier_id);
  var bulkAllowed = utils.getSettingObjById('allowBulkCertify').value;
  if (certifier_type.equalsIgnoreCase('entitlementOwner')) {
    if (c.isClaimActionAvailableForStage(campaign_id, stage_index, certifier_id, LOGGED_IN_USER_ID, CERTIFICATION_TYPE)) {
      actions.push('claim');
    }
    if (c.isResetActionAvailableForStage(campaign_id, stage_index, certifier_id, LOGGED_IN_USER_ID, CERTIFICATION_TYPE)) {
      actions.push('reset');
    }
    if (bulkAllowed &&
      c.isCertifyRemainingActionAvailableForStage(campaign_id, stage_index, certifier_id, LOGGED_IN_USER_ID, CERTIFICATION_TYPE)) {
      actions.push('certify-remaining');
    }
    if (c.isSignOffActionAvailableForStage(campaign_id, stage_index, certifier_id, LOGGED_IN_USER_ID, CERTIFICATION_TYPE)) {
      actions.push('sign-off');
    }
  }
  else {
    if (idmUtils.isLongRoleId(certifier_id)) {
      actions.push('claim');
    }
    if (c.isAnyCertifiablesInEventsHasOutcome(ownEvents)) {
      actions.push('reset');
    }
    var numClaimedEvents = ownEvents.length;
    var numEventsWithOutcome = _numEventsWithOutcome(ownEvents);
    var numEventsSignedOff = _numEventsSignedOff(ownEvents);
    // determine if 'certify remaining' action should be added
    if (bulkAllowed && (numClaimedEvents > numEventsWithOutcome)) {
      actions.push('certify-remaining');
    }
    // NOTE: determine if 'sign-off' action should be added
    else if (numClaimedEvents === numEventsWithOutcome && numClaimedEvents !== numEventsSignedOff) {
      actions.push('sign-off');
    }
  }
  return actions;
}

function getOwnEvents(campaign_id, stage_index, certifier_type, certifier_id) {
  // get the events for the user (either claimed by or owned by depending on situation)
  var queryFilter = qf.isEventInStage(campaign_id, stage_index);
  if ((certifier_type.equalsIgnoreCase('authzRoles') || certifier_type.equalsIgnoreCase('authzGroup')) && !idmUtils.isLongUserId(certifier_id)) {
    // Certifier type is role, and acting as role (and not as user in the case of reassignment)
    queryFilter += ' and claimedBy eq "' + LOGGED_IN_USER_ID + '"';
  }
  else if (certifier_type.equalsIgnoreCase('entitlementOwner')) {
    queryFilter += ' and ' + qf.isUserCertifier(LOGGED_IN_USER_ID);
  }
  else {
    if (idmUtils.isLongRoleId(certifier_id)) {
      // Cases of default certifier being a role
      queryFilter += ' and ' + qf.isUserCertifierThroughRole(LOGGED_IN_USER_ID) + ' and claimedBy eq "' + LOGGED_IN_USER_ID + '"';
    }
    else {
      queryFilter += ' and ' + qf.isIdCertifier(LOGGED_IN_USER_ID);
    }
  }
  var params = {
    _queryFilter: queryFilter,
  };
  var ownEvents = openidm.query(EVENT_REPO_PATH, params).result;
  return ownEvents
}

function isRowViewable(event) {
  var certifierType = event.certifierType.toLowerCase();
  if (certifierType === 'entitlementOwner' || !idmUtils.isLongRoleId(event.actingId)) {
    return !event.isRowInactive
  }
  else {
    return true;
  }
}

function isRowForEventActive(event) {
  // Return whether the row (in cert list GUI) for the event should be active.
  var certifierType = event.certifierType.toLowerCase();
  if (_.includes(['user', 'manager', 'prevmanager'], certifierType)) {
    return event.certifierId === LOGGED_IN_USER_ID
  }
  else if (certifierType === 'entitlementowner') {
    return c.isRowForEventActive(event, event.actingId, LOGGED_IN_USER_ID)
  }
  else if (idmUtils.isLongRoleId(event.actingId)) {
    if (event.claimedBy === LOGGED_IN_USER_ID || !event.claimedBy) {
      return true
    } else {
      return false
    }
  }
  else {
    return null
  }
}

