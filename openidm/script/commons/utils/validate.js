/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
A wrapper around the commons/lib/validate.js which adds our own custom validators to it.

http://validatejs.org/#custom-validator
*/
var _ = require('../lib/lodash4.js');
var check = require('../lib/check-types.js');
var validatejs = require('../lib/validate.js');

var __ = require('./jsUtils.js');
var commonUtils = require('./commonUtils.js');
var idmUtils = require('./idmUtils.js');

// HELPERS
var isString = validatejs.isString;

function isArrayOfStrings(value) {
  return __.__isArray(value) && check.arrayLike.of.string(value);
}

var isId = idmUtils.isInIdFormat;
var isArrayOfIds = __.isToIsAll(isId);

var isManagedObjectId = idmUtils.isInManagedObjectIdFormat;

function _isType(value, isTypeFunc, type_string) {
  var is = true;
  if ((!is) && isTypeFunc(value)) {
    return "is a " + type_string + ", but it shouldn't be";
  }
  if (is && (!isTypeFunc(value))) {
    return "is not a " + type_string + ", but it should be";
  }
  // in validate.js, returning undefined means success (because you are not returning an error).
  return undefined;
}

function getTypeChecker(type_string, constraints) {
  if (type_string === 'array') {
    if (constraints.hasOwnProperty('subType')) {
      var sub_type = constraints.subType;
      var sub_type_to_type_checker = {
        'string': isArrayOfStrings,
        'id': isArrayOfIds,
      };
      if (sub_type_to_type_checker.hasOwnProperty(sub_type)) {
        return sub_type_to_type_checker[sub_type];
      }
    }
  }
  var type_string_to_type_checker = {
    'null': _.isNull,
    'string': isString,
    'date string': commonUtils.isDateString,
    'id': isId,
    'managed object id': isManagedObjectId,
    'integer': check.integer,
    'boolean': validatejs.isBoolean,
    'object': __._isObject,
    'array': __.__isArray,
  };
  return type_string_to_type_checker[type_string];
}

// VALIDATORS TO EXPORT
/**
 * Type checking in object validation
 *
 * @param      {unknown}  value        The value being validated
 * @param      {string}  type_obj  The type that we want the value to be, expressed as a lowercase string, OR an array of such types
 * @param      {unknown}  key          The key corresponding to the value
 * @param      {Object}  obj          The object being validated
 * @return     {string}  undefined if valid, error message if invalid
 */
function typeValidator(value, type_obj, key, obj, constraints) {
  // recurse on self for each type given
  if (check.array(type_obj)) {
    var type_string_array = type_obj;
    // remember that undefined means success
    var errors = type_string_array.map(function(type_string) {
      return typeValidator(value, type_string, key, obj);
    });
    // if just one is undefined, we win
    var is_any_undefined = _.some(errors, function(error){return error === undefined;});
    if (is_any_undefined || errors.length === 0) {
      return undefined;
    }
    else {
      return errors[0];
    }
  }
  else {
    var type_string = type_obj;
    // This validator does not validate presence.  builtin 'presence' validator is for that
    if (!obj.hasOwnProperty(key)) {
      // if the key is not even present, it's valid
      return undefined;
    }
    var type_checker = getTypeChecker(type_string, constraints);
    if (_.isUndefined(type_checker)) {
      return 'Invalid or not implemented type_string: ' + type_string;
    }
    return _isType(value, type_checker, type_string);
  }
}
validatejs.validators.type = typeValidator;

/**
 * Override default presence validator.  Ours also enforces that empty strings are forbidden on required keys.
 */
validatejs.validators.presence = function(value, is_presence_required, key, obj, constraints) {
  // if {presence: false}, then don't enforce anything
  if (!is_presence_required) {
    return undefined;
  }
  // if {presence: true} and key missing, error
  else if (!obj.hasOwnProperty(key)) {
    return '' + key + ' is a required key.';
  }
  // if {presence: true} and type is string and string is the empty string, error
  else if (value === '') {
    return '' + key + ' is a required key so an empty string value will not be allowed.';
  }
  // made it through all checks, so it's valid
  else {
    return undefined;
  }
};

// CUSTOM KEYS WE USE WHICH ARE NOT ACTUALLY VALIDATORS
validatejs.validators.subType = function() {
  // subType should be validated as part of the type validator, in order to guarantee that the first type is validated before trying to iterate and validate the sub type
  return undefined;
};

validatejs.validators.defaultValue = function() {
  return undefined;
};

validatejs.validators.displayName = function(value) {
  return undefined;
};

validatejs.validators.inputType = function(value, options) {
  var validInputTypes = ['text', 'date'];
  if (validInputTypes.indexOf(options) > -1) {
    return undefined;
  }
  return 'Invalid or not implemented input type: ' + value;
};

/**
 * Make validatejs actually throw an error if invalid.
 */
var validatejsMonkeypatched = function() {
  var validatee = arguments[0];
  if (validatee === undefined) {
    __.requestError('The variable you passed into validatejs is undefined.', 500);
  }
  else {
    var error = validatejs.apply(null, arguments);
    if (!_.isUndefined(error)) {
      var error_message = JSON.stringify(error);
      if (validatee.hasOwnProperty && validatee.hasOwnProperty('_id')) {
        error_message = error_message + ' (_id=' + validatee['_id'] + ')';
      }
      __.requestError(error_message, 400);
    }
  }
};

module.exports = validatejsMonkeypatched;
