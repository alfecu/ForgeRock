/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */


/*
This file contains utility functions that are specific to campaigns.  This includes functions for lower-level campaign things such as stages, events, and entitlements.

Currently, many functions such as the getEntitlements type functions are meant for the "entitlementOwner" case only, because other types of user certs do not have certifierId and claimedBy keys on the entitlements themselves.
*/
var _ = require('commons/lib/lodash4.js');
var __ = require('commons/utils/jsUtils.js');
var idmUtils = require('commons/utils/idmUtils.js');
var CONSTANT = require('idg/utils/globalConstants.js');
var utils = require('idg/utils/generalUtilities.js');
var qf = require('idg/utils/queryFilter.js');
var moment = require('commons/lib/moment.js');

// is functions for details & detail groups
function isTopLevelDetail(obj) {
  // Returns whether an object is a top-level detail (as opposed to a detail *group*).
  // they are the ones with an 'attributeValue' key.
  return obj.hasOwnProperty('attributeValue')
}


// more general boolean functions (is functions for events, details, and detail groups)
function isReviewed(obj) {
  // Return whether the status is REVIEWED
  // only really for events
  return obj['status'] === CONSTANT.STATUS.REVIEWED
}
var isNotReviewed = __.isToIsNot(isReviewed);
var isAllReviewed = __.isToIsAll(isReviewed);

function isInProgress(obj) {
  // Return whether the status is in progress.
  // only really for events
  return obj['status'] === CONSTANT.STATUS.IN_PROGRESS
}

function isNoCertifier(obj) {
  // Return whether the status is NO_CERTIFIER
  return obj['status'] === CONSTANT.STATUS.NO_CERTIFIER
}
var isAllNoCertifier = __.isToIsAll(isNoCertifier);

function isCurrent(obj) {
  // Return whether the status is a 'current' status, meaning the object is in the process of undergoing certification.
  return isReviewed(obj) || isInProgress(obj)
}

function isFinal(obj) {
  // Return whether the status is a final status (cannot be changed further).
  return eventStatusIsFinal(obj);
}
var isNotFinal = __.isToIsNot(isFinal);
var isAllFinal = __.isToIsAll(isFinal);

function eventStatusIsFinal(event) {
  return _.includes(CONSTANT.FINAL_STATUSES, event.status);
}

function eventStatusIsOpen(event) {
  return _.includes(CONSTANT.OPEN_STATUSES, event.status);
}

function eventStatusIsClosed(event) {
  return _.includes(CONSTANT.CLOSED_STATUSES, event.status);
}

function isCertifiable(obj) {
  // Return whether the object is certifiable
  // Currently this is ONLY used for event 'detail' objects, but it could be used for other objects in the future
  if (obj['certifiable'] === 1) {
    return true
  } else if (obj['certifiable'] === 0) {
    return false
  } else {
    __.requestError('Unrecognized value corresponding to key "certifiable".', 500);
  }
}
var isNotCertifiable = __.isToIsNot(isCertifiable);

function isCertifierIdRole(obj) {
  // return whether an entitlement or event's certifier id is a role id
  if (!obj.hasOwnProperty('certifierId')) {
    __.requestError('Bad input. object has no certifier id.', 500);
  }
  return idmUtils.isLongRoleId(obj['certifierId'])
}

function isClaimable(obj) {
  // return whether an entitlement or event is claimable (should get a 'claimedBy' id before anyone can act on it)
  // note: even if an object has ALREADY BEEN CLAIMED, it is STILL considered 'CLAIMABLE'
  return isCertifierIdRole(obj)
}

function isClaimed(obj) {
  // return whether obj has been claimed by somebody
  return obj.hasOwnProperty('claimedBy')
}
var isAllClaimed = __.isToIsAll(isClaimed);

function validateHasOutcomeKey(obj) {
  if (!obj.hasOwnProperty('outcome')) {
    __.requestError('The object has no outcome key.  This situation has not been accounted for.', 500);
  }
}

function isHasOutcome(obj) {
  // Return whether the object has an outcome
  validateHasOutcomeKey(obj);
  return !_.isEmpty(obj['outcome'])
}
var isAllHasOutcome = __.isToIsAll(isHasOutcome);
var isAnyHasOutcome = __.isToIsAny(isHasOutcome);

function isHasNoOutcome(obj) {
  // Return whether the object has no outcome (a null outcome)
  return !isHasOutcome(obj)
}

function isHasSpecificOutcome(outcome) {
  // Return function that takes in an object and tells you if it has that outcome or not
  if (outcome === undefined) {
    __.requestError('Missing or undefined argument `outcome`.', 500);
  }
  return function(obj) {
    // Return whether the object has exactly the provided outcome
    validateHasOutcomeKey(obj);
    return obj['outcome'] === outcome
  }
}

function isAllHasSpecificOutcome(objs, outcome) {
  var is_all_func = __.isToIsAll(isHasSpecificOutcome(outcome));
  return is_all_func(objs)
}

function isAnyHasSpecificOutcome(objs, outcome) {
  var is_any_func = __.isToIsAny(isHasSpecificOutcome(outcome));
  return is_any_func(objs)
}

function isAllHasSameOutcome(objs) {
  if (_.isEmpty(objs)) {
    var msg = 'The array of objects is empty.  This edge case has not been considered, and probably should not be occuring in the first place.';
    __.requestError(msg, 500);
  }
  var representative_outcome = objs[0]['outcome'];
  return isAllHasSpecificOutcome(objs, representative_outcome)
}

function isSignedOff(obj) {
  return obj['status'] === 'signed-off'
}
var isAllSignedOff = __.isToIsAll(isSignedOff);

function isForCertifierId(certifier_id) {
  // return function for filtering entitlements and events by their certifier id
  return function(obj) {
    // Return whether the object (entitlement or event) has certifier id certifier_id
    return obj['certifierId'] === certifier_id
  }
}

function isNotCertifiableOrForCertifierId(certifier_id) {
  // Returns a function for filtering that, given an object, says whether the object (typically a detail) is not certifiable OR is both certifiable and has certifier certifier_id.
  return function(obj) {
    return isNotCertifiable(obj) || isForCertifierId(certifier_id)(obj)
  }
}

function isForUser(user_id) {
  // return function for filtering entitlements and events by whether or not they are for the user
  // An object is 'for' the user if the certifier id is user_id or an auth role that the user has
  return function(obj) {
    var owner_id = obj['certifierId'];
    return idmUtils.isOwner(user_id, owner_id)
  }
}

function _isClaimedBy(user_id) {
  // return function for filtering whether an entitlement or event is 'claimedBy' a user
  // this internal version does not check input object for sanity
  var user_id = idmUtils.ensureUserIdShort(user_id);
  return function(obj) {
    return obj['claimedBy'] === user_id
  }
}

function isClaimedBy(user_id) {
  // return function for filtering whether an entitlement or event is 'claimedBy' a user
  return function(obj) {
    if (!isClaimable(obj)) {
      __.requestError('This object is not owned by a role, hence the notion of "claimedBy" makes no sense here.', 500);
    }
    return _isClaimedBy(user_id)(obj)
  }
}

function isClaimed(obj) {
  // return whether the object has been claimed (by anyone)
  if (!isClaimable(obj)) {
    __.requestError('This object is not owned by a role, hence the notion of "claimedBy" makes no sense here.', 500);
  }
  return obj.hasOwnProperty('claimedBy')
}

function isUnclaimed(obj) {
  // return whether the object has NOT been claimed (by anyone)
  return !isClaimed(obj)
}

function isUserResponsible(user_id) {
  // return function for filtering whether an entitlement or event is for a user and they are responsible
  return function(obj) {
    // return whether the object is for the user and they are responsible for it
    // if obj is not for the user in the first place
    if (!isForUser(user_id)(obj)) {
      return false
    }
    // if the user is responsible for obj
    if (!isClaimable(obj)) {
      return true
    }
    else if (_isClaimedBy(user_id)(obj)) {
      return true
    }
    else {
      return false
    }
  }
}

function isForActingId(acting_id, user_id) {
  return function(obj) {
    if (!(acting_id.indexOf(obj.certifierId) > -1)) {
      return false
    }
    if (idmUtils.isLongRoleId(acting_id)) {
      if (!_isClaimedBy(user_id)) {
        return false
      }
    }
    return true
  }
}

function isCanUserSignOff(user_id) {
  // return function for filtering whether you can sign off the object
  return function(obj) {
    // it's ready for sign off if you are responsible for it and it has an outcome, and it's status is not already final.
    return (!isSignedOff(obj)) && isUserResponsible(user_id)(obj) && isHasOutcome(obj)
  }
}

function _getKeyForDetailGroup(detail_group) {
  // Different detail groups have different keys to access their details, so we deal with that here.
  for (var index = 0; index < CONSTANT.DETAIL_GROUP_KEYS.length; index++) {
    var key = CONSTANT.DETAIL_GROUP_KEYS[index];
    if (detail_group.hasOwnProperty(key)) {
      return key
    }
  }
  __.requestError('Key error.  No appropriate key was found in the detail group to retrieve its details.', 500);
}

function getDetailsInDetailGroup(detail_group) {
  // If it has an 'attributes' key, assume it's an application and the details are there.
  // Otherwise, assume it's a managed object and the details are in 'values'.
  var key = _getKeyForDetailGroup(detail_group);
  return detail_group[key]
}

function setDetailsInDetailGroup(detail_group, details) {
  var key = _getKeyForDetailGroup(detail_group);
  detail_group[key] = details
}

function getDetailsInDetailGroupNotCertifiableOrForCertifierId(detail_group, certifier_id) {
  var objs = getDetailsInDetailGroup(detail_group);
  return _.filter(objs, isNotCertifiableOrForCertifierId(certifier_id))
}

function getEntitlementsInDetailGroup(detail_group) {
  // Get list of entitlements from the detail group.
  // Entitlements are just details that are certifiable.
  var details = getDetailsInDetailGroup(detail_group);
  var entitlements = _.filter(details, isCertifiable);
  return entitlements
}

function isDetailGroupHasDetails(detail_group) {
  var objs = getDetailsInDetailGroup(detail_group);
  return !_.isEmpty(objs) || detail_group.certifierId
}

function isDetailGroupHasEntitlements(detail_group) {
  var entitlements = getEntitlementsInDetailGroup(detail_group);
  return !_.isEmpty(entitlements)
}

function getDetailGroupsInEvent(event) {
  // get list of detail groups in the event
  var detail_groups = [];

  var eventData = event['eventData'];
  var eventDataKeys = Object.keys(eventData);
  eventDataKeys.forEach(function(dataGroupKey) {
    if (_.includes(CONSTANT.EVENT_DATA_KEYS_TO_FIND_DETAIL_GROUPS, dataGroupKey)) {
      var detail_group_candidates = eventData[dataGroupKey];
      detail_group_candidates.forEach(function(detail_group_candidate) {
        if (!isTopLevelDetail(detail_group_candidate)) {
          // it really is a group
          detail_groups.push(detail_group_candidate);
        }
      });
    }
  });

  return detail_groups
}

function getCDetailGroupsInEvent(event) {
  var detail_groups = getDetailGroupsInEvent(event);
  return _.filter(detail_groups, isCertifiable)
}

function getDetailsInEvent(event) {
  // get list of details (both certifiable details (which are 'entitlements') and non certifiable details)
  var details = [];

  var eventData = event['eventData'];
  var eventDataKeys = Object.keys(eventData);
  eventDataKeys.forEach(function(dataGroupKey) {
    if (_.includes(CONSTANT.EVENT_DATA_KEYS_TO_FIND_DETAIL_GROUPS, dataGroupKey)) {
      var detail_group_candidates = eventData[dataGroupKey];
      detail_group_candidates.forEach(function(detail_group_candidate) {
        // in the case of managedObject or metadata, there are 'top-level' details to worry about
        if (isTopLevelDetail(detail_group_candidate)) {
          // it's actually not a group, but a top-level detail
          var top_level_detail = detail_group_candidate;
          details.push(top_level_detail);
        }
        else {
          // it really is a group, so get the details it contains
          var detail_group = detail_group_candidate;
          var details_of_detail_group = getDetailsInDetailGroup(detail_group);
          details_of_detail_group.forEach(function(detail) {
            details.push(detail);
          });
        }
      });
    }
  });

  return details
}

function getEntitlementsInEvent(event) {
  // get list of entitlements from the event
  // entitlements are just event 'details' that are certifiable
  var details = getDetailsInEvent(event);
  var entitlements = _.filter(details, isCertifiable);
  return entitlements
}

function getCertifiablesInEvent(event) {
  return getEntitlementsInEvent(event).concat(getCDetailGroupsInEvent(event))
}

function isEventHasCertifiables(event) {
  var objs = getCertifiablesInEvent(event);
  return !_.isEmpty(objs)
}

function getEntitlementsInEventForCertifierId(event, certifier_id) {
  // get list of entitlements from the event whose certifier id is certified_id
  if (certifier_id === undefined) {
    __.requestError('Missing argument.', 500);
  }
  var all_entitlements = getEntitlementsInEvent(event);
  var entitlements_desired = _.filter(all_entitlements, isForCertifierId(certifier_id));
  return entitlements_desired
}

function getCertifiablesInEventClaimableForCertifierIdForUserUnclaimed(event, certifier_id, user_id) {
  // get list of certifiables from the event whose certifier id is certifier_id, and that id is user_id or an auth role that the user has
  if (user_id === undefined) {
    __.requestError('Missing argument.', 500);
  }
  return __.filterList(getCertifiablesInEvent(event), [
    isClaimable,
    isForCertifierId(certifier_id),
    isForUser(user_id),
    isUnclaimed,
  ])
}

function getEntitlementsInEventForUserResponsible(event, user_id) {
  // get list of entitlements from the event that satisfy (1) (certifier id is user_id) or (2) (certifier_id is an auth role that the user has and the entitlement is 'claimedBy' the user)
  // The idea is that you are automatically responsible for entitlements that you own, but you are only responsible for entitlements that your auth role owns if you have claimed it.
  var entitlements = getEntitlementsInEvent(event);
  var entitlements = _.filter(entitlements, isUserResponsible(user_id));
  return entitlements
}

function getEntitlementsInEventForCertifierIdForUserResponsible(event, certifier_id, user_id) {
  // get entitlements in an event whose certifier id is certifier_id where the user_id user is responsible
  if (user_id === undefined) {
    __.requestError('Missing argument `user_id`.', 500);
  }
  var entitlements = __.filterList(getEntitlementsInEvent(event), [
    isForCertifierId(certifier_id),
    isUserResponsible(user_id),
  ]);
  return entitlements
}

function getCDetailGroupsInEventForCertifierIdForUserResponsible(event, certifier_id, user_id) {
  // get entitlements in an event whose certifier id is certifier_id where the user_id user is responsible
  if (user_id === undefined) {
    __.requestError('Missing argument `user_id`.', 500);
  }
  var objs = __.filterList(getCDetailGroupsInEvent(event), [
    isForCertifierId(certifier_id),
    isUserResponsible(user_id),
  ]);
  return objs
}

function getCertifiablesInEventForCertifierIdForUserResponsible(event, certifier_id, user_id) {
  // get certifiables in an event whose certifier id is certifier_id where the user_id user is responsible
  if (user_id === undefined) {
    __.requestError('Missing argument `user_id`.', 500);
  }
  return __.filterList(getCertifiablesInEvent(event), [
    isForCertifierId(certifier_id),
    isUserResponsible(user_id),
  ])
}
var getCertifiablesInEventsForCertifierIdForUserResponsible = __.flattenOnceMap(getCertifiablesInEventForCertifierIdForUserResponsible);

function getCertifiablesInEventForCertifierIdCanUserSignOff(event, certifier_id, user_id) {
  if (user_id === undefined) {
    __.requestError('Missing argument `user_id`.', 500);
  }
  return __.filterList(getCertifiablesInEvent(event), [
    isForCertifierId(certifier_id),
    isCanUserSignOff(user_id),
  ])
}
var getCertifiablesInEventToSignOff = getCertifiablesInEventForCertifierIdCanUserSignOff;

function isNonemptyCertifiablesInEventForCertifierIdForUserResponsible(event, certifier_id, user_id) {
  var certifiables = getCertifiablesInEventForCertifierIdForUserResponsible(event, certifier_id, user_id)
  return !_.isEmpty(certifiables)
}

function getCertifiablesInEventClaimableForCertifierIdForUser(event, certifier_id, user_id) {
  if (user_id === undefined) {
    __.requestError('Missing argument.', 500);
  }
  var entitlements = __.filterList(getCertifiablesInEvent(event), [
    isClaimable,
    isForCertifierId(certifier_id),
    isForUser(user_id),
  ])
  return entitlements
}
var getCertifiablesInEventsClaimableForCertifierIdForUser = __.getToGetFromAll(getCertifiablesInEventClaimableForCertifierIdForUser);

function getCertifiablesInStageClaimableForCertifierIdForUser(campaign_id, stage_index, certifier_id, user_id, object_type) {
  var objs = getEventsInStage(campaign_id, stage_index, object_type);
  return getCertifiablesInEventsClaimableForCertifierIdForUser(objs, certifier_id, user_id)
}

function isAllCertifiablesInEventHasOutcome(event) {
  return isAllHasOutcome(getCertifiablesInEvent(event))
}

function isAnyCertifiablesInEventHasOutcome(event) {
  var objs = getCertifiablesInEvent(event);
  return isAnyHasOutcome(objs)
}
var isAnyCertifiablesInEventsHasOutcome = __.isToIsAny(isAnyCertifiablesInEventHasOutcome);

function isAllCertifiablesInEventSignedOff(event) {
  return isAllSignedOff(getCertifiablesInEvent(event))
}

function isAllCertifiablesInEventsForCertifierIdForUserResponsibleHasOutcome(events, certifier_id, user_id) {
  var objs = getCertifiablesInEventsForCertifierIdForUserResponsible(events, certifier_id, user_id);
  return isAllHasOutcome(objs)
}

function isAnyCertifiablesInEventForCertifierIdForUserResponsibleHasOutcome(events, certifier_id, user_id) {
  var objs = getCertifiablesInEventForCertifierIdForUserResponsible(events, certifier_id, user_id);
  return isAnyHasOutcome(objs)
}

function isAnyCertifiablesInEventsForCertifierIdForUserResponsibleHasOutcome(events, certifier_id, user_id) {
  var objs = getCertifiablesInEventsForCertifierIdForUserResponsible(events, certifier_id, user_id);
  return isAnyHasOutcome(objs)
}

function isAllCertifiablesInEventHasSameOutcome(event) {
  var certifiables = getCertifiablesInEvent(event);
  return isAllHasSameOutcome(certifiables)
}

function isAllCertifiablesInEventClaimableForCertifierIdForUserClaimed(event, certifier_id, user_id) {
  var objs = getCertifiablesInEventClaimableForCertifierIdForUser(event, certifier_id, user_id);
  return isAllClaimed(objs)
}

function isAllCertifiablesInStageClaimableForCertifierIdForUserClaimed(campaign_id, stage_index, certifier_id, user_id, object_type) {
  var objs = getCertifiablesInStageClaimableForCertifierIdForUser(campaign_id, stage_index, certifier_id, user_id, object_type);
  return isAllClaimed(objs)
}

function isAnyCertifiablesInEventHasSpecificOutcome(event, outcome) {
  var certifiables = getCertifiablesInEvent(event)
  return isAnyHasSpecificOutcome(certifiables, outcome)
}

function isAllEventsInCampaignFinal(campaign_id, object_type) {
  var objs = getEventsInCampaign(campaign_id, object_type);
  return isAllFinal(objs)
}

function getInheritedOutcomeOfEvent(event) {
  // Returns what outcome the event would inherit from its certifiables, assuming someone chooses to make the inherit occur
  // If you want what the event outcome CURRENTLY IS, just use `event.outcome`.
  if (!isEventHasCertifiables(event)) {
    return CONSTANT.OUTCOME.CERTIFIED
  }
  else if (!isAllCertifiablesInEventHasOutcome(event)) {
    // if at least one is null
    return null
  }
  else if (isAnyCertifiablesInEventHasSpecificOutcome(event, CONSTANT.OUTCOME.CERTIFIED)) {
    // if at least one is certified
    return CONSTANT.OUTCOME.CERTIFIED
  }
  else if (isAnyCertifiablesInEventHasSpecificOutcome(event, CONSTANT.OUTCOME.ABSTAINED)) {
    // if at least one is abstained
    return CONSTANT.OUTCOME.ABSTAINED
  }
  else if (isAllCertifiablesInEventHasSameOutcome(event, CONSTANT.OUTCOME.REVOKED)) {
    // if they are ALL revoked
    return CONSTANT.OUTCOME.REVOKED
  }
  else {
    // sanity check
    __.requestError('Unrecognized outcome scenario.  There may be bad outcome data.', 500);
  }
}

function getCampaign(campaign_id, objectType) {
  // get a specific campaign
  // allow_empty: boolean: If true, return null if no event is found.  If false, error.
  // fields: array: If defined, limits the fields in the resulting event object.
  if (campaign_id === undefined) {
    __.requestError('Missing argument.', 500);
  }
  var params = {
    _queryFilter: qf.isId(campaign_id),
  };
  var certRepoPath = getCertRepoPath(objectType);
  var objs = openidm.query(certRepoPath, params).result;
  if (!objs.length) {
    __.requestError('Campaign not found or empty.', 404);
  }
  else if (objs.length > 1) {
    __.requestError('More than 1 campaign found with id: ' + campaign_id + '.', 400);
  }
  var obj = objs[0];
  return obj;
}

function getEvent(campaign_id, stage_index, event_index, object_type, allow_empty, fields) {
  // get a specific event
  // allow_empty: boolean: If true, return null if no event is found.  If false, error.
  // fields: array: If defined, limits the fields in the resulting event object.
  // note(ML): if you want to get an event by _id, create a separate getEvenyById function
  if (event_index === undefined) {
    __.requestError('Missing argument.', 500);
  }
  var params = {
    _queryFilter: qf.isEventExactly(campaign_id, String(stage_index), String(event_index)),
  };
  if (!_.isUndefined(fields)) {
    _.assign(params, {_fields: fields});
  }
  var eventRepoPath = getEventRepoPath(object_type);
  var objs = openidm.query(eventRepoPath, params).result;
  if (!objs.length) {
    if (allow_empty) {
      return null;
    }
    else {
      __.requestError('Event not found or empty.', 404);
    }
  }
  else if (objs.length > 1) {
    __.requestError('More than 1 event found with eventIndex: ' + event_index + '.', 400);
  }
  var obj = objs[0];
  return obj;
}

function getEventsInStage(campaign_id, stage_index, object_type, fields, return_empty_events) {
  // get all the events for a specific stage
  if (_.isUndefined(stage_index)) {
    __.requestError('Missing argument.', 500);
  }
  var params = {
    _queryFilter: qf.isEventInStage(campaign_id, String(stage_index), return_empty_events),
  };
  if (!_.isUndefined(fields)) {
    _.assign(params, {_fields: fields});
  }
  var eventRepoPath = getEventRepoPath(object_type);
  var events = openidm.query(eventRepoPath, params).result;
  return events;
}

function getEventsInStageNotFinal(campaign_id, stage_index, object_type) {
  // get all the events for a specific stage that do not have a final status
  var objs = getEventsInStage(campaign_id, stage_index, object_type);
  return _.filter(objs, isNotFinal)
}

function getEventsInStageForCertifierId(campaign_id, stage_index, certifier_id, object_type) {
  // get all the events for a specific stage that are for the certifier id
  if (certifier_id === undefined) {
    __.requestError('Missing argument.', 500);
  }
  var params = {
    _queryFilter: qf.isEventInStageForCertifierId(campaign_id, stage_index, certifier_id),
  };
  var eventRepoPath = getEventRepoPath(object_type);
  var events = openidm.query(eventRepoPath, params).result;
  return events
}

function getEventsInCampaign(campaign_id, object_type, fields) {
  // get all the events for a specific campaign
  // optionally filter by fields
  if (campaign_id === undefined) {
    __.requestError('Missing argument.', 500);
  }
  var params = {
    _queryFilter: qf.isEventInCampaign(campaign_id),
    _sortKeys: 'expirationDate',
  };
  if (fields !== undefined) {
    params['_fields'] = fields;
  }
  var eventRepoPath = getEventRepoPath(object_type);
  var events = openidm.query(eventRepoPath, params).result;
  return events
}

function isClosedCertifierId(event, certifier_id) {
  // A certifier id is closed if and only if every entitlement in the event with the certifier id is signed off.
  var entitlements = getEntitlementsInEventForCertifierId(event, certifier_id);
  var is_closed = isAllSignedOff(entitlements);
  return is_closed;
}

function getOpenCertifierIds(event) {
  var ids = __.splitCommaSeparatedString(event['openCertifierIds']);
  return ids
}
function getClosedCertifierIds(event) {
  var ids = __.splitCommaSeparatedString(event['closedCertifierIds']);
  return ids
}
function setOpenCertifierIds(event, ids) {
  if (ids === undefined) {
    __.requestError('Missing argument.', 500);
  }
  var ids_string = _.uniq(ids).join(',');
  event['openCertifierIds'] = ids_string;
}
function setClosedCertifierIds(event, ids) {
  if (ids === undefined) {
    __.requestError('Missing argument.', 500);
  }
  var ids_string = _.uniq(ids).join(',');
  event['closedCertifierIds'] = ids_string;
}

function getLongCertifierIdOfEvent(event) {
  // Get the 'certifierId' of the event.  Always returns a long id.
  var certifier_type = event['certifierType'].toLowerCase();
  if (_.includes(['user', 'manager', 'prevmanager'], certifier_type)) {
    return idmUtils.ensureUserIdLong(event['certifierId'])
  }
  else if (certifier_type === 'authzroles' || certifier_type === 'authzgroup') {
    return event['certifierId']
  }
  else if (certifier_type === 'entitlementowner') {
    __.requestError('entitlementOwner events do not have a certifierId.  use openCertifierIds instead.', 500);
  }
  else {
    __.requestError('Unrecognized certifier type.', 500);
  }
}

function getCertifierIdsOfEventSingleOrOpen(event) {
  // Get the 'certifierId's and the 'openCertifierIds' of the event.
  var certifier_ids = [];
  // get the certifier id (if the key exists and is not a blank value)
  if (event.hasOwnProperty('certifierId') && event['certifierId']) {
    certifier_ids.push(getLongCertifierIdOfEvent(event));
  }
  // get the open certifier ids (if the key exists)
  if (event.hasOwnProperty('openCertifierIds')) {
    certifier_ids = certifier_ids.concat(getOpenCertifierIds(event));
  }
  // don't be redundant
  certifier_ids = _.uniq(certifier_ids);
  return certifier_ids
}

function getCertifierUserIdsOfEventSingleOrOpen(event) {
  // Get the 'certifierId's and the 'openCertifierIds' of the event, converting any role ids to the user ids of the auth members.
  // Hence the term 'certifier user ids'.
  var certifier_ids = getCertifierIdsOfEventSingleOrOpen(event);
  var user_ids = idmUtils.getUserIdsFromCertifierIds(certifier_ids);
  return user_ids
}
var getCertifierUserIdsOfEventsSingleOrOpen = __.getToGetFromAllUniq(getCertifierUserIdsOfEventSingleOrOpen)

function getCertifierUserIdsOfEventCurrentlyAssigned(event) {
  // Get the 'currently assigned' certifier *user* ids of the event.
  if (isCurrent(event)) {
    return getCertifierUserIdsOfEventSingleOrOpen(event)
  }
  else {
    return []
  }
}

function getNumCompleteAndIncompleteInEvent(event, certifier_type, certifier_id, user_id) {
  // For a particular event, return the number of certifiables that are 'complete' and the number of certifiables that are not.  This is currently used for the progress pie charts in the dashboard.
  var objs = (certifier_type === 'entitlementOwner')?
      getCertifiablesInEventForCertifierIdForUserResponsible(event, certifier_id, user_id):
      getCertifiablesInEvent(event);

  // A certifiable is 'complete' if it has an outcome
  var objs_complete = _.filter(objs, isHasOutcome);
  var num_objs = objs.length;
  var num_objs_complete = objs_complete.length;
  var num_objs_incomplete = num_objs - num_objs_complete;
  return [num_objs_complete, num_objs_incomplete]
}

function getNumCompleteAndIncompleteInEvents(events, certifier_type, certifier_id, user_id) {
  var nums_array = _.map(events, function(event) {
    return getNumCompleteAndIncompleteInEvent(event, certifier_type, certifier_id, user_id)
  });
  var nums_complete = _.map(nums_array, 0);
  var nums_incomplete = _.map(nums_array, 1);
  var num_complete = __.sum(nums_complete);
  var num_incomplete = __.sum(nums_incomplete);
  var total_events = nums_array.length;
  var events_complete = 0;
  for (var i = 0; i < nums_complete.length; i++) {
    if (nums_incomplete[i] === 0 && nums_complete[i] !== 0) {
      events_complete++;
    }
  }
  var events_incomplete = total_events - events_complete
  return [num_complete, num_incomplete, events_complete, events_incomplete]
}

function getNumCompleteAndIncompleteInStage(campaign_id, stage_index, certifier_type, certifier_id, user_id, object_type) {
  // For a particular stage of a particular campaign, return the number of events that are 'complete' and the number of events that are not.  This is currently used for the progress pie charts in the dashboard.
  var events = getEventsInStage(campaign_id, stage_index, object_type);
  return getNumCompleteAndIncompleteInEvents(events, certifier_type, certifier_id, user_id)
}

function getNumCompleteAndIncompleteInStageForCertifierId(campaign_id, stage_index, certifier_type, certifier_id, user_id, object_type) {
  // For a particular stage of a particular campaign, return the number of events that are 'complete' and the number of events that are not.  This is currently used for the progress pie charts in the dashboard.
  if (certifier_type === 'user' || certifier_type === 'manager' || certifier_type === 'prevManager') {
    certifier_id = idmUtils.ensureUserIdShort(certifier_id);
  }
  var events = getEventsInStageForCertifierId(campaign_id, stage_index, certifier_id, object_type);
  return getNumCompleteAndIncompleteInEvents(events, certifier_type, certifier_id, user_id)
}

// use-case functions
function isCommentActionAvailableForEvent(event) {
  // you can always comment (well technically, the event should be yours in some way, which we should check here)
  return true
}

// if there's something unclaimed that YOU can claim
// "if not All the (appropriate) Certifiables are Claimed)"
var isClaimActionAvailableForEvent = __.isToIsNot(isAllCertifiablesInEventClaimableForCertifierIdForUserClaimed);
var isClaimActionAvailableForStage = __.isToIsNot(isAllCertifiablesInStageClaimableForCertifierIdForUserClaimed);

function isCertifyRevokeAbstainActionAvailableForEvent(event, certifier_id, user_id) {
  // all three of these actions fall under the same umbrella
  // if there's something you can act on
  return isNonemptyCertifiablesInEventForCertifierIdForUserResponsible(event, certifier_id, user_id)
}

function isResetActionAvailableForEvent(event, certifier_id, user_id) {
  // you can 'reset' as long as there is something you are responsible for which has an outcome
  return isAnyCertifiablesInEventForCertifierIdForUserResponsibleHasOutcome(event, certifier_id, user_id)
}

function isSignOffActionAvailableForStage(campaign_id, stage_index, certifier_id, user_id, object_type) {
  // in entitlementOwner case, you can 'sign off' if the entitlements YOU are responsible for have an outcome
  var events = getEventsInStageForCertifierId(campaign_id, stage_index, certifier_id, object_type);
  return isAllCertifiablesInEventsForCertifierIdForUserResponsibleHasOutcome(events, certifier_id, user_id)
}

function isCertifyRemainingActionAvailableForStage(campaign_id, stage_index, certifier_id, user_id, object_type) {
  // You 'can certify remaining' if there is something left to certify, meaning any
  // entitlement or event you are responsible for that still has a missing outcome.
  var events = getEventsInStageForCertifierId(campaign_id, stage_index, certifier_id, object_type);
  return !isAllCertifiablesInEventsForCertifierIdForUserResponsibleHasOutcome(events, certifier_id, user_id)
}

function isResetActionAvailableForStage(campaign_id, stage_index, certifier_id, user_id, object_type) {
  var events = getEventsInStageForCertifierId(campaign_id, stage_index, certifier_id, object_type);
  return isAnyCertifiablesInEventsForCertifierIdForUserResponsibleHasOutcome(events, certifier_id, user_id)
}

var canSignOffCampaign = isAllEventsInCampaignFinal

function isRowForEventActive(event, certifier_id, user_id) {
  return isNonemptyCertifiablesInEventForCertifierIdForUserResponsible(event, certifier_id, user_id)
}

function getEventRepoPath(objectType) {
  var eventPath = !objectType || objectType === 'user' ? CONSTANT.REPO_PATH.USER_EVENT : CONSTANT.REPO_PATH.OBJECT_EVENT
  return eventPath;
}

function getCertRepoPath(objectType) {
  var eventPath = !objectType || objectType === 'user' ? CONSTANT.REPO_PATH.USER_CERT : CONSTANT.REPO_PATH.OBJECT_CERT
  return eventPath;
}

function getCampaignAndUpdateInformation(campaignId, type) {
  var campaignObject = getCampaign(campaignId, type);
  updateCampaignInformation(campaignObject, type);
  return campaignObject;
}

function updateCampaignStatusNumbers(campaignObject, isAdmin) {
  campaignObject.totalEventCount = 0;
  campaignObject.totalEventsComplete = 0;
  campaignObject.totalEventsIncomplete = 0;
  _.forEach(campaignObject.stages, function(stage) {
    stage.eventCount = 0;
    stage.eventsComplete = 0;
    stage.eventsIncomplete = 0;
    _.forEach(_.keys(stage.eventStatuses), function(status) {
      var statusCount =  stage.eventStatuses[status];
      campaignObject.totalEventCount += statusCount
      stage.eventCount += statusCount
      if (_.includes(CONSTANT.OPEN_STATUSES, status)) {
        campaignObject.totalEventsIncomplete += statusCount
        stage.eventsIncomplete += statusCount
      }
      else {
        campaignObject.totalEventsComplete += statusCount
        stage.eventsComplete += statusCount
      }
    });
  });
  return campaignObject;
}

function updateCampaignInformation(campaignObject, type) {
  var openCertifierIds = [];
  var closedCertifierIds = [];
  var fields = ['status', 'certifierId', 'certifierType', 'openCertifierIds', 'closedCertifierIds', 'stageIndex', 'expirationDate'];
  var nextDeadline = null;
  var nextEscalation = null;
  var wasStageEscalated = false;

  _.forEach(campaignObject.stages, function(stage) {
    if (!stage.escalated && stage.escalationDate && stage.escalationDate !== '') {
      
    }
    stage.totalEvents = 0;
    stage.eventStatuses = {};
    stage.openCertifierIds = [];
    stage.closedCertifierIds = [];
  })
  
  var campaignEvents = getEventsInCampaign(campaignObject._id, type, fields);
  _.forEach(campaignEvents, function(event) {
    
    // Events are ordered by expiration, so assign expiration date of the first in-progress event as the campaign's next deadline
    if (event.status === CONSTANT.STATUS.IN_PROGRESS) {
      if (!nextDeadline) {
        nextDeadline = moment(event.expirationDate).format();
        campaignObject.nextDeadline = nextDeadline;
      }
      if (!nextEscalation) {
        var eventStage = campaignObject.stages[event.stageIndex];
        if (eventStage.escalationDate && eventStage.escalationDate !== '' && !eventStage.escalated) {
          nextEscalation = eventStage.escalationDate;
          campaignObject.nextEscalation = nextEscalation;
        }
      }
    }
    // Update totals on campaignObject
    var incompleteStatuses = [CONSTANT.STATUS.PENDING, CONSTANT.STATUS.IN_PROGRESS, CONSTANT.STATUS.REVIEWED];
    var eventStage = campaignObject.stages[event.stageIndex];
    if (!eventStage.openCertifierIds) {
      eventStage.openCertifierIds = [];
    }
    if (!eventStage.closedCertifierIds) {
      eventStage.closedCertifierIds = [];
    }
    eventStage.totalEvents += 1;
    if (!eventStage.eventStatuses[event.status]) {
      eventStage.eventStatuses[event.status] = 0;
    }
    eventStage.eventStatuses[event.status] += 1;
    if (event.certifierType === CONSTANT.CERTIFIER_TYPE.ENTITLEMENT_OWNER) {
      if (isCurrent(event)) {
        openCertifierIds = _.concat(openCertifierIds, event.openCertifierIds);
        eventStage.openCertifierIds = _.union(eventStage.openCertifierIds, event.openCertifierIds.split(','));
      }
      if (isCurrent(event) || event.status === 'signed-off' || event.status === 'expired') {
        closedCertifierIds = _.concat(closedCertifierIds, event.closedCertifierIds);
        eventStage.closedCertifierIds = _.union(eventStage.closedCertifierIds, event.closedCertifierIds.split(','));
      }
    }
    else {
      var certifierId = (event.certifierType === CONSTANT.CERTIFIER_TYPE.AUTH_ROLE || event.certifierType === CONSTANT.CERTIFIER_TYPE.GROUP) ? 
        event.certifierId : idmUtils.ensureUserIdLong(event.certifierId);
      if (isCurrent(event)) {
        openCertifierIds.push(certifierId);
        eventStage.openCertifierIds.push(certifierId)
      }
      else if (event.status === 'signed-off' || event.status === 'expired') {
        closedCertifierIds.push(certifierId);
        eventStage.closedCertifierIds.push(certifierId)
      }
    }
  });
  campaignObject.openCertifierIds = _.uniq(openCertifierIds).join(',');
  campaignObject.closedCertifierIds = _.uniq(closedCertifierIds).join(',');
  _.forEach(campaignObject.stages, function(stage) {
    stage.openCertifierIds = _.uniq(stage.openCertifierIds).join(',');
    stage.closedCertifierIds = _.uniq(stage.closedCertifierIds).join(',');  
  })

  return campaignObject;
}

module.exports = {
  // getters
  getInheritedOutcomeOfEvent: getInheritedOutcomeOfEvent,
  getOpenCertifierIds: getOpenCertifierIds,
  getClosedCertifierIds: getClosedCertifierIds,
  getCertifierIdsOfEventSingleOrOpen: getCertifierIdsOfEventSingleOrOpen,
  getCertifierUserIdsOfEventSingleOrOpen: getCertifierUserIdsOfEventSingleOrOpen,
  getCertifierUserIdsOfEventsSingleOrOpen: getCertifierUserIdsOfEventsSingleOrOpen,
  getCertifierUserIdsOfEventCurrentlyAssigned: getCertifierUserIdsOfEventCurrentlyAssigned,
  getNumCompleteAndIncompleteInEvent: getNumCompleteAndIncompleteInEvent,
  getNumCompleteAndIncompleteInStage: getNumCompleteAndIncompleteInStage,
  getNumCompleteAndIncompleteInStageForCertifierId: getNumCompleteAndIncompleteInStageForCertifierId,
  getDetailsInDetailGroup: getDetailsInDetailGroup,
  getDetailsInDetailGroupNotCertifiableOrForCertifierId: getDetailsInDetailGroupNotCertifiableOrForCertifierId,
  getDetailGroupsInEvent: getDetailGroupsInEvent,
  getCDetailGroupsInEvent: getCDetailGroupsInEvent,
  getCDetailGroupsInEventForCertifierIdForUserResponsible: getCDetailGroupsInEventForCertifierIdForUserResponsible,
  getEntitlementsInDetailGroup: getEntitlementsInDetailGroup,
  getEntitlementsInEvent: getEntitlementsInEvent,
  getEntitlementsInEventForCertifierId: getEntitlementsInEventForCertifierId,
  getEntitlementsInEventForCertifierIdForUserResponsible: getEntitlementsInEventForCertifierIdForUserResponsible,
  getCertifiablesInEvent: getCertifiablesInEvent,
  getCertifiablesInEventForCertifierIdForUserResponsible: getCertifiablesInEventForCertifierIdForUserResponsible,
  getCertifiablesInEventClaimableForCertifierIdForUser: getCertifiablesInEventClaimableForCertifierIdForUser,
  getCertifiablesInEventsClaimableForCertifierIdForUser: getCertifiablesInEventsClaimableForCertifierIdForUser,
  getCertifiablesInEventClaimableForCertifierIdForUserUnclaimed: getCertifiablesInEventClaimableForCertifierIdForUserUnclaimed,
  getCertifiablesInStageClaimableForCertifierIdForUser: getCertifiablesInStageClaimableForCertifierIdForUser,
  getEvent: getEvent,
  getEventsInStage: getEventsInStage,
  getEventsInStageNotFinal: getEventsInStageNotFinal,
  getEventsInStageForCertifierId: getEventsInStageForCertifierId,
  getEventsInCampaign: getEventsInCampaign,
  getCampaign: getCampaign,
  // setters
  setOpenCertifierIds: setOpenCertifierIds,
  setClosedCertifierIds: setClosedCertifierIds,
  setDetailsInDetailGroup: setDetailsInDetailGroup,
  // boolean and filter functions
  isClosedCertifierId: isClosedCertifierId,
  isDetailGroupHasDetails: isDetailGroupHasDetails,
  isDetailGroupHasEntitlements: isDetailGroupHasEntitlements,
  isReviewed: isReviewed,
  isNotReviewed: isNotReviewed,
  isSignedOff: isSignedOff,
  isFinal: isFinal,
  eventStatusIsFinal: eventStatusIsFinal,
  eventStatusIsOpen: eventStatusIsOpen,
  eventStatusIsClosed: eventStatusIsClosed,
  isNotFinal: isNotFinal,
  isHasOutcome: isHasOutcome,
  isHasNoOutcome: isHasNoOutcome,
  isForCertifierId: isForCertifierId,
  isForActingId: isForActingId,
  isAllReviewed: isAllReviewed,
  isAllSignedOff: isAllSignedOff,
  isAllNoCertifier: isAllNoCertifier,
  isAllFinal: isAllFinal,
  isAllHasOutcome: isAllHasOutcome,
  isAllCertifiablesInEventSignedOff: isAllCertifiablesInEventSignedOff,
  isAllCertifiablesInEventHasOutcome: isAllCertifiablesInEventHasOutcome,
  isAllEventsInCampaignFinal: isAllEventsInCampaignFinal,
  isAnyCertifiablesInEventHasOutcome: isAnyCertifiablesInEventHasOutcome,
  isAnyCertifiablesInEventsHasOutcome: isAnyCertifiablesInEventsHasOutcome,
  // functions that target specific use-cases ('nice name' functions)
  getCertifiablesInEventToSignOff: getCertifiablesInEventToSignOff,
  isCommentActionAvailableForEvent: isCommentActionAvailableForEvent,
  isClaimActionAvailableForEvent: isClaimActionAvailableForEvent,
  isClaimActionAvailableForStage: isClaimActionAvailableForStage,
  isCertifyRevokeAbstainActionAvailableForEvent: isCertifyRevokeAbstainActionAvailableForEvent,
  isResetActionAvailableForEvent: isResetActionAvailableForEvent,
  isSignOffActionAvailableForStage: isSignOffActionAvailableForStage,
  isCertifyRemainingActionAvailableForStage: isCertifyRemainingActionAvailableForStage,
  isResetActionAvailableForStage: isResetActionAvailableForStage,
  canSignOffCampaign: canSignOffCampaign,
  isRowForEventActive: isRowForEventActive,
  getCampaignAndUpdateInformation: getCampaignAndUpdateInformation,
  updateCampaignStatusNumbers: updateCampaignStatusNumbers,
  updateCampaignInformation: updateCampaignInformation,
};
