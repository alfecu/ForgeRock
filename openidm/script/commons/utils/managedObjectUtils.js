/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
Utils for fetching managed objects for frontend.

These functions are for frontend and include extra data like displayName.
*/

var _ = require('../lib/lodash4.js');
var __ = require('./jsUtils.js');
var CONSTANT = require('./globalConstants.js');
var qf = require('./queryFilterBuilder.js');
var commonUtils = require('./commonUtils.js');
var idmUtils = require('./idmUtils.js');

// todo: move this elsewhere
function validateManagedObjectType(type) {
  var managed_object_config = commonUtils.getConfig()['managedObjectConfig'];
  if (!managed_object_config.hasOwnProperty(type)) {
    __.requestError('The managed object type "' + type + '" is not configured in the Commons config.', 400);
  }
}

function wrapObjectWithExtraInfoForFrontend(obj, type) {
  if (!type) {
    __.requestError('Missing parameter type', 500);
  }
  var typeToDisplayNameKey = {
    'user': 'userName',
    'role': 'name',
    'assignment': 'name',
  };
  var displayNameKey = typeToDisplayNameKey[type] || 'name';
  var displayName = obj[displayNameKey];
  return {
    displayableObject: obj,
    _id: obj._id,
    displayName: displayName,
  };
}

function getManagedObjectById(type, obj_id) {
  var obj = idmUtils.readStrict(CONSTANT.RESOURCE_PATH.MANAGED + type + '/' + obj_id);
  // this is where validation would go if we had it
  // validate.managedObject(obj);
  // prepare output for frontend
  obj = wrapObjectWithExtraInfoForFrontend(obj, type);
  // public data only
  var fields = _.toArray(commonUtils.getConfig()['managedObjectConfig'][type]['searchProperties']);
  obj.displayableObject = _.pick(obj.displayableObject, fields);
  // return
  return obj;
}

function queryManagedObjects(type, queryParams) {
  if (!queryParams) {
    __.requestError('Missing parameter queryParams', 400);
  }
  validateManagedObjectType(type);
  // query
  var response = openidm.query(CONSTANT.RESOURCE_PATH.MANAGED + type + '/', queryParams);
  var objs = response.result;
  // this is where validation would go if we had it
  // objs.forEach(validate.managedObject);
  // prepare output for frontend
  objs = objs.map(function(obj) {return wrapObjectWithExtraInfoForFrontend(obj, type);});
  // public data only
  var fields = _.toArray(commonUtils.getConfig()['managedObjectConfig'][type]['searchProperties']);
  objs.forEach(function(obj) {
    obj.displayableObject = _.pick(obj.displayableObject, fields);
  });
  // return
  response.result = objs;
  return response;
}

/**
 * Gets the managed objects by query string.
 *
 * @param      {String}  type          The managed object type, that is, 'user', 'role', 'assignment', or any custom type.
 * @param      {String}  query_string  The query string
 * @param      {Object}  queryParams   The query parameters
 * @return     {Object}  The managed objects result object from IDM.
 */
function getManagedObjectsByQueryString(type, query_string, queryParams) {
  // Given a space-separated string of terms/names to search for, return each requestable item that matches all the strings somewhere in his designated attributes.
  var terms = __.splitString(query_string, /\s+/);
  validateManagedObjectType(type);
  var search_keys = commonUtils.getConfig()['managedObjectConfig'][type]['searchProperties'];
  var query_filter = qf.allCoIn(terms, search_keys);
  var extendedQueryParams = __.extended(queryParams, {
    _queryFilter: query_filter,
  });
  return queryManagedObjects(type, extendedQueryParams);
}

// Get the user display format from system settings, query the user object, and return the formatted name
function getDisplayableUserString(user_id) {
  var long_user_id = idmUtils.ensureUserIdLong(user_id);
  try {
      var user_object = idmUtils.getUser(long_user_id);
      var format = getSettingObjById("userDisplayFormat").value;
      return __.formatStringTemplate(format, user_object);
  }
  catch (e) {
      return user_id;
  }
}

// Query the glossary for the object_id provided, returning displayName if entry exists, otherwise check for managed object name
function getObjectDisplayName(object_id) {
  var objectDisplayName = null;
  var object = getGlossaryObjectForManagedObject(object_id);
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

function getGlossaryObjectForManagedObject(object_id) {
  var role_glossary_obj = null;
  var queryParams = {
    _queryFilter: qf.eq('objectId', object_id),
  };
  var response = glossaryCRUD.queryObjs(queryParams);
  if (response && response.result && response.result[0]) {
    role_glossary_obj = response.result[0];
  }
  return role_glossary_obj;
}

function addDisplayNamesToGlossaryItem(glossaryItem, id_map) {
  if (!glossaryItem) {
    return null;
  }

  var displayableMetadata = null;
  try {
    displayableMetadata = openidm.read('config/displayableMetadata');
  }
  catch (e) {
    logger.debug("Could not read displayable metadata config file.");
  }

  var constraints = __.cloneDeep(glossaryItem.constraints);
  var keysToInclude = displayableMetadata ? displayableMetadata[glossaryItem.class] : null;
  if (keysToInclude) {
    glossaryItem = _.pick(glossaryItem, _.toArray(keysToInclude));
  }

  // If approvers list, convert keys to long ids
  if (glossaryItem.approvers) {
    for (var i = 0; i < glossaryItem.approvers.length; i++) {
      var approverKey = glossaryItem.approvers[i];
      if (glossaryItem[approverKey] && approverKey !== 'manager') {
        glossaryItem.approvers[i] = glossaryItem[approverKey];
      }
    }
    glossaryItem.approvers = getDisplayObjectList(glossaryItem.approvers, id_map);
  }

  _.forEach(_.keys(glossaryItem), function(key) {
    if (constraints && 
      constraints[key] && 
      constraints[key].type &&
      constraints[key].type === 'managed object id') {
        glossaryItem[key] = getDisplayObject(glossaryItem[key], !idmUtils.isLongRoleId(glossaryItem[key]), id_map);
    }
  })

  if (glossaryItem.objectId) {
    var split = glossaryItem.objectId.split('/');
    if (split.length >= 2) {
      glossaryItem.objectType = split[1];
    }
    delete glossaryItem.objectId;
  }

  if (!keysToInclude) {
    glossaryItem = _.omit(glossaryItem, [ '_id', '_rev', 'class', 'constraints' ]);
    return {
      result: glossaryItem
    }
  }
  else {
    return {
      result: glossaryItem
    }
  }
}

function getSettingObjById(id) {
  // Given `id`, return the object or 'field' whose id is `id`.
  try {
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
  }
  catch (e) {
    logger.info('managedObjectUtils: Cannot read governance system settings, please ensure Access Review is installed.');
  }

  return null;
}

function getDisplayObjectList(ids, id_map) {
  var displayObjectList = [];
  _.forEach(ids, function(id) {
      displayObjectList.push(getDisplayObject(id, !idmUtils.isLongRoleId(id), id_map));
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
  getManagedObjectsByQueryString: getManagedObjectsByQueryString,
  getManagedObjectById: getManagedObjectById,
  getObjectDisplayName: getObjectDisplayName,
  getDisplayObjectList: getDisplayObjectList,
  getDisplayObject: getDisplayObject,
  addDisplayNamesToGlossaryItem: addDisplayNamesToGlossaryItem,
};
