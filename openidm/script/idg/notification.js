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
var utils = require('idg/utils/generalUtilities.js');

var templateConfigEndpoint = "config/governanceTemplates"

run();
function run() {

	if (utils.methodIs('ACTION') &&
		utils.urlParamsCount(request.resourcePath, 0) &&
		utils.actionIs('DELETE', request.action)
	) {
		var content = request.content;
		var _id = content._id
		var readResult = openidm.read(templateConfigEndpoint)
		if (!readResult[_id]) {
			__.requestError("Object " + _id +  " not found in " + context.matchedUri, 404);
		}
		delete content._id
		return {
			result: "success",
		};
	}

	else if (utils.methodIs('READ') &&
		utils.urlParamsCount(request.resourcePath, 1)
	) {
		var _id = request.resourcePath
		var readResult = openidm.read(templateConfigEndpoint)[_id]
		if (!readResult) {
			__.requestError("Object " + _id + " not found in " + context.matchedUri, 404);
		}
		return readResult
	}

// Create Request
	else if (utils.methodIs('CREATE')) {
		var content = request.content;
		var _id = content._id
		var readResult = openidm.read(templateConfigEndpoint)

		var notificationObject = request.content
		if (!readResult[_id]) {
			__.requestError("Object " + _id  + " not found in " + context.matchedUri, 404);
		}
		readResult[_id] = notificationObject

		return openidm.update("config/governanceTemplates", null, readResult)[_id]
	}
// Update Request
	else if (utils.methodIs('UPDATE')) {
		var content = request.content;
		var _id = content._id
		var readResult = openidm.read(templateConfigEndpoint)
		var oldResult = readResult[_id]

		var notificationObject = request.content

		if (_id == null || "".toUpperCase() == _id.toUpperCase() || readResult[_id] == null) {
			__.requestError("Object " + _id + " not found in " + context.matchedUri, 404);
		}

		readResult[_id] = notificationObject

		var auditEntry = {
			eventName: "update-notification",
			userId: utils.getUserNameFromCookie(context),
			runAs: utils.getUserNameFromCookie(context),
			objectId: _id,
			operation: "UPDATE",
			before: oldResult,
			after: readResult[_id],
			changedFields: [],
			revision: 0,
			passwordChanged: false,
			message: "A notification template has been updated",
			status: "SUCCESS"
		}

		utils.createNewAuditEntry(templateConfigEndpoint, null, readResult)[_id]

		return openidm.update(templateConfigEndpoint, null, readResult)[_id]
	}

	else if (utils.methodIs('ACTION')) {
		var _id = request.resourcePath;
		var input = request.content;
		var emailConfig = openidm.read('config/external.email')
		if (!emailConfig.host && !emailConfig.port) {
			return { result: "Outbound email service is not enabled" }
		}
		var emailTemplate = openidm.read(templateConfigEndpoint)[_id]
		if (!emailTemplate.enabled) {
			return { result: "Notification template " + _id + " is not enabled" }
		}

		var patternToMatch = /\$(\{?)x\.\w*(\}?)/g;

		_.forOwn(emailTemplate, function(value, key) {
			var matches = _.words(value, patternToMatch);
			_.forEach(matches, function(word) {
				value = value.replace(word, function() {
					if (word.indexOf('${x') === 0) {
						return input[word.substring(4, word.length - 1)]
					}
					else {
						return input[word.substring(3)];
					}
				})
			});
			emailTemplate[key] = value
		});

		openidm.action("external/email", "send", emailTemplate);

		return { message: "success" }

	}

	else if (utils.methodIs('QUERY')) {
		var result = []

		var response = openidm.read(templateConfigEndpoint);
		_.forOwn(response, function (value, key) {
			if (!key.equalsIgnoreCase("_id")) {
				result.push({
					_id: key,
					displayName: value.displayName
				})
			}
		})
		logger.info("result: " + result)
		return result;
	}

	else if (utils.methodIs('PATCH')) {
		__.requestError('Request type not supported.', 400)
	}
}
