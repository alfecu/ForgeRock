/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */


/*
This file contains utility functions that are specific to campaigns.  This includes functions for lower-level campaign things such as stages, events, and entitlements.

Currently, many functions such as the getEntitlements type functions are meant for the "entitlementOwner" case only, because other types of user certs do not have certifierId and claimedBy keys on the entitlements themselves.
*/
var _ = require('commons/lib/lodash4.js');
var __ = require('commons/utils/jsUtils.js');
var idmUtils = require('commons/utils/idmUtils.js');
var CONSTANT = require('idg/utils/globalConstants.js');
var utils = require('idg/utils/generalUtilities.js');
var c = require('idg/utils/campaign.js');
var glossaryUtils = require('commons/utils/glossaryUtils.js');

// Get the user display format from system settings, query the user object, and return the formatted name
function getDisplayableUserString(user_id) {
    try {
        var user_object = idmUtils.getUser(user_id);
        var format = getSettingObjById("userDisplayFormat").value;
        return __.formatStringTemplate(format, user_object);
    }
    catch (e) {
        logger.info(JSON.stringify(e))
        return user_id;
    }
}

function getSettingObjById(id) {
    // Given `id`, return the object or 'field' whose id is `id`.
    var settings = openidm.read('config/systemSettings').systemSettings;
    for (var i in settings) {
      var section = settings[i];
      var fields = section.fields;
      for (var j in fields) {
        var field = fields[j];
        if (field.id === id) {
          return field
        }
      }
    }
    __.requestError('That field id does not exist in the IDG system settings.', 500);
  }

// Query the glossary for the object_id provided, returning displayName if entry exists, otherwise check for managed object name
function getObjectDisplayName(object_id) {
    var objectDisplayName = null;
    var object = glossaryUtils.getGlossaryObjectForManagedObject(object_id);
    if (object) {
        objectDisplayName = object.displayName;
    }
    // If no glossary object exists, attempt to read name property from object
    else {
        try {
            object = openidm.read(object_id);
            objectDisplayName = object.name;
        }
        catch (e) {
            logger.info("Could not read object with object_id: " + object_id);
        }
    }

    return objectDisplayName || object_id;
}

// Query for campaign and add display names to it 
function getAndAddDisplayNamesForCampaign(campaign_id, type, fields, id_map) {
    var repo_path = null;
    if (type === 'user') {
        repo_path = CONSTANT.REPO_PATH.USER_CERT;     
    }
    else if (type === 'object') {
        repo_path = CONSTANT.REPO_PATH.OBJECT_CERT;
    }
    else {
        return null;
    }
    var campaign = openidm.read(repo_path + campaign_id);
    return addDisplayNamesToCampaign(campaign, fields, id_map);
}

// Query for event and add display names to it
function getAndAddDisplayNamesForEvent(event_id, type, fields, id_map) {
    var repo_path = null;
    if (type === 'user') {
        repo_path = CONSTANT.REPO_PATH.USER_CERT;     
    }
    else if (type === 'object') {
        repo_path = CONSTANT.REPO_PATH.OBJECT_CERT;
    }
    else {
        return null;
    }
    var event = openidm.read(repo_path + event_id);
    return addDisplayNamesToEvent(event, fields, id_map);
}

// Query for violation and add display names to it 
function getAndAddDisplayNamesForViolation(violation_id, fields, id_map) {
    var violation = openidm.read(CONSTANT.REPO_PATH.VIOLATION + violation_id);
    return addDisplayNamesToViolation(violation, fields, id_map);
}

/* Given a campaign object, parse through it and retrieve displayable information for any managed objects it contains
*
*  Parameters:
*  campaign - campaign object
*  fields - fields to convert, if null convert all
*  id_map - a map of previously retrieved IDs to improve performance when using function in bulk
*  isAdmin - whether or not this is for an admin view
*  type - campaign type (user/object)
*/
function addDisplayNamesToCampaign(campaign, fields, id_map, isAdmin, type) {
    var isUser = null;
    _.forEach(campaign.stages, function(stage) {
        if (stage.certifierId) {
            stage.certifier = getDisplayObject(stage.certifierId, !isTypeRole(stage.certifierType), id_map);
        }
        if (isAdmin) {
            var stageOpenCertifierIds = stage.openCertifierIds ? stage.openCertifierIds.split(',') : null;
            if (stageOpenCertifierIds && stageOpenCertifierIds.length > 0) {
                stage.openCertifiers = getDisplayObjectList(stageOpenCertifierIds, id_map);
            }
            var stageClosedCertifierIds = stage.closedCertifierIds ? stage.closedCertifierIds.split(',') : null;
            if (stageClosedCertifierIds && stageClosedCertifierIds.length > 0) {
                stage.closedCertifiers = getDisplayObjectList(stageClosedCertifierIds, id_map);
            }
        }
        if (stage.escalationId) {
            stage.escalator = getDisplayObject(stage.escalationId, !isTypeRole(stage.escalationType), id_map);
        }
        if (stage.escalationSchedule) {
            _.forEach(stage.escalationSchedule, function(escalation) {
                escalation.escalator = getDisplayObject(escalation.escalationId, !isTypeRole(escalation.escalationType), id_map);
            })
        }
        _.forEach(stage.events, function(event) {
            event = addDisplayNamesToEvent(event, null, id_map, isAdmin, type);
        })
    });
    var openCertifierIds = campaign.openCertifierIds ? campaign.openCertifierIds.split(',') : null;
    if (openCertifierIds && openCertifierIds.length > 0) {
        campaign.openCertifiers = getDisplayObjectList(openCertifierIds, id_map);
    }
    var closedCertifierIds = campaign.closedCertifierIds ? campaign.closedCertifierIds.split(',') : null;
    if (closedCertifierIds && closedCertifierIds.length > 0) {
        campaign.closedCertifiers = getDisplayObjectList(closedCertifierIds, id_map);
    }

    return campaign;
}

/* Given a campaign object, parse through it and retrieve displayable information for any managed objects it contains
*
*  Parameters:
*  event - event object
*  fields - fields to convert, if null convert all
*  id_map - a map of previously retrieved IDs to improve performance when using function in bulk
*  type - campaign type (user/object)
*/
function addDisplayNamesToEvent(event, fields, id_map, isAdmin, type) {
    var isUser = null;
    if (event.certifierId) {
        event.certifier = getDisplayObject(event.certifierId, !idmUtils.isLongNonUserId(event.certifierId), id_map);
    }
    if (event.completedBy) {
        event.completedBy = getDisplayObject(event.completedBy, true, id_map);
    }
    if (event.claimedBy) {
        event.claimedBy = getDisplayObject(event.claimedBy, true, id_map);
    }
    if (event.comments) {
        addDisplayNamesToComments(event.comments, id_map);
    }
    var targetId = event.longTargetId || event.targetId;
    if (targetId) {
         event.target = getDisplayObject(targetId, !idmUtils.isLongNonUserId(targetId), id_map);
    }
    var eventData = event.eventData;
    _.forEach(_.keys(eventData), function(key) {
        _.forEach(eventData[key], function(entry) {
            if (entry.comments) {
                addDisplayNamesToComments(entry.comments, id_map);
            }
            var identifier = entry.values ? 'values' : 'attributes';
            if (entry[identifier]) {
                _.forEach(entry[identifier], function(value) {
                    addDisplayNamesToComments(value.comments, id_map);
                })
            }
        });
    });
    var openCertifierIds = event.openCertifierIds ? event.openCertifierIds.split(',') : null;
    if (openCertifierIds && openCertifierIds.length > 0) {
        event.openCertifiers = getDisplayObjectList(openCertifierIds, id_map);
    }
    var closedCertifierIds = event.closedCertifierIds ? event.closedCertifierIds.split(',') : null;
    if (closedCertifierIds && closedCertifierIds.length > 0) {
        event.closedCertifiers = getDisplayObjectList(closedCertifierIds, id_map);
    }
    if (type) {
        event.campaign = getCampaignObject(event.campaignId, type, id_map);
    }
    return event;
}

function addDisplayNamesToComments(commentsList, id_map) {
    _.forEach(commentsList, function(comment) {
        if (comment.userId) {
            comment.user = getDisplayObject(comment.userId, true, id_map);
        }
    });
}

function addDisplayNamesToViolation(violation, fields, id_map) {
    violation.targetUser = getDisplayObject(violation.targetId, true, id_map);
    violation.owner = getDisplayObject(violation.owner, !idmUtils.isLongNonUserId(violation.owner), id_map);
    if (violation.completedBy) {
        violation.completedBy = getDisplayObject(violation.completedBy, true, id_map);
    }
    if (violation.comments) {
        addDisplayNamesToComments(violation.comments, id_map);
    }
    var policy = openidm.read(violation.policyId);
    if (policy) {
        violation.policyDescription = policy.description;
    }
    return violation;
}

function addDisplayNamesToCertificationSummary(summary, fields, id_map) {
    _.forOwn(summary, function(value, key) {
        _.forEach(value, function (entry) {
            if (entry.entitlementId && idmUtils.isLongUserId(entry.entitlementId)) {
                entry.entitlementDisplayName = getDisplayObject(entry.entitlementId, !idmUtils.isLongNonUserId(entry.entitlementId), id_map).displayName;
            }
            _.forEach(entry.certifications, function(certification) {
                certification.certifier = getDisplayObject(certification.certifierId, !idmUtils.isLongNonUserId(certification.certifierId), id_map);
                certification.campaign = getCampaignObject(certification.campaignId, 'user', id_map);
                delete certification.certifierId;
                delete certification.campaignId;
                _.forEach(certification.comments, function(comment) {
                    var identifier = comment.userId ? 'userId' : 'author';
                    if (comment[identifier]) {
                        comment.user = getDisplayObject(comment[identifier], true, id_map);
                        delete comment[identifier];
                    }
                });
            });
        });
    });
}

function isTypeRole(type) {
    return type === CONSTANT.CERTIFIER_TYPE.AUTH_ROLE || type === CONSTANT.CERTIFIER_TYPE.GROUP;
}

function getDisplayObjectList(ids, id_map) {
    var displayObjectList = [];
    _.forEach(ids, function(id) {
        displayObjectList.push(getDisplayObject(id, !idmUtils.isLongNonUserId(id), id_map));
    })
    return displayObjectList;
}

function getDisplayObject(id, isUser, stored_id_map) {
    if (!id) {
        return null;
    }
    return {
        _id: id,
        displayName: getIdForMap(id, isUser, stored_id_map),
    }
}

function getCampaignObject(id, type, stored_id_map) {
    if (!stored_id_map[id]) {
        stored_id_map[id] = c.getCampaign(id, type).name;
    }
    return {
        _id: id,
        displayName: stored_id_map[id],
    };
}

function getIdForMap(id, isUser, stored_id_map) {
    if (!stored_id_map[id]) {
        if (isUser) {
            stored_id_map[id] = getDisplayableUserString(id);
        }
        else {
            stored_id_map[id] = getObjectDisplayName(id);
        }
    }
    return stored_id_map[id];
}

module.exports = {
    getDisplayableUserString: getDisplayableUserString,
    getObjectDisplayName: getObjectDisplayName,
    getDisplayObject: getDisplayObject,
    getDisplayObjectList: getDisplayObjectList,
    getAndAddDisplayNamesForCampaign: getAndAddDisplayNamesForCampaign,
    getAndAddDisplayNamesForEvent: getAndAddDisplayNamesForEvent,
    getAndAddDisplayNamesForViolation: getAndAddDisplayNamesForViolation,
    addDisplayNamesToCampaign: addDisplayNamesToCampaign,
    addDisplayNamesToEvent: addDisplayNamesToEvent,
    addDisplayNamesToViolation: addDisplayNamesToViolation,
    addDisplayNamesToCertificationSummary: addDisplayNamesToCertificationSummary,
}