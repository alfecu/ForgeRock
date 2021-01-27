/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
This file is about converting user-inputted strings (or non strings) to specific types depending on the type specified in the constraint object.
*/
var _ = require('../lib/lodash4.js');
var check = require('../lib/check-types.js');
var moment = require('../lib/moment.js');
var __ = require('./jsUtils.js');
var CONSTANT = require('./globalConstants.js');

function userInputtedValueToString(value) {
  return value.toString();
}

function userInputtedValueToBoolean(value) {
  if (check.boolean(value)) {
    return value;
  }
  // now assume it's a string
  value = value.toLowerCase();
  if (_.includes(['true', 'yes'], value)) {
    return true;
  }
  else if (_.includes(['false', 'no'], value)) {
    return false;
  }
  else {
    __.requestError('Invalid boolean-representing string.', 400);
  }
}

function userInputtedValueToDateString(value) {
  var moment_obj = moment.utc(value);
  if (!moment_obj.isValid()) {
    __.requestError('Invalid date-representing value.', 400);
  }
  var date_formatted = moment_obj.format(CONSTANT.DATE_STRING_FORMAT);
  return date_formatted;
}

function userInputtedValueToArrayOfStrings(value) {
  if (__.__isArray(value)) {
    return value;
  }
  else {
    return __.splitCommaSeparatedString(value);
  }
}

var userInputtedValueToFloat = parseFloat;

var userInputtedValueToInteger = parseInt;

function userInputtedValueToNumber(value, numericality_obj) {
  if (numericality_obj['onlyInteger'] === true) {
    return userInputtedValueToInteger(value);
  }
  else {
    return userInputtedValueToFloat(value);
  }
}

function typeCastValue(value, type_obj) {
  // type_obj is, for example, {type: 'boolean'}
  if (type_obj.type === 'string') {
    return userInputtedValueToString(value);
  }
  else if (type_obj.type === 'boolean') {
    return userInputtedValueToBoolean(value);
  }
  else if (type_obj.type === 'date string') {
    return userInputtedValueToDateString(value);
  }
  else if (type_obj.hasOwnProperty('numericality')) {
    return userInputtedValueToNumber(value, type_obj['numericality']);
  }
  else if (type_obj.type === 'array' && type_obj.subType === 'string') {
    return userInputtedValueToArrayOfStrings(value);
  }
  else {
    // some values don't need a specified type, such as 'attributeValue'
    return value;
  }
}

module.exports = {
  userInputtedValueToDateString: userInputtedValueToDateString,
  typeCastValue: typeCastValue,
};
