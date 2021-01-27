/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
 
var policy = { "policyId" : "escalationNamePolicy", "policyExec" : "escalationNamePolicy", "clientValidation" : true, "policyRequirements" : [] }

var policy2 = { "policyId" : "certifierNamePolicy", "policyExec" : "certifierNamePolicy", "clientValidation" : true, "policyRequirements" : [] }

var policy3 = { "policyId" : "certifierTypePolicy", "policyExec" : "certifierTypePolicy", "clientValidation" : true, "policyRequirements" : [] }

var policy4 = { "policyId" : "namePolicy", "policyExec" : "namePolicy", "clientValidation" : true, "policyRequirements" : [] }

var policy5 = { "policyId" : "deadlinePolicy", "policyExec" : "deadlinePolicy", "clientValidation" : true, "policyRequirements" : [] }

var policy6 = { "policyId" : "escalationDatePolicy", "policyExec" : "escalationDatePolicy", "clientValidation" : true, "policyRequirements" : [] }

var policy7 = { "policyId" : "escalationTypePolicy", "policyExec" : "escalationTypePolicy", "clientValidation" : true, "policyRequirements" : [] }

var policy8 = { "policyId" : "typePolicy", "policyExec" : "typePolicy", "clientValidation" : true, "policyRequirements" : [] }

var policy9 = { "policyId" : "targetTypePolicy", "policyExec" : "targetTypePolicy", "clientValidation" : true, "policyRequirements" : [] }

var policy10 = { "policyId" : "riskLevelPolicy", "policyExec" : "riskLevelPolicy", "clientValidation" : true, "policyRequirements" : [] }

var policy11 = { "policyId" : "escalatedPolicy", "policyExec" : "escalatedPolicy", "clientValidation" : true, "policyRequirements" : [] }

addPolicy(policy);
addPolicy(policy2);
addPolicy(policy3);
addPolicy(policy4);
addPolicy(policy5);
addPolicy(policy6);
addPolicy(policy7);
addPolicy(policy8);
addPolicy(policy9);
addPolicy(policy10);
addPolicy(policy11);

// If riskLevel is provided, this policy succeeds
function riskLevelPolicy(fullObject, value, params, property) {

	// Type is 'Identity' and risk level is not given
	if (fullObject.type !== undefined && fullObject.type.trim().equalsIgnoreCase("Identity") && (value === undefined))
		return [{"message":"The following validation failed: Risk Level is a required field when Type is 'Identity'"}];
	
	// Type is not 'Identity', but risk level is given
	if (fullObject.type !== undefined && !fullObject.type.trim().equalsIgnoreCase("Identity") && (value !== undefined))
		return [{"message":"The following validation failed: Risk Level is only provided when Type is 'Identity'"}];

	var values = false;
	// Type is 'Identity' and risk level is given
	if (fullObject.type !== undefined && fullObject.type.trim().equalsIgnoreCase("Identity") && (value !== undefined)) {
		var results = [value.length]
		for (var i = 0; i < value.length; i++) {
			values = true;
			// Risk level has to be 3, 5, and/or 7
			if (!(value[i] == 3 || value[i] == 5 || value[i] == 7 || value[i].equalsIgnoreCase("Low") || value[i].equalsIgnoreCase("Medium") || value[i].equalsIgnoreCase("High"))) {
				return [{"message":"The following validation failed: Risk Level acceptable values are: 'Low', 'Medium', or 'High'"}];
			}
			// Prevent duplicate levels
			else if (results[value[i]] == 1) {
				return [{"message":"The following validation failed: Risk Level should only be entered once (no duplicate values)"}];
			}
			else {
				results[value[i]] = 1
			}
		}

		if (!values)
			return [{"message":"The following validation failed: Risk Level acceptable values are: 'Low', 'Medium', or 'High'"}];

		return [];
	}

	return [];
}

// If name is provided, this policy succeeds
function namePolicy(fullObject, value, params, property) {

	if (value === undefined || value.trim().equalsIgnoreCase(""))
		return [{"message":"The following validation failed: Name is a required field"}];

	return [];
}

// If type is either 'Application', 'Identity', or 'Role', this policy succeeds
function typePolicy(fullObject, value, params, property) {

	if (value === undefined || value.trim().equalsIgnoreCase(""))
  		return [{"message":"The following validation failed: Type is a required field"}];

	if (utils.isFieldCertifiable(value) != 1 && !(value.equalsIgnoreCase("Application") || value.equalsIgnoreCase("Identity")))
  		return [{"message":"The following validation failed: Type must be 'Application', 'Identity', or certifiable attribute on managed/user"}];
 
	return [];
}

// Determines if date input in MM/dd/YYYY format is date that exists; accounts for leap year as well
function isValidDate(dateString) {

	var bits = dateString.split('/');
	var month = bits[0], day = bits[1], year = bits[2];

	var daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];

	// If it is a leap year, February has 29 days
	if ((!(year % 4) && year % 100) || !(year % 400)) 
 		daysInMonth[1] = 29;

	return day <= daysInMonth[--month];
}

// If the deadline is a valid and future date, this policy succeeds
function deadlinePolicy(fullObject, value, params, property) {

	if (value === undefined || value.trim().equalsIgnoreCase(""))
 		return [{"message":"The following validation failed: Deadline is a required field"}];

	if (fullObject.frequency != null && fullObject.startDate == null && !fullObject.frequency.equalsIgnoreCase("Ad-hoc") && (fullObject.frequency.equalsIgnoreCase("Scheduled") || fullObject.frequency.equalsIgnoreCase("Event-based"))) {

		var regx = /(^[1-9]\d* (days|weeks)$)/;

		if (!regx.test(value)) {
			return [{"message":"The following validation failed: Deadline must be of the form: '# days/weeks' for scheduled or triggered certifications"}];
		}

		return [];

 	}

 	if (!isValidDate(value))
  		return [{"message":"The following validation failed: Deadline must be a valid date"}];
 
 	//Validation implemented on creation
 	//if (new Date(value) <= new Date())
  		//return [{"message":"The following validation failed: Deadline must be a future date"}];

	return [];
}

// If the escalation date is a valid and future date and later than escalation date, if entered, this policy succeeds
function escalationDatePolicy(fullObject, value, params, property) {

	// Escalation date is not a required field
	if (value === undefined || value.trim().equalsIgnoreCase(""))
 		return [];

		if (fullObject.frequency != null && fullObject.startDate == null && !fullObject.frequency.equalsIgnoreCase("Ad-hoc") && (fullObject.frequency.equalsIgnoreCase("Scheduled") || fullObject.frequency.equalsIgnoreCase("Event-based"))) {
		var regx = /(^[1-9]\d* (days|weeks)$)/;

		if (!regx.test(value)) {
			return [{"message":"The following validation failed: Escalation Date must be of the form: '# days/weeks' for scheduled or triggered certifications"}];
		}

 		return [];

 	}

 	if (!isValidDate(value))
  		return [{"message":"The following validation failed: Escalation date must be a valid date"}];
 
 	//Validation implemented on creation
 	//if (new Date(value) <= new Date())
  		//return [{"message":"The following validation failed: Escalation date must be a future date"}];

 	if (fullObject.deadline !== undefined && new Date(value) >= new Date(fullObject.deadline))
  		return [{"message":"The following validation failed: Escalation date must earlier than deadline"}];

	return [];
}

// Determines if user/role exists
function entityCheck(type, name) {

  // do more extensive error checking and messages, so we don't need to do this
	if (type !== undefined && name !== undefined && !type.equalsIgnoreCase("") && !name.equalsIgnoreCase("")) {

    // If the type is 'Role'
    if (type.equalsIgnoreCase("authzRoles") || type.equalsIgnoreCase("authzGroup")) {

 			var query = openidm.read(name);
 			if (query !== null)
 				return [];

 			return [{"message":"The following validation failed: Does not exist in openidm as a valid instance of authzRoles or authzGroup"}];

  		}
		// If the type is 'User'
 		else if (type.equalsIgnoreCase("User")) {

   			var valParams = { '_queryFilter' : 'userName eq "' + name + '"' };
   			var query = openidm.query("managed/user", valParams);

  		}
		// If the type is 'Manager'
 		else if (type.equalsIgnoreCase("Manager")) {

  			var valParams = { '_queryFilter' : 'userName eq "' + name + '"' };
  			var query = openidm.query("managed/user", valParams, ["reports"]);

  			if (query.result.toString().indexOf("_ref") == -1)
				return [{"message":"The following validation failed: Is not a manager"}];

			return [];
 		}
 		else if (type.equalsIgnoreCase("Application")) {

 			var params = { '_queryFilter' : 'name eq "' + name + '"' };
   			var query = openidm.query("config/provisioner.openicf/", params);

   			// Check if application exists
   			if (query.result.length !== 0)
    			return [];

   			return [{"message":"The following validation failed: Application does not exist"}];
 		}
 		// If type is not 'authzGroup', 'authzRoles', 'User', 'Manager', or 'Application' 
 		else {
  			
  			if (utils.isFieldCertifiable(type) != 1)
  				return [{"message":"Attribute is either not in user object or not certifiable"}];

			var params = {
				managedObject: 'user',
				attribute: type,
			};
  			var possibleVals = openidm.read("governance/getRelationshipObjects", params);
  			
  			var found = 0;
  			var index = 0;
    
    		if (possibleVals != null) {

    			for (index = 0; index < possibleVals.result.length; index++) {
    				if (possibleVals.result[index]._id.equalsIgnoreCase(name)) {
    					found = 1;
    					break;
    				}
    			}

			}

			if (found == 1)
				return [];

  			return [{"message":"The following validation failed: Does not exist in openidm as a valid instance"}];
 		}
	}
	else {
 		return [{"message":"The following validation failed: Type and/or Name were not provided"}];
	}
 
	// Check if managed role or user exists
  	if (query.result.length !== 0)
 		return [];
  
	return [{"message":"The following validation failed: " + name + " does not exist in openidm as a " + type}];
}

// If target type is 'All', 'Application', 'Role', 'User', or 'Manager', this policy succeeds
function targetTypePolicy(fullObject, value, params, property) {

	if (value === undefined || value.trim().equalsIgnoreCase(""))
 		return [{"message":"The following validation failed: Target type is a required field"}];

	if (utils.isFieldCertifiable(value) != 1 && !(value.equalsIgnoreCase("Application") || value.equalsIgnoreCase("All") || value.equalsIgnoreCase("Manager") || value.equalsIgnoreCase("User")))
 		return [{"message":"The following validation failed: Target Type must be 'All', 'User', 'Application', 'Manager', or certifiable attribute on managed/user"}];

 	// instead of hardcoding types, you can declare array at top and populate. In future if it changes, one change
	return [];
}

// If certifier type is 'Role', 'Manager', or 'User', this policy succeeds 
function certifierTypePolicy(fullObject, value, params, property) {

	if (value === undefined || value.trim().equalsIgnoreCase(""))
 		return [{"message":"The following validation failed: Certifier Type is a required field"}];

	if (!(value.equalsIgnoreCase("authzGroup") || value.equalsIgnoreCase("authzRoles") || value.equalsIgnoreCase("Manager") || value.equalsIgnoreCase("User")))
 		return [{"message":"The following validation failed: Certifier Type must be 'User', 'authzGroup', 'authzRoles', or 'Manager'"}];   

	return [];
}

// If certifier type is 'Manager' and no certifier name is provided, this policy succeeds
// If certifier type is 'Role' or 'User' and certifier name is provided, this policy succeeds if the certifier name exists
function certifierNamePolicy(fullObject, value, params, property) {

	if (fullObject.certifierType !== undefined && fullObject.certifierType.equalsIgnoreCase("Manager")) {

 		if (value === undefined || value.trim().equalsIgnoreCase(""))
   			return [];
 
  		return [{"message":"The following validation failed: Certifier Name is only required if the certifier type is not 'Manager'"}];
 
	}

	if (value === undefined || value.trim().equalsIgnoreCase(""))
		return [{"message":"The following validation failed: Certifier Name is a required field when certifiable type is not 'Manager'"}]

	return entityCheck(fullObject.certifierType, value);
}

// If no escalation date and no escalation type are provided, this policy succeeds
function escalationTypePolicy(fullObject, value, params, property) {

// do more extensive checking and error reporting in this function
 	if ((value === undefined || value.trim().equalsIgnoreCase("")) && (fullObject.escalationDate !== undefined && !fullObject.escalationDate.trim().equalsIgnoreCase("")) || 
 		((value !== undefined && !value.trim().equalsIgnoreCase("")) && (fullObject.escalationDate === undefined || fullObject.escalationDate.trim().equalsIgnoreCase(""))))
  		return [{"message":"The following validation failed: Escalation Type is only required if Escalation Date is provided"}];

 	if ((value !== undefined && !value.trim().equalsIgnoreCase("")) && !(value.equalsIgnoreCase("authzGroup") || value.equalsIgnoreCase("authzRoles") || value.equalsIgnoreCase("Manager") || value.equalsIgnoreCase("User")))
  		return [{"message":"The following validation failed: Escalation Type must be 'Manager', 'User', 'authzGroup', or 'authzRoles'"}];

	return [];
}

// If escalation type, date, and name are not provided or escalation type is manager, this policy succeeds
// If the escalation name exists as the escalation type entered, this policy succeeds
function escalationNamePolicy(fullObject, value, params, property) {

// do more extensive checking and error reporting in this function
 	if ((fullObject.escalationDate === undefined || fullObject.escalationDate.trim().equalsIgnoreCase("")) && (fullObject.escalationType === undefined || 
 		fullObject.escalationType.trim().equalsIgnoreCase("")) && (value === undefined || value.trim().equalsIgnoreCase("")))
  		return [];

	if (fullObject.escalationType !== undefined && fullObject.escalationType.equalsIgnoreCase("Manager")) {

 		if (value === undefined || value.trim().equalsIgnoreCase(""))
  			return [];

  		return [{"message":"The following validation failed: Escalation name is only required if the Escalation Type is not 'Manager'"}];
 
	}

	return entityCheck(fullObject.escalationType, value);
}

// Validates that if an escaated date is set, this must either be string true or string false
 function escalatedPolicy(fullObject, value, params, property) {

	if (value === undefined && fullObject.escalationType !== undefined) {
 		return [{"message": "The following validation failed: Escalated must be provided if Escalation Type is provided"}];
 
 		if (!"true".equalsIgnoreCase(value) && !"false".equalsIgnoreCase(value)) {
			return[{"message": "The following validation failed: Escalated must equal either 'true' or 'false'"}];
		}
	}

 	return [];

 }
