/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
var _ = require('commons/lib/lodash4.js');
var __ = require('commons/utils/jsUtils.js');
var CONSTANT = require('idg/utils/globalConstants.js');
var utils = require('idg/utils/generalUtilities.js');
var moment = require('commons/lib/moment.js')
var qf = require('idg/utils/queryFilter.js');
var VIOLATION_EXPIRED_TEMPLATE = 'governance/sendNotification/VIOLATION_EXPIRED';

run();
function run() {

	var params = {
		_queryFilter: qf.getObjectsToExpire(moment().format(), 'violation')
	}
	var violationsToExpire = openidm.query(CONSTANT.REPO_PATH.VIOLATION, params).result
	_.forEach(violationsToExpire, function(violationToExpire) {
		var violation = __.cloneDeep(violationToExpire);
		var VIOLATION_ID = violation._id;
		var outcome = 'Violation expiration: Nothing to process.';

		logger.info("Policy violation expiration started for input: " + JSON.stringify(violationToExpire));

		// Only process if not already expired
		if (violation.status === CONSTANT.STATUS.IN_PROGRESS) {
			violation.status = CONSTANT.STATUS.EXPIRED;
			violation.completedBy = 'System';

			var params = {
				user: violation.target,
				toEmailAddress: violation.owner
			}

			utils.sendNotification(VIOLATION_EXPIRED_TEMPLATE, params);

			// NOTE: update repo object for violation
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
				operation: 'EXPIRATION',
				before: violationToExpire,
				after: updatedViolation,
				changedFields: [],
				revision: updatedViolation._rev,
				passwordChanged: false,
				message: 'Violation number ' + VIOLATION_ID + ' has expired.',
				status: 'SUCCESS'
			};

			utils.createAuditEvent(openidm, auditEntry);

			outcome = 'Violation expiration processed.';
			//end:if
		}

		logger.info('Policy expiration script done: ' + outcome);
	});
}