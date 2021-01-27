/*************************************************************************
 *
 * HUB CITY MEDIA CONFIDENTIAL
 * __________________
 *
 *  [2018] Hub City Media
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Hub City Media.  The intellectual and technical concepts contained
 * herein are proprietary to Hub City Media
 * and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Hub City Media.
 *
 * This is not a contribution
 ***************************************************************************/

var _ = require('commons/lib/lodash4.js');
var utils = require('idg/utils/generalUtilities.js');
var __ = require('commons/utils/jsUtils.js');
var idmUtils = require('commons/utils/idmUtils.js');
var CONSTANT = require('idg/utils/globalConstants.js');
var c = require('idg/utils/campaign.js');
var qf = require('idg/utils/queryFilter.js');
var displayUtils = require('idg/utils/displayUtils.js');
var moment = require('commons/lib/moment.js')
var COMMONSCONSTANT = require('commons/utils/globalConstants.js');
var GET_PROFILE = true;
var GET_HISTORY = true;
var SYSTEM = null;
var IS_CONNECTED_SYSTEM = false;
var TARGETID = null;

var USER_EVENT_REPO_PATH = CONSTANT.REPO_PATH.USER_EVENT;
var OBJECT_EVENT_REPO_PATH = CONSTANT.REPO_PATH.OBJECT_EVENT;

run();

function run() {

  var request = this.request;
  var params = request.additionalParameters;

  if (
    utils.methodIs('READ') &&
    (utils.urlParamsCount(request.resourcePath, 2) || utils.urlParamsCount(request.resourcePath, 3))
  ) {
  /*
   * ~~~~~~~~~ TASK ACTIONS ~~~~~~~~
   * method: GET
   * URL: governance/userEventData/user/<user id>
   * params: action=[see below]
   */

    var url = request.resourcePath;
    var urlSegments = url.split('/');

    var TYPE = urlSegments[0];
    TARGETID = urlSegments[1];

    if (TYPE !== 'user') {
      __.requestError('Request not supported.', 400);
    }

    if (utils.urlParamsCount(request.resourcePath, 3)) {
      if (urlSegments[2] === 'profile') {
        GET_HISTORY = false;
      }
      else if (urlSegments[2] === 'history') {
        GET_PROFILE = false;
      }
      else if (urlSegments[2] === 'tasks') {
        return getUserTasks(TARGETID);
      }
      else {
        __.requestError('Request not supported', 400);
      }
    }
    
    SYSTEM = params.system || 'IDM';
    ENTITLEMENT_ID = params.entitlementId;
    IS_CONNECTED_SYSTEM = SYSTEM !== 'IDM';

    // GET HISTORY FOR OBJECT OR USER
    var userProfile = getUserProfile(TARGETID, SYSTEM, ENTITLEMENT_ID);
    return {result: userProfile};
  }
  else if (
    utils.methodIs('READ') &&
    (utils.urlParamsCount(request.resourcePath, 1))
  ) {
      GET_HISTORY = false;
      var url = request.resourcePath;
      var urlSegments = url.split('/');

      var TYPE = urlSegments[0];
      var TARGETID = params.targetId;
      GET_HISTORY = params.history === 'true';
    

      if (TYPE === 'object') {
        if (TARGETID) {
          var objectData = getObjectData(TARGETID);
          return {result: objectData};
        }
        else {
          var entitlementHistory = getUpdatedObjectData();
          return {result: entitlementHistory};
        }
      }
      else {
        __.requestError('Request not supported.', 400);
      }
  }

  __.requestError('Request not supported.', 400);
}

/*
 * Get all user events that are assigned directly to a given user
*/
function getUserTasks(user_id) {
  var queryParams = request.additionalParameters;

  // NOTE: get pagination information from request. Set defaults if not provided
  var PAGE_SIZE = Number(queryParams.pageSize) || 10;
  var PAGE_NUMBER = Number(queryParams.pageNumber) || 0;
  var SORT_BY = queryParams.sortBy || 'policyName';
  var FILTER = queryParams.q || false;
  var STATUS = queryParams.status;
  var FIELDS = queryParams.fields ? queryParams.fields.split(',') : '*';
  var CERT_TYPE = queryParams.certType;

  var PAGE_OFFSET = (PAGE_NUMBER - 1) * PAGE_SIZE;
		
  // Search for certifications with this Status URL param
  var params = {
    _queryFilter: qf.isIdCertifierOfActive(user_id),
    _pageSize: PAGE_SIZE,
    _pagedResultsOffset: PAGE_OFFSET,
    _sortKeys: SORT_BY,
    _fields: FIELDS
  };

  var idMap = {};
  var EVENT_REPO_PATH = CERT_TYPE === 'object' ? CONSTANT.REPO_PATH.OBJECT_EVENT : CONSTANT.REPO_PATH.USER_EVENT;
  var response = openidm.query(EVENT_REPO_PATH, params);
  response.result = _.map(response.result, function(event) {
    displayUtils.addDisplayNamesToEvent(event, null, idMap, CERT_TYPE);
    return event;
  });
  return response;
}

/*
** Getting the user profile consists of the following steps:
** 1. Get certifiable attributes from glossary
** 2. Grab current user data from IDM
** 3. Query all events that target the target user
** 4. Create a profile for the user consisting of every certifiable attribute they have
** 5. Iterate over event history and add the most recent certification of that attribute/object to the profile
** 6. If including user history, add every certification result to the history list
**

1. Query all events that target the target user
2. Iterate over event history and add the most recent certification of every certified attribute/object to the profile
4. Get certifiable attributes from glossary
5. Grab current user data from IDM
6. For any certifiable attribute in the current user data that is not certified, add an entry to profile

** userId - userId to get profile for
** system - System account to target (IDM for idm profile, mapping name for connected systems)
** entitlementID - Specific entitlement to get history for
*/
function getUserProfile(userId, system, entitlementId) {

  var userAttributes = {
    certifiableAttrs: [], 
    displayableAttrs: []
  };

  var idToDisplayName = {
    object: {},
  }

  getCertifiableAttrsForSystem(system, userAttributes);

  // Get current user data from IDM
  var currentData = getCurrentUserData(userId, userAttributes.certifiableAttrs, userAttributes.displayableAttrs, system);

  // Query events that target the given user in reverse chronological order
  var queryParams = {
    _queryFilter: 'targetId eq "' + userId + '" and (status eq "in-progress" or status eq "signed-off")',
    _sortKeys: '-completionDate'
  }
  var eventList = openidm.query(USER_EVENT_REPO_PATH, queryParams).result;

  // Set up data structure
  var history = [];
  var entitlements = {};
  var userInfo = {};
  var profile = {
    userInfo: userInfo,
    entitlements: entitlements,
  };

  // Add non-certifiable information to the profile
  _.forEach(userAttributes.displayableAttrs, function(attr) {
    userInfo[attr] = currentData[attr]
  })

  // Iterate over event list adding each certifiable object to the profile
  _.forEach(eventList, function(event) {
    previousEventCampaignId = event.campaignId;
    var data = null
    if (IS_CONNECTED_SYSTEM) {
      var mappingName = getMappingName(system);
      var mappingGroup = _.find(event.eventData.application, { mapping: mappingName })
      data = mappingGroup ? mappingGroup.attributes : null;
     }
    else { 
      data = event.eventData.managedObject
    }
    _.forEach(data, function(object) {

      var objectIdentifier = IS_CONNECTED_SYSTEM ? object.attributeName : object.objectType

      if (!entitlements[objectIdentifier]) {
        entitlements[objectIdentifier] = [];
      }

      var valueList = object.values && object.values.length > 0 ? object.values : [ object ]
      _.forEach(valueList, function (entitlement) {
        var entitlementEntry = null;
        if (IS_CONNECTED_SYSTEM) {
          entitlementEntry = _.find(entitlements[objectIdentifier], {entitlementDisplayName: entitlement.attributeValue})
        }
        else if (object.values.length > 0) {
          var searchValue = entitlement.fieldValue || entitlement.attributeValue;
          entitlementEntry = _.find(entitlements[objectIdentifier], {entitlementId: searchValue})
        }
        else if (object.objectId) {
          entitlementEntry = _.find(entitlements[objectIdentifier], {entitlementId: entitlement.objectId})
        }
        else {
          entitlementEntry = _.find(entitlements[objectIdentifier], {entitlementDisplayName: entitlement.attributeValue})
        }

        if (!entitlementEntry) {
          entitlementEntry = getBasicProfileEntryForAttribute(object, entitlement, currentData);
          entitlements[objectIdentifier].push(entitlementEntry);
        }

        var certificationEntry = getEntitlementForProfile(entitlement, event, idToDisplayName);
        entitlementEntry.certifications.push(certificationEntry);
      }) 
    })
  });

  // Get managed user schema
  var managed_objects = openidm.read('config/managed').objects;
  var managed_user = _.find(managed_objects, {'name': 'user'});

  // Check current user profile for any items that have NOT been certified yet
  _.forEach(userAttributes.certifiableAttrs, function(attr) {
    var currentAttr = currentData[attr];
    if (!currentAttr) {
      return;
    }
    var attrList = __.__isArray(currentAttr) ? currentAttr : [ currentAttr ];

    _.forEach(attrList, function(item) {
      if (IS_CONNECTED_SYSTEM) {
        if (!_.find(entitlements[attr], {entitlementDisplayName: item})) {
          entitlements[attr] = entitlements[attr] || [];
          entitlements[attr].push({
            entitlementDisplayName: item,
            entitlementId: null,
            attributeName: attr,
            searchId: attr + '/' + item,
            certifications: [],
            isCurrentEntitlement: true,
          });
        }
      }
      else if (item._ref) {
        if (!_.find(entitlements[attr], {entitlementId: item._ref})) {
          if (item._ref === 'internal/role/openidm-authorized') {
            return;
          }
          if (!idToDisplayName.object[item._ref]) {
            var obj = openidm.read(item._ref);
            idToDisplayName.object[item._ref] = obj.name;
          }
          entitlements[attr] = entitlements[attr] || [];
          entitlements[attr].push({
            entitlementDisplayName: idToDisplayName.object[item._ref],
            entitlementId: item._ref,
            attributeName: managed_user.schema.properties[attr].title,
            searchId: attr + '/' + item._ref,
            certifications: [],
            isCurrentEntitlement: true,
          });
        }
      }
      else if (!_.find(entitlements[attr], {entitlementDisplayName: item})) {
        entitlements[attr] = entitlements[attr] || [];
        entitlements[attr].push({
          entitlementDisplayName: item,
          entitlementId: null,
          attributeName: managed_user.schema.properties[attr].title,
          searchId: attr + '/' + item,
          certifications: [],
          isCurrentEntitlement: true,
        });
      }
    });
  });

  // Remove any empty entries
  _.forOwn(entitlements, function(value, key) {
    if (value.length === 0) {
      delete entitlements.key;
    }
  })

  var id_map = {}
  displayUtils.addDisplayNamesToCertificationSummary(entitlements, null, id_map);

  var userProfile = {}
  userProfile.order = managed_user.schema.order;

  if (GET_PROFILE) {
    userProfile.profile = profile;
  }
  if (ENTITLEMENT_ID) {
    userProfile.entitlementId = ENTITLEMENT_ID;
  }
  userProfile.targetId = 'managed/user/' + userId;
  userProfile.system = SYSTEM;
  return userProfile;
}

function getUpdatedObjectData() {
  
  var storedObjectData = openidm.read(CONSTANT.REPO_PATH.ENTITLEMENT_HISTORY);
  if (!storedObjectData) {
    storedObjectData = {
      entitlements: {},
      entitlementTotals: {
        totalCompleted: 0,
      },
    }
    openidm.create('repo/governance/admin/', 'entitlementHistory', storedObjectData);
  }

  storedObjectData.entitlements = storedObjectData.entitlements || {};
  storedObjectData.entitlementTotals = storedObjectData.entitlementTotals || { totalCompleted: 0 };
  var queryParams = {
    _queryFilter: 'status eq "signed-off"',
    _sortKeys: '-completionDate',
  }
  if (storedObjectData.lastUpdated) {
    queryParams._queryFilter += ' and completionDate gt "' + storedObjectData.lastUpdated + '"'
  }

  var updatedObjectData = getDataFromEvents(queryParams, storedObjectData);

  // Nothing to update, return saved data
  if (!updatedObjectData) {
    return storedObjectData;
  }

  calculatePercentages(updatedObjectData.entitlements);
  return updatedObjectData;
}

// Get object data from ALL events for given targetId or if null, all entitlements; does not leverage repo data
function getObjectData(targetId) {
  var objectsData = {}
  var queryParams = {
    _queryFilter: 'status eq "signed-off"',
    _sortKeys: '-completionDate'
  }
  var storedObjectData = openidm.read(CONSTANT.REPO_PATH.ENTITLEMENT_HISTORY);
  return getDataFromEvents(queryParams, storedObjectData, targetId);
}

function getDataFromEvents(queryParams, objectsData, targetId) {
  if (targetId && !GET_HISTORY) {
    if (objectsData && objectsData.entitlements[targetId]) {
      return objectsData.entitlements[targetId];
    }
  }
  var userResult = openidm.query(USER_EVENT_REPO_PATH, queryParams).result;
  var objectResult = openidm.query(OBJECT_EVENT_REPO_PATH, queryParams).result;
  var result = _.concat(userResult, objectResult);

  // Nothing to update
  if (result.length === 0) {
    return null;
  }
  _.forEach(result, function(typeResult) {
    _.forEach(typeResult, function(entry) {
      if (entry.status === 'signed-off') {
        _.forEach(entry.eventData.managedObject, function(object) {
          getDataFromEventObject(objectsData, object, entry, targetId);
        })
        _.forEach(entry.eventData.application, function(application) {
          _.forEach(application.attributes, function(attribute) {
            getDataFromEventObject(objectsData, attribute, entry, targetId);
          })
        })
      }
    });
  });
  if (targetId) {
    return objectsData.entitlements[targetId]
  }
  else {
    return objectsData;
  }
}

function getDataFromEventObject(objectsData, object, entry, targetId) {
  var objectCollection = [];
  var objectIdentifier = '';
  var objectAttributeName = '';
  // Managed objects multi-value
  if (object.values && object.values.length > 0) {
    objectCollection = object.values;
    objectIdentifier = object.values[0] && object.values[0].fieldValue ? 'fieldValue' : 'attributeValue';
    objectAttributeName = object.displayName;
  }
  else {
    objectCollection = [ object ];
    objectAttributeName = object.attributeName;
    // Managed objects non-multi relationship
    if (object.objectId) {
      objectIdentifier = 'objectId'
    }
    // Managed objects non-relationship
    else if (object.objectType) {
      objectIdentifier = object.objectType + '/' + object.attributeValue;
    }
    else {
      objectIdentifier = 'system/' + object.displayName + '/' + object.attributeName + '/' + object.attributeValue;
    }
  }

  _.forEach(objectCollection, function (entitlement) {
    var identifier = entitlement[objectIdentifier] || objectIdentifier;
    if (targetId && targetId !== identifier) {
      return;
    }
    if (entitlement.outcome === 'certify' || entitlement.outcome === 'revoke' || entitlement.outcome === 'abstain') {
      if (!objectsData.entitlements[identifier]) {
        objectsData.entitlements[identifier] = getEntitlementDataObject(entitlement, identifier);
      }
      if (GET_HISTORY) {
        if (!objectsData.entitlements[identifier].history) {
          objectsData.entitlements[identifier].history = [];
        }
        var historyItem = getHistoryEntry(entitlement, entry, objectAttributeName);
        objectsData.entitlements[identifier].history.push(historyItem);
      }
      objectsData.entitlements[identifier][entitlement.outcome]++;
      objectsData.entitlements[identifier].totalCompleted++;
      if (!objectsData.entitlementTotals[entitlement.outcome]) {
        objectsData.entitlementTotals[entitlement.outcome] = 0;
      }
      objectsData.entitlementTotals[entitlement.outcome]++;
      objectsData.entitlementTotals.totalCompleted++;
    }
  })
}

function getEntitlementDataObject(entitlement, identifier, type) {
  var displayName = ''
  if (type === 'application') {
    displayName = entitlement.displayName
  }
  var dataObject = {
    'displayName': entitlement.attributeValue || entitlement.displayName,
    '_id': identifier,
    'certify': 0,
    'revoke': 0,
    'abstain': 0,
    'totalCompleted': 0,
  }
  if (GET_HISTORY) {
    dataObject.history = [];
  }
  return dataObject;
}

function calculatePercentages(entitlements) {
  _.forOwn(entitlements, function(value, key) {
    if (value.totalCompleted > 0) {
      var certifyPercentage = (value.certify / value.totalCompleted) * 100;
      var revokePercentage = (value.revoke / value.totalCompleted) * 100;
      var abstainPercentage = (value.abstain / value.totalCompleted) * 100;
      value.certifyPercentage = certifyPercentage.toFixed(1);
      value.revokePercentage = revokePercentage.toFixed(1);
      value.abstainPercentage = abstainPercentage.toFixed(1);
    }
  })
}

function getHistoryEntry(entitlement, entry, attributeName) {
  var completionDate = entitlement.completionDate ? entitlement.completionDate : entry.completionDate
  return {
    'attributeName': attributeName,
    'targetName': entry.targetName,
    'targetId': entry.longTargetId || entry.targetId,
    'certifierId': entry.certifierId,
    'campaignId': entry.campaignId, 
    'outcome': entitlement.outcome,
    'completionDate': completionDate
  }
}

function getCurrentUserData(userId, certifiableAttrs, displayableAttrs, system) {
  if (IS_CONNECTED_SYSTEM) {
    return getUserDataFromLinkedSystem(system, userId);
  }
  else {
    var certifiableFields = _.union(['*'], certifiableAttrs, displayableAttrs);
    var userData = idmUtils.queryManagedUsers(userId, certifiableFields, COMMONSCONSTANT.IDM_METHOD.READ)
    return userData;
  }
}

function getEntitlementForProfile(entitlement, entry, idToDisplayName) {
  var completionDate = entitlement.completionDate ? entitlement.completionDate : entry.completionDate
  var outcome = completionDate ? entitlement.outcome : 'in-progress';
  var certifierId = entitlement.certifierId || entry.completedBy;
  if (!certifierId) { 
    certifierId = idmUtils.isLongRoleId(entry.certifierId) ? entry.certifierId : idmUtils.ensureUserIdLong(entry.certifierId);
  }

  return {
    certifierId: certifierId,
    completionDate: completionDate,
    outcome: outcome,
    campaignId: entry.campaignId,
    comments: entitlement.comments || [],
  };
}

function getMappingName(target) {
  var syncMappings = openidm.read('config/sync').mappings;
  var mapping = _.find(syncMappings, { target: target, source: 'managed/user' });
  if (mapping) {
    return mapping.name
  }
  else return null;
}

function getUserDataFromLinkedSystem(target, userId) {
  var userId = idmUtils.ensureUserIdShort(userId);

  // Read sync config to find mapping to target
  var mappingName = getMappingName(target);
  var userResourceId = utils.getUserResourceIdFromMapping(userId, mappingName);
  var userData = openidm.read(target + '/' + userResourceId);
  logger.debug("userData: " + JSON.stringify(userData))

  return userData;
}

function getCertifiableAttrsForSystem(system, userAttributes) {
  // Get certifiable attributes from glossary
  var certAttrs = utils.getCertifiableAttrs('user');

  if (IS_CONNECTED_SYSTEM) {
    // Split system attributes into certifiable and displayable
    var systemPath = system.split('/');
    var systemName = systemPath[1];
    var systemObjectType = systemPath[2];
    var systemEntry = certAttrs.system[systemName];
    if (systemEntry && systemEntry._properties) {
      var systemCertAttrs = systemEntry._properties[systemObjectType];
      _.forEach(systemCertAttrs, function(attr) {
        if (attr.certifiable) {
          userAttributes.certifiableAttrs.push(attr.attributeName);
        }
        else if (attr.displayable) {
          userAttributes.displayableAttrs.push(attr.attributeName)
        }
      });
    }
  }
  else {
    // Split IDM attributes into certifiable and displayable
    userAttributes.certifiableAttrs = _.keys(certAttrs.identity);
    userAttributes.displayableAttrs = _.keys(certAttrs.displayable);
  }
}

function getBasicProfileEntryForAttribute(object, entitlement, currentData) {
  var entry = {};

  if (IS_CONNECTED_SYSTEM) {
    entry = {
      entitlementDisplayName: object.attributeValue,
      entitlementId: null,
      attributeName: object.attributeName,
      searchId: object.attributeName + '/' + object.attributeValue,
      certifications: [],
    }
  }
  else if (object.values.length > 0) {
    entry = {
      entitlementDisplayName: entitlement.displayName,
      entitlementId: entitlement.fieldValue || entitlement.attributeValue,
      attributeName: object.objectType,
      attributeDisplayName: object.displayName,
      searchId: object.objectType + '/' + (entitlement.fieldValue|| entitlement.attributeValue),
      certifications: [],
    }
  }
  else {
    entry = {
      entitlementDisplayName: object.attributeValue,
      entitlementId: object.objectId,
      attributeName: object.objectType,
      attributeDisplayName: object.attributeName,
      searchId: object.objectType + '/' + (object.objectId || object.attributeValue),
      certifications: [],
    }
  }

  // Search value from the user's current profile against the new entry to determine if it's their current value
  var currentAttr = currentData[entry.attributeName];
  var valueToSearch = entry.entitlementId || entry.entitlementDisplayName;
  var isCurrent = false;
  if (__.__isArray(currentAttr)) {
    var checkArray = _.map(currentAttr, function(item) {
      return item._ref || item;
    })
    isCurrent = _.includes(checkArray, valueToSearch);
  }
  else {
    isCurrent = (currentAttr._ref || currentAttr) === valueToSearch;
  }
  entry.isCurrentEntitlement = isCurrent;

  return entry;
}