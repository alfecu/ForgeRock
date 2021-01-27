/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
Functions belong here if they are more than pure javascript utilities (hence cannot be in jsUtils.js) and are not specific to IDM / do not depend on the openidm variable (hence shouldn't be in idmUtils.js).
*/
var _ = require('../lib/lodash4.js');
var check = require('../lib/check-types.js');

var CONSTANT = require('./globalConstants.js');
var qf = require('./queryFilterBuilder.js');
var glossaryConstraints = require('./glossaryConstraints.js');
var convert = require('./constraintsConverters.js');


/**
 * Read information from the current config object for Commons. You should always go through this module because it may enforce data protection.
 *
 * @return     {Object}  The configuration object.
 */
function getConfig(strict) {
  var config_obj = openidm.read('config/commons');
  if (strict) {
    // validation would go here, once implemented
    // validate.config(config_obj);
  }
  return config_obj;
}

/**
 * Sets the commons.json config object if it passes validation.
 *
 * @param      {Object}  new_config_obj  The new configuration object
 */
function setConfig(new_config_obj) {
  // validation would go here, once implemented
  // validate.config(new_config_obj);
  openidm.update('/config/commons', null, new_config_obj);
}

function isDateString(value) {
  var value_converted_to_date_string = null;
  try {
    value_converted_to_date_string = convert.userInputtedValueToDateString(value);
  }
  catch (e) {
    return false;
  }
  return value_converted_to_date_string === value;
}

function defaultToDefaultValues(obj, constraint_obj, blank_value) {
  // Replace blank values with default values in an object according to its constraint definition (see a constraint object in glossaryConstraints.js for an example of a constraint definition).
  var c = constraint_obj;
  _.forOwn(obj, function(value, key) {
    // if the current value is blank
    if (value === blank_value) {
      // if a default value exists for this key
      if (c.hasOwnProperty(key) && c[key].hasOwnProperty('defaultValue')) {
        obj[key] = _.cloneDeep(c[key]['defaultValue']);
      }
    }
  });
}

function doesKeyHaveFiniteValues(key, constraints) {
  var c = constraints[key];
  var has_finite_values = constraints.hasOwnProperty(key) &&
      (
        (c.hasOwnProperty('type') && c['type'] === 'boolean') ||
        (c.hasOwnProperty('inclusion') && c['inclusion'].hasOwnProperty('within'))
      );
  return has_finite_values;
}

function getFiniteValuesForKey(key, constraints) {
  if (constraints[key]['type'] === 'boolean') {
    return [true, false];
  }
  else {
    var values = constraints[key]['inclusion']['within'];
    check.assert.array(values);
    return values;
  }
}

function isKeyConstrained(key, constraints) {
  return constraints.hasOwnProperty(key);
}

/**
 * The constrained keys are the keys that appear in the constraints object.
 */
function getConstrainedKeys() {
  if (!!arguments[1]) {
    __.requestError('This function only takes 1 argument.', 500);
  }
  var constraints = arguments[0];
  return _.keys(constraints);
}

function isKeyRequired(key, constraints) {
  return isKeyConstrained(key, constraints) && constraints[key].presence;
}

function getRequiredKeys(constraints) {
  var required_keys = [];
  for (var key in constraints) {
    if (isKeyRequired(key, constraints)) {
      required_keys.push(key);
    }
  }
  return required_keys;
}

/**
 * The unconstrained keys are the keys in the object that are *not* constrained.
 */
function getUnconstrainedKeys(obj, constraints) {
  var keys = _.keys(obj);
  var constrained_keys = getConstrainedKeys(constraints);
  var unconstrained_keys = _.difference(keys, constrained_keys);
  return unconstrained_keys;
}

function typeCastedObjectValues(obj, constraints) {
  // Given an object who's values are user-inputted strings, try to typecast each value to what it should be based on the constraints.
  var new_obj = _.cloneDeep(obj);
  for (var key in obj) {
    if (constraints.hasOwnProperty(key)) {
      var value = obj[key];
      var type_obj = constraints[key];
      var new_value = convert.typeCastValue(value, type_obj);
      new_obj[key] = new_value;
    }
  }
  return new_obj;
}

/**
 * Given a key and a constraints object, return the 'type' associated with that key specified in the constraints object.
 *
 * @param      {string}  key     The key
 * @param      {object}  obj     The constraints object
 * @return     {string}  The type specified in the constraints object.
 */
function getTypeFromConstraintsObject(key, obj) {
  try {
    return obj[key]['type'];
  }
  catch (e) {
    return undefined;
  }
}

/**
 * Get all the keys from a glossary object that are not mentioned in glossaryConstraints.js.
 */
function getConstrainedKeysOfGlossaryObject(obj) {
  var c = glossaryConstraints[obj['class']];
  var constrained_keys = getConstrainedKeys(c);
  return constrained_keys;
}

/**
 * Get all the constrained keys from a glossary object.
 */
function getCustomKeysOfGlossaryObject(obj) {
  var c = glossaryConstraints[obj['class']];
  var custom_keys = getUnconstrainedKeys(obj, c);
  return custom_keys;
}

function getExportIdFromManagedObjectId(managed_object_id) {
  var managed_object_type = idmUtils.getManagedObjectTypeFromLongId(managed_object_id);
  var export_property = getConfig()['managedObjectConfig'][managed_object_type]['exportProperty'];
  var managed_object = idmUtils.readStrict(managed_object_id, null, [export_property]);
  var export_id = managed_object[export_property];
  return export_id;
}

function getManagedObjectIdFromExportIdAndType(export_id, managed_object_type) {
  var export_property = getConfig()['managedObjectConfig'][managed_object_type]['exportProperty'];
  var params = {
    _queryFilter: qf.eq(export_property, export_id),
  };
  var all_matches = openidm.query(CONSTANT.RESOURCE_PATH.MANAGED + managed_object_type, params).result;
  if (all_matches.length) {
    var first_match = all_matches[0];
    var short_managed_object_id = first_match['_id'];
    var long_managed_object_id = 'managed/' + managed_object_type + '/' + short_managed_object_id;
    return long_managed_object_id;
  }
  else {
    return null;
  }
}

function getManagedObjectIdFromExportId(export_id) {
  var managed_object_types = _.keys(getConfig()['managedObjectConfig']);
  for (var index in managed_object_types) {
    var managed_object_type = managed_object_types[index];
    var managed_object_id = getManagedObjectIdFromExportIdAndType(export_id, managed_object_type);
    // if something was found
    if (managed_object_id) {
      return managed_object_id;
    }
  }
  __.requestError('Managed object with export id ' + export_id + ' not found.', 500);
}

module.exports = {
  getConfig: getConfig,
  setConfig: setConfig,
  isDateString: isDateString,
  defaultToDefaultValues: defaultToDefaultValues,
  doesKeyHaveFiniteValues: doesKeyHaveFiniteValues,
  getFiniteValuesForKey: getFiniteValuesForKey,
  getRequiredKeys: getRequiredKeys,
  isKeyRequired: isKeyRequired,
  typeCastedObjectValues: typeCastedObjectValues,
  getTypeFromConstraintsObject: getTypeFromConstraintsObject,
  getConstrainedKeysOfGlossaryObject: getConstrainedKeysOfGlossaryObject,
  getCustomKeysOfGlossaryObject: getCustomKeysOfGlossaryObject,
  getExportIdFromManagedObjectId: getExportIdFromManagedObjectId,
  getManagedObjectIdFromExportId: getManagedObjectIdFromExportId,
};
