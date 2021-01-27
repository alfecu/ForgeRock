/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/* global openidm */
var _ = require('commons/lib/lodash4.js');

var policy1 = { "policyId" : "nameValidation", "policyExec" : "nameValidation", "clientValidation" : true, "policyRequirements" : [] }

var policy2 = { "policyId" : "riskLevelValidation", "policyExec" : "riskLevelValidation", "clientValidation" : true, "policyRequirements" : [] }

var policy3 = { "policyId" : "activeValidation", "policyExec" : "activeValidation", "clientValidation" : true, "policyRequirements" : [] }

var policy4 = { "policyId" : "ownerValidation", "policyExec" : "ownerValidation", "clientValidation" : true, "policyRequirements" : [] }

addPolicy(policy1);
addPolicy(policy2);
addPolicy(policy3);
addPolicy(policy4);

// If riskLevel is provided, this policy succeeds
function riskLevelValidation(fullObject, value, params, property) {
  
  // Risk level has to be an integer 1-10
  if (value !== undefined && (value < 1 || value > 10)) {
    return [{"message":"The following validation failed: Risk Level acceptable values are in the range of 1 - 10"}];
  }

  return [];
	
}

// If name is provided, this policy succeeds
function nameValidation(fullObject, value, params, property) {

	if (value === undefined || value.trim().equalsIgnoreCase(""))
		return [{"message":"The following validation failed: Name is a required field"}];

	return [];
}

function activeValidation(fullObject, value, params, property) {

	if (value === undefined || value.trim().equalsIgnoreCase(""))
		return [{"message":"The following validation failed: Active is a required field"}];

	if (!(value.trim().equalsIgnoreCase("true") || value.trim().equalsIgnoreCase("false")))
		return [{"message":"The following validation failed: Active must be either 'true' or 'false' " + value}];

	return [];
}

function ownerValidation(fullObject, value, params, property) {

	if (value === undefined)
		return [{"message":"The following validation failed: Owner is a required field"}];

	var query = openidm.read(value._ref);
 	if (query == null)
 		return [{"message":"The following validation failed: '" + value._ref + "' does not exist in openidm as a valid instance of authzRoles, authzGroup, or user"}];

	return [];

}

