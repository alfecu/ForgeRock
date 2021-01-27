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
var moment = require('commons/lib/moment.js')
var idmUtils = require('commons/utils/idmUtils.js');
var COMMONSCONSTANT = require('commons/utils/globalConstants.js');
var CONSTANT = require('idg/utils/globalConstants.js');
var utils = require('idg/utils/generalUtilities.js');
var displayUtils = require('idg/utils/displayUtils.js');
var qf = require('idg/utils/queryFilter.js');

var USERNAME = null
var USER_ID = null
var INTERNAL = false
var AUTH_ROLES = null;

run();
function run() {
	var authInfo = openidm.read('info/login');
	USER_ID = authInfo.authorization.id
	USERNAME = authInfo.authenticationId;
	AUTH_ROLES = authInfo.authorization.roles;
	INTERNAL = authInfo.authorization.component === 'internal/user';

	// Taking action on a violation
	if (utils.methodIs('ACTION') && 
		utils.urlParamsCount(request.resourcePath, 1)
	) {
		// Get violation
		var violation = openidm.read(CONSTANT.REPO_PATH.VIOLATION + request.resourcePath) 
		if (!violation) {
			__.requestError('Unable to read violation.', 400);
		}

		// Grab info for auditing
		var oldViolation = __.cloneDeep(violation);

		if (violation.status === CONSTANT.STATUS.CANCELLED ||
			violation.status === CONSTANT.STATUS.REMEDIATED ||
			violation.status === CONSTANT.STATUS.EXPIRED ||
			violation.status === CONSTANT.STATUS.EXCEPTION_EXPIRED ||
			(violation.status === CONSTANT.STATUS.EXCEPTION && !utils.actionIs('CANCELEXCEPTION', request.action))) {
				__.requestError('Cannot take this action on a completed violation.', 400);
			}
		
		if (utils.actionIs('CANCEL', request.action)) {
			isAdmin();
			if (violation.status !== CONSTANT.STATUS.IN_PROGRESS) {
				__.requestError('Cannot cancel a violation that is not in progress.', 400);
			}
			violation = addCommentToViolation(violation, 'Cancelled by administrator: ' + USER_ID);
			violation.status = CONSTANT.STATUS.CANCELLED;
			violation.completionDate = moment().format();
			violation.completedBy = USER_ID;
		}
		else if (utils.actionIs('REASSIGN', request.action)) {
			isAdmin();
			if (!request.content.newOwnerId || !idmUtils.isLongOwnerId(request.content.newOwnerId)) {
				__.requestError('Must provide a valid ID to reassign to: e.g. managed/user/<ID>', 400);
			}
			if (violation.status !== 'in-progress') {
				__.requestError('Violation is not active, and cannot be reassigned.', 400);
			}
			reassignViolation(violation, request.content.newOwnerId);
		}
		else if (utils.actionIs('CANCELEXCEPTION', request.action)) {
			isAdmin();
			if (violation.status !== CONSTANT.STATUS.EXCEPTION) {
				__.requestError('Violation does not have an existing exception to cancel.', 400);
			}
			violation = addCommentToViolation(violation, 'Violation exception cancelled by ' + USERNAME);
			violation.exceptionEndDate = moment().format();
			violation.completionDate = moment().format();
			violation.completedBy = USER_ID;
			violation.status = CONSTANT.STATUS.EXCEPTION_EXPIRED;
		}
		// Check ownership for all other types of actions
		else {
			checkUserOwnsViolation(violation.owner)

			// Comment action
			if (utils.actionIs('COMMENT', request.action)) {
				if (!request.content.comments) {
					__.requestError('Must include comments in request.', 400);
				}
				violation = addCommentToViolation(violation, request.content.comments);
			}
			// Approve action
			else if (utils.actionIs('APPROVE', request.action)) {
				if (!request.content.comments || !request.content.expirationDate) {
					__.requestError('Must include comments and expiration date in request.', 400);
				}
				violation = addCommentToViolation(violation, request.content.comments);
				violation.status = CONSTANT.STATUS.EXCEPTION;
				violation.exceptionStartDate = moment().format();
				violation.exceptionEndDate = moment(request.content.expirationDate).format()
				violation.completedBy = USER_ID;
				sendViolationNotification('governance/sendNotification/POLICY_EXCEPTION', violation);
			}
			// Remediate action
			else if (utils.actionIs('REMEDIATE', request.action)) {
				violation.status = CONSTANT.STATUS.REMEDIATED;
				violation.completionDate = moment().format();
				violation.completedBy = USER_ID;
				if (violation.remediationProcess && violation.remediationProcess !== null) {
					createWorkflowInstance(violation);
				}
				sendViolationNotification('governance/sendNotification/POLICY_REMEDIATION', violation);
			}
		}

		// Update repo
		openidm.update(CONSTANT.REPO_PATH.VIOLATION + request.resourcePath, null, violation);

		// Create audit entry
		var message = 'The violation with id ' + violation._id + ' had action ' + request.action + ' taken on it.'
		createAuditEntry(request.action, oldViolation, violation, message, USERNAME);

		return violation;
	}
	// Bulk cancel
	else if (utils.methodIs('ACTION') && 
		utils.urlParamsCount(request.resourcePath, 0) &&
		utils.actionIs('CANCEL', request.action)
	) {
		isAdmin();
		if (!request.content || !request.content.ids) {
			__.requestError('Request must contain ids to cancel.', 400);
		}
		_.forEach(request.content.ids, function(id) {
			var violation = openidm.read(CONSTANT.REPO_PATH.VIOLATION + id);
			if (violation.status !== CONSTANT.STATUS.IN_PROGRESS) {
				logger.info('Violation with id ' + id + ' could not be cancelled because it is not in-progress.');
				return;
			}
			var oldViolation = __.cloneDeep(violation);
			violation = addCommentToViolation(violation, 'Cancelled by administrator: ' + USER_ID);
			violation.status = CONSTANT.STATUS.CANCELLED;
			violation.completionDate = moment().format();
			violation.completedBy = USER_ID;
			openidm.update(CONSTANT.REPO_PATH.VIOLATION + id, null, violation);

			var message = 'The violation with id ' + id + ' had action cancel taken on it.'
			createAuditEntry(request.action, oldViolation, violation, message, USERNAME);
		})

		return {
			result: 'Violations cancelled.',
		  };
	}
	// Bulk cancel exception
	else if (utils.methodIs('ACTION') && 
		utils.urlParamsCount(request.resourcePath, 0) &&
		utils.actionIs('CANCELEXCEPTION', request.action)
	) {
		isAdmin();
		if (!request.content || !request.content.ids) {
			__.requestError('Request must contain ids to cancel.', 400);
		}
		_.forEach(request.content.ids, function(id) {
			var violation = openidm.read(CONSTANT.REPO_PATH.VIOLATION + id);
			if (violation.status !== CONSTANT.STATUS.EXCEPTION) {
				logger.info('Violation with id ' + id + ' could not have exception cancelled because it is not an exception.');
				return;
			}
			var oldViolation = __.cloneDeep(violation);
			violation = addCommentToViolation(violation, 'Violation exception cancelled by ' + USERNAME);
			violation.exceptionEndDate = moment().format();
			violation.completionDate = moment().format();
			violation.completedBy = USER_ID;
			violation.status = CONSTANT.STATUS.EXCEPTION_EXPIRED;
			openidm.update(CONSTANT.REPO_PATH.VIOLATION + id, null, violation);

			var message = 'The violation with id ' + id + ' had action cancel exception taken on it.'
			createAuditEntry(request.action, oldViolation, violation, message, USERNAME);
		})

		return {
			result: 'Violation exceptions cancelled.',
		  };
	}
	// Bulk reassignment
	else if (utils.methodIs('ACTION') && 
		utils.urlParamsCount(request.resourcePath, 0) &&
		utils.actionIs('REASSIGN', request.action)
	) {
		isAdmin();
		if (!request.content || !request.content.newOwnerId) {
			__.requestError('Request must contain a newOwnerId to reassign to.', 400);
		}
		if (!idmUtils.isLongOwnerId(request.content.newOwnerId)) {
			__.requestError('Request must contain owner IDs in a long format (e.g. managed/user/ID, internal/role/ID.', 400);
		}

		var violations = [];
		if (request.content.ids) {
			_.forEach(request.content.ids, function(id) {
				violations.push(openidm.read(CONSTANT.REPO_PATH.VIOLATION + id));
			});
		}
		else {
			if (!request.content.oldOwnerId || !idmUtils.isLongOwnerId(request.content.oldOwnerId)) {
				__.requestError("To reassign all of a user's violations, request must contain an oldOwnerId in a long format (e.g. managed/user/ID, internal/role/ID).", 400);
			}
			violations = openidm.query(CONSTANT.REPO_PATH.VIOLATION, { _queryFilter: 'status eq "in-progress" and owner eq "' + request.content.oldOwnerId + '"'}).result;
		}
		_.forEach(violations, function(violation) {
			if (violation.status !== CONSTANT.STATUS.IN_PROGRESS) {
				logger.info('Violation with id ' + id + ' could not be reassigned because it is not in-progress.');
				return;
			}
			var oldViolation = __.cloneDeep(violation);
			reassignViolation(violation, request.content.newOwnerId);
			openidm.update(CONSTANT.REPO_PATH.VIOLATION + violation._id, null, violation);
			var message = 'The violation with id ' + violation._id + ' had action ' + request.action + ' taken on it.'
			createAuditEntry(request.action, oldViolation, violation, message, USERNAME);
		});

		return {
			result: 'Violations reassigned successfully.'
		}
	}
	// Creating a new violation
	else if (utils.methodIs('ACTION') && 
		utils.urlParamsCount(request.resourcePath, 0) &&
		utils.actionIs('CREATE', request.action)
	) {	
		var newViolation = request.content

		validateViolation(newViolation);
		if (newViolation.remediationProcess === '') {
			newViolation.remediationProcess = null;
		}
		newViolation.expirationDate = newViolation.expirationDate !== null ? moment(newViolation.expirationDate).format() : null;
		newViolation.escalationDate = newViolation.escalationDate !== null ? moment(newViolation.escalationDate).format() : null;
		newViolation.startDate = moment().format();

		openidm.create(CONSTANT.REPO_PATH.VIOLATION, null, newViolation);
		createAuditEntry('CREATE', null, newViolation, 'Violation created.', 'SYSTEM');
		sendViolationNotification('governance/sendNotification/CREATE_VIOLATION', newViolation);

		return newViolation;
	}
	// Query all violations
	else if (utils.methodIs('READ') &&
			(utils.urlParamsCount(request.resourcePath, 0) ||
			(utils.urlParamsCount(request.resourcePath, 1) && request.resourcePath === 'admin'))
	) {
		// Regular user can not query admin or other paths
		if (request.resourcePath === 'admin' && !isAdmin(true)) {
			__.requestError('User is not authorized to query all violations.', 403);
		}

		var queryParams = request.additionalParameters;
		/*
		 * GET request that returns a list of all violations for URL params
		 * Active: ?status=in+progress,exception
		 * Closed: ?status=cancelled,remediated,expired
		 */
	
		// NOTE: get pagination information from request. Set defaults if not provided
		var PAGE_SIZE = Number(queryParams.pageSize) || 10;
		var PAGE_NUMBER = Number(queryParams.pageNumber) || 1;
		var SORT_BY = queryParams.sortBy || 'policyName';
		var FILTER = queryParams.q || false;
		var STATUS = queryParams.status;
		var FIELDS = queryParams.fields ? queryParams.fields.split(',') : '*';
		var OWNER_ID = request.resourcePath === 'admin' ? queryParams.owner : USER_ID;
		var TARGET_ID = queryParams.target;
		
		var PAGE_OFFSET = (PAGE_NUMBER - 1) * PAGE_SIZE;
		
		// Search for certifications with this Status URL param
		var params = {
		  _queryFilter: qf.queryViolationsByStatus(STATUS, FILTER, OWNER_ID, TARGET_ID),
		  _pageSize: PAGE_SIZE,
		  _pagedResultsOffset: PAGE_OFFSET,
		  _sortKeys: SORT_BY,
		  _fields: FIELDS
		};

		var idMap = {};
		var response = openidm.query(CONSTANT.REPO_PATH.VIOLATION, params);
		response.result = _.map(response.result, function(violation) {
			displayUtils.addDisplayNamesToViolation(violation, null, idMap);
			return violation;
		});
		return response;
	}
	// Read a specific violation
	else if (
		utils.methodIs('READ') &&
		utils.urlParamsCount(request.resourcePath, 1) &&
		request.resourcePath !== 'admin'
	) {
		var violation = openidm.read(CONSTANT.REPO_PATH.VIOLATION + request.resourcePath)
		canViewViolation(violation.owner);
		displayUtils.addDisplayNamesToViolation(violation, null, {});
		return violation;
	}
}

function reassignViolation(violation, newOwnerId) {
	violation.owner = newOwnerId;
	violation = addCommentToViolation(violation, 'Violation task reassigned to ' + getDisplayNameOfId(newOwnerId) + '.');
	sendViolationNotification('governance/sendNotification/CREATE_VIOLATION', violation);
}

function bundleViolation(violation) {
	violation.ownerDisplayName = getDisplayNameOfId(violation.owner);
	if (violation.completedBy) {
		violation.completedByName = idmUtils.getUserName(violation.completedBy)
	}
	violation.targetName = violation.target;
	return violation
}

function checkUserOwnsViolation(owner) {
	var userId = idmUtils.ensureUserIdLong(USER_ID);
	if (idmUtils.isLongRoleId(owner)) {
		var userRoles = idmUtils.getUserRoles(userId);
		if (!_.includes(userRoles, owner)) {
			__.requestError('User is not authorized to take action on this violation.', 403);
		}
	}
	else if (userId !== owner) {
		__.requestError('User is not authorized to take action on this violation.', 403);
	}
}

function getDisplayNameOfId(id) {
	if (id.indexOf('managed/user') === 0) {
		return idmUtils.getUserName(id);
	} else {
		return utils.getRoleDisplayNameFromId(id);
	}
}

function isAdmin(noError) {
	if (!_.includes(AUTH_ROLES, idmUtils.ensureInternalRoleIdLong(COMMONSCONSTANT.ROLE.GOV_ADMIN)) && USERNAME !== 'system' && !INTERNAL) {
		if (noError) {
			return false;
		}
		else {
			__.requestError('User is not authorized to take this action.', 403);
		}
	};
	return true;
}

function canViewViolation(ownerId) {
	if (!isAdmin(true)) {
		checkUserOwnsViolation(ownerId);
	}
}

function addCommentToViolation(violation, comments) {
	var commentObj = {
		timeStamp: moment().format(),
		userId: 'managed/user/' + USER_ID,
		action: 'Comment',
		comment: comments,
	}
	if (!violation.comments) {
		violation.comments = []
	}
	violation.comments.push(commentObj);
	return violation
}

function validateViolation(violation) {
	var requiredFields = ['policyName', 'remediationProcess', 'riskLevel', 'expirationDate', 'expression' , 'owner', 'escalationDate', 'escalated', 'escalationOwner', 'target' , 'targetId', 'status', 'policyId'];
	var missingFields = [];
	_.forEach(requiredFields, function(field) {
		if (!_.has(violation, field)) {
			missingFields.push(field);
		}
	})
	if (missingFields.length > 0) {
		__.requestError('The following fields are required but not present: ' + missingFields.join(', '), 403)
	}
}

function createAuditEntry(eventType, oldViolation, newViolation, message, runAs) {
	var timestamp = moment().format();
	var auditEntry = {
		eventName: 'policy-event',
		transactionId: timestamp,
		timestamp: timestamp,
		userId: newViolation.target,
		runAs: runAs,
		objectId: newViolation.targetId,
		operation: eventType,
		before: oldViolation,
		after: newViolation,
		changedFields: [],
		revision: null,
		passwordChanged: false,
		message: message,
		status: "SUCCESS"
	};
	openidm.create("audit/activity", null, auditEntry);
}

function createWorkflowInstance(violation) {
	var workflowData = {}
	workflowData._key = violation.remediationProcess;
	workflowData.targetId = violation.targetId;
	workflowData.target = violation.userName;
	workflowData.policyId = violation.policyId;
	workflowData.policyName = violation.policyName;
	workflowData.expression = violation.expression;
	openidm.create("workflow/processinstance", null, workflowData)
	createAuditEntry('Remediation started', violation, violation, 'The remediation workflow for the given violation has been instantiated.', USERNAME);
}

function sendViolationNotification(templatePath, violation) {
	var params = {
		toEmailAddress: violation.owner,
		name: violation.policyName,
		user: violation.target
	}
	utils.sendNotification(templatePath, params);
}
