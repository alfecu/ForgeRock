/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
A module for validation.  In this file, by convention we throw an error if
something is not valid.

If you are validating a certification itself, then your function belongs in 
certificationValidations.js, not here.

Any other validations are better off here than in endpoints.

Functions in this file should be named after the thing being validated.  For
example, if you are validating that a glossary key is correct, you would name
the function glossaryKey.  In your endpoint, you would import the file with
`var validate = require('idg/utils/validations.js');` and then you would use
your validator with `validate.glossaryKey(inputted_key)`.
*/

var _ = require('commons/lib/lodash4.js');
var __ = require('commons/utils/jsUtils.js');
var CCONSTANT = require('commons/utils/globalConstants.js');
var CONSTANT = require('idg/utils/globalConstants.js');
var utils = require('idg/utils/generalUtilities.js');

function actingId(acting_id, user_id) {
  // Make sure the user (whose id is user_id) is allowed to act on behalf of the acting_id.
  if (_.isUndefined(acting_id)) {
    // The acting id is not used in certain contexts, and hence undefined.  This is okay.
  }
  else if (!idmUtils.isLongOwnerId(acting_id)) {
    var error_message = "The inputted acting id '" + acting_id + "' needs to be a long owner id.";
    __.requestError(error_message, 500);    
  }
  else if (!idmUtils.isOwner(user_id, acting_id)) {
    var error_message = "Access denied.  User '" + user_id + "' may not act on behalf of '" + acting_id + "'.";
    __.requestError(error_message, 403);
  }
  else {
    // It must be valid.
  }
}

function certifierId(certifier_id, certifier_type, user_id) {
  // validate that an event-level certifier id is correct
  if (certifier_type === 'entitlementOwner' || certifier_type === 'glossaryKey') {
    // there should be no certifier id set for the event
    if (certifier_id !== '') {
      __.requestError('In entitlementOwner case, event certifier_id should be "".', 500);
    } 
  }
  else if (certifier_type === 'authzRoles' || certifier_type === 'authzGroup') {
    var auth_roles_of_user = idmUtils.getUserRoles(user_id);
    if (!_.includes(auth_roles_of_user, certifier_id)) {
      __.requestError('User does not have required role.', 403);
    }
  }
  else if (
      certifier_type.equalsIgnoreCase('user') ||
      certifier_type.equalsIgnoreCase('manager') ||
      certifier_type.equalsIgnoreCase('prevManager')
    ) {
    if (certifier_id !== user_id) {
      __.requestError('User Id does not match certifier Id.', 403);
    }
  }
  else {
    __.requestError("Unrecognized certifier type '" + certifier_type + "'.", 500);
  }
}

function eventAction(action) {
  if (!_.includes(CONSTANT.EVENT_ACTIONS, action)) {
    __.requestError('"' + action +'" is not a valid event action.', 406);
  }
}

function stageAction(action) {
  if (!_.includes(CONSTANT.STAGE_ACTIONS, action)) {
    __.requestError('"' + action +'" is not a valid stage action.', 406);
  }
}

function bulkStageAction(action) {
  stageAction(action);
  var allow_bulk_stage_actions = utils.getSettingObjById('allowBulkCertify');
  if ((!allow_bulk_stage_actions) && !_.includes([CONSTANT.STAGE_ACTION.SIGN_OFF, CONSTANT.STAGE_ACTION.CLAIM, CONSTANT.STAGE_ACTION.RESET], action)) {
    __.requestError('Bulk stage actions are forbidden.  You must act on each event individually.', 403);
  }
}

function signOffStageQueryFilter(query_filter) {
  if (query_filter !== CCONSTANT.QUERY_FILTER.TRUE) {
    var message = "The stage sign-off action can only be performed on all events in the stage.  Therefore the _queryFilter must be '" + CCONSTANT.QUERY_FILTER.TRUE + "'.  You cannot sign-off only the selected events.";
    __.requestError(message, 406);
  }
}

function sortByForCerts(sortBy) {
  sortBy = sortBy.replace('+', '').replace('-', '');
  var is_valid = _.includes(['firstName', 'lastName', 'riskScore', 'email'], sortBy);
  if (!is_valid) {
    __.requestError('Sort by ' + SORT_BY + ', is not supported for cert list.', 400);
  }
}

function sortByForClosedUserCerts(sortBy) {
  sortBy = sortBy.replace('+', '').replace('-', '');
  var is_valid = _.includes(['name', 'completionDate', 'totalEvents'], sortBy);
  if (!is_valid) {
    __.requestError('Sort by ' + SORT_BY + ', is not supported for closed user certs.', 400);
  }
}

function stageIndex(stage_index, stages) {
  if (!__.indexExists(stages, stage_index)) {
    __.requestError("The stage indexed '" + stage_index + "' does not exist in the campaign.", 400);
  }
}


module.exports = {
  certifierId: certifierId,
  actingId: actingId,
  eventAction: eventAction,
  bulkStageAction: bulkStageAction,
  signOffStageQueryFilter: signOffStageQueryFilter,
  sortByForCerts: sortByForCerts,
  sortByForClosedUserCerts: sortByForClosedUserCerts,
  stageIndex: stageIndex,
};
