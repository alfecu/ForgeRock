/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */


/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * GENERAL UTILITY FUNCTIONS
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
var _ = require('commons/lib/lodash4.js');
var __ = require('commons/utils/jsUtils.js');
var idmUtils = require('commons/utils/idmUtils.js');
var glossaryCRUD = require('commons/utils/glossaryCRUD.js');
var CONSTANT = require('idg/utils/globalConstants.js');
var displayUtils = require('idg/utils/displayUtils.js');
var moment = require('commons/lib/moment.js');

function methodIs(type) {
  try {
    return request.method.equalsIgnoreCase(type);
  } catch(e) { 
    return false;
  }
}

function actionIs(type, action) {
  if (action) {
    return action.equalsIgnoreCase(type);
  }
  return false;
}

function queryParamsAre(paramsArr) {
  if (paramsArr.length !== _.keys(queryParams).length) {
    return false;
  }
  var allPresent = true;
  for (var i in paramsArr) {
    if (_.isUndefined(queryParams[paramsArr[i]])) {
      allPresent = false;
      break;
    }
  }
  return allPresent;
}

/*
 * Function getUserNameFromCookie
 */
function getUserNameFromCookie(context) {
  try {
    return context.parent.parent.parent.authenticationId;
  } catch(e) {
    return '';
  }
}

/*
 * Function createNewAuditEvent
 */
function createNewAuditEvent(openidm, context, auditEntry2) {
  var timestamp = moment().format();
  var transactionId = '';

  if (!_.isEmpty(auditEntry2.transactionId)) {
    transactionId = auditEntry2.transactionId;
  }
  else if (context !== null || context !== undefined) {
    var ctxObj = context;

    while (ctxObj && ctxObj['parent']) {
      ctxObj = ctxObj['parent'];
      if (ctxObj.transactionId && ctxObj.transactionId.value) {
        transactionId = ctxObj['transactionId']['value'];
        break;
      }
    }
  } else {
    transactionId = timestamp;
  }

  var auditEntry =  {
    timestamp: timestamp,
    transactionId: transactionId
  };

  // Replace updated fields
  _.keys(auditEntry2).forEach(function(it) {
    auditEntry[it] = auditEntry2[it];
  });

  openidm.create('audit/activity', null, auditEntry);
  return auditEntry;
}

/*
 * Function urlParamsCount
 * @param {string} urlFragment, fragment of Url after endpoint name
 * @param {number} count, number of parameters that urlFragment must have
 */
function urlParamsCount(urlFragment, count) {
  if (urlFragment.length === 0) {
    return count === 0 ? true : false;
  }
  return urlFragment.split('/').length === count;
}
/*
 * Function sendNotification
 */
function sendNotification(template, params) {
  try {
    var inetAddr = java.net.InetAddress.getLocalHost();
    var hostname = inetAddr.getHostName();
    var input = new java.io.FileInputStream(identityServer.getInstallLocation() + '/resolver/boot.properties');
    var prop = new java.util.Properties();
    prop.load(input);
    var port = prop.getProperty("openidm.port.http");

    hostname = hostname.replace('ip-', '');
    hostname = hostname.replace('-', '.');
    hostname = hostname + ':' + port;

    params.hostName = hostname;
    openidm.action(template, 'send', params);
  } catch(e) {
    logger.error(e.stack);
    logger.error('Cannot send email. Please check your SMTP logs.');
  }
  return true;
}

function sendNotificationToUser(user_id, template, params) {
  _.assign(params, {toEmailAddress: user_id});
  sendNotification(template, params);
}

function sendNotificationToUsers(user_ids, template, params) {
  // Send the same notification once to each user.
  // eliminate redundancy
  user_ids = _.uniq(user_ids);
  // send notification to each user
  user_ids.forEach(function(user_id) {
    sendNotificationToUser(user_id, template, params);
  });
}

/*
 * Function getUserMail
 */
function getUserMail(openidm, userId) {
  userId = idmUtils.ensureUserIdLong(userId);
  var userObject = idmUtils.queryManagedUsers(userId, ['mail'], 'READ');
  return userObject && userObject.mail ? userObject.mail : userId;
}

function getUserIdsWithAuthRole(role_id) {
  var membershipProperties = openidm.read('config/commons').membershipProperties;
  if (!membershipProperties) {
    __.requestError('commons.json configuration for membershipProperties cannot be read.', 400)
  }
  // given the id of a role (such as internal/role/governance-administrator), return the user ids of either 
  // members or auth members of that role (based on commons.json membershipProperties)
  var roleMembers = [];
  if (membershipProperties.indexOf('roles') >= 0) {
    var roles = openidm.query(role_id + '/members', { '_queryFilter' : 'true' }, [ '_refResourceId' ]);
    roleMembers = roles && roles.result ? roleMembers.concat(roles.result) : roleMembers;
  }
  if (membershipProperties.indexOf('authzRoles') >= 0) {
    var authzRoles = openidm.query(role_id + '/authzMembers', { '_queryFilter' : 'true' }, [ '_refResourceId' ]);
    roleMembers = authzRoles && authzRoles.result ? roleMembers.concat(authzRoles.result) : roleMembers;
  }
  
  var user_ids = _.map(roleMembers, '_refResourceId');
  return _.uniq(user_ids);
}

/*
 * Function createAuditEvent
 */
function createAuditEvent(openidm, auditEntry) {
  var newAudit = {
    timestamp: moment().format(),
    transactionId: moment().format(),
  };

  // Replace updated fields
  Object.keys(auditEntry).forEach(function(key) {
      newAudit[key] = auditEntry[key];
  });

  openidm.create('audit/activity', null, newAudit);
  return newAudit;
}

/*
 * Function _buildWorkflowPayload
 */
function _buildWorkflowPayload(campaignObject, eventIndex, EVENT, STAGE_INDEX, eventRepoPath) {
  // todo: clean up
  var temp = __.cloneDeep(campaignObject);
  temp._key = campaignObject.remediationProcess;

  temp.stages = temp.stages.map(function(stg) {
    // Fetch event with eventIndex for each stage
    if (stg.stageIndex === STAGE_INDEX) {
      return EVENT;
    }
    else {
      var _query = '(campaignId eq "' + campaignObject._id + '") and (stageIndex eq "' + stg.stageIndex + '") and (eventIndex eq "' + eventIndex + '")';
      var queryResult = openidm.query(eventRepoPath, { _queryFilter: _query }).result;

      // Error checking
      if (!queryResult.length) {
        __.requestError('generalUtilities.js :: _buildWorkflowPayload: Event index: ' + eventIndex + ' not found.', 404);
      }
      if (queryResult.length > 1) {
        __.requestError('generalUtilities.js :: _buildWorkflowPayload: More than 1 event found with eventIndex: ' + eventIndex + '.', 400);
      }

      var _event = queryResult[0];
      return _event;
    }
  });
  temp.stageIndex = STAGE_INDEX;

  return temp;
}

/*
 * Function getFormattedDate
 */
function getFormattedDate(date) {
  if (date.indexOf('/') === -1) {
    date = calculateDate(date);
    var format = date.toString();

    var cd = format.split(' ');
    var dayOfWeek = cd[0];
    var month = cd[1];
    var day = cd[2];
    var year = cd[3];
    var time = cd[4];
    var zone = cd[5];

    date = getMonthInt(month) + '/' + day + '/' + year;
  }
  date = date.replace('"', '');
  return date;
}

/*
 * Function getUserId
 * Given target/certifier/escalation name: userName, return id of that user
 */
function getUserId(userName) {
  var valParams = { _queryFilter: 'userName eq "' + userName + '"' };
  var query = openidm.query('managed/user', valParams, ['_id']);
  if (!query.result.length) {
    __.requestError('generalUtilities.js:: getUserId(): user resource not found for userName: ' + userName, 404);
  }
  return query.result[0]._id;
}

/*
 * Function calculateDate
 */
function calculateDate(date) {
  var today = new Date();
  var _d = date.split(' ');
  var tempNumber = _d[0];
  var tempValue = _d[1];
  var count = null;

  var number = Number(tempNumber);
  if (tempValue.toLowerCase() === 'days') {
    count = 0;
    while (count < number) {
      today.setDate(today.getDate() + 1);
      count++;
    }
  } else if (tempValue.toLowerCase() === 'weeks') {
    count = 0;
    while (count < number) {
      today.setDate(today.getDate() + 7);
      count++;
    }
  } else if (tempValue.toLowerCase() === 'months') {
    count = 0;
    var currentDate = today.toString();

    while (count < number) {
      var cd = currentDate.split(' ');
      var dayOfWeek = cd[0];
      var month = cd[1];
      var day = cd[2];
      var tempYear = cd[3];
      var time = cd[4];
      var zone = cd[5];

      var year = Number(tempYear);
      var dayInMonth = getDaysInMonth(month, year);
      today.setDate(today.getDate() + dayInMonth);
      currentDate = today.toString();
      count++;
    }
  }
  return today;
}

/*
 * Function getDaysInMonth
 */
function getDaysInMonth(month, year) {
  var _m = month.toLowerCase();
  var _dim = {
    jan: 31,
    mar: 31,
    may: 31,
    jul: 31,
    aug: 31,
    oct: 31,
    dec: 31,
    apr: 30,
    jun: 30,
    sep: 30,
    nov: 30
  };

  if (_m === 'feb') {
    if (isLeapYear(year)) {
      return 29;
    }
    return 28;
  }

  return _dim[_m];
}

/*
 * Function calculateRiskScore
 */
function calculateRiskScore(riskLevels) {
  // Somewhere the array is being populated with null value when
  // risk level is null, so length is > 0 , but max is null
  if (!_.max(riskLevels) || riskLevels.length === 0) {
    return 1;
  }
  return _.max(riskLevels);
}

/*
 * Function getMonthInt
 */
function getMonthInt(month) {
  var monthsMap = {
    jan: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    oct: '10',
    nov: '11',
    dec: '12'
  };
  var _m = month.toLowerCase();
  return monthsMap[_m];
}

/*
 * Function getManagedGovernanceProps
 */
function getManagedGovernanceProps(objType, objectId) {
  var govProps = {};
  var glossary_managed_query = 'class eq "object"';
  var glossary_system_query = 'class eq "system"';
  if (objType !== null) {
    glossary_managed_query += ' and objectId sw "managed/' + objType + '"';
  }
  var glossary_managed = glossaryCRUD.queryObjs({ _queryFilter: glossary_managed_query }).result;
  for (var i in glossary_managed) {
    var glossaryObj = glossary_managed[i];
    if (glossaryObj.entitlementOwner || glossaryObj.riskLevel) {
      var shortId = idmUtils.ensureIdShort(glossaryObj.objectId);
      if (!govProps[shortId]) {
        govProps[shortId] = {};
      }
      if (glossaryObj.entitlementOwner) {
        govProps[shortId].entitlementOwner = glossaryObj.entitlementOwner
      }
      if (glossaryObj.riskLevel) {
        govProps[shortId].riskLevel = glossaryObj.riskLevel
      }
    }
  } // end:for

  var glossary_system = glossaryCRUD.queryObjs({ _queryFilter: glossary_system_query }).result;
  for (var i in glossary_system) {
    var glossaryObj = glossary_system[i];
    if (glossaryObj.entitlementOwner || glossaryObj.riskLevel) {
      if (!govProps[glossaryObj.name]) {
        govProps[glossaryObj.name] = {};
      }
      if (glossaryObj.entitlementOwner) {
        govProps[glossaryObj.name].entitlementOwner = glossaryObj.entitlementOwner
      }
      if (glossaryObj.riskLevel) {
        govProps[glossaryObj.name].riskLevel = glossaryObj.riskLevel;
      }
    }
  } // end:for

  if (objectId) {
    return govProps[objectId];
  }
  return govProps;
}

/*
 * Function _updateEventRepo
 */
function _updateEventRepo(eventRepoPath, _event) {
  openidm.update(eventRepoPath + _event._id, null, _event);
}

function isOwner(userId, ownerId) {
  // return whether the user is a valid owner
  if (ownerId === undefined) {
    __.requestError('Missing argument. One of two required arguments missing for isOwner.', 500);
  }
  var userLongId = idmUtils.ensureUserIdLong(userId);
  var roleLongIds = idmUtils.getUserRoles(userId);
  var allIds = [userLongId].concat(roleLongIds);
  var is_owner = _.includes(allIds, ownerId);
  return is_owner
}


function certifierIdsToUserIds(certifier_ids) {
  // Given an iterable of certifier ids (such as 'managed/user/82c...' and 'internal/role...'), convert the role ids to the user ids of the auth members of those roles.
  // For example, [userid, roleid] becomes [userid, roleauthmemberid1, roleauthmemberid2].
  var user_ids = [];
  certifier_ids.forEach(function(certifier_id) {
    if (certifier_id.indexOf('managed/user') >= 0) {
      user_ids.push(certifier_id);
    }
    else if (certifier_id.indexOf('managed/role') >= 0 || idmUtils.isLongInternalRoleId(certifier_id)) {
      var auth_member_ids = getUserIdsWithAuthRole(certifier_id);
      user_ids = user_ids.concat(auth_member_ids);
    }
    else {
      __.requestError('This function only accepts long user ids and long role ids.', 500);
    }
  });
  return _.uniq(user_ids)
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

function getRoleDisplayNameFromId(role_id) {
  var roleDisplayObj = displayUtils.getDisplayObject(role_id, false, {});
  if (roleDisplayObj && roleDisplayObj.displayName) {
    return roleDisplayObj.displayName
  }
  else {
    return role_id;
  }
};

function getUserDisplayNameFromId(user_id, id_map) {
  if (!id_map) {
    id_map = {};
  }
  user_id = idmUtils.ensureUserIdLong(user_id)
  var userDisplayObj = displayUtils.getDisplayObject(user_id, true, id_map);
  if (userDisplayObj && userDisplayObj.displayName) {
    return userDisplayObj.displayName
  }
  else {
    return user_id;
  }
}

function getCertifierDisplayNameFromId(certifier_id) {
  if (idmUtils.isLongUserId(certifier_id)) {
    return getUserDisplayNameFromId(certifier_id);
  }
  else if (idmUtils.isLongRoleId(certifier_id)) {
    return getRoleDisplayNameFromId(certifier_id);
  }
  else {
    __.requestError('Unrecognized certifier id type.', 500);
  }
}
 
function getCertifierDisplayNameFromStage(obj) {
  // Given a stage (`obj`), get the user-friendly name to display that represents the certifier of the stage.
  switch (obj['certifierType']) {
    case CONSTANT.CERTIFIER_TYPE.USER:
      var user_id = obj['certifierId'];
      return getUserDisplayNameFromId(user_id);
    case CONSTANT.CERTIFIER_TYPE.AUTH_ROLE:
    case CONSTANT.CERTIFIER_TYPE.GROUP:
      var role_id = obj['certifierId'];
      return getRoleDisplayNameFromId(role_id);
    case CONSTANT.CERTIFIER_TYPE.ENTITLEMENT_OWNER:
      return 'Entitlement Owner';
    case CONSTANT.CERTIFIER_TYPE.MANAGER:
      return 'Manager';
    case CONSTANT.CERTIFIER_TYPE.PREV_MANAGER:
      return 'Previous Manager';
    default:
      __.requestError('Unrecognized certifier type "' + certifier_type + '".', 500);
  }
}

function getCertifierDisplayNameFromEvent(obj) {
  // Given an event (`obj`), get the user-friendly name to display that represents the certifier of the stage.
  var certifier_type = obj['certifierType'];
  if (_.includes([CONSTANT.CERTIFIER_TYPE.MANAGER, CONSTANT.CERTIFIER_TYPE.PREV_MANAGER], certifier_type)) {
    if (!obj['certifierId'] || obj['certifierId'] === '') {
      return 'No Certifier'
    }
    return getUserDisplayNameFromId(obj['certifierId']);
  }
  else {
    return getCertifierDisplayNameFromStage(obj);
  }  
}

/*
 * Function isFieldCertifiable
 */
function isFieldCertifiable(attribute) {
  var query_filter = 'class eq "identity" and attributeName eq "' + attribute + '" and certifiable eq true';
  var glossary_identity = glossaryCRUD.queryObjs({ _queryFilter: query_filter }).result;
  var found = 0;
  if (glossary_identity.length > 0) {
    found = 1;
  }
  return found;
}

function _getFieldsToDisplayInUserTable() {
  var fields = [];
  var glossary_data = glossaryCRUD.queryObjs({ _queryFilter: 'class eq "identity" and displayInUserInfo eq true' }).result;
  _.forEach(glossary_data, function(entry) {
    fields.push(entry.attributeName);
  });
  return fields;
}


function getDictOfFieldsToDisplayInUserTable() {
  var field_to_repo_key = {};
  // standard user attributes
  _.assign(field_to_repo_key, {
    'firstName': 'givenName',
    'lastName': 'sn',
    'email': 'mail',
  });
  // custom user attributes
  var fields = _getFieldsToDisplayInUserTable();
  var values = _.values(field_to_repo_key)
  fields = _.difference(fields, values)
  fields.forEach(function(field) {
    field_to_repo_key[field] = field;
  });
  // return
  return field_to_repo_key;
}

/* 
 * Function getCertifiableAttrs
 * Params: objectType = managed object type for this certification
 * Given a managed object type, get the list of attributes both on that object and for connected systems that are certification eligible
 * For managed users, leverage the glossary identity attributes.  For all other objects, all attributes are available for inclusion.
*/
function getCertifiableAttrs(objectType) {
  var certifiable_attrs = {
    identity: {},
    system: {},
    displayable: {},
  };
  var isUser = objectType === 'user';
  var glossary_identity = [];
  // Consult glossary for certifiable attrs
  if (isUser) {
    glossary_identity = glossaryCRUD.queryObjs({ _queryFilter: 'class eq "identity" and (certifiable eq true or displayInUserInfo eq true)'}).result;
    _.forEach(glossary_identity, function(attr) {
      if (attr.certifiable === true) {
        certifiable_attrs.identity[attr.attributeName] = attr.certifiable;
      }
      if (attr.displayInUserInfo === true) {
        certifiable_attrs.displayable[attr.attributeName] = attr.attributeValue;
      }
    });

    var glossary_system = glossaryCRUD.queryObjs({ _queryFilter: 'class eq "system" and (certifiable eq true or displayInUserInfo eq true)'}).result;
    _.forEach(glossary_system, function(attr) {
      if (!certifiable_attrs.system) {
        certifiable_attrs.system = {};
      }
      if (attr.certifiable === true) {
        certifiable_attrs.system[attr.name] = attr;
        attr._properties = {};
        var glossary_system_attrs = glossaryCRUD.queryObjs({ 
          _queryFilter: 'class eq "system-attribute" and system eq "' + attr.name + '"'
        }).result;
        _.forEach(glossary_system_attrs, function(sys_attr) {
          if (!certifiable_attrs.system[attr.name]._properties[sys_attr.objectType]) {
            certifiable_attrs.system[attr.name]._properties[sys_attr.objectType] = [];
          }
          certifiable_attrs.system[attr.name]._properties[sys_attr.objectType].push(sys_attr);
        });
      }
    });
  }
  else {
    // Grab all properties on managed object type and add to certifiable attrs
    var objectProperties = idmUtils.getManagedObjectProperties(CERT_OBJECT_TYPE);
    _.keys(objectProperties).forEach(function(attr) {
      certifiable_attrs.identity[attr] = true;
    });
  }

  return certifiable_attrs;
}

function getUserLinks(userId) {
  return openidm.query('repo/links', { _queryFilter: "firstId eq '" + userId + "' or secondId eq '" + userId + "'" }).result;
}

function getUserResourceIdFromMapping(userId, mappingName) {
  var userLinks = getUserLinks(userId);
  var systemLink = _.find(userLinks, { linkType: mappingName });
  return getUserResourceIdFromLink(systemLink, userId);
}

function getUserResourceIdFromLink(link, userId) {
  var firstId = link.firstId ? link.firstId : link.firstResourceCollection + '/' + link.firstResourceId;
  var secondId = link.secondId ? link.secondId : link.secondResourceCollection + '/' + link.secondResourceId;
  var resourceUser = firstId.equals(userId) ? secondId : firstId;
  return resourceUser;
}

function getDelegateProperties() {
  var isDelegationEnabled = getSettingObjById("delegationEnabled").value;
  var userDelegateSetting = getSettingObjById("userDelegate").value;
  return {
    isDelegationEnabled: isDelegationEnabled,
    userDelegateSetting: userDelegateSetting
  }
}

function getUserDelegate(userId, delegateProperties) {
  if (!delegateProperties) {
    delegateProperties = getDelegateProperties();
  }
  if (delegateProperties && delegateProperties.isDelegationEnabled) {
    var delegateProperty = delegateProperties.userDelegateSetting;
    var longId = idmUtils.ensureUserIdLong(userId);
    var userInfo = idmUtils.queryManagedUsers(longId, [ delegateProperty ], CONSTANT.IDM_METHOD.READ);
    if (userInfo[delegateProperty] && userInfo[delegateProperty]._ref && userInfo[delegateProperty]._ref.indexOf('managed/user') >= 0) {
      var delegateUser = idmUtils.queryManagedUsers(userInfo[delegateProperty]._ref, ['userName', '_id'], CONSTANT.IDM_METHOD.READ);
      if (delegateUser._id) {
        return delegateUser;
      };
    }
  }
  return null;
}

function addDataToEntitlements(event) {
  _.forEach(_.keys(event.eventData), function(eventDataKey) {
    var section = event.eventData[eventDataKey];
    var subKey = null;
    if (eventDataKey === 'managedObject') {
      subKey = 'values';
    }
    else if (eventDataKey === 'application') {
      subKey = 'attributes';
    }
    else {
      return;
    }
    _.forOwn(section, function(value, key) {
      var certifiable = section[key];
      if (!certifiable[subKey] || certifiable[subKey].length === 0) {
        return;
      }
      for (var i = 0; i < certifiable[subKey].length; i++) {
        var entry = certifiable[subKey][i];
        if (eventDataKey === 'managedObject') {
          entry.parent = certifiable.objectType      
          entry.attrIndex = i;
        }
        else {
          entry.parent = certifiable.connector + '_' + certifiable.objectType;
        }
      }
    });
  });
}

/*
 * Function  _nextStagesHaveNoCertifier
 */
function nextStagesHaveNoCertifier(indexesArray, campaignObject) {
  // todo: move to campaign.js and clean up
  var i, index, stg;
  for (i in indexesArray) {
    index = indexesArray[i];
    stg = campaignObject.stages[index];
    // Fetch events for stage
    var _query = '(campaignId eq "' + campaignObject._id + '") and (stageIndex eq "' + stg.stageIndex + '") and !(status eq "no-certifier")';
    var queryResults = openidm.query(CONSTANT.REPO_PATH.USER_EVENT, { _queryFilter: _query, _fields: ['status'] });
    if (queryResults.result.length) {
      return false;
    }
  }
  return true;
}

module.exports = {
  methodIs: methodIs,
  actionIs: actionIs,
  queryParamsAre: queryParamsAre,
  getUserNameFromCookie: getUserNameFromCookie,
  createNewAuditEvent: createNewAuditEvent,
  createAuditEvent: createAuditEvent,
  urlParamsCount: urlParamsCount,
  sendNotification: sendNotification,
  sendNotificationToUser: sendNotificationToUser,
  sendNotificationToUsers: sendNotificationToUsers,
  getUserMail: getUserMail,
  isFieldCertifiable: isFieldCertifiable,
  buildWorkflowPayload: _buildWorkflowPayload,
  getFormattedDate: getFormattedDate,
  getUserId: getUserId,
  calculateDate: calculateDate,
  calculateRiskScore: calculateRiskScore,
  updateEventRepo: _updateEventRepo,
  isOwner: isOwner,
  getUserIdsWithAuthRole: getUserIdsWithAuthRole,
  certifierIdsToUserIds: certifierIdsToUserIds,
  getManagedGovernanceProps: getManagedGovernanceProps,
  getSettingObjById: getSettingObjById,
  getRoleDisplayNameFromId: getRoleDisplayNameFromId,
  getUserDisplayNameFromId: getUserDisplayNameFromId,
  getCertifierDisplayNameFromId: getCertifierDisplayNameFromId,
  getCertifierDisplayNameFromStage: getCertifierDisplayNameFromStage,
  getCertifierDisplayNameFromEvent: getCertifierDisplayNameFromEvent,
  getDictOfFieldsToDisplayInUserTable: getDictOfFieldsToDisplayInUserTable,
  getCertifiableAttrs: getCertifiableAttrs,
  getUserLinks: getUserLinks,
  getUserResourceIdFromMapping: getUserResourceIdFromMapping,
  getUserResourceIdFromLink: getUserResourceIdFromLink,
  getDelegateProperties: getDelegateProperties,
  getUserDelegate: getUserDelegate,
  addDataToEntitlements: addDataToEntitlements,
  nextStagesHaveNoCertifier: nextStagesHaveNoCertifier,
};
