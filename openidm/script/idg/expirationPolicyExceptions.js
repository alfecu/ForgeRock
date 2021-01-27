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
var EXCEPTION_EXPIRED_TEMPLATE = 'governance/sendNotification/EXCEPTION_EXPIRED';

run();
function run() {

	var params = {
		_queryFilter: qf.getObjectsToExpire(moment().format(), 'exception')
	}
	var exceptionsToExpire = openidm.query(CONSTANT.REPO_PATH.VIOLATION, params).result
	_.forEach(exceptionsToExpire, function(exceptionToExpire) {

		var violation = __.cloneDeep(exceptionToExpire);
		var VIOLATION_ID = violation._id;
		var outcome = 'Violation expiration: Nothing to process.';

		logger.info("Policy exception expiration started for input: " + JSON.stringify(exceptionToExpire));

		// Only process if exception granted and not marked as complete
		if (violation.status === CONSTANT.STATUS.EXCEPTION) {
			violation.status = CONSTANT.STATUS.EXCEPTION_EXPIRED;

			var params = {
				user: violation.target,
				toEmailAddress: violation.owner
			}

			utils.sendNotification(EXCEPTION_EXPIRED_TEMPLATE, params);

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
				operation: 'EXCEPTION_EXPIRATION',
				before: exceptionToExpire,
				after: updatedViolation,
				changedFields: [],
				revision: updatedViolation._rev,
				passwordChanged: false,
				message: 'The exception for violation number ' + VIOLATION_ID + ' has expired.',
				status: 'SUCCESS'
			};

			utils.createAuditEvent(openidm, auditEntry);

			outcome = 'Violation exception expiration processed.';
			//end:if
		}

		logger.info('Policy expiration script done: ' + outcome);
	});
}