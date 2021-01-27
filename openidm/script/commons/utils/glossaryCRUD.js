/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
Glossary Create, Read, Update, and Delete operations.  This includes validation.
*/
var _ = require('../lib/lodash4.js');
var __ = require('./jsUtils.js');
var idmUtils = require('./idmUtils.js');
var commonUtils = require('./commonUtils.js');
var CONSTANT = require('./globalConstants.js');
var validate = require('./glossaryValidators.js');

/**
 * Automatically make changes to object before creating or updating it.
 */
function prepareObj(obj) {
  // strip builtin constrained keys off the constraints. they should not be specified by the user.  also, they are global, not specific to each object.
  // in the future, we could allow some sort of customization of these keys at a global level
  var constrained_keys = commonUtils.getConstrainedKeysOfGlossaryObject(obj);
  obj['constraints'] = _.omit(obj['constraints'], constrained_keys);
}

/**
 * Create a new object
 */
function createNewObj(obj) {
  convertFields(obj)
  // builtin validations
  validate.object(obj, true);
  // mutate object
  prepareObj(obj);
  // create object in IDM
  var response = openidm.create(CONSTANT.RESOURCE_PATH.GLOSSARY, null, obj);
  return response;
}

/**
 * Update an existing object.
 */
function updateObj(obj) {
  convertFields(obj)
  // validate object
  validate.object(obj, false);
  // mutate object
  prepareObj(obj);
  // update
  var resource_path = CONSTANT.RESOURCE_PATH.GLOSSARY + obj._id;
  var response = openidm.update(resource_path, null, obj);
  return response;
}

function convertFields(obj) {
  // Handle conversion of fields if possible
  if (obj.constraints) {
    _.forOwn(obj.constraints, function(value, key) {
      if (value['type'] && obj[key]) {
        if (value['type'] == 'integer') {
          obj[key] = parseInt(obj[key])
        }
      }
    });
  }
}

function createOrUpdateObj(obj) {
  // PUT operation
  // put can both update or create a new object.  If an _id is given, it attempts to update.  If an _id is not given, it attempts to make a new object.
  if (obj.hasOwnProperty('_id')) {
    return updateObj(obj);
  }
  else {
    return createNewObj(obj);
  }
}

function queryObjs(queryParams) {
  // GET / Read operation by query filter
  var response = openidm.query(CONSTANT.RESOURCE_PATH.GLOSSARY, queryParams);
  return response;
}

function getAllObjs() {
  var response = queryObjs({_queryFilter: CONSTANT.QUERY_FILTER.TRUE});
  return response;
}

function getObjById(obj_id, fields) {
  // GET / Read operation by id
  var resource_path = CONSTANT.RESOURCE_PATH.GLOSSARY + obj_id;
  var response = idmUtils.readStrict(resource_path, null, fields);
  return response;
}

function deleteObjById(obj_id) {
  // DELETE operation by id
  var resource_path = CONSTANT.RESOURCE_PATH.GLOSSARY + obj_id;
  var response = openidm.delete(resource_path, null);
  return response;
}

function deleteAllObjs() {
  var objs = getAllObjs().result;
  objs.forEach(function(obj) {
    deleteObjById(obj._id);
  });
}

module.exports = {
  getObjById: getObjById,
  queryObjs: queryObjs,
  getAllObjs: getAllObjs,
  createNewObj: createNewObj,
  updateObj: updateObj,
  createOrUpdateObj: createOrUpdateObj,
  deleteObjById: deleteObjById,
  deleteAllObjs: deleteAllObjs,
};
