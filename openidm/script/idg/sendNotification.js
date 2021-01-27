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
var idmUtils = require('commons/utils/idmUtils.js');

run();
function run() {
    try {
        emailTarget = request.content.toEmailAddress

        if (idmUtils.isLongUserId(emailTarget)) {
            var mail = idmUtils.queryManagedUsers(
                emailTarget,
                ["mail"],
                'READ'
            ).mail
            request.content.toEmailAddress = mail;
            utils.sendNotification("governance/notification/" + request.resourcePath, request.content)
        }
        else if (idmUtils.isLongRoleId(emailTarget)) {
            var reverseProps = [ 'authzMembers', 'members' ];
            var userList = openidm.read(emailTarget, null, reverseProps);
            var users = [];
            _.forEach(reverseProps, function(prop) {
                if (userList[prop]) {
                    users = _.concat(users, userList[prop]);
                }
            });
            for (var i = 0; i < users.length; i++) {
                var user = users[i]
                var props = request.content
                var mail = idmUtils.queryManagedUsers(
                user._ref,
                ["mail"],
                'READ'
                ).mail
                props.toEmailAddress = mail
                utils.sendNotification("governance/notification/" + request.resourcePath, props)
            }
        }
        else {
            logger.warn("Unknown type: " + emailTarget)
        }
        return { message: "success" }
    }
    catch(e) {
        logger.warn('sendNotification.js: Error:' + e.toString())
        logger.warn(e.stack)
    }

    finally {
            utils = null
    }

    
}