/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

var _ = require('commons/lib/lodash4.js');
var __ = require('commons/utils/jsUtils.js');
var idmUtils = require ('commons/utils/idmUtils.js');
var CONSTANT = require('idg/utils/globalConstants.js');
var utils = require('idg/utils/generalUtilities.js');
var qf = require('idg/utils/queryFilter.js');
var moment = require('commons/lib/moment.js');

var regx = /(^[1-9]\d* (days|weeks)$)/;

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * CERTIFICATION VALIDATIONS
 *  ~~~~~~~~~~~~~~~~~~~~~~~~~ */
function riskLevelPolicy(fullObject, policyViolations) {

  for (var i in fullObject.stages) {
    var value = fullObject.stages[i].riskLevelFilter;

    // Entries must have a risk setting
    if (value === null) {
      policyViolations.push("Risk Level is a required field for certifications.");
      return;
    }

    // If list is empty, all entitlements are included
    if (_.isEmpty(value)) {
      return;
    }

    var values = false;

    // Type is 'Identity' and risk level is given
    var results = [value.length];
    for (var j = 0; j < value.length; ++j) {
      values = true;
      // Risk level has to be 3, 5, and/or 7
      if (
        !(
          value[j] === 3 ||
          value[j] === 5 ||
          value[j] === 7 ||
          value[j].equalsIgnoreCase('Low') ||
          value[j].equalsIgnoreCase('Medium') ||
          value[j].equalsIgnoreCase('High')
        )
      ) {
        policyViolations.push("Risk Level acceptable values are: 'Low', 'Medium', or 'High'");
        return;
      }
      else if (results[value[j]] === 1) { // Prevent duplicate levels
        policyViolations.push("Risk Level should only be entered once (no duplicate values)");
        return;
      }
      else {
        results[value[j]] = 1;
      }
    }//end:for

    if (!values) {
      policyViolations.push("Risk Level acceptable values are: 'Low', 'Medium', or 'High'");
      return;
    }

  } // for i in fullObject.stages
}

// If name is provided, this policy succeeds
function namePolicy(fullObject, value, policyViolations) {
  if (_.isEmpty(value)) {
    policyViolations.push('Name is a required field');
  }
}

// If type is either 'Application', 'Identity', or 'Role', this policy succeeds
function typePolicy(fullObject, value, policyViolations) {
  if (_.isEmpty(value.trim())) {
    policyViolations.push('Type is a required field');
    return;
  }
  if (
    utils.isFieldCertifiable(value) !== 1 &&
    !(
      value.equalsIgnoreCase('Application') ||
      value.equalsIgnoreCase('Identity')
    )
  ) {
    policyViolations.push("Type must be 'Application', 'Identity', or certifiable attribute on managed/user");
    return;
  }
}

// Determines if date input in MM/dd/YYYY format is date that exists; accounts for leap year as well
function isValidDate(dateString) {
  var bits = dateString.split('/');
  var month = bits[0], day = bits[1], year = bits[2];
  var daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];

  // If it is a leap year, February has 29 days
  if ((!(year % 4) && year % 100) || !(year % 400)) {
    daysInMonth[1] = 29;
  }
  return day <= daysInMonth[--month];
}

// If the deadline is a valid and future date, this policy succeeds
function deadlinePolicy(campaignObject, policyViolations) {
  campaignObject.stages.forEach(function(stg, idx, stages) {
    var deadline = stg.deadline;
    var prevDeadline = null;

    if (idx > 0) {
      prevDeadline = stages[idx - 1].deadline;
    }

    if (campaignObject.frequency && campaignObject.frequency.equalsIgnoreCase('Ad-hoc')) {
      var momentDeadline = moment(deadline);

      if (!momentDeadline.isValid) {
        policyViolations.push('Deadline must be a valid date');
        return;
      }

      if (momentDeadline.isSameOrBefore(moment())) {
        policyViolations.push('The following validation failed: deadline date must be a future date');
        return;
      }
  
      if (momentDeadline.isSameOrBefore(moment(prevDeadline))) {
        policyViolations.push('Validation failed: deadline must be greater than previous stage deadline.');
        return;
      }
    }

    if (_.isEmpty(deadline)) {
      policyViolations.push('Deadline is a required field');
      return;
    }

    if (
      campaignObject.frequency &&
      _.isEmpty(campaignObject.startDate) &&
      !campaignObject.frequency.equalsIgnoreCase('Ad-hoc') &&
      (
        campaignObject.frequency.equalsIgnoreCase('Scheduled') ||
        campaignObject.frequency.equalsIgnoreCase('Event-based')
      )
    ) {
      if (!regx.test(deadline)) {
        policyViolations.push("Deadline must be of the form: '# days/weeks' for scheduled or triggered certifications");
      }
      return;
    }
  });//end:foreach
}

// If the escalation date is a valid and future date and later than escalation date, if entered, this policy succeeds
function escalationDatePolicy(fullObject, policyViolations) {
  fullObject.stages.forEach(function(stg) {
    var escalationDate = stg.escalationDate;
    var deadline = stg.deadline;

    if (
      !_.isEmpty(escalationDate) &&
      (moment().format > escalationDate)
    ) {
      policyViolations.push('The following validation failed: escalationDate date must be a future date');
      return;
    }

    // Escalation date is not a required field
    if (_.isEmpty(escalationDate)) {
      return;
    }

    if (
      fullObject.frequency &&
      _.isEmpty(fullObject.startDate) &&
      !fullObject.frequency.equalsIgnoreCase('Ad-hoc') &&
      (
        fullObject.frequency.equalsIgnoreCase('Scheduled') ||
        fullObject.frequency.equalsIgnoreCase('Event-based')
      )
    ) {
      if (!regx.test(escalationDate)) {
        policyViolations.push("Escalation Date must be of the form: '# days/weeks' for scheduled or triggered certifications");
      }
      return;
    }

    if (!isValidDate(escalationDate)) {
      policyViolations.push("Escalation date must be a valid date");
      return;
    }
   
    if (
      deadline &&
      new Date(escalationDate) >= new Date(deadline)
    ) {
      policyViolations.push("Escalation date must earlier than deadline");
    }
  });
}

// Determines if user/role exists
function entityCheck(type, name, policyViolations) {
  var query;
  // do more extensive error checking and messages, so we don't need to do this
  if (!_.isEmpty(type) && !_.isEmpty(name)) {
    // If the type is 'Role'
    if (type.equalsIgnoreCase('authzRoles') || type.equalsIgnoreCase('authzGroup')) {
      query = openidm.read(name);
      if (query) {
        return;
      }
      policyViolations.push("Does not exist in openidm as a valid instance of authzRoles or authzGroup");
      return;
    }
    // If the type is 'User'
    else if (type.equalsIgnoreCase('User')) {
      query = idmUtils.queryManagedUsers(qf.eq('userName', name), ['_id'], 'QUERY');
    }
    // If the type is 'Manager'
    else if (type.equalsIgnoreCase('Manager')) {
      query = idmUtils.queryManagedUsers(qf.eq('userName', name), ['reports'], 'QUERY');

      if (query.toString().indexOf('_ref') == -1) {
        policyViolations.push("Is not a manager");
      }
      return;
    }
    else if (type.equalsIgnoreCase('Application')) {
      var params = { _queryFilter: qf.eq('name', name) };
      query = openidm.query("config/provisioner.openicf/", params);

      // Check if application exists
      if (query.length) {
        return;
      }
      policyViolations.push("Application does not exist");
      return;
    }
    // If type is not 'authzRoles', 'User', 'Manager', or 'Application'
    else {
      if (utils.isFieldCertifiable(type) !== 1) {
        policyViolations.push('Attribute is either not in user object or not certifiable');
        return;
      }
      var params = {
        managedObject: 'user',
        attribute: type,
      };
      var possibleVals = openidm.read('governance/getRelationshipObjects', params);
      var found = 0;
      var index = 0;
    
      if (possibleVals) {
        for (index = 0; index < possibleVals.result.length; index++) {
          if (possibleVals.result[index]._id.equalsIgnoreCase(name)) {
            found = 1;
            break;
          }
        }
      }
      if (found === 1) {
        return;
      }
      policyViolations.push("Does not exist in openidm as a valid instance");
      return;
    }//end:else
  }
  else {
    policyViolations.push("Type and/or Name were not provided");
    return;
  }
 
  // Check if managed role or user exists
  if (query.length !== 0) {
    return;
  }
  policyViolations.push(name + " does not exist in openidm as a " + type);
}

// If target type is 'All', 'Application', 'Role', 'User', or 'Manager', this policy succeeds
function targetTypePolicy(fullObject, value, policyViolations) {
  // Don't require target type when this conditions are true
  if (
    fullObject.frequency.equalsIgnoreCase('event-based') &&
    fullObject.type.equalsIgnoreCase('identity')
  ) {
    return;
  }

  if (_.isEmpty(value)) {
    policyViolations.push('Target type is a required field');
    return;
  }

  if (
    utils.isFieldCertifiable(value) !== 1 &&
    !(value.equalsIgnoreCase('Application') ||
    value.equalsIgnoreCase('All') ||
    value.equalsIgnoreCase('Role') ||
    value.equalsIgnoreCase('Manager') ||
    value.equalsIgnoreCase('User'))
  ) {
    policyViolations.push("Target Type must be 'All', 'User', 'Application', 'Manager', or certifiable attribute on managed/user");
  }
}

// If certifier type is 'Role', 'Manager', 'prevManager', 'User', 'glossaryKey', or 'entitlementOwner', this policy succeeds 
function certifierTypePolicy(fullObject, policyViolations) {
  fullObject.stages.forEach(function(stg) {
    var certifierType = stg.certifierType;

    if (_.isEmpty(certifierType)) {
      policyViolations.push("Certifier Type is a required field");
      return;
    }
    if (!_.includes(CONSTANT.CERTIFIER_TYPES, certifierType)) {
      policyViolations.push("Certifier Type must be 'User', 'authzRoles', 'authzGroup', 'Manager', 'prevManager', 'glossaryKey', or 'entitlementOwner'.");
      return;
    }
    if (certifierType === CONSTANT.CERTIFIER_TYPE.GLOSSARY_KEY && fullObject.certObjectType && fullObject.certObjectType === 'user') {
      policyViolations.push("User certifications cannot have a certifier of type 'glossaryKey'.");
      return;
    }
  });
}

// If certifier type is 'Manager', 'PrevManager, 'entitlementOwner', or 'glossaryKey' and no certifier name is provided, this policy succeeds
// If certifier type is 'Role' or 'User' and certifier name is provided, this policy succeeds if the certifier name exists
function certifierNamePolicy(fullObject, policyViolations) {
  fullObject.stages.forEach(function(singleStage, i, stagesArray) {
    var prevStage = stagesArray[i-1];

    var value = singleStage.certifierName;
    if (
      singleStage.certifierType &&
      (
        singleStage.certifierType.equalsIgnoreCase('Manager') ||
        singleStage.certifierType.equalsIgnoreCase('prevManager') ||
        singleStage.certifierType.equalsIgnoreCase('entitlementOwner') ||
        singleStage.certifierType.equalsIgnoreCase('glossaryKey')
      )
    ) {
      if (singleStage.certifierType.equalsIgnoreCase('prevManager')) {
        if (_.isEmpty(prevStage)) {
          policyViolations.push("prevManager can only be selected when a previous stage exists");
          return;
        }
        else if (_.isObject(prevStage)) {
          if (prevStage.certifierType.equalsIgnoreCase('authzRoles') || prevStage.certifierType.equalsIgnoreCase('authzGroup')) {
            policyViolations.push("prevManager cannot be selected when the previous stage certifierType is role");
            return;
          }
        }
      }

      if (_.isEmpty(value)) {
        return;
      }

      policyViolations.push("Certifier Name is only required if the certifier type is not 'Manager', 'prevManager', nor 'entitlementOwner'.");
      return;
    }
    if (_.isEmpty(value)) {
      policyViolations.push("Certifier Name is a required field when certifiable type is not 'Manager', 'prevManager', nor 'entitlementOwner'.");
      return;
    }

    return entityCheck(singleStage.certifierType, value, policyViolations);
  });
}

// If no escalation date and no escalation type are provided, this policy succeeds
function escalationTypePolicy(fullObject, value, policyViolations) {
  fullObject.stages.forEach(function(singleStage) {
    var value = singleStage.escalationType;

    // do more extensive checking and error reporting in this function
    if (
      _.isEmpty(value) &&
      singleStage.escalationDate ||
      (value && _.isEmpty(singleStage.escalationDate))
    ) {
      policyViolations.push("Escalation Type is only required if Escalation Date is provided");
      return;
    }

    if (
      !_.isEmpty(value) &&
      !(
        value.equalsIgnoreCase('authzRoles') ||
        value.equalsIgnoreCase('authzGroup') ||
        value.equalsIgnoreCase('Manager') ||
        value.equalsIgnoreCase('User')
      )
    ) {
      policyViolations.push("Escalation Type must be 'Manager', 'User', 'authzRoles', or 'authzGroup'");
      return;
    }
  });
}

// If escalation type, date, and name are not provided or escalation type is manager, this policy succeeds
// If the escalation name exists as the escalation type entered, this policy succeeds
function escalationNamePolicy(fullObject, policyViolations) {
  fullObject.stages.forEach(function(singleStage) {
    var value = singleStage.escalationName;

    // do more extensive checking and error reporting in this function
    if (
      _.isEmpty(singleStage.escalationDate) &&
      _.isEmpty(singleStage.escalationType) &&
      _.isEmpty(value)
    ) {
      return;
    }

    if (singleStage.escalationType && singleStage.escalationType.equalsIgnoreCase('Manager')) {
      if (_.isEmpty(value)) {
        return;
      }
      policyViolations.push("Escalation name is only required if the Escalation Type is not 'Manager'");
      return;
    }

    return entityCheck(singleStage.escalationType, value, policyViolations);
  });
}

// Validates that if an escalated date is set, this must either be string true or string false
function escalatedPolicy(fullObject, policyViolations) {
  fullObject.stages.forEach(function(singleStage) {
    var value = singleStage.escalated;

    if (singleStage.escalationType && typeof value !== 'boolean') {
      policyViolations.push("Escalated must be provided if Escalation Type is provided");
    }
  });
}

/*
 * Function _runAllPolicies
 */
function _runAllPolicies(reqBody, policyViolations) {
  riskLevelPolicy(reqBody, policyViolations);
  namePolicy(reqBody, reqBody.name, policyViolations);
  deadlinePolicy(reqBody, policyViolations);
  escalationDatePolicy(reqBody, policyViolations);
  certifierTypePolicy(reqBody, policyViolations);
  certifierNamePolicy(reqBody, policyViolations);
  escalationTypePolicy(reqBody, policyViolations);
  escalationNamePolicy(reqBody, policyViolations);
  escalatedPolicy(reqBody, policyViolations);
}

function validateTargetFilterDictionary(target_filter, object_type) {
  // ML: For now, this function is pretty simple.  In the future, it can do an entire target filter validation.
  // try to find error
  var error = null;
  if (target_filter === null || target_filter === undefined) {
    error = 'Missing target filter. The user filter targetFilter is null or undefined.'
  }
  else if (typeof target_filter !== 'object') {
    error = 'Bad type. The user filter targetFilter is not a JSON object.'
  }
  else if (!('operator' in target_filter)) {
    error = 'Key error. The user filter targetFilter does not have an "operator" key.'
  }
  // throw error if there is one
  if (error) {
    __.requestError(error, 403);
  }
}

function validateTargetFilterArray(tf_array, object_type) {
  for (var index = 0; index < tf_array.length; ++index) {
    var tf = tf_array[index];
    validateTargetFilterDictionary(tf, object_type);
  }
}

function validateTargetFilter(target_filter, object_type) {
  // Checks the target filter and returns an error message or null
  if (__.__isArray(target_filter)) {
    validateTargetFilterArray(target_filter, object_type);
  } else {
    validateTargetFilterDictionary(target_filter, object_type);
  }
}

module.exports = {
  riskLevelPolicy: riskLevelPolicy,
  namePolicy: namePolicy,
  typePolicy: typePolicy,
  deadlinePolicy: deadlinePolicy,
  escalationDatePolicy: escalationDatePolicy,
  targetTypePolicy: targetTypePolicy,
  certifierTypePolicy: certifierTypePolicy,
  certifierNamePolicy: certifierNamePolicy,
  escalationTypePolicy: escalationTypePolicy,
  escalationNamePolicy: escalationNamePolicy,
  escalatedPolicy: escalatedPolicy,
  runAllPolicies: _runAllPolicies,
  validateTargetFilter: validateTargetFilter,
};
