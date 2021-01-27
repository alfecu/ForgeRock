/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
var _ = require('commons/lib/lodash4.js');
var __ = require('commons/utils/jsUtils.js');
var idmUtils = require('commons/utils/idmUtils.js');
var CONSTANT = require('idg/utils/globalConstants.js');
var COMMONSCONSTANT = require('commons/utils/globalConstants.js');
var utils = require('idg/utils/generalUtilities.js');
var displayUtils = require('idg/utils/displayUtils.js');
var qf = require('idg/utils/queryFilter.js');
var moment = require('commons/lib/moment.js')
var VIOLATION_ESCALATED_TEMPLATE = 'governance/sendNotification/VIOLATION_ESCALATED';

run();
function run() {

	var params = {
		_queryFilter: qf.getObjectsToEscalate(moment().format())
	}
	var violationsToEscalate = openidm.query(CONSTANT.REPO_PATH.VIOLATION, params).result

	_.forEach(violationsToEscalate, function(violationToEscalate) {

		var violation = __.cloneDeep(violationToEscalate);
		var VIOLATION_ID = violation._id;
		var outcome = 'Violation escalation: Nothing to process.';

		logger.info("Policy violation escalation started for input: " + JSON.stringify(violationToEscalate));

		// Only process if not already escalated completely					
		var wasEscalated = violation.escalated && (!violation.escalationSchedule || (violation.escalationSchedule && _.isEmpty(violation.escalationSchedule)));

		if (!wasEscalated) {

			// No one set to escalate to
			if (violation.escalationOwner === null || violation.escalationOwner === '') {
				logger.info("Violation with id " + violation._id + " does not have an escalation owner.")
				return; 
			}

			// Calculate manager if policy owner is a user
			if (violation.escalationOwner === 'manager') {
				if (!violation.owner.startsWith('managed/user')) {
					logger.info("Violation " + violation._id + " for " + violation.target + " is for a role owned policy, but has manager escalation.  No notification sent.");
					return;
				}
				// Get policy owner information
				var policyOwnerInfo = idmUtils.queryManagedUsers(violation.owner, ['manager','userName'], COMMONSCONSTANT.IDM_METHOD.READ);
				if (policyOwnerInfo && policyOwnerInfo.manager && policyOwnerInfo.manager._ref) {
					violation.escalationOwner = policyOwnerInfo.manager._ref
				} 
				else {
					logger.info("Policy owner has no manager, no notification sent.");
					return;
				}
			}

			var escalatorIds = idmUtils.getUserIdsFromCertifierIds([violation.escalationOwner]);

			var violationOwnerInfo = displayUtils.getDisplayObject(violation.owner, !idmUtils.isLongRoleId(violation.owner), {});
			var violationTargetInfo = displayUtils.getDisplayObject(violation.targetId, true, {});

			var params = {
				owner: violationOwnerInfo.displayName,
				user: violationTargetInfo.displayName,
			}

			utils.sendNotificationToUsers(escalatorIds, VIOLATION_ESCALATED_TEMPLATE, params);

			if (!violation.escalationSchedule || (violation.escalationSchedule && _.isEmpty(violation.escalationSchedule))) {
				violation.escalated = true;
			}

			// If schedule exists and is not depleted
			if (violation.escalationSchedule && violation.escalationSchedule.length > 0) {
				var nextEscalation = violation.escalationSchedule.shift();
				var nextIntervalType = nextEscalation.intervalType || 'days';
				violation.escalationDate = moment(violation.expirationDate).subtract(nextEscalation.interval, nextIntervalType).format();
				violation.escalationType = nextEscalation.escalationType;
				if (violation.escalationType === CONSTANT.ESCALATION_TYPE.MANAGER) {
					violation.escalationOwner = 'manager';
				}
				else if (violation.escalationType === CONSTANT.ESCALATION_TYPE.USER) {
					violation.escalationOwner = idmUtils.ensureUserIdLong(nextEscalation.escalationId);
				}
				else {
					violation.escalationOwner = nextEscalation.escalationId;
				}
			}

			// NOTE: update repo object for campaign
			var updatedViolation = openidm.update(CONSTANT.REPO_PATH.VIOLATION + VIOLATION_ID, null, violation);

			/*
			* CREATE AUDIT ENTRY
			*/
			var timeStamp = moment().format();
			var auditEntry = {
				timestamp: timeStamp,
				eventName: 'violation-audit',
				transactionId: timeStamp,
				userId: 'system',
				runAs: 'system',
				objectId: 'repo/governance/violation/' + VIOLATION_ID,
				operation: 'ESCALATION',
				before: violationToEscalate,
				after: updatedViolation,
				changedFields: [],
				revision: updatedViolation._rev,
				passwordChanged: false,
				message: 'Violation number ' + VIOLATION_ID + ' has escalated.',
				status: 'SUCCESS'
			};

			utils.createAuditEvent(openidm, auditEntry);

			outcome = 'Violation escalation processed.';
			//end:if
		}

		logger.info('Policy escalation script done: ' + outcome);
	});
}