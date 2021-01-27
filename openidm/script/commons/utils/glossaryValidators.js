/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
This file contains validators for glossary things.  In particular, it has a validator for each glossary object.
*/
var _ = require('../lib/lodash4.js');

var __ = require('./jsUtils.js');
var commonUtils = require('./commonUtils.js');
var validatejs = require('./validate.js');
var CONSTANT = require('./globalConstants.js');
var constraint = require('./glossaryConstraints.js');
var qf = require('./queryFilterBuilder.js');

function _class(string) {
  // Validate a glossary class.
  if (!_.includes(CONSTANT.GLOSSARY_CLASSES, string)) {
    __.requestError("'" + string + "' is not a valid glossary class.", 400);
  }
}

function object(obj, is_new) {
  if (!__._isObject(obj)) {
    __.requestError('Glossary object is not even an object, and hence invalid.', 400);
  }
  // Validate the keys and values of the glossary object itself.
  if (!obj.hasOwnProperty('class')) {
    __.requestError('Glossary object must have a class key.', 400);
  }
  var classname = obj.class;
  _class(classname);
  var obj_constraint = _.cloneDeep(constraint[classname]);
  // if the object is brand new, it is not allowed to have an _id yet
  if (is_new) {
    if (obj.hasOwnProperty('_id')) {
      __.requestError('You may not choose/set the _id for a brand new object.  Remove the _id key and a new one will be generated for you.', 400);
    }
    else {
      // remove the _id constraint
      delete obj_constraint._id;
    }
  }
  validatejs(obj, obj_constraint);
  // todo: for identity values and system values, get the TYPE from type/objectType from the corresponding identity and system objects, then validate the type
  // objectType
  // make sure a user's custom 'type' constraint exists for each custom key on the object
  typeConstraints(obj);
  // validate object against user's custom constraints, if any
  validatejs(obj, obj['constraints']);
  // validate the uniqueness of the object
  objectUniqueness(obj, is_new);
  // validate objectId uniqueness in 'object' glossary objects
  if (classname === 'object') {
    objectIdUniqueness(obj, is_new);
  }
}

/**
 * Validate that type contraints exist for all custom keys on the glossary object.
 *
 * @param      {object}  obj     The glossary object
 */
function typeConstraints(obj) {
  var custom_keys = commonUtils.getCustomKeysOfGlossaryObject(obj);
  for (var index in custom_keys) {
    var custom_key = custom_keys[index];
    if ((!obj['constraints'].hasOwnProperty(custom_key)) || (!obj['constraints'][custom_key].hasOwnProperty('type'))) {
      __.requestError('The glossary object ' + obj + ' has the custom key ' + custom_key + ' but no \'type\' constraint for that key.', 400);
    }
  }
}

function getRequiredKeys(_class) {
  var class_constraint = constraint[_class];
  return commonUtils.getRequiredKeys(class_constraint);
}

function getAllRequiredKeys() {
  var classes = CONSTANT.GLOSSARY_CLASSES;
  var keys_dbl_list = classes.map(getRequiredKeys);
  var keys = _.uniq(__.flattenOnce(keys_dbl_list));
  return keys;
}

function buildUniquenessQueryFilter(obj, uniqueKeys) {
  var queryFilter = '';
  var first = true;
  _.forEach(uniqueKeys, function(uniqueKey) {
    if (!first) {
      queryFilter += ' and '
    }
    queryFilter += uniqueKey + ' eq "' + obj[uniqueKey] + '"'
    first = false;
  });
  return queryFilter;
}

function objectUniqueness(obj, is_new) {
  // Validate that an object is unique.  Each object class has a specific key or key-combination that together should be unique.
  var uniqueKeys = CONSTANT.GLOSSARY_CLASS_TO_UNIQUE_KEY_COMBINATION[obj.class];
  var queryFilter = buildUniquenessQueryFilter(obj, uniqueKeys);
  var params = {
    _queryFilter: queryFilter,
  };
  var results = openidm.query(CONSTANT.RESOURCE_PATH.GLOSSARY, params).result;
  var expected_count = (is_new) ? 0 : 1;
  var actual_count = results.length;
  if (actual_count > expected_count) {
    __.requestError("The glossary object that matches: (" + queryFilter + ") already exists.", 400);
  }
}

/**
 * Glossary objects of class 'object' must have a unique objectId
 */
function objectIdUniqueness(obj, is_new) {
  var unique_id = obj['objectId'];
  var params = {
    _queryFilter: qf.eq('class', 'object'),
  };
  var all_objects = openidm.query(CONSTANT.RESOURCE_PATH.GLOSSARY, params).result;
  var all_unique_ids = _.map(all_objects, 'objectId');
  var expected_count = is_new ? 0 : 1;
  var actual_count = __.inclusionCount(all_unique_ids, unique_id);
  if (actual_count > expected_count) {
    __.requestError("A glossary object with unique objectId '" + unique_id + "' already exists.", 400);
  }
}

module.exports = {
  // helpers
  getRequiredKeys: getRequiredKeys,
  getAllRequiredKeys: getAllRequiredKeys,
  // validators
  class: _class,
  object: object,
};
