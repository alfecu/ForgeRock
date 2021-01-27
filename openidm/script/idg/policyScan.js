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
var moment = require('commons/lib/moment.js');
var idmUtils = require('commons/utils/idmUtils.js');
var CONSTANT = require('idg/utils/globalConstants.js');
var utils = require('idg/utils/generalUtilities.js');

var USERNAME = null

run();
function run() {

	try {
		if (input) {
			// If input exists it means this script was invoked from an event
			USERNAME = 'SCHEDULER';
			getScheduledScanAndStartThread(input.scanId);
		}
	} catch (e) {
		var authInfo = openidm.read('info/login');
		USERNAME = authInfo.authenticationId;
	}

	// Delete scheduled policy scan
	// Method: DELETE
	// Usage: openidm/governance/policyScan?_action=delete
	if (utils.methodIs('ACTION') && 
		utils.urlParamsCount(request.resourcePath, 0) &&
		utils.actionIs('DELETE', request.action)
	) {
		var content = request.content;
		if (!content.ids) {
			__.requestError('Must include an array of IDs to delete.', 400);
		}

		_.forEach(content.ids, function(scanId) {
			var scheduledScan = openidm.read(CONSTANT.REPO_PATH.SCHEDULED_POLICY_SCAN + scanId);
			var schedulerId = scheduledScan.schedulerId;
			openidm.delete(CONSTANT.REPO_PATH.SCHEDULER_JOB + schedulerId, null);
			var deletedScan = openidm.delete(CONSTANT.REPO_PATH.SCHEDULED_POLICY_SCAN + scanId, null);
			createAuditEntry('DELETE', deletedScan, null, 'Policy Scan deleted.', USERNAME)
		});

		return {
			result: 'Scans deleted.',
		  };
	}

	// Read a specific scheduled policy scan
	// Method: GET
	// Usage: openidm/governance/policyScan/reactive
	else if (
		utils.methodIs('READ') &&
		utils.urlParamsCount(request.resourcePath, 1) &&
		request.resourcePath === 'reactive'
		) {
			return openidm.read('config/reactivePolicyScan');
		}

	// Read a specific scheduled policy scan
	// Method: GET
	// Usage: openidm/governance/policyScan/<<ID>>
	else if (
		utils.methodIs('READ') &&
		utils.urlParamsCount(request.resourcePath, 1)
		) {
			return openidm.read(CONSTANT.REPO_PATH.SCHEDULED_POLICY_SCAN + request.resourcePath);
		}

	// Query scheduled policy scans
	// Method: GET
	// Usage: openidm/governance/policyScan?q=<<search>>
	else if (
		utils.methodIs('READ') &&
		utils.urlParamsCount(request.resourcePath, 0)
		) {
			var queryParams = request.additionalParameters;
			var PAGE_SIZE = Number(queryParams.pageSize);
			var PAGE_NUMBER = Number(queryParams.pageNumber) || 0;
			var SORT_BY = queryParams.sortBy || 'name';
			var FILTER = queryParams.q || false;
			var PAGE_OFFSET = (PAGE_NUMBER - 1) * PAGE_SIZE;

			var params = {
				_queryFilter: FILTER ? 'name co "' + FILTER + '"' : 'true',
				_pageSize: PAGE_SIZE,
				_pagedResultsOffset: PAGE_OFFSET,
				_sortKeys: SORT_BY
			}
			var results = openidm.query(CONSTANT.REPO_PATH.SCHEDULED_POLICY_SCAN, params);

			return results;
		}

	// Edit scheduled policy scan
	// Method: PUT
	// Usage: openidm/governance/policyScan/<<ID>>
	else if (
		utils.methodIs('CREATE') &&
		utils.urlParamsCount(request.newResourceId, 1)
		) {
			var content = request.content;
			validateScan(content, true);

			var oldScan = openidm.read(CONSTANT.REPO_PATH.SCHEDULED_POLICY_SCAN + request.newResourceId);

			// Schedule has been changed, update scheduler job
			if (oldScan.schedule !== content.schedule) {
				var schedulerObj = openidm.read(CONSTANT.REPO_PATH.SCHEDULER_JOB + oldScan.schedulerId);
				schedulerObj.schedule = content.schedule;
				var updatedSchedulerObj = openidm.update(CONSTANT.REPO_PATH.SCHEDULER_JOB + oldScan.schedulerId, null, schedulerObj);
				content.nextRunDate = updatedSchedulerObj.nextRunDate;
			}
			
			var updatedScan = openidm.update(CONSTANT.REPO_PATH.SCHEDULED_POLICY_SCAN + request.newResourceId, null, content);
			createAuditEntry('CREATE', oldScan, content, 'Scheduled policy scan definition updated.', USERNAME);	

			//TODO update scheduler if schedule changed
			return updatedScan;
		}

	// Check for a user for potential violations
	// METHOD: POST
	// Usage: openidm/governance/policyScan?_action=check
	else if (utils.methodIs('ACTION') && 
		utils.urlParamsCount(request.resourcePath, 0) &&
		utils.actionIs('CHECK', request.action)
	) {
		var content = request.content;
		if (!content.userId || !content.entitlements) {
			__.requestError('Request to check for policy violations requires a userId and entitlements.', 400);
		}
		
		return checkIfEntitlementsWillCauseViolation(userId, entitlements);
	}
	// Create scheduled scan
	// METHOD: POST
	// Usage: openidm/governance/policyScan?_action=schedule
	else if (utils.methodIs('ACTION') && 
		utils.urlParamsCount(request.resourcePath, 0) &&
		utils.actionIs('SCHEDULE', request.action)
	) {
		var content = request.content;
		validateScan(content, true);
		
		// Create scan object
		var scheduledScan = openidm.create(CONSTANT.REPO_PATH.SCHEDULED_POLICY_SCAN, null, content);
		createAuditEntry('CREATE', null, scheduledScan, 'Scheduled policy scan definition created.', USERNAME);

		// Create scheduler job
		var schedulerContent = {
			enabled: true,
			type: 'cron',
			schedule: content.schedule,
			persisted: false,
			misfirePolicy: 'doNothing',
			invokeService: 'org.forgerock.openidm.script',
			invokeContext: {
				script: {
					type: 'javascript',
					file: 'script/idg/policyScan.js',
					input: {
						scanId: scheduledScan._id
					},
				}
			}
		}
		var newScheduledScan = openidm.create(CONSTANT.REPO_PATH.SCHEDULER_JOB, null, schedulerContent);
		createAuditEntry('CREATE', null, newScheduledScan, 'Scheduler object for scheduled scan ' + scheduledScan._id + ' created.', USERNAME);

		// Update scan object with scheduler id
		scheduledScan.schedulerId = newScheduledScan._id;
		scheduledScan.nextRunDate = newScheduledScan.nextRunDate;
		openidm.update(CONSTANT.REPO_PATH.SCHEDULED_POLICY_SCAN + scheduledScan._id, null, scheduledScan);

		return scheduledScan;
	}
	
	// Set configuration for reactive scans
	// METHOD: POST
	// Usage: openidm/governance/policyScan?_action=configure
	else if (utils.methodIs('ACTION') && 
		utils.urlParamsCount(request.resourcePath, 0) &&
		utils.actionIs('CONFIGURE', request.action)
	) {
		var content = request.content;
		validateReactiveConfig(content);
		openidm.update('config/reactivePolicyScan', null, content);
		return content;
	}

	// Create ad-hoc reactive scan on single updated user
	// METHOD: POST
	// Usage: openidm/governance/policyScan?_action=reactive
	else if (utils.methodIs('ACTION') && 
		utils.urlParamsCount(request.resourcePath, 0) &&
		utils.actionIs('REACTIVE', request.action)
	) {
		var content = request.content;
		if (!content.userId) {
			__.requestError('Reactive scan must provide the user id to check.', 400);
		}

		var reactiveConfig = openidm.read('config/reactivePolicyScan');
		if (!reactiveConfig) {
			logger.info('Attemped reactive policy scan for ' + userId + ', but reactive scans are not configured.');
			return;
		}

		logger.info('Beginning reactive scan for user ' + content.userId);
		reactiveScanUser(content.userId);
	}

	// Create ad-hoc scan
	// METHOD: POST
	// Usage: openidm/governance/policyScan?_action=create
	else if (utils.methodIs('ACTION') && 
		utils.urlParamsCount(request.resourcePath, 0) &&
		utils.actionIs('ADHOC', request.action)
	) {
    var policyScan = request.content;
		validateScan(policyScan);
		startPolicyScanThread(policyScan);
		return {
			message: 'Policy scan started.'
		};
	}
	else {
		__.requestError('Request type not supported.', 400);
	}
}

// Read in scheduled scan, prepare it for running
function getScheduledScanAndStartThread(scanId) {
	var scheduledScan = openidm.read(CONSTANT.REPO_PATH.SCHEDULED_POLICY_SCAN + scanId);
	var scanToRun = __.cloneDeep(scheduledScan);

	// Calculate expiration date
	var expiration = scanToRun.expirationDuration.split(' ');
	var interval = parseInt(expiration[0]);
	var expirationDate = moment().add(interval, expiration[1]).format();
	scanToRun.expirationDate = expirationDate;
	delete scanToRun[expirationDuration];

	startPolicyScanThread(scanToRun);

	// Get next run date and update scan repo object
	var schedulerObj = openidm.read(CONSTANT.REPO_PATH.SCHEDULER_JOB + scheduledScan.schedulerId);
	var oldScan = __.cloneDeep(scheduledScan);
	scheduledScan.nextRunDate = schedulerObj.nextRunDate;
	openidm.update(CONSTANT.REPO_PATH.SCHEDULED_POLICY_SCAN + scanId, null, scheduledScan);
	createAuditEntry('CREATE', oldScan, scheduledScan, 'Scheduled policy scan definition updated.', USERNAME);	
}

// Create an audit entry using the given information
function createAuditEntry(eventType, oldPolicyScan, newPolicyScan, message, runAs) {
	var timestamp = moment().format();
	var auditEntry = {
		eventName: 'policy-event',
		transactionId: timestamp,
		timestamp: timestamp,
		//userId: newViolation.target,
		runAs: runAs,
		//objectId: newViolation.targetId,
		operation: eventType,
		before: oldPolicyScan,
		after: newPolicyScan,
		changedFields: [],
		revision: null,
		passwordChanged: false,
		message: message,
		status: "SUCCESS"
	};
	openidm.create("audit/activity", null, auditEntry);
}

// Remove potential unwanted characters from the scheduler string
function formatString(string) {
	if (!string) {
		return null;
	}
	if (string.startsWith('"')) {
		string = string.substring(1)
	}
	if (string.endsWith('"')) {
		string = string.substring(0, string.length - 1)
	}
	return string.trim();
}

// Scan a single user postUpdate against all active policies
function reactiveScanUser(userId) {
	var shortId = idmUtils.ensureUserIdShort(userId);

	var policiesToScan = getActivePolicies([ '_id', 'expression', 'remediationProcess', 'name', 'riskLevel', 'owner']);
	var singleUserTargetExpression = getEqualsExpression('_id', shortId);
	var violationsFound = scanPoliciesForTargetIds(policiesToScan, singleUserTargetExpression); /// THIRD PARAM POLICYSCAN
  	createNewViolations(violationsFound, policiesToScan);
}

// Given a policy scan, grab all attached policies, scan for violations, and create them in the repository
function createViolationsFromScan(policyScan) {
	var policiesToScan = getActivePoliciesFromScan(policyScan);
	var violationsFound = scanPoliciesForTargetIds(policiesToScan, policyScan.targetFilter, policyScan);
	createNewViolations(violationsFound, policiesToScan, policyScan);
}

// Get all active policies in the system
function getActivePolicies(fields) {
	var params = {
		_queryFilter: 'active eq "true"',
	}
	if (fields) {
		params._fields = fields;
	}
	return openidm.query('managed/policy', params).result;
}

// Read in all policies attached to a given scan
function getActivePoliciesFromScan(policyScan) {
	var policiesToScan = [];
	if (policyScan) { 
		var queryFilter = ''
		if (policyScan.riskLevel) {
			if (policyScan.riskLevel.length === 0) {
				return [];
			}
			else {
				queryFilter = getRiskLevelExpression(policyScan.riskLevel);
				policiesToScan = openidm.query('managed/policy', { _queryFilter: queryFilter }).result;
			}
		}
		else if (policyScan.policies && policyScan.policies.length > 0) {
			// Map to short ID for queryFilter
			var idList = _.map(policyScan.policies, function(id) {
				return id.substring(id.lastIndexOf('/') + 1);
			});
			// Grab policies in bunches if there are a large number of policies included
			var count = 0;
			_.forEach(idList, function(policyId) {
				queryFilter = count === 0 ? '(_id eq "' + policyId + '"' : queryFilter + ' or _id eq "' + policyId + '"';
				if (count >= 40) {
					queryFilter += ') and active eq true';
					var queryResults = openidm.query('managed/policy', { _queryFilter: queryFilter }).result;
					policiesToScan = policiesToScan.concat(queryResults);
					queryFilter = '';
					count = 0;
				}
				count += 1;
			});
			// Query for the last group of policies
			if (count > 0) {
				queryFilter += ') and active eq true';
				var queryResults = openidm.query('managed/policy', { _queryFilter: queryFilter }).result;
				policiesToScan = policiesToScan.concat(queryResults);
      }
			policiesToScan = _.flatten(policiesToScan);
		}
	}
	return policiesToScan;
}

// Define the query level used to filter policies by risk
function getRiskLevelExpression(riskArray) {
	var riskLevel = openidm.read('governance/systemSettings', {field: 'riskLevel'}).systemSettings.value;
	var queryfilter = ''

	if (riskArray.length === 3) {
		queryfilter = 'riskLevel pr';
	}
	else if (riskArray.length === 2) {
		if (!_.includes(riskArray, 'low')) {
			queryfilter = 'riskLevel gt "' + riskLevel.lower + '"';
		}
		else if (!_.includes(riskArray, 'high')) {
			queryfilter = 'riskLevel lt "' + riskLevel.higher + '"';
		}
		else {
			queryfilter = 'riskLevel gte "' + riskLevel.higher + '" or riskLevel lte "' + riskLevel.lower + '"';
		}
	}
	else if (riskArray.length === 1) {
		if (_.includes(riskArray, 'low')) {
			queryfilter = 'riskLevel lte "' + riskLevel.lower + '"';
		}
		else if (_.includes(riskArray, 'medium')) {
			queryfilter = 'riskLevel gt "' + riskLevel.lower + '" and riskLevel lt "' + riskLevel.higher + '"';
		}
		else {
			queryfilter = 'riskLevel gte "' + riskLevel.higher + '"';
		}
	}
	return queryfilter;
}

/* Check all policies included within the scan for violating ids
 * policiesToScan - policy objects included in this scan
 * targetExpression - scan target filter
 * activeScan - scan being run to update the active repo object
 * 
 * RETURNS: Object with user IDs as the keys and list of policy ids as the value
*/
function scanPoliciesForTargetIds(policiesToScan, targetExpression, activeScan) {
	var userViolations = {};
	var completed = 0;
	for (var i = 0; i < policiesToScan.length; i++) {
		var policy = policiesToScan[i];
		// Get users targeted by this scan that violate the given policy
		var userIdsWithViolation = scanPolicyForTargetIds(JSON.parse(policy.expression), targetExpression);
		_.forEach(userIdsWithViolation, function(userId) {
			// Add this policy to the violations found for this user
			if (!userViolations[userId]) {
				userViolations[userId] = [];
			}
			userViolations[userId].push(policy._id);
		});
		
		// Update active scan
		if (activeScan) {
			completed += activeScan.targetedUsers;
			activeScan.completed = completed;
			openidm.update(CONSTANT.REPO_PATH.POLICY_SCAN + '/' + activeScan.activeScanId, null, activeScan);
		}
	}

	return userViolations;
}

/* Call the expression parser endpoint with the combination of the policy expression and target filter
 * policyExpression - expression defined on the managed policy
 * targetFilter - filter expression defined on the policy scan
*/
function scanPolicyForTargetIds(policyExpression, targetFilter) {
	var expressionToCheck = combineExpressions(policyExpression, targetFilter)
	var violationIds = openidm.action('governance/expressionParser/user', 'parse', { expression: [ expressionToCheck ] });
	return violationIds;
}

// Return an "AND" of the two given expressions, to find their intersection
function combineExpressions(expression1, expression2) {
	if (!expression1 && !expression2) {
		return null;
	}
	if (!expression1 || expression1 === 'ALL') {
		return expression2;
	}
	else if (!expression2 || expression2 === 'ALL') {
		return expression1;
	}
	return {
		operator: "AND",
		operand: [expression1, expression2],
	}
}

// Iterate over each user with found violations, remove any existing violations from the list, and create the remaining
function createNewViolations(violationsFound, policies, policyScan) {
	_.forEach(_.keys(violationsFound), function(userId) {
		var longUserId = idmUtils.ensureUserIdLong(userId);
		// Find existing violations for the given user
		var existingViolationsForUser = openidm.query(CONSTANT.REPO_PATH.VIOLATION, { _queryFilter: '(status eq "in-progress" or status eq "exception") and targetId eq "' + longUserId + '"' }).result;
		// Map those violations to their IDs
		var existingViolationIdsForUser = _.map(existingViolationsForUser, function(violation) {
			return violation.policyId.substring(violation.policyId.lastIndexOf('/') + 1);
		});
		existingViolationIdsForUser = _.uniq(existingViolationIdsForUser);
		_.forEach(violationsFound[userId], function(policyId) {
			if (_.includes(existingViolationIdsForUser, policyId)) {
				return;
			}
			var policy = _.find(policies, {'_id': policyId});
			var violationObject = buildViolationObject(longUserId, policy, policyScan);
			openidm.action('governance/violation', 'create', violationObject);
		})
	});
}

// Bundle information from user, policy, and scan to create a violation object
function buildViolationObject(userId, policy, policyScan) {
	var remediationProcess = policy.remediationProcess && policy.remediationProcess !== '' ? policy.remediationProcess : null;
	var target = idmUtils.getUserName(userId);

	// If not coming from a scan (e.g. reactive) load in the configuration for expiration/escalation
	if (!policyScan) {
		policyScan = openidm.read('config/reactivePolicyScan');
		var expiration = policyScan.expirationDate.split(' ');
		var interval = parseInt(expiration[0]);
		policyScan.expirationDate = moment().add(interval, expiration[1]).format();
	}

	// Calculate escalation date
	var escalationSchedule = __.cloneDeep(policyScan.escalationSchedule);
	if (escalationSchedule && escalationSchedule.length > 0) {
		var nextEscalation = escalationSchedule.shift();
		var nextIntervalType = nextEscalation.intervalType || 'days';
		policyScan.escalationDate = moment(policyScan.expirationDate).subtract(nextEscalation.interval, nextIntervalType).format();
		policyScan.escalationType = nextEscalation.escalationType;
		if (policyScan.escalationType === CONSTANT.ESCALATION_TYPE.MANAGER) {
			policyScan.escalationOwner = idmUtils.getUserManagerId(userId)
		}
		else {
			policyScan.escalationOwner = idmUtils.isLongRoleId(nextEscalation.escalationId) ? nextEscalation.escalationId : idmUtils.ensureUserIdLong(nextEscalation.escalationId);
		}
	}

  return {
		policyName: policy.name,
		remediationProcess: remediationProcess,
		riskLevel: policy.riskLevel,
		expirationDate: policyScan.expirationDate,
		expression: policy.expression,
		owner: policy.owner._ref,
		escalationDate: policyScan.escalationDate,
		escalationType: policyScan.escalationType,
		escalated: false,
		escalationOwner: policyScan.escalationOwner,
		escalationSchedule: escalationSchedule,
		target: target,
		status: "in-progress",
		targetId: userId,
		policyId: 'managed/policy/' + policy._id,
	 }
}

function validateScan(scan, isScheduled) {
	var scheduledFields = ['name', 'policies', 'schedule', 'targetFilter', 'expirationDuration'];
	var adhocFields = ['name', 'policies', 'targetFilter', 'expirationDate'];
	var requiredFields = isScheduled ? scheduledFields : adhocFields;
	validate(scan, requiredFields);
}

function validateReactiveConfig(config) {
	var requiredFields = ['expirationDate', 'escalationSchedule'];
	validate(config, requiredFields);
}

function validate(object, requiredFields) {
	var missingFields = [];
	_.forEach(requiredFields, function(field) {
		if (!_.has(object, field)) {
			missingFields.push(field);
		}
	})
	if (missingFields.length > 0) {
		__.requestError('The following fields are required but not present: ' + missingFields.join(', '), 403)
	}
}

// Create runnable thread and start it
function startPolicyScanThread(scan) {
	// NOTE: run thread for creating events
	var _buildRunnable = function(scan) {
	  return function() { runAdhocScan(scan); }
	}
	var runnable = _buildRunnable(scan);
	var th_scan = java.lang.Thread(runnable);
	th_scan.start();
}  

// Scan function for background job
function runAdhocScan(scan) {
	try {
		var uniqueId = scan.name + '-' + moment().format();
		scan.uniqueId = uniqueId

		// Calculate totals for scan
		var targetIds = openidm.action('governance/expressionParser/user', 'parse', { expression: scan.targetFilter });
		var targetedUsers = targetIds.length;
		var total = targetedUsers * scan.policies.length;
		scan.total = total;
		scan.targetedUsers = targetedUsers;
		scan.completed = 0;

		// Create active scan repo object
		var activeScan = openidm.create(CONSTANT.REPO_PATH.POLICY_SCAN, null, scan);
		createAuditEntry('CREATE', null, activeScan, 'Ad-hoc policy scan created.', USERNAME);

		// Store active scan ID for updating
		var activeScanId = openidm.query(CONSTANT.REPO_PATH.POLICY_SCAN, { _queryFilter: 'uniqueId eq "' + uniqueId +'"' }).result[0]._id;
		scan.activeScanId = activeScanId;

		// Start scan
		createViolationsFromScan(scan);
	}
	catch (e) {
		logger.warn("Error while running policy scan " + scan.name + ': ' + e.toString());
		logger.warn(e.stack);
	}
	finally {
		// Delete active scan
		openidm.delete(CONSTANT.REPO_PATH.POLICY_SCAN + '/' + scan.activeScanId, null);
	}
}

//Check if a given list of entitlements will cause a violation if added to the user
// TODO  - POST 3.0 Feature
function checkIfEntitlementsWillCauseViolation(userId, entitlements) {
	var shortID = idmUtils.ensureUserIdShort(userId);
	var violationsList = [];

	// If nothing return empty array
	if (!entitlements || !(entitlements.length > 0)) {
		return violationsList;
	}

	// Iterate over each entitlement, scanning relevant policies
	_.forEach(entitlements, function(entitlement) {
		var policiesToScan = getActivePoliciesForEntitlement(entitlement);
		var violationsFound = scanPoliciesForTargetIds(policiesToScan, getEqualsExpression('_id', shortId));
		if (violationsFound[shortId]) {
			_.forEach(violationsFound[shortId], function(policyId) {
				var policyName = _.find(policiesToScan, {'_id': policyId}).name;
				violationList.push({ entitlement: entitlement, policyId: policyId, policyName: policyName });
			})
		}
	});

	return violationsList;
}

/* Get any policy in the system that is active and contains the given entitlement in the expression
 * entitlement - object containing a userProperty (e.g. roles) and an entitlementId (e.g. 'managed/role/id')
 * 
 * RETURN list of policies that are active and targeting the specific entitlement
*/
function getActivePoliciesForEntitlement(entitlement) {
	var expressionSearchTerm = getEqualsExpression(entitlement.userProperty, entitlement.entitlementId);
	var queryFilter = 'active eq "true" and expression co "' + expressionSearchTerm + '"';
	var policies = openidm.query('managed/policy', { _queryFilter: queryFilter }).result;
	return policies
}

function getEqualsExpression(field, value) {
	return {
		operator:"EQUALS",
		operand:
			{
				targetName: field,
				targetValue: value
			}
		};
}