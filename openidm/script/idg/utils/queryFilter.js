/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */


// This file is a place for building blocks that can be combined to create query filters.  By 'query filter', I am referring to the _queryFilter parameter in an IDM url such as http://10.0.51.2:9080/openidm/managed/user?_queryFilter=userName+eq+"m"+and+(accountStatus+eq+"active"+or+accountStatus+eq+"pending").  This file is a place to store commonly used filter pieces such as (accountStatus+eq+"active"+or+accountStatus+eq+"pending").  By convention, filter pieces in this file SHOULD include surrounding parenthesis.

// imports
var _ = require('commons/lib/lodash4.js');
var __ = require('commons/utils/jsUtils.js');
var idmUtils = require('commons/utils/idmUtils.js');
var qf = require('commons/utils/queryFilterBuilder.js');
var CONSTANT = require('idg/utils/globalConstants.js');
var utils = require('idg/utils/generalUtilities.js');
var moment = require('commons/lib/moment.js');

// idg-specific custom definitions
function isIdCertifier(certifier_id) {
  // queries whether the given id (typically a user id or role id) is one of the directly listed certifiers
  if (certifier_id === undefined) {
    __.requestError('Missing argument. No user id given to isIdCertifier.', 500);
  }
  if (idmUtils.isLongRoleId(certifier_id)) {
    return qf.or([
      qf.eq('certifierId', certifier_id),
      qf.co('openCertifierIds', certifier_id),
    ]);    
  }
  else {
    var short_id = idmUtils.ensureUserIdShort(certifier_id);
    var long_id = idmUtils.ensureUserIdLong(certifier_id);
    return qf.or([
      qf.eq('certifierId', short_id),
      qf.eq('certifierId', long_id),
      qf.co('openCertifierIds', long_id),  
    ])
  };
}

function isIdCertifierOfActive(certifier_id) {
  //queries whether the given is is the certifier of an event that is either in-progress or pending
  if (certifier_id === undefined) {
    __.requestError('Missing argument. No user id given to isIdCertifier.', 500);
  }
  return qf.and([
    qf.or([
      isIdCertifier(certifier_id),
      isObjectClaimedBy(certifier_id),
    ]),
    isNotClosed(),
  ]);
}

function isIdInEventOpenCertifierId(certifier_id){
  if (certifier_id === undefined) {
    __.requestError('Missing argument. No user id given to isIdCertifier.', 500);
  }
  return qf.co('openCertifierIds', certifier_id);
}

function isIdInEventClosedCertifierId(certifier_id){
  if (certifier_id === undefined) {
    __.requestError('Missing argument. No user id given to isIdCertifier.', 500);
  }
  return qf.co('closedCertifierIds', certifier_id);
}

function isNotClosed() {
  //queries whether an object's status is in-progress or pending
  return qf.or([
    qf.eq('status', 'pending'),
    qf.eq('status', 'in-progress'),
  ]);
}

function isObjectClaimedBy(certifier_id) {
  var short_id = idmUtils.ensureUserIdShort(certifier_id);
  return qf.eq('claimedBy', short_id);
}

// idg-specific custom definitions
function isIdOwner(owner_id) {
  // queries whether the given id (typically a user id or role id) is one of the directly listed owners
  if (owner_id === undefined) {
    __.requestError('Missing argument. No user id given to isIdOwner.', 500);
  }
  return qf.eq('owner', owner_id);
}


// idg-specific custom definitions
function isIdTarget(target_id) {
  // queries whether the given id (typically a user id or role id) is one of the directly listed owners
  if (target_id === undefined) {
    __.requestError('Missing argument. No user id given to isIdTarget.', 500);
  }
  return qf.eq('targetId', target_id);
}


function isUserCertifierThroughRole(user_id) {
  // queries whether the user has a role that is a certifying role for the object
  if (user_id === undefined) {
    __.requestError('Missing argument. No user id given to isUserCertifierThroughRole.', 500);
  }
  var user_auth_roles = idmUtils.getUserRoles(user_id); 
  var user_auth_roles_query_list = user_auth_roles.map(isIdCertifier);
  return qf.or(user_auth_roles_query_list)
}

function isUserOwnerThroughRole(user_id) {
  // queries whether the user has a role that is an owner for the object
  if (user_id === undefined) {
    __.requestError('Missing argument. No user id given to isUserOwnerThroughRole.', 500);
  }
  var user_auth_roles = idmUtils.getUserRoles(user_id); 
  var user_auth_roles_query_list = user_auth_roles.map(isIdOwner);
  return qf.or(user_auth_roles_query_list)
}

function isUserCertifier(user_id) {
  // queries if the user is a certifier directly, through ownership, or through a role
  if (user_id === undefined) {
    __.requestError('Missing argument. No user id given to isUserCertifier.', 500);
  }
  return qf.or([
    isIdCertifier(user_id),
    isUserCertifierThroughRole(user_id)
  ]);
}

function isUserOwner(user_id) {
  // queries if the user is a owner directly or through a role
  if (user_id === undefined) {
    __.requestError('Missing argument. No user id given to isUserOwner.', 500);
  }
  var short_id = idmUtils.ensureUserIdShort(user_id);
  var long_id = idmUtils.ensureUserIdLong(user_id);

  return qf.or([
    isIdOwner(short_id),
    isIdOwner(long_id),
    isUserOwnerThroughRole(user_id)
  ]);
}

function isUserClosedCertifier(user_id) {
  // queries if the user is certifier of closed cert, or is in closedCertifierIds
  if (user_id === undefined) {
    __.requestError('Missing argument. No user id given to isUserCertifier.', 500);
  }
  var user_auth_roles = idmUtils.getUserRoles(user_id);
  user_auth_roles.push(user_id);  // Add user id to list
  var user_auth_roles_query_list = user_auth_roles.map(isClosedEventForId);
  return qf.or(user_auth_roles_query_list);
}

function isStatus(status) {
  return qf.eq('status', status);
}

function isStatusInProgress() {
  return isStatus(CONSTANT.STATUS.IN_PROGRESS);
}

function isStatusCreating() {
  return isStatus(CONSTANT.STATUS.CREATING);
}

function isStatusInProgressOrCreating() {
  return qf.or([
    isStatusInProgress(),
    isStatusCreating(),
  ]);
}

function isStatusNotInProgress() {
  return qf.not(isStatusInProgress());
}

function isStatusException() {
  return isStatus(CONSTANT.STATUS.EXCEPTION);
}

function isViolationStatusInProgress() {
  return qf.or([
    isStatusInProgress(),
    isStatusException()
  ]);
}

function isStatusExpired(){
  return isStatus(CONSTANT.STATUS.EXPIRED);
}

function isStatusSignedOff(){
  return isStatus(CONSTANT.STATUS.SIGNED_OFF);
}

function isStatusExpiredOrSignedOff(){
  return qf.or([
    isStatusExpired(),
    isStatusSignedOff(),
  ])
}

function isStatusRemediated(){
  return isStatus(CONSTANT.STATUS.REMEDIATED);
}

function isStatusExceptionExpried(){
  return isStatus(CONSTANT.STATUS.EXCEPTION_EXPIRED);
}

function isStatusException(){
  return isStatus(CONSTANT.STATUS.EXCEPTION);
}

function isStatusExpiredOrExceptionOrRemediated(){
  return qf.or([
    isStatusRemediated(),
    isStatusExceptionExpried(),
    isStatusException(),
    isStatusExpired(),
  ])
}


function isRoleClosedCertifier(role_id) {
  // queries if the role is certifier of closed cert, or is in closedCertifierIds
  if (role_id === undefined) {
    __.requestError('Missing argument. No user id given to isUserCertifier.', 500);
  }
  var role_auth = [ role_id ]
  var role_auth_query_list = role_auth.map(isClosedEventForId);
  return qf.or(role_auth_query_list);
}

function isIdClosedCertifier(id) {
  if (id.indexOf('managed/user') > -1) {
    return isUserClosedCertifier(id)
  }
  else {
    return isRoleClosedCertifier(id)
  }
}

function isEventInCampaign(campaign_id) {
  // when querying the "user event repo path" (to get events), this queries whether the event belongs to a particular stage
  // note(ML): We really do want to treat empty events as if they don't exist anywhere, hence the !(status eq "empty").
  return qf.and([
    qf.eq('campaignId', campaign_id),
    qf.not(isStatus(CONSTANT.STATUS.EMPTY)),
  ]);
}

function isEventInCampaignWithEmpty(campaign_id) {
  // when querying the "user event repo path" (to get events), this queries whether the event belongs to a particular stage
  // Allows empty events to be returned
    return qf.eq('campaignId', campaign_id)
}

function isEventInStage(campaign_id, stage_index, allow_empty) {
  // when querying the "user event repo path" (to get events), this queries whether the event belongs to a particular stage
  // both campaign id and stage index and needed to uniquely identify a stage
  var isInCampaign = allow_empty ? isEventInCampaignWithEmpty(campaign_id) : isEventInCampaign(campaign_id)
  return qf.and([
    isInCampaign,
    qf.eq('stageIndex', stage_index.toString()),
  ]);
}

function isEventExactly(campaign_id, stage_index, event_index) {
  // when querying the "user event repo path", queries for an event using the campaign id, stage index, and event index
  return qf.and([
    isEventInStage(campaign_id, stage_index),
    qf.eq('eventIndex', event_index.toString()),
  ]);
}

function isEventOneOf(campaign_id, stage_index, event_indexes) {
  var event_index_queries = event_indexes.map(function(event_index) {
    return qf.eq('eventIndex', event_index.toString())
  })
  var event_index_one_of_query = qf.or(event_index_queries);
  return qf.and([
    isEventInStage(campaign_id, stage_index),
    event_index_one_of_query,
  ]);
}

function isEventInStageForCertifierId(campaign_id, stage_index, certifier_id) {
  // when querying the "user event repo path" (to get events), this queries whether the event belongs to a particular stage AND is for the certifier_id
  if (!stage_index) {
    return qf.and([
      isEventInCampaign(campaign_id),
      isIdCertifier(certifier_id),
    ]);
  }
  else {
    return qf.and([
      isEventInStage(campaign_id, stage_index),
      isIdCertifier(certifier_id)
    ]);
  }
}

function isClosedEventForId(certifierId) {
  return qf.or([
    qf.co('closedCertifierIds', certifierId),
    qf.and([
      qf.eq('certifierId', certifierId),
      qf.or([
        isStatus(CONSTANT.STATUS.SIGNED_OFF),
        isStatus(CONSTANT.STATUS.EXPIRED),
      ])
    ]),
  ])
}

function certContainmentFilter(string_to_contain) {
  return qf.or([
    qf.co('name', string_to_contain),
    qf.co('type', string_to_contain),
    qf.co('certObjectType', string_to_contain),
    qf.co('startDate', string_to_contain),
  ]);
}

function eventContainmentFilter(string_to_contain) {
  return qf.or([
    qf.co('firstName', string_to_contain),
    qf.co('lastName', string_to_contain),
    qf.co('email', string_to_contain),
    qf.co('riskScore', string_to_contain),
  ]);
}

function violationContainmentFilter(string_to_contain) {
  return qf.or([
    qf.co('policyName', string_to_contain),
    qf.co('target', string_to_contain),
  ]);
}

function getObjectsToEscalate(date) {
  return qf.and([
    qf.or([
      qf.lt('nextEscalation', date),
      qf.lt('escalationDate', date),
    ]),
    qf.eq('status', 'in-progress'),
  ]);
}

function getObjectsToExpire(date, type) {
  var property = 'expirationDate'
  if (type === 'certification') {
    property = 'nextDeadline';
  } 
  else if (type === 'exception') {
    property = 'exceptionEndDate';
  }
  var status = type === 'exception' ? 'exception' : 'in-progress'; 
  return qf.and([
    qf.lt(property, date),
    qf.eq('status', status),
  ]);
}

function queryCertsByStatus(status, string_to_contain, is_admin) {
  // Gets certs that are in progress and filters them by the `string_to_contain`.
  var query = (is_admin) ? isStatusInProgressOrCreating() : isStatusInProgress();
  if (status === 'active') {
    // query already set up
  } else if (status === 'closed' && is_admin) {
    query = qf.not(query);
  }
  else if(status === 'closed' && !is_admin){
    query = isStatusExpiredOrSignedOff();
  } 
  else {
    __.requestError('Status ' + status + ' not supported.', 400);
  }
  // add filter to query
  if (string_to_contain) {
    var extra_query = certContainmentFilter(string_to_contain);
    query = qf.and([query, extra_query]);
  }
  return query;
}

function queryViolationsByStatus(status, string_to_contain, owner_id, target_id) {
  // Gets certs that are in progress and filters them by the `string_to_contain`.
  if (!status && !string_to_contain && !owner_id && !target_id) {
    return 'true';
  }
  var query = isStatusInProgress();
  if (status === 'active') {
    // query already set up
  } else if (status === 'closed') {
    query = qf.not(isViolationStatusInProgress());
  } else if (status === 'exception') {
    query = isStatusException();
  } else if (!status) {
    query = 'true';
  }
  else { 
    __.requestError('Status ' + status + ' not supported.', 400);
  }
  // add filter to query
  if (string_to_contain) {
    var extra_query = violationContainmentFilter(string_to_contain);
    query = qf.and([query, extra_query]);
  }
  if (owner_id) {
    var extra_query = isUserOwner(owner_id);
    query = qf.and([query, extra_query]);
  }
  if (target_id) {
    var extra_query = isIdTarget(target_id)
    query = qf.and([query, extra_query]);
  }

  return query;
}

function dashboardViolationsByStatus(status,string_to_contain, is_admin){
  var query = '';
  if(status === 'active'){
    query = (is_admin) ? isStatusInProgressOrCreating() : isStatusInProgress();
  }
  else if(status === 'closed'){
    query = isStatusExpiredOrExceptionOrRemediated();
  }
  else{
    __.requestError('Status ' + status + ' not supported.', 400);
  }
   // add filter to query
   if (string_to_contain) {
    var extra_query = violationContainmentFilter(string_to_contain);
    query = qf.and([query, extra_query]);
  }
  return query;
}

/*
 * @returns string
 */
function queryEventsInCampaignsByTargetId(campaigns, target_user_id) {
  var campaigns_queries = campaigns.map(function(campaign) {
    return qf.eq('campaignId', campaign._id);
  });
  var campaigns_query = qf.or(campaigns_queries);
  var target_id_query = qf.eq('targetId', target_user_id);
  var query = qf.and([target_id_query, campaigns_query]);
  return query;
}

function queryDashboard(status, type, string_to_contain, user_id, userOnly){
  var statusQuery = '';
  var rolesQuery = '';
  var userQuery = '';
  //Get User roles
  var userId = idmUtils.ensureUserIdLong(user_id);
  var roles = idmUtils.getUserRoles(userId);
  if(type === 'violation'){
    statusQuery=dashboardViolationsByStatus(status, string_to_contain, false);
    userQuery = isIdOwner(userId);
    rolesQuery=roles.map(function(role){
      return isIdOwner(role);
    });
  }
  else{
    statusQuery=queryCertsByStatus(status, string_to_contain, false);
    userQuery = status === 'active' ? isIdInEventOpenCertifierId(userId) : isIdInEventClosedCertifierId(userId);
    rolesQuery = roles.map(function(role){
      return status === 'active' ? isIdInEventOpenCertifierId(role) : isIdInEventClosedCertifierId(role);
    });
  }
  if (userOnly) {
    return qf.and([statusQuery, userQuery]);
  }
  else {
    return qf.and([statusQuery, qf.or([qf.or(rolesQuery), userQuery])]);
  }
}

module.exports = __.extendedStrict(qf, {
  isIdCertifier: isIdCertifier,
  isStatus: isStatus,
  isStatusInProgress: isStatusInProgress,
  isStatusInProgressOrCreating: isStatusInProgressOrCreating,
  isUserCertifierThroughRole: isUserCertifierThroughRole,
  isUserCertifier: isUserCertifier,
  isUserOwner: isUserOwner,
  isEventInCampaign: isEventInCampaign,
  isEventInStage: isEventInStage,
  isEventExactly: isEventExactly,
  isEventOneOf: isEventOneOf,
  isClosedEventForId: isClosedEventForId,
  isEventInStageForCertifierId: isEventInStageForCertifierId,
  isUserClosedCertifier: isUserClosedCertifier,
  certContainmentFilter: certContainmentFilter,
  eventContainmentFilter: eventContainmentFilter,
  violationContainmentFilter: violationContainmentFilter,
  queryCertsByStatus: queryCertsByStatus,
  queryViolationsByStatus: queryViolationsByStatus,
  queryEventsInCampaignsByTargetId: queryEventsInCampaignsByTargetId,
  isRoleClosedCertifier: isRoleClosedCertifier,
  isIdClosedCertifier: isIdClosedCertifier,
  isIdCertifierOfActive: isIdCertifierOfActive,
  queryDashboard: queryDashboard,
  isObjectClaimedBy: isObjectClaimedBy,
  getObjectsToEscalate: getObjectsToEscalate,
  getObjectsToExpire: getObjectsToExpire,
});
