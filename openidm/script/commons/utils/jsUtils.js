/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
This file is for general javascript utility functions only.

Nothing specific to IDM or IDG should be in this file.  This file should not import any idg files -- only 3rd party general utility libraries such as lodash.  This file is essentially an extension of lodash, adding extra functions as needed.
*/
var _ = require('../lib/lodash4.js');
var check = require('../lib/check-types.js');

function isFrontEnd() {
  // Return a boolean indicating whether this function was run on the front-end (in a browser) as opposed to being run on the back-end (in RhinoJS).
  try {
    return window !== undefined;
  }
  catch(error) {
    return false;
  }
}

function requestError(msg, c) {
  // A convenience function to `throw` an error.
  if (isFrontEnd()) {
    throw msg;
  }
  else {
    throw { message: 'Error: ' + msg, code: c };
  }
}

// todo: replace all usages of this function with usages of the similar _.get
/**
 * @method get
 * @param  {Object}       base  Root object reference.
 * @param  {string|Array} path1  Dot separated path to property to return.
 * @return {*}                  Returns matched property or undefined.
 */
function get(base, path1) {
  if (!base) { return null; }
  var path = path1.split('.');
  if (path.length > 0) {
    var retval = base;
    while (path.length > 0) {
      retval = retval[path.shift()];
      if (typeof retval === 'undefined') {
        return null;
      }
    }
    return retval;
  }
  return null;
}

/*
 * @Function log
 * @param {msg} message to display on stdout
 * @param {val} value to log
 * @param {stringify} boolean to set if value should be stringified
 * @return {void}
 */
function log(msg, val, stringify) {
  if (stringify) {
    logger.warn(msg + '....' + JSON.stringify(val));
  } else {
    logger.warn(msg + '....' + val);
  }
}

function pp(value, stringify) {
  var log_func = isFrontEnd() ? console.log : print;
  if (value === true) {
    log_func('true');
  }
  else if (value === false) {
    log_func('false');
  }
  else if (stringify === true) {
    log_func(JSON.stringify(value, null, 4));
  }
  else {
    log_func(value);
  }
}

/*
 * Function indexExists
 */
function indexExists(arr, i) {
  return !!arr[i];
}

function parseIntStrict(value) {
  var int_guess = parseInt(value);
  if (check.string(value)) {
    var value_guess = int_guess.toString();
    if (value_guess !== value) {
      requestError('Invalid integer-representing string.', 400);
    }
  }
  return int_guess;
}

function parseFloatStrict(value) {
  var int_guess = parseFloat(value);
  if (check.string(value)) {
    var value_guess = int_guess.toString();
    if (value_guess !== value) {
      requestError('Invalid float-representing string.', 400);
    }
  }
  return int_guess;
}

var isAllNumber = isToIsAll(check.number);

function isNumberString(value) {
  // if it's not a string, then it's not a number string
  if (!check.string(value)) {
    return false;
  }
  // if it's a Number, then it's not a NumberString
  if (check.number(value)) {
    return false;
  }
  var f;
  try {
    f = parseFloatStrict(value);
  }
  catch (e) {
    return false;
  }
  var is = check.number(f);
  return is;
}
var isAllNumberString = isToIsAll(isNumberString);

function isNaturalNumber(value) {
  return check.integer(value) && check.greaterOrEqual(value, 0);
}

function isNaturalNumberString(value) {
  if (!isNumberString(value)) {
    return false;
  }
  else {
    var int;
    try {
      int = parseIntStrict(value);
    }
    catch (e) {
      return false;
    }
    return check.integer(int) && check.greaterOrEqual(int, 0);
  }
}
var isAllNaturalNumberString = isToIsAll(isNaturalNumberString);

/**
 * Base object detector.  Internal only.  Needs to be better...
 *
 * @param      {unknown}  param   The thing that might be a JSON object.
 * @return     {boolean}  True if object, False otherwise.
 */
function __isObject(param) {
  // Please do not use this function for typical array checking.  Use _.isArray / check.object / etc instead.  If the backed accepts a JSON object from a POST request (for example) and that object has an array in it, then this function is probably what you need.  Regular array checking won't work there.
  var is_obj = (!_.isUndefined(param)) &&
      (!_.isNull(param)) &&
      (!check.string(param)) &&
      (!check.number(param)) &&
      (!check.boolean(param)) &&
      (!check.date(param)) &&
      (!check.function(param));
  return is_obj;
}

function __isArray(param) {
  // note(ML): Empty objects are indistinguishable from empty arrays, coming from JSON.
  var keys = _.keys(param);
  var is_all_natural_number_string = isAllNaturalNumberString(keys);
  var is_array =  __isObject(param) && is_all_natural_number_string;
  return is_array;
}

/**
 * Object detection that includes objects coming in from JSON.
 *
 * @param      {unknown}   param   The thing that _might_ be an object.
 * @return     {boolean}  True if object, False otherwise.
 */
function _isObject(param) {
  // note(ML): Empty objects are indistinguishable from empty arrays, coming from JSON.
  var is_empty = _.isEmpty(param);
  var is_non_blank = (param !== undefined) && (param !== null);
  var is_plain_obj = (is_non_blank && check.object(param)) ||
                     (__isObject(param) && (is_empty || (!__isArray(param))));
  return is_plain_obj;
}

function isSubset(array1, array2) {
  // Treating each array as-if it were a set, return true if and only if array1 is a subset of array2.
  // Does not compare objects deeply.  Only by reference.
  var array1_minus_array2 = _.difference(array1, array2);
  var is_subset = _.isEmpty(array1_minus_array2);
  return is_subset;
}

function isEqualAsSets(array1, array2) {
  return isSubset(array1, array2) && isSubset(array2, array1);
}

/**
 * A default sorting method with reasonable behavior for users.
 */
function sorted(iterable) {
  var array = _.toArray(iterable);
  if (isAllNumber(array)) {
    return array.sort(function(a, b){ return a - b; });
  }
  else if (isAllNumberString(array)) {
    return array.sort(function(a, b){ return parseFloat(a) - parseFloat(b); });
  }
  else {
    return _.sortBy(array);
  }
}

/**
 * Use an array of values that have priority in the sorting order.  Fallback to standard sorting for the remaining values.
 *
 * @example sortedByPrecedence(['height', 'gender', 'name', 'id'], ['id', 'name', 'age']) // ['id', 'name', 'gender', 'height']
 * @param      {iterable} unsorted_iterable  Items to be sorted.
 * @param      {array}  priority_array  Array of priority items.
 * @param      {array} last_array=[]   Like priority items, but go at the end.
 * @return     {array}  Sorted items.
 */
function sortedByPrecedence(unsorted_iterable, priority_array, last_array) {
  // establish vars
  if (_.isUndefined(priority_array)) {
    priority_array = [];
  }
  if (_.isUndefined(last_array)) {
    last_array = [];
  }
  var unsorted_items = _.toArray(unsorted_iterable);
  var sorted_items = [];
  // priority items first, in priority order
  for (var index in priority_array) {
    var priority_item = priority_array[index];
    if (_.includes(unsorted_items, priority_item)) {
      sorted_items.push(priority_item);
    }
  }
  // gather last items pre-emptively
  var last_items_sorted = [];
  for (var index in last_array) {
    var after_item = last_array[index];
    if (_.includes(unsorted_items, after_item)) {
      last_items_sorted.push(after_item);
    }
  }
  // remaining items, in default order
  var remaining_items = _.difference(_.difference(unsorted_items, sorted_items), last_items_sorted);
  var remaining_items_sorted = sorted(remaining_items);
  sorted_items = sorted_items.concat(remaining_items_sorted);
  // last items last
  sorted_items = sorted_items.concat(last_items_sorted);
  // return
  return sorted_items;
}

/**
 * Returns the number of times `value` appears in `array`.
 */
function inclusionCount(array, value) {
  var num_occurences_of_value = 0;
  for (var i = 0; i < array.length; i++) {
    if (array[i] === value) {
      num_occurences_of_value++;
    }
  }
  return num_occurences_of_value;
}

function capitalize(string) {
  // Capitalize the first letter of string.
  // Note: If an empty string is supplied, it will return an empty string.
  // Note: This is different than lodash's _.capitalize, which lowercases all the other letters.
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function capitalizeAll(string) {
  // Capitalize the first letter of string and every first letter after a space.
  // For example, 'this is input' will become 'This Is Input'.
  return string.split(' ').map(capitalize).join(' ');
}

/**
 * Like lodash's cloneDeep, but works on RhinoJS objects too.
 */
function cloneDeep(object) {
  if (__isArray(object)) {
    var array = object;
    // need to instantiate as an array so that .forEach will be defined on the object
    var cloned_array = [];
    // clone each piece of the array
    for (var key in array) {
      var value = array[key];
      var cloned_value = cloneDeep(value);
      cloned_array.push(cloned_value);
    }
    return cloned_array;
  }
  else if (__isObject(object)) {
    var cloned_object = {};
    // clone each piece of the array
    for (var key in object) {
      var value = object[key];
      var cloned_value = cloneDeep(value);
      cloned_object[key] = cloned_value;
    }
    return cloned_object;
  }
  else {
    return _.clone(object);
  }
}

function extended(dict, extending_dict) {
  // Creates a deep copy of `dict`, adds all the key-value pairs from `extending_dict` to that, and returns the result.
  var dict_copy = _.cloneDeep(dict);
  _.assign(dict_copy, extending_dict);
  return dict_copy;
}

function extendedStrict(dict, extending_dict) {
  // Creates a deep copy of `dict`, adds all the key-value pairs from `extending_dict` to that, and returns the result.  Throws an error if any of the key-value pairs in `extending_dict` already exist in dict.
  for (var key in extending_dict) {
    if (dict.hasOwnProperty(key)) {
      requestError("Both `dict` and `extending_dict` have the same key '" + key + "'.", 500);
    }
  }
  return extended(dict, extending_dict);
}

/**
 * Overlay thing with overlaying_thing.  Especially useful for dictionaries.  See extendedDeep.
 */
function overlayed(thing, overlaying_thing) {
  if ((!__isObject(thing)) || (!__isObject(overlaying_thing))) {
    // base case
    return overlaying_thing;
  }
  else {
    // inductive step
    var overlayed_thing = _.cloneDeep(thing);
    for (var key in overlaying_thing) {
      overlayed_thing[key] = overlayed(overlayed_thing[key], overlaying_thing[key]);
    }
    return overlayed_thing;
  }
}

/**
 * Deep extension of dictionaries. Does not overwrite keys if the key is missing from the source.
 *
 * @example: extendedDeep({level1: {innerValA: 0}}, {level1: {innerValB: 0}}) // returns {level1: {innerValA: 0, innerValB: 0}}
 */
var extendedDeep = overlayed;

/**
 * Like _.cloneDeep, but works with RhinoJS
 */
function clonedDeep(thing) {
  return overlayed({}, thing);
}


function pushOntoValueArrayDict(dict, key, value) {
  // Given a "key -> values_array" dictionary `dict`, access the values array corresonding to `key` and push the value `value` onto it.
  if (!dict.hasOwnProperty(key)) {
    dict[key] = [];
  }
  dict[key].push(value);
}

function pushAllOntoValueArrayDict(dict, key, values) {
  // Given a "key -> values_array" dictionary `dict`, access the values array corresonding to `key` and push each value from `values` onto it.
  values.forEach(function(value) {
    pushOntoValueArrayDict(dict, key, value);
  });
}

function mergeValueArrayDicts(dict1, dict2) {
  // Take in two "key -> values_array" dictionaries and merge them together into a single "key -> values_array" dictionary.
  // The "values_array" arrays of the two dictionaries will be concatenated when they share the same key.
  // The inputted dictionaries are not modified.  A brand new dictionary object is returned.
  var dict = _.cloneDeep(dict1);
  _.forOwn(dict2, function(values_array, key) {
    pushAllOntoValueArrayDict(dict, key, values_array);
  });
  return dict;
}

function flattenOnce(iterable_outer) {
  // Flattens an iterable exactly one level.
  // Expects as input an iterable of iterables.
  var out = [];
  iterable_outer.forEach(function(iterable_inner) {
    iterable_inner.forEach(function(el) {
      out.push(el);
    });
  });
  return out;
}

function flattenOnceMap(get_func) {
  // Takes in a 'get' function that returns an iterable of results, and returns a 'get' function that takes in many inputs and returns an iterable of even more results
  return function() {
    var args = Array.prototype.slice.call(arguments);
    // Pull the first element out of args and store it in iterable.
    // The remaining elements are the args to feed into the get_func.
    var iterable = args.shift();
    var outs = _.map(iterable, function(it) {
      var my_args = [it].concat(args);
      return get_func.apply(null, my_args);
    });
    return flattenOnce(outs);
  };
}
var getToGetFromAll = flattenOnceMap;

function getToGetUniq(get_func) {
  // Takes in a 'get' function and outputs another 'get' function, but where the returned values are unique.
  return function() {
    var out = get_func.apply(null, arguments);
    return _.uniq(out);
  };
}

function getToGetFromAllUniq(get_func) {
  var get_from_all_func = getToGetFromAll(get_func);
  var get_from_all_uniq_func = getToGetUniq(get_from_all_func);
  return get_from_all_uniq_func;
}

function filterList(iterable, filter_list) {
  // like _.filter, but can accept multiple filters
  if (filter_list === undefined) {
    throw {message: 'Missing argument.', code: 500};
  }
  if (!_.isArray(filter_list)) {
    throw {message: 'filter_list must be an array of filter functions.', code: 500};
  }
  filter_list.forEach(function(filter_func) {
    iterable = _.filter(iterable, filter_func);
  });
  return iterable;
}

function isToIsNot(is_func) {
  // Takes in an 'is' function and returns an 'is not' function.
  // An 'is' function is a function returning a boolean saying whether a condition is satisfied.
  // An 'is not' function is a function returning a boolean saying whether a condition is *not* satisfied.
  return function() {
    return !is_func.apply(null, arguments);
  };
}

function _isToIsList(is_func) {
  // note(ML): exists as helper for isToIsAll and isToIsAny.  Could be useful in other contexts.
  // Takes in an 'is' function and returns an 'is-list' function.
  // An 'is' function is a function returning a boolean saying whether a condition is satisfied.
  // An 'is-list' function is a function returning an *array* of booleans saying whether a condition is satisfied on each input.
  return function() {
    var args = Array.prototype.slice.call(arguments);
    // Pull the first element out of args and store it in iterable.
    // The remaining elements are the args to feed into the is_func, if any.
    var iterable = args.shift();
    var bools = _.map(iterable, function(it) {
      var my_args = [it].concat(args);
      return is_func.apply(null, my_args);
    });
    return bools;
  };
}

function isToIsAll(is_func) {
  // Takes in an 'is' function and returns an 'every'/'isAll' function.
  // An 'is' function is a function returning a boolean saying whether a condition is satisfied.
  // An 'isAll' function is a function returning a boolean saying whether a condition is satisfied on all inputs.
  return function() {
    var is_list_func = _isToIsList(is_func);
    var bools = is_list_func.apply(null, arguments);
    return _.every(bools);
  };
}

function isToIsAny(is_func) {
  // Takes in an 'is' function and returns an 'any'/'isAny' function.
  // An 'is' function is a function returning a boolean saying whether a condition is satisfied.
  // An 'isAny' function is a function returning a boolean saying whether a condition is satisfied on at least one of the inputs.
  return function() {
    var is_list_func = _isToIsList(is_func);
    var bools = is_list_func.apply(null, arguments);
    return _.some(bools);
  };
}

function sum(iterable) {
  // Given an iterable of numbers, return the sum of the numbers.
  return _.reduce(iterable, function(sum_so_far, number){return sum_so_far + number;}, 0);
}

// todo: replace usages of deepSet w/ usages of similar _.set
/**
* @method deepSet
* @param {Object|Array} obj - input object
* @param {Array} props - list of properties defining a key path
* @param {Boolean} create - boolean indicating whether to create a path if the key path does not already exist
* @param {*} val - value to set
* @returns {Boolean} boolean indicating if the property was successfully set
*/
function deepSet(obj, props, create, val) {
  var len = props.length;
  var bool = false;
  var v = obj,
    p = null,
    i = null;

  for (i = 0; i < len; i++) {
    p = props[i];
    if (typeof v === 'object' && v !== null) {
      if (!v.hasOwnProperty(p)) {
        if (create) {
          v[p] = {};
        } else {
          break;
        }
      }
      if (i === len - 1) {
        if (typeof val === 'function') {
          v[p] = val(v[p]);
        } else {
          v[p] = val;
        }
        bool = true;
      } else {
        v = v[p];
      }
    } else {
      break;
    }
  }
  return bool;
}

// todo: possibly replace deepDelete w usages of _.unset instead
/**
 * @method deepDelete
 * @param {ctx} ctx to delete from
 * @param {target} target to key in ctx to delete
 * @return {void}
 */
function deepDelete(ctx, target) {
  var targets = target.split('.');

  if (targets.length > 1) {
    deepDelete(ctx[targets[0]], targets.slice(1).join('.'));
  } else {
    delete ctx[target];
  }
}

function splitString(string, delimiter) {
  // Unlike the default split method, this one returns [] when given "".
  if (string === '') {
    return [];
  }
  else {
    return string.split(delimiter);
  }
}

function splitCommaSeparatedString(string) {
  // Unlike the default split method, this one returns [] when given "".
  return splitString(string, ',');
}

function formatStringTemplate(string_template, data_object) {
  var interpolated = string_template.replace(/\{\{(\w+)\}\}+/g, function(match, capture) {
    return data_object[capture];
  });
  return interpolated;
}

module.exports = {
  // low-level conveniences
  isFrontEnd: isFrontEnd,
  requestError: requestError,
  log: log,
  pp: pp,
  // things for objects (aka dictionaries)
  get: get,
  deepSet: deepSet,
  deepDelete: deepDelete,
  extended: extended,
  extendedDeep: extendedDeep,
  clonedDeep: clonedDeep,
  extendedStrict: extendedStrict,
  cloneDeep: cloneDeep,
  pushOntoValueArrayDict: pushOntoValueArrayDict,
  pushAllOntoValueArrayDict: pushAllOntoValueArrayDict,
  mergeValueArrayDicts: mergeValueArrayDicts,
  // things for arrays and iterables
  indexExists: indexExists,
  __isArray: __isArray,
  isSubset: isSubset,
  isEqualAsSets: isEqualAsSets,
  sorted: sorted,
  sortedByPrecedence: sortedByPrecedence,
  inclusionCount: inclusionCount,
  // things for strings
  splitString: splitString,
  splitCommaSeparatedString: splitCommaSeparatedString,
  capitalize: capitalize,
  capitalizeAll: capitalizeAll,
  formatStringTemplate: formatStringTemplate,
  parseIntStrict: parseIntStrict,
  // type checkers
  _isObject: _isObject,
  isNumberString: isNumberString,
  isAllNumberString: isAllNumberString,
  isNaturalNumber: isNaturalNumber,
  isNaturalNumberString: isNaturalNumberString,
  // folds (higher-order functions)
  flattenOnce: flattenOnce,
  flattenOnceMap: flattenOnceMap,
  filterList: filterList,
  sum: sum,
  // decorators (they generate new functions from old ones)
  isToIsNot: isToIsNot,
  isToIsAll: isToIsAll,
  isToIsAny: isToIsAny,
  getToGetUniq: getToGetUniq,
  getToGetFromAll: getToGetFromAll,
  getToGetFromAllUniq: getToGetFromAllUniq,
};
