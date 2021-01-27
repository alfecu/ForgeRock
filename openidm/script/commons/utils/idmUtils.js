/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
Utilities specific to IDM.

Functions probably belong here if they
  (1) depend on IDM.  (typically because they use the `openidm` variable)
  (2) deal with IDM constructs.  (such as IDM roles or IDM cookies)
  (3) use IDM-specific conventions.  (such as IDM id formats)
*/
var _ = require('../lib/lodash4.js');
var __ = require('./jsUtils.js');
var CONSTANT = require('./globalConstants.js');
var qf = require('./queryFilterBuilder.js');


function getIdmVersion() {
  // Returns an array of integers of length 3.  The first element is the major version number, the second element is the minor version number, and the third element is the patch number.
  // For example, when using IDM-6.0.1, this function returns [6, 0, 1]
  var version_object = openidm.read('info/version');
  var version_string_long = version_object.productVersion;
  var version_string_short = version_string_long.split('-')[0];
  var version_as_strings = version_string_short.split('.');
  var version_as_ints = _.map(version_as_strings, function(s){return parseInt(s, 10);});
  return version_as_ints;
}

function getInternalRoleIdPrefix() {
  // Returns 'internal/role/' or 'repo/internal/role/' depending on the version of IDM.
  // Note that the prefix includes a trailing '/'.
  var version = getIdmVersion();
  var version_major = version[0];
  var version_minor = version[1];
  if (version_major >= 7 || (version_major == 6 && version_minor >= 5)) {
    return 'internal/role/';
  } else {
    return 'repo/internal/role/';
  }
}

function ensureRoleIdShort(id) {
  // Given a long internal role id such as 'internal/role/openidm-admin', return 'openidm-admin'.  Given a short internal role id such as 'openidm-admin', leave it unchanged.
  // This function is idempotent and good for id sanitization/normalization.
  var id_prefixes = [
    'repo/internal/role/',
    'repo/managed/role/',
    'internal/role/',
    'managed/role/',
  ];
  // Check for all possible prefixes (more convenient + robust)
  for (var i = 0; i < id_prefixes.length; i++) {
    var id_prefix = id_prefixes[i];
    if (id.indexOf(id_prefix) === 0) {
      return id.replace(id_prefix, '');
    }
  }
  if (id.indexOf('/') >= 0) {
    // Make sure it doesn't have some invalid prefix going on
    __.requestError("Invalid role id '" + id + "'.", 500);
  }
  // If none of the prefixes matched, it's already short.
  return id;
}

function ensureInternalRoleIdLong(id) {
  // Given a short internal role id such as 'openidm-admin', return the long version, such as 'internal/role/openidm-admin'.  Given a long internal role id, leave it unchanged.
  // This function is idempotent and good for id sanitization/normalization.
  if (isLongInternalRoleId(id)) {
    return id;
  }
  else if (id.indexOf('/') >= 0) {
    // note(ML): this check is here for robustness.
    __.requestError('Invalid role id type.', 500);
  }
  else {
    return getInternalRoleIdPrefix() + id;
  }
}

function isLongInternalRoleId(id) {
  // Given an internal role id, detect whether it is a long id such as 'internal/role/openidm-admin' or a short id such as 'openidm-admin'.
  return id.indexOf(getInternalRoleIdPrefix()) == 0;
}

function isLongManagedRoleId(id) {
  // Given a managed role id, detect whether it is a long id such as 'managed/role/5475-55'.
  return id.indexOf('managed/role/') == 0;
}

function isLongRoleId(id) {
  // Given an id, return true if it is a long role id such as 'internal/role/openidm-admin' or 'managed/role/5475-55'.
  return isLongInternalRoleId(id) || isLongManagedRoleId(id);
}

function isLongUserId(id) {
  // Given an id, return true if it is a long user id such as 'managed/user/5475-55'.
  return id.indexOf('managed/user/') == 0;
}

function isLongNonUserId(id) {
  // Given an id, return true if it is a long id that is not a managed user.i thin
  return isLongInternalRoleId(id) || (id.indexOf('managed/') == 0 && id.indexOf('managed/user') == -1);
}

function isLongOwnerId(id) {
  // Given an id, return true if it is a long owner id such as 'managed/user/5475-55', 'internal/role/openidm-admin', or 'managed/role/5475-55'.
  // Note that ALL owner id's should be long.
  return isLongUserId(id) || isLongRoleId(id);
}

function isOwner(userId, ownerId) {
  // return whether the user is a valid owner
  if (ownerId === undefined) {
    __.requestError('Missing argument. One of two required arguments missing for isOwner.', 500);
  }
  var userLongId = ensureUserIdLong(userId);
  var roleLongIds = getUserRoles(userId);
  var allIds = [userLongId].concat(roleLongIds);
  var is_owner = _.includes(allIds, ownerId);
  return is_owner
}

function ensureUserIdLong(user_id) {
  if (user_id.indexOf('managed/user/') < 0) {
    user_id = 'managed/user/' + user_id;
  }
  return user_id;
}

function ensureUserIdShort(user_id) {
  if (user_id.indexOf('managed/user/') >= 0) {
    var pieces = user_id.split('/');
    user_id = pieces[pieces.length - 1];
  }
  return user_id;
}

function ensureIdShort(id) {
  var pieces = id.split('/');
  var short_id = pieces[pieces.length - 1];
  return short_id;
}

/*
 * Function getUserIdFromCookie
 */
function getUserIdFromCookie(context) {
  try {
    return context.security.authorization.id;
  } catch(e) {
    return '';
  }
}

/**
 * Given a user's username, return their _id.
 */
function getUserIdFromUserName(username) {
  var user = getUserFromUserName(username);
  var user_id = user._id;
  return user_id;
}

/**
 * Detect whether a value looks like an IDM _id.  Does NOT check is _id exists in database.
 *
 * @example the string "35985500-57c9-4653-bc44-4542310f3b5f" will get return value of true.
 * @return     {boolean}  True if in _id format, False otherwise.
 */
function isInIdFormat(value) {
  // This function works just fine on a value of ANY type.  It is safe to use!
  return true;
}

/**
 * Detect whether a value looks like a long IDM managed object id.  Does NOT check if the id exists in database.
 *
 * @example the string "managed/user/35985500-57c9-4653-bc44-4542310f3b5f" will get return value of true.
 * @example the string "managed/role/35985500-57c9-4653-bc44-4542310f3b5f" will get return value of true.
 * @example the string "managed/pop/35985500-57c9-4653-bc44-4542310f3b5f" will get return value of true.
 * @example the string "35985500-57c9-4653-bc44-4542310f3b5f" will get return value of false.
 * @return     {boolean}  True if in long managed object id format, False otherwise.
 */
function isInManagedObjectIdFormat(value) {
  // This function works just fine on a value of ANY type.  It is safe to use!
  // Not validating this currently
  return true;
}

/**
 * Detect whether a value looks like an activiti user task id.
 *
 * @example the string "1435" will get return value of true.
 * @return     {boolean}  True if in user task id format, False otherwise.
 */
function isInUserTaskIdFormat(value) {
  return CONSTANT.USER_TASK_ID_PATTERN.test(value);
}

function hasInternalAuthzRole(roles, roleToSearch) {
  // Given an array of user roles and a role to search for, return true if user has role and false otherwise.
  var hasRole = false;
  if (roles.length > 0) {
    hasRole = _.some(roles, function(role) {
      var internalRolePrefixRegex = /((repo\/)?internal\/role\/)/;
      role = role.replace(internalRolePrefixRegex, '');
      return role === roleToSearch;
    });
  }
  return hasRole;
}

function _getUserAttrMappings () {
  var settings = openidm.read('config/systemSettings');
  if (!settings || !settings.systemSettings) {
    return null;
  }
  var systemSettings = settings.systemSettings;
  var attrMappings = null;
  for (var i in systemSettings) {
    var fields = systemSettings[i].fields;
    for (var j in fields) {
      if (fields[j].id === 'userAttrMappings') {
        attrMappings = fields[j].attributes;
        return attrMappings;
      }
    }
  }
}

function queryManagedUsers (queryTarget, fields, method) {
  // If method is QUERY,
  //   * queryTarget must be a query filter string which is evualuated against the managed/user objects themselves
  //   * returns an array of user objects with a key for each field you inputted in fields
  // If method is READ,
  //   * queryTarget must be the id of the user you want
  //   * returns a single user object with a key for each field you inputted in fields
  var attrMappings = _getUserAttrMappings();
  var queryFields = fields;
  if (!queryFields || queryFields.length === 0) {
    queryFields = [ '*' ];
  }
  else {
    for (var i in attrMappings) {
      var fieldIndex = queryFields.indexOf(attrMappings[i].id);
      if (fieldIndex > -1) {
        queryFields.splice(fieldIndex, 1, attrMappings[i].value);
      }
      fieldIndex = queryFields.indexOf('manager/' + attrMappings[i].id);
      if (fieldIndex > -1) {
        queryFields.splice(fieldIndex, 1, 'manager/' + attrMappings[i].value);
      }
    }
  }
  var userList = null;
  if (method.equalsIgnoreCase('READ')) {
    var userId = ensureUserIdLong(queryTarget);
    userList = openidm.read(userId, null, queryFields);
  } else {
    userList = openidm.query('managed/user', { _queryFilter: queryTarget, _fields: queryFields });
  }
  if (_.isNull(userList)) {
    __.requestError('User by that id does not exist', 404);
  } else if (userList && userList.result) {
    userList = userList.result;
  }
  if (method === 'READ') {
    userList = new Array(userList);
  }
  for (var i in userList) {
    var user = userList[i];
    for (var j in attrMappings) {
      var fieldIndex = queryFields.indexOf(attrMappings[j].value);
      if (fieldIndex > -1) {
        user[attrMappings[j].id] = user[attrMappings[j].value];
      }
      fieldIndex = queryFields.indexOf('manager/' + attrMappings[j].value);
      if (fieldIndex > -1 && user['manager']) {
        user['manager'][attrMappings[j].id] = user['manager'][attrMappings[j].value];
      }
    }
  }
  if (method === 'READ') {
    userList = userList[0];
  }
  return userList;
}

function getUser(user_id, fields) {
  user_id = ensureUserIdLong(user_id);
  var user = openidm.read(user_id, null, fields);
  if (_.isNull(user)) {
    __.requestError('User by that id does not exist', 404);
  }
  return user;
}

/**
 * Given a user's username, get the user.
 */
function getUserFromUserName(username) {
  var query_filter = qf.eq('userName', username);
  var users = queryManagedUsers(query_filter, null, 'QUERY');
  if (users.length !== 1) {
    __.requestError("A user with username '" + username + "' does not exist, or there are more than one.", 400);
  }
  else {
    var user = users[0];
    return user;
  }
}

/**
 * Given an IDM-style parameter object (but without the leading underscores in the query params, due to an IDM limitation), return the query parameter object (with the leading underscores) that can be fed into openidm.query().
 *
 * @param      {Object}  request_params  The parameters from the request object
 * @return     {Object}  The parameter object for openidm.query().
 */
function getQueryParams(request_params) {
  var queryType = '_queryFilter';
  if (request_params.queryId) {
    queryType = '_queryId';
  }
  var queryParams = {
    _fields: request_params.fields || null,
    _pageSize: parseInt(request_params.pageSize),
    _pagedResultsOffset: parseInt(request_params.pagedResultsOffset),
    _sortKeys: request_params.sortKeys,
  };
  queryParams[queryType] = ( queryType === '_queryId') ? request_params.queryId || 'query-all-ids' : request_params.queryFilter || CONSTANT.QUERY_FILTER.TRUE
  return queryParams;
}

function getWorkflows() {
  var workflows = openidm.query(
    'workflow/processdefinition',
    {
      _queryId: 'query-all-ids',
    }
  ).result;
  return workflows;
}

function getWorkflowNames() {
  var workflows = getWorkflows();
  var workflow_names = _.map(workflows, 'name');
  return workflow_names;
}

/**
 * Perform an openidm.read() operation.  Throw an error if the thing doesn't exist.
 */
function readStrict() {
  var response = openidm.read.apply(null, arguments);
  if (_.isNull(response)) {
    var error_message = arguments[0] ?
        'The resource ' + arguments[0] + ' does not exist.' :
        'No resource argument supplied to openidm.read.';
    __.requestError(error_message, 400);
  }
  return response;
}

/*
 * Function getUserMail
 */
function getUserMail(userId) {
  var userObject = getUser(userId, ['mail']);
  return userObject.mail;
}

/**
 * Given a user id, return the user's username.
 */
function getUserName(user_id) {
  var user = getUser(user_id);
  return user.userName;
}

/*
 * Gets the user's manager relationship object view. This is NOT a user object.
 */
function getUserManagerRelationshipView(user_id) {
  var user = getUser(user_id, ['manager']);
  return user.manager;
}

/*
 * Gets the user's manager's id.
 */
function getUserManagerId(user_id) {
  var manager_relationship = getUserManagerRelationshipView(user_id);
  var manager_id = manager_relationship && manager_relationship._ref ? manager_relationship._ref : null;
  return manager_id;
}

/**
 * Given a long role id, return the role object.
 */
function getRole(role_id) {
  var role = readStrict(role_id);
  return role;
}

/**
 * given the long id of a role (such as internal/role/governance-administrator), return the user ids of the auth members of that role
 */
function getUserIdsFromRoleId(role_id) {
  var membershipProperties = openidm.read('config/commons').membershipProperties;
  if (!membershipProperties) {
    __.requestError('commons.json configuration for membershipProperties cannot be read.', 400)
  }
  
  var userIds = [];
  // Determine reverseProps based on commons.json membershipProperties
  var reverseProps = [];
  if (membershipProperties.indexOf('roles') >= 0) {
    reverseProps.push('members');
  }
  if (membershipProperties.indexOf('authzRoles') >= 0) {
    reverseProps.push('authzMembers');
  }
  
  var result = openidm.read(role_id, null, reverseProps);
  _.forEach(reverseProps, function(prop) {
    if (result && result[prop]) {
      userIds = _.union(userIds, _.map(result[prop], '_ref'));
    }
  });
  return userIds;
}

/**
 * Given an iterable of certifier ids (such as 'managed/user/82c...' and 'internal/role...'), convert the role ids to the user ids of the auth members of those roles.
 *
 * @example For example, [userid, roleid] becomes [userid, roleauthmemberid1, roleauthmemberid2]
 */
function getUserIdsFromCertifierIds(certifier_ids) {
  var user_ids = [];
  certifier_ids.forEach(function(certifier_id) {
    if (isLongUserId(certifier_id)) {
      user_ids.push(certifier_id);
    }
    else if (isLongRoleId(certifier_id)) {
      var auth_member_ids = getUserIdsFromRoleId(certifier_id);
      user_ids = user_ids.concat(auth_member_ids);
    }
    else {
      __.requestError('This function only accepts long user ids and long role ids.', 500);
    }
  });
  return _.uniq(user_ids)
}

/**
 * Given a long managed object id, return the type
 *
 * @example Given "managed/assignment/12347685-2346-2333-837264", returns "assignment"
 */
function getManagedObjectTypeFromLongId(long_managed_object_id) {
  return long_managed_object_id.split('/')[1];
}

/**
 * Guess the product by looking for its name in the template.
 */
function getProductFromTemplate(string) {
  if (string.indexOf('governance') >= 0) {
    return 'idg';
  }
  else if (string.indexOf('commons') >= 0) {
    return 'commons';
  }
  else if (string.indexOf('access-request') >= 0) {
    return 'access-request';
  }
  else {
    __.requestError("template ids must include 'governance', 'access-request', or 'commons' in them.", 500);
  }
}

function getEmailParamsById(template_id) {
  var product = getProductFromTemplate(template_id);
  var name = (product === 'access-request') ? 'accessRequestNotificationTemplates' :
    (product === 'commons') ? 'commonsNotificationTemplates' :
      __.requestError('unaccounted for product', 500);
  var resource = 'config/' + name;
  var template_id_to_params = openidm.read(resource);
  var params_raw = template_id_to_params[template_id];
  if (_.isUndefined(params_raw)) {
    __.requestError('email template not found.  double check the id.', 500);
  }
  return params_raw;
}

/*
 * Function sendNotification
 */
function sendNotification(template, params) {
  // sad. IDG could not play with the big boys.
  if (getProductFromTemplate(template) === 'idg') {
    try {
      var inetAddr = java.net.InetAddress.getLocalHost();
      var hostname = inetAddr.getHostName();
    } catch(e) {
      logger.error(e.stack);
      logger.error('Cannot get InetAddress or HostName. Please check your SMTP logs.');
      return false;
    }
    hostname = hostname.replace('ip-', '');
    hostname = hostname.replace('-', '.');
    hostname = hostname + ':8080';
    params.hostName = hostname;
    openidm.action(template, 'send', params);
  }
  else {
    var email_params_raw = getEmailParamsById(template);
    var email_params_interpolated = _.mapValues(email_params_raw, function(value) {
      return __.formatStringTemplate(value, params);
    });
    try {
      openidm.action('external/email', 'send', email_params_interpolated);
    } catch(e) {
      logger.error(e.stack);
      logger.error('Cannot send email. Please check your SMTP logs.');
    }
  }
  return true;
}

function sendNotificationToUser(user_id, template, params) {
  // Send a notification (email) to the user if they have an email address.
  var user_email = getUserMail(user_id);
  if (!user_email) {
    // if they have no email address, abort silently
    return false;
  }
  else {
    _.assign(params, {toEmailAddress: user_email});
    sendNotification(template, params);
  }
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

function getManagedObjectProperties(type) {
  // Read config managed for the user object, and return the properties
  var managedObjects = openidm.read('config/managed').objects;
  var object = {}
  for (var i = 0; i < managedObjects.length; i++) {
    if (managedObjects[i].name === type) {
      object = managedObjects[i];
      break;
    }
  }
  return object.schema.properties;
}

function getManagedUserPropertiesTitles() {
  var userObjectProperties = getManagedObjectProperties('user');
  _.forEach(userObjectProperties, function(value, key) {
    userObjectProperties[key] = _.pick(value, 'title')
  })
  return userObjectProperties;
}

function getUserRoles(userId) {
  var membershipProperties = openidm.read('config/commons').membershipProperties;
  if (!membershipProperties) {
    __.requestError('commons.json configuration for membershipProperties cannot be read.', 400)
  }
  if (userId === undefined) {
    __.requestError('Missing argument: userId.', 403);
  }
  userId = idmUtils.ensureUserIdLong(userId);

  var userInfo = openidm.read(userId, null, membershipProperties);
  var userRoles = [];
  _.forEach(membershipProperties, function(attr) {
    var attrRoles = _.map(userInfo[attr], '_ref');
    userRoles = _.union(userRoles, attrRoles);
  });

  return userRoles;
}

function getUserRolesWithId(userId) {
  var roles = getUserRoles(userId)
  roles.push(ensureUserIdLong(userId));
  return roles;
}

module.exports = {
  // id
  ensureInternalRoleIdLong: ensureInternalRoleIdLong,
  ensureRoleIdShort: ensureRoleIdShort,
  ensureUserIdLong: ensureUserIdLong,
  ensureUserIdShort: ensureUserIdShort,
  ensureIdShort: ensureIdShort,
  getInternalRoleIdPrefix: getInternalRoleIdPrefix,
  getManagedObjectTypeFromLongId: getManagedObjectTypeFromLongId,
  isLongRoleId: isLongRoleId,
  isLongUserId: isLongUserId,
  isLongNonUserId: isLongNonUserId,
  isLongOwnerId: isLongOwnerId,
  isOwner: isOwner,
  isLongInternalRoleId: isLongInternalRoleId,
  isLongManagedRoleId: isLongManagedRoleId,
  isInIdFormat: isInIdFormat,
  isInManagedObjectIdFormat: isInManagedObjectIdFormat,
  isInUserTaskIdFormat: isInUserTaskIdFormat,
  // user
  getUser: getUser,
  getUserFromUserName: getUserFromUserName,
  getUserIdFromCookie: getUserIdFromCookie,
  getUserIdFromUserName: getUserIdFromUserName,
  getUserName: getUserName,
  getUserMail: getUserMail,
  getUserManagerId: getUserManagerId,
  getManagedObjectProperties: getManagedObjectProperties,
  getManagedUserPropertiesTitles: getManagedUserPropertiesTitles,
  // role
  getRole: getRole,
  getUserIdsFromRoleId: getUserIdsFromRoleId,
  getUserIdsFromCertifierIds: getUserIdsFromCertifierIds,
  // other
  getIdmVersion: getIdmVersion,
  getQueryParams: getQueryParams,
  getWorkflows: getWorkflows,
  getWorkflowNames: getWorkflowNames,
  hasInternalAuthzRole: hasInternalAuthzRole,
  queryManagedUsers: queryManagedUsers,
  readStrict: readStrict,
  sendNotification: sendNotification,
  sendNotificationToUser: sendNotificationToUser,
  sendNotificationToUsers: sendNotificationToUsers,
  getUserRoles: getUserRoles,
  getUserRolesWithId: getUserRolesWithId,
};
