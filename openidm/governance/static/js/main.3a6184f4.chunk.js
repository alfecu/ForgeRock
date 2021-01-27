(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[0],{

/***/ 141:
/***/ (function(module, exports, __webpack_require__) {

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
var _ = __webpack_require__(255);

var check = __webpack_require__(411);

function isFrontEnd() {
  // Return a boolean indicating whether this function was run on the front-end (in a browser) as opposed to being run on the back-end (in RhinoJS).
  try {
    return window !== undefined;
  } catch (error) {
    return false;
  }
}

function requestError(msg, c) {
  // A convenience function to `throw` an error.
  if (isFrontEnd()) {
    throw msg;
  } else {
    throw {
      message: 'Error: ' + msg,
      code: c
    };
  }
} // todo: replace all usages of this function with usages of the similar _.get

/**
 * @method get
 * @param  {Object}       base  Root object reference.
 * @param  {string|Array} path1  Dot separated path to property to return.
 * @return {*}                  Returns matched property or undefined.
 */


function get(base, path1) {
  if (!base) {
    return null;
  }

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
  } else if (value === false) {
    log_func('false');
  } else if (stringify === true) {
    log_func(JSON.stringify(value, null, 4));
  } else {
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
  } // if it's a Number, then it's not a NumberString


  if (check.number(value)) {
    return false;
  }

  var f;

  try {
    f = parseFloatStrict(value);
  } catch (e) {
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
  } else {
    var int;

    try {
      int = parseIntStrict(value);
    } catch (e) {
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
  var is_obj = !_.isUndefined(param) && !_.isNull(param) && !check.string(param) && !check.number(param) && !check.boolean(param) && !check.date(param) && !check.function(param);
  return is_obj;
}

function __isArray(param) {
  // note(ML): Empty objects are indistinguishable from empty arrays, coming from JSON.
  var keys = _.keys(param);

  var is_all_natural_number_string = isAllNaturalNumberString(keys);
  var is_array = __isObject(param) && is_all_natural_number_string;
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

  var is_non_blank = param !== undefined && param !== null;
  var is_plain_obj = is_non_blank && check.object(param) || __isObject(param) && (is_empty || !__isArray(param));
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
    return array.sort(function (a, b) {
      return a - b;
    });
  } else if (isAllNumberString(array)) {
    return array.sort(function (a, b) {
      return parseFloat(a) - parseFloat(b);
    });
  } else {
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

  var sorted_items = []; // priority items first, in priority order

  for (var index in priority_array) {
    var priority_item = priority_array[index];

    if (_.includes(unsorted_items, priority_item)) {
      sorted_items.push(priority_item);
    }
  } // gather last items pre-emptively


  var last_items_sorted = [];

  for (var index in last_array) {
    var after_item = last_array[index];

    if (_.includes(unsorted_items, after_item)) {
      last_items_sorted.push(after_item);
    }
  } // remaining items, in default order


  var remaining_items = _.difference(_.difference(unsorted_items, sorted_items), last_items_sorted);

  var remaining_items_sorted = sorted(remaining_items);
  sorted_items = sorted_items.concat(remaining_items_sorted); // last items last

  sorted_items = sorted_items.concat(last_items_sorted); // return

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
    var array = object; // need to instantiate as an array so that .forEach will be defined on the object

    var cloned_array = []; // clone each piece of the array

    for (var key in array) {
      var value = array[key];
      var cloned_value = cloneDeep(value);
      cloned_array.push(cloned_value);
    }

    return cloned_array;
  } else if (__isObject(object)) {
    var cloned_object = {}; // clone each piece of the array

    for (var key in object) {
      var value = object[key];
      var cloned_value = cloneDeep(value);
      cloned_object[key] = cloned_value;
    }

    return cloned_object;
  } else {
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
  if (!__isObject(thing) || !__isObject(overlaying_thing)) {
    // base case
    return overlaying_thing;
  } else {
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
  values.forEach(function (value) {
    pushOntoValueArrayDict(dict, key, value);
  });
}

function mergeValueArrayDicts(dict1, dict2) {
  // Take in two "key -> values_array" dictionaries and merge them together into a single "key -> values_array" dictionary.
  // The "values_array" arrays of the two dictionaries will be concatenated when they share the same key.
  // The inputted dictionaries are not modified.  A brand new dictionary object is returned.
  var dict = _.cloneDeep(dict1);

  _.forOwn(dict2, function (values_array, key) {
    pushAllOntoValueArrayDict(dict, key, values_array);
  });

  return dict;
}

function flattenOnce(iterable_outer) {
  // Flattens an iterable exactly one level.
  // Expects as input an iterable of iterables.
  var out = [];
  iterable_outer.forEach(function (iterable_inner) {
    iterable_inner.forEach(function (el) {
      out.push(el);
    });
  });
  return out;
}

function flattenOnceMap(get_func) {
  // Takes in a 'get' function that returns an iterable of results, and returns a 'get' function that takes in many inputs and returns an iterable of even more results
  return function () {
    var args = Array.prototype.slice.call(arguments); // Pull the first element out of args and store it in iterable.
    // The remaining elements are the args to feed into the get_func.

    var iterable = args.shift();

    var outs = _.map(iterable, function (it) {
      var my_args = [it].concat(args);
      return get_func.apply(null, my_args);
    });

    return flattenOnce(outs);
  };
}

var getToGetFromAll = flattenOnceMap;

function getToGetUniq(get_func) {
  // Takes in a 'get' function and outputs another 'get' function, but where the returned values are unique.
  return function () {
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
    throw {
      message: 'Missing argument.',
      code: 500
    };
  }

  if (!_.isArray(filter_list)) {
    throw {
      message: 'filter_list must be an array of filter functions.',
      code: 500
    };
  }

  filter_list.forEach(function (filter_func) {
    iterable = _.filter(iterable, filter_func);
  });
  return iterable;
}

function isToIsNot(is_func) {
  // Takes in an 'is' function and returns an 'is not' function.
  // An 'is' function is a function returning a boolean saying whether a condition is satisfied.
  // An 'is not' function is a function returning a boolean saying whether a condition is *not* satisfied.
  return function () {
    return !is_func.apply(null, arguments);
  };
}

function _isToIsList(is_func) {
  // note(ML): exists as helper for isToIsAll and isToIsAny.  Could be useful in other contexts.
  // Takes in an 'is' function and returns an 'is-list' function.
  // An 'is' function is a function returning a boolean saying whether a condition is satisfied.
  // An 'is-list' function is a function returning an *array* of booleans saying whether a condition is satisfied on each input.
  return function () {
    var args = Array.prototype.slice.call(arguments); // Pull the first element out of args and store it in iterable.
    // The remaining elements are the args to feed into the is_func, if any.

    var iterable = args.shift();

    var bools = _.map(iterable, function (it) {
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
  return function () {
    var is_list_func = _isToIsList(is_func);

    var bools = is_list_func.apply(null, arguments);
    return _.every(bools);
  };
}

function isToIsAny(is_func) {
  // Takes in an 'is' function and returns an 'any'/'isAny' function.
  // An 'is' function is a function returning a boolean saying whether a condition is satisfied.
  // An 'isAny' function is a function returning a boolean saying whether a condition is satisfied on at least one of the inputs.
  return function () {
    var is_list_func = _isToIsList(is_func);

    var bools = is_list_func.apply(null, arguments);
    return _.some(bools);
  };
}

function sum(iterable) {
  // Given an iterable of numbers, return the sum of the numbers.
  return _.reduce(iterable, function (sum_so_far, number) {
    return sum_so_far + number;
  }, 0);
} // todo: replace usages of deepSet w/ usages of similar _.set

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
} // todo: possibly replace deepDelete w usages of _.unset instead

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
  } else {
    return string.split(delimiter);
  }
}

function splitCommaSeparatedString(string) {
  // Unlike the default split method, this one returns [] when given "".
  return splitString(string, ',');
}

function formatStringTemplate(string_template, data_object) {
  var interpolated = string_template.replace(/\{\{(\w+)\}\}+/g, function (match, capture) {
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
  getToGetFromAllUniq: getToGetFromAllUniq
};

/***/ }),

/***/ 174:
/***/ (function(module, exports) {

/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
Frontend configuration things.
*/
module.exports = {
  alert: {
    // The default or base configuration for alerts. These get passed as props into SnackbarProvider in index.js
    baseProps: {
      maxSnack: 1,
      autoHideDuration: 7000,
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'right'
      },
      preventDuplicate: false,
      hideIconVariant: true
    },
    // alert configuration specific to each alert level
    levelToOptions: {
      success: {
        variant: 'success',
        autoHideDuration: 3500,
        // no 'x' button, because it automatically goes away fairly quickly
        action: function action() {
          return null;
        }
      },
      info: {
        variant: 'info',
        autoHideDuration: 9000
      },
      warning: {
        variant: 'warning',
        autoHideDuration: 7000
      },
      error: {
        variant: 'error',
        autoHideDuration: 15000
      }
    }
  }
};

/***/ }),

/***/ 222:
/***/ (function(module, exports, __webpack_require__) {

/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
This file is for all constants that are global to Commons (and hence can be used in any module built on idm, such as IDG and Access Request).
To demonstrate their global constantness, we put them in UPPER_SNAKE_CASE.
*/
var _ = __webpack_require__(255); // idm constants
// Regex that matches IDM id format, such as 35985500-57c9-4653-bc44-4542310f3b5f
// An IDM _id consists of 8 hexademical digits, then a dash, then 4 dash 4 dash 4 dash 12.


var ID_SUB_PATTERN = '[a-f\\d]{8}-[a-f\\d]{4}-[a-f\\d]{4}-[a-f\\d]{4}-[a-f\\d]{12}';
var ID_PATTERN = new RegExp('^' + ID_SUB_PATTERN + '$');
var MANAGED_OBJECT_ID_PATTERN = new RegExp('^managed/.*/' + ID_SUB_PATTERN + '$'); // Regex that matches activiti user task id format, such as 1127

var USER_TASK_ID_PATTERN = /^\d+$/; // the moment.js format specification of the date strings that IDM uses
// example formatted date: 2019-08-03T04:00:00.000Z

var DATE_STRING_FORMAT = 'YYYY-MM-DD[T]HH[:]mm[:]ss[.]SSS[Z]'; // a list of all types that appear across all our constraints.

var TYPES = ['string', 'boolean', 'integer', 'id', 'managed object id', 'object', 'array', 'date string']; // a sublist of TYPES which includes only the NON-scalar types.  Corresponding values need to be JSON-stringified on export.

var NONSCALAR_TYPES = ['object', 'array']; // idm methods

var IDM_METHOD = {
  READ: 'READ',
  QUERY: 'QUERY'
}; // glossary stuff

var GLOSSARY_CLASS_TO_UNIQUE_KEY_COMBINATION = {
  'identity': ['class', 'attributeName'],
  'identity-value': ['class', 'attributeName', 'attributeValue'],
  // there should only be one glossary object of type 'object' for any given objectId, but that is enforced in glossaryCRUD
  'object': ['class', 'objectId'],
  'system': ['class', 'name'],
  'system-attribute': ['class', 'system', 'attributeName'],
  'system-value': ['class', 'system', 'attributeName', 'attributeValue'],
  'requestable-item-bundle': ['class', 'name']
};

var GLOSSARY_CLASSES = _.keys(GLOSSARY_CLASS_TO_UNIQUE_KEY_COMBINATION); // There is a natural dependency structure of glossary objects of different types.


var GLOSSARY_CLASS_DEPENDENCY_ORDER = [// 'identity' must exist before an 'identity-value' that refers to it
'identity', 'identity-value', // 'system' must exist before 'system-attribute' which must exist before 'system-value'
'system', 'system-attribute', 'system-value', // requestable items should exist before bundles that refer to them
'object', 'requestable-item-bundle'];
var GLOSSARY_KEY_PRIORITIZATION_ORDER = ['_id', 'class', 'name', 'system', 'attributeName', 'attributeValue', 'objectId', 'requestable', 'type', 'objectType', 'order', 'idgOwner', 'certifiable', 'displayable', 'riskLevel'];
var GLOSSARY_LAST_KEY_ORDER = ['']; // roles

var ROLE = {
  IDM_AUTHORIZED: 'openidm-authorized',
  IDM_ADMIN: 'openidm-admin',
  AR_ADMIN: 'access-request-admin',
  GOV_ADMIN: 'governance-administrator',
  // for glossary stuff only (not necc other commons stuff)
  GLOSSARY_ADMIN: 'glossary-admin'
}; // query filter constants (only simple constants here.  See queryFilter.js for more complex filters)

var QUERY_FILTER = {
  TRUE: 'true',
  FALSE: 'false'
}; // resource path constants

var RESOURCE_PATH = {
  GLOSSARY: 'repo/glossary/',
  MANAGED: 'managed/'
}; // The amount of time to wait before firing an event when debouncing a typeahead (frontend only)

var DEBOUNCE_TYPEAHEAD_WAIT_TIME = 250; // The default type of a managed object, currently only used for GUI managed object searching

var DEFAULT_MANAGED_OBJECT_TYPE = 'user';
module.exports = {
  ID_PATTERN: ID_PATTERN,
  MANAGED_OBJECT_ID_PATTERN: MANAGED_OBJECT_ID_PATTERN,
  USER_TASK_ID_PATTERN: USER_TASK_ID_PATTERN,
  DATE_STRING_FORMAT: DATE_STRING_FORMAT,
  IDM_METHOD: IDM_METHOD,
  TYPES: TYPES,
  NONSCALAR_TYPES: NONSCALAR_TYPES,
  GLOSSARY_CLASSES: GLOSSARY_CLASSES,
  GLOSSARY_CLASS_DEPENDENCY_ORDER: GLOSSARY_CLASS_DEPENDENCY_ORDER,
  GLOSSARY_CLASS_TO_UNIQUE_KEY_COMBINATION: GLOSSARY_CLASS_TO_UNIQUE_KEY_COMBINATION,
  GLOSSARY_KEY_PRIORITIZATION_ORDER: GLOSSARY_KEY_PRIORITIZATION_ORDER,
  GLOSSARY_LAST_KEY_ORDER: GLOSSARY_LAST_KEY_ORDER,
  ROLE: ROLE,
  QUERY_FILTER: QUERY_FILTER,
  RESOURCE_PATH: RESOURCE_PATH,
  // frontend-only things
  DEBOUNCE_TYPEAHEAD_WAIT_TIME: DEBOUNCE_TYPEAHEAD_WAIT_TIME,
  DEFAULT_MANAGED_OBJECT_TYPE: DEFAULT_MANAGED_OBJECT_TYPE
};

/***/ }),

/***/ 255:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global, module) {var __WEBPACK_AMD_DEFINE_RESULT__;/**
 * @license
 * Lodash lodash.com/license | Underscore.js 1.8.3 underscorejs.org/LICENSE
 */
;
(function () {
  function n(n, t, r) {
    switch (r.length) {
      case 0:
        return n.call(t);

      case 1:
        return n.call(t, r[0]);

      case 2:
        return n.call(t, r[0], r[1]);

      case 3:
        return n.call(t, r[0], r[1], r[2]);
    }

    return n.apply(t, r);
  }

  function t(n, t, r, e) {
    for (var u = -1, i = null == n ? 0 : n.length; ++u < i;) {
      var o = n[u];
      t(e, o, r(o), n);
    }

    return e;
  }

  function r(n, t) {
    for (var r = -1, e = null == n ? 0 : n.length; ++r < e && false !== t(n[r], r, n);) {
      ;
    }

    return n;
  }

  function e(n, t) {
    for (var r = null == n ? 0 : n.length; r-- && false !== t(n[r], r, n);) {
      ;
    }

    return n;
  }

  function u(n, t) {
    for (var r = -1, e = null == n ? 0 : n.length; ++r < e;) {
      if (!t(n[r], r, n)) return false;
    }

    return true;
  }

  function i(n, t) {
    for (var r = -1, e = null == n ? 0 : n.length, u = 0, i = []; ++r < e;) {
      var o = n[r];
      t(o, r, n) && (i[u++] = o);
    }

    return i;
  }

  function o(n, t) {
    return !(null == n || !n.length) && -1 < v(n, t, 0);
  }

  function f(n, t, r) {
    for (var e = -1, u = null == n ? 0 : n.length; ++e < u;) {
      if (r(t, n[e])) return true;
    }

    return false;
  }

  function c(n, t) {
    for (var r = -1, e = null == n ? 0 : n.length, u = Array(e); ++r < e;) {
      u[r] = t(n[r], r, n);
    }

    return u;
  }

  function a(n, t) {
    for (var r = -1, e = t.length, u = n.length; ++r < e;) {
      n[u + r] = t[r];
    }

    return n;
  }

  function l(n, t, r, e) {
    var u = -1,
        i = null == n ? 0 : n.length;

    for (e && i && (r = n[++u]); ++u < i;) {
      r = t(r, n[u], u, n);
    }

    return r;
  }

  function s(n, t, r, e) {
    var u = null == n ? 0 : n.length;

    for (e && u && (r = n[--u]); u--;) {
      r = t(r, n[u], u, n);
    }

    return r;
  }

  function h(n, t) {
    for (var r = -1, e = null == n ? 0 : n.length; ++r < e;) {
      if (t(n[r], r, n)) return true;
    }

    return false;
  }

  function p(n, t, r) {
    var e;
    return r(n, function (n, r, u) {
      if (t(n, r, u)) return e = r, false;
    }), e;
  }

  function _(n, t, r, e) {
    var u = n.length;

    for (r += e ? 1 : -1; e ? r-- : ++r < u;) {
      if (t(n[r], r, n)) return r;
    }

    return -1;
  }

  function v(n, t, r) {
    if (t === t) n: {
      --r;

      for (var e = n.length; ++r < e;) {
        if (n[r] === t) {
          n = r;
          break n;
        }
      }

      n = -1;
    } else n = _(n, d, r);
    return n;
  }

  function g(n, t, r, e) {
    --r;

    for (var u = n.length; ++r < u;) {
      if (e(n[r], t)) return r;
    }

    return -1;
  }

  function d(n) {
    return n !== n;
  }

  function y(n, t) {
    var r = null == n ? 0 : n.length;
    return r ? m(n, t) / r : F;
  }

  function b(n) {
    return function (t) {
      return null == t ? T : t[n];
    };
  }

  function x(n) {
    return function (t) {
      return null == n ? T : n[t];
    };
  }

  function j(n, t, r, e, u) {
    return u(n, function (n, u, i) {
      r = e ? (e = false, n) : t(r, n, u, i);
    }), r;
  }

  function w(n, t) {
    var r = n.length;

    for (n.sort(t); r--;) {
      n[r] = n[r].c;
    }

    return n;
  }

  function m(n, t) {
    for (var r, e = -1, u = n.length; ++e < u;) {
      var i = t(n[e]);
      i !== T && (r = r === T ? i : r + i);
    }

    return r;
  }

  function A(n, t) {
    for (var r = -1, e = Array(n); ++r < n;) {
      e[r] = t(r);
    }

    return e;
  }

  function E(n, t) {
    return c(t, function (t) {
      return [t, n[t]];
    });
  }

  function k(n) {
    return function (t) {
      return n(t);
    };
  }

  function S(n, t) {
    return c(t, function (t) {
      return n[t];
    });
  }

  function O(n, t) {
    return n.has(t);
  }

  function I(n, t) {
    for (var r = -1, e = n.length; ++r < e && -1 < v(t, n[r], 0);) {
      ;
    }

    return r;
  }

  function R(n, t) {
    for (var r = n.length; r-- && -1 < v(t, n[r], 0);) {
      ;
    }

    return r;
  }

  function z(n) {
    return "\\" + Un[n];
  }

  function W(n) {
    var t = -1,
        r = Array(n.size);
    return n.forEach(function (n, e) {
      r[++t] = [e, n];
    }), r;
  }

  function B(n, t) {
    return function (r) {
      return n(t(r));
    };
  }

  function L(n, t) {
    for (var r = -1, e = n.length, u = 0, i = []; ++r < e;) {
      var o = n[r];
      o !== t && "__lodash_placeholder__" !== o || (n[r] = "__lodash_placeholder__", i[u++] = r);
    }

    return i;
  }

  function U(n) {
    var t = -1,
        r = Array(n.size);
    return n.forEach(function (n) {
      r[++t] = n;
    }), r;
  }

  function C(n) {
    var t = -1,
        r = Array(n.size);
    return n.forEach(function (n) {
      r[++t] = [n, n];
    }), r;
  }

  function D(n) {
    if (Rn.test(n)) {
      for (var t = On.lastIndex = 0; On.test(n);) {
        ++t;
      }

      n = t;
    } else n = Qn(n);

    return n;
  }

  function M(n) {
    return Rn.test(n) ? n.match(On) || [] : n.split("");
  }

  var T,
      $ = 1 / 0,
      F = NaN,
      N = [["ary", 128], ["bind", 1], ["bindKey", 2], ["curry", 8], ["curryRight", 16], ["flip", 512], ["partial", 32], ["partialRight", 64], ["rearg", 256]],
      P = /\b__p\+='';/g,
      Z = /\b(__p\+=)''\+/g,
      q = /(__e\(.*?\)|\b__t\))\+'';/g,
      V = /&(?:amp|lt|gt|quot|#39);/g,
      K = /[&<>"']/g,
      G = RegExp(V.source),
      H = RegExp(K.source),
      J = /<%-([\s\S]+?)%>/g,
      Y = /<%([\s\S]+?)%>/g,
      Q = /<%=([\s\S]+?)%>/g,
      X = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
      nn = /^\w*$/,
      tn = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
      rn = /[\\^$.*+?()[\]{}|]/g,
      en = RegExp(rn.source),
      un = /^\s+|\s+$/g,
      on = /^\s+/,
      fn = /\s+$/,
      cn = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/,
      an = /\{\n\/\* \[wrapped with (.+)\] \*/,
      ln = /,? & /,
      sn = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g,
      hn = /\\(\\)?/g,
      pn = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g,
      _n = /\w*$/,
      vn = /^[-+]0x[0-9a-f]+$/i,
      gn = /^0b[01]+$/i,
      dn = /^\[object .+?Constructor\]$/,
      yn = /^0o[0-7]+$/i,
      bn = /^(?:0|[1-9]\d*)$/,
      xn = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g,
      jn = /($^)/,
      wn = /['\n\r\u2028\u2029\\]/g,
      mn = "[\\ufe0e\\ufe0f]?(?:[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]|\\ud83c[\\udffb-\\udfff])?(?:\\u200d(?:[^\\ud800-\\udfff]|(?:\\ud83c[\\udde6-\\uddff]){2}|[\\ud800-\\udbff][\\udc00-\\udfff])[\\ufe0e\\ufe0f]?(?:[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]|\\ud83c[\\udffb-\\udfff])?)*",
      An = "(?:[\\u2700-\\u27bf]|(?:\\ud83c[\\udde6-\\uddff]){2}|[\\ud800-\\udbff][\\udc00-\\udfff])" + mn,
      En = "(?:[^\\ud800-\\udfff][\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]?|[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]|(?:\\ud83c[\\udde6-\\uddff]){2}|[\\ud800-\\udbff][\\udc00-\\udfff]|[\\ud800-\\udfff])",
      kn = RegExp("['\u2019]", "g"),
      Sn = RegExp("[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]", "g"),
      On = RegExp("\\ud83c[\\udffb-\\udfff](?=\\ud83c[\\udffb-\\udfff])|" + En + mn, "g"),
      In = RegExp(["[A-Z\\xc0-\\xd6\\xd8-\\xde]?[a-z\\xdf-\\xf6\\xf8-\\xff]+(?:['\u2019](?:d|ll|m|re|s|t|ve))?(?=[\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000]|[A-Z\\xc0-\\xd6\\xd8-\\xde]|$)|(?:[A-Z\\xc0-\\xd6\\xd8-\\xde]|[^\\ud800-\\udfff\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000\\d+\\u2700-\\u27bfa-z\\xdf-\\xf6\\xf8-\\xffA-Z\\xc0-\\xd6\\xd8-\\xde])+(?:['\u2019](?:D|LL|M|RE|S|T|VE))?(?=[\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000]|[A-Z\\xc0-\\xd6\\xd8-\\xde](?:[a-z\\xdf-\\xf6\\xf8-\\xff]|[^\\ud800-\\udfff\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000\\d+\\u2700-\\u27bfa-z\\xdf-\\xf6\\xf8-\\xffA-Z\\xc0-\\xd6\\xd8-\\xde])|$)|[A-Z\\xc0-\\xd6\\xd8-\\xde]?(?:[a-z\\xdf-\\xf6\\xf8-\\xff]|[^\\ud800-\\udfff\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000\\d+\\u2700-\\u27bfa-z\\xdf-\\xf6\\xf8-\\xffA-Z\\xc0-\\xd6\\xd8-\\xde])+(?:['\u2019](?:d|ll|m|re|s|t|ve))?|[A-Z\\xc0-\\xd6\\xd8-\\xde]+(?:['\u2019](?:D|LL|M|RE|S|T|VE))?|\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])|\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])|\\d+", An].join("|"), "g"),
      Rn = RegExp("[\\u200d\\ud800-\\udfff\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff\\ufe0e\\ufe0f]"),
      zn = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/,
      Wn = "Array Buffer DataView Date Error Float32Array Float64Array Function Int8Array Int16Array Int32Array Map Math Object Promise RegExp Set String Symbol TypeError Uint8Array Uint8ClampedArray Uint16Array Uint32Array WeakMap _ clearTimeout isFinite parseInt setTimeout".split(" "),
      Bn = {};
  Bn["[object Float32Array]"] = Bn["[object Float64Array]"] = Bn["[object Int8Array]"] = Bn["[object Int16Array]"] = Bn["[object Int32Array]"] = Bn["[object Uint8Array]"] = Bn["[object Uint8ClampedArray]"] = Bn["[object Uint16Array]"] = Bn["[object Uint32Array]"] = true, Bn["[object Arguments]"] = Bn["[object Array]"] = Bn["[object ArrayBuffer]"] = Bn["[object Boolean]"] = Bn["[object DataView]"] = Bn["[object Date]"] = Bn["[object Error]"] = Bn["[object Function]"] = Bn["[object Map]"] = Bn["[object Number]"] = Bn["[object Object]"] = Bn["[object RegExp]"] = Bn["[object Set]"] = Bn["[object String]"] = Bn["[object WeakMap]"] = false;
  var Ln = {};
  Ln["[object Arguments]"] = Ln["[object Array]"] = Ln["[object ArrayBuffer]"] = Ln["[object DataView]"] = Ln["[object Boolean]"] = Ln["[object Date]"] = Ln["[object Float32Array]"] = Ln["[object Float64Array]"] = Ln["[object Int8Array]"] = Ln["[object Int16Array]"] = Ln["[object Int32Array]"] = Ln["[object Map]"] = Ln["[object Number]"] = Ln["[object Object]"] = Ln["[object RegExp]"] = Ln["[object Set]"] = Ln["[object String]"] = Ln["[object Symbol]"] = Ln["[object Uint8Array]"] = Ln["[object Uint8ClampedArray]"] = Ln["[object Uint16Array]"] = Ln["[object Uint32Array]"] = true, Ln["[object Error]"] = Ln["[object Function]"] = Ln["[object WeakMap]"] = false;

  var Un = {
    "\\": "\\",
    "'": "'",
    "\n": "n",
    "\r": "r",
    "\u2028": "u2028",
    "\u2029": "u2029"
  },
      Cn = parseFloat,
      Dn = parseInt,
      Mn = typeof global == "object" && global && global.Object === Object && global,
      Tn = typeof self == "object" && self && self.Object === Object && self,
      $n = Mn || Tn || Function("return this")(),
      Fn =  true && exports && !exports.nodeType && exports,
      Nn = Fn && typeof module == "object" && module && !module.nodeType && module,
      Pn = Nn && Nn.exports === Fn,
      Zn = Pn && Mn.process,
      qn = function () {
    try {
      var n = Nn && Nn.f && Nn.f("util").types;
      return n ? n : Zn && Zn.binding && Zn.binding("util");
    } catch (n) {}
  }(),
      Vn = qn && qn.isArrayBuffer,
      Kn = qn && qn.isDate,
      Gn = qn && qn.isMap,
      Hn = qn && qn.isRegExp,
      Jn = qn && qn.isSet,
      Yn = qn && qn.isTypedArray,
      Qn = b("length"),
      Xn = x({
    "\xc0": "A",
    "\xc1": "A",
    "\xc2": "A",
    "\xc3": "A",
    "\xc4": "A",
    "\xc5": "A",
    "\xe0": "a",
    "\xe1": "a",
    "\xe2": "a",
    "\xe3": "a",
    "\xe4": "a",
    "\xe5": "a",
    "\xc7": "C",
    "\xe7": "c",
    "\xd0": "D",
    "\xf0": "d",
    "\xc8": "E",
    "\xc9": "E",
    "\xca": "E",
    "\xcb": "E",
    "\xe8": "e",
    "\xe9": "e",
    "\xea": "e",
    "\xeb": "e",
    "\xcc": "I",
    "\xcd": "I",
    "\xce": "I",
    "\xcf": "I",
    "\xec": "i",
    "\xed": "i",
    "\xee": "i",
    "\xef": "i",
    "\xd1": "N",
    "\xf1": "n",
    "\xd2": "O",
    "\xd3": "O",
    "\xd4": "O",
    "\xd5": "O",
    "\xd6": "O",
    "\xd8": "O",
    "\xf2": "o",
    "\xf3": "o",
    "\xf4": "o",
    "\xf5": "o",
    "\xf6": "o",
    "\xf8": "o",
    "\xd9": "U",
    "\xda": "U",
    "\xdb": "U",
    "\xdc": "U",
    "\xf9": "u",
    "\xfa": "u",
    "\xfb": "u",
    "\xfc": "u",
    "\xdd": "Y",
    "\xfd": "y",
    "\xff": "y",
    "\xc6": "Ae",
    "\xe6": "ae",
    "\xde": "Th",
    "\xfe": "th",
    "\xdf": "ss",
    "\u0100": "A",
    "\u0102": "A",
    "\u0104": "A",
    "\u0101": "a",
    "\u0103": "a",
    "\u0105": "a",
    "\u0106": "C",
    "\u0108": "C",
    "\u010A": "C",
    "\u010C": "C",
    "\u0107": "c",
    "\u0109": "c",
    "\u010B": "c",
    "\u010D": "c",
    "\u010E": "D",
    "\u0110": "D",
    "\u010F": "d",
    "\u0111": "d",
    "\u0112": "E",
    "\u0114": "E",
    "\u0116": "E",
    "\u0118": "E",
    "\u011A": "E",
    "\u0113": "e",
    "\u0115": "e",
    "\u0117": "e",
    "\u0119": "e",
    "\u011B": "e",
    "\u011C": "G",
    "\u011E": "G",
    "\u0120": "G",
    "\u0122": "G",
    "\u011D": "g",
    "\u011F": "g",
    "\u0121": "g",
    "\u0123": "g",
    "\u0124": "H",
    "\u0126": "H",
    "\u0125": "h",
    "\u0127": "h",
    "\u0128": "I",
    "\u012A": "I",
    "\u012C": "I",
    "\u012E": "I",
    "\u0130": "I",
    "\u0129": "i",
    "\u012B": "i",
    "\u012D": "i",
    "\u012F": "i",
    "\u0131": "i",
    "\u0134": "J",
    "\u0135": "j",
    "\u0136": "K",
    "\u0137": "k",
    "\u0138": "k",
    "\u0139": "L",
    "\u013B": "L",
    "\u013D": "L",
    "\u013F": "L",
    "\u0141": "L",
    "\u013A": "l",
    "\u013C": "l",
    "\u013E": "l",
    "\u0140": "l",
    "\u0142": "l",
    "\u0143": "N",
    "\u0145": "N",
    "\u0147": "N",
    "\u014A": "N",
    "\u0144": "n",
    "\u0146": "n",
    "\u0148": "n",
    "\u014B": "n",
    "\u014C": "O",
    "\u014E": "O",
    "\u0150": "O",
    "\u014D": "o",
    "\u014F": "o",
    "\u0151": "o",
    "\u0154": "R",
    "\u0156": "R",
    "\u0158": "R",
    "\u0155": "r",
    "\u0157": "r",
    "\u0159": "r",
    "\u015A": "S",
    "\u015C": "S",
    "\u015E": "S",
    "\u0160": "S",
    "\u015B": "s",
    "\u015D": "s",
    "\u015F": "s",
    "\u0161": "s",
    "\u0162": "T",
    "\u0164": "T",
    "\u0166": "T",
    "\u0163": "t",
    "\u0165": "t",
    "\u0167": "t",
    "\u0168": "U",
    "\u016A": "U",
    "\u016C": "U",
    "\u016E": "U",
    "\u0170": "U",
    "\u0172": "U",
    "\u0169": "u",
    "\u016B": "u",
    "\u016D": "u",
    "\u016F": "u",
    "\u0171": "u",
    "\u0173": "u",
    "\u0174": "W",
    "\u0175": "w",
    "\u0176": "Y",
    "\u0177": "y",
    "\u0178": "Y",
    "\u0179": "Z",
    "\u017B": "Z",
    "\u017D": "Z",
    "\u017A": "z",
    "\u017C": "z",
    "\u017E": "z",
    "\u0132": "IJ",
    "\u0133": "ij",
    "\u0152": "Oe",
    "\u0153": "oe",
    "\u0149": "'n",
    "\u017F": "s"
  }),
      nt = x({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }),
      tt = x({
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'"
  }),
      rt = function x(mn) {
    function An(n) {
      if (yu(n) && !ff(n) && !(n instanceof Un)) {
        if (n instanceof On) return n;
        if (oi.call(n, "__wrapped__")) return Fe(n);
      }

      return new On(n);
    }

    function En() {}

    function On(n, t) {
      this.__wrapped__ = n, this.__actions__ = [], this.__chain__ = !!t, this.__index__ = 0, this.__values__ = T;
    }

    function Un(n) {
      this.__wrapped__ = n, this.__actions__ = [], this.__dir__ = 1, this.__filtered__ = false, this.__iteratees__ = [], this.__takeCount__ = 4294967295, this.__views__ = [];
    }

    function Mn(n) {
      var t = -1,
          r = null == n ? 0 : n.length;

      for (this.clear(); ++t < r;) {
        var e = n[t];
        this.set(e[0], e[1]);
      }
    }

    function Tn(n) {
      var t = -1,
          r = null == n ? 0 : n.length;

      for (this.clear(); ++t < r;) {
        var e = n[t];
        this.set(e[0], e[1]);
      }
    }

    function Fn(n) {
      var t = -1,
          r = null == n ? 0 : n.length;

      for (this.clear(); ++t < r;) {
        var e = n[t];
        this.set(e[0], e[1]);
      }
    }

    function Nn(n) {
      var t = -1,
          r = null == n ? 0 : n.length;

      for (this.__data__ = new Fn(); ++t < r;) {
        this.add(n[t]);
      }
    }

    function Zn(n) {
      this.size = (this.__data__ = new Tn(n)).size;
    }

    function qn(n, t) {
      var r,
          e = ff(n),
          u = !e && of(n),
          i = !e && !u && af(n),
          o = !e && !u && !i && _f(n),
          u = (e = e || u || i || o) ? A(n.length, ni) : [],
          f = u.length;

      for (r in n) {
        !t && !oi.call(n, r) || e && ("length" == r || i && ("offset" == r || "parent" == r) || o && ("buffer" == r || "byteLength" == r || "byteOffset" == r) || Se(r, f)) || u.push(r);
      }

      return u;
    }

    function Qn(n) {
      var t = n.length;
      return t ? n[ir(0, t - 1)] : T;
    }

    function et(n, t) {
      return De(Ur(n), pt(t, 0, n.length));
    }

    function ut(n) {
      return De(Ur(n));
    }

    function it(n, t, r) {
      (r === T || lu(n[t], r)) && (r !== T || t in n) || st(n, t, r);
    }

    function ot(n, t, r) {
      var e = n[t];
      oi.call(n, t) && lu(e, r) && (r !== T || t in n) || st(n, t, r);
    }

    function ft(n, t) {
      for (var r = n.length; r--;) {
        if (lu(n[r][0], t)) return r;
      }

      return -1;
    }

    function ct(n, t, r, e) {
      return uo(n, function (n, u, i) {
        t(e, n, r(n), i);
      }), e;
    }

    function at(n, t) {
      return n && Cr(t, Wu(t), n);
    }

    function lt(n, t) {
      return n && Cr(t, Bu(t), n);
    }

    function st(n, t, r) {
      "__proto__" == t && Ai ? Ai(n, t, {
        configurable: true,
        enumerable: true,
        value: r,
        writable: true
      }) : n[t] = r;
    }

    function ht(n, t) {
      for (var r = -1, e = t.length, u = Ku(e), i = null == n; ++r < e;) {
        u[r] = i ? T : Ru(n, t[r]);
      }

      return u;
    }

    function pt(n, t, r) {
      return n === n && (r !== T && (n = n <= r ? n : r), t !== T && (n = n >= t ? n : t)), n;
    }

    function _t(n, t, e, u, i, o) {
      var f,
          c = 1 & t,
          a = 2 & t,
          l = 4 & t;
      if (e && (f = i ? e(n, u, i, o) : e(n)), f !== T) return f;
      if (!du(n)) return n;

      if (u = ff(n)) {
        if (f = me(n), !c) return Ur(n, f);
      } else {
        var s = vo(n),
            h = "[object Function]" == s || "[object GeneratorFunction]" == s;
        if (af(n)) return Ir(n, c);

        if ("[object Object]" == s || "[object Arguments]" == s || h && !i) {
          if (f = a || h ? {} : Ae(n), !c) return a ? Mr(n, lt(f, n)) : Dr(n, at(f, n));
        } else {
          if (!Ln[s]) return i ? n : {};
          f = Ee(n, s, c);
        }
      }

      if (o || (o = new Zn()), i = o.get(n)) return i;
      o.set(n, f), pf(n) ? n.forEach(function (r) {
        f.add(_t(r, t, e, r, n, o));
      }) : sf(n) && n.forEach(function (r, u) {
        f.set(u, _t(r, t, e, u, n, o));
      });
      var a = l ? a ? ve : _e : a ? Bu : Wu,
          p = u ? T : a(n);
      return r(p || n, function (r, u) {
        p && (u = r, r = n[u]), ot(f, u, _t(r, t, e, u, n, o));
      }), f;
    }

    function vt(n) {
      var t = Wu(n);
      return function (r) {
        return gt(r, n, t);
      };
    }

    function gt(n, t, r) {
      var e = r.length;
      if (null == n) return !e;

      for (n = Qu(n); e--;) {
        var u = r[e],
            i = t[u],
            o = n[u];
        if (o === T && !(u in n) || !i(o)) return false;
      }

      return true;
    }

    function dt(n, t, r) {
      if (typeof n != "function") throw new ti("Expected a function");
      return bo(function () {
        n.apply(T, r);
      }, t);
    }

    function yt(n, t, r, e) {
      var u = -1,
          i = o,
          a = true,
          l = n.length,
          s = [],
          h = t.length;
      if (!l) return s;
      r && (t = c(t, k(r))), e ? (i = f, a = false) : 200 <= t.length && (i = O, a = false, t = new Nn(t));

      n: for (; ++u < l;) {
        var p = n[u],
            _ = null == r ? p : r(p),
            p = e || 0 !== p ? p : 0;

        if (a && _ === _) {
          for (var v = h; v--;) {
            if (t[v] === _) continue n;
          }

          s.push(p);
        } else i(t, _, e) || s.push(p);
      }

      return s;
    }

    function bt(n, t) {
      var r = true;
      return uo(n, function (n, e, u) {
        return r = !!t(n, e, u);
      }), r;
    }

    function xt(n, t, r) {
      for (var e = -1, u = n.length; ++e < u;) {
        var i = n[e],
            o = t(i);
        if (null != o && (f === T ? o === o && !wu(o) : r(o, f))) var f = o,
            c = i;
      }

      return c;
    }

    function jt(n, t) {
      var r = [];
      return uo(n, function (n, e, u) {
        t(n, e, u) && r.push(n);
      }), r;
    }

    function wt(n, t, r, e, u) {
      var i = -1,
          o = n.length;

      for (r || (r = ke), u || (u = []); ++i < o;) {
        var f = n[i];
        0 < t && r(f) ? 1 < t ? wt(f, t - 1, r, e, u) : a(u, f) : e || (u[u.length] = f);
      }

      return u;
    }

    function mt(n, t) {
      return n && oo(n, t, Wu);
    }

    function At(n, t) {
      return n && fo(n, t, Wu);
    }

    function Et(n, t) {
      return i(t, function (t) {
        return _u(n[t]);
      });
    }

    function kt(n, t) {
      t = Sr(t, n);

      for (var r = 0, e = t.length; null != n && r < e;) {
        n = n[Me(t[r++])];
      }

      return r && r == e ? n : T;
    }

    function St(n, t, r) {
      return t = t(n), ff(n) ? t : a(t, r(n));
    }

    function Ot(n) {
      if (null == n) n = n === T ? "[object Undefined]" : "[object Null]";else if (mi && mi in Qu(n)) {
        var t = oi.call(n, mi),
            r = n[mi];

        try {
          n[mi] = T;
          var e = true;
        } catch (n) {}

        var u = ai.call(n);
        e && (t ? n[mi] = r : delete n[mi]), n = u;
      } else n = ai.call(n);
      return n;
    }

    function It(n, t) {
      return n > t;
    }

    function Rt(n, t) {
      return null != n && oi.call(n, t);
    }

    function zt(n, t) {
      return null != n && t in Qu(n);
    }

    function Wt(n, t, r) {
      for (var e = r ? f : o, u = n[0].length, i = n.length, a = i, l = Ku(i), s = 1 / 0, h = []; a--;) {
        var p = n[a];
        a && t && (p = c(p, k(t))), s = Ci(p.length, s), l[a] = !r && (t || 120 <= u && 120 <= p.length) ? new Nn(a && p) : T;
      }

      var p = n[0],
          _ = -1,
          v = l[0];

      n: for (; ++_ < u && h.length < s;) {
        var g = p[_],
            d = t ? t(g) : g,
            g = r || 0 !== g ? g : 0;

        if (v ? !O(v, d) : !e(h, d, r)) {
          for (a = i; --a;) {
            var y = l[a];
            if (y ? !O(y, d) : !e(n[a], d, r)) continue n;
          }

          v && v.push(d), h.push(g);
        }
      }

      return h;
    }

    function Bt(n, t, r) {
      var e = {};
      return mt(n, function (n, u, i) {
        t(e, r(n), u, i);
      }), e;
    }

    function Lt(t, r, e) {
      return r = Sr(r, t), t = 2 > r.length ? t : kt(t, hr(r, 0, -1)), r = null == t ? t : t[Me(Ve(r))], null == r ? T : n(r, t, e);
    }

    function Ut(n) {
      return yu(n) && "[object Arguments]" == Ot(n);
    }

    function Ct(n) {
      return yu(n) && "[object ArrayBuffer]" == Ot(n);
    }

    function Dt(n) {
      return yu(n) && "[object Date]" == Ot(n);
    }

    function Mt(n, t, r, e, u) {
      if (n === t) t = true;else if (null == n || null == t || !yu(n) && !yu(t)) t = n !== n && t !== t;else n: {
        var i = ff(n),
            o = ff(t),
            f = i ? "[object Array]" : vo(n),
            c = o ? "[object Array]" : vo(t),
            f = "[object Arguments]" == f ? "[object Object]" : f,
            c = "[object Arguments]" == c ? "[object Object]" : c,
            a = "[object Object]" == f,
            o = "[object Object]" == c;

        if ((c = f == c) && af(n)) {
          if (!af(t)) {
            t = false;
            break n;
          }

          i = true, a = false;
        }

        if (c && !a) u || (u = new Zn()), t = i || _f(n) ? se(n, t, r, e, Mt, u) : he(n, t, f, r, e, Mt, u);else {
          if (!(1 & r) && (i = a && oi.call(n, "__wrapped__"), f = o && oi.call(t, "__wrapped__"), i || f)) {
            n = i ? n.value() : n, t = f ? t.value() : t, u || (u = new Zn()), t = Mt(n, t, r, e, u);
            break n;
          }

          if (c) {
            t: if (u || (u = new Zn()), i = 1 & r, f = _e(n), o = f.length, c = _e(t).length, o == c || i) {
              for (a = o; a--;) {
                var l = f[a];

                if (!(i ? l in t : oi.call(t, l))) {
                  t = false;
                  break t;
                }
              }

              if ((c = u.get(n)) && u.get(t)) t = c == t;else {
                c = true, u.set(n, t), u.set(t, n);

                for (var s = i; ++a < o;) {
                  var l = f[a],
                      h = n[l],
                      p = t[l];
                  if (e) var _ = i ? e(p, h, l, t, n, u) : e(h, p, l, n, t, u);

                  if (_ === T ? h !== p && !Mt(h, p, r, e, u) : !_) {
                    c = false;
                    break;
                  }

                  s || (s = "constructor" == l);
                }

                c && !s && (r = n.constructor, e = t.constructor, r != e && "constructor" in n && "constructor" in t && !(typeof r == "function" && r instanceof r && typeof e == "function" && e instanceof e) && (c = false)), u.delete(n), u.delete(t), t = c;
              }
            } else t = false;
          } else t = false;
        }
      }
      return t;
    }

    function Tt(n) {
      return yu(n) && "[object Map]" == vo(n);
    }

    function $t(n, t, r, e) {
      var u = r.length,
          i = u,
          o = !e;
      if (null == n) return !i;

      for (n = Qu(n); u--;) {
        var f = r[u];
        if (o && f[2] ? f[1] !== n[f[0]] : !(f[0] in n)) return false;
      }

      for (; ++u < i;) {
        var f = r[u],
            c = f[0],
            a = n[c],
            l = f[1];

        if (o && f[2]) {
          if (a === T && !(c in n)) return false;
        } else {
          if (f = new Zn(), e) var s = e(a, l, c, n, t, f);
          if (s === T ? !Mt(l, a, 3, e, f) : !s) return false;
        }
      }

      return true;
    }

    function Ft(n) {
      return !(!du(n) || ci && ci in n) && (_u(n) ? hi : dn).test(Te(n));
    }

    function Nt(n) {
      return yu(n) && "[object RegExp]" == Ot(n);
    }

    function Pt(n) {
      return yu(n) && "[object Set]" == vo(n);
    }

    function Zt(n) {
      return yu(n) && gu(n.length) && !!Bn[Ot(n)];
    }

    function qt(n) {
      return typeof n == "function" ? n : null == n ? $u : typeof n == "object" ? ff(n) ? Jt(n[0], n[1]) : Ht(n) : Zu(n);
    }

    function Vt(n) {
      if (!ze(n)) return Li(n);
      var t,
          r = [];

      for (t in Qu(n)) {
        oi.call(n, t) && "constructor" != t && r.push(t);
      }

      return r;
    }

    function Kt(n, t) {
      return n < t;
    }

    function Gt(n, t) {
      var r = -1,
          e = su(n) ? Ku(n.length) : [];
      return uo(n, function (n, u, i) {
        e[++r] = t(n, u, i);
      }), e;
    }

    function Ht(n) {
      var t = xe(n);
      return 1 == t.length && t[0][2] ? We(t[0][0], t[0][1]) : function (r) {
        return r === n || $t(r, n, t);
      };
    }

    function Jt(n, t) {
      return Ie(n) && t === t && !du(t) ? We(Me(n), t) : function (r) {
        var e = Ru(r, n);
        return e === T && e === t ? zu(r, n) : Mt(t, e, 3);
      };
    }

    function Yt(n, t, r, e, u) {
      n !== t && oo(t, function (i, o) {
        if (u || (u = new Zn()), du(i)) {
          var f = u,
              c = Le(n, o),
              a = Le(t, o),
              l = f.get(a);
          if (l) it(n, o, l);else {
            var l = e ? e(c, a, o + "", n, t, f) : T,
                s = l === T;

            if (s) {
              var h = ff(a),
                  p = !h && af(a),
                  _ = !h && !p && _f(a),
                  l = a;

              h || p || _ ? ff(c) ? l = c : hu(c) ? l = Ur(c) : p ? (s = false, l = Ir(a, true)) : _ ? (s = false, l = zr(a, true)) : l = [] : xu(a) || of(a) ? (l = c, of(c) ? l = Ou(c) : du(c) && !_u(c) || (l = Ae(a))) : s = false;
            }

            s && (f.set(a, l), Yt(l, a, r, e, f), f.delete(a)), it(n, o, l);
          }
        } else f = e ? e(Le(n, o), i, o + "", n, t, u) : T, f === T && (f = i), it(n, o, f);
      }, Bu);
    }

    function Qt(n, t) {
      var r = n.length;
      if (r) return t += 0 > t ? r : 0, Se(t, r) ? n[t] : T;
    }

    function Xt(n, t, r) {
      var e = -1;
      return t = c(t.length ? t : [$u], k(ye())), n = Gt(n, function (n) {
        return {
          a: c(t, function (t) {
            return t(n);
          }),
          b: ++e,
          c: n
        };
      }), w(n, function (n, t) {
        var e;

        n: {
          e = -1;

          for (var u = n.a, i = t.a, o = u.length, f = r.length; ++e < o;) {
            var c = Wr(u[e], i[e]);

            if (c) {
              e = e >= f ? c : c * ("desc" == r[e] ? -1 : 1);
              break n;
            }
          }

          e = n.b - t.b;
        }

        return e;
      });
    }

    function nr(n, t) {
      return tr(n, t, function (t, r) {
        return zu(n, r);
      });
    }

    function tr(n, t, r) {
      for (var e = -1, u = t.length, i = {}; ++e < u;) {
        var o = t[e],
            f = kt(n, o);
        r(f, o) && lr(i, Sr(o, n), f);
      }

      return i;
    }

    function rr(n) {
      return function (t) {
        return kt(t, n);
      };
    }

    function er(n, t, r, e) {
      var u = e ? g : v,
          i = -1,
          o = t.length,
          f = n;

      for (n === t && (t = Ur(t)), r && (f = c(n, k(r))); ++i < o;) {
        for (var a = 0, l = t[i], l = r ? r(l) : l; -1 < (a = u(f, l, a, e));) {
          f !== n && xi.call(f, a, 1), xi.call(n, a, 1);
        }
      }

      return n;
    }

    function ur(n, t) {
      for (var r = n ? t.length : 0, e = r - 1; r--;) {
        var u = t[r];

        if (r == e || u !== i) {
          var i = u;
          Se(u) ? xi.call(n, u, 1) : xr(n, u);
        }
      }
    }

    function ir(n, t) {
      return n + Ii(Ti() * (t - n + 1));
    }

    function or(n, t) {
      var r = "";
      if (!n || 1 > t || 9007199254740991 < t) return r;

      do {
        t % 2 && (r += n), (t = Ii(t / 2)) && (n += n);
      } while (t);

      return r;
    }

    function fr(n, t) {
      return xo(Be(n, t, $u), n + "");
    }

    function cr(n) {
      return Qn(Uu(n));
    }

    function ar(n, t) {
      var r = Uu(n);
      return De(r, pt(t, 0, r.length));
    }

    function lr(n, t, r, e) {
      if (!du(n)) return n;
      t = Sr(t, n);

      for (var u = -1, i = t.length, o = i - 1, f = n; null != f && ++u < i;) {
        var c = Me(t[u]),
            a = r;

        if (u != o) {
          var l = f[c],
              a = e ? e(l, c, f) : T;
          a === T && (a = du(l) ? l : Se(t[u + 1]) ? [] : {});
        }

        ot(f, c, a), f = f[c];
      }

      return n;
    }

    function sr(n) {
      return De(Uu(n));
    }

    function hr(n, t, r) {
      var e = -1,
          u = n.length;

      for (0 > t && (t = -t > u ? 0 : u + t), r = r > u ? u : r, 0 > r && (r += u), u = t > r ? 0 : r - t >>> 0, t >>>= 0, r = Ku(u); ++e < u;) {
        r[e] = n[e + t];
      }

      return r;
    }

    function pr(n, t) {
      var r;
      return uo(n, function (n, e, u) {
        return r = t(n, e, u), !r;
      }), !!r;
    }

    function _r(n, t, r) {
      var e = 0,
          u = null == n ? e : n.length;

      if (typeof t == "number" && t === t && 2147483647 >= u) {
        for (; e < u;) {
          var i = e + u >>> 1,
              o = n[i];
          null !== o && !wu(o) && (r ? o <= t : o < t) ? e = i + 1 : u = i;
        }

        return u;
      }

      return vr(n, t, $u, r);
    }

    function vr(n, t, r, e) {
      t = r(t);

      for (var u = 0, i = null == n ? 0 : n.length, o = t !== t, f = null === t, c = wu(t), a = t === T; u < i;) {
        var l = Ii((u + i) / 2),
            s = r(n[l]),
            h = s !== T,
            p = null === s,
            _ = s === s,
            v = wu(s);

        (o ? e || _ : a ? _ && (e || h) : f ? _ && h && (e || !p) : c ? _ && h && !p && (e || !v) : p || v ? 0 : e ? s <= t : s < t) ? u = l + 1 : i = l;
      }

      return Ci(i, 4294967294);
    }

    function gr(n, t) {
      for (var r = -1, e = n.length, u = 0, i = []; ++r < e;) {
        var o = n[r],
            f = t ? t(o) : o;

        if (!r || !lu(f, c)) {
          var c = f;
          i[u++] = 0 === o ? 0 : o;
        }
      }

      return i;
    }

    function dr(n) {
      return typeof n == "number" ? n : wu(n) ? F : +n;
    }

    function yr(n) {
      if (typeof n == "string") return n;
      if (ff(n)) return c(n, yr) + "";
      if (wu(n)) return ro ? ro.call(n) : "";
      var t = n + "";
      return "0" == t && 1 / n == -$ ? "-0" : t;
    }

    function br(n, t, r) {
      var e = -1,
          u = o,
          i = n.length,
          c = true,
          a = [],
          l = a;
      if (r) c = false, u = f;else if (200 <= i) {
        if (u = t ? null : so(n)) return U(u);
        c = false, u = O, l = new Nn();
      } else l = t ? [] : a;

      n: for (; ++e < i;) {
        var s = n[e],
            h = t ? t(s) : s,
            s = r || 0 !== s ? s : 0;

        if (c && h === h) {
          for (var p = l.length; p--;) {
            if (l[p] === h) continue n;
          }

          t && l.push(h), a.push(s);
        } else u(l, h, r) || (l !== a && l.push(h), a.push(s));
      }

      return a;
    }

    function xr(n, t) {
      return t = Sr(t, n), n = 2 > t.length ? n : kt(n, hr(t, 0, -1)), null == n || delete n[Me(Ve(t))];
    }

    function jr(n, t, r, e) {
      for (var u = n.length, i = e ? u : -1; (e ? i-- : ++i < u) && t(n[i], i, n);) {
        ;
      }

      return r ? hr(n, e ? 0 : i, e ? i + 1 : u) : hr(n, e ? i + 1 : 0, e ? u : i);
    }

    function wr(n, t) {
      var r = n;
      return r instanceof Un && (r = r.value()), l(t, function (n, t) {
        return t.func.apply(t.thisArg, a([n], t.args));
      }, r);
    }

    function mr(n, t, r) {
      var e = n.length;
      if (2 > e) return e ? br(n[0]) : [];

      for (var u = -1, i = Ku(e); ++u < e;) {
        for (var o = n[u], f = -1; ++f < e;) {
          f != u && (i[u] = yt(i[u] || o, n[f], t, r));
        }
      }

      return br(wt(i, 1), t, r);
    }

    function Ar(n, t, r) {
      for (var e = -1, u = n.length, i = t.length, o = {}; ++e < u;) {
        r(o, n[e], e < i ? t[e] : T);
      }

      return o;
    }

    function Er(n) {
      return hu(n) ? n : [];
    }

    function kr(n) {
      return typeof n == "function" ? n : $u;
    }

    function Sr(n, t) {
      return ff(n) ? n : Ie(n, t) ? [n] : jo(Iu(n));
    }

    function Or(n, t, r) {
      var e = n.length;
      return r = r === T ? e : r, !t && r >= e ? n : hr(n, t, r);
    }

    function Ir(n, t) {
      if (t) return n.slice();
      var r = n.length,
          r = gi ? gi(r) : new n.constructor(r);
      return n.copy(r), r;
    }

    function Rr(n) {
      var t = new n.constructor(n.byteLength);
      return new vi(t).set(new vi(n)), t;
    }

    function zr(n, t) {
      return new n.constructor(t ? Rr(n.buffer) : n.buffer, n.byteOffset, n.length);
    }

    function Wr(n, t) {
      if (n !== t) {
        var r = n !== T,
            e = null === n,
            u = n === n,
            i = wu(n),
            o = t !== T,
            f = null === t,
            c = t === t,
            a = wu(t);
        if (!f && !a && !i && n > t || i && o && c && !f && !a || e && o && c || !r && c || !u) return 1;
        if (!e && !i && !a && n < t || a && r && u && !e && !i || f && r && u || !o && u || !c) return -1;
      }

      return 0;
    }

    function Br(n, t, r, e) {
      var u = -1,
          i = n.length,
          o = r.length,
          f = -1,
          c = t.length,
          a = Ui(i - o, 0),
          l = Ku(c + a);

      for (e = !e; ++f < c;) {
        l[f] = t[f];
      }

      for (; ++u < o;) {
        (e || u < i) && (l[r[u]] = n[u]);
      }

      for (; a--;) {
        l[f++] = n[u++];
      }

      return l;
    }

    function Lr(n, t, r, e) {
      var u = -1,
          i = n.length,
          o = -1,
          f = r.length,
          c = -1,
          a = t.length,
          l = Ui(i - f, 0),
          s = Ku(l + a);

      for (e = !e; ++u < l;) {
        s[u] = n[u];
      }

      for (l = u; ++c < a;) {
        s[l + c] = t[c];
      }

      for (; ++o < f;) {
        (e || u < i) && (s[l + r[o]] = n[u++]);
      }

      return s;
    }

    function Ur(n, t) {
      var r = -1,
          e = n.length;

      for (t || (t = Ku(e)); ++r < e;) {
        t[r] = n[r];
      }

      return t;
    }

    function Cr(n, t, r, e) {
      var u = !r;
      r || (r = {});

      for (var i = -1, o = t.length; ++i < o;) {
        var f = t[i],
            c = e ? e(r[f], n[f], f, r, n) : T;
        c === T && (c = n[f]), u ? st(r, f, c) : ot(r, f, c);
      }

      return r;
    }

    function Dr(n, t) {
      return Cr(n, po(n), t);
    }

    function Mr(n, t) {
      return Cr(n, _o(n), t);
    }

    function Tr(n, r) {
      return function (e, u) {
        var i = ff(e) ? t : ct,
            o = r ? r() : {};
        return i(e, n, ye(u, 2), o);
      };
    }

    function $r(n) {
      return fr(function (t, r) {
        var e = -1,
            u = r.length,
            i = 1 < u ? r[u - 1] : T,
            o = 2 < u ? r[2] : T,
            i = 3 < n.length && typeof i == "function" ? (u--, i) : T;

        for (o && Oe(r[0], r[1], o) && (i = 3 > u ? T : i, u = 1), t = Qu(t); ++e < u;) {
          (o = r[e]) && n(t, o, e, i);
        }

        return t;
      });
    }

    function Fr(n, t) {
      return function (r, e) {
        if (null == r) return r;
        if (!su(r)) return n(r, e);

        for (var u = r.length, i = t ? u : -1, o = Qu(r); (t ? i-- : ++i < u) && false !== e(o[i], i, o);) {
          ;
        }

        return r;
      };
    }

    function Nr(n) {
      return function (t, r, e) {
        var u = -1,
            i = Qu(t);
        e = e(t);

        for (var o = e.length; o--;) {
          var f = e[n ? o : ++u];
          if (false === r(i[f], f, i)) break;
        }

        return t;
      };
    }

    function Pr(n, t, r) {
      function e() {
        return (this && this !== $n && this instanceof e ? i : n).apply(u ? r : this, arguments);
      }

      var u = 1 & t,
          i = Vr(n);
      return e;
    }

    function Zr(n) {
      return function (t) {
        t = Iu(t);
        var r = Rn.test(t) ? M(t) : T,
            e = r ? r[0] : t.charAt(0);
        return t = r ? Or(r, 1).join("") : t.slice(1), e[n]() + t;
      };
    }

    function qr(n) {
      return function (t) {
        return l(Mu(Du(t).replace(kn, "")), n, "");
      };
    }

    function Vr(n) {
      return function () {
        var t = arguments;

        switch (t.length) {
          case 0:
            return new n();

          case 1:
            return new n(t[0]);

          case 2:
            return new n(t[0], t[1]);

          case 3:
            return new n(t[0], t[1], t[2]);

          case 4:
            return new n(t[0], t[1], t[2], t[3]);

          case 5:
            return new n(t[0], t[1], t[2], t[3], t[4]);

          case 6:
            return new n(t[0], t[1], t[2], t[3], t[4], t[5]);

          case 7:
            return new n(t[0], t[1], t[2], t[3], t[4], t[5], t[6]);
        }

        var r = eo(n.prototype),
            t = n.apply(r, t);
        return du(t) ? t : r;
      };
    }

    function Kr(t, r, e) {
      function u() {
        for (var o = arguments.length, f = Ku(o), c = o, a = de(u); c--;) {
          f[c] = arguments[c];
        }

        return c = 3 > o && f[0] !== a && f[o - 1] !== a ? [] : L(f, a), o -= c.length, o < e ? ue(t, r, Jr, u.placeholder, T, f, c, T, T, e - o) : n(this && this !== $n && this instanceof u ? i : t, this, f);
      }

      var i = Vr(t);
      return u;
    }

    function Gr(n) {
      return function (t, r, e) {
        var u = Qu(t);

        if (!su(t)) {
          var i = ye(r, 3);
          t = Wu(t), r = function r(n) {
            return i(u[n], n, u);
          };
        }

        return r = n(t, r, e), -1 < r ? u[i ? t[r] : r] : T;
      };
    }

    function Hr(n) {
      return pe(function (t) {
        var r = t.length,
            e = r,
            u = On.prototype.thru;

        for (n && t.reverse(); e--;) {
          var i = t[e];
          if (typeof i != "function") throw new ti("Expected a function");
          if (u && !o && "wrapper" == ge(i)) var o = new On([], true);
        }

        for (e = o ? e : r; ++e < r;) {
          var i = t[e],
              u = ge(i),
              f = "wrapper" == u ? ho(i) : T,
              o = f && Re(f[0]) && 424 == f[1] && !f[4].length && 1 == f[9] ? o[ge(f[0])].apply(o, f[3]) : 1 == i.length && Re(i) ? o[u]() : o.thru(i);
        }

        return function () {
          var n = arguments,
              e = n[0];
          if (o && 1 == n.length && ff(e)) return o.plant(e).value();

          for (var u = 0, n = r ? t[u].apply(this, n) : e; ++u < r;) {
            n = t[u].call(this, n);
          }

          return n;
        };
      });
    }

    function Jr(n, t, r, e, u, i, o, f, c, a) {
      function l() {
        for (var d = arguments.length, y = Ku(d), b = d; b--;) {
          y[b] = arguments[b];
        }

        if (_) {
          var x,
              j = de(l),
              b = y.length;

          for (x = 0; b--;) {
            y[b] === j && ++x;
          }
        }

        if (e && (y = Br(y, e, u, _)), i && (y = Lr(y, i, o, _)), d -= x, _ && d < a) return j = L(y, j), ue(n, t, Jr, l.placeholder, r, y, j, f, c, a - d);

        if (j = h ? r : this, b = p ? j[n] : n, d = y.length, f) {
          x = y.length;

          for (var w = Ci(f.length, x), m = Ur(y); w--;) {
            var A = f[w];
            y[w] = Se(A, x) ? m[A] : T;
          }
        } else v && 1 < d && y.reverse();

        return s && c < d && (y.length = c), this && this !== $n && this instanceof l && (b = g || Vr(b)), b.apply(j, y);
      }

      var s = 128 & t,
          h = 1 & t,
          p = 2 & t,
          _ = 24 & t,
          v = 512 & t,
          g = p ? T : Vr(n);

      return l;
    }

    function Yr(n, t) {
      return function (r, e) {
        return Bt(r, n, t(e));
      };
    }

    function Qr(n, t) {
      return function (r, e) {
        var u;
        if (r === T && e === T) return t;

        if (r !== T && (u = r), e !== T) {
          if (u === T) return e;
          typeof r == "string" || typeof e == "string" ? (r = yr(r), e = yr(e)) : (r = dr(r), e = dr(e)), u = n(r, e);
        }

        return u;
      };
    }

    function Xr(t) {
      return pe(function (r) {
        return r = c(r, k(ye())), fr(function (e) {
          var u = this;
          return t(r, function (t) {
            return n(t, u, e);
          });
        });
      });
    }

    function ne(n, t) {
      t = t === T ? " " : yr(t);
      var r = t.length;
      return 2 > r ? r ? or(t, n) : t : (r = or(t, Oi(n / D(t))), Rn.test(t) ? Or(M(r), 0, n).join("") : r.slice(0, n));
    }

    function te(t, r, e, u) {
      function i() {
        for (var r = -1, c = arguments.length, a = -1, l = u.length, s = Ku(l + c), h = this && this !== $n && this instanceof i ? f : t; ++a < l;) {
          s[a] = u[a];
        }

        for (; c--;) {
          s[a++] = arguments[++r];
        }

        return n(h, o ? e : this, s);
      }

      var o = 1 & r,
          f = Vr(t);
      return i;
    }

    function re(n) {
      return function (t, r, e) {
        e && typeof e != "number" && Oe(t, r, e) && (r = e = T), t = Au(t), r === T ? (r = t, t = 0) : r = Au(r), e = e === T ? t < r ? 1 : -1 : Au(e);
        var u = -1;
        r = Ui(Oi((r - t) / (e || 1)), 0);

        for (var i = Ku(r); r--;) {
          i[n ? r : ++u] = t, t += e;
        }

        return i;
      };
    }

    function ee(n) {
      return function (t, r) {
        return typeof t == "string" && typeof r == "string" || (t = Su(t), r = Su(r)), n(t, r);
      };
    }

    function ue(n, t, r, e, u, i, o, f, c, a) {
      var l = 8 & t,
          s = l ? o : T;
      o = l ? T : o;
      var h = l ? i : T;
      return i = l ? T : i, t = (t | (l ? 32 : 64)) & ~(l ? 64 : 32), 4 & t || (t &= -4), u = [n, t, u, h, s, i, o, f, c, a], r = r.apply(T, u), Re(n) && yo(r, u), r.placeholder = e, Ue(r, n, t);
    }

    function ie(n) {
      var t = Yu[n];
      return function (n, r) {
        if (n = Su(n), (r = null == r ? 0 : Ci(Eu(r), 292)) && Wi(n)) {
          var e = (Iu(n) + "e").split("e"),
              e = t(e[0] + "e" + (+e[1] + r)),
              e = (Iu(e) + "e").split("e");
          return +(e[0] + "e" + (+e[1] - r));
        }

        return t(n);
      };
    }

    function oe(n) {
      return function (t) {
        var r = vo(t);
        return "[object Map]" == r ? W(t) : "[object Set]" == r ? C(t) : E(t, n(t));
      };
    }

    function fe(n, t, r, e, u, i, o, f) {
      var c = 2 & t;
      if (!c && typeof n != "function") throw new ti("Expected a function");
      var a = e ? e.length : 0;

      if (a || (t &= -97, e = u = T), o = o === T ? o : Ui(Eu(o), 0), f = f === T ? f : Eu(f), a -= u ? u.length : 0, 64 & t) {
        var l = e,
            s = u;
        e = u = T;
      }

      var h = c ? T : ho(n);
      return i = [n, t, r, e, u, l, s, i, o, f], h && (r = i[1], n = h[1], t = r | n, e = 128 == n && 8 == r || 128 == n && 256 == r && i[7].length <= h[8] || 384 == n && h[7].length <= h[8] && 8 == r, 131 > t || e) && (1 & n && (i[2] = h[2], t |= 1 & r ? 0 : 4), (r = h[3]) && (e = i[3], i[3] = e ? Br(e, r, h[4]) : r, i[4] = e ? L(i[3], "__lodash_placeholder__") : h[4]), (r = h[5]) && (e = i[5], i[5] = e ? Lr(e, r, h[6]) : r, i[6] = e ? L(i[5], "__lodash_placeholder__") : h[6]), (r = h[7]) && (i[7] = r), 128 & n && (i[8] = null == i[8] ? h[8] : Ci(i[8], h[8])), null == i[9] && (i[9] = h[9]), i[0] = h[0], i[1] = t), n = i[0], t = i[1], r = i[2], e = i[3], u = i[4], f = i[9] = i[9] === T ? c ? 0 : n.length : Ui(i[9] - a, 0), !f && 24 & t && (t &= -25), Ue((h ? co : yo)(t && 1 != t ? 8 == t || 16 == t ? Kr(n, t, f) : 32 != t && 33 != t || u.length ? Jr.apply(T, i) : te(n, t, r, e) : Pr(n, t, r), i), n, t);
    }

    function ce(n, t, r, e) {
      return n === T || lu(n, ei[r]) && !oi.call(e, r) ? t : n;
    }

    function ae(n, t, r, e, u, i) {
      return du(n) && du(t) && (i.set(t, n), Yt(n, t, T, ae, i), i.delete(t)), n;
    }

    function le(n) {
      return xu(n) ? T : n;
    }

    function se(n, t, r, e, u, i) {
      var o = 1 & r,
          f = n.length,
          c = t.length;
      if (f != c && !(o && c > f)) return false;
      if ((c = i.get(n)) && i.get(t)) return c == t;
      var c = -1,
          a = true,
          l = 2 & r ? new Nn() : T;

      for (i.set(n, t), i.set(t, n); ++c < f;) {
        var s = n[c],
            p = t[c];
        if (e) var _ = o ? e(p, s, c, t, n, i) : e(s, p, c, n, t, i);

        if (_ !== T) {
          if (_) continue;
          a = false;
          break;
        }

        if (l) {
          if (!h(t, function (n, t) {
            if (!O(l, t) && (s === n || u(s, n, r, e, i))) return l.push(t);
          })) {
            a = false;
            break;
          }
        } else if (s !== p && !u(s, p, r, e, i)) {
          a = false;
          break;
        }
      }

      return i.delete(n), i.delete(t), a;
    }

    function he(n, t, r, e, u, i, o) {
      switch (r) {
        case "[object DataView]":
          if (n.byteLength != t.byteLength || n.byteOffset != t.byteOffset) break;
          n = n.buffer, t = t.buffer;

        case "[object ArrayBuffer]":
          if (n.byteLength != t.byteLength || !i(new vi(n), new vi(t))) break;
          return true;

        case "[object Boolean]":
        case "[object Date]":
        case "[object Number]":
          return lu(+n, +t);

        case "[object Error]":
          return n.name == t.name && n.message == t.message;

        case "[object RegExp]":
        case "[object String]":
          return n == t + "";

        case "[object Map]":
          var f = W;

        case "[object Set]":
          if (f || (f = U), n.size != t.size && !(1 & e)) break;
          return (r = o.get(n)) ? r == t : (e |= 2, o.set(n, t), t = se(f(n), f(t), e, u, i, o), o.delete(n), t);

        case "[object Symbol]":
          if (to) return to.call(n) == to.call(t);
      }

      return false;
    }

    function pe(n) {
      return xo(Be(n, T, Ze), n + "");
    }

    function _e(n) {
      return St(n, Wu, po);
    }

    function ve(n) {
      return St(n, Bu, _o);
    }

    function ge(n) {
      for (var t = n.name + "", r = Gi[t], e = oi.call(Gi, t) ? r.length : 0; e--;) {
        var u = r[e],
            i = u.func;
        if (null == i || i == n) return u.name;
      }

      return t;
    }

    function de(n) {
      return (oi.call(An, "placeholder") ? An : n).placeholder;
    }

    function ye() {
      var n = An.iteratee || Fu,
          n = n === Fu ? qt : n;
      return arguments.length ? n(arguments[0], arguments[1]) : n;
    }

    function be(n, t) {
      var r = n.__data__,
          e = typeof t;
      return ("string" == e || "number" == e || "symbol" == e || "boolean" == e ? "__proto__" !== t : null === t) ? r[typeof t == "string" ? "string" : "hash"] : r.map;
    }

    function xe(n) {
      for (var t = Wu(n), r = t.length; r--;) {
        var e = t[r],
            u = n[e];
        t[r] = [e, u, u === u && !du(u)];
      }

      return t;
    }

    function je(n, t) {
      var r = null == n ? T : n[t];
      return Ft(r) ? r : T;
    }

    function we(n, t, r) {
      t = Sr(t, n);

      for (var e = -1, u = t.length, i = false; ++e < u;) {
        var o = Me(t[e]);
        if (!(i = null != n && r(n, o))) break;
        n = n[o];
      }

      return i || ++e != u ? i : (u = null == n ? 0 : n.length, !!u && gu(u) && Se(o, u) && (ff(n) || of(n)));
    }

    function me(n) {
      var t = n.length,
          r = new n.constructor(t);
      return t && "string" == typeof n[0] && oi.call(n, "index") && (r.index = n.index, r.input = n.input), r;
    }

    function Ae(n) {
      return typeof n.constructor != "function" || ze(n) ? {} : eo(di(n));
    }

    function Ee(n, t, r) {
      var e = n.constructor;

      switch (t) {
        case "[object ArrayBuffer]":
          return Rr(n);

        case "[object Boolean]":
        case "[object Date]":
          return new e(+n);

        case "[object DataView]":
          return t = r ? Rr(n.buffer) : n.buffer, new n.constructor(t, n.byteOffset, n.byteLength);

        case "[object Float32Array]":
        case "[object Float64Array]":
        case "[object Int8Array]":
        case "[object Int16Array]":
        case "[object Int32Array]":
        case "[object Uint8Array]":
        case "[object Uint8ClampedArray]":
        case "[object Uint16Array]":
        case "[object Uint32Array]":
          return zr(n, r);

        case "[object Map]":
          return new e();

        case "[object Number]":
        case "[object String]":
          return new e(n);

        case "[object RegExp]":
          return t = new n.constructor(n.source, _n.exec(n)), t.lastIndex = n.lastIndex, t;

        case "[object Set]":
          return new e();

        case "[object Symbol]":
          return to ? Qu(to.call(n)) : {};
      }
    }

    function ke(n) {
      return ff(n) || of(n) || !!(ji && n && n[ji]);
    }

    function Se(n, t) {
      var r = typeof n;
      return t = null == t ? 9007199254740991 : t, !!t && ("number" == r || "symbol" != r && bn.test(n)) && -1 < n && 0 == n % 1 && n < t;
    }

    function Oe(n, t, r) {
      if (!du(r)) return false;
      var e = typeof t;
      return !!("number" == e ? su(r) && Se(t, r.length) : "string" == e && t in r) && lu(r[t], n);
    }

    function Ie(n, t) {
      if (ff(n)) return false;
      var r = typeof n;
      return !("number" != r && "symbol" != r && "boolean" != r && null != n && !wu(n)) || nn.test(n) || !X.test(n) || null != t && n in Qu(t);
    }

    function Re(n) {
      var t = ge(n),
          r = An[t];
      return typeof r == "function" && t in Un.prototype && (n === r || (t = ho(r), !!t && n === t[0]));
    }

    function ze(n) {
      var t = n && n.constructor;
      return n === (typeof t == "function" && t.prototype || ei);
    }

    function We(n, t) {
      return function (r) {
        return null != r && r[n] === t && (t !== T || n in Qu(r));
      };
    }

    function Be(t, r, e) {
      return r = Ui(r === T ? t.length - 1 : r, 0), function () {
        for (var u = arguments, i = -1, o = Ui(u.length - r, 0), f = Ku(o); ++i < o;) {
          f[i] = u[r + i];
        }

        for (i = -1, o = Ku(r + 1); ++i < r;) {
          o[i] = u[i];
        }

        return o[r] = e(f), n(t, this, o);
      };
    }

    function Le(n, t) {
      if (("constructor" !== t || "function" != typeof n[t]) && "__proto__" != t) return n[t];
    }

    function Ue(n, t, r) {
      var e = t + "";
      t = xo;
      var u,
          i = $e;
      return u = (u = e.match(an)) ? u[1].split(ln) : [], r = i(u, r), (i = r.length) && (u = i - 1, r[u] = (1 < i ? "& " : "") + r[u], r = r.join(2 < i ? ", " : " "), e = e.replace(cn, "{\n/* [wrapped with " + r + "] */\n")), t(n, e);
    }

    function Ce(n) {
      var t = 0,
          r = 0;
      return function () {
        var e = Di(),
            u = 16 - (e - r);

        if (r = e, 0 < u) {
          if (800 <= ++t) return arguments[0];
        } else t = 0;

        return n.apply(T, arguments);
      };
    }

    function De(n, t) {
      var r = -1,
          e = n.length,
          u = e - 1;

      for (t = t === T ? e : t; ++r < t;) {
        var e = ir(r, u),
            i = n[e];
        n[e] = n[r], n[r] = i;
      }

      return n.length = t, n;
    }

    function Me(n) {
      if (typeof n == "string" || wu(n)) return n;
      var t = n + "";
      return "0" == t && 1 / n == -$ ? "-0" : t;
    }

    function Te(n) {
      if (null != n) {
        try {
          return ii.call(n);
        } catch (n) {}

        return n + "";
      }

      return "";
    }

    function $e(n, t) {
      return r(N, function (r) {
        var e = "_." + r[0];
        t & r[1] && !o(n, e) && n.push(e);
      }), n.sort();
    }

    function Fe(n) {
      if (n instanceof Un) return n.clone();
      var t = new On(n.__wrapped__, n.__chain__);
      return t.__actions__ = Ur(n.__actions__), t.__index__ = n.__index__, t.__values__ = n.__values__, t;
    }

    function Ne(n, t, r) {
      var e = null == n ? 0 : n.length;
      return e ? (r = null == r ? 0 : Eu(r), 0 > r && (r = Ui(e + r, 0)), _(n, ye(t, 3), r)) : -1;
    }

    function Pe(n, t, r) {
      var e = null == n ? 0 : n.length;
      if (!e) return -1;
      var u = e - 1;
      return r !== T && (u = Eu(r), u = 0 > r ? Ui(e + u, 0) : Ci(u, e - 1)), _(n, ye(t, 3), u, true);
    }

    function Ze(n) {
      return (null == n ? 0 : n.length) ? wt(n, 1) : [];
    }

    function qe(n) {
      return n && n.length ? n[0] : T;
    }

    function Ve(n) {
      var t = null == n ? 0 : n.length;
      return t ? n[t - 1] : T;
    }

    function Ke(n, t) {
      return n && n.length && t && t.length ? er(n, t) : n;
    }

    function Ge(n) {
      return null == n ? n : $i.call(n);
    }

    function He(n) {
      if (!n || !n.length) return [];
      var t = 0;
      return n = i(n, function (n) {
        if (hu(n)) return t = Ui(n.length, t), true;
      }), A(t, function (t) {
        return c(n, b(t));
      });
    }

    function Je(t, r) {
      if (!t || !t.length) return [];
      var e = He(t);
      return null == r ? e : c(e, function (t) {
        return n(r, T, t);
      });
    }

    function Ye(n) {
      return n = An(n), n.__chain__ = true, n;
    }

    function Qe(n, t) {
      return t(n);
    }

    function Xe() {
      return this;
    }

    function nu(n, t) {
      return (ff(n) ? r : uo)(n, ye(t, 3));
    }

    function tu(n, t) {
      return (ff(n) ? e : io)(n, ye(t, 3));
    }

    function ru(n, t) {
      return (ff(n) ? c : Gt)(n, ye(t, 3));
    }

    function eu(n, t, r) {
      return t = r ? T : t, t = n && null == t ? n.length : t, fe(n, 128, T, T, T, T, t);
    }

    function uu(n, t) {
      var r;
      if (typeof t != "function") throw new ti("Expected a function");
      return n = Eu(n), function () {
        return 0 < --n && (r = t.apply(this, arguments)), 1 >= n && (t = T), r;
      };
    }

    function iu(n, t, r) {
      return t = r ? T : t, n = fe(n, 8, T, T, T, T, T, t), n.placeholder = iu.placeholder, n;
    }

    function ou(n, t, r) {
      return t = r ? T : t, n = fe(n, 16, T, T, T, T, T, t), n.placeholder = ou.placeholder, n;
    }

    function fu(n, t, r) {
      function e(t) {
        var r = c,
            e = a;
        return c = a = T, _ = t, s = n.apply(e, r);
      }

      function u(n) {
        var r = n - p;
        return n -= _, p === T || r >= t || 0 > r || g && n >= l;
      }

      function i() {
        var n = Go();
        if (u(n)) return o(n);
        var r,
            e = bo;
        r = n - _, n = t - (n - p), r = g ? Ci(n, l - r) : n, h = e(i, r);
      }

      function o(n) {
        return h = T, d && c ? e(n) : (c = a = T, s);
      }

      function f() {
        var n = Go(),
            r = u(n);

        if (c = arguments, a = this, p = n, r) {
          if (h === T) return _ = n = p, h = bo(i, t), v ? e(n) : s;
          if (g) return lo(h), h = bo(i, t), e(p);
        }

        return h === T && (h = bo(i, t)), s;
      }

      var c,
          a,
          l,
          s,
          h,
          p,
          _ = 0,
          v = false,
          g = false,
          d = true;
      if (typeof n != "function") throw new ti("Expected a function");
      return t = Su(t) || 0, du(r) && (v = !!r.leading, l = (g = "maxWait" in r) ? Ui(Su(r.maxWait) || 0, t) : l, d = "trailing" in r ? !!r.trailing : d), f.cancel = function () {
        h !== T && lo(h), _ = 0, c = p = a = h = T;
      }, f.flush = function () {
        return h === T ? s : o(Go());
      }, f;
    }

    function cu(n, t) {
      function r() {
        var e = arguments,
            u = t ? t.apply(this, e) : e[0],
            i = r.cache;
        return i.has(u) ? i.get(u) : (e = n.apply(this, e), r.cache = i.set(u, e) || i, e);
      }

      if (typeof n != "function" || null != t && typeof t != "function") throw new ti("Expected a function");
      return r.cache = new (cu.Cache || Fn)(), r;
    }

    function au(n) {
      if (typeof n != "function") throw new ti("Expected a function");
      return function () {
        var t = arguments;

        switch (t.length) {
          case 0:
            return !n.call(this);

          case 1:
            return !n.call(this, t[0]);

          case 2:
            return !n.call(this, t[0], t[1]);

          case 3:
            return !n.call(this, t[0], t[1], t[2]);
        }

        return !n.apply(this, t);
      };
    }

    function lu(n, t) {
      return n === t || n !== n && t !== t;
    }

    function su(n) {
      return null != n && gu(n.length) && !_u(n);
    }

    function hu(n) {
      return yu(n) && su(n);
    }

    function pu(n) {
      if (!yu(n)) return false;
      var t = Ot(n);
      return "[object Error]" == t || "[object DOMException]" == t || typeof n.message == "string" && typeof n.name == "string" && !xu(n);
    }

    function _u(n) {
      return !!du(n) && (n = Ot(n), "[object Function]" == n || "[object GeneratorFunction]" == n || "[object AsyncFunction]" == n || "[object Proxy]" == n);
    }

    function vu(n) {
      return typeof n == "number" && n == Eu(n);
    }

    function gu(n) {
      return typeof n == "number" && -1 < n && 0 == n % 1 && 9007199254740991 >= n;
    }

    function du(n) {
      var t = typeof n;
      return null != n && ("object" == t || "function" == t);
    }

    function yu(n) {
      return null != n && typeof n == "object";
    }

    function bu(n) {
      return typeof n == "number" || yu(n) && "[object Number]" == Ot(n);
    }

    function xu(n) {
      return !(!yu(n) || "[object Object]" != Ot(n)) && (n = di(n), null === n || (n = oi.call(n, "constructor") && n.constructor, typeof n == "function" && n instanceof n && ii.call(n) == li));
    }

    function ju(n) {
      return typeof n == "string" || !ff(n) && yu(n) && "[object String]" == Ot(n);
    }

    function wu(n) {
      return typeof n == "symbol" || yu(n) && "[object Symbol]" == Ot(n);
    }

    function mu(n) {
      if (!n) return [];
      if (su(n)) return ju(n) ? M(n) : Ur(n);

      if (wi && n[wi]) {
        n = n[wi]();

        for (var t, r = []; !(t = n.next()).done;) {
          r.push(t.value);
        }

        return r;
      }

      return t = vo(n), ("[object Map]" == t ? W : "[object Set]" == t ? U : Uu)(n);
    }

    function Au(n) {
      return n ? (n = Su(n), n === $ || n === -$ ? 1.7976931348623157e308 * (0 > n ? -1 : 1) : n === n ? n : 0) : 0 === n ? n : 0;
    }

    function Eu(n) {
      n = Au(n);
      var t = n % 1;
      return n === n ? t ? n - t : n : 0;
    }

    function ku(n) {
      return n ? pt(Eu(n), 0, 4294967295) : 0;
    }

    function Su(n) {
      if (typeof n == "number") return n;
      if (wu(n)) return F;
      if (du(n) && (n = typeof n.valueOf == "function" ? n.valueOf() : n, n = du(n) ? n + "" : n), typeof n != "string") return 0 === n ? n : +n;
      n = n.replace(un, "");
      var t = gn.test(n);
      return t || yn.test(n) ? Dn(n.slice(2), t ? 2 : 8) : vn.test(n) ? F : +n;
    }

    function Ou(n) {
      return Cr(n, Bu(n));
    }

    function Iu(n) {
      return null == n ? "" : yr(n);
    }

    function Ru(n, t, r) {
      return n = null == n ? T : kt(n, t), n === T ? r : n;
    }

    function zu(n, t) {
      return null != n && we(n, t, zt);
    }

    function Wu(n) {
      return su(n) ? qn(n) : Vt(n);
    }

    function Bu(n) {
      if (su(n)) n = qn(n, true);else if (du(n)) {
        var t,
            r = ze(n),
            e = [];

        for (t in n) {
          ("constructor" != t || !r && oi.call(n, t)) && e.push(t);
        }

        n = e;
      } else {
        if (t = [], null != n) for (r in Qu(n)) {
          t.push(r);
        }
        n = t;
      }
      return n;
    }

    function Lu(n, t) {
      if (null == n) return {};
      var r = c(ve(n), function (n) {
        return [n];
      });
      return t = ye(t), tr(n, r, function (n, r) {
        return t(n, r[0]);
      });
    }

    function Uu(n) {
      return null == n ? [] : S(n, Wu(n));
    }

    function Cu(n) {
      return $f(Iu(n).toLowerCase());
    }

    function Du(n) {
      return (n = Iu(n)) && n.replace(xn, Xn).replace(Sn, "");
    }

    function Mu(n, t, r) {
      return n = Iu(n), t = r ? T : t, t === T ? zn.test(n) ? n.match(In) || [] : n.match(sn) || [] : n.match(t) || [];
    }

    function Tu(n) {
      return function () {
        return n;
      };
    }

    function $u(n) {
      return n;
    }

    function Fu(n) {
      return qt(typeof n == "function" ? n : _t(n, 1));
    }

    function Nu(n, t, e) {
      var u = Wu(t),
          i = Et(t, u);
      null != e || du(t) && (i.length || !u.length) || (e = t, t = n, n = this, i = Et(t, Wu(t)));

      var o = !(du(e) && "chain" in e && !e.chain),
          f = _u(n);

      return r(i, function (r) {
        var e = t[r];
        n[r] = e, f && (n.prototype[r] = function () {
          var t = this.__chain__;

          if (o || t) {
            var r = n(this.__wrapped__);
            return (r.__actions__ = Ur(this.__actions__)).push({
              func: e,
              args: arguments,
              thisArg: n
            }), r.__chain__ = t, r;
          }

          return e.apply(n, a([this.value()], arguments));
        });
      }), n;
    }

    function Pu() {}

    function Zu(n) {
      return Ie(n) ? b(Me(n)) : rr(n);
    }

    function qu() {
      return [];
    }

    function Vu() {
      return false;
    }

    mn = null == mn ? $n : rt.defaults($n.Object(), mn, rt.pick($n, Wn));

    var Ku = mn.Array,
        Gu = mn.Date,
        Hu = mn.Error,
        Ju = mn.Function,
        Yu = mn.Math,
        Qu = mn.Object,
        Xu = mn.RegExp,
        ni = mn.String,
        ti = mn.TypeError,
        ri = Ku.prototype,
        ei = Qu.prototype,
        ui = mn["__core-js_shared__"],
        ii = Ju.prototype.toString,
        oi = ei.hasOwnProperty,
        fi = 0,
        ci = function () {
      var n = /[^.]+$/.exec(ui && ui.keys && ui.keys.IE_PROTO || "");
      return n ? "Symbol(src)_1." + n : "";
    }(),
        ai = ei.toString,
        li = ii.call(Qu),
        si = $n._,
        hi = Xu("^" + ii.call(oi).replace(rn, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"),
        pi = Pn ? mn.Buffer : T,
        _i = mn.Symbol,
        vi = mn.Uint8Array,
        gi = pi ? pi.g : T,
        di = B(Qu.getPrototypeOf, Qu),
        yi = Qu.create,
        bi = ei.propertyIsEnumerable,
        xi = ri.splice,
        ji = _i ? _i.isConcatSpreadable : T,
        wi = _i ? _i.iterator : T,
        mi = _i ? _i.toStringTag : T,
        Ai = function () {
      try {
        var n = je(Qu, "defineProperty");
        return n({}, "", {}), n;
      } catch (n) {}
    }(),
        Ei = mn.clearTimeout !== $n.clearTimeout && mn.clearTimeout,
        ki = Gu && Gu.now !== $n.Date.now && Gu.now,
        Si = mn.setTimeout !== $n.setTimeout && mn.setTimeout,
        Oi = Yu.ceil,
        Ii = Yu.floor,
        Ri = Qu.getOwnPropertySymbols,
        zi = pi ? pi.isBuffer : T,
        Wi = mn.isFinite,
        Bi = ri.join,
        Li = B(Qu.keys, Qu),
        Ui = Yu.max,
        Ci = Yu.min,
        Di = Gu.now,
        Mi = mn.parseInt,
        Ti = Yu.random,
        $i = ri.reverse,
        Fi = je(mn, "DataView"),
        Ni = je(mn, "Map"),
        Pi = je(mn, "Promise"),
        Zi = je(mn, "Set"),
        qi = je(mn, "WeakMap"),
        Vi = je(Qu, "create"),
        Ki = qi && new qi(),
        Gi = {},
        Hi = Te(Fi),
        Ji = Te(Ni),
        Yi = Te(Pi),
        Qi = Te(Zi),
        Xi = Te(qi),
        no = _i ? _i.prototype : T,
        to = no ? no.valueOf : T,
        ro = no ? no.toString : T,
        eo = function () {
      function n() {}

      return function (t) {
        return du(t) ? yi ? yi(t) : (n.prototype = t, t = new n(), n.prototype = T, t) : {};
      };
    }();

    An.templateSettings = {
      escape: J,
      evaluate: Y,
      interpolate: Q,
      variable: "",
      imports: {
        _: An
      }
    }, An.prototype = En.prototype, An.prototype.constructor = An, On.prototype = eo(En.prototype), On.prototype.constructor = On, Un.prototype = eo(En.prototype), Un.prototype.constructor = Un, Mn.prototype.clear = function () {
      this.__data__ = Vi ? Vi(null) : {}, this.size = 0;
    }, Mn.prototype.delete = function (n) {
      return n = this.has(n) && delete this.__data__[n], this.size -= n ? 1 : 0, n;
    }, Mn.prototype.get = function (n) {
      var t = this.__data__;
      return Vi ? (n = t[n], "__lodash_hash_undefined__" === n ? T : n) : oi.call(t, n) ? t[n] : T;
    }, Mn.prototype.has = function (n) {
      var t = this.__data__;
      return Vi ? t[n] !== T : oi.call(t, n);
    }, Mn.prototype.set = function (n, t) {
      var r = this.__data__;
      return this.size += this.has(n) ? 0 : 1, r[n] = Vi && t === T ? "__lodash_hash_undefined__" : t, this;
    }, Tn.prototype.clear = function () {
      this.__data__ = [], this.size = 0;
    }, Tn.prototype.delete = function (n) {
      var t = this.__data__;
      return n = ft(t, n), !(0 > n) && (n == t.length - 1 ? t.pop() : xi.call(t, n, 1), --this.size, true);
    }, Tn.prototype.get = function (n) {
      var t = this.__data__;
      return n = ft(t, n), 0 > n ? T : t[n][1];
    }, Tn.prototype.has = function (n) {
      return -1 < ft(this.__data__, n);
    }, Tn.prototype.set = function (n, t) {
      var r = this.__data__,
          e = ft(r, n);
      return 0 > e ? (++this.size, r.push([n, t])) : r[e][1] = t, this;
    }, Fn.prototype.clear = function () {
      this.size = 0, this.__data__ = {
        hash: new Mn(),
        map: new (Ni || Tn)(),
        string: new Mn()
      };
    }, Fn.prototype.delete = function (n) {
      return n = be(this, n).delete(n), this.size -= n ? 1 : 0, n;
    }, Fn.prototype.get = function (n) {
      return be(this, n).get(n);
    }, Fn.prototype.has = function (n) {
      return be(this, n).has(n);
    }, Fn.prototype.set = function (n, t) {
      var r = be(this, n),
          e = r.size;
      return r.set(n, t), this.size += r.size == e ? 0 : 1, this;
    }, Nn.prototype.add = Nn.prototype.push = function (n) {
      return this.__data__.set(n, "__lodash_hash_undefined__"), this;
    }, Nn.prototype.has = function (n) {
      return this.__data__.has(n);
    }, Zn.prototype.clear = function () {
      this.__data__ = new Tn(), this.size = 0;
    }, Zn.prototype.delete = function (n) {
      var t = this.__data__;
      return n = t.delete(n), this.size = t.size, n;
    }, Zn.prototype.get = function (n) {
      return this.__data__.get(n);
    }, Zn.prototype.has = function (n) {
      return this.__data__.has(n);
    }, Zn.prototype.set = function (n, t) {
      var r = this.__data__;

      if (r instanceof Tn) {
        var e = r.__data__;
        if (!Ni || 199 > e.length) return e.push([n, t]), this.size = ++r.size, this;
        r = this.__data__ = new Fn(e);
      }

      return r.set(n, t), this.size = r.size, this;
    };

    var uo = Fr(mt),
        io = Fr(At, true),
        oo = Nr(),
        fo = Nr(true),
        co = Ki ? function (n, t) {
      return Ki.set(n, t), n;
    } : $u,
        ao = Ai ? function (n, t) {
      return Ai(n, "toString", {
        configurable: true,
        enumerable: false,
        value: Tu(t),
        writable: true
      });
    } : $u,
        lo = Ei || function (n) {
      return $n.clearTimeout(n);
    },
        so = Zi && 1 / U(new Zi([, -0]))[1] == $ ? function (n) {
      return new Zi(n);
    } : Pu,
        ho = Ki ? function (n) {
      return Ki.get(n);
    } : Pu,
        po = Ri ? function (n) {
      return null == n ? [] : (n = Qu(n), i(Ri(n), function (t) {
        return bi.call(n, t);
      }));
    } : qu,
        _o = Ri ? function (n) {
      for (var t = []; n;) {
        a(t, po(n)), n = di(n);
      }

      return t;
    } : qu,
        vo = Ot;

    (Fi && "[object DataView]" != vo(new Fi(new ArrayBuffer(1))) || Ni && "[object Map]" != vo(new Ni()) || Pi && "[object Promise]" != vo(Pi.resolve()) || Zi && "[object Set]" != vo(new Zi()) || qi && "[object WeakMap]" != vo(new qi())) && (vo = function vo(n) {
      var t = Ot(n);
      if (n = (n = "[object Object]" == t ? n.constructor : T) ? Te(n) : "") switch (n) {
        case Hi:
          return "[object DataView]";

        case Ji:
          return "[object Map]";

        case Yi:
          return "[object Promise]";

        case Qi:
          return "[object Set]";

        case Xi:
          return "[object WeakMap]";
      }
      return t;
    });

    var go = ui ? _u : Vu,
        yo = Ce(co),
        bo = Si || function (n, t) {
      return $n.setTimeout(n, t);
    },
        xo = Ce(ao),
        jo = function (n) {
      n = cu(n, function (n) {
        return 500 === t.size && t.clear(), n;
      });
      var t = n.cache;
      return n;
    }(function (n) {
      var t = [];
      return 46 === n.charCodeAt(0) && t.push(""), n.replace(tn, function (n, r, e, u) {
        t.push(e ? u.replace(hn, "$1") : r || n);
      }), t;
    }),
        wo = fr(function (n, t) {
      return hu(n) ? yt(n, wt(t, 1, hu, true)) : [];
    }),
        mo = fr(function (n, t) {
      var r = Ve(t);
      return hu(r) && (r = T), hu(n) ? yt(n, wt(t, 1, hu, true), ye(r, 2)) : [];
    }),
        Ao = fr(function (n, t) {
      var r = Ve(t);
      return hu(r) && (r = T), hu(n) ? yt(n, wt(t, 1, hu, true), T, r) : [];
    }),
        Eo = fr(function (n) {
      var t = c(n, Er);
      return t.length && t[0] === n[0] ? Wt(t) : [];
    }),
        ko = fr(function (n) {
      var t = Ve(n),
          r = c(n, Er);
      return t === Ve(r) ? t = T : r.pop(), r.length && r[0] === n[0] ? Wt(r, ye(t, 2)) : [];
    }),
        So = fr(function (n) {
      var t = Ve(n),
          r = c(n, Er);
      return (t = typeof t == "function" ? t : T) && r.pop(), r.length && r[0] === n[0] ? Wt(r, T, t) : [];
    }),
        Oo = fr(Ke),
        Io = pe(function (n, t) {
      var r = null == n ? 0 : n.length,
          e = ht(n, t);
      return ur(n, c(t, function (n) {
        return Se(n, r) ? +n : n;
      }).sort(Wr)), e;
    }),
        Ro = fr(function (n) {
      return br(wt(n, 1, hu, true));
    }),
        zo = fr(function (n) {
      var t = Ve(n);
      return hu(t) && (t = T), br(wt(n, 1, hu, true), ye(t, 2));
    }),
        Wo = fr(function (n) {
      var t = Ve(n),
          t = typeof t == "function" ? t : T;
      return br(wt(n, 1, hu, true), T, t);
    }),
        Bo = fr(function (n, t) {
      return hu(n) ? yt(n, t) : [];
    }),
        Lo = fr(function (n) {
      return mr(i(n, hu));
    }),
        Uo = fr(function (n) {
      var t = Ve(n);
      return hu(t) && (t = T), mr(i(n, hu), ye(t, 2));
    }),
        Co = fr(function (n) {
      var t = Ve(n),
          t = typeof t == "function" ? t : T;
      return mr(i(n, hu), T, t);
    }),
        Do = fr(He),
        Mo = fr(function (n) {
      var t = n.length,
          t = 1 < t ? n[t - 1] : T,
          t = typeof t == "function" ? (n.pop(), t) : T;
      return Je(n, t);
    }),
        To = pe(function (n) {
      function t(t) {
        return ht(t, n);
      }

      var r = n.length,
          e = r ? n[0] : 0,
          u = this.__wrapped__;
      return !(1 < r || this.__actions__.length) && u instanceof Un && Se(e) ? (u = u.slice(e, +e + (r ? 1 : 0)), u.__actions__.push({
        func: Qe,
        args: [t],
        thisArg: T
      }), new On(u, this.__chain__).thru(function (n) {
        return r && !n.length && n.push(T), n;
      })) : this.thru(t);
    }),
        $o = Tr(function (n, t, r) {
      oi.call(n, r) ? ++n[r] : st(n, r, 1);
    }),
        Fo = Gr(Ne),
        No = Gr(Pe),
        Po = Tr(function (n, t, r) {
      oi.call(n, r) ? n[r].push(t) : st(n, r, [t]);
    }),
        Zo = fr(function (t, r, e) {
      var u = -1,
          i = typeof r == "function",
          o = su(t) ? Ku(t.length) : [];
      return uo(t, function (t) {
        o[++u] = i ? n(r, t, e) : Lt(t, r, e);
      }), o;
    }),
        qo = Tr(function (n, t, r) {
      st(n, r, t);
    }),
        Vo = Tr(function (n, t, r) {
      n[r ? 0 : 1].push(t);
    }, function () {
      return [[], []];
    }),
        Ko = fr(function (n, t) {
      if (null == n) return [];
      var r = t.length;
      return 1 < r && Oe(n, t[0], t[1]) ? t = [] : 2 < r && Oe(t[0], t[1], t[2]) && (t = [t[0]]), Xt(n, wt(t, 1), []);
    }),
        Go = ki || function () {
      return $n.Date.now();
    },
        Ho = fr(function (n, t, r) {
      var e = 1;
      if (r.length) var u = L(r, de(Ho)),
          e = 32 | e;
      return fe(n, e, t, r, u);
    }),
        Jo = fr(function (n, t, r) {
      var e = 3;
      if (r.length) var u = L(r, de(Jo)),
          e = 32 | e;
      return fe(t, e, n, r, u);
    }),
        Yo = fr(function (n, t) {
      return dt(n, 1, t);
    }),
        Qo = fr(function (n, t, r) {
      return dt(n, Su(t) || 0, r);
    });

    cu.Cache = Fn;

    var Xo = fr(function (t, r) {
      r = 1 == r.length && ff(r[0]) ? c(r[0], k(ye())) : c(wt(r, 1), k(ye()));
      var e = r.length;
      return fr(function (u) {
        for (var i = -1, o = Ci(u.length, e); ++i < o;) {
          u[i] = r[i].call(this, u[i]);
        }

        return n(t, this, u);
      });
    }),
        nf = fr(function (n, t) {
      return fe(n, 32, T, t, L(t, de(nf)));
    }),
        tf = fr(function (n, t) {
      return fe(n, 64, T, t, L(t, de(tf)));
    }),
        rf = pe(function (n, t) {
      return fe(n, 256, T, T, T, t);
    }),
        ef = ee(It),
        uf = ee(function (n, t) {
      return n >= t;
    }),
        of = Ut(function () {
      return arguments;
    }()) ? Ut : function (n) {
      return yu(n) && oi.call(n, "callee") && !bi.call(n, "callee");
    },
        ff = Ku.isArray,
        cf = Vn ? k(Vn) : Ct,
        af = zi || Vu,
        lf = Kn ? k(Kn) : Dt,
        sf = Gn ? k(Gn) : Tt,
        hf = Hn ? k(Hn) : Nt,
        pf = Jn ? k(Jn) : Pt,
        _f = Yn ? k(Yn) : Zt,
        vf = ee(Kt),
        gf = ee(function (n, t) {
      return n <= t;
    }),
        df = $r(function (n, t) {
      if (ze(t) || su(t)) Cr(t, Wu(t), n);else for (var r in t) {
        oi.call(t, r) && ot(n, r, t[r]);
      }
    }),
        yf = $r(function (n, t) {
      Cr(t, Bu(t), n);
    }),
        bf = $r(function (n, t, r, e) {
      Cr(t, Bu(t), n, e);
    }),
        xf = $r(function (n, t, r, e) {
      Cr(t, Wu(t), n, e);
    }),
        jf = pe(ht),
        wf = fr(function (n, t) {
      n = Qu(n);
      var r = -1,
          e = t.length,
          u = 2 < e ? t[2] : T;

      for (u && Oe(t[0], t[1], u) && (e = 1); ++r < e;) {
        for (var u = t[r], i = Bu(u), o = -1, f = i.length; ++o < f;) {
          var c = i[o],
              a = n[c];
          (a === T || lu(a, ei[c]) && !oi.call(n, c)) && (n[c] = u[c]);
        }
      }

      return n;
    }),
        mf = fr(function (t) {
      return t.push(T, ae), n(Of, T, t);
    }),
        Af = Yr(function (n, t, r) {
      null != t && typeof t.toString != "function" && (t = ai.call(t)), n[t] = r;
    }, Tu($u)),
        Ef = Yr(function (n, t, r) {
      null != t && typeof t.toString != "function" && (t = ai.call(t)), oi.call(n, t) ? n[t].push(r) : n[t] = [r];
    }, ye),
        kf = fr(Lt),
        Sf = $r(function (n, t, r) {
      Yt(n, t, r);
    }),
        Of = $r(function (n, t, r, e) {
      Yt(n, t, r, e);
    }),
        If = pe(function (n, t) {
      var r = {};
      if (null == n) return r;
      var e = false;
      t = c(t, function (t) {
        return t = Sr(t, n), e || (e = 1 < t.length), t;
      }), Cr(n, ve(n), r), e && (r = _t(r, 7, le));

      for (var u = t.length; u--;) {
        xr(r, t[u]);
      }

      return r;
    }),
        Rf = pe(function (n, t) {
      return null == n ? {} : nr(n, t);
    }),
        zf = oe(Wu),
        Wf = oe(Bu),
        Bf = qr(function (n, t, r) {
      return t = t.toLowerCase(), n + (r ? Cu(t) : t);
    }),
        Lf = qr(function (n, t, r) {
      return n + (r ? "-" : "") + t.toLowerCase();
    }),
        Uf = qr(function (n, t, r) {
      return n + (r ? " " : "") + t.toLowerCase();
    }),
        Cf = Zr("toLowerCase"),
        Df = qr(function (n, t, r) {
      return n + (r ? "_" : "") + t.toLowerCase();
    }),
        Mf = qr(function (n, t, r) {
      return n + (r ? " " : "") + $f(t);
    }),
        Tf = qr(function (n, t, r) {
      return n + (r ? " " : "") + t.toUpperCase();
    }),
        $f = Zr("toUpperCase"),
        Ff = fr(function (t, r) {
      try {
        return n(t, T, r);
      } catch (n) {
        return pu(n) ? n : new Hu(n);
      }
    }),
        Nf = pe(function (n, t) {
      return r(t, function (t) {
        t = Me(t), st(n, t, Ho(n[t], n));
      }), n;
    }),
        Pf = Hr(),
        Zf = Hr(true),
        qf = fr(function (n, t) {
      return function (r) {
        return Lt(r, n, t);
      };
    }),
        Vf = fr(function (n, t) {
      return function (r) {
        return Lt(n, r, t);
      };
    }),
        Kf = Xr(c),
        Gf = Xr(u),
        Hf = Xr(h),
        Jf = re(),
        Yf = re(true),
        Qf = Qr(function (n, t) {
      return n + t;
    }, 0),
        Xf = ie("ceil"),
        nc = Qr(function (n, t) {
      return n / t;
    }, 1),
        tc = ie("floor"),
        rc = Qr(function (n, t) {
      return n * t;
    }, 1),
        ec = ie("round"),
        uc = Qr(function (n, t) {
      return n - t;
    }, 0);

    return An.after = function (n, t) {
      if (typeof t != "function") throw new ti("Expected a function");
      return n = Eu(n), function () {
        if (1 > --n) return t.apply(this, arguments);
      };
    }, An.ary = eu, An.assign = df, An.assignIn = yf, An.assignInWith = bf, An.assignWith = xf, An.at = jf, An.before = uu, An.bind = Ho, An.bindAll = Nf, An.bindKey = Jo, An.castArray = function () {
      if (!arguments.length) return [];
      var n = arguments[0];
      return ff(n) ? n : [n];
    }, An.chain = Ye, An.chunk = function (n, t, r) {
      if (t = (r ? Oe(n, t, r) : t === T) ? 1 : Ui(Eu(t), 0), r = null == n ? 0 : n.length, !r || 1 > t) return [];

      for (var e = 0, u = 0, i = Ku(Oi(r / t)); e < r;) {
        i[u++] = hr(n, e, e += t);
      }

      return i;
    }, An.compact = function (n) {
      for (var t = -1, r = null == n ? 0 : n.length, e = 0, u = []; ++t < r;) {
        var i = n[t];
        i && (u[e++] = i);
      }

      return u;
    }, An.concat = function () {
      var n = arguments.length;
      if (!n) return [];

      for (var t = Ku(n - 1), r = arguments[0]; n--;) {
        t[n - 1] = arguments[n];
      }

      return a(ff(r) ? Ur(r) : [r], wt(t, 1));
    }, An.cond = function (t) {
      var r = null == t ? 0 : t.length,
          e = ye();
      return t = r ? c(t, function (n) {
        if ("function" != typeof n[1]) throw new ti("Expected a function");
        return [e(n[0]), n[1]];
      }) : [], fr(function (e) {
        for (var u = -1; ++u < r;) {
          var i = t[u];
          if (n(i[0], this, e)) return n(i[1], this, e);
        }
      });
    }, An.conforms = function (n) {
      return vt(_t(n, 1));
    }, An.constant = Tu, An.countBy = $o, An.create = function (n, t) {
      var r = eo(n);
      return null == t ? r : at(r, t);
    }, An.curry = iu, An.curryRight = ou, An.debounce = fu, An.defaults = wf, An.defaultsDeep = mf, An.defer = Yo, An.delay = Qo, An.difference = wo, An.differenceBy = mo, An.differenceWith = Ao, An.drop = function (n, t, r) {
      var e = null == n ? 0 : n.length;
      return e ? (t = r || t === T ? 1 : Eu(t), hr(n, 0 > t ? 0 : t, e)) : [];
    }, An.dropRight = function (n, t, r) {
      var e = null == n ? 0 : n.length;
      return e ? (t = r || t === T ? 1 : Eu(t), t = e - t, hr(n, 0, 0 > t ? 0 : t)) : [];
    }, An.dropRightWhile = function (n, t) {
      return n && n.length ? jr(n, ye(t, 3), true, true) : [];
    }, An.dropWhile = function (n, t) {
      return n && n.length ? jr(n, ye(t, 3), true) : [];
    }, An.fill = function (n, t, r, e) {
      var u = null == n ? 0 : n.length;
      if (!u) return [];

      for (r && typeof r != "number" && Oe(n, t, r) && (r = 0, e = u), u = n.length, r = Eu(r), 0 > r && (r = -r > u ? 0 : u + r), e = e === T || e > u ? u : Eu(e), 0 > e && (e += u), e = r > e ? 0 : ku(e); r < e;) {
        n[r++] = t;
      }

      return n;
    }, An.filter = function (n, t) {
      return (ff(n) ? i : jt)(n, ye(t, 3));
    }, An.flatMap = function (n, t) {
      return wt(ru(n, t), 1);
    }, An.flatMapDeep = function (n, t) {
      return wt(ru(n, t), $);
    }, An.flatMapDepth = function (n, t, r) {
      return r = r === T ? 1 : Eu(r), wt(ru(n, t), r);
    }, An.flatten = Ze, An.flattenDeep = function (n) {
      return (null == n ? 0 : n.length) ? wt(n, $) : [];
    }, An.flattenDepth = function (n, t) {
      return null != n && n.length ? (t = t === T ? 1 : Eu(t), wt(n, t)) : [];
    }, An.flip = function (n) {
      return fe(n, 512);
    }, An.flow = Pf, An.flowRight = Zf, An.fromPairs = function (n) {
      for (var t = -1, r = null == n ? 0 : n.length, e = {}; ++t < r;) {
        var u = n[t];
        e[u[0]] = u[1];
      }

      return e;
    }, An.functions = function (n) {
      return null == n ? [] : Et(n, Wu(n));
    }, An.functionsIn = function (n) {
      return null == n ? [] : Et(n, Bu(n));
    }, An.groupBy = Po, An.initial = function (n) {
      return (null == n ? 0 : n.length) ? hr(n, 0, -1) : [];
    }, An.intersection = Eo, An.intersectionBy = ko, An.intersectionWith = So, An.invert = Af, An.invertBy = Ef, An.invokeMap = Zo, An.iteratee = Fu, An.keyBy = qo, An.keys = Wu, An.keysIn = Bu, An.map = ru, An.mapKeys = function (n, t) {
      var r = {};
      return t = ye(t, 3), mt(n, function (n, e, u) {
        st(r, t(n, e, u), n);
      }), r;
    }, An.mapValues = function (n, t) {
      var r = {};
      return t = ye(t, 3), mt(n, function (n, e, u) {
        st(r, e, t(n, e, u));
      }), r;
    }, An.matches = function (n) {
      return Ht(_t(n, 1));
    }, An.matchesProperty = function (n, t) {
      return Jt(n, _t(t, 1));
    }, An.memoize = cu, An.merge = Sf, An.mergeWith = Of, An.method = qf, An.methodOf = Vf, An.mixin = Nu, An.negate = au, An.nthArg = function (n) {
      return n = Eu(n), fr(function (t) {
        return Qt(t, n);
      });
    }, An.omit = If, An.omitBy = function (n, t) {
      return Lu(n, au(ye(t)));
    }, An.once = function (n) {
      return uu(2, n);
    }, An.orderBy = function (n, t, r, e) {
      return null == n ? [] : (ff(t) || (t = null == t ? [] : [t]), r = e ? T : r, ff(r) || (r = null == r ? [] : [r]), Xt(n, t, r));
    }, An.over = Kf, An.overArgs = Xo, An.overEvery = Gf, An.overSome = Hf, An.partial = nf, An.partialRight = tf, An.partition = Vo, An.pick = Rf, An.pickBy = Lu, An.property = Zu, An.propertyOf = function (n) {
      return function (t) {
        return null == n ? T : kt(n, t);
      };
    }, An.pull = Oo, An.pullAll = Ke, An.pullAllBy = function (n, t, r) {
      return n && n.length && t && t.length ? er(n, t, ye(r, 2)) : n;
    }, An.pullAllWith = function (n, t, r) {
      return n && n.length && t && t.length ? er(n, t, T, r) : n;
    }, An.pullAt = Io, An.range = Jf, An.rangeRight = Yf, An.rearg = rf, An.reject = function (n, t) {
      return (ff(n) ? i : jt)(n, au(ye(t, 3)));
    }, An.remove = function (n, t) {
      var r = [];
      if (!n || !n.length) return r;
      var e = -1,
          u = [],
          i = n.length;

      for (t = ye(t, 3); ++e < i;) {
        var o = n[e];
        t(o, e, n) && (r.push(o), u.push(e));
      }

      return ur(n, u), r;
    }, An.rest = function (n, t) {
      if (typeof n != "function") throw new ti("Expected a function");
      return t = t === T ? t : Eu(t), fr(n, t);
    }, An.reverse = Ge, An.sampleSize = function (n, t, r) {
      return t = (r ? Oe(n, t, r) : t === T) ? 1 : Eu(t), (ff(n) ? et : ar)(n, t);
    }, An.set = function (n, t, r) {
      return null == n ? n : lr(n, t, r);
    }, An.setWith = function (n, t, r, e) {
      return e = typeof e == "function" ? e : T, null == n ? n : lr(n, t, r, e);
    }, An.shuffle = function (n) {
      return (ff(n) ? ut : sr)(n);
    }, An.slice = function (n, t, r) {
      var e = null == n ? 0 : n.length;
      return e ? (r && typeof r != "number" && Oe(n, t, r) ? (t = 0, r = e) : (t = null == t ? 0 : Eu(t), r = r === T ? e : Eu(r)), hr(n, t, r)) : [];
    }, An.sortBy = Ko, An.sortedUniq = function (n) {
      return n && n.length ? gr(n) : [];
    }, An.sortedUniqBy = function (n, t) {
      return n && n.length ? gr(n, ye(t, 2)) : [];
    }, An.split = function (n, t, r) {
      return r && typeof r != "number" && Oe(n, t, r) && (t = r = T), r = r === T ? 4294967295 : r >>> 0, r ? (n = Iu(n)) && (typeof t == "string" || null != t && !hf(t)) && (t = yr(t), !t && Rn.test(n)) ? Or(M(n), 0, r) : n.split(t, r) : [];
    }, An.spread = function (t, r) {
      if (typeof t != "function") throw new ti("Expected a function");
      return r = null == r ? 0 : Ui(Eu(r), 0), fr(function (e) {
        var u = e[r];
        return e = Or(e, 0, r), u && a(e, u), n(t, this, e);
      });
    }, An.tail = function (n) {
      var t = null == n ? 0 : n.length;
      return t ? hr(n, 1, t) : [];
    }, An.take = function (n, t, r) {
      return n && n.length ? (t = r || t === T ? 1 : Eu(t), hr(n, 0, 0 > t ? 0 : t)) : [];
    }, An.takeRight = function (n, t, r) {
      var e = null == n ? 0 : n.length;
      return e ? (t = r || t === T ? 1 : Eu(t), t = e - t, hr(n, 0 > t ? 0 : t, e)) : [];
    }, An.takeRightWhile = function (n, t) {
      return n && n.length ? jr(n, ye(t, 3), false, true) : [];
    }, An.takeWhile = function (n, t) {
      return n && n.length ? jr(n, ye(t, 3)) : [];
    }, An.tap = function (n, t) {
      return t(n), n;
    }, An.throttle = function (n, t, r) {
      var e = true,
          u = true;
      if (typeof n != "function") throw new ti("Expected a function");
      return du(r) && (e = "leading" in r ? !!r.leading : e, u = "trailing" in r ? !!r.trailing : u), fu(n, t, {
        leading: e,
        maxWait: t,
        trailing: u
      });
    }, An.thru = Qe, An.toArray = mu, An.toPairs = zf, An.toPairsIn = Wf, An.toPath = function (n) {
      return ff(n) ? c(n, Me) : wu(n) ? [n] : Ur(jo(Iu(n)));
    }, An.toPlainObject = Ou, An.transform = function (n, t, e) {
      var u = ff(n),
          i = u || af(n) || _f(n);

      if (t = ye(t, 4), null == e) {
        var o = n && n.constructor;
        e = i ? u ? new o() : [] : du(n) && _u(o) ? eo(di(n)) : {};
      }

      return (i ? r : mt)(n, function (n, r, u) {
        return t(e, n, r, u);
      }), e;
    }, An.unary = function (n) {
      return eu(n, 1);
    }, An.union = Ro, An.unionBy = zo, An.unionWith = Wo, An.uniq = function (n) {
      return n && n.length ? br(n) : [];
    }, An.uniqBy = function (n, t) {
      return n && n.length ? br(n, ye(t, 2)) : [];
    }, An.uniqWith = function (n, t) {
      return t = typeof t == "function" ? t : T, n && n.length ? br(n, T, t) : [];
    }, An.unset = function (n, t) {
      return null == n || xr(n, t);
    }, An.unzip = He, An.unzipWith = Je, An.update = function (n, t, r) {
      return null == n ? n : lr(n, t, kr(r)(kt(n, t)), void 0);
    }, An.updateWith = function (n, t, r, e) {
      return e = typeof e == "function" ? e : T, null != n && (n = lr(n, t, kr(r)(kt(n, t)), e)), n;
    }, An.values = Uu, An.valuesIn = function (n) {
      return null == n ? [] : S(n, Bu(n));
    }, An.without = Bo, An.words = Mu, An.wrap = function (n, t) {
      return nf(kr(t), n);
    }, An.xor = Lo, An.xorBy = Uo, An.xorWith = Co, An.zip = Do, An.zipObject = function (n, t) {
      return Ar(n || [], t || [], ot);
    }, An.zipWith = Mo, An.entries = zf, An.entriesIn = Wf, An.extend = yf, An.extendWith = bf, Nu(An, An), An.add = Qf, An.attempt = Ff, An.camelCase = Bf, An.capitalize = Cu, An.ceil = Xf, An.clamp = function (n, t, r) {
      return r === T && (r = t, t = T), r !== T && (r = Su(r), r = r === r ? r : 0), t !== T && (t = Su(t), t = t === t ? t : 0), pt(Su(n), t, r);
    }, An.clone = function (n) {
      return _t(n, 4);
    }, An.cloneDeep = function (n) {
      return _t(n, 5);
    }, An.cloneDeepWith = function (n, t) {
      return t = typeof t == "function" ? t : T, _t(n, 5, t);
    }, An.cloneWith = function (n, t) {
      return t = typeof t == "function" ? t : T, _t(n, 4, t);
    }, An.conformsTo = function (n, t) {
      return null == t || gt(n, t, Wu(t));
    }, An.deburr = Du, An.defaultTo = function (n, t) {
      return null == n || n !== n ? t : n;
    }, An.divide = nc, An.endsWith = function (n, t, r) {
      n = Iu(n), t = yr(t);
      var e = n.length,
          e = r = r === T ? e : pt(Eu(r), 0, e);
      return r -= t.length, 0 <= r && n.slice(r, e) == t;
    }, An.eq = lu, An.escape = function (n) {
      return (n = Iu(n)) && H.test(n) ? n.replace(K, nt) : n;
    }, An.escapeRegExp = function (n) {
      return (n = Iu(n)) && en.test(n) ? n.replace(rn, "\\$&") : n;
    }, An.every = function (n, t, r) {
      var e = ff(n) ? u : bt;
      return r && Oe(n, t, r) && (t = T), e(n, ye(t, 3));
    }, An.find = Fo, An.findIndex = Ne, An.findKey = function (n, t) {
      return p(n, ye(t, 3), mt);
    }, An.findLast = No, An.findLastIndex = Pe, An.findLastKey = function (n, t) {
      return p(n, ye(t, 3), At);
    }, An.floor = tc, An.forEach = nu, An.forEachRight = tu, An.forIn = function (n, t) {
      return null == n ? n : oo(n, ye(t, 3), Bu);
    }, An.forInRight = function (n, t) {
      return null == n ? n : fo(n, ye(t, 3), Bu);
    }, An.forOwn = function (n, t) {
      return n && mt(n, ye(t, 3));
    }, An.forOwnRight = function (n, t) {
      return n && At(n, ye(t, 3));
    }, An.get = Ru, An.gt = ef, An.gte = uf, An.has = function (n, t) {
      return null != n && we(n, t, Rt);
    }, An.hasIn = zu, An.head = qe, An.identity = $u, An.includes = function (n, t, r, e) {
      return n = su(n) ? n : Uu(n), r = r && !e ? Eu(r) : 0, e = n.length, 0 > r && (r = Ui(e + r, 0)), ju(n) ? r <= e && -1 < n.indexOf(t, r) : !!e && -1 < v(n, t, r);
    }, An.indexOf = function (n, t, r) {
      var e = null == n ? 0 : n.length;
      return e ? (r = null == r ? 0 : Eu(r), 0 > r && (r = Ui(e + r, 0)), v(n, t, r)) : -1;
    }, An.inRange = function (n, t, r) {
      return t = Au(t), r === T ? (r = t, t = 0) : r = Au(r), n = Su(n), n >= Ci(t, r) && n < Ui(t, r);
    }, An.invoke = kf, An.isArguments = of, An.isArray = ff, An.isArrayBuffer = cf, An.isArrayLike = su, An.isArrayLikeObject = hu, An.isBoolean = function (n) {
      return true === n || false === n || yu(n) && "[object Boolean]" == Ot(n);
    }, An.isBuffer = af, An.isDate = lf, An.isElement = function (n) {
      return yu(n) && 1 === n.nodeType && !xu(n);
    }, An.isEmpty = function (n) {
      if (null == n) return true;
      if (su(n) && (ff(n) || typeof n == "string" || typeof n.splice == "function" || af(n) || _f(n) || of(n))) return !n.length;
      var t = vo(n);
      if ("[object Map]" == t || "[object Set]" == t) return !n.size;
      if (ze(n)) return !Vt(n).length;

      for (var r in n) {
        if (oi.call(n, r)) return false;
      }

      return true;
    }, An.isEqual = function (n, t) {
      return Mt(n, t);
    }, An.isEqualWith = function (n, t, r) {
      var e = (r = typeof r == "function" ? r : T) ? r(n, t) : T;
      return e === T ? Mt(n, t, T, r) : !!e;
    }, An.isError = pu, An.isFinite = function (n) {
      return typeof n == "number" && Wi(n);
    }, An.isFunction = _u, An.isInteger = vu, An.isLength = gu, An.isMap = sf, An.isMatch = function (n, t) {
      return n === t || $t(n, t, xe(t));
    }, An.isMatchWith = function (n, t, r) {
      return r = typeof r == "function" ? r : T, $t(n, t, xe(t), r);
    }, An.isNaN = function (n) {
      return bu(n) && n != +n;
    }, An.isNative = function (n) {
      if (go(n)) throw new Hu("Unsupported core-js use. Try https://npms.io/search?q=ponyfill.");
      return Ft(n);
    }, An.isNil = function (n) {
      return null == n;
    }, An.isNull = function (n) {
      return null === n;
    }, An.isNumber = bu, An.isObject = du, An.isObjectLike = yu, An.isPlainObject = xu, An.isRegExp = hf, An.isSafeInteger = function (n) {
      return vu(n) && -9007199254740991 <= n && 9007199254740991 >= n;
    }, An.isSet = pf, An.isString = ju, An.isSymbol = wu, An.isTypedArray = _f, An.isUndefined = function (n) {
      return n === T;
    }, An.isWeakMap = function (n) {
      return yu(n) && "[object WeakMap]" == vo(n);
    }, An.isWeakSet = function (n) {
      return yu(n) && "[object WeakSet]" == Ot(n);
    }, An.join = function (n, t) {
      return null == n ? "" : Bi.call(n, t);
    }, An.kebabCase = Lf, An.last = Ve, An.lastIndexOf = function (n, t, r) {
      var e = null == n ? 0 : n.length;
      if (!e) return -1;
      var u = e;

      if (r !== T && (u = Eu(r), u = 0 > u ? Ui(e + u, 0) : Ci(u, e - 1)), t === t) {
        for (r = u + 1; r-- && n[r] !== t;) {
          ;
        }

        n = r;
      } else n = _(n, d, u, true);

      return n;
    }, An.lowerCase = Uf, An.lowerFirst = Cf, An.lt = vf, An.lte = gf, An.max = function (n) {
      return n && n.length ? xt(n, $u, It) : T;
    }, An.maxBy = function (n, t) {
      return n && n.length ? xt(n, ye(t, 2), It) : T;
    }, An.mean = function (n) {
      return y(n, $u);
    }, An.meanBy = function (n, t) {
      return y(n, ye(t, 2));
    }, An.min = function (n) {
      return n && n.length ? xt(n, $u, Kt) : T;
    }, An.minBy = function (n, t) {
      return n && n.length ? xt(n, ye(t, 2), Kt) : T;
    }, An.stubArray = qu, An.stubFalse = Vu, An.stubObject = function () {
      return {};
    }, An.stubString = function () {
      return "";
    }, An.stubTrue = function () {
      return true;
    }, An.multiply = rc, An.nth = function (n, t) {
      return n && n.length ? Qt(n, Eu(t)) : T;
    }, An.noConflict = function () {
      return $n._ === this && ($n._ = si), this;
    }, An.noop = Pu, An.now = Go, An.pad = function (n, t, r) {
      n = Iu(n);
      var e = (t = Eu(t)) ? D(n) : 0;
      return !t || e >= t ? n : (t = (t - e) / 2, ne(Ii(t), r) + n + ne(Oi(t), r));
    }, An.padEnd = function (n, t, r) {
      n = Iu(n);
      var e = (t = Eu(t)) ? D(n) : 0;
      return t && e < t ? n + ne(t - e, r) : n;
    }, An.padStart = function (n, t, r) {
      n = Iu(n);
      var e = (t = Eu(t)) ? D(n) : 0;
      return t && e < t ? ne(t - e, r) + n : n;
    }, An.parseInt = function (n, t, r) {
      return r || null == t ? t = 0 : t && (t = +t), Mi(Iu(n).replace(on, ""), t || 0);
    }, An.random = function (n, t, r) {
      if (r && typeof r != "boolean" && Oe(n, t, r) && (t = r = T), r === T && (typeof t == "boolean" ? (r = t, t = T) : typeof n == "boolean" && (r = n, n = T)), n === T && t === T ? (n = 0, t = 1) : (n = Au(n), t === T ? (t = n, n = 0) : t = Au(t)), n > t) {
        var e = n;
        n = t, t = e;
      }

      return r || n % 1 || t % 1 ? (r = Ti(), Ci(n + r * (t - n + Cn("1e-" + ((r + "").length - 1))), t)) : ir(n, t);
    }, An.reduce = function (n, t, r) {
      var e = ff(n) ? l : j,
          u = 3 > arguments.length;
      return e(n, ye(t, 4), r, u, uo);
    }, An.reduceRight = function (n, t, r) {
      var e = ff(n) ? s : j,
          u = 3 > arguments.length;
      return e(n, ye(t, 4), r, u, io);
    }, An.repeat = function (n, t, r) {
      return t = (r ? Oe(n, t, r) : t === T) ? 1 : Eu(t), or(Iu(n), t);
    }, An.replace = function () {
      var n = arguments,
          t = Iu(n[0]);
      return 3 > n.length ? t : t.replace(n[1], n[2]);
    }, An.result = function (n, t, r) {
      t = Sr(t, n);
      var e = -1,
          u = t.length;

      for (u || (u = 1, n = T); ++e < u;) {
        var i = null == n ? T : n[Me(t[e])];
        i === T && (e = u, i = r), n = _u(i) ? i.call(n) : i;
      }

      return n;
    }, An.round = ec, An.runInContext = x, An.sample = function (n) {
      return (ff(n) ? Qn : cr)(n);
    }, An.size = function (n) {
      if (null == n) return 0;
      if (su(n)) return ju(n) ? D(n) : n.length;
      var t = vo(n);
      return "[object Map]" == t || "[object Set]" == t ? n.size : Vt(n).length;
    }, An.snakeCase = Df, An.some = function (n, t, r) {
      var e = ff(n) ? h : pr;
      return r && Oe(n, t, r) && (t = T), e(n, ye(t, 3));
    }, An.sortedIndex = function (n, t) {
      return _r(n, t);
    }, An.sortedIndexBy = function (n, t, r) {
      return vr(n, t, ye(r, 2));
    }, An.sortedIndexOf = function (n, t) {
      var r = null == n ? 0 : n.length;

      if (r) {
        var e = _r(n, t);

        if (e < r && lu(n[e], t)) return e;
      }

      return -1;
    }, An.sortedLastIndex = function (n, t) {
      return _r(n, t, true);
    }, An.sortedLastIndexBy = function (n, t, r) {
      return vr(n, t, ye(r, 2), true);
    }, An.sortedLastIndexOf = function (n, t) {
      if (null == n ? 0 : n.length) {
        var r = _r(n, t, true) - 1;
        if (lu(n[r], t)) return r;
      }

      return -1;
    }, An.startCase = Mf, An.startsWith = function (n, t, r) {
      return n = Iu(n), r = null == r ? 0 : pt(Eu(r), 0, n.length), t = yr(t), n.slice(r, r + t.length) == t;
    }, An.subtract = uc, An.sum = function (n) {
      return n && n.length ? m(n, $u) : 0;
    }, An.sumBy = function (n, t) {
      return n && n.length ? m(n, ye(t, 2)) : 0;
    }, An.template = function (n, t, r) {
      var e = An.templateSettings;
      r && Oe(n, t, r) && (t = T), n = Iu(n), t = bf({}, t, e, ce), r = bf({}, t.imports, e.imports, ce);
      var u,
          i,
          o = Wu(r),
          f = S(r, o),
          c = 0;
      r = t.interpolate || jn;
      var a = "__p+='";
      r = Xu((t.escape || jn).source + "|" + r.source + "|" + (r === Q ? pn : jn).source + "|" + (t.evaluate || jn).source + "|$", "g");
      var l = oi.call(t, "sourceURL") ? "//# sourceURL=" + (t.sourceURL + "").replace(/[\r\n]/g, " ") + "\n" : "";
      if (n.replace(r, function (t, r, e, o, f, l) {
        return e || (e = o), a += n.slice(c, l).replace(wn, z), r && (u = true, a += "'+__e(" + r + ")+'"), f && (i = true, a += "';" + f + ";\n__p+='"), e && (a += "'+((__t=(" + e + "))==null?'':__t)+'"), c = l + t.length, t;
      }), a += "';", (t = oi.call(t, "variable") && t.variable) || (a = "with(obj){" + a + "}"), a = (i ? a.replace(P, "") : a).replace(Z, "$1").replace(q, "$1;"), a = "function(" + (t || "obj") + "){" + (t ? "" : "obj||(obj={});") + "var __t,__p=''" + (u ? ",__e=_.escape" : "") + (i ? ",__j=Array.prototype.join;function print(){__p+=__j.call(arguments,'')}" : ";") + a + "return __p}", t = Ff(function () {
        return Ju(o, l + "return " + a).apply(T, f);
      }), t.source = a, pu(t)) throw t;
      return t;
    }, An.times = function (n, t) {
      if (n = Eu(n), 1 > n || 9007199254740991 < n) return [];
      var r = 4294967295,
          e = Ci(n, 4294967295);

      for (t = ye(t), n -= 4294967295, e = A(e, t); ++r < n;) {
        t(r);
      }

      return e;
    }, An.toFinite = Au, An.toInteger = Eu, An.toLength = ku, An.toLower = function (n) {
      return Iu(n).toLowerCase();
    }, An.toNumber = Su, An.toSafeInteger = function (n) {
      return n ? pt(Eu(n), -9007199254740991, 9007199254740991) : 0 === n ? n : 0;
    }, An.toString = Iu, An.toUpper = function (n) {
      return Iu(n).toUpperCase();
    }, An.trim = function (n, t, r) {
      return (n = Iu(n)) && (r || t === T) ? n.replace(un, "") : n && (t = yr(t)) ? (n = M(n), r = M(t), t = I(n, r), r = R(n, r) + 1, Or(n, t, r).join("")) : n;
    }, An.trimEnd = function (n, t, r) {
      return (n = Iu(n)) && (r || t === T) ? n.replace(fn, "") : n && (t = yr(t)) ? (n = M(n), t = R(n, M(t)) + 1, Or(n, 0, t).join("")) : n;
    }, An.trimStart = function (n, t, r) {
      return (n = Iu(n)) && (r || t === T) ? n.replace(on, "") : n && (t = yr(t)) ? (n = M(n), t = I(n, M(t)), Or(n, t).join("")) : n;
    }, An.truncate = function (n, t) {
      var r = 30,
          e = "...";
      if (du(t)) var u = "separator" in t ? t.separator : u,
          r = "length" in t ? Eu(t.length) : r,
          e = "omission" in t ? yr(t.omission) : e;
      n = Iu(n);
      var i = n.length;
      if (Rn.test(n)) var o = M(n),
          i = o.length;
      if (r >= i) return n;
      if (i = r - D(e), 1 > i) return e;
      if (r = o ? Or(o, 0, i).join("") : n.slice(0, i), u === T) return r + e;

      if (o && (i += r.length - i), hf(u)) {
        if (n.slice(i).search(u)) {
          var f = r;

          for (u.global || (u = Xu(u.source, Iu(_n.exec(u)) + "g")), u.lastIndex = 0; o = u.exec(f);) {
            var c = o.index;
          }

          r = r.slice(0, c === T ? i : c);
        }
      } else n.indexOf(yr(u), i) != i && (u = r.lastIndexOf(u), -1 < u && (r = r.slice(0, u)));

      return r + e;
    }, An.unescape = function (n) {
      return (n = Iu(n)) && G.test(n) ? n.replace(V, tt) : n;
    }, An.uniqueId = function (n) {
      var t = ++fi;
      return Iu(n) + t;
    }, An.upperCase = Tf, An.upperFirst = $f, An.each = nu, An.eachRight = tu, An.first = qe, Nu(An, function () {
      var n = {};
      return mt(An, function (t, r) {
        oi.call(An.prototype, r) || (n[r] = t);
      }), n;
    }(), {
      chain: false
    }), An.VERSION = "4.17.15", r("bind bindKey curry curryRight partial partialRight".split(" "), function (n) {
      An[n].placeholder = An;
    }), r(["drop", "take"], function (n, t) {
      Un.prototype[n] = function (r) {
        r = r === T ? 1 : Ui(Eu(r), 0);
        var e = this.__filtered__ && !t ? new Un(this) : this.clone();
        return e.__filtered__ ? e.__takeCount__ = Ci(r, e.__takeCount__) : e.__views__.push({
          size: Ci(r, 4294967295),
          type: n + (0 > e.__dir__ ? "Right" : "")
        }), e;
      }, Un.prototype[n + "Right"] = function (t) {
        return this.reverse()[n](t).reverse();
      };
    }), r(["filter", "map", "takeWhile"], function (n, t) {
      var r = t + 1,
          e = 1 == r || 3 == r;

      Un.prototype[n] = function (n) {
        var t = this.clone();
        return t.__iteratees__.push({
          iteratee: ye(n, 3),
          type: r
        }), t.__filtered__ = t.__filtered__ || e, t;
      };
    }), r(["head", "last"], function (n, t) {
      var r = "take" + (t ? "Right" : "");

      Un.prototype[n] = function () {
        return this[r](1).value()[0];
      };
    }), r(["initial", "tail"], function (n, t) {
      var r = "drop" + (t ? "" : "Right");

      Un.prototype[n] = function () {
        return this.__filtered__ ? new Un(this) : this[r](1);
      };
    }), Un.prototype.compact = function () {
      return this.filter($u);
    }, Un.prototype.find = function (n) {
      return this.filter(n).head();
    }, Un.prototype.findLast = function (n) {
      return this.reverse().find(n);
    }, Un.prototype.invokeMap = fr(function (n, t) {
      return typeof n == "function" ? new Un(this) : this.map(function (r) {
        return Lt(r, n, t);
      });
    }), Un.prototype.reject = function (n) {
      return this.filter(au(ye(n)));
    }, Un.prototype.slice = function (n, t) {
      n = Eu(n);
      var r = this;
      return r.__filtered__ && (0 < n || 0 > t) ? new Un(r) : (0 > n ? r = r.takeRight(-n) : n && (r = r.drop(n)), t !== T && (t = Eu(t), r = 0 > t ? r.dropRight(-t) : r.take(t - n)), r);
    }, Un.prototype.takeRightWhile = function (n) {
      return this.reverse().takeWhile(n).reverse();
    }, Un.prototype.toArray = function () {
      return this.take(4294967295);
    }, mt(Un.prototype, function (n, t) {
      var r = /^(?:filter|find|map|reject)|While$/.test(t),
          e = /^(?:head|last)$/.test(t),
          u = An[e ? "take" + ("last" == t ? "Right" : "") : t],
          i = e || /^find/.test(t);
      u && (An.prototype[t] = function () {
        function t(n) {
          return n = u.apply(An, a([n], f)), e && h ? n[0] : n;
        }

        var o = this.__wrapped__,
            f = e ? [1] : arguments,
            c = o instanceof Un,
            l = f[0],
            s = c || ff(o);
        s && r && typeof l == "function" && 1 != l.length && (c = s = false);
        var h = this.__chain__,
            p = !!this.__actions__.length,
            l = i && !h,
            c = c && !p;
        return !i && s ? (o = c ? o : new Un(this), o = n.apply(o, f), o.__actions__.push({
          func: Qe,
          args: [t],
          thisArg: T
        }), new On(o, h)) : l && c ? n.apply(this, f) : (o = this.thru(t), l ? e ? o.value()[0] : o.value() : o);
      });
    }), r("pop push shift sort splice unshift".split(" "), function (n) {
      var t = ri[n],
          r = /^(?:push|sort|unshift)$/.test(n) ? "tap" : "thru",
          e = /^(?:pop|shift)$/.test(n);

      An.prototype[n] = function () {
        var n = arguments;

        if (e && !this.__chain__) {
          var u = this.value();
          return t.apply(ff(u) ? u : [], n);
        }

        return this[r](function (r) {
          return t.apply(ff(r) ? r : [], n);
        });
      };
    }), mt(Un.prototype, function (n, t) {
      var r = An[t];

      if (r) {
        var e = r.name + "";
        oi.call(Gi, e) || (Gi[e] = []), Gi[e].push({
          name: t,
          func: r
        });
      }
    }), Gi[Jr(T, 2).name] = [{
      name: "wrapper",
      func: T
    }], Un.prototype.clone = function () {
      var n = new Un(this.__wrapped__);
      return n.__actions__ = Ur(this.__actions__), n.__dir__ = this.__dir__, n.__filtered__ = this.__filtered__, n.__iteratees__ = Ur(this.__iteratees__), n.__takeCount__ = this.__takeCount__, n.__views__ = Ur(this.__views__), n;
    }, Un.prototype.reverse = function () {
      if (this.__filtered__) {
        var n = new Un(this);
        n.__dir__ = -1, n.__filtered__ = true;
      } else n = this.clone(), n.__dir__ *= -1;

      return n;
    }, Un.prototype.value = function () {
      var n,
          t = this.__wrapped__.value(),
          r = this.__dir__,
          e = ff(t),
          u = 0 > r,
          i = e ? t.length : 0;

      n = i;

      for (var o = this.__views__, f = 0, c = -1, a = o.length; ++c < a;) {
        var l = o[c],
            s = l.size;

        switch (l.type) {
          case "drop":
            f += s;
            break;

          case "dropRight":
            n -= s;
            break;

          case "take":
            n = Ci(n, f + s);
            break;

          case "takeRight":
            f = Ui(f, n - s);
        }
      }

      if (n = {
        start: f,
        end: n
      }, o = n.start, f = n.end, n = f - o, o = u ? f : o - 1, f = this.__iteratees__, c = f.length, a = 0, l = Ci(n, this.__takeCount__), !e || !u && i == n && l == n) return wr(t, this.__actions__);
      e = [];

      n: for (; n-- && a < l;) {
        for (o += r, u = -1, i = t[o]; ++u < c;) {
          var h = f[u],
              s = h.type,
              h = (0, h.iteratee)(i);
          if (2 == s) i = h;else if (!h) {
            if (1 == s) continue n;
            break n;
          }
        }

        e[a++] = i;
      }

      return e;
    }, An.prototype.at = To, An.prototype.chain = function () {
      return Ye(this);
    }, An.prototype.commit = function () {
      return new On(this.value(), this.__chain__);
    }, An.prototype.next = function () {
      this.__values__ === T && (this.__values__ = mu(this.value()));
      var n = this.__index__ >= this.__values__.length;
      return {
        done: n,
        value: n ? T : this.__values__[this.__index__++]
      };
    }, An.prototype.plant = function (n) {
      for (var t, r = this; r instanceof En;) {
        var e = Fe(r);
        e.__index__ = 0, e.__values__ = T, t ? u.__wrapped__ = e : t = e;
        var u = e,
            r = r.__wrapped__;
      }

      return u.__wrapped__ = n, t;
    }, An.prototype.reverse = function () {
      var n = this.__wrapped__;
      return n instanceof Un ? (this.__actions__.length && (n = new Un(this)), n = n.reverse(), n.__actions__.push({
        func: Qe,
        args: [Ge],
        thisArg: T
      }), new On(n, this.__chain__)) : this.thru(Ge);
    }, An.prototype.toJSON = An.prototype.valueOf = An.prototype.value = function () {
      return wr(this.__wrapped__, this.__actions__);
    }, An.prototype.first = An.prototype.head, wi && (An.prototype[wi] = Xe), An;
  }();

   true ? ($n._ = rt, !(__WEBPACK_AMD_DEFINE_RESULT__ = (function () {
    return rt;
  }).call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))) : undefined;
}).call(this);
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(66), __webpack_require__(166)(module)))

/***/ }),

/***/ 330:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(441);


/***/ }),

/***/ 411:
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;/* @license
check-types
version: 8.0.2
author: Phil Booth
https://gitlab.com/philbooth/check-types.js
License: MIT
*/
!function (n) {
  "use strict";

  var r, f, e, t, o, i, u, c, a, l, s, y, p, b, m;

  function v(n) {
    return null != n;
  }

  function d(n) {
    return "number" == typeof n && l < n && n < s;
  }

  function h(n) {
    return "number" == typeof n && n % 1 == 0;
  }

  function g(n, t) {
    return d(n) && t < n;
  }

  function O(n, t) {
    return d(n) && n < t;
  }

  function j(n, t) {
    return d(n) && t <= n;
  }

  function E(n, t) {
    return d(n) && n <= t;
  }

  function w(n) {
    return "string" == typeof n;
  }

  function I(n) {
    return w(n) && "" !== n;
  }

  function S(n) {
    return "[object Object]" === Object.prototype.toString.call(n);
  }

  function A(n, t) {
    for (var r in n) {
      if (n.hasOwnProperty(r) && t(r, n[r])) return !0;
    }

    return !1;
  }

  function N(n, t) {
    try {
      return n instanceof t;
    } catch (n) {
      return !1;
    }
  }

  function P(n, t) {
    var r;

    for (r in t) {
      if (t.hasOwnProperty(r)) {
        if (!1 === n.hasOwnProperty(r) || typeof n[r] != typeof t[r]) return !1;
        if (S(n[r]) && !1 === P(n[r], t[r])) return !1;
      }
    }

    return !0;
  }

  function k(n) {
    return v(n) && 0 <= n.length;
  }

  function T(n) {
    return "function" == typeof n;
  }

  function x(n, t) {
    for (var r in n) {
      n.hasOwnProperty(r) && t(r, n[r]);
    }
  }

  function q(n, t) {
    var r;

    for (r = 0; r < n.length; r += 1) {
      if (n[r] === t) return t;
    }

    return !t;
  }

  function L(n, t) {
    var r, e;

    for (r in n) {
      if (n.hasOwnProperty(r)) {
        if (S(e = n[r]) && L(e, t) === t) return t;
        if (e === t) return t;
      }
    }

    return !t;
  }

  function F(r, n) {
    return x(n, function (n, t) {
      r[n] = t;
    }), r;
  }

  function V(o, i) {
    return function () {
      return t = arguments, r = i, e = (n = o).l || n.length, u = t[e], f = t[e + 1], Y(n.apply(null, t), I(u) ? u : r, T(f) ? f : TypeError), t[0];
      var n, t, r, e, u, f;
    };
  }

  function Y(n, t, r) {
    if (n) return n;
    throw new (r || Error)(t || "Assertion failed");
  }

  function _(n) {
    var t = function t() {
      return z(n.apply(null, arguments));
    };

    return t.l = n.length, t;
  }

  function z(n) {
    return !n;
  }

  function D(r, e, u) {
    var n = function n() {
      var n, t;
      if (n = arguments[0], "maybe" === r && i.assigned(n)) return !0;
      if (!e(n)) return !1;
      n = function (n, t) {
        switch (n) {
          case k:
            return a.call(t);

          case S:
            return p(t).map(function (n) {
              return t[n];
            });

          default:
            return t;
        }
      }(e, n), t = a.call(arguments, 1);

      try {
        n.forEach(function (n) {
          if (("maybe" !== r || v(n)) && !u.apply(null, [n].concat(t))) throw 0;
        });
      } catch (n) {
        return !1;
      }

      return !0;
    };

    return n.l = u.length, n;
  }

  function G(n, t) {
    return R([n, e, t]);
  }

  function R(r) {
    var e, n, t, u;
    return e = r.shift(), n = r.pop(), t = r.pop(), u = n || {}, x(t, function (n, t) {
      Object.defineProperty(u, n, {
        configurable: !1,
        enumerable: !0,
        writable: !1,
        value: e.apply(null, r.concat(t, f[n]))
      });
    }), u;
  }

  function B(n, t) {
    return R([n, t, null]);
  }

  function C(t, r) {
    c.forEach(function (n) {
      t[n].of = B(r, e[n].of);
    });
  }

  r = {
    v: "value",
    n: "number",
    s: "string",
    b: "boolean",
    o: "object",
    t: "type",
    a: "array",
    al: "array-like",
    i: "iterable",
    d: "date",
    f: "function",
    l: "length"
  }, f = {}, e = {}, [{
    n: "equal",
    f: function f(n, t) {
      return n === t;
    },
    s: "v"
  }, {
    n: "undefined",
    f: function f(n) {
      return void 0 === n;
    },
    s: "v"
  }, {
    n: "null",
    f: function f(n) {
      return null === n;
    },
    s: "v"
  }, {
    n: "assigned",
    f: v,
    s: "v"
  }, {
    n: "primitive",
    f: function f(n) {
      var t;

      switch (n) {
        case null:
        case void 0:
        case !1:
        case !0:
          return !0;
      }

      return "string" == (t = typeof n) || "number" === t || b && "symbol" === t;
    },
    s: "v"
  }, {
    n: "includes",
    f: function f(n, r) {
      var t, e;
      if (!v(n)) return !1;

      if (b && n[Symbol.iterator] && T(n.values)) {
        t = n.values();

        do {
          if ((e = t.next()).value === r) return !0;
        } while (!e.done);

        return !1;
      }

      return A(n, function (n, t) {
        return t === r;
      });
    },
    s: "v"
  }, {
    n: "zero",
    f: function f(n) {
      return 0 === n;
    }
  }, {
    n: "infinity",
    f: function f(n) {
      return n === l || n === s;
    }
  }, {
    n: "number",
    f: d
  }, {
    n: "integer",
    f: h
  }, {
    n: "even",
    f: function f(n) {
      return "number" == typeof n && n % 2 == 0;
    }
  }, {
    n: "odd",
    f: function f(n) {
      return h(n) && n % 2 != 0;
    }
  }, {
    n: "greater",
    f: g
  }, {
    n: "less",
    f: O
  }, {
    n: "between",
    f: function f(n, t, r) {
      if (t < r) return g(n, t) && n < r;
      return O(n, t) && r < n;
    }
  }, {
    n: "greaterOrEqual",
    f: j
  }, {
    n: "lessOrEqual",
    f: E
  }, {
    n: "inRange",
    f: function f(n, t, r) {
      if (t < r) return j(n, t) && n <= r;
      return E(n, t) && r <= n;
    }
  }, {
    n: "positive",
    f: function f(n) {
      return g(n, 0);
    }
  }, {
    n: "negative",
    f: function f(n) {
      return O(n, 0);
    }
  }, {
    n: "string",
    f: w,
    s: "s"
  }, {
    n: "emptyString",
    f: function f(n) {
      return "" === n;
    },
    s: "s"
  }, {
    n: "nonEmptyString",
    f: I,
    s: "s"
  }, {
    n: "contains",
    f: function f(n, t) {
      return w(n) && -1 !== n.indexOf(t);
    },
    s: "s"
  }, {
    n: "match",
    f: function f(n, t) {
      return w(n) && !!n.match(t);
    },
    s: "s"
  }, {
    n: "boolean",
    f: function f(n) {
      return !1 === n || !0 === n;
    },
    s: "b"
  }, {
    n: "object",
    f: S,
    s: "o"
  }, {
    n: "emptyObject",
    f: function f(n) {
      return S(n) && !A(n, function () {
        return !0;
      });
    },
    s: "o"
  }, {
    n: "nonEmptyObject",
    f: function f(n) {
      return S(n) && A(n, function () {
        return !0;
      });
    },
    s: "o"
  }, {
    n: "instanceStrict",
    f: N,
    s: "t"
  }, {
    n: "instance",
    f: function f(n, t) {
      try {
        return N(n, t) || n.constructor.name === t.name || Object.prototype.toString.call(n) === "[object " + t.name + "]";
      } catch (n) {
        return !1;
      }
    },
    s: "t"
  }, {
    n: "like",
    f: P,
    s: "t"
  }, {
    n: "array",
    f: function f(n) {
      return y(n);
    },
    s: "a"
  }, {
    n: "emptyArray",
    f: function f(n) {
      return y(n) && 0 === n.length;
    },
    s: "a"
  }, {
    n: "nonEmptyArray",
    f: function f(n) {
      return y(n) && 0 < n.length;
    },
    s: "a"
  }, {
    n: "arrayLike",
    f: k,
    s: "al"
  }, {
    n: "iterable",
    f: function f(n) {
      return b ? v(n) && T(n[Symbol.iterator]) : k(n);
    },
    s: "i"
  }, {
    n: "date",
    f: function f(n) {
      return N(n, Date) && h(n.getTime());
    },
    s: "d"
  }, {
    n: "function",
    f: T,
    s: "f"
  }, {
    n: "hasLength",
    f: function f(n, t) {
      return v(n) && n.length === t;
    },
    s: "l"
  }].map(function (n) {
    var t = n.n;
    f[t] = "Invalid " + r[n.s || "n"], e[t] = n.f;
  }), t = {
    map: function t(e, r) {
      var u;
      u = y(e) ? [] : {};
      if (T(r)) x(e, function (n, t) {
        u[n] = r(t);
      });else {
        y(r) || o.object(r);
        var f = p(e || {});
        x(r, function (r, n) {
          f.some(function (n, t) {
            return n === r && (f.splice(t, 1), !0);
          }), T(n) ? i.assigned(e) ? u[r] = !!n.m : u[r] = n(e[r]) : u[r] = t(e[r], n);
        });
      }
      return u;
    },
    all: function all(n) {
      if (y(n)) return q(n, !1);
      return o.object(n), L(n, !1);
    },
    any: function any(n) {
      if (y(n)) return q(n, !0);
      return o.object(n), L(n, !0);
    }
  }, c = ["array", "arrayLike", "iterable", "object"], a = Array.prototype.slice, l = Number.NEGATIVE_INFINITY, s = Number.POSITIVE_INFINITY, y = Array.isArray, p = Object.keys, b = "function" == typeof Symbol, t = F(t, e), o = G(V, Y), i = G(_, z), u = G(function (n) {
    var t = function t() {
      return !!i.assigned(arguments[0]) || n.apply(null, arguments);
    };

    return t.l = n.length, t.m = !0, t;
  }, function (n) {
    return !1 === v(n) || n;
  }), o.not = B(V, i), o.maybe = B(V, u), c.forEach(function (n) {
    e[n].of = R([D.bind(null, null), e[n], e, null]);
  }), C(o, V), C(i, _), c.forEach(function (n) {
    u[n].of = R([D.bind(null, "maybe"), e[n], e, null]), o.maybe[n].of = B(V, u[n].of), o.not[n].of = B(V, i[n].of);
  }), m = F(t, {
    assert: o,
    not: i,
    maybe: u
  }),  true ? !(__WEBPACK_AMD_DEFINE_RESULT__ = (function () {
    return m;
  }).call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)) : undefined;
}(this);

/***/ }),

/***/ 441:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var async_fields_actions_namespaceObject = {};
__webpack_require__.r(async_fields_actions_namespaceObject);
__webpack_require__.d(async_fields_actions_namespaceObject, "getWorkflowOptions", function() { return async_fields_actions_getWorkflowOptions; });
__webpack_require__.d(async_fields_actions_namespaceObject, "getPoliciesForScan", function() { return async_fields_actions_getPoliciesForScan; });
__webpack_require__.d(async_fields_actions_namespaceObject, "queryUsers", function() { return queryUsers; });
__webpack_require__.d(async_fields_actions_namespaceObject, "queryRoles", function() { return queryRoles; });
__webpack_require__.d(async_fields_actions_namespaceObject, "queryForEntitlement", function() { return async_fields_actions_queryForEntitlement; });
__webpack_require__.d(async_fields_actions_namespaceObject, "resetTypeaheadOptions", function() { return async_fields_actions_resetTypeaheadOptions; });
__webpack_require__.d(async_fields_actions_namespaceObject, "queryTypeaheadOptions", function() { return async_fields_actions_queryTypeaheadOptions; });
__webpack_require__.d(async_fields_actions_namespaceObject, "reverseQueryTypeahead", function() { return async_fields_actions_reverseQueryTypeahead; });

// EXTERNAL MODULE: ./node_modules/babel-preset-react-app/node_modules/@babel/runtime/helpers/esm/objectSpread.js
var objectSpread = __webpack_require__(5);

// EXTERNAL MODULE: ./node_modules/react-app-polyfill/ie11.js
var ie11 = __webpack_require__(331);

// EXTERNAL MODULE: ./node_modules/react/index.js
var react = __webpack_require__(0);
var react_default = /*#__PURE__*/__webpack_require__.n(react);

// EXTERNAL MODULE: ./node_modules/react-dom/index.js
var react_dom = __webpack_require__(31);
var react_dom_default = /*#__PURE__*/__webpack_require__.n(react_dom);

// EXTERNAL MODULE: ./node_modules/react-router/esm/react-router.js
var react_router = __webpack_require__(41);

// EXTERNAL MODULE: ./node_modules/history/esm/history.js + 2 modules
var esm_history = __webpack_require__(57);

// EXTERNAL MODULE: ./node_modules/react-redux/es/index.js + 14 modules
var es = __webpack_require__(15);

// EXTERNAL MODULE: ./node_modules/@material-ui/styles/esm/ThemeProvider/ThemeProvider.js
var ThemeProvider = __webpack_require__(531);

// EXTERNAL MODULE: ./node_modules/@material-ui/pickers/esm/useUtils-cfb96ac9.js
var useUtils_cfb96ac9 = __webpack_require__(51);

// EXTERNAL MODULE: ./node_modules/@date-io/moment/build/index.esm.js
var index_esm = __webpack_require__(263);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/CssBaseline/CssBaseline.js
var CssBaseline = __webpack_require__(532);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Close.js
var Close = __webpack_require__(53);
var Close_default = /*#__PURE__*/__webpack_require__.n(Close);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/IconButton/IconButton.js
var IconButton = __webpack_require__(306);

// EXTERNAL MODULE: ./node_modules/typeface-roboto/index.css
var typeface_roboto = __webpack_require__(371);

// EXTERNAL MODULE: ./node_modules/notistack/dist/notistack.esm.js + 3 modules
var notistack_esm = __webpack_require__(193);

// EXTERNAL MODULE: /hcmapps/workspace/IDG_Build/tmp/commons/shared/src/utils/clientConfig.js
var clientConfig = __webpack_require__(174);
var clientConfig_default = /*#__PURE__*/__webpack_require__.n(clientConfig);

// EXTERNAL MODULE: ./node_modules/babel-preset-react-app/node_modules/@babel/runtime/helpers/esm/defineProperty.js
var defineProperty = __webpack_require__(7);

// EXTERNAL MODULE: ./node_modules/axios/index.js
var axios = __webpack_require__(264);
var axios_default = /*#__PURE__*/__webpack_require__.n(axios);

// EXTERNAL MODULE: ./node_modules/lodash/lodash.js
var lodash = __webpack_require__(2);
var lodash_default = /*#__PURE__*/__webpack_require__.n(lodash);

// EXTERNAL MODULE: ./node_modules/babel-preset-react-app/node_modules/@babel/runtime/helpers/esm/objectWithoutProperties.js + 1 modules
var objectWithoutProperties = __webpack_require__(138);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/styles/createMuiTheme.js + 18 modules
var createMuiTheme = __webpack_require__(303);

// CONCATENATED MODULE: ./src/styles/theme.js
function _toPropertyKey(arg){var key=_toPrimitive(arg,"string");return typeof key==="symbol"?key:String(key);}function _toPrimitive(input,hint){if(typeof input!=="object"||input===null)return input;var prim=input[Symbol.toPrimitive];if(prim!==undefined){var res=prim.call(input,hint||"default");if(typeof res!=="object")return res;throw new TypeError("@@toPrimitive must return a primitive value.");}return(hint==="string"?String:Number)(input);}/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var muiBaseTheme=Object(createMuiTheme["a" /* default */])();var drawerWidth=muiBaseTheme.spacing()*30;// note(ML): The nav bar gets a property of min-height: 64px under .MuiToolbar-regular class, so i'm setting the same value here
var navBarHeight='64px';var theme_renameProp=function renameProp(oldProp,newProp,_ref){var old=_ref[oldProp],others=Object(objectWithoutProperties["a" /* default */])(_ref,[oldProp].map(_toPropertyKey));return Object(defineProperty["a" /* default */])({},newProp,old);};var theme_theme=Object(createMuiTheme["a" /* default */])({palette:{primary:{main:'#314054'},secondary:{main:'#007bff'},forgerock:{blue:'#109cf1',darkGray:'#324054',lightGray:'#f6f8fa',white:'#fff',orange:'#f96600',lightBlue:'#109cf1',success:'#2ed47a',warning:'#ffb946',danger:'#f7685b'},background:{default:'#f6f8fa'}},overrides:{MuiAppBar:{root:{display:'flex',flexGrow:1,'&.appBar':{justifyContent:'space-between',transition:muiBaseTheme.transitions.create(['margin','width'],{easing:muiBaseTheme.transitions.easing.easeOut,duration:muiBaseTheme.transitions.duration.leavingScreen})},'&.appBarShift':{width:"calc(100% - ".concat(drawerWidth,"px)"),transition:muiBaseTheme.transitions.create('width',{easing:muiBaseTheme.transitions.easing.easeOut,duration:muiBaseTheme.transitions.duration.enteringScreen})}}},MuiButtonBase:{root:{height:'40px','&.hide':{display:'none'},'&:focus':{outline:'none'}}},MuiButton:{root:{fontWeight:'400',textTransform:'capitalize'}},MuiToolbar:{root:{'&.appToolbar':{justifyContent:'center',flexGrow:1,transition:muiBaseTheme.transitions.create(['margin','width'],{easing:muiBaseTheme.transitions.easing.easeOut,duration:muiBaseTheme.transitions.duration.leavingScreen})},'&.appToolbarLoggedIn':{justifyContent:'space-between',height:'72px'},'&.menuButton':{marginRight:muiBaseTheme.spacing(2)},'&.hide':{display:'none'}}},MuiDrawer:{root:{'& div.drawer':{width:drawerWidth,flexShrink:0},'& div.drawerHeader':Object(objectSpread["a" /* default */])({display:'flex',alignItems:'center',padding:'0 8px',height:'64px',overflow:'visible'},muiBaseTheme.mixins.toolbar,{justifyContent:'flex-start'}),'& img.drawerLogo':{paddingLeft:'10px',width:'150px'}},paper:{'&.drawerPaper':{width:drawerWidth}}},MuiDialog:{paper:{maxWidth:'100%!important',overflowY:'overlay','&.appBarShift':{// marginLeft: drawerWidth,
}}},MuiGrid:{item:{flexGrow:1,'&.mainContent':Object(objectSpread["a" /* default */])({},theme_renameProp('minHeight','marginTop',muiBaseTheme.mixins.toolbar),{marginTop:'90px',padding:muiBaseTheme.spacing(3),marginLeft:0,transition:muiBaseTheme.transitions.create('margin',{easing:muiBaseTheme.transitions.easing.easeOut,duration:muiBaseTheme.transitions.duration.leavingScreen})}),'&.mainContent.contentShift':{marginLeft:drawerWidth,transition:muiBaseTheme.transitions.create('margin',{easing:muiBaseTheme.transitions.easing.easeOut,duration:muiBaseTheme.transitions.duration.enteringScreen})}}}}});/* harmony default export */ var styles_theme = (theme_theme);
// CONCATENATED MODULE: ./src/utils/constants.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var IDM_URL=undefined;var IDM_CONTEXT=undefined;if(true){IDM_URL="".concat(location.protocol,"//").concat(location.hostname);if(location.port){IDM_URL+=":".concat(location.port);}IDM_CONTEXT=window.IDM_CONTEXT;}// approvals progress statuses
var PROGRESS_STATUS={IN_PROGRESS:'in-progress',COMPLETE:'complete'};// approvals outcome statuses
var APPROVAL_STATUS={APPROVED:'approved',REJECTED:'rejected',PENDING:'pending'};var CERT_STATUS={ACTIVE:'active',CLOSED:'closed',SCHEDULED:'scheduled',TRIGGERED:'triggered'};var CERT_STATUSES=lodash_default.a.values(CERT_STATUS);var DASHBOARD_STATUSES=lodash_default.a.remove(lodash_default.a.values(CERT_STATUS),function(n){return n==='active'||n==='closed';});var CERT_TYPE={USER:'user',OBJECT:'object'};var CERT_TYPES=lodash_default.a.values(CERT_TYPE);var VIEW_TYPE={ADMIN:'admin',USER:'user'};var VIEW_TYPES=lodash_default.a.values(VIEW_TYPE);var TASK={USER_CERT:'user',OBJECT_CERT:'object',VIOLATION:'violation'};var TASKS=lodash_default.a.values(TASK);var SETTING={GLOBAL:'global',ABOUT:'about'};var SETTINGS=lodash_default.a.values(SETTING);var CHART_COLORS=[styles_theme.palette.secondary.main,styles_theme.palette.forgerock.blue,styles_theme.palette.forgerock.orange];var ENTITLEMENT_CHART_CATEGORIES=['certify','revoke','abstain'];var POLICY_CHART_CATEGORIES=['remediated','exceptions','cancelled','expired'];var DO_NOT_UPDATE=true;var IS_DESC=true;var constants={IDM_URL:IDM_URL,IDM_CONTEXT:IDM_CONTEXT,PROGRESS_STATUS:PROGRESS_STATUS,APPROVAL_STATUS:APPROVAL_STATUS,CERT_STATUS:CERT_STATUS,CERT_STATUSES:CERT_STATUSES,DASHBOARD_STATUSES:DASHBOARD_STATUSES,CERT_TYPE:CERT_TYPE,CERT_TYPES:CERT_TYPES,VIEW_TYPE:VIEW_TYPE,VIEW_TYPES:VIEW_TYPES,TASKS:TASKS,SETTINGS:SETTINGS,CHART_COLORS:CHART_COLORS,ENTITLEMENT_CHART_CATEGORIES:ENTITLEMENT_CHART_CATEGORIES,POLICY_CHART_CATEGORIES:POLICY_CHART_CATEGORIES,DO_NOT_UPDATE:DO_NOT_UPDATE,IS_DESC:IS_DESC};/* harmony default export */ var utils_constants = (constants);
// EXTERNAL MODULE: /hcmapps/workspace/IDG_Build/tmp/commons/shared/src/utils/clientUtils.js
var clientUtils = __webpack_require__(64);

// CONCATENATED MODULE: ./src/store/actions/actionTypes.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var AUTH=Object(clientUtils["prefix"])('AUTH',['FETCH_AUTH_MODULE','FETCH_AUTH_MODULE_SUCCESS','FETCH_AUTH_MODULE_FAILURE','AUTHENTICATE_USER','AUTHENTICATION_SUCCESS','AUTHENTICATION_FAILURE','LOGOUT_SUCCESS','LOGOUT_FAILURE']);var GENERIC=Object(clientUtils["prefix"])('GENERIC',['CHANGE_CONFIG','HTTP_FAILURE','GET_CONFIG','CHANGE_ACTIVE_GOVERNANCE_DIALOG','CHANGE_IS_DRAWER_OPEN','CHANGE_IS_CREATE_MODAL_OPEN','CHANGE_IS_DIALOG_OPEN','CHANGE_CREATE_MODAL_TYPE','CHANGE_DIALOG_MESSAGE','CHANGE_DIALOG_TYPE','CHANGE_MODAL_OBJECT','ENQUEUE_SNACKBAR','CLOSE_SNACKBAR','REMOVE_SNACKBAR','QUERY_MODAL_OBJECT','QUERY_MODAL_OBJECT_SUCCESS','QUERY_MODAL_OBJECT_FAILURE','UPDATE_TAKING_ACTION']);var ADMIN_DASHBOARD=Object(clientUtils["prefix"])('ADMIN_DASHBOARD',['QUERY_DASHBOARD','QUERY_DASHBOARD_SUCCESS','QUERY_DASHBOARD_FAILURE','QUERY_DASHBOARD_SINGLE','QUERY_DASHBOARD_SINGLE_SUCCESS','QUERY_DASHBOARD_SINGLE_FAILURE','QUERY_ENTITLEMENT','QUERY_ENTITLEMENT_SUCCESS','QUERY_ENTITLEMENT_FAILURE','QUERY_POLICY','QUERY_POLICY_SUCCESS','QUERY_POLICY_FAILURE']);var CERTS=Object(clientUtils["prefix"])('CERTS',['CHANGE_CERT_TYPE','CHANGE_CERT_STATUS','CHANGE_SEARCH_KEY','UPDATE_PAGINATION','CHANGE_SORTING','QUERY_CERTS','QUERY_CERTS_SUCCESS','QUERY_CERTS_FAILURE']);var CERTLIST=Object(clientUtils["prefix"])('CERTLIST',['CHANGE_SELECTED_STAGE','UPDATE_PAGINATION','UPDATE_STATUS','UPDATE_CERTID','UPDATE_ACTINGID','CHANGE_IS_ADMIN','CHANGE_SORTING','CHANGE_SEARCH_KEY','CHANGE_CERT_TYPE','CHANGE_SELECTED_ACTION','CHANGE_ROW_DATA','QUERY_CERT_LIST','QUERY_CERT_LIST_SUCCESS','QUERY_CERT_LIST_FAILURE','SET_SELECTED_EVENT_INDEX','QUERY_EVENT_DETAILS','QUERY_EVENT_DETAILS_REMOVE','QUERY_EVENT_DETAILS_SUCCESS','QUERY_EVENT_DETAILS_FAILURE','QUERY_METADATA_OBJECT','QUERY_METADATA_OBJECT_SUCCESS','QUERY_METADATA_OBJECT_FAILURE']);var POLICIES=Object(clientUtils["prefix"])('POLICIES',['CHANGE_POLICY_TYPE','CHANGE_SEARCH_KEY','QUERY_POLICIES','QUERY_POLICIES_SUCCESS','QUERY_POLICIES_FAILURE','CHANGE_SORTING','UPDATE_PAGINATION','CHANGE_ACTIVE_SCANS_STATUS','QUERY_ACTIVE_SCANS','GET_REACTIVE_SCAN_CONFIG']);var SUMMARY=Object(clientUtils["prefix"])('SUMMARY',['CHANGE_SUMMARY_TYPE','CHANGE_SYSTEM','QUERY_SUMMARY','QUERY_SUMMARY_SUCCESS','QUERY_SUMMARY_FAILURE','QUERY_ENTITLEMENT','QUERY_ENTITLEMENT_SUCCESS','QUERY_ENTITLEMENT_FAILURE','CHANGE_SORTING','CHANGE_SEARCH_KEY','UPDATE_PAGINATION','UPDATE_USER','UPDATE_SYSTEMS']);var ASYNC_FIELDS=Object(clientUtils["prefix"])('ASYNC_FIELDS',['QUERY_WORKFLOWS','QUERY_WORKFLOWS_SUCCESS','QUERY_USERS','QUERY_USERS_SUCCESS','QUERY_ROLES','QUERY_ROLES_SUCCESS','QUERY_TYPEAHEAD','QUERY_TYPEAHEAD_SUCCESS','QUERY_SCAN_POLICIES','QUERY_SCAN_POLICIES_SUCCESS']);var CONFIG=Object(clientUtils["prefix"])('CONFIG',['GET_IDM_VERSION','GET_CONFIG_MANAGED_OBJECTS','GET_CONFIG_APPLICATIONS','GET_CERTIFIABLE_ATTRIBUTES','GET_MEMBERSHIP_PROPERTIES']);var DASHBOARD=Object(clientUtils["prefix"])('DASHBOARD',['QUERY_DASHBOARD','QUERY_DASHBOARD_SUCCESS','QUERY_DASHBOARD_FAILURE','UPDATE_STATUS','UPDATE_TYPE','CHANGE_SEARCH_KEY','CHANGE_SORTING','UPDATE_PAGINATION','ACT_ON_VIOLATION','COMMENT_VIOLATION']);var actionTypes_SETTINGS=Object(clientUtils["prefix"])('SETTINGS',['QUERY_SETTINGS','QUERY_SUCCESS','QUERY_FAILURE','QUERY_INFO','QUERY_INFO_SUCCESS','QUERY_INFO_FAILURE']);var NOTIFICATIONS=Object(clientUtils["prefix"])('NOTIFICATIONS',['QUERY_ALL','QUERY_ALL_SUCCESS','QUERY_ALL_FAILURE','QUERY_SELECTED','SET_SELECTED','QUERY_SELECTED_SUCCESS','QUERY_SELECTED_FAILURE']);// SHOULD_SAVE: an array of whitelisted action types
// that trigger calls to redux-storage's engine.save
var SHOULD_SAVE=lodash_default.a.concat(Object.values(AUTH),GENERIC.CHANGE_IS_DRAWER_OPEN,GENERIC.CHANGE_IS_CREATE_MODAL_OPEN,GENERIC.REMOVE_SNACKBAR,GENERIC.CLOSE_SNACKBAR,CONFIG.GET_CONFIG_MANAGED_OBJECTS,CONFIG.GET_MEMBERSHIP_PROPERTIES,GENERIC.CHANGE_ACTIVE_GOVERNANCE_DIALOG,CERTS.UPDATE_PAGINATION,CERTLIST.UPDATE_CERTID,CERTLIST.CHANGE_CERT_TYPE);// SHOULD_NOT_SAVE: an array of blacklisted action
// types that don't trigger engine.save
var SHOULD_NOT_SAVE=lodash_default.a.concat(lodash_default.a.difference(GENERIC,SHOULD_SAVE,CERTS,POLICIES,ASYNC_FIELDS));
// CONCATENATED MODULE: ./src/utils/httpService.js
/* eslint-disable no-restricted-globals */ /*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var axiosOptions={responseType:'json',withCredentials:true,headers:{'Accept':'application/json, text/javascript, */*; q=0.01','Cache-Control':'no-cache','X-Requested-With':'OpenIDM Plugin'}};if(true){axiosOptions.baseURL=utils_constants.IDM_URL;}var instance=axios_default.a.create(axiosOptions);instance.setupInterceptors=function(store,history){instance.interceptors.request.use(function(config){var token=window.sessionStorage.getItem('amToken')||window.localStorage.getItem('dataStoreToken');if(token){if(config.headers['X-OpenIDM-Username']==='anonymous'&&config.headers['X-OpenIDM-Password']==='anonymous'){delete config.headers['X-OpenIDM-Username'];delete config.headers['X-OpenIDM-Password'];}config.headers['X-OpenIDM-NoSession']='false';config.headers['X-OpenIDM-DataStoreToken']=token;config.headers['X-OpenIDM-OAuth-Login']='true';config.headers['X-Requested-With']='OpenIDM Plugin';}return config;});instance.interceptors.response.use(function(response){return response;},function(error){if(error.response&&error.response.status===500){instance.removeDataStoreToken();if(error.response.config.url.indexOf('info/uiconfig')>0&&error.response.config.headers['X-OpenIDM-DataStoreToken']){return instance.get(error.config.url,{headers:{'X-OpenIDM-Username':'anonymous','X-OpenIDM-Password':'anonymous','X-OpenIDM-NoSession':'true'}});}}else if(error.response.status===401&&error.response.config.url.indexOf("".concat(utils_constants.IDM_CONTEXT,"/authentication"))>0){instance.removeDataStoreToken();}else if(error.response.status===401&&error.response.data){store.dispatch({type:AUTH.AUTHENTICATION_FAILURE,payload:error.response.data});}return Promise.reject(error);});};instance.addDataStoreToken=function(token){window.localStorage.setItem('dataStoreToken',token);};instance.removeDataStoreToken=function(){window.sessionStorage.removeItem('amToken');window.localStorage.removeItem('dataStoreToken');};instance.getUiConfig=function(store,tokensAvailableCallback){instance.get(utils_constants.IDM_CONTEXT.concat('/info/uiconfig'),{headers:{'x-appauthhelper-anonymous':'true'}}).then(function(_ref){var data=_ref.data;var configuration=data.configuration;var platformSettings=configuration.platformSettings;if(platformSettings&&platformSettings.amUrl){store.dispatch({type:AUTH.FETCH_AUTH_MODULE_SUCCESS,payload:'AM'});var _window=window,AppAuthHelper=_window.AppAuthHelper;var amUrl=platformSettings.amUrl;var calculatedAMUriLink=document.createElement('a');calculatedAMUriLink.href=amUrl;var authorizationEndpoint=amUrl+'/oauth2/authorize';AppAuthHelper.init({clientId:'access-review-ui',authorizationEndpoint:authorizationEndpoint,tokenEndpoint:amUrl+'/oauth2/access_token',revocationEndpoint:amUrl+'/oauth2/token/revoke',endSessionEndpoint:amUrl+'/oauth2/connect/endSession',resourceServers:Object(defineProperty["a" /* default */])({},location.origin+'/openidm',platformSettings.adminOauthClientScopes),tokensAvailableHandler:function tokensAvailableHandler(claims){instance.post(utils_constants.IDM_CONTEXT.concat('/authentication?_action=login')).then(function(_ref2){var data=_ref2.data;var authenticationId=data.authenticationId,authorization=data.authorization;var roles=authorization.roles.map(function(role){return role.length?role.split('/').pop():'';});store.dispatch({type:AUTH.AUTHENTICATION_SUCCESS,payload:{authenticationId:authenticationId,authorization:authorization,roles:roles}});tokensAvailableCallback();});}}).then(function(res){// In this application, we want tokens immediately, before any user interaction is attempted
AppAuthHelper.getTokens();});}else{tokensAvailableCallback();}}).catch(function(){return tokensAvailableCallback();});};/* harmony default export */ var httpService = (instance);
// EXTERNAL MODULE: ./node_modules/i18next/dist/es/index.js + 12 modules
var dist_es = __webpack_require__(227);

// EXTERNAL MODULE: ./node_modules/react-i18next/dist/es/index.js + 9 modules
var react_i18next_dist_es = __webpack_require__(13);

// EXTERNAL MODULE: ./node_modules/i18next-browser-languagedetector/index.js
var i18next_browser_languagedetector = __webpack_require__(267);
var i18next_browser_languagedetector_default = /*#__PURE__*/__webpack_require__.n(i18next_browser_languagedetector);

// EXTERNAL MODULE: ./node_modules/moment/moment.js
var moment = __webpack_require__(30);
var moment_default = /*#__PURE__*/__webpack_require__.n(moment);

// EXTERNAL MODULE: /hcmapps/workspace/IDG_Build/tmp/commons/shared/src/utils/jsUtils.js
var jsUtils = __webpack_require__(141);
var jsUtils_default = /*#__PURE__*/__webpack_require__.n(jsUtils);

// CONCATENATED MODULE: /hcmapps/workspace/IDG_Build/tmp/commons/shared/src/locales/en/translation.js
/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
/* harmony default export */ var translation = ({
  // usage examples
  'welcome': 'welcome, the date is {{date, MM/DD/YYYY}}',
  'key2': 'uppercase text: {{text, uppercase}} :done.',
  'introduction': 'I am {{person.name}} and I am {{person.age}} year old.',
  'nest': 'nest $t(welcome) end',
  // dialog messages
  'confirm-deletion': 'Are you sure you want to delete?',
  'confirm-glossary-object-deletion': 'Are you sure you want to delete this glossary object?',
  // other messages
  'changes-not-saved': 'You have unsaved changes.',
  'changes-saved': 'Changes saved.',
  'refresh results': 'Refresh',
  // buttons
  'yes': 'Yes',
  'no': 'No',
  'okay': 'Okay',
  'new': 'New',
  'reload': 'Reload',
  'edit': 'Edit',
  'save': 'Save',
  'delete': 'Delete',
  'cancel': 'Cancel',
  // types
  'string': 'string',
  'boolean': 'boolean',
  'integer': 'integer',
  'id': 'id',
  'managed object id': 'managed object',
  'object': 'object',
  'array': 'array',
  'date string': 'date',
  // glossary specific things
  'glossary object class': 'glossary object class',
  'glossary object class search description': 'The type of glossary object you want to search for or create.',
  'glossary editor': 'glossary editor',
  'glossary.description.class': 'The type of glossary object.',
  'new glossary object': 'New glossary object',
  'edit glossary object': 'Edit {{displayName}}',
  'glossary object results': 'glossary search results',
  'glossary-class-info.object': 'A managed object in IDM, specified by objectId, e.g. a managed role or assignment.',
  'glossary-class-info.identity': 'A managed user property in IDM, e.g. \'jobCode\'.',
  'glossary-class-info.identity-value': 'A value corresponding to a glossary identity object, e.g. a \'jobCode\' value of B435T.',
  'glossary-class-info.system': 'A system connected to IDM (via a Connector), e.g. \'LDAP\'.',
  'glossary-class-info.system-attribute': 'An attribute within an object (such as account or group) in a system, e.g. \'cn\' or \'memberOf\'.',
  'glossary-class-info.system-value': 'A value corresponding to a glossary system attribute, e.g. an \'employeeType\' of \'contractor\'.',
  // accessibility strings
  'confirm-delete-glossary-object-dialog-aria-labelledby': 'confirm-delete-dialog',
  'confirm-delete-glossary-object-dialog-aria-describedby': 'confirm glossary object deletion dialog',
  'glossary-new-key': 'New key',
  'glossary-new-key-aria-label': 'Add new key to glossary object'
});
// CONCATENATED MODULE: ./src/locales/en/translation.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var en_translation = (jsUtils_default.a.extendedStrict(translation,{'governance':'Governance','sign-in':'Sign In','label-username':'Username','label-password':'Password','label-name':'Name','label-value':'Value','label-stage':'Stage',// page labels (on the nav side bar), and section titles
'page-my-tasks':'My Tasks','page-certifications':'Certifications','page-admin':'Administration','page-policies':'Policies','page-admin-dashboard':'Dashboard','page-user-certs':'User Certifications','page-object-certs':'Object Certifications','page-assignment-certs':'Assignment Certifications','page-user-summary':'User Summary','page-system-settings':'System Settings','page-internal-user':'Access Denied','page-notification-templates':'Notifications','page-glossary':'Glossary','page-violations':'Violations','page-glossary-editor':'Glossary Editor','admin-dashboard':'Administrator Dashboard','policies':'policies','policy':'policy','policy-scans':'policy scans','policy-scan':'policy scan','user-cert':'user certification','object-cert':'object certification','policy-scan-scheduled':'Scheduled Scans','policy-scan-active':'Active Scans','violations-active':'active violations','exceptions-active':'active exceptions','violations-history':'violations history','certification-summary':'Certification Summary','user-tasks':'User Certification Tasks','object-tasks':'Object Certification Tasks','violation-tasks':'Violation Tasks','user-entitlements':'User Entitlements','internal-user':'Internal User access is not supported. Please log in as a different user to continue.',// actions
'search-filter':'Search filter','filter':'filter','filter-table':'Filter table..','go-to-campaign':'Go to Campaign','certify':'Certify','revoke':'Revoke','signoff':'Sign Off','action-successful':'Action successful.',// buttons
'btn-login':'Sign In','btn-logout':'Logout','btn-cancel':'Cancel','btn-ok':'Ok','btn-create':'Create','btn-save':'Save','btn-new-user-cert':'New Certification','btn-new-object-cert':'New Certification','btn-new-policy':'New Policy','btn-new-policy-scan':'New Scan','btn-configure-reactive':'Configure Reactive Scans','btn-cancel-cert':'Cancel certification','btn-cancel-violation':'Cancel Violation','btn-cancel-exception':'Cancel Exception','btn-delete-selected':'Delete Selected','btn-delete-scan':'Delete Scan','btn-delete-policy':'Delete Policy','btn-open-expression-builder':'Open Expression Builder','btn-stage-actions':'Stage Actions','btn-reassign-tasks':'Reassign Selected','btn-reassign-all':'Reassign All Tasks','btn-submit':'Submit','btn-add-comment':'Add Comment','btn-hide-comment':'Hide Comment','btn-grant-exception':'Grant Exception','btn-hide-exception':'Hide Exception','btn-remediate':'Remediate','btn-submit-comments':'Submit Comment','btn-submit-comment':'Submit Comment','btn-submit-approve':'Submit Exception','btn-certify-all':'Certify Remaining','btn-certify-selected':'Certify Selected','btn-reset-all':'Reset All','btn-reset-selected':'Reset Selected','btn-claim-all':'Claim All','btn-claim-selected':'Claim Selected','btn-sign-off':'Sign Off','exception-expiration-date':'Exception Expiration Date',// modal titles
'create-modal':'Create $t( btn-new-{{type}} )','edit-modal':'Edit $t( {{type}} )','create-policy-success':'Policy created successfully','update-policy-success':'Policy updated successfully','update-reactive-success':'Reactive scan configuration updated successfully','create-policy-scan-success':'Policy scan created successfully','update-policy-scan-success':'Policy scan updated successfully','create-cert-success':'Certification created successfully','update-cert-success':'Certification updated successfully','expression-builder':'Expression Builder','reassign-tasks':'Reassign Selected Items','reassign-all':'Reassign All',// table headers:
'header-name':'Name','header-stage':'Stage','header-policy':'Policy','header-deadline':'Deadline','header-entitlement':'Entitlement','header-percentage':'Percentage','header-total-violations':'Total Violations','header-user-attribute':'User Attribute','header-value':'Value','header-decision':'Decision','header-date':'Date','header-certifier':'Certifier','header-claimed-by':'Claimed By','header-campaign':'Campaign Name','header-comment':'Comment','header-commenter':'Commenter',// labels
'choose-user':'Choose user','choose-role':'Choose role','choose-certificationTotals':'Choose entitlement','choose-policyTotals':'Choose policy',// statuses
'active':'active','inactive':'inactive','completed':'completed','scheduled':'scheduled','triggered':'triggered','cancelled':'Cancelled','in-progress':'In-Progress','selected':'selected','creating':'Creating',// Expression builder text
'expr-builder-all-caps':'Every {{type}}','expr-builder-all':'every {{type}}','expr-builder-saved':'Expression saved','expr-builder-unsaved':'No expression saved','expr-builder-and':'all of','expr-builder-or':'any of','expr-builder-not':'none of','expr-builder-compare':'the {{type}} property','expr-builder-attr':'the {{type}} attribute','expr-builder-linkedto':'the user has application','expr-builder-equals':'equals','expr-builder-changed':'changed','expr-builder-contains':'contains','expr-builder-contained':'contained','expr-builder-is':'is','expr-builder-was':'was','expr-builder-startsWith':'starts with','expr-builder-doesNotContain':'does not contain','expr-builder-doesNotEqual':'does not equal','expr-builder-invalid':'Invalid expression','expr-builder-filter-btn-basic':'basic','expr-builder-filter-btn-advanced':'advanced','expr-builder-target-count':'Selected {{type}} count: {{count}}','expr-builder-filter-reset':'reset filter','expr-builder-collapse-advanced':'collapse advanced filter','expr-builder-filter-user':'User','expr-builder-filter-application':'Users with application','expr-builder-filter-manager':'Users with manager','expr-builder-filter-authzrole':'Users with authorization role','expr-builder-filter-role':'Users with provisioning role','expr-builder-filter-all':'All users','expr-builder-filter-object':'Single {{type}}','expr-builder-bool-or':'or','expr-builder-bool-and':'and','expr-builder-confirmation-msg':'By closing the "Advanced" filter, you will lose the information you entered there. Do you wish to continue?',//Entitlement filter text
'entitlement-filter-selected-count':'{{count}} {{entitlement}} selected',// Schedule builder text
'schedule-builder-invalid':'You must select at least one day','schedule-builder-daily':'Daily','schedule-builder-weekly':'Weekly','schedule-builder-monthly':'Monthly','schedule-builder-repeat':'Repeat','schedule-builder-repeat-every':'Every','schedule-builder-repeat-on':'On','schedule-builder-daily-rate':'days starting on the','schedule-builder-start-day':'of every month','schedule-builder-monthly-rate':'months starting in','schedule-builder-last-month-day':'Last day of the month',// Duration select text
'duration-select-amount':'Select an amount','duration-select-period':'Select a time period','duration-select-days':'days','duration-select-weeks':'weeks','duration-select-after-campaign':'after campaign begins','duration-select-before-stage-deadline':'before stage deadline','duration-select-after-violation':'after violation occurs','duration-select-escalation-expiration':'before expiration','duration-select-escalation-deadline':'before deadline','datepicker-invalid-expiration-unit':'Must be a valid amount','datepicker-invalid-expiration-period':'Must be a valid period of time','datepicker-invalid-subsequent-escalation':'Escalation must occur after preceding escalations',// Date picker text
'datepicker-min-expiration-date':'Expiration date must be later than today','datepicker-max-escalation-date':'Escalation date must come before expiration date',// Stage builder text
'stage-builder-new-stage-name':'Stage {{num}}','stage-builder-move-up':'move stage up','stage-builder-move-down':'move stage down','stage-builder-delete-stage':'delete stage','stage-builder-useRiskLevel':'Use Risk Level','stage-builder-risk-low':'Low','stage-builder-risk-medium':'Medium','stage-builder-risk-high':'High','stage-builder-certifierType':'Certifier','stage-builder-certifierName':'Choose certifier','stage-builder-certifierType-user':'User','stage-builder-certifierType-authzGroup':'Group','stage-builder-certifierType-manager':'User Manager','stage-builder-certifierType-prevManager':'Previous Certifier\'s Manager','stage-builder-certifierType-entitlementOwner':'Entitlement Owner','stage-builder-certifierType-glossaryKey':'Get certifier from glossary key','stage-builder-certifierKey':'Glossary key','stage-builder-deadline':'Deadline','stage-builder-btn-add':'Add stage','stage-builder-btn-blank':'Blank stage','stage-builder-btn-copy':'Copy {{stage}}','stage-builder-risk-level-error':'At least one option must be selected when using risk level',// Escalation schedule text
'escalation-ownerType':'Escalation owner type','escalation-owner':'Choose escalation owner','escalation-owner-certifierManager':'Certifier Manager','escalation-owner-policyOwnerManager':'Policy owner manager',// Form errors
'policies-transfer-list-invalid':'You must select at least one policy','form-error-required':'This field is required','form-error-risk-level-min':'Risk level cannot be less than 0','form-error-risk-level-max':'Risk level cannot be greater than 10',// Date formatting
'formatDate':'{{date, L}}','getMonthNameFromInt':'{{date, getMonthName}}',// Dashboard statistics
'activeUserCampaigns':'Active User Campaigns','activeUserEvents':'Active User Events','activeObjectCampaigns':'Active Object Campaigns','activePolicies':'Active Policies','activeViolations':'Active Violations','glossaryEntries':'Glossary Entries','upcomingUserCertificationDeadlines':'Upcoming User Certification Deadlines','upcomingObjectCertificationDeadlines':'Upcoming Object Certification Deadlines','upcomingViolationDeadlines':'Upcoming Violation Deadlines','mostCertifiedEntitlements':'Most Certified Entitlements','mostRevokedEntitlements':'Most Revoked Entitlements','highestViolationCount':'Highest Violation Count','certificationResults':'Certification Results','violationResults':'Violation Results','no-data':'No data to display','last-updated':'Last updated','displaying':'Displaying',// confirmation messages
'confirm-action':'Confirm action','confirm-cancel-cert':'Are you sure you want to cancel the selected certification(s)?','confirm-cancel-exception':'Are you sure you want to cancel the selected exception(s)?','confirm-cancel-violation':'Are you sure you want to cancel the selected violation(s)?','confirm-delete-scan':'Are you sure you want to delete the selected scan(s)?','confirm-delete-policy':'Are you sure you want to delete the selected policy(s)?','confirm-reset-all':'Are you sure you want to reset ALL of the campaign events?','confirm-reset-selected':'Are you sure you want to reset ALL of the selected events?','confirm-sign-off':'All sign-off actions are final. Are you sure you want to proceed?',// labels for accessibility
'user':'User Certifications','object cert':'Object Certifications','violation':'Violations',//general email labels
'_id':'ID','displayName':'Name','submit':'Submit','add':'Add','reset':'Reset','remove':'Remove',//Settings 
'about':'About','version':'Version','commit':'Commit(Short)','notificationName':'Notification Name','update-notification-success':'Notification Updated Successfully','updateSettingsSuccess':'Settings Updated Successfully',//Setting's Section Labels
'General':'General','Delegation':'Delegation','riskLevel':'Risk Level Managment','Custom attribute mapping':'Custom Attribute Mapping','Menu Managment':'Menu Managment',//Settings Field Labels
'allowBulkCertify':'Allow Bulk Certify','delegationEnabled':'Allow User Delegation','userDelegate':'User Delegation Property','useRiskLevel':'Configure Risk Level','menuManagement':'Custom Navigation Links','userDisplayFormat':'User Display Format',//Notification
'notification_edit':'Edit','notification':'Notification',//Email Labels
'name':'Name','from':'From','subject':'Subject','type':'Type','body':'Body','cc':'cc','enabled':'Enabled','to':'To',//Modal text
'no-glossary-entry':'No existing glossary entry for this entitlement.','no-selected-attributes':'No entitlements found for this filter.','key':'Key','value':'Value','stage':'Stage','deadline':'Deadline','date':'Date','comment':'Comment','add-new-comment':'Add new comment','reason':'Reason','by':'By','user-manager':'User Manager','target-user':'Target User','violation-detected':'Violation Detected','expiration-date':'Expiration Date','exception-start-date':'Exception Start Date','exception-end-date':'Exception End Date','completion-date':'Completion Date','completed-by':'Completed By','policy-name':'Policy Name','policy-description':'Policy Description','policy-owner':'Policy Owner','violation-details':'Violation Details','campaign-details':'Campaign Details','policy-details':'Policy Details','entitlement-details':'Entitlement Details','start-date':'Start Date','description':'Description','certifiers':'Certifiers','open-certifiers':'Active Certifiers','of':'of','progress':'progress','choose-certifier':'Choose Certifier','choose-certifier-message':'You have campaign tasks for multiple roles, please choose the id to act as:',//Cert List
'campaign-status':'Campaign Status','stage-start-date':'Start Date','stage-deadline':'Deadline','stage-name':'Stage Name','multiple':'Multiple Options','unclaimed':'Not Claimed','campaign-information':'Campaign Information','stages-information':'Stages Information','tooltip-certify-signed-off':'Certified, Signed-off','tooltip-abstain-signed-off':'Abstained, Signed-off','tooltip-revoke-signed-off':'Revoked, Signed-off','tooltip-certify':'Certified','tooltip-revoke':'Revoked','tooltip-abstain':'Abstained','tooltip-cancelled':'Cancelled','tooltip-pending':'Pending','tooltip-no-certifier':'No-Certifier','tooltip-expire':'Expired','tooltip-incomplete':'Incomplete',//Event details
'details-managedObject':'User Attributes','details-identity':'User Information','details-managedObject-object':'Object Attributes','details-identity-object':'Object Information','details-application':'Applications','details-metadata-object':'Glossary Metadata','details-actions':'Certification Information','user-information':'User Information','claimed-by':'Claimed By','event-actions':'Event Actions','stage-actions':'Stage Actions','stage-selector':'Select Stage','stage-progress':'Progress','stage-certifier':'Certifier','stage-active-certifiers':'Active Certifiers',//Policies
'exception-expired':'Exception Expired','expired':'Expired','remediated':'Remediated',//User summary
'view-current':'View Current Entitlements Only','view-all':'All entitlements','summary-in-progress':'In-progress','summary-certify':'Certified','summary-revoke':'Revoked','summary-abstain':'Abstained','summary-not-certified':'Not Certified','summary-comment':'Comment','select-system':'Select system',//Action Submitting
'actionInProgress':'Action in Progress.  Please wait',//Errors
'no-events-generated':'Campaign was auto-cancelled because no events were generated with certifiable entitlements.','no-certifier-for-any-events':'Campaign was auto signed-off because all events had no certifier or no items to be acted on.','script-error':'An exception occurred during creation.  Please see the error key on the repository object for details.'}));
// CONCATENATED MODULE: ./src/i18n.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */// the translations
var resources={en:{translation:en_translation}};dist_es["a" /* default */]// auto-detect locale base on http request
.use(i18next_browser_languagedetector_default.a)// passes i18n down to react-i18next
.use(react_i18next_dist_es["a" /* initReactI18next */])// keep moment locale in-sync w/ i18next locale
.on('languageChanged',function(lng){return moment_default.a.locale(lng);}).init({// see https://www.i18next.com/overview/configuration-options
resources:resources,fallbackLng:'en',// we do not use keys in form messages.welcome
keySeparator:false,interpolation:{// react already escapes things
escapeValue:false,format:function format(value,_format,lng){if(_format==='uppercase'){return value.toUpperCase();}else if(_format==='lowercase'){return value.toLowerCase();}else if(_format==='getMonthName'){return moment_default()({month:value}).format('MMMM');}else if(value instanceof Date){return moment_default()(value).format(_format);}else{return value;}}},preload:['en'],debug:false,// language detection options for i18next-browser-languagedetector
detection:{// order and from where user language should be detected
order:['querystring','cookie','localStorage','navigator','htmlTag','path','subdomain'],// keys or params to lookup language from
lookupQuerystring:'lng',lookupCookie:'i18next',lookupLocalStorage:'i18nextLng',lookupFromPathIndex:0,lookupFromSubdomainIndex:0,// cache user language on
caches:['localStorage','cookie'],// languages to not persist (cookie, localStorage)
excludeCacheFor:['cimode'],// optional expire and domain for set cookie
cookieMinutes:10,cookieDomain:'myDomain',// optional htmlTag with lang attribute, the default is:
htmlTag:document.documentElement}});/* harmony default export */ var i18n = (dist_es["a" /* default */]);
// EXTERNAL MODULE: ./node_modules/babel-preset-react-app/node_modules/@babel/runtime/helpers/esm/classCallCheck.js
var classCallCheck = __webpack_require__(19);

// EXTERNAL MODULE: ./node_modules/babel-preset-react-app/node_modules/@babel/runtime/helpers/esm/createClass.js
var createClass = __webpack_require__(20);

// EXTERNAL MODULE: ./node_modules/babel-preset-react-app/node_modules/@babel/runtime/helpers/esm/possibleConstructorReturn.js + 1 modules
var possibleConstructorReturn = __webpack_require__(22);

// EXTERNAL MODULE: ./node_modules/babel-preset-react-app/node_modules/@babel/runtime/helpers/esm/getPrototypeOf.js
var getPrototypeOf = __webpack_require__(21);

// EXTERNAL MODULE: ./node_modules/babel-preset-react-app/node_modules/@babel/runtime/helpers/esm/inherits.js + 1 modules
var inherits = __webpack_require__(23);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Grid/Grid.js
var Grid = __webpack_require__(503);

// EXTERNAL MODULE: ./node_modules/clsx/dist/clsx.m.js
var clsx_m = __webpack_require__(4);

// EXTERNAL MODULE: ./node_modules/babel-preset-react-app/node_modules/@babel/runtime/helpers/esm/toConsumableArray.js + 3 modules
var toConsumableArray = __webpack_require__(84);

// EXTERNAL MODULE: ./node_modules/babel-preset-react-app/node_modules/@babel/runtime/helpers/esm/assertThisInitialized.js
var assertThisInitialized = __webpack_require__(3);

// EXTERNAL MODULE: ./node_modules/redux/es/redux.js
var redux = __webpack_require__(12);

// EXTERNAL MODULE: ./node_modules/check-types/src/check-types.js
var check_types = __webpack_require__(219);
var check_types_default = /*#__PURE__*/__webpack_require__.n(check_types);

// CONCATENATED MODULE: ./src/store/actions/generic.actions.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */// You should probably be using 'alert' action below instead.  Feel free to export this if you need the customization.
var generic_actions_enqueueSnackbar=function enqueueSnackbar(notification){var key=notification.options&&notification.options.key;return{type:GENERIC.ENQUEUE_SNACKBAR,notification:Object(objectSpread["a" /* default */])({},notification,{key:key||new Date().getTime()+Math.random()})};};var generic_actions_closeSnackbar=function closeSnackbar(key){return{type:GENERIC.CLOSE_SNACKBAR,dismissAll:!key,// dismiss all if no key has been defined
key:key};};var generic_actions_removeSnackbar=function removeSnackbar(key){return{type:GENERIC.REMOVE_SNACKBAR,key:key};};/*
Expose an 'alert' function for alerting things like success and failure to the user with a message.

This points to whichever alert/toast library we choose.
*/var generic_actions_alert=function alert(message,level){return function(dispatch,getState){if(!check_types_default.a.string(message)){jsUtils_default.a.requestError('Inputted argument `message` must be a string.');}var level_to_options=clientConfig_default.a.alert.levelToOptions;if(!level_to_options.hasOwnProperty(level)){jsUtils_default.a.requestError('Inputted argument `level` is not a key in levelToOptions.');}var options=level_to_options[level];var notifications=getState().generic.notifications;if(lodash_default.a.some(notifications,function(notification){return notification.message===message;})){return;}dispatch(generic_actions_enqueueSnackbar({message:message,options:options}));};};var generic_actions_getPayload=function getPayload(obj){// the `response` could be a response from the server, or just a local JavaScript error object.  Nomatter what it is, we need to extract the error message, and a code if possible.
if(obj.hasOwnProperty('response')){// it's an error response object from the server
var data=obj.response.data;var is_data_populated=!check_types_default.a.null(data);var code=is_data_populated?data.code:obj.response.status;var message=is_data_populated?data.message:obj.response.statusText;return{code:code,message:message};}else if(!obj.hasOwnProperty('response')&&obj.hasOwnProperty('message')){// it's probably a local error
return{message:obj.message};}else if(!obj.hasOwnProperty('response')&&!obj.hasOwnProperty('message')){return{message:obj};}else{jsUtils_default.a.requestError('Could not extract error message from object.');}};var httpFailure=function httpFailure(actionType,response){var alert_level=arguments.length>2&&arguments[2]!==undefined?arguments[2]:false;return function(dispatch){var payload=generic_actions_getPayload(response);if(alert_level){dispatch(generic_actions_alert(payload.message,alert_level));}return{type:actionType,payload:payload};};};var generic_actions_changeConfigObjectLocally=function changeConfigObjectLocally(new_config_object){return{type:GENERIC.CHANGE_CONFIG,payload:new_config_object};};var generic_actions_setIsDrawerOpen=function setIsDrawerOpen(is_open){return{type:GENERIC.CHANGE_IS_DRAWER_OPEN,payload:is_open};};var generic_actions_setIsCreateModalOpen=function setIsCreateModalOpen(is_open){return{type:GENERIC.CHANGE_IS_CREATE_MODAL_OPEN,payload:is_open};};var generic_actions_setIsDialogOpen=function setIsDialogOpen(is_open){return{type:GENERIC.CHANGE_IS_DIALOG_OPEN,payload:is_open};};var generic_actions_changeActiveGovernanceDialog=function changeActiveGovernanceDialog(open_dialog){return{type:GENERIC.CHANGE_ACTIVE_GOVERNANCE_DIALOG,payload:open_dialog};};var generic_actions_changeCreateModalType=function changeCreateModalType(createModalType,createModalMode,createModalTarget){return{type:GENERIC.CHANGE_CREATE_MODAL_TYPE,payload:{createModalType:createModalType,createModalMode:createModalMode,createModalTarget:createModalTarget}};};var generic_actions_changeDialogMessage=function changeDialogMessage(message){return{type:GENERIC.CHANGE_DIALOG_MESSAGE,payload:message};};var generic_actions_changeDialogType=function changeDialogType(type){return{type:GENERIC.CHANGE_DIALOG_TYPE,payload:type};};var generic_actions_changeModalObject=function changeModalObject(obj){return{type:GENERIC.CHANGE_MODAL_OBJECT,payload:obj};};var generic_actions_getModalObject=function getModalObject(type,obj,isObject){return function(dispatch,getState){// Use to pass in the modal object if already retrieved, rather than query for it
if(isObject){dispatch({type:GENERIC.QUERY_MODAL_OBJECT_SUCCESS,payload:obj});return;}dispatch({type:GENERIC.QUERY_MODAL_OBJECT,payload:null});var certEndpoint=generic_actions_getEndpointForType(type,obj);var params={};if(type==='glossary'){params.targetId=obj;}return httpService.request({url:certEndpoint,method:'get',params:params}).then(function(_ref){var data=_ref.data;var payload=data;if(type==='glossary'){payload=data.result||{};}dispatch({type:GENERIC.QUERY_MODAL_OBJECT_SUCCESS,payload:payload});}).catch(function(error){dispatch({type:GENERIC.QUERY_MODAL_OBJECT_FAILURE,payload:null});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var generic_actions_updateTakingAction=function updateTakingAction(newValue){return function(dispatch){dispatch({type:GENERIC.UPDATE_TAKING_ACTION,payload:newValue});};};var generic_actions_getEndpointForType=function getEndpointForType(type,id){switch(type){case'userCertification':return utils_constants.IDM_CONTEXT+'/governance/adminCertification/user/'+id;case'objectCertification':return utils_constants.IDM_CONTEXT+'/governance/adminCertification/object/'+id;case'violation':return utils_constants.IDM_CONTEXT+'/governance/violation/'+id;case'glossary':return utils_constants.IDM_CONTEXT+'/commons/glossary/managed';case'configure-reactive':return utils_constants.IDM_CONTEXT+'/governance/policyScan/reactive';}};
// CONCATENATED MODULE: ./src/utils/Notifier.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */ /* eslint-disable react/prop-types */var Notifier_Notifier=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(Notifier,_Component);function Notifier(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,Notifier);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(Notifier)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"displayed",[]);Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"storeDisplayed",function(id){_this.displayed=[].concat(Object(toConsumableArray["a" /* default */])(_this.displayed),[id]);});return _this;}Object(createClass["a" /* default */])(Notifier,[{key:"shouldComponentUpdate",value:function shouldComponentUpdate(_ref){var _this2=this;var _ref$notifications=_ref.notifications,newSnacks=_ref$notifications===void 0?[]:_ref$notifications;if(!newSnacks.length){this.displayed=[];return false;}var currentSnacks=this.props.notifications;var notExists=false;var _loop=function _loop(i){var newSnack=newSnacks[i];if(newSnack.dismissed){_this2.props.closeSnackbar(newSnack.key);_this2.props.removeSnackbar(newSnack.key);}if(notExists)return"continue";notExists=notExists||!currentSnacks.filter(function(_ref2){var key=_ref2.key;return newSnack.key===key;}).length;};for(var i=0;i<newSnacks.length;i+=1){var _ret=_loop(i);if(_ret==="continue")continue;}return notExists;}},{key:"componentDidUpdate",value:function componentDidUpdate(){var _this3=this;var _this$props$notificat=this.props.notifications,notifications=_this$props$notificat===void 0?[]:_this$props$notificat;notifications.forEach(function(_ref3){var key=_ref3.key,message=_ref3.message,_ref3$options=_ref3.options,options=_ref3$options===void 0?{}:_ref3$options;// Do nothing if snackbar is already displayed
if(_this3.displayed.includes(key))return;// Display snackbar using notistack
_this3.props.enqueueSnackbar(message,Object(objectSpread["a" /* default */])({},options,{onClose:function onClose(event,reason,key){if(options.onClose){options.onClose(event,reason,key);}// Dispatch action to remove snackbar from redux store
_this3.props.removeSnackbar(key);}}));// Keep track of snackbars that we've displayed
_this3.storeDisplayed(key);});}},{key:"render",value:function render(){return null;}}]);return Notifier;}(react["Component"]);var Notifier_mapStateToProps=function mapStateToProps(store){return{notifications:store.generic.notifications};};var Notifier_mapDispatchToProps=function mapDispatchToProps(dispatch){return Object(redux["b" /* bindActionCreators */])({removeSnackbar:generic_actions_removeSnackbar},dispatch);};/* harmony default export */ var utils_Notifier = (Object(notistack_esm["b" /* withSnackbar */])(Object(es["b" /* connect */])(Notifier_mapStateToProps,Notifier_mapDispatchToProps)(Notifier_Notifier)));
// CONCATENATED MODULE: ./src/store/actions/auth.actions.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var auth_actions_getAuthenticationModule=function getAuthenticationModule(){return function(dispatch,getState){return httpService.get(utils_constants.IDM_CONTEXT.concat('/info/uiconfig'),{headers:{'X-OpenIDM-Username':'anonymous','X-OpenIDM-Password':'anonymous','X-OpenIDM-NoSession':'true'}}).then(function(_ref){var data=_ref.data;var configuration=data.configuration;var oauthClientAuth=configuration.amDataEndpoints;if(oauthClientAuth){return dispatch(auth_actions_getOpenAmRedirect());}else{dispatch(auth_actions_setAuthenticationModule('MANAGED_USER'));}}).catch(function(error){dispatch(auth_actions_authenticationModuleFailure(error));});};};var auth_actions_getOpenAmRedirect=function getOpenAmRedirect(){return function(dispatch){var anonymousHeaders={'X-OpenIDM-Username':'anonymous','X-OpenIDM-Password':'anonymous','X-OpenIDM-NoSession':'true'};return httpService.get(utils_constants.IDM_CONTEXT.concat('/authentication'),{headers:anonymousHeaders}).then(function(_ref2){var data=_ref2.data;var provider=data.providers[0].provider;dispatch(auth_actions_setAuthenticationModule(provider));}).catch(function(error){dispatch(auth_actions_authenticationModuleFailure(error));});};};var auth_actions_setAuthenticationModule=function setAuthenticationModule(authModule){return{type:AUTH.FETCH_AUTH_MODULE_SUCCESS,payload:authModule};};var auth_actions_authenticationModuleFailure=function authenticationModuleFailure(error){return function(dispatch){return dispatch(httpFailure(AUTH.FETCH_AUTH_MODULE_FAILURE,error,'error'));};};var auth_actions_checkIfAuthenticated=function checkIfAuthenticated(){return function(dispatch,getState){var _getState$auth=getState().auth,authModule=_getState$auth.authModule,authorization=_getState$auth.authorization;return httpService.get(utils_constants.IDM_CONTEXT.concat('/info/login')).then(function(_ref3){var data=_ref3.data;if(data&&data.authenticationId==='anonymous'){httpService.removeDataStoreToken();return dispatch(auth_actions_logoutUser());}if(authModule==='AM'&&authorization&&authorization.id){return httpService.get(utils_constants.IDM_CONTEXT.concat('/managed/user/',authorization.id)).then(function(response){if(response.data&&response.data.userName){data.authenticationId=response.data.userName;}return dispatch(auth_actions_authenticationSuccess(data));});}return dispatch(auth_actions_authenticationSuccess(data));}).catch(function(){httpService.removeDataStoreToken();return dispatch(auth_actions_logoutUser());});};};var auth_actions_authenticateUser=function authenticateUser(userName,password){return function(dispatch){return httpService.request({url:utils_constants.IDM_CONTEXT.concat('/authentication'),method:'post',params:{'_action':'login'},headers:{'X-OpenIDM-NoSession':'false','X-OpenIDM-Password':password,'X-OpenIDM-Username':userName}}).then(function(_ref4){var data=_ref4.data;return dispatch(auth_actions_authenticationSuccess(data));}).catch(function(error){return dispatch(auth_actions_authenticationFailure(error));});};};var auth_actions_openAmLogin=function openAmLogin(token){return function(dispatch){return httpService.request({url:utils_constants.IDM_CONTEXT.concat('/authentication'),method:'post',params:{'_action':'login'},headers:{'X-OpenIDM-DataStoreToken':token,'X-OpenIDM-NoSession':'false'}}).then(function(_ref5){var data=_ref5.data;dispatch(auth_actions_authenticationSuccess(data));}).catch(function(error){dispatch(auth_actions_authenticationFailure(error));if(error.response.status===500){return dispatch(auth_actions_logoutUser());}});};};var auth_actions_authenticationSuccess=function authenticationSuccess(response){var authenticationId=response.authenticationId,authorization=response.authorization;var roles=authorization.roles.map(function(role){return role.length?role.split('/').pop():'';});return{type:AUTH.AUTHENTICATION_SUCCESS,payload:{authenticationId:authenticationId,authorization:authorization,roles:roles}};};var auth_actions_authenticationFailure=function authenticationFailure(error){return function(dispatch){return dispatch(httpFailure(AUTH.AUTHENTICATION_FAILURE,error,'error'));};};var auth_actions_logoutUser=function logoutUser(){return function(dispatch,getState){var auth=getState().auth;return httpService.post(utils_constants.IDM_CONTEXT.concat('/authentication?_action=logout'),{},{headers:{'Content-Type':'application/json','X-OpenIDM-NoSession':'true','X-OpenIDM-Password':'anonymous','X-OpenIDM-Username':'anonymous'}}).then(function(_ref6){var data=_ref6.data;httpService.removeDataStoreToken();if(auth.authorization&&auth.authorization.logoutUrl){window.location.href=auth.authorization.logoutUrl;}dispatch(auth_actions_logoutSuccess(data));if(auth.authModule==='AM'){var _window=window,AppAuthHelper=_window.AppAuthHelper;AppAuthHelper.logout().then(function(){window.location.href=window.location.origin+window.location.pathname;});}}).catch(function(error){dispatch(auth_actions_logoutFailure(error));});};};var auth_actions_logoutSuccess=function logoutSuccess(response){return{type:AUTH.LOGOUT_SUCCESS,payload:response};};var auth_actions_logoutFailure=function logoutFailure(error){return httpFailure(AUTH.AUTHENTICATION_FAILURE,error,'error');};
// EXTERNAL MODULE: ./node_modules/babel-preset-react-app/node_modules/@babel/runtime/helpers/esm/slicedToArray.js + 3 modules
var slicedToArray = __webpack_require__(17);

// CONCATENATED MODULE: ./src/store/actions/config.actions.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var config_actions_getIDMVersion=function getIDMVersion(){return function(dispatch){return httpService.request({url:utils_constants.IDM_CONTEXT+'/info/version',method:'get'}).then(function(_ref){var data=_ref.data;dispatch({type:CONFIG.GET_IDM_VERSION,payload:data.productVersion});return data;}).catch(function(error){return error;});};};var config_actions_getManagedObjectConfig=function getManagedObjectConfig(){return function(dispatch){return httpService.request({url:utils_constants.IDM_CONTEXT+'/governance/managedObjectConfig',method:'get'}).then(function(_ref2){var data=_ref2.data;var applications=data.applications,managedObjects=data.managedObjects;dispatch({type:CONFIG.GET_CONFIG_APPLICATIONS,payload:applications});dispatch({type:CONFIG.GET_CONFIG_MANAGED_OBJECTS,payload:managedObjects});}).catch(function(error){return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var config_actions_getMembershipProperties=function getMembershipProperties(){return function(dispatch){return httpService.request({url:utils_constants.IDM_CONTEXT+'/commons/config',method:'get'}).then(function(_ref3){var data=_ref3.data;var membershipProperties=data.result.membershipProperties;dispatch({type:CONFIG.GET_MEMBERSHIP_PROPERTIES,payload:membershipProperties});return data;}).catch(function(error){return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var config_actions_getSettings=function getSettings(){return function(dispatch){return httpService.request({url:utils_constants.IDM_CONTEXT+'/governance/systemSettings',method:'get'}).then(function(_ref4){var data=_ref4.data;dispatch({type:actionTypes_SETTINGS.QUERY_SUCCESS,payload:data.systemSettings});return data.systenSettings;}).catch(function(error){dispatch({type:actionTypes_SETTINGS.QUERY_FAILURE,payload:null});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var config_actions_updateSettings=function updateSettings(updatedSettings){return function(dispatch,getState){var successMessage=i18n.t('updateSettingsSuccess');return httpService.request({url:utils_constants.IDM_CONTEXT+'/governance/systemSettings',method:'post',data:updatedSettings}).then(function(_ref5){var data=_ref5.data;dispatch(generic_actions_alert(successMessage,'success'));dispatch({type:actionTypes_SETTINGS.QUERY_SUCCESS,payload:data.systemSettings});return config_actions_getSettings();}).catch(function(error){dispatch({type:actionTypes_SETTINGS.QUERY_FAILURE,payload:null});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var config_actions_getAboutInfo=function getAboutInfo(){return function(dispatch){return httpService.request({url:utils_constants.IDM_CONTEXT+'/config/accessReviewRepoInfo',method:'get'}).then(function(_ref6){var data=_ref6.data;dispatch({type:actionTypes_SETTINGS.QUERY_INFO_SUCCESS,payload:data});return data;}).catch(function(error){dispatch({type:actionTypes_SETTINGS.QUERY_INFO_FAILURE,payload:null});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var config_actions_getNotifications=function getNotifications(){return function(dispatch){return httpService.request({url:utils_constants.IDM_CONTEXT+'/governance/notification',method:'get',params:{'_queryFilter':'true'}}).then(function(_ref7){var data=_ref7.data;dispatch({type:NOTIFICATIONS.QUERY_ALL_SUCCESS,payload:data.result});return data;}).catch(function(error){dispatch({type:NOTIFICATIONS.QUERY_ALL_FAILURE,payload:null});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var config_actions_setSelectedNotification=function setSelectedNotification(id){return function(dispatch){dispatch({type:NOTIFICATIONS.SET_SELECTED,payload:id});};};var config_actions_getSelectedNotification=function getSelectedNotification(){return function(dispatch,getState){return httpService.request({url:utils_constants.IDM_CONTEXT+'/governance/notification/'+getState().config.notifications.selected.id,method:'get'}).then(function(_ref8){var data=_ref8.data;dispatch({type:NOTIFICATIONS.QUERY_SELECTED_SUCCESS,payload:data});return data;}).catch(function(error){dispatch({type:NOTIFICATIONS.QUERY_SELECTED_FAILURE,payload:null});var errorMessage='';error.response.status==404?errorMessage='Could Not Find Data for id':errorMessage=error;return dispatch(httpFailure(GENERIC.HTTP_FAILURE,errorMessage,'error'));});};};var config_actions_updateSelectedNotification=function updateSelectedNotification(updatedNotification){return function(dispatch,getState){var successMessage=i18n.t('update-notification-success');return httpService.request({url:utils_constants.IDM_CONTEXT+'/governance/notification/'+getState().config.notifications.selected.id,method:'put',data:updatedNotification}).then(function(_ref9){var data=_ref9.data;dispatch(generic_actions_alert(successMessage,'success'));return config_actions_getSelectedNotification();}).catch(function(error){});};};var config_actions_getGlossaryMetadata=function getGlossaryMetadata(type,systemName){var classType;if(type==='user'){classType='identity';}else if(type==='application'){classType='system';}else if(systemName){classType=type;}var queryFilter="class eq '".concat(classType,"' and certifiable eq true");if(systemName){queryFilter=queryFilter.concat(" and system eq '".concat(systemName,"'"));}return httpService.request({url:utils_constants.IDM_CONTEXT+'/commons/glossary',method:'get',params:{queryFilter:queryFilter}}).then(function(_ref10){var data=_ref10.data;return data.result.map(function(metadata){var entry={_id:metadata._id,certifiable:metadata.certifiable};if(type==='user'){entry.attributeName=metadata.attributeName;}else if(type==='application'){entry.name=metadata.name;entry.riskLevel=metadata.riskLevel;}else{entry=Object(objectSpread["a" /* default */])({},metadata);}return entry;});});};var config_actions_getCertifiableAttributes=function getCertifiableAttributes(type){return function(dispatch,getState){var _getState=getState(),certifiable_attributes=_getState.config.certifiable_attributes;if(type&&certifiable_attributes&&certifiable_attributes[type]){return certifiable_attributes[type];}return Promise.all([config_actions_getGlossaryMetadata('user'),config_actions_getGlossaryMetadata('application')]).then(function(_ref11){var _ref12=Object(slicedToArray["a" /* default */])(_ref11,2),userAttrs=_ref12[0],systemAttrs=_ref12[1];dispatch({type:CONFIG.GET_CERTIFIABLE_ATTRIBUTES,payload:{classType:'user',data:userAttrs}});systemAttrs.forEach(function(system){if(system.certifiable===true){config_actions_getGlossaryMetadata('system-attribute',system.name).then(function(attrs){attrs.forEach(function(appAttr){if(appAttr.certifiable===false){return;}if(!system._systemAttributes){system._systemAttributes={};}if(!system._systemAttributes[appAttr.objectType]){system._systemAttributes[appAttr.objectType]={};}delete appAttr._rev;delete appAttr.constraints;system._systemAttributes[appAttr.objectType][appAttr.attributeName]=appAttr;});dispatch({type:CONFIG.GET_CERTIFIABLE_ATTRIBUTES,payload:{classType:'application',data:systemAttrs}});});}});}).catch(function(error){return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};
// EXTERNAL MODULE: ./node_modules/@material-ui/icons/BookOutlined.js
var BookOutlined = __webpack_require__(276);
var BookOutlined_default = /*#__PURE__*/__webpack_require__.n(BookOutlined);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Email.js
var Email = __webpack_require__(275);
var Email_default = /*#__PURE__*/__webpack_require__.n(Email);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Settings.js
var icons_Settings = __webpack_require__(178);
var Settings_default = /*#__PURE__*/__webpack_require__.n(icons_Settings);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/AccountCircle.js
var AccountCircle = __webpack_require__(175);
var AccountCircle_default = /*#__PURE__*/__webpack_require__.n(AccountCircle);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Policy.js
var Policy = __webpack_require__(274);
var Policy_default = /*#__PURE__*/__webpack_require__.n(Policy);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Category.js
var Category = __webpack_require__(273);
var Category_default = /*#__PURE__*/__webpack_require__.n(Category);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/SupervisedUserCircleOutlined.js
var SupervisedUserCircleOutlined = __webpack_require__(272);
var SupervisedUserCircleOutlined_default = /*#__PURE__*/__webpack_require__.n(SupervisedUserCircleOutlined);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Dashboard.js
var icons_Dashboard = __webpack_require__(271);
var Dashboard_default = /*#__PURE__*/__webpack_require__.n(icons_Dashboard);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/DoneAll.js
var DoneAll = __webpack_require__(270);
var DoneAll_default = /*#__PURE__*/__webpack_require__.n(DoneAll);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/styles/withStyles.js + 1 modules
var withStyles = __webpack_require__(9);

// CONCATENATED MODULE: ./src/components/containers/NavBar/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var styles=function styles(theme){return{appBar:{backgroundColor:theme.palette.primary.contrastText,color:theme.palette.primary.main},drawer:{backgroundColor:theme.palette.primary.main,color:theme.palette.primary.contrastText},badge:{'& .MuiBadge-badge':{top:'14px',right:'-16px'}},frgNavButton:{textTransform:'lowercase'},buttonIcon:{marginRight:'4px'},createButton:{color:theme.palette.forgerock.blue,borderColor:theme.palette.forgerock.blue,width:'100%'},drawerFooter:{marginTop:'auto'},navList:{padding:'unset'},navDivider:{backgroundColor:'#455469',margin:'0.5rem 0'},navButton:{padding:'8px 15px',height:'52px',borderLeft:'3px solid transparent',color:'rgba(255, 255, 255, 0.55)','&.active':{backgroundColor:'rgba(35, 40, 46, 0.5)',borderLeftColor:'#109cf1'}},navLinkIcon:{fontSize:'1.125rem'},navHeader:{fontSize:'.75rem',display:'block',marginBottom:0,color:'rgba(255,255,255,.55)',whiteSpace:'nowrap',textTransform:'uppercase',letterSpacing:'1px'}};};/* harmony default export */ var NavBar_styles = (styles);
// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/AppBar/AppBar.js
var AppBar = __webpack_require__(494);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Toolbar/Toolbar.js
var Toolbar = __webpack_require__(495);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Typography/Typography.js
var Typography = __webpack_require__(110);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Button/Button.js
var Button = __webpack_require__(444);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Menu/Menu.js + 1 modules
var Menu = __webpack_require__(304);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Link/Link.js
var Link = __webpack_require__(498);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/MenuItem/MenuItem.js
var MenuItem = __webpack_require__(499);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Drawer/Drawer.js
var Drawer = __webpack_require__(500);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Divider/Divider.js
var Divider = __webpack_require__(501);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/List/List.js
var List = __webpack_require__(497);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/ListItem/ListItem.js
var ListItem = __webpack_require__(446);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/ListItemText/ListItemText.js
var ListItemText = __webpack_require__(502);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Menu.js
var icons_Menu = __webpack_require__(268);
var Menu_default = /*#__PURE__*/__webpack_require__.n(icons_Menu);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/ArrowDropDown.js
var ArrowDropDown = __webpack_require__(269);
var ArrowDropDown_default = /*#__PURE__*/__webpack_require__.n(ArrowDropDown);

// EXTERNAL MODULE: ./node_modules/react-router-dom/esm/react-router-dom.js
var react_router_dom = __webpack_require__(124);

// CONCATENATED MODULE: ./src/components/containers/NavLinkButton.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */// required for react-router-dom < 6.0.0
// see https://github.com/ReactTraining/react-router/issues/6056#issuecomment-435524678
var AdapterLink=react_default.a.forwardRef(function(props,ref){return/*#__PURE__*/react_default.a.createElement(react_router_dom["a" /* NavLink */],Object.assign({innerRef:ref},props));});var NavLinkButton_NavLinkButton=function NavLinkButton(props){return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],Object.assign({component:AdapterLink,to:props.to},props),props.children));};/* harmony default export */ var containers_NavLinkButton = (NavLinkButton_NavLinkButton);
// EXTERNAL MODULE: /hcmapps/workspace/IDG_Build/tmp/commons/shared/src/utils/globalConstants.js
var globalConstants = __webpack_require__(222);
var globalConstants_default = /*#__PURE__*/__webpack_require__.n(globalConstants);

// CONCATENATED MODULE: ./src/components/containers/NavBar/NavBar.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var NavBar_NavBar=function NavBar(props){Object(react["useEffect"])(function(){props.getSettings();},[]);var _React$useState=react_default.a.useState(null),_React$useState2=Object(slicedToArray["a" /* default */])(_React$useState,2),anchorEl=_React$useState2[0],setAnchorEl=_React$useState2[1];var handleClick=function handleClick(event){setAnchorEl(event.currentTarget);};var handleClose=function handleClose(){setAnchorEl(null);};var handleLogout=function handleLogout(){handleClose();props.logoutUser();};var handleDrawerToggle=function handleDrawerToggle(){props.setIsDrawerOpen(!props.isDrawerOpen);};var t=props.t,classes=props.classes,settings=props.settings,isLoggedIn=props.isLoggedIn,isDrawerOpen=props.isDrawerOpen,userId=props.userId,userRoles=props.userRoles,authorization=props.authorization;var config={};var menu=lodash_default.a.find(settings.results,function(o){return o.section=='Menu Management';});if(!lodash_default.a.isUndefined(menu)){config.customNavlinks=menu.fields[0].value;}return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(AppBar["a" /* default */],{variant:"outlined",position:"fixed",className:Object(clsx_m["a" /* default */])('appBar',isDrawerOpen&&'appBarShift',classes.appBar)},props.isLoggedIn&&/*#__PURE__*/react_default.a.createElement(Toolbar["a" /* default */],{className:Object(clsx_m["a" /* default */])({'appToolbar':!isLoggedIn,'appToolbarLoggedIn':isLoggedIn})},authorization.component!=='internal/user'?/*#__PURE__*/react_default.a.createElement(IconButton["a" /* default */],{edge:"start",color:"inherit","data-test-id":"appBar-button-navBarMenu","aria-label":"Open drawer",onClick:handleDrawerToggle,className:Object(clsx_m["a" /* default */])('menuButton',!isLoggedIn&&'hide')},/*#__PURE__*/react_default.a.createElement(Menu_default.a,null)):/*#__PURE__*/react_default.a.createElement(IconButton["a" /* default */],null),!isLoggedIn&&/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{component:"h1",variant:"h4",color:"inherit","data-test-id":"appBar-text-appTitle",noWrap:true},t('governance')),isLoggedIn&&/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{className:classes.frgNavButton,"data-test-id":"appBar-button-frgUserButton",color:"primary",variant:"text",onClick:handleClick},/*#__PURE__*/react_default.a.createElement(AccountCircle_default.a,{className:classes.buttonIcon}),userId,/*#__PURE__*/react_default.a.createElement(ArrowDropDown_default.a,null)),/*#__PURE__*/react_default.a.createElement(Menu["a" /* default */],{keepMounted:true,elevation:0,anchorEl:anchorEl,getContentAnchorEl:null,open:Boolean(anchorEl),onClose:handleClose,anchorOrigin:{vertical:'bottom',horizontal:'center'},transformOrigin:{vertical:'top',horizontal:'center'}},config&&config.customNavlinks&&config.customNavlinks.map(function(navlink){return/*#__PURE__*/react_default.a.createElement(Link["a" /* default */],{key:navlink.url,color:"inherit","data-test-id":"appBar-button-logoutButton",href:navlink.url},/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],null,navlink.name));}),/*#__PURE__*/react_default.a.createElement(Link["a" /* default */],{color:"inherit","data-test-id":"appBar-button-logoutButton",onClick:handleLogout},/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],null,t('btn-logout'))))))),/*#__PURE__*/react_default.a.createElement(Drawer["a" /* default */],{className:'drawer',variant:"persistent",anchor:"left",open:isDrawerOpen,classes:{paper:Object(clsx_m["a" /* default */])('drawerPaper',classes.drawer)}},/*#__PURE__*/react_default.a.createElement("div",{className:'drawerHeader'},/*#__PURE__*/react_default.a.createElement("img",{className:'drawerLogo',src:"/governance"+'/img/mainlogo.png',alt:"logo"})),/*#__PURE__*/react_default.a.createElement(Divider["a" /* default */],{className:classes.navDivider}),/*#__PURE__*/react_default.a.createElement(List["a" /* default */],{className:classes.navList},/*#__PURE__*/react_default.a.createElement(containers_NavLinkButton,{className:classes.navButton,"data-test-id":"navBar-link-myTasks",color:"inherit",fullWidth:true,exact:true,to:"/my-tasks"},/*#__PURE__*/react_default.a.createElement(DoneAll_default.a,{className:classes.navLinkIcon}),/*#__PURE__*/react_default.a.createElement(ListItem["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(ListItemText["a" /* default */],{primary:t('page-my-tasks')})))),userRoles.indexOf(globalConstants_default.a.ROLE.GOV_ADMIN)>-1&&/*#__PURE__*/react_default.a.createElement(List["a" /* default */],{className:classes.navList},/*#__PURE__*/react_default.a.createElement(Divider["a" /* default */],{className:classes.navDivider}),/*#__PURE__*/react_default.a.createElement(ListItem["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{color:"inherit",gutterBottom:true,variant:"h6",className:classes.navHeader},t('page-admin'))),/*#__PURE__*/react_default.a.createElement(containers_NavLinkButton,{className:classes.navButton,"data-test-id":"navBar-link-admin-dashboard",color:"inherit",fullWidth:true,exact:true,to:"/admin/dashboard"},/*#__PURE__*/react_default.a.createElement(Dashboard_default.a,{className:classes.navLinkIcon}),/*#__PURE__*/react_default.a.createElement(ListItem["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(ListItemText["a" /* default */],{primary:t('page-admin-dashboard')}))),/*#__PURE__*/react_default.a.createElement(containers_NavLinkButton,{className:classes.navButton,"data-test-id":"navBar-link-user-certifications",color:"inherit",fullWidth:true,exact:true,to:"/admin/certifications/user"},/*#__PURE__*/react_default.a.createElement(SupervisedUserCircleOutlined_default.a,{className:classes.navLinkIcon}),/*#__PURE__*/react_default.a.createElement(ListItem["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(ListItemText["a" /* default */],{primary:t('page-user-certs')}))),/*#__PURE__*/react_default.a.createElement(containers_NavLinkButton,{className:classes.navButton,"data-test-id":"navBar-link-object-certifications",color:"inherit",fullWidth:true,exact:true,to:"/admin/certifications/object"},/*#__PURE__*/react_default.a.createElement(Category_default.a,{className:classes.navLinkIcon}),/*#__PURE__*/react_default.a.createElement(ListItem["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(ListItemText["a" /* default */],{primary:t('page-object-certs')}))),/*#__PURE__*/react_default.a.createElement(containers_NavLinkButton,{className:classes.navButton,"data-test-id":"navBar-link-policies",color:"inherit",fullWidth:true,exact:true,to:"/admin/policies"},/*#__PURE__*/react_default.a.createElement(Policy_default.a,{className:classes.navLinkIcon}),/*#__PURE__*/react_default.a.createElement(ListItem["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(ListItemText["a" /* default */],{primary:t('page-policies')}))),/*#__PURE__*/react_default.a.createElement(containers_NavLinkButton,{className:classes.navButton,"data-test-id":"navBar-link-user-summary",color:"inherit",fullWidth:true,exact:true,to:"/admin/user-summary"},/*#__PURE__*/react_default.a.createElement(AccountCircle_default.a,{className:classes.navLinkIcon}),/*#__PURE__*/react_default.a.createElement(ListItem["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(ListItemText["a" /* default */],{primary:t('page-user-summary')}))),/*#__PURE__*/react_default.a.createElement(containers_NavLinkButton,{className:classes.navButton,"data-test-id":"navBar-link-system-settings",color:"inherit",fullWidth:true,exact:true,to:"/admin/system-settings"},/*#__PURE__*/react_default.a.createElement(Settings_default.a,{className:classes.navLinkIcon}),/*#__PURE__*/react_default.a.createElement(ListItem["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(ListItemText["a" /* default */],{primary:t('page-system-settings')}))),/*#__PURE__*/react_default.a.createElement(containers_NavLinkButton,{className:classes.navButton,"data-test-id":"navBar-link-notification-templates",color:"inherit",fullWidth:true,exact:true,to:"/admin/notification-templates"},/*#__PURE__*/react_default.a.createElement(Email_default.a,{className:classes.navLinkIcon}),/*#__PURE__*/react_default.a.createElement(ListItem["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(ListItemText["a" /* default */],{primary:t('page-notification-templates')})))),userRoles.indexOf(globalConstants_default.a.ROLE.GLOSSARY_ADMIN)>-1&&/*#__PURE__*/react_default.a.createElement(List["a" /* default */],{className:classes.navList},/*#__PURE__*/react_default.a.createElement(Divider["a" /* default */],{className:classes.navDivider}),/*#__PURE__*/react_default.a.createElement(ListItem["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{color:"inherit",gutterBottom:true,variant:"h6",className:classes.navHeader},t('page-glossary'))),/*#__PURE__*/react_default.a.createElement(containers_NavLinkButton,{className:classes.navButton,"data-test-id":"navBar-link-adminGlossaryEditorPage",color:"inherit",fullWidth:true,exact:true,to:"/glossaryAdmin/glossary-editor"},/*#__PURE__*/react_default.a.createElement(BookOutlined_default.a,{className:classes.navLinkIcon}),/*#__PURE__*/react_default.a.createElement(ListItem["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(ListItemText["a" /* default */],{primary:t('page-glossary-editor')})))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.drawerFooter},/*#__PURE__*/react_default.a.createElement(List["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(ListItem["a" /* default */],null)))));};var NavBar_mapStateToProps=function mapStateToProps(state){var _state$auth=state.auth,isLoggedIn=_state$auth.isLoggedIn,authenticationId=_state$auth.authenticationId,roles=_state$auth.roles,authorization=_state$auth.authorization,isDrawerOpen=state.generic.isDrawerOpen,settings=state.config.settings;return{userId:authenticationId,userRoles:roles,settings:settings,isLoggedIn:isLoggedIn,isDrawerOpen:isDrawerOpen,authorization:authorization};};var NavBar_mapDispatchToProps={logoutUser:auth_actions_logoutUser,setIsDrawerOpen:generic_actions_setIsDrawerOpen,getSettings:config_actions_getSettings};/* harmony default export */ var containers_NavBar_NavBar = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(NavBar_mapStateToProps,NavBar_mapDispatchToProps),Object(withStyles["a" /* default */])(NavBar_styles,{withTheme:true}),Object(react_i18next_dist_es["b" /* withTranslation */])())(NavBar_NavBar));
// CONCATENATED MODULE: ./src/components/containers/NavBar/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var containers_NavBar = (containers_NavBar_NavBar);
// CONCATENATED MODULE: ./src/components/containers/Dashboard/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var styles_styles=function styles(theme){return{container:{marginTop:theme.spacing()},buttonContainer:{borderBottom:'1px solid rgba(224, 224, 224, 1)',marginBottom:'15px'},certStatusButton:{width:'max-content',color:theme.palette.forgerock.darkGray,backgroundColor:'#fafafa',boxShadow:'none',borderColor:theme.palette.forgerock.blue,borderRadius:'0px',border:'0px','&.selected':{color:theme.palette.forgerock.blue,borderBottom:'3px solid'},'&:hover':{backgroundColor:theme.palette.forgerock.lightGray,boxShadow:'none'}},certTypeButton:{width:'max-content',color:theme.palette.forgerock.darkGray,backgroundColor:'#fafafa',boxShadow:'none',borderColor:theme.palette.forgerock.blue,borderRadius:'0px',border:'0px','&.selected':{color:theme.palette.forgerock.blue,borderBottom:'3px solid'},'&:hover':{backgroundColor:theme.palette.forgerock.lightGray,boxShadow:'none'}}};};/* harmony default export */ var Dashboard_styles = (styles_styles);
// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/ButtonGroup/ButtonGroup.js
var ButtonGroup = __webpack_require__(515);

// CONCATENATED MODULE: ./src/store/actions/dashboard.actions.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var dashboard_actions_getCertifications=function getCertifications(){return function(dispatch,getState){dispatch({type:DASHBOARD.QUERY_DASHBOARD,payload:null});var endpoint=utils_constants.IDM_CONTEXT+'/governance/dashboard';var _getState$dashboard=getState().dashboard,status=_getState$dashboard.status,pageNumber=_getState$dashboard.pageNumber,pageSize=_getState$dashboard.pageSize,sortBy=_getState$dashboard.sortBy,sortDir=_getState$dashboard.sortDir,q=_getState$dashboard.q,type=_getState$dashboard.type;var params={status:status,pageNumber:pageNumber,pageSize:pageSize,sortBy:sortBy,q:q,type:type};params.sortBy=sortDir==='asc'?"+".concat(sortBy):"-".concat(sortBy);if(params.q){params.q=params.q.replace(/\\/g,'\\\\').replace(/"/g,'\\"');}return httpService.request({url:endpoint,method:'get',params:params}).then(function(_ref){var data=_ref.data;dispatch({type:DASHBOARD.QUERY_DASHBOARD_SUCCESS,payload:data.result});return data;}).catch(function(error){dispatch({type:DASHBOARD.QUERY_DASHBOARD_FAILURE,payload:[]});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var dashboard_actions_updateStatus=function updateStatus(newStatus,noUpdate){return function(dispatch){dispatch({type:DASHBOARD.UPDATE_STATUS,payload:newStatus});if(!noUpdate){dispatch(dashboard_actions_getCertifications());}};};var dashboard_actions_updateType=function updateType(newType,noUpdate){return function(dispatch){dispatch({type:DASHBOARD.UPDATE_TYPE,payload:newType});if(!noUpdate){dispatch(dashboard_actions_getCertifications());}};};var dashboard_actions_changeSearchKey=function changeSearchKey(q,noUpdate){return function(dispatch){dispatch({type:DASHBOARD.CHANGE_SEARCH_KEY,payload:{q:q}});if(!noUpdate){dispatch(dashboard_actions_getCertifications());}};};var dashboard_actions_changeSortKey=function changeSortKey(sortBy,isDesc,noUpdate){return function(dispatch){dispatch({type:DASHBOARD.CHANGE_SORTING,payload:{sortBy:sortBy,isDesc:isDesc}});if(!noUpdate){dispatch(dashboard_actions_getCertifications());}};};var dashboard_actions_updatePagination=function updatePagination(params,noUpdate){return function(dispatch){dispatch({type:DASHBOARD.UPDATE_PAGINATION,payload:params});if(!noUpdate){dispatch(dashboard_actions_getCertifications());}};};var dashboard_actions_actOnViolation=function actOnViolation(id,action,comments,expirationDate){return function(dispatch){var endpoint=utils_constants.IDM_CONTEXT+'/governance/violation/'+id;var payload={};if(comments&&expirationDate){payload={comments:comments,expirationDate:expirationDate};}else if(comments){payload={comments:comments};}var params={_action:action};return httpService.request({url:endpoint,method:'post',data:payload,params:params}).then(function(_ref2){var data=_ref2.data;var successMessage=i18n.t('action-successful');dispatch(generic_actions_alert(successMessage,'success'));if(action==='comment'){dispatch(generic_actions_getModalObject('violation',id));}else{dispatch(dashboard_actions_getCertifications());}}).catch(function(error){return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var dashboard_actions_commentViolation=function commentViolation(params){return function(dispatch){dispatch({type:DASHBOARD.COMMENT_VIOLATION,payload:params});dispatch(dashboard_actions_getCertifications());};};
// CONCATENATED MODULE: ./src/store/actions/certlist.actions.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var certlist_actions_getCertificationList=function getCertificationList(){return function(dispatch,getState){dispatch({type:CERTLIST.QUERY_CERT_LIST,payload:null});var _getState$certlist=getState().certlist,ascOrder=_getState$certlist.ascOrder,actingId=_getState$certlist.actingId,pageNumber=_getState$certlist.pageNumber,pageSize=_getState$certlist.pageSize,sortDir=_getState$certlist.sortDir,sortBy=_getState$certlist.sortBy,q=_getState$certlist.q,certId=_getState$certlist.certId,certType=_getState$certlist.certType,isAdminView=_getState$certlist.isAdminView,stageSelected=_getState$certlist.stageSelected,status=_getState$certlist.status;var params={ascOrder:ascOrder,pageNumber:pageNumber,pageSize:pageSize,sortBy:sortBy,q:q};if(params.q){params.q=params.q.replace(/\\/g,'\\\\').replace(/"/g,'\\"');}params.sortBy=sortDir==='asc'?"+".concat(sortBy):"-".concat(sortBy);if(!isAdminView){params.actingId=actingId;}else{params.selected=stageSelected;}params.type=status===utils_constants.CERT_STATUS.ACTIVE?'open':'closed';return httpService.request({url:certlist_actions_getCertificationListEndpoint(certType,certId,isAdminView),method:'get',params:params}).then(function(_ref){var data=_ref.data;dispatch({type:CERTLIST.QUERY_CERT_LIST_SUCCESS,payload:data.result});return data;}).catch(function(error){dispatch({type:CERTLIST.QUERY_CERT_LIST_FAILURE,payload:null});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var certlist_actions_updateStatus=function updateStatus(status){return function(dispatch){dispatch({type:CERTLIST.UPDATE_STATUS,payload:status});};};var certlist_actions_getEventDetails=function getEventDetails(hideScreen){return function(dispatch,getState){var _getState$certlist2=getState().certlist,stageSelected=_getState$certlist2.stageSelected,eventIndexSelected=_getState$certlist2.eventIndexSelected,certId=_getState$certlist2.certId,certType=_getState$certlist2.certType;if(!eventIndexSelected&&eventIndexSelected!==0){return;}if(hideScreen){dispatch({type:CERTLIST.QUERY_EVENT_DETAILS,payload:null});}var params={};if(!getState().certlist.isAdminView){params.actingId=getState().certlist.actingId;}return httpService.request({url:certlist_actions_getEventDetailsEndpoint(certType,certId,getState().certlist.isAdminView,stageSelected,eventIndexSelected),method:'get',params:params}).then(function(data){dispatch({type:CERTLIST.QUERY_EVENT_DETAILS_SUCCESS,payload:data});return data;}).catch(function(error){dispatch({type:CERTLIST.QUERY_EVENT_DETAILS_FAILURE,payload:null});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var certlist_actions_removeEventDetails=function removeEventDetails(){return function(dispatch,getState){dispatch({type:CERTLIST.QUERY_EVENT_DETAILS_REMOVE,payload:null});};};var certlist_actions_setSelectedEventIndex=function setSelectedEventIndex(id,fetchData){return function(dispatch,getState){var _getState$certlist3=getState().certlist,stageSelected=_getState$certlist3.stageSelected,results=_getState$certlist3.results;var selectedEvent=null;if(results&&results.stages){results.stages[stageSelected].events.forEach(function(event){if(event._id===id){selectedEvent=event.eventIndex;}});}dispatch({type:CERTLIST.SET_SELECTED_EVENT_INDEX,payload:selectedEvent});};};var certlist_actions_certActionEvent=function certActionEvent(comment,reset){return function(dispatch,getState){var _getState$certlist4=getState().certlist,certType=_getState$certlist4.certType,certId=_getState$certlist4.certId,eventIndexSelected=_getState$certlist4.eventIndexSelected,stageSelected=_getState$certlist4.stageSelected,actingId=_getState$certlist4.actingId,rowData=_getState$certlist4.rowData,selectedAction=_getState$certlist4.selectedAction;var endpointUrl=utils_constants.IDM_CONTEXT+'/governance/certify/'+certType+'/'+certId+'/'+stageSelected+'/'+eventIndexSelected;var params={action:selectedAction};//build data
var data=!comment||comment===undefined?{}:{comment:comment};//build params
if(rowData){var dataGroup=rowData.dataGroup,dataIndex=rowData.dataIndex,attrIndex=rowData.attrIndex;params['dataGroup']=dataGroup;params['dataIndex']=dataIndex;params['attrIndex']=attrIndex;}else if(!getState().certlist.isAdminView){params.actingId=actingId;}return httpService.request({url:endpointUrl,method:'post',data:data,params:params}).then(function(_ref2){var data=_ref2.data;dispatch(certlist_actions_getEventDetails(false));return data;}).catch(function(error){return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));}).finally(function(){if(reset){dispatch(certlist_actions_updateSelectedAction(''));dispatch(certlist_actions_updateRowData(null));}});};};var certlist_actions_certActionStage=function certActionStage(action,queryFilter,data){return function(dispatch,getState){var _getState$certlist5=getState().certlist,certType=_getState$certlist5.certType,certId=_getState$certlist5.certId,stageSelected=_getState$certlist5.stageSelected,actingId=_getState$certlist5.actingId;var endpoint=utils_constants.IDM_CONTEXT+'/governance/certify/'+certType+'/'+certId+'/'+stageSelected;var params={'action':getAction(action),queryFilter:queryFilter,actingId:actingId};return httpService.request({url:endpoint,method:'post',data:data||{},params:params}).then(function(_ref3){var result=_ref3.data.result;dispatch(generic_actions_alert(result,'success'));if(action!=='sign-off'){dispatch(certlist_actions_getCertificationList());}return data;}).catch(function(error){dispatch({type:CERTLIST.QUERY_CERT_LIST_FAILURE,payload:null});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var certlist_actions_updateCertId=function updateCertId(newCertId,certType,noUpdate){return function(dispatch){dispatch({type:CERTLIST.UPDATE_CERTID,payload:{certId:newCertId,certType:certType}});if(!noUpdate){dispatch(certlist_actions_getCertificationList());}};};var certlist_actions_changeSelectedStage=function changeSelectedStage(stageSelected,noUpdate){return function(dispatch){dispatch({type:CERTLIST.CHANGE_SELECTED_STAGE,payload:stageSelected});if(!noUpdate){dispatch(certlist_actions_getCertificationList());}};};var certlist_actions_incrementSelectedStage=function incrementSelectedStage(){return function(dispatch,getState){var stageSelected=getState().certlist.stageSelected;var newStage=stageSelected+1;if(newStage+1>getState().certlist.eventDetails.stages.length){newStage=0;}dispatch({type:CERTLIST.CHANGE_SELECTED_STAGE,payload:newStage});};};var certlist_actions_decrementSelectedStage=function decrementSelectedStage(){return function(dispatch,getState){var stageSelected=getState().certlist.stageSelected;var newStage=stageSelected-1;if(newStage<0){newStage=getState().certlist.eventDetails.stages.length-1;}dispatch({type:CERTLIST.CHANGE_SELECTED_STAGE,payload:newStage});};};var certlist_actions_changeSortKey=function changeSortKey(sortBy,isDesc){return function(dispatch){dispatch({type:CERTLIST.CHANGE_SORTING,payload:{sortBy:sortBy,isDesc:isDesc}});dispatch(certlist_actions_getCertificationList());};};var certlist_actions_updatePagination=function updatePagination(params,noUpdate){return function(dispatch){dispatch({type:CERTLIST.UPDATE_PAGINATION,payload:params});if(!noUpdate){dispatch(certlist_actions_getCertificationList());}};};var certlist_actions_changeSearchKey=function changeSearchKey(q,noUpdate){return function(dispatch){dispatch({type:CERTLIST.CHANGE_SEARCH_KEY,payload:{q:q}});if(!noUpdate){dispatch(certlist_actions_getCertificationList());}};};var certlist_actions_setUserAdmin=function setUserAdmin(isAdmin){return function(dispatch){dispatch({type:CERTLIST.CHANGE_IS_ADMIN,payload:isAdmin});};};var certlist_actions_updateActingId=function updateActingId(newId){return function(dispatch){dispatch({type:CERTLIST.UPDATE_ACTINGID,payload:newId});};};var certlist_actions_updateSelectedAction=function updateSelectedAction(newAction){return function(dispatch){dispatch({type:CERTLIST.CHANGE_SELECTED_ACTION,payload:newAction});};};var certlist_actions_updateRowData=function updateRowData(newData){return function(dispatch){dispatch({type:CERTLIST.CHANGE_ROW_DATA,payload:newData});};};var certlist_actions_getMetadata=function getMetadata(type,obj){return function(dispatch,getState){dispatch({type:CERTLIST.QUERY_METADATA_OBJECT,payload:null});var certEndpoint=utils_constants.IDM_CONTEXT+'/commons/glossary/managed';var params={targetId:obj};return httpService.request({url:certEndpoint,method:'get',params:params}).then(function(_ref4){var data=_ref4.data;var payload=data.result||{};dispatch({type:CERTLIST.QUERY_METADATA_OBJECT_SUCCESS,payload:payload});}).catch(function(error){dispatch({type:CERTLIST.QUERY_METADATA_OBJECT_FAILURE,payload:null});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var getAction=function getAction(oldAction){switch(oldAction){case'claim-all':case'claim-selected':return'claim';case'certify-all':case'certify-selected':return'certify-remaining';case'reset-all':case'reset-selected':return'reset';case'reassign-tasks':case'reassign-all':case'reassign-selected':return'reassign';default:return oldAction;}};var certlist_actions_getCertificationListEndpoint=function getCertificationListEndpoint(certType,certId,isAdmin){if(isAdmin){return utils_constants.IDM_CONTEXT+'/governance/adminCertList/'+certType+'/'+certId;}else{return utils_constants.IDM_CONTEXT+'/governance/certificationList/'+certType+'/'+certId;}};var certlist_actions_getEventDetailsEndpoint=function getEventDetailsEndpoint(certType,certId,isAdmin,stage,eventIndex){if(isAdmin){return utils_constants.IDM_CONTEXT+'/governance/adminCertEventDetails/'+certType+'/'+certId+'/'+stage+'/'+eventIndex;}else{return utils_constants.IDM_CONTEXT+'/governance/certificationEventDetails/'+certType+'/'+certId+'/'+stage+'/'+eventIndex;}};
// CONCATENATED MODULE: ./src/components/presentational/PageTitle/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var PageTitle_styles_styles=function styles(theme){return{container:{alignItems:'center'},pageTitle:{fontWeight:300,paddingTop:theme.spacing(),paddingBottom:theme.spacing()},pageSubtitle:{fontWeight:300,paddingBottom:theme.spacing(),paddingLeft:theme.spacing()*2},pageTitleDivider:{marginBottom:theme.spacing()}};};/* harmony default export */ var PageTitle_styles = (PageTitle_styles_styles);
// CONCATENATED MODULE: ./src/components/presentational/PageTitle/PageTitle.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var PageTitle_PageTitle=function PageTitle(props){var title=props.title,subtitle=props.subtitle,pageActionButton=props.pageActionButton,classes=props.classes;return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,title&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.container,container:true,justify:"space-between"},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.pageTitle,component:"span",variant:"h3"},title),pageActionButton),subtitle&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.container,container:true,justify:"space-between"},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.pageSubtitle,component:"span",variant:"h6"}," ",subtitle)));};/* harmony default export */ var presentational_PageTitle_PageTitle = (Object(withStyles["a" /* default */])(PageTitle_styles,{withTheme:true})(PageTitle_PageTitle));
// CONCATENATED MODULE: ./src/components/presentational/PageTitle/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var presentational_PageTitle = (presentational_PageTitle_PageTitle);
// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Search.js
var Search = __webpack_require__(295);
var Search_default = /*#__PURE__*/__webpack_require__.n(Search);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Add.js
var Add = __webpack_require__(76);
var Add_default = /*#__PURE__*/__webpack_require__.n(Add);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/RotateLeft.js
var RotateLeft = __webpack_require__(294);
var RotateLeft_default = /*#__PURE__*/__webpack_require__.n(RotateLeft);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Assignment.js
var Assignment = __webpack_require__(293);
var Assignment_default = /*#__PURE__*/__webpack_require__.n(Assignment);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/HighlightOff.js
var HighlightOff = __webpack_require__(292);
var HighlightOff_default = /*#__PURE__*/__webpack_require__.n(HighlightOff);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/CheckCircle.js
var CheckCircle = __webpack_require__(119);
var CheckCircle_default = /*#__PURE__*/__webpack_require__.n(CheckCircle);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Delete.js
var Delete = __webpack_require__(188);
var Delete_default = /*#__PURE__*/__webpack_require__.n(Delete);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/AssignmentInd.js
var AssignmentInd = __webpack_require__(291);
var AssignmentInd_default = /*#__PURE__*/__webpack_require__.n(AssignmentInd);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Block.js
var Block = __webpack_require__(290);
var Block_default = /*#__PURE__*/__webpack_require__.n(Block);

// EXTERNAL MODULE: ./node_modules/uuid/dist/esm-browser/v4.js + 2 modules
var v4 = __webpack_require__(539);

// CONCATENATED MODULE: ./src/components/presentational/GovernanceTable/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var GovernanceTable_styles_styles=function styles(theme){return{root:{width:'100%',paddingLeft:'0',paddingTop:'0'},bulkActionGrid:{width:'100%',paddingLeft:'20px'},altActionGrid:{width:'100%',paddingLeft:'20px',justifyContent:'flex-end',alignSelf:'flex-end',textAlign:'end'},hidden:{visibility:'hidden'},menuAction:{textTransform:'capitalize'},progressValue:{paddingLeft:'15px'},rowActionMenu:{boxShadow:'none'},searchIcon:{color:theme.palette.forgerock.darkgray,fill:theme.palette.forgerock.darkgray},table:{minWidth:'660px'},tableActionButton:{marginTop:'20px',marginRight:'5px',height:'50px',color:theme.palette.forgerock.blue,borderColor:theme.palette.forgerock.blue},tableCreateButton:{marginTop:'20px',marginRight:'5px',height:'50px',backgroundColor:theme.palette.forgerock.blue,borderColor:theme.palette.forgerock.blue,color:theme.palette.forgerock.white,'&:hover':{//you want this to be the same as the backgroundColor above
backgroundColor:theme.palette.forgerock.blue}},tableLabel:{display:'flex',alignItems:'center'},tablePagination:{'& .MuiTablePagination-caption:last-of-type':{display:'none'}},tableSearchBar:{color:theme.palette.forgerock.darkgray,maxHeight:'50px',marginTop:'15px',marginBottom:'10px',marginLeft:'20px',width:'100%'},tableTitle:{flex:'0 0 auto'},tableToolbar:{paddingLeft:'0px',paddingBottom:'10px',borderBottom:'1px solid rgba(224, 224, 224, 1)'},tableHeadRow:{display:'flex',justifyContent:'space-evenly'},tableBodyRow:{display:'flex',justifyContent:'space-evenly'},tableHeader:function tableHeader(props){return{textAlign:'left',// flexGrow: 1,
width:"".concat(100/props.tableCols.length,"%"),paddingLeft:0};},tableHeaderCheckbox:{minWidth:'fit-content',paddingRight:"".concat(theme.spacing()*2,"px!important"),marginTop:'5px'},headerIcon:{color:theme.palette.forgerock.white},incompleteIcon:{color:theme.palette.forgerock.lightgray},certifyIcon:{color:theme.palette.forgerock.success},revokeIcon:{color:theme.palette.forgerock.danger},abstainIcon:{color:theme.palette.forgerock.warning},inProgressIcon:{opacity:.54},rowIconButton:{marginLeft:'10px'},outcomeHeader:{width:0},tableCheckbox:{verticalAlign:'baseline',paddingRight:"".concat(theme.spacing(2),"px!important"),paddingTop:"".concat(theme.spacing(),"px!important"),'& span':{alignSelf:'flex-start'},minWidth:'fit-content'},tableCellGrid:{display:'flex',width:'100%'},tableCellGeneric:{cursor:'default',padding:'0px',paddingRight:'0px!important'},tableCellInactive:{color:'gray'},column:function column(props){// const cols = props.tableCols ? props.tableCols : props.rowCols;
return{alignSelf:'flexStart',// fontSize: theme.typography.pxToRem(15),
// flexBasis: `${(100 / cols.length) - .75}%`,
width:'100%',paddingTop:theme.spacing(),paddingBottom:theme.spacing(),// flexShrink: 0,
textAlign:'left',minWidth:0,marginRight:'16px','&:not(:first-child)':{paddingLeft:'0px'}};},columnChevron:{paddingLeft:'10px'},buttonIcon:{marginRight:'5px'},cellItem:{display:'block',overflow:'hidden',textOverflow:'ellipsis',fontSize:'.95rem'},cellItemIcon:{margin:0,padding:'4px 0 0 2px'},outcomeCell:{width:'5%'},expansionPanel:{boxShadow:'none','&:not(:last-child)':{borderBottom:0},'&:before':{display:'none'}},expansionPanelSummary:{padding:0,minHeight:theme.spacing()*6},visuallyHidden:{border:0,clip:'rect(0 0 0 0)',height:1,margin:-1,overflow:'hidden',padding:0,position:'absolute',top:20,width:1},linearProgressRoot:{height:20,border:1,borderStyle:'groove',backgroundColor:theme.palette.forgerock.lightGray},linearProgressBar:{backgroundColor:theme.palette.forgerock.blue},entitlementListItem:{margin:0},expansionPanelDetails:{display:'flex',paddingBottom:theme.spacing(),paddingLeft:0,justifyContent:'left',flexGrow:1,flexWrap:'wrap',textAlign:'center'},subPaneDetails:{margin:'0 auto'},subPaneGrid:{display:'inline-flex','&:not(:first-of-type)':{width:'100%'}},subPaneHeader:{display:'flex',width:'50%','& h6':{width:'50%',flexGrow:1},'&:first-of-type h6':{textAlign:'left'},'&:last-of-type h6:last-of-type':{textAlign:'center'}},subPaneColumn:{width:'50%',minWidth:'min-content',justifyContent:'left'},subPaneButtonColumn:{marginTop:theme.spacing()*2,textAlign:'center'},subPaneListItem:{paddingLeft:0},subPaneButton:{margin:theme.spacing(1)}};};/* harmony default export */ var GovernanceTable_styles = (GovernanceTable_styles_styles);
// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/LinearProgress/LinearProgress.js
var LinearProgress = __webpack_require__(507);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Select/Select.js + 4 modules
var Select = __webpack_require__(457);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Paper/Paper.js
var Paper = __webpack_require__(159);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/TextField/TextField.js
var TextField = __webpack_require__(505);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/InputAdornment/InputAdornment.js
var InputAdornment = __webpack_require__(513);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Table/Table.js
var Table = __webpack_require__(524);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/TableHead/TableHead.js
var TableHead = __webpack_require__(525);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/TableRow/TableRow.js
var TableRow = __webpack_require__(526);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/TableCell/TableCell.js
var TableCell = __webpack_require__(527);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Checkbox/Checkbox.js + 3 modules
var Checkbox = __webpack_require__(536);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/TableSortLabel/TableSortLabel.js + 1 modules
var TableSortLabel = __webpack_require__(542);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/TableBody/TableBody.js
var TableBody = __webpack_require__(528);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/TablePagination/TablePagination.js + 3 modules
var TablePagination = __webpack_require__(538);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/ListSubheader/ListSubheader.js
var ListSubheader = __webpack_require__(504);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Dialog/Dialog.js
var Dialog = __webpack_require__(510);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/DialogTitle/DialogTitle.js
var DialogTitle = __webpack_require__(514);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Container/Container.js
var Container = __webpack_require__(523);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/FormControl/FormControl.js
var FormControl = __webpack_require__(451);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/RadioGroup/RadioGroup.js
var RadioGroup = __webpack_require__(508);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/FormControlLabel/FormControlLabel.js
var FormControlLabel = __webpack_require__(509);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Radio/Radio.js + 4 modules
var Radio = __webpack_require__(535);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/CircularProgress/CircularProgress.js
var CircularProgress = __webpack_require__(506);

// EXTERNAL MODULE: ./node_modules/@material-ui/lab/esm/Autocomplete/Autocomplete.js + 5 modules
var Autocomplete = __webpack_require__(534);

// CONCATENATED MODULE: ./src/components/presentational/AsyncSelect/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var AsyncSelect_styles_styles=function styles(theme){return{endAdornment:{top:0,height:'100%',display:'flex',alignItems:'center'}};};/* harmony default export */ var AsyncSelect_styles = (AsyncSelect_styles_styles);
// CONCATENATED MODULE: ./src/store/actions/async_fields.actions.js
function _createForOfIteratorHelper(o,allowArrayLike){var it;if(typeof Symbol==="undefined"||o[Symbol.iterator]==null){if(Array.isArray(o)||(it=_unsupportedIterableToArray(o))||allowArrayLike&&o&&typeof o.length==="number"){if(it)o=it;var i=0;var F=function F(){};return{s:F,n:function n(){if(i>=o.length)return{done:true};return{done:false,value:o[i++]};},e:function e(_e){throw _e;},f:F};}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}var normalCompletion=true,didErr=false,err;return{s:function s(){it=o[Symbol.iterator]();},n:function n(){var step=it.next();normalCompletion=step.done;return step;},e:function e(_e2){didErr=true;err=_e2;},f:function f(){try{if(!normalCompletion&&it.return!=null)it.return();}finally{if(didErr)throw err;}}};}function _unsupportedIterableToArray(o,minLen){if(!o)return;if(typeof o==="string")return _arrayLikeToArray(o,minLen);var n=Object.prototype.toString.call(o).slice(8,-1);if(n==="Object"&&o.constructor)n=o.constructor.name;if(n==="Map"||n==="Set")return Array.from(o);if(n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return _arrayLikeToArray(o,minLen);}function _arrayLikeToArray(arr,len){if(len==null||len>arr.length)len=arr.length;for(var i=0,arr2=new Array(len);i<len;i++){arr2[i]=arr[i];}return arr2;}var async_fields_actions_getWorkflowOptions=function getWorkflowOptions(){return function(dispatch,getState){var _getState=getState(),config=_getState.config;var IDM_version=lodash_default.a.get(config,'IDM_version');dispatch({type:ASYNC_FIELDS.QUERY_WORKFLOWS,payload:null});var params={};if(IDM_version.indexOf('6.5')>=0){params._queryId='query-all-ids';}else{params._queryFilter='true';}return httpService.request({url:utils_constants.IDM_CONTEXT.concat('/workflow/processdefinition'),method:'get',params:params}).then(function(_ref){var data=_ref.data;var workflows=[];if(data.result&&data.result.length>0){workflows=lodash_default.a.chain(data.result).groupBy('key').map(lodash_default.a.last).value();workflows=workflows.map(function(workflow){return{key:workflow.key,displayName:workflow.name};});}dispatch({type:ASYNC_FIELDS.QUERY_WORKFLOWS_SUCCESS,payload:workflows});}).catch(function(error){return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var async_fields_actions_getPoliciesForScan=function getPoliciesForScan(query){return function(dispatch){dispatch({type:ASYNC_FIELDS.QUERY_SCAN_POLICIES,payload:null});var _queryFilter=query?"name co \"".concat(query,"\""):'true';return httpService.request({url:utils_constants.IDM_CONTEXT.concat('/managed/policy'),method:'get',params:{_queryFilter:_queryFilter,_sortKeys:'name'}}).then(function(_ref2){var data=_ref2.data;dispatch({type:ASYNC_FIELDS.QUERY_SCAN_POLICIES_SUCCESS,payload:data.result});return data.result;}).catch(function(error){return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var queryUsers=function queryUsers(query,setting){return function(dispatch){return async_fields_actions_queryForManagedObject(query,'user',dispatch,setting);};};var queryRoles=function queryRoles(query,setting){return function(dispatch){return async_fields_actions_queryForManagedObject(query,'role',dispatch,setting);};};var async_fields_actions_queryForManagedObject=function queryForManagedObject(query,queryType,dispatch,setting){var _params;var resolvedData=[];var paramsAttr=null;var userFormat=null;if(setting&&queryType==='user'){userFormat=lodash_default.a.words(setting,/(?!\{\{)(\w+)(?=\}\})/g);}if(queryType==='user'){paramsAttr='userName';}else if(queryType==='role'){paramsAttr='name';}else{paramsAttr='name';}dispatch({type:ASYNC_FIELDS.QUERY_TYPEAHEAD,payload:null});if(!query||query.length===0){dispatch({type:ASYNC_FIELDS.QUERY_TYPEAHEAD_SUCCESS,payload:[]});return Promise.resolve(resolvedData);}return httpService.request({url:"".concat(utils_constants.IDM_CONTEXT,"/managed/").concat(queryType),method:'get',params:(_params={},Object(defineProperty["a" /* default */])(_params,paramsAttr,query),Object(defineProperty["a" /* default */])(_params,"_queryFilter","".concat(paramsAttr," sw \"").concat(query,"\"")+getManagedObjectQuery(userFormat,query)),Object(defineProperty["a" /* default */])(_params,"_pageSize",'10'),Object(defineProperty["a" /* default */])(_params,"_sortKeys",paramsAttr),_params)}).then(function(_ref3){var data=_ref3.data;var results=null;if(setting&&queryType==='user'){results=data.result.map(function(obj){return{key:obj._id,displayName:async_fields_actions_getDisplayName(obj,setting),userName:obj.userName};});}else{results=data.result.map(function(obj){return{key:obj._id,displayName:obj[paramsAttr]};});}dispatch({type:ASYNC_FIELDS.QUERY_TYPEAHEAD_SUCCESS,payload:results});resolvedData=results;}).catch(function(error){dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));}).finally(function(){return Promise.resolve(resolvedData);});};var async_fields_actions_queryForStoredEntitlement=function queryForStoredEntitlement(query,dispatch){var resolvedData=[];var actionType,actionSuccess=null;actionType=ASYNC_FIELDS.QUERY_TYPEAHEAD;actionSuccess=ASYNC_FIELDS.QUERY_TYPEAHEAD_SUCCESS;dispatch({type:actionType,payload:null});if(!query||query.length===0){dispatch({type:actionSuccess,payload:[]});return Promise.resolve(resolvedData);}return httpService.request({url:utils_constants.IDM_CONTEXT.concat('/governance/adminDashboard'),method:'get',params:{q:query,action:'getStoredEntitlements'}}).then(function(_ref4){var data=_ref4.data;dispatch({type:actionSuccess,payload:data.result});resolvedData=data.result;}).catch(function(error){dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));}).finally(function(){return Promise.resolve(resolvedData);});};var async_fields_actions_queryForEntitlement=function queryForEntitlement(entitlementFilter,pageParams){var configObject={};configObject.url=utils_constants.IDM_CONTEXT.concat('/governance/getRelationshipObjects');configObject.params={};configObject.method='get';configObject.params.managedObject=entitlementFilter.managedObject;configObject.params.attribute=entitlementFilter.attribute;if(entitlementFilter.query){configObject.data={query:entitlementFilter.query};configObject.method='post';}if(pageParams){configObject.params.ascOrder=pageParams.ascOrder;configObject.params.pageSize=pageParams.pageSize;configObject.params.pageNumber=pageParams.pageNumber;configObject.params.sortKey=pageParams.sortKey;}return httpService(configObject).then(function(response){return response.data;},function(error){return Promise.reject(error);});};var async_fields_actions_resetTypeaheadOptions=function resetTypeaheadOptions(){return function(dispatch){dispatch({type:ASYNC_FIELDS.QUERY_TYPEAHEAD,payload:null});};};var async_fields_actions_queryTypeaheadOptions=function queryTypeaheadOptions(targetObject,query,property,setting,userNameOnly){return function(dispatch,getState){if(!property||!query){return null;}if(property==='userName'||targetObject!=='user'&&property==='name'){return async_fields_actions_queryForManagedObject(query,targetObject,dispatch,userNameOnly?null:setting);}else if(property==='certificationTotals'){return async_fields_actions_queryForStoredEntitlement(query,dispatch);}else if(property==='policyTotals'){return async_fields_actions_queryForManagedObject(query,'policy',dispatch,setting);}var properties=[property];var _getState2=getState(),config=_getState2.config;if(property==='authzGroup'&&config.membership_properties){properties=lodash_default.a.cloneDeep(config.membership_properties);}var configState=config.managed_objects[targetObject];var entitlementQuery={managedObject:targetObject,attribute:properties.join(),query:[]};var pageParams={pageSize:15,pageNumber:1,sortBy:'displayName'};var paths=[];var _iterator=_createForOfIteratorHelper(properties),_step;try{for(_iterator.s();!(_step=_iterator.n()).done;){var prop=_step.value;var resourceCollection=configState[prop].items?configState[prop].items.resourceCollection:configState[prop].resourceCollection;lodash_default.a.forEach(resourceCollection,function(coll){if(paths.indexOf(coll.path)<0){var queryParam={operator:'co',path:coll.path,value:query};if(coll.path==='managed/user'){queryParam.operator='sw';}var newQueryParam=lodash_default.a.map(coll.query.fields,function(field){var param=lodash_default.a.cloneDeep(queryParam);param.attribute=field;return param;});entitlementQuery.query=entitlementQuery.query.concat(newQueryParam);paths.push(coll.path);}});}}catch(err){_iterator.e(err);}finally{_iterator.f();}if(entitlementQuery.query.length>1){var i=0;while(i<entitlementQuery.query.length){if(entitlementQuery.query[i+1]){entitlementQuery.query.splice(i+1,0,'or');}i+=2;}}return async_fields_actions_queryForEntitlement(entitlementQuery,pageParams).then(function(response){dispatch({type:ASYNC_FIELDS.QUERY_TYPEAHEAD_SUCCESS,payload:response.result});return response.result;});};};var async_fields_actions_reverseQueryTypeahead=function reverseQueryTypeahead(targetType,value){return function(dispatch){var resourceCollection,resourceId=null;if(value._refResourceCollection){resourceCollection=value._refResourceCollection;resourceId=value._refResourceId;}else if(lodash_default.a.isString(value)){var managed='';var _value$split=value.split('/');var _value$split2=Object(slicedToArray["a" /* default */])(_value$split,3);managed=_value$split2[0];resourceCollection=_value$split2[1];resourceId=_value$split2[2];resourceCollection=managed.concat('/',resourceCollection);}if(!resourceCollection||!resourceId){return Promise.resolve([]);}return httpService.request({url:"".concat(utils_constants.IDM_CONTEXT,"/").concat(resourceCollection),method:'get',params:{_queryFilter:"_id eq '".concat(resourceId,"'"),_pageSize:'10'}}).then(function(_ref5){var data=_ref5.data;var paramsAttr=resourceCollection==='managed/user'?'userName':'name';var result=data.result.map(function(obj){return{_id:resourceCollection+'/'+obj._id,key:obj._id,displayName:obj[paramsAttr]};});dispatch({type:ASYNC_FIELDS.QUERY_TYPEAHEAD_SUCCESS,payload:result});return result;});};};var async_fields_actions_getDisplayName=function getDisplayName(data,setting){var newName='';newName=setting.replace(/\{\{\w*\}\}/g,function(match){var str=lodash_default.a.trimStart(match,'{{');str=lodash_default.a.trimEnd(str,'}}');return data[str];});return newName;};var getManagedObjectQuery=function getManagedObjectQuery(format,query){if(!format){return'';}var queryStr=' or ';format.forEach(function(f,index){if(index+1>=format.length){queryStr+="".concat(f," sw \"").concat(query,"\"");}else{queryStr+="".concat(f," sw \"").concat(query,"\" or ");}});return queryStr;};
// CONCATENATED MODULE: ./src/components/presentational/AsyncSelect/AsyncSelect.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var AsyncSelect_AsyncSelect=function AsyncSelect(props){var isMounted=react_default.a.useRef(null);var _React$useState=react_default.a.useState(false),_React$useState2=Object(slicedToArray["a" /* default */])(_React$useState,2),open=_React$useState2[0],setOpen=_React$useState2[1];var _React$useState3=react_default.a.useState([]),_React$useState4=Object(slicedToArray["a" /* default */])(_React$useState3,2),options=_React$useState4[0],setOptions=_React$useState4[1];var _React$useState5=react_default.a.useState(''),_React$useState6=Object(slicedToArray["a" /* default */])(_React$useState5,2),input=_React$useState6[0],setInput=_React$useState6[1];var _React$useState7=react_default.a.useState(false),_React$useState8=Object(slicedToArray["a" /* default */])(_React$useState7,2),querying=_React$useState8[0],setQuerying=_React$useState8[1];var queryFunction=react_default.a.useRef(lodash_default.a.debounce(props.queryTypeaheadOptions,250));var queryStore=props.results;var targetType=react_default.a.useRef(props.targetType);var userNameOnly=props.userNameOnly;react_default.a.useEffect(function(){// When component mounted
isMounted.current=true;return function(){// executed on unmount
isMounted.current=false;};},[]);react_default.a.useEffect(function(){setQuerying(true);if(event&&event.type==='input'){var targetObject=props.objectToTarget||'user';queryFunction.current(targetObject,input,props.targetType,getDisplaySettings(),userNameOnly);}else{setQuerying(false);}},[input,props.targetType]);react_default.a.useEffect(function(){if(targetType.current!==props.targetType){props.resetTypeaheadOptions();if(props.targetType==='userName'){props.queryUsers('');}else{props.queryRoles('');}setInput('');if(props.value){props.onChange(null,props.name,'');}targetType.current=props.targetType;}},[props.targetType]);react_default.a.useEffect(function(){setQuerying(false);setOptions(queryStore);},[queryStore]);react_default.a.useEffect(function(){if(props.value){props.reverseQueryTypeahead(props.targetType,props.value).then(function(result){if(!isMounted.current)return null;if(result&&result[0]&&result[0].displayName){setOptions(result);setInput(result[0].displayName);props.onChange(null,props.name,result[0]);}else{var newInput=props.value&&props.value.displayName?props.value.displayName:props.value;setInput(newInput);}});}if(!props.settingResults){props.getSettings();}},[]);var getDisplaySettings=function getDisplaySettings(){var setting=lodash_default.a.get(props,'settingResults[1].fields[0].value',undefined);return setting;};return/*#__PURE__*/react_default.a.createElement(Autocomplete["a" /* default */],{id:props.name,classes:{endAdornment:props.classes.endAdornment},inputValue:input,open:open,onOpen:function onOpen(){return setOpen(true);},onClose:function onClose(evt){props.queryUsers('');setOpen(false);},onBlur:function onBlur(evt){return props.onBlur&&props.onBlur(evt,props.name);},onChange:function onChange(evt,val){return props.onChange(evt,props.name,val);},onInputChange:function onInputChange(evt,val,reason){return setInput(val);},getOptionSelected:function getOptionSelected(option,value){return option.key===value.key;},getOptionLabel:function getOptionLabel(option){return option.displayName;},options:options,multiple:props.isMulti,loading:querying,disabled:props.disabled,renderInput:function renderInput(params){return/*#__PURE__*/react_default.a.createElement(TextField["a" /* default */],Object.assign({},params,{name:props.name,label:props.label,fullWidth:props.fullWidth,variant:props.variant,error:props.error,InputProps:Object(objectSpread["a" /* default */])({},params.InputProps,{endAdornment:/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,querying?/*#__PURE__*/react_default.a.createElement(CircularProgress["a" /* default */],{color:"inherit",size:20}):null,params.InputProps.endAdornment)})}),input)// />
;}});};var AsyncSelect_mapStateToProps=function mapStateToProps(state){var async_fields=state.async_fields,config=state.config;var settingResults=config.settings.results;return Object(objectSpread["a" /* default */])({},async_fields,{settingResults:settingResults});};var AsyncSelect_mapDispatchToProps={queryUsers:queryUsers,queryRoles:queryRoles,queryTypeaheadOptions:async_fields_actions_queryTypeaheadOptions,reverseQueryTypeahead:async_fields_actions_reverseQueryTypeahead,resetTypeaheadOptions:async_fields_actions_resetTypeaheadOptions,getSettings:config_actions_getSettings};/* harmony default export */ var presentational_AsyncSelect_AsyncSelect = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(AsyncSelect_mapStateToProps,AsyncSelect_mapDispatchToProps),Object(withStyles["a" /* default */])(AsyncSelect_styles))(AsyncSelect_AsyncSelect));
// CONCATENATED MODULE: ./src/components/presentational/AsyncSelect/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var presentational_AsyncSelect = (presentational_AsyncSelect_AsyncSelect);
// CONCATENATED MODULE: ./src/components/presentational/GovernanceDialog/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var GovernanceDialog_styles_styles=function styles(theme){return{actionButton:{flexBasis:'30%'},actionButtonContainer:{display:'flex',justifyContent:'space-around',margin:theme.spacing(),marginTop:theme.spacing(4),paddingBottom:'20px'},dialogActions:{width:'100%'},dialogContainer:{overflow:'scroll',width:'600px'},incompleteIcon:{color:theme.palette.forgerock.darkGray,opacity:0.5},certifyIcon:{color:theme.palette.forgerock.success},revokeIcon:{color:theme.palette.forgerock.danger},abstainIcon:{color:theme.palette.forgerock.warning},largeDialogContainer:{overflow:'scroll',width:'1000px'},linearProgressContainer:{paddingTop:theme.spacing(4)},radioButtonContainer:{display:'flex',flexDirection:'row',justifyContent:'space-evenly',margin:theme.spacing()},exceptionContainer:{display:'flex',flexDirection:'row',justifyContent:'space-evenly',spacing:2},exceptionDatePicker:{width:'100%'},exceptionLabel:{alignSelf:'center'},container:{display:'flex',flexWrap:'wrap'},certification:{minWidth:'400px',marginTop:theme.spacing(),marginBottom:theme.spacing()},dialog:{overflow:'scroll'},closeButton:{position:'absolute',right:theme.spacing(1),top:theme.spacing(1),color:theme.palette.grey[500]},navigateButton:{backgroundColor:theme.palette.forgerock.blue,borderColor:theme.palette.forgerock.blue,color:theme.palette.forgerock.white,'&:hover':{//you want this to be the same as the backgroundColor above
backgroundColor:theme.palette.forgerock.blue}},navigateButtonContainer:{display:'flex',justifyContent:'center'},violationButtonContainer:{display:'flex',justifyContent:'space-evenly',margin:theme.spacing(),paddingBottom:'20px'},violationFormContainer:{display:'flex',justifyContent:'center',margin:theme.spacing(),paddingBottom:'20px',width:'100%'},violationButton:{flexBasis:'30%'},violationForm:{width:'100%'},commentsForm:{width:'100%',paddingTop:theme.spacing()},commentButtonContainer:{display:'flex',justifyContent:'center',padding:theme.spacing(2)},detailsRow:{},detailsCommentRow:{},detailsCell:{border:'none',padding:theme.spacing(.5)},detailsCommentCell:{borderTop:'none!important',borderLeft:'1px solid'},selectedComments:{color:theme.palette.forgerock.blue,cursor:'pointer'},selectableComments:{cursor:'pointer'},violationViewContainer:{padding:theme.spacing(2)},detailsContainer:{paddingTop:'15px'}};};/* harmony default export */ var GovernanceDialog_styles = (GovernanceDialog_styles_styles);
// CONCATENATED MODULE: ./src/components/presentational/GovernanceDialog/ViewReassign.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var ViewReassign_ViewReassign=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(ViewReassign,_Component);function ViewReassign(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,ViewReassign);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(ViewReassign)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{chooseType:'user',reassignee:null});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"onSelectReassignee",function(event,field,value){if(_this.state.chooseType==='user'){if(!value||!value.key){_this.setState({reassignee:null});}else{var reassignee='managed/'+_this.state.chooseType+'/'+value.key;_this.setState({reassignee:reassignee});}}else{if(!value||!value._id){_this.setState({reassignee:null});}else{_this.setState({reassignee:value._id});}}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleChooseTypeChange",function(event,value){_this.setState({chooseType:value,reassignee:null});});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleSubmit",function(){_this.props.onSubmitDialog(_this.props.dialogType,_this.props.selectedRows,_this.state.reassignee);});return _this;}Object(createClass["a" /* default */])(ViewReassign,[{key:"componentWillUnmount",value:function componentWillUnmount(){}},{key:"componentDidUpdate",value:function componentDidUpdate(){}},{key:"render",value:function render(){var _this$props=this.props,t=_this$props.t,classes=_this$props.classes,takingAction=_this$props.takingAction;return/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true},takingAction?/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,direction:'column'},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true},/*#__PURE__*/react_default.a.createElement("h6",null,"Action Submited please stand by")," "),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true},/*#__PURE__*/react_default.a.createElement(LinearProgress["a" /* default */],null)," ")):null,/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,className:classes.radioButtonContainer,xs:12},/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{component:"fieldset"},/*#__PURE__*/react_default.a.createElement(RadioGroup["a" /* default */],{"aria-label":"reassignType",name:"reassignType",row:true,value:this.state.chooseType,onChange:this.handleChooseTypeChange},/*#__PURE__*/react_default.a.createElement(FormControlLabel["a" /* default */],{disabled:takingAction,value:"user",control:/*#__PURE__*/react_default.a.createElement(Radio["a" /* default */],null),label:"User"}),/*#__PURE__*/react_default.a.createElement(FormControlLabel["a" /* default */],{disabled:takingAction,value:"role",control:/*#__PURE__*/react_default.a.createElement(Radio["a" /* default */],null),label:"Role"})))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12},/*#__PURE__*/react_default.a.createElement(presentational_AsyncSelect,{id:"reassignSelector",targetType:this.state.chooseType==='user'?'userName':'authzGroup',fullWidth:true,label:t('choose-'+this.state.chooseType),name:"reassignSelector",variant:"outlined",onChange:this.onSelectReassignee,disabled:takingAction})),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12,className:classes.actionButtonContainer},/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{className:classes.actionButton,variant:"contained",color:"primary",onClick:this.handleSubmit,disabled:!this.state.reassignee||takingAction},t('btn-submit'))));}}]);return ViewReassign;}(react["Component"]);/* harmony default export */ var GovernanceDialog_ViewReassign = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(GovernanceDialog_styles))(ViewReassign_ViewReassign));
// EXTERNAL MODULE: ./node_modules/formik/dist/formik.esm.js + 5 modules
var formik_esm = __webpack_require__(54);

// EXTERNAL MODULE: ./node_modules/yup/es/index.js + 89 modules
var yup_es = __webpack_require__(14);

// EXTERNAL MODULE: ./node_modules/redux-storage/build/index.js
var build = __webpack_require__(199);

// EXTERNAL MODULE: ./node_modules/redux-storage-engine-localstorage/build/index.js
var redux_storage_engine_localstorage_build = __webpack_require__(282);
var redux_storage_engine_localstorage_build_default = /*#__PURE__*/__webpack_require__.n(redux_storage_engine_localstorage_build);

// EXTERNAL MODULE: ./node_modules/redux-logger/dist/redux-logger.js
var redux_logger = __webpack_require__(283);

// EXTERNAL MODULE: ./node_modules/redux-thunk/es/index.js
var redux_thunk_es = __webpack_require__(284);

// EXTERNAL MODULE: ./node_modules/redux-freeze/lib/middleware.js
var middleware = __webpack_require__(285);
var middleware_default = /*#__PURE__*/__webpack_require__.n(middleware);

// CONCATENATED MODULE: ./src/store/reducers/generic.reducer.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var initialState={notifications:[],message:'',error:false,activeGovernanceDialog:null,isDrawerOpen:false,isCreateModalOpen:false,isDialogOpen:false,createModalType:null,dialogType:null,dialogMessage:null,createModalMode:null,createModalTarget:null,takingAction:false};/* harmony default export */ var generic_reducer = (function(){var state=arguments.length>0&&arguments[0]!==undefined?arguments[0]:initialState;var action=arguments.length>1?arguments[1]:undefined;switch(action.type){case GENERIC.CHANGE_CONFIG:return Object(objectSpread["a" /* default */])({},state,{config:action.payload});case GENERIC.ENQUEUE_SNACKBAR:return Object(objectSpread["a" /* default */])({},state,{notifications:[].concat(Object(toConsumableArray["a" /* default */])(state.notifications),[Object(objectSpread["a" /* default */])({key:action.key},action.notification)])});case GENERIC.CLOSE_SNACKBAR:return Object(objectSpread["a" /* default */])({},state,{notifications:state.notifications.map(function(notification){return action.dismissAll||notification.key===action.key?Object(objectSpread["a" /* default */])({},notification,{dismissed:true}):Object(objectSpread["a" /* default */])({},notification);})});case GENERIC.REMOVE_SNACKBAR:var newNotifications=state.notifications.filter(function(notification){return notification.key!==action.key;});if(newNotifications.length===state.notifications.length){newNotifications=[];}return Object(objectSpread["a" /* default */])({},state,{notifications:newNotifications});case GENERIC.GET_CONFIG:return Object(objectSpread["a" /* default */])({},state,{config:action.payload});case GENERIC.CHANGE_IS_DRAWER_OPEN:return Object(objectSpread["a" /* default */])({},state,{isDrawerOpen:action.payload});case GENERIC.CHANGE_IS_CREATE_MODAL_OPEN:return Object(objectSpread["a" /* default */])({},state,{isCreateModalOpen:action.payload});case GENERIC.CHANGE_IS_DIALOG_OPEN:return Object(objectSpread["a" /* default */])({},state,{isDialogOpen:action.payload});case GENERIC.CHANGE_CREATE_MODAL_TYPE:var _action$payload=action.payload,createModalType=_action$payload.createModalType,createModalMode=_action$payload.createModalMode,createModalTarget=_action$payload.createModalTarget;return Object(objectSpread["a" /* default */])({},state,{createModalMode:createModalMode,createModalType:createModalType,createModalTarget:createModalTarget});case GENERIC.CHANGE_ACTIVE_GOVERNANCE_DIALOG:return Object(objectSpread["a" /* default */])({},state,{activeGovernanceDialog:action.payload});case GENERIC.CHANGE_DIALOG_MESSAGE:return Object(objectSpread["a" /* default */])({},state,{dialogMessage:action.payload});case GENERIC.CHANGE_DIALOG_TYPE:return Object(objectSpread["a" /* default */])({},state,{dialogType:action.payload});case GENERIC.CHANGE_MODAL_OBJECT:return Object(objectSpread["a" /* default */])({},state,{modalObject:action.payload});case GENERIC.QUERY_MODAL_OBJECT:return Object(objectSpread["a" /* default */])({},state,{queryingModalObject:true});case GENERIC.QUERY_MODAL_OBJECT_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{queryingModalObject:false,modalObject:action.payload});case GENERIC.QUERY_MODAL_OBJECT_FAILURE:return Object(objectSpread["a" /* default */])({},state,{queryingModalObject:false,modalObject:null});case GENERIC.UPDATE_TAKING_ACTION:return Object(objectSpread["a" /* default */])({},state,{takingAction:action.payload});default:return state;}});
// CONCATENATED MODULE: ./src/store/reducers/auth.reducer.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var auth_reducer_initialState={authModule:'',isLoggedIn:false,authenticationId:'',authorization:{},roles:[],error:false,message:''};/* harmony default export */ var auth_reducer = (function(){var state=arguments.length>0&&arguments[0]!==undefined?arguments[0]:auth_reducer_initialState;var action=arguments.length>1?arguments[1]:undefined;switch(action.type){case AUTH.FETCH_AUTH_MODULE_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{authModule:action.payload});case AUTH.FETCH_AUTH_MODULE_FAILURE:return Object(objectSpread["a" /* default */])({},state,{message:"".concat(action.payload.code,": ").concat(action.payload.message),error:true});case AUTH.AUTHENTICATION_SUCCESS:// eslint-disable-next-line no-case-declarations
var _action$payload=action.payload,authenticationId=_action$payload.authenticationId,authorization=_action$payload.authorization,roles=_action$payload.roles;return Object(objectSpread["a" /* default */])({},state,{authenticationId:authenticationId,authorization:authorization,roles:roles,isLoggedIn:true});case AUTH.AUTHENTICATION_FAILURE:return Object(objectSpread["a" /* default */])({},state,{isLoggedIn:false,message:"".concat(action.payload.code,": ").concat(action.payload.message),error:true});case AUTH.LOGOUT_SUCCESS:return Object(objectSpread["a" /* default */])({},auth_reducer_initialState,{authModule:state.authModule});case AUTH.LOGOUT_FAILURE:return Object(objectSpread["a" /* default */])({},state,{message:"".concat(action.payload.code,": ").concat(action.payload.message),error:true});default:return state;}});
// CONCATENATED MODULE: ./src/store/reducers/admin_dashboard.reducer.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var admin_dashboard_reducer_initialState={results:[],querying:false,queryingSingle:false,queryingEntitlement:true,queryingModalObject:false};/* harmony default export */ var admin_dashboard_reducer = (function(){var state=arguments.length>0&&arguments[0]!==undefined?arguments[0]:admin_dashboard_reducer_initialState;var action=arguments.length>1?arguments[1]:undefined;switch(action.type){case ADMIN_DASHBOARD.QUERY_DASHBOARD:return Object(objectSpread["a" /* default */])({},state,{querying:true});case ADMIN_DASHBOARD.QUERY_DASHBOARD_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{querying:false,results:action.payload.result.stats});case ADMIN_DASHBOARD.QUERY_DASHBOARD_FAILURE:return Object(objectSpread["a" /* default */])({},state,{querying:false,pagedResult:[]});case ADMIN_DASHBOARD.QUERY_DASHBOARD_SINGLE:return Object(objectSpread["a" /* default */])({},state,{queryingSingle:true});case ADMIN_DASHBOARD.QUERY_DASHBOARD_SINGLE_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{queryingSingle:false,results:action.payload});case ADMIN_DASHBOARD.QUERY_DASHBOARD_SINGLE_FAILURE:return Object(objectSpread["a" /* default */])({},state,{queryingSingle:false,results:action.payload});case ADMIN_DASHBOARD.QUERY_ENTITLEMENT:return Object(objectSpread["a" /* default */])({},state,{queryingEntitlement:true});case ADMIN_DASHBOARD.QUERY_ENTITLEMENT_SUCCESS:var entitlement=action&&action.payload?action.payload.result:null;return Object(objectSpread["a" /* default */])({},state,{queryingEntitlement:false,storedEntitlement:entitlement});case ADMIN_DASHBOARD.QUERY_ENTITLEMENT_FAILURE:return Object(objectSpread["a" /* default */])({},state,{queryingEntitlement:false,storedEntitlement:null});case ADMIN_DASHBOARD.QUERY_POLICY:return Object(objectSpread["a" /* default */])({},state,{queryingEntitlement:true});case ADMIN_DASHBOARD.QUERY_POLICY_SUCCESS:var policy=action&&action.payload?action.payload.result:null;return Object(objectSpread["a" /* default */])({},state,{queryingEntitlement:false,storedPolicy:policy});case ADMIN_DASHBOARD.QUERY_POLICY_FAILURE:return Object(objectSpread["a" /* default */])({},state,{queryingEntitlement:false,storedPolicy:null});default:return state;}});
// CONCATENATED MODULE: ./src/store/reducers/certs.reducer.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var certs_reducer_initialState={type:utils_constants.CERT_TYPE.USER,status:utils_constants.CERT_STATUS.ACTIVE,results:[],pageNumber:1,pageSize:10,sortBy:'name',sortDir:'asc',q:'',querying:false};/* harmony default export */ var certs_reducer = (function(){var state=arguments.length>0&&arguments[0]!==undefined?arguments[0]:certs_reducer_initialState;var action=arguments.length>1?arguments[1]:undefined;switch(action.type){case CERTS.CHANGE_CERT_TYPE:return Object(objectSpread["a" /* default */])({},state,{type:action.payload});case CERTS.CHANGE_CERT_STATUS:return Object(objectSpread["a" /* default */])({},state,{status:action.payload});case CERTS.UPDATE_PAGINATION:var _action$payload=action.payload,pageNumber=_action$payload.pageNumber,pageSize=_action$payload.pageSize,sortBy=_action$payload.sortBy,status=_action$payload.status;return Object(objectSpread["a" /* default */])({},state,{pageNumber:pageNumber,pageSize:pageSize,sortBy:sortBy,status:status});case CERTS.CHANGE_SORTING:return Object(objectSpread["a" /* default */])({},state,{sortBy:action.payload.sortBy,sortDir:action.payload.isDesc?'desc':'asc'});case CERTS.CHANGE_SEARCH_KEY:return Object(objectSpread["a" /* default */])({},state,{q:action.payload.q});case CERTS.QUERY_CERTS:return Object(objectSpread["a" /* default */])({},state,{querying:true});case CERTS.QUERY_CERTS_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{querying:false,results:action.payload});case CERTS.QUERY_CERTS_FAILURE:return Object(objectSpread["a" /* default */])({},state,{querying:false,results:[]});default:return state;}});
// CONCATENATED MODULE: ./src/store/reducers/certlist.reducer.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var certlist_reducer_initialState={certType:'',status:'',results:[],pageNumber:1,pageSize:10,sortBy:'firstName',sortDir:'asc',q:'',querying:false,ascOrder:true,certId:'',actingId:'managed/user/658b016e-9203-4408-90f5-204be6fc1064',events:[],stageSelected:0,eventIndexSelected:null,eventDetails:null,isAdminView:true,selectedAction:'',rowData:{},metadataObject:null};/* harmony default export */ var certlist_reducer = (function(){var state=arguments.length>0&&arguments[0]!==undefined?arguments[0]:certlist_reducer_initialState;var action=arguments.length>1?arguments[1]:undefined;switch(action.type){case CERTLIST.CHANGE_SELECTED_STAGE:return Object(objectSpread["a" /* default */])({},state,{stageSelected:action.payload});case CERTLIST.UPDATE_PAGINATION:var _action$payload=action.payload,ascOrder=_action$payload.ascOrder,pageNumber=_action$payload.pageNumber,pageSize=_action$payload.pageSize,sortBy=_action$payload.sortBy,stageSelected=_action$payload.stageSelected;return Object(objectSpread["a" /* default */])({},state,{pageNumber:pageNumber,pageSize:pageSize,sortBy:sortBy,ascOrder:ascOrder,stageSelected:stageSelected});case CERTLIST.CHANGE_SORTING:return Object(objectSpread["a" /* default */])({},state,{sortBy:action.payload.sortBy,sortDir:action.payload.isDesc?'desc':'asc'});case CERTLIST.QUERY_CERT_LIST:return Object(objectSpread["a" /* default */])({},state,{querying:true});case CERTLIST.UPDATE_CERTID:return Object(objectSpread["a" /* default */])({},state,{certId:action.payload.certId,certType:action.payload.certType});case CERTLIST.QUERY_CERT_LIST_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{querying:false,results:action.payload});case CERTLIST.QUERY_CERT_LIST_FAILURE:return Object(objectSpread["a" /* default */])({},state,{querying:false,results:[]});case CERTLIST.UPDATE_STATUS:return Object(objectSpread["a" /* default */])({},state,{status:action.payload});case CERTLIST.CHANGE_SEARCH_KEY:return Object(objectSpread["a" /* default */])({},state,{q:action.payload.q});case CERTLIST.SET_SELECTED_EVENT_INDEX:return Object(objectSpread["a" /* default */])({},state,{eventIndexSelected:action.payload});case CERTLIST.QUERY_EVENT_DETAILS:return Object(objectSpread["a" /* default */])({},state,{queryingEventDetails:true});case CERTLIST.QUERY_EVENT_DETAILS_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{queryingEventDetails:false,eventDetails:action.payload.data});case CERTLIST.QUERY_EVENT_DETAILS_REMOVE:return Object(objectSpread["a" /* default */])({},state,{queryingEventDetails:false,eventDetails:null});case CERTLIST.QUERY_EVENT_DETAILS_FAILURE:return Object(objectSpread["a" /* default */])({},state,{queryingEventDetails:false,eventDetails:null});case CERTLIST.QUERY_METADATA_OBJECT:return Object(objectSpread["a" /* default */])({},state,{queryingMetadata:true});case CERTLIST.QUERY_METADATA_OBJECT_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{queryingMetadata:false,metadataObject:action.payload});case CERTLIST.QUERY_METADATA_OBJECT_FAILURE:return Object(objectSpread["a" /* default */])({},state,{queryingMetadata:false,metadataObject:null});case CERTLIST.CHANGE_IS_ADMIN:return Object(objectSpread["a" /* default */])({},state,{isAdminView:action.payload});case CERTLIST.UPDATE_ACTINGID:return Object(objectSpread["a" /* default */])({},state,{actingId:action.payload});case CERTLIST.CHANGE_SELECTED_ACTION:return Object(objectSpread["a" /* default */])({},state,{selectedAction:action.payload});case CERTLIST.CHANGE_ROW_DATA:return Object(objectSpread["a" /* default */])({},state,{rowData:action.payload});default:return state;}});
// CONCATENATED MODULE: ./src/store/reducers/policies.reducer.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var policies_reducer_initialState={type:null,// status: IDG_CONSTANTS.CERT_STATUS.ACTIVE,
results:[],activeScans:[],pageNumber:1,pageSize:10,totalPagedResults:0,sortBy:'name',sortDir:'asc',// q: '',
querying:false,shouldQueryActiveScans:false,reactiveConfig:null};/* harmony default export */ var policies_reducer = (function(){var state=arguments.length>0&&arguments[0]!==undefined?arguments[0]:policies_reducer_initialState;var action=arguments.length>1?arguments[1]:undefined;switch(action.type){case POLICIES.QUERY_POLICIES:return Object(objectSpread["a" /* default */])({},state,{querying:true});case POLICIES.QUERY_POLICIES_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{querying:false},action.payload);case POLICIES.QUERY_POLICIES_FAILURE:return Object(objectSpread["a" /* default */])({},state,{querying:false,results:[],totalPagedResults:0});case POLICIES.CHANGE_SORTING:return Object(objectSpread["a" /* default */])({},state,{sortBy:action.payload.sortBy,sortDir:action.payload.isDesc?'desc':'asc'});case POLICIES.CHANGE_SEARCH_KEY:return Object(objectSpread["a" /* default */])({},state,{q:action.payload.q});case POLICIES.UPDATE_PAGINATION:var _action$payload=action.payload,pageNumber=_action$payload.pageNumber,pageSize=_action$payload.pageSize,sortBy=_action$payload.sortBy,status=_action$payload.status;return Object(objectSpread["a" /* default */])({},state,{pageNumber:pageNumber,pageSize:pageSize,sortBy:sortBy,status:status});case POLICIES.CHANGE_POLICY_TYPE:return Object(objectSpread["a" /* default */])({},state,{type:action.payload,results:[],totalPagedResults:0});case POLICIES.CHANGE_ACTIVE_SCANS_STATUS:return Object(objectSpread["a" /* default */])({},state,{shouldQueryActiveScans:action.payload});case POLICIES.QUERY_ACTIVE_SCANS:return Object(objectSpread["a" /* default */])({},state,{activeScans:action.payload});case POLICIES.GET_REACTIVE_SCAN_CONFIG:return Object(objectSpread["a" /* default */])({},state,{reactiveConfig:action.payload});default:return state;}});// {
//   "_id": "",
//   "activePolicyScans": [
//     {
//       "id": "AS Active Scan 2/18-2020-02-18T15:36:52.938Z",
//       "_id": "d8fab186-8ed7-414d-a083-0951ea66cba6",
//       "_rev": "84",
//       "complete": 83,
//       "total": 1118,
//       "name": "AS Active Scan 2/18",
//       "type": "adhoc",
//       "policies": [
//         {
//           "id": "6546ddc0-130d-435c-a165-9e2a94fd3ada",
//           "name": "AS Delete Policy 2/14"
//         }
//       ],
//       "targetType": "all",
//       "expirationDate": "02/21/2020",
//       "targetTypeDisplayName": "All users",
//       "targetNameDisplayName": "",
//       "progress": {
//         "complete": 83,
//         "total": 1118,
//         "percent": Math.ceil(83 / 1118 * 100),
//       }
//     }
//   ]
// }
// CONCATENATED MODULE: ./src/store/reducers/summary.reducer.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var summary_reducer_initialState={type:null,results:[],entitlements:{},userInfo:{},attrOrder:[],systems:[],pageNumber:1,pageSize:10,totalPagedResults:0,sortBy:'name',sortDir:'asc',// q: '',
querying:false,queryingEntitlement:false,user:{id:null,displayName:''}};/* harmony default export */ var summary_reducer = (function(){var state=arguments.length>0&&arguments[0]!==undefined?arguments[0]:summary_reducer_initialState;var action=arguments.length>1?arguments[1]:undefined;switch(action.type){case SUMMARY.QUERY_SUMMARY:return Object(objectSpread["a" /* default */])({},state,{querying:true});case SUMMARY.QUERY_SUMMARY_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{querying:false},action.payload);case SUMMARY.QUERY_SUMMARY_FAILURE:return Object(objectSpread["a" /* default */])({},state,{querying:false,results:[],totalPagedResults:0});case SUMMARY.QUERY_ENTITLEMENT:return Object(objectSpread["a" /* default */])({},state,{queryingEntitlement:true});case SUMMARY.QUERY_ENTITLEMENT_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{queryingEntitlement:false},action.payload);case SUMMARY.QUERY_ENTITLEMENT_FAILURE:return Object(objectSpread["a" /* default */])({},state,{queryingEntitlement:false,singleEntitlementHistory:{}});case SUMMARY.CHANGE_SORTING:return Object(objectSpread["a" /* default */])({},state,{sortBy:action.payload.sortBy,sortDir:action.payload.isDesc?'desc':'asc'});case SUMMARY.CHANGE_SEARCH_KEY:return Object(objectSpread["a" /* default */])({},state,{q:action.payload.q});case SUMMARY.UPDATE_PAGINATION:var _action$payload=action.payload,pageNumber=_action$payload.pageNumber,pageSize=_action$payload.pageSize,sortBy=_action$payload.sortBy,status=_action$payload.status;return Object(objectSpread["a" /* default */])({},state,{pageNumber:pageNumber,pageSize:pageSize,sortBy:sortBy,status:status});case SUMMARY.CHANGE_SUMMARY_TYPE:return Object(objectSpread["a" /* default */])({},state,{type:action.payload,results:[],totalPagedResults:0});case SUMMARY.UPDATE_USER:var user=summary_reducer_initialState.user;if(action.payload){user={id:action.payload.key,displayName:action.payload.displayName};}return Object(objectSpread["a" /* default */])({},state,{user:user});case SUMMARY.UPDATE_SYSTEMS:return Object(objectSpread["a" /* default */])({},state,{systems:action.payload.systems});default:return state;}});
// CONCATENATED MODULE: ./src/store/reducers/async_fields.reducer.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var async_fields_reducer_initialState={workflows:[],users:[],roles:[],results:[],scanPolicies:[]};/* harmony default export */ var async_fields_reducer = (function(){var state=arguments.length>0&&arguments[0]!==undefined?arguments[0]:async_fields_reducer_initialState;var action=arguments.length>1?arguments[1]:undefined;switch(action.type){case ASYNC_FIELDS.QUERY_WORKFLOWS:return Object(objectSpread["a" /* default */])({},state,{workflows:[]});case ASYNC_FIELDS.QUERY_WORKFLOWS_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{workflows:action.payload});case ASYNC_FIELDS.QUERY_USERS:return Object(objectSpread["a" /* default */])({},state,{users:[]});case ASYNC_FIELDS.QUERY_USERS_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{users:action.payload});case ASYNC_FIELDS.QUERY_ROLES:return Object(objectSpread["a" /* default */])({},state,{roles:[]});case ASYNC_FIELDS.QUERY_ROLES_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{roles:action.payload});case ASYNC_FIELDS.QUERY_TYPEAHEAD:return Object(objectSpread["a" /* default */])({},state,{results:[]});case ASYNC_FIELDS.QUERY_TYPEAHEAD_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{results:action.payload});case ASYNC_FIELDS.QUERY_SCAN_POLICIES:return Object(objectSpread["a" /* default */])({},state,{scanPolicies:[]});case ASYNC_FIELDS.QUERY_SCAN_POLICIES_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{scanPolicies:action.payload});default:return state;}});
// CONCATENATED MODULE: ./src/store/reducers/config.reducer.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var config_reducer_initialState={IDM_version:null,managed_objects:{},applications:{},certifiable_attributes:{user:[],application:[]},membership_properties:null,settings:{querying:false,results:[],about:{}},notifications:{querying:false,results:[],selected:{id:'',notification:{}}}};/* harmony default export */ var config_reducer = (function(){var state=arguments.length>0&&arguments[0]!==undefined?arguments[0]:config_reducer_initialState;var action=arguments.length>1?arguments[1]:undefined;switch(action.type){case CONFIG.GET_IDM_VERSION:return Object(objectSpread["a" /* default */])({},state,{IDM_version:action.payload});case CONFIG.GET_CONFIG_MANAGED_OBJECTS:return Object(objectSpread["a" /* default */])({},state,{managed_objects:action.payload});case CONFIG.GET_CONFIG_APPLICATIONS:return Object(objectSpread["a" /* default */])({},state,{applications:action.payload});case CONFIG.GET_CERTIFIABLE_ATTRIBUTES:return Object(objectSpread["a" /* default */])({},state,{certifiable_attributes:Object(objectSpread["a" /* default */])({},state.certifiable_attributes,Object(defineProperty["a" /* default */])({},action.payload.classType,action.payload.data))});case CONFIG.GET_MEMBERSHIP_PROPERTIES:return Object(objectSpread["a" /* default */])({},state,{membership_properties:action.payload});case actionTypes_SETTINGS.QUERY_SETTINGS:return Object(objectSpread["a" /* default */])({},state,{settings:Object(objectSpread["a" /* default */])({},state.settings,{querying:true})});case actionTypes_SETTINGS.QUERY_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{settings:Object(objectSpread["a" /* default */])({},state.settings,{querying:false,results:action.payload})});case actionTypes_SETTINGS.QUERY_FAILURE:return Object(objectSpread["a" /* default */])({},state,{settings:Object(objectSpread["a" /* default */])({},state.settings,{querying:false,results:null})});case actionTypes_SETTINGS.QUERY_INFO:return Object(objectSpread["a" /* default */])({},state,{settings:Object(objectSpread["a" /* default */])({},state.settings,{querying:true})});case actionTypes_SETTINGS.QUERY_INFO_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{settings:Object(objectSpread["a" /* default */])({},state.settings,{querying:false,about:action.payload})});case actionTypes_SETTINGS.QUERY_INFO_FAILURE:return Object(objectSpread["a" /* default */])({},state,{settings:Object(objectSpread["a" /* default */])({},state.settings,{querying:false,about:null})});case NOTIFICATIONS.QUERY_ALL:return Object(objectSpread["a" /* default */])({},state,{notifications:Object(objectSpread["a" /* default */])({},state.notifications,{querying:true})});case NOTIFICATIONS.QUERY_ALL_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{notifications:Object(objectSpread["a" /* default */])({},state.notifications,{results:action.payload,querying:false})});case NOTIFICATIONS.QUERY_ALL_FAILURE:return Object(objectSpread["a" /* default */])({},state,{notifications:Object(objectSpread["a" /* default */])({},state.notifications,{results:null,querying:false})});case NOTIFICATIONS.QUERY_SELECTED:return Object(objectSpread["a" /* default */])({},state,{notifications:Object(objectSpread["a" /* default */])({},state.notifications,{querying:true})});case NOTIFICATIONS.SET_SELECTED:return Object(objectSpread["a" /* default */])({},state,{notifications:Object(objectSpread["a" /* default */])({},state.notifications,{selected:Object(objectSpread["a" /* default */])({},state.notifications.selected,{id:action.payload})})});case NOTIFICATIONS.QUERY_SELECTED_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{notifications:Object(objectSpread["a" /* default */])({},state.notifications,{selected:Object(objectSpread["a" /* default */])({},state.notifications.selected,{notification:action.payload}),querying:false})});case NOTIFICATIONS.QUERY_SELECTED_FAILURE:return Object(objectSpread["a" /* default */])({},state,{notifications:Object(objectSpread["a" /* default */])({},state.notifications,{selected:Object(objectSpread["a" /* default */])({},state.notifications.selected,{notification:null}),querying:false})});default:return state;}});
// CONCATENATED MODULE: ./src/store/reducers/dashboard.reducer.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var dashboard_reducer_initialState={type:utils_constants.CERT_TYPE.USER,status:utils_constants.CERT_STATUS.ACTIVE,results:[],pageNumber:1,pageSize:10,sortBy:'deadline',sortDir:'desc',q:'',querying:false};/* harmony default export */ var dashboard_reducer = (function(){var state=arguments.length>0&&arguments[0]!==undefined?arguments[0]:dashboard_reducer_initialState;var action=arguments.length>1?arguments[1]:undefined;switch(action.type){case DASHBOARD.QUERY_DASHBOARD:return Object(objectSpread["a" /* default */])({},state,{querying:true});case DASHBOARD.QUERY_DASHBOARD_SUCCESS:return Object(objectSpread["a" /* default */])({},state,{querying:false,results:action.payload});case DASHBOARD.QUERY_DASHBOARD_FAILURE:return Object(objectSpread["a" /* default */])({},state,{querying:false,results:action.payload});case DASHBOARD.UPDATE_STATUS:return Object(objectSpread["a" /* default */])({},state,{pageNumber:1,status:action.payload});case DASHBOARD.UPDATE_TYPE:return Object(objectSpread["a" /* default */])({},state,{pageNumber:1,type:action.payload});case DASHBOARD.CHANGE_SEARCH_KEY:return Object(objectSpread["a" /* default */])({},state,{q:action.payload.q});case DASHBOARD.CHANGE_SORTING:return Object(objectSpread["a" /* default */])({},state,{sortBy:action.payload.sortBy,sortDir:action.payload.isDesc?'desc':'asc'});case DASHBOARD.UPDATE_PAGINATION:var _action$payload=action.payload,pageNumber=_action$payload.pageNumber,pageSize=_action$payload.pageSize,sortBy=_action$payload.sortBy,status=_action$payload.status;return Object(objectSpread["a" /* default */])({},state,{pageNumber:pageNumber,pageSize:pageSize,sortBy:sortBy,status:status});case DASHBOARD.ACT_ON_VIOLATION:return{};case DASHBOARD.COMMENT_VIOLATION:return{};default:return state;}});
// CONCATENATED MODULE: ./src/store/reducers/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var reducers = (Object(redux["c" /* combineReducers */])({generic:generic_reducer,auth:auth_reducer,admin_dashboard:admin_dashboard_reducer,certs:certs_reducer,certlist:certlist_reducer,policies:policies_reducer,summary:summary_reducer,async_fields:async_fields_reducer,config:config_reducer,dashboard:dashboard_reducer}));
// CONCATENATED MODULE: ./src/store/actions/certs.actions.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var certs_actions_getCertifications=function getCertifications(){return function(dispatch,getState){dispatch({type:CERTS.QUERY_CERTS,payload:null});var _getState$certs=getState().certs,status=_getState$certs.status,pageNumber=_getState$certs.pageNumber,pageSize=_getState$certs.pageSize,sortBy=_getState$certs.sortBy,sortDir=_getState$certs.sortDir,q=_getState$certs.q,type=_getState$certs.type;if(!type){return;}var certEndpoint=certs_actions_getEndpointForCertType(type,status);var params={status:status,pageNumber:pageNumber,pageSize:pageSize,sortBy:sortBy,q:q};if(params.q){params.q=params.q.replace(/\\/g,'\\\\').replace(/"/g,'\\"');}params.sortBy=sortDir==='asc'?"+".concat(sortBy):"-".concat(sortBy);return httpService.request({url:certEndpoint,method:'get',params:params}).then(function(_ref){var data=_ref.data;dispatch({type:CERTS.QUERY_CERTS_SUCCESS,payload:data.result});}).catch(function(error){dispatch({type:CERTS.QUERY_CERTS_FAILURE,payload:null});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var certs_actions_cancelCertifications=function cancelCertifications(certIds){return function(dispatch,getState){// CANCEL_CERTS
var requestUrl='';var _getState$certs2=getState().certs,status=_getState$certs2.status,type=_getState$certs2.type;if(status===utils_constants.CERT_STATUS.ACTIVE){requestUrl=utils_constants.IDM_CONTEXT+'/governance/adminCancelCert/'+type;}else{requestUrl=certs_actions_getEndpointForCertType(type,status);requestUrl+='?_action=delete';}return httpService.request({url:requestUrl,method:'post',data:{ids:certIds}}).then(function(_ref2){var result=_ref2.data.result;dispatch(generic_actions_alert(result,'success'));dispatch(certs_actions_getCertifications());return result;}).catch(function(error){return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var certs_actions_createCertification=function createCertification(certForm){return function(dispatch){var creationEndpoint=null;var objectType=certForm.certObjectType==='user'?'user':'object';if(certForm.frequency==='scheduled'){creationEndpoint="scheduledCertification/".concat(objectType);}else if(certForm.frequency==='event-based'){creationEndpoint="triggeredCertification/".concat(objectType);}else{creationEndpoint='certification/create';}var successMessage=i18n.t('create-cert-success');return httpService.request({url:"".concat(utils_constants.IDM_CONTEXT,"/governance/").concat(creationEndpoint),method:'post',params:{_action:'create'},data:certForm}).then(function(_ref3){var data=_ref3.data;dispatch(generic_actions_alert(successMessage,'success'));dispatch(certs_actions_getCertifications());return data.content;}).catch(function(error){return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var certs_actions_editCertification=function editCertification(certForm,certId){return function(dispatch){var creationEndpoint=null;var successMessage=i18n.t('update-cert-success');var objectType=certForm.certObjectType==='user'?'user':'object';if(certForm.frequency==='scheduled'){creationEndpoint="scheduledCertification/".concat(objectType);}else if(certForm.frequency==='event-based'){creationEndpoint="triggeredCertification/".concat(objectType);}if(!creationEndpoint||!certId){return null;}return httpService.request({url:"".concat(utils_constants.IDM_CONTEXT,"/governance/").concat(creationEndpoint,"/").concat(certId),method:'post',params:{_action:'update'},data:certForm}).then(function(_ref4){var data=_ref4.data;dispatch(generic_actions_alert(successMessage,'success'));dispatch(certs_actions_getCertifications());return data;}).catch(function(error){dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));return error;});};};var certs_actions_changeCertType=function changeCertType(type,noUpdate){return function(dispatch){dispatch({type:CERTS.CHANGE_CERT_TYPE,payload:type});if(!noUpdate){dispatch(certs_actions_getCertifications());}};};var certs_actions_changeCertStatus=function changeCertStatus(status,noUpdate){return function(dispatch){dispatch({type:CERTS.CHANGE_CERT_STATUS,payload:status});if(!noUpdate){dispatch(certs_actions_getCertifications());}};};var certs_actions_changeSortKey=function changeSortKey(sortBy,isDesc,noUpdate){return function(dispatch){dispatch({type:CERTS.CHANGE_SORTING,payload:{sortBy:sortBy,isDesc:isDesc}});if(!noUpdate){dispatch(certs_actions_getCertifications());}};};var certs_actions_changeSearchKey=function changeSearchKey(q,noUpdate){return function(dispatch){dispatch({type:CERTS.CHANGE_SEARCH_KEY,payload:{q:q}});if(!noUpdate){dispatch(certs_actions_getCertifications());}};};var certs_actions_updatePagination=function updatePagination(params,noUpdate){return function(dispatch){dispatch({type:CERTS.UPDATE_PAGINATION,payload:params});if(!noUpdate){dispatch(certs_actions_getCertifications());}};};var certs_actions_getEndpointForCertType=function getEndpointForCertType(type,status){if(type===utils_constants.CERT_TYPE.USER){switch(status){case utils_constants.CERT_STATUS.ACTIVE:case utils_constants.CERT_STATUS.CLOSED:return utils_constants.IDM_CONTEXT+'/governance/adminCertification/user';case utils_constants.CERT_STATUS.SCHEDULED:return utils_constants.IDM_CONTEXT+'/governance/scheduledCertification/user';case utils_constants.CERT_STATUS.TRIGGERED:return utils_constants.IDM_CONTEXT+'/governance/triggeredCertification/user';default:return utils_constants.IDM_CONTEXT+'/governance/adminCertification/user';}}else if(type===utils_constants.CERT_TYPE.OBJECT){switch(status){case utils_constants.CERT_STATUS.ACTIVE:case utils_constants.CERT_STATUS.CLOSED:return utils_constants.IDM_CONTEXT+'/governance/adminCertification/object';case utils_constants.CERT_STATUS.SCHEDULED:return utils_constants.IDM_CONTEXT+'/governance/scheduledCertification/object';case utils_constants.CERT_STATUS.TRIGGERED:return utils_constants.IDM_CONTEXT+'/governance/triggeredCertification/object';default:return utils_constants.IDM_CONTEXT+'/governance/adminCertification/object';}}};
// CONCATENATED MODULE: ./src/store/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var logger,redux_devtools=null;// note that environment variables are strings not booleans
if(undefined==='true'){logger=Object(redux_logger["createLogger"])();}if(false){}var reducer=build["reducer"](reducers);var engine=redux_storage_engine_localstorage_build_default()('GOVERNANCE');var reactStorageMiddleware=build["createMiddleware"](engine,SHOULD_NOT_SAVE,SHOULD_SAVE);var store_middleware=lodash_default.a.compact([redux_thunk_es["a" /* default */],middleware_default.a,reactStorageMiddleware,logger]);var createStoreWithMiddleware=redux["a" /* applyMiddleware */].apply(void 0,Object(toConsumableArray["a" /* default */])(store_middleware))(redux["e" /* createStore */]);var store_store=redux_devtools?createStoreWithMiddleware(reducer,redux_devtools()):createStoreWithMiddleware(reducer);var load=build["createLoader"](engine);load(store_store).then(function(newState){store_store.dispatch(generic_actions_updateTakingAction(false));store_store.dispatch(generic_actions_changeActiveGovernanceDialog(null));store_store.dispatch(generic_actions_changeModalObject(null));store_store.dispatch(certs_actions_changeCertType(null,true));store_store.dispatch(dashboard_actions_updateType(null,true));store_store.dispatch(dashboard_actions_updateStatus(null,true));// store.dispatch({ type: GENERIC.RESET_LOADING_STATUS });
});/* harmony default export */ var src_store = (store_store);
// CONCATENATED MODULE: ./src/utils/schemas.js
yup_es["addMethod"](yup_es["date"],'format',function(){return this.transform(function(value,originalValue){if(this.isType(value))return value;value=moment_default()(originalValue);return value.isValid()?value.toDate():new Date('');});});var schemas_validateEscalationDuration=function validateEscalationDuration(compareDuration,toCheckDuration){if(compareDuration&&lodash_default.a.isInteger(compareDuration.unit)&&compareDuration.period.length){if(toCheckDuration.unit&&toCheckDuration.period){if(compareDuration.period===toCheckDuration.period){return toCheckDuration.unit<compareDuration.unit;}else if(compareDuration.period==='weeks'){return toCheckDuration.unit<compareDuration.unit*7;}else if(compareDuration.period==='days'){return toCheckDuration.unit*7<compareDuration.unit;}}else if(!toCheckDuration.unit&&!toCheckDuration.period){return true;}else{return false;}}return true;};var schemas_validateExpression=function validateExpression(expr){var objSchema=yup_es["object"]({targetName:yup_es["string"]().required(),targetValue:yup_es["string"]().required()});if(lodash_default.a.isArray(expr)){var schema=yup_es["array"]().of(yup_es["object"]({operator:yup_es["string"]().oneOf(['ALL','AND','OR','NOT','EQUALS','CONTAINS','LINKEDTO']).required(),operand:yup_es["lazy"](function(value){return lodash_default.a.isArray(value)?schema:objSchema;})}));return schema;}else{return objSchema;}};var schemas_policyForm=function policyForm(values){return[{id:'name',label:'policy name',type:'text',isDisplayed:true,validationType:'string',isStringified:false,value:'',validations:[{type:'required',params:[i18n.t('form-error-required')]}]},{id:'description',label:'Policy Description',type:'text',isDisplayed:true,validationType:'string',isStringified:false,value:'',validations:[]},{id:'expression',label:'Policy Expression',type:'expression',isDisplayed:true,dialogView:true,validationType:'object',isStringified:true,value:{},validations:[{type:'required',params:[i18n.t('form-error-required')]},{type:'shape',params:[{operator:yup_es["string"]().required(),operand:yup_es["lazy"](function(expr){return schemas_validateExpression(expr);})}]}]},{id:'riskLevel',label:'Risk Level',type:'range',isDisplayed:true,validationType:'number',isStringified:true,value:1,validations:[{type:'nullable',params:[]},{type:'min',params:[0,i18n.t('form-error-risk-level-min')]},{type:'max',params:[10,i18n.t('form-error-risk-level-max')]}]},{id:'ownerType',label:'owner type',type:'select',isDisplayed:true,validationType:'string',isStringified:false,value:'',options:[{key:'user',displayName:'User'},{key:'authzGroup',displayName:'Group'}],validations:[{type:'oneOf',params:[['user','authzGroup']]},{type:'required',params:[i18n.t('form-error-required')]}]},{id:'owner',label:'Policy Owner',type:'typeahead',targetType:values&&values.ownerType&&values.ownerType==='authzGroup'?'authzGroup':'userName',isDisplayed:values&&values.ownerType,validationType:'string',isStringified:false,value:'',validations:[{type:'required',params:[i18n.t('form-error-required')]},{type:'nullable',params:['false']}]},{id:'remediationProcess',label:'violation remediation task',type:'select',isDisplayed:true,validationType:'string',isStringified:false,value:'',options:[],onLoad:'getWorkflowOptions',stateProp:'workflows',validations:[]},{id:'active',label:'active',type:'checkbox',isDisplayed:true,validationType:'boolean',isStringified:true,value:true,validations:[]}];};var schemas_policyScanForm=function policyScanForm(values){return[{id:'name',label:'policy scan name',type:'text',isDisplayed:true,validationType:'string',isStringified:false,value:'',validations:[{type:'required',params:[i18n.t('form-error-required')]}]},{id:'scanType',label:'trigger',type:'select',isDisplayed:true,validationType:'string',isStringified:false,value:'',options:[{key:'ad-hoc',displayName:'ad-hoc'},{key:'scheduled',displayName:'scheduled'}],validations:[{type:'oneOf',params:[['ad-hoc','scheduled']]},{type:'required',params:[i18n.t('form-error-required')]}]},{id:'schedule',label:'scan schedule',type:'schedule',isDisplayed:values&&values.scanType==='scheduled',validationType:'string',isStringified:false,value:'',validations:values&&values.scanType==='scheduled'?[{type:'required',params:[i18n.t('form-error-required')]}]:[]},{id:'targetFilter',label:'User Filter',type:'expression',isDisplayed:true,dialogView:true,validationType:'object',isStringified:true,value:{},validations:[{type:'required',params:[i18n.t('form-error-required')]},{type:'shape',params:[{operator:yup_es["string"]().required(),operand:yup_es["lazy"](function(expr){return schemas_validateExpression(expr);})}]}]},{id:'policies',label:'select policies',type:'transfer-list',isDisplayed:true,validationType:'array',isStringified:false,value:[],validations:[{type:'min',params:[1,i18n.t('form-error-required')]},{type:'required',params:[i18n.t('form-error-required')]}]},{id:'expirationDate',label:'Expiration Date',type:'date',disablePast:true,disableFuture:false,minDate:moment_default()(),isDisplayed:values&&values.scanType==='ad-hoc',validationType:'date',isStringified:false,value:null,validations:[{type:'nullable',params:['false']},{type:'when',params:['scanType',{is:'ad-hoc',then:yup_es["date"]().required(),otherwise:yup_es["date"]().notRequired()}]},{type:'min',params:[moment_default()(),i18n.t('datepicker-min-expiration-date')]}]},{id:'expirationDuration',label:'Expiration Date',type:'duration',isDisplayed:values&&values.scanType==='scheduled',validationType:'object',isStringified:false,value:{unit:1,period:'days'},validations:[{type:'nullable',params:['false']},{type:'when',params:['scanType',{'is':'scheduled',then:yup_es["object"]().required(),otherwise:yup_es["object"]().notRequired()}]},{type:'shape',params:[{unit:yup_es["number"]().typeError(i18n.t('datepicker-invalid-expiration-unit')).required(),period:yup_es["string"]().min(1).required(i18n.t('datepicker-invalid-expiration-period'))}]}]},{id:'escalationSchedule',label:'escalation schedule',type:'escalation',isDisplayed:true,validationType:'array',isStringified:false,value:[],validations:[{type:'of',params:[yup_es["object"]().shape({unit:yup_es["number"]().typeError(i18n.t('datepicker-invalid-expiration-unit')).min(1,i18n.t('datepicker-invalid-expiration-unit')).required(i18n.t('form-error-required')),period:yup_es["string"]().oneOf(['days','weeks'],i18n.t('datepicker-invalid-expiration-period')).required(i18n.t('datepicker-invalid-expiration-period')),escalationType:yup_es["string"]().oneOf(['user','authzGroup','manager']).required(),escalationId:yup_es["object"]().when('escalationType',{is:function is(val){return val==='user'||val==='authzGroup';},then:yup_es["object"]().required(),otherwise:yup_es["object"]().nullable()})})]}]}];};var schemas_configureReactiveScansForm=function configureReactiveScansForm(values){return[{id:'expirationDate',label:'Expiration Date',type:'duration',isDisplayed:true,validationType:'object',isStringified:false,value:{unit:'',period:''},validations:[{type:'required',params:[i18n.t('form-error-required')]},{type:'shape',params:[{unit:yup_es["number"]().typeError(i18n.t('datepicker-invalid-expiration-unit')).required(i18n.t('form-error-required')),period:yup_es["string"]().min(1).required(i18n.t('datepicker-invalid-expiration-period'))}]}]},{id:'escalationSchedule',label:'escalation schedule',type:'escalation',isDisplayed:true,validationType:'array',isStringified:false,value:[],validations:[{type:'of',params:[yup_es["object"]().shape({unit:yup_es["number"]().typeError(i18n.t('datepicker-invalid-expiration-unit')).min(1,i18n.t('datepicker-invalid-expiration-unit')).required(i18n.t('form-error-required')),period:yup_es["string"]().oneOf(['days','weeks'],i18n.t('datepicker-invalid-expiration-period')).required(i18n.t('datepicker-invalid-expiration-period')),escalationType:yup_es["string"]().oneOf(['user','authzGroup','manager']).required(),escalationId:yup_es["object"]().when('escalationType',{is:function is(val){return val==='user'||val==='authzGroup';},then:yup_es["object"]().required(),otherwise:yup_es["object"]().nullable()})})]}]}];};var schemas_userCertForm=function userCertForm(values){return[{id:'certObjectType',label:'certification type',type:'select',isDisplayed:false,validationType:'string',isStringified:false,value:'object',options:[{key:'user',displayName:'User'},{key:'object',displayName:'Object'}],validations:[{type:'oneOf',params:[['user','object']]},{type:'required',params:[i18n.t('form-error-required')]}]},{id:'name',label:'certification name',type:'text',isDisplayed:true,validationType:'string',isStringified:false,value:'',validations:[{type:'required',params:[i18n.t('form-error-required')]}]},{id:'description',label:'description',type:'text',isDisplayed:true,validationType:'string',isStringified:false,value:'',validations:[]},{id:'frequency',label:'trigger',type:'select',isDisplayed:true,validationType:'string',isStringified:false,value:'',options:[{key:'ad-hoc',displayName:'Ad-hoc'},{key:'scheduled',displayName:'Scheduled'},{key:'event-based',displayName:'Event-based'}],validations:[{type:'oneOf',params:[['ad-hoc','scheduled','event-based']]},{type:'required',params:[i18n.t('form-error-required')]}]},{id:'schedule',label:'repeat event',type:'schedule',isDisplayed:values&&values.frequency==='scheduled',validationType:'string',isStringified:false,value:'',validations:[{type:'when',params:['frequency',{is:'scheduled',then:yup_es["string"]().required(i18n.t('form-error-required')),otherwise:yup_es["string"]().notRequired()}]}]},{id:'targetObjectType',label:'Target Object Type',type:'select',isDisplayed:values&&values.certObjectType!=='user',validationType:'string',isStringified:false,value:values&&values.certObjectType==='user'?'user':'',options:getTargetTypeOptionsFromStore(values?values.certObjectType:null),validations:[{type:'required',params:[i18n.t('form-error-required')]}]},{id:'expression',label:'Event Trigger',type:'eventExpression',isDisplayed:values&&values.frequency==='event-based',validationType:'object',isStringified:true,value:{},validations:[{type:'when',params:['frequency',{is:'event-based',then:yup_es["object"]().shape({operator:yup_es["string"]().required(),operand:yup_es["mixed"]().required()}).required(i18n.t('form-error-required')),otherwise:yup_es["object"]()}]}]},{id:'targetFilter',label:'Target Filter',type:'expression',isDisplayed:values&&values.frequency?values.frequency!=='event-based':true,dialogView:false,validationType:'object',isStringified:true,value:{},validations:[{type:'when',params:['frequency',function(frequency,schema){if(frequency==='event-based'){schema=yup_es["object"]().notRequired();}else{schema=yup_es["object"]().shape({operator:yup_es["string"]().required(),operand:yup_es["lazy"](function(expr){return schemas_validateExpression(expr);})}).required(i18n.t('form-error-required'));}return schema;}]}]},{id:'stages',label:'certification stages',type:'stages',isDisplayed:true,validationType:'array',isStringified:true,value:[],validations:[{type:'when',params:['frequency',function(frequency,schema){return schema.of(stageSchema(frequency));}]},{type:'required',params:[i18n.t('form-error-required')]},{type:'min',params:[1]}]},{id:'defaultCertifierType',label:'default certifier',type:'select',isDisplayed:true,validationType:'string',isStringified:false,value:'none',options:[{key:'none',displayName:'None'},{key:'user',displayName:'User'},{key:'authzGroup',displayName:'Group'}],validations:[{type:'oneOf',params:[['none','user','authzGroup']]},{type:'required',params:[i18n.t('form-error-required')]}]},{id:'defaultCertifierName',label:'choose default certifier',type:'typeahead',targetType:values&&values.defaultCertifierType&&values.defaultCertifierType==='authzGroup'?'authzGroup':'userName',isDisplayed:values&&values.defaultCertifierType!=='none',validationType:'string',isStringified:false,value:'',validations:[{type:'nullable',params:['false']},{type:'when',params:['defaultCertifierType',{is:function is(val){return val!=='none';},then:yup_es["string"]().required(i18n.t('form-error-required')),otherwise:yup_es["string"]().notRequired()}]}]},{id:'onExpire',label:'on stage expiration',type:'select',isDisplayed:true,validationType:'string',isStringified:false,value:'stageOnly',options:[{key:'stageOnly',displayName:'Continue Certification'},{key:'entireCert',displayName:'Expire Throughout'}],validations:[{type:'oneOf',params:[['stageOnly','entireCert']]},{type:'required',params:[i18n.t('form-error-required')]}]},{id:'remediationProcess',label:'post certification workflow',type:'select',isDisplayed:true,validationType:'string',isStringified:false,value:'none',options:[{key:'none',displayName:'None'}],onLoad:'getWorkflowOptions',stateProp:'workflows',validations:[]}];};function getTargetTypeOptionsFromStore(certObjectType){var targetTypeOptions=[{key:'',displayName:''}];var config=src_store.getState().config;if(certObjectType&&certObjectType==='user'){targetTypeOptions.push({key:'user',displayName:'user'});}else if(config&&config.managed_objects){Object.entries(config.managed_objects).map(function(_ref){var _ref2=Object(slicedToArray["a" /* default */])(_ref,1),key=_ref2[0];if(key!=='user'){targetTypeOptions.push({key:key,displayName:key});}});}return targetTypeOptions;}function stageSchema(frequency){var objSchema=yup_es["object"]().shape({name:yup_es["string"]().required(),entitlementFilter:yup_es["object"]().required(),useRiskLevel:yup_es["bool"](),certifierType:yup_es["string"]().oneOf(['user','authzGroup','manager','prevManager','entitlementOwner','glossaryKey']).required(),certifierName:yup_es["string"]().when('certifierType',function(certifierType,schema){return certifierType==='user'||certifierType==='authzGroup'?schema.required():schema.notRequired();}),certifierKey:yup_es["string"]().when('certifierType',function(certifierType,schema){return certifierType==='glossaryKey'?schema.required():schema.notRequired();}),riskLevel:yup_es["object"]().shape({Low:yup_es["bool"](),Medium:yup_es["bool"](),High:yup_es["bool"]()}).when('useRiskLevel',function(useRiskLevel,schema){if(useRiskLevel){return schema.test({name:'risk-level-valid',test:function test(value){var Low=value.Low,Medium=value.Medium,High=value.High;if(!Low&&!Medium&&!High){return this.createError({message:i18n.t('stage-builder-risk-level-error')});}return true;}});}return schema;}),escalationSchedule:yup_es["array"]().of(yup_es["object"]().shape({unit:yup_es["number"]().typeError(i18n.t('datepicker-invalid-expiration-unit')).min(1,i18n.t('datepicker-invalid-expiration-unit')).required(i18n.t('form-error-required')),period:yup_es["string"]().oneOf(['days','weeks'],i18n.t('datepicker-invalid-expiration-period')).required(i18n.t('datepicker-invalid-expiration-period')),escalationType:yup_es["string"]().oneOf(['user','authzGroup','manager']).required(),escalationId:yup_es["object"]().when('escalationType',{is:function is(val){return val==='user'||val==='authzGroup';},then:yup_es["object"]().required(),otherwise:yup_es["object"]().nullable()})})).test({name:'stage-escalation-valid',test:function test(value){for(var i=value.length-1;i>=0;i--){var escSchedule=value[i];var prevIdx=i-1;if(prevIdx>=0&&escSchedule.unit&&escSchedule.period){var isValid=schemas_validateEscalationDuration(value[prevIdx],escSchedule);if(!isValid){return this.createError({path:"".concat(this.path,"[").concat(i,"].unit"),message:i18n.t('datepicker-invalid-subsequent-escalation')});}}}return true;}})});var deadlineSchema=null;if(frequency==='ad-hoc'){deadlineSchema=yup_es["object"]().shape({deadline:yup_es["date"]().required(i18n.t('form-error-required')).min(moment_default()(),i18n.t('datepicker-min-expiration-date'))});}else{deadlineSchema=yup_es["object"]().shape({deadlineDuration:yup_es["object"]().shape({unit:yup_es["number"]().typeError(i18n.t('datepicker-invalid-expiration-unit')).required(),period:yup_es["string"]().min(1).required(i18n.t('datepicker-invalid-expiration-period'))})});}if(deadlineSchema){objSchema=objSchema.concat(deadlineSchema);}return objSchema;}function createYupSchema(schema,config){var id=config.id,validationType=config.validationType,_config$validations=config.validations,validations=_config$validations===void 0?[]:_config$validations;if(!yup_es[validationType]){return schema;}var validator=yup_es[validationType]();validations.forEach(function(validation){var _validator;var params=validation.params,type=validation.type;if(!validator[type]){return;}validator=(_validator=validator)[type].apply(_validator,Object(toConsumableArray["a" /* default */])(params));});schema[id]=validator;return schema;}
// CONCATENATED MODULE: ./src/store/actions/policies.actions.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var policies_actions_getPolicies=function getPolicies(){return function(dispatch,getState){dispatch({type:POLICIES.QUERY_POLICIES,payload:null});var _getState$policies=getState().policies,pageNumber=_getState$policies.pageNumber,pageSize=_getState$policies.pageSize,q=_getState$policies.q,sortBy=_getState$policies.sortBy,sortDir=_getState$policies.sortDir,type=_getState$policies.type;var endpointResource=getPolicyEndpointByType(type);var status=getStatusByType(type);var url=utils_constants.IDM_CONTEXT+'/governance/adminPolicy/'+endpointResource;if(endpointResource==='policy-scans'){url=utils_constants.IDM_CONTEXT+'/governance/policyScan';}else if(endpointResource.startsWith('violations')){url=utils_constants.IDM_CONTEXT+'/governance/violation/admin';}var params={pageSize:pageSize,pageNumber:pageNumber,status:status};if(sortBy){params.sortBy=sortDir==='asc'?"+".concat(sortBy):"-".concat(sortBy);}if(q){params.q=q.replace(/\\/g,'\\\\').replace(/"/g,'\\"');}return httpService.request({url:url,method:'get',params:params}).then(function(_ref){var data=_ref.data;var result=data.result;if(result[0]&&!result[0]._id){result=data.result.map(function(item){return Object(objectSpread["a" /* default */])({},item,{_id:item.objectid});});}dispatch({type:POLICIES.QUERY_POLICIES_SUCCESS,payload:{results:result,totalPagedResults:data.totalPagedResults}});}).catch(function(error){dispatch({type:POLICIES.QUERY_POLICIES_FAILURE,payload:null});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var policies_actions_getActivePolicyScans=function getActivePolicyScans(){return function(dispatch){return httpService.request({url:utils_constants.IDM_CONTEXT+'/governance/activePolicyScan',method:'get'}).then(function(_ref2){var activePolicyScans=_ref2.data.activePolicyScans;var policyScans=activePolicyScans.map(function(scan){return Object(objectSpread["a" /* default */])({},scan,{progress:{complete:scan.complete,total:scan.total,percent:Math.ceil(scan.complete/scan.total*100)}});});dispatch({type:POLICIES.QUERY_ACTIVE_SCANS,payload:policyScans});if(!activePolicyScans||activePolicyScans.length===0){dispatch({type:POLICIES.CHANGE_ACTIVE_SCANS_STATUS,payload:false});}}).catch(function(error){dispatch({type:POLICIES.CHANGE_ACTIVE_SCANS_STATUS,payload:false});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var policies_actions_deletePolicies=function deletePolicies(policyIds){return function(dispatch,getState){return httpService.request({url:utils_constants.IDM_CONTEXT+'/governance/adminPolicy/policies?action=delete',method:'post',data:{ids:policyIds}}).then(function(_ref3){var result=_ref3.data.result;dispatch(generic_actions_alert(result,'success'));dispatch(policies_actions_getPolicies());}).catch(function(error){return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var policies_actions_deleteScans=function deleteScans(policyIds){return function(dispatch,getState){return httpService.request({url:utils_constants.IDM_CONTEXT+'/governance/adminPolicy/policy-scans?action=delete',method:'post',data:{ids:policyIds}}).then(function(_ref4){var result=_ref4.data.result;dispatch(generic_actions_alert(result,'success'));dispatch(policies_actions_getPolicies());}).catch(function(error){return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var policies_actions_cancelViolations=function cancelViolations(violationIds){return function(dispatch,getState){var type=getState().policies.type;switch(type){case'violations-active':type='cancel';break;case'exceptions-active':type='cancelexception';}return httpService.request({url:utils_constants.IDM_CONTEXT+'/governance/violation?_action='+type,method:'post',data:{ids:violationIds}}).then(function(_ref5){var result=_ref5.data.result;dispatch(generic_actions_alert(result,'success'));dispatch(policies_actions_getPolicies());}).catch(function(error){return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var policies_actions_reassignViolations=function reassignViolations(violationIds,newOwnerId){return function(dispatch,getState){return httpService.request({url:utils_constants.IDM_CONTEXT+'/governance/violation?_action=reassign',method:'post',data:{ids:violationIds,newOwnerId:newOwnerId}}).then(function(_ref6){var result=_ref6.data.result;dispatch(generic_actions_alert(result,'success'));dispatch(policies_actions_getPolicies());}).catch(function(error){return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var policies_actions_changePolicyType=function changePolicyType(type,noUpdate){return function(dispatch){dispatch({type:POLICIES.CHANGE_POLICY_TYPE,payload:type});if(type==='policy-scans'){dispatch({type:POLICIES.CHANGE_ACTIVE_SCANS_STATUS,payload:true});}else{dispatch({type:POLICIES.CHANGE_ACTIVE_SCANS_STATUS,payload:false});}if(!noUpdate){dispatch(policies_actions_getPolicies());}};};var policies_actions_changeSortKey=function changeSortKey(sortBy,isDesc,noUpdate){return function(dispatch){dispatch({type:POLICIES.CHANGE_SORTING,payload:{sortBy:sortBy,isDesc:isDesc}});if(!noUpdate){dispatch(policies_actions_getPolicies());}};};var policies_actions_changeSearchKey=function changeSearchKey(q,noUpdate){return function(dispatch){dispatch({type:POLICIES.CHANGE_SEARCH_KEY,payload:{q:q}});if(!noUpdate){dispatch(policies_actions_getPolicies());}};};var policies_actions_updatePagination=function updatePagination(params,noUpdate){return function(dispatch){dispatch({type:POLICIES.UPDATE_PAGINATION,payload:params});if(!noUpdate){dispatch(policies_actions_getPolicies());}};};var policies_actions_changeActiveScansStatus=function changeActiveScansStatus(status){return function(dispatch){dispatch({type:POLICIES.CHANGE_ACTIVE_SCANS_STATUS,payload:status});};};var getPolicyEndpointByType=function getPolicyEndpointByType(type){switch(type){case'policies':return'policies';case'policy-scans':return'policy-scans';case'violations-active':return'violations-active';case'exceptions-active':return'violations-exception';case'violations-history':return'violations-closed';default:return'';}};var getStatusByType=function getStatusByType(type){switch(type){case'violations-active':return'active';case'exceptions-active':return'exception';case'violations-history':return'closed';default:return null;}};var policies_actions_getReactiveScanConfiguration=function getReactiveScanConfiguration(){return function(dispatch){return httpService.request({url:utils_constants.IDM_CONTEXT+'/governance/policyScan/reactive',method:'get'}).then(function(_ref7){var data=_ref7.data;dispatch({type:POLICIES.GET_REACTIVE_SCAN_CONFIG,payload:data});return data;}).catch(function(error){dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));return error;});};};var policies_actions_configureReactiveScans=function configureReactiveScans(configuration){return function(dispatch){var successMessage=i18n.t('update-reactive-success');return httpService.request({url:utils_constants.IDM_CONTEXT+'/governance/policyScan',method:'post',params:{_action:'configure'},data:configuration}).then(function(_ref8){var data=_ref8.data;dispatch(generic_actions_alert(successMessage,'success'));return data;}).catch(function(error){dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));return error;});};};var policies_actions_createPolicy=function createPolicy(policyForm){return function(dispatch){var successMessage=i18n.t('create-policy-success');return httpService.request({url:utils_constants.IDM_CONTEXT+'/governance/adminPolicy',method:'post',params:{action:'create'},data:policyForm}).then(function(_ref9){var data=_ref9.data;dispatch(generic_actions_alert(successMessage,'success'));dispatch(policies_actions_getPolicies());return data;}).catch(function(error){dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));return error;});};};var policies_actions_editPolicy=function editPolicy(policyForm,policyId){return function(dispatch){var successMessage=i18n.t('update-policy-success');return httpService.request({url:"".concat(utils_constants.IDM_CONTEXT,"/governance/adminPolicy/").concat(policyId),method:'post',params:{action:'update'},data:policyForm}).then(function(_ref10){var data=_ref10.data;dispatch(generic_actions_alert(successMessage,'success'));dispatch(policies_actions_getPolicies());return data;}).catch(function(error){dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));return error;});};};var policies_actions_createPolicyScan=function createPolicyScan(scanForm){return function(dispatch){var _action=scanForm.scanType==='scheduled'?'schedule':'adhoc';var successMessage=i18n.t('create-policy-scan-success');// return Promise.resolve(scanForm);
return httpService.request({url:utils_constants.IDM_CONTEXT+'/governance/policyScan',method:'post',params:{_action:_action},data:scanForm}).then(function(_ref11){var data=_ref11.data;dispatch(generic_actions_alert(successMessage,'success'));dispatch(policies_actions_getPolicies());return data;}).catch(function(error){dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));return error;});};};var policies_actions_editPolicyScan=function editPolicyScan(scanForm,scanId){return function(dispatch){var successMessage=i18n.t('update-policy-scan-success');return httpService.request({url:"".concat(utils_constants.IDM_CONTEXT,"/governance/policyScan/").concat(scanId),method:'put',data:scanForm}).then(function(_ref12){var data=_ref12.data;dispatch(generic_actions_alert(successMessage,'success'));dispatch(policies_actions_getPolicies());return data;}).catch(function(error){dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));return error;});};};
// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/DialogContent/DialogContent.js
var DialogContent = __webpack_require__(511);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/InputLabel/InputLabel.js
var InputLabel = __webpack_require__(452);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/OutlinedInput/OutlinedInput.js + 1 modules
var OutlinedInput = __webpack_require__(458);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/FormHelperText/FormHelperText.js
var FormHelperText = __webpack_require__(454);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/FormLabel/FormLabel.js
var FormLabel = __webpack_require__(453);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Slider/Slider.js + 1 modules
var Slider = __webpack_require__(543);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/DialogActions/DialogActions.js
var DialogActions = __webpack_require__(512);

// EXTERNAL MODULE: ./node_modules/@material-ui/pickers/esm/DatePicker.js + 16 modules
var esm_DatePicker = __webpack_require__(533);

// CONCATENATED MODULE: ./src/components/presentational/DatePicker/DatePicker.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var DatePicker_DatePicker=function DatePicker(props){var _React$useState=react_default.a.useState(moment_default()()),_React$useState2=Object(slicedToArray["a" /* default */])(_React$useState,2),selectedDate=_React$useState2[0],handleDateChange=_React$useState2[1];var _React$useState3=react_default.a.useState(''),_React$useState4=Object(slicedToArray["a" /* default */])(_React$useState3,2),input=_React$useState4[0],setInput=_React$useState4[1];var format=moment_default.a.localeData()._longDateFormat.L;var disablePast=props.disablePast,disableFuture=props.disableFuture,error=props.error,field=props.field,value=props.value;react_default.a.useEffect(function(){handleDateChange(value);},[value]);var handleChange=function handleChange(date,input){setInput(input);var id=lodash_default.a.isString(field)?field:field.id;props.onChange(event,id,date);};return/*#__PURE__*/react_default.a.createElement(esm_DatePicker["a" /* KeyboardDatePicker */],{disablePast:disablePast,disableFuture:disableFuture,variant:"dialog",inputVariant:"outlined",format:format,placeholder:format,error:error,helperText:null,value:selectedDate,inputValue:input,onChange:handleChange});};/* harmony default export */ var presentational_DatePicker_DatePicker = (DatePicker_DatePicker);
// CONCATENATED MODULE: ./src/components/presentational/DatePicker/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var presentational_DatePicker = (presentational_DatePicker_DatePicker);
// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Remove.js
var Remove = __webpack_require__(136);
var Remove_default = /*#__PURE__*/__webpack_require__.n(Remove);

// CONCATENATED MODULE: ./src/components/presentational/EventExpressionBuilder/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var EventExpressionBuilder_styles_styles=function styles(theme){return{componentRoot:{padding:theme.spacing(),'& label':{paddingLeft:theme.spacing()}},builderTitle:{boxShadow:'0 2px 10px 0 rgba(0,0,0,.11)'},builderTitleText:{textAlign:'center'},dialogContainer:{margin:'0 auto','@media (min-width: 1280px)':{maxWidth:'66%'}},closeButton:{position:'absolute',right:theme.spacing(1),top:theme.spacing(1),color:theme.palette.grey[500]},submitButton:{backgroundColor:theme.palette.forgerock.blue}};};/* harmony default export */ var EventExpressionBuilder_styles = (EventExpressionBuilder_styles_styles);
// CONCATENATED MODULE: ./src/components/presentational/EventExpressionBuilder/EventExpressionBuilder.js
var EventExpressionBuilder_ExpressionBuilderTree=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(ExpressionBuilderTree,_Component);function ExpressionBuilderTree(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,ExpressionBuilderTree);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(ExpressionBuilderTree)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{expression:{},operators:[{text:_this.props.t('expr-builder-and'),value:'and',nested:true},{text:_this.props.t('expr-builder-or'),value:'or',nested:true},{text:_this.props.t('expr-builder-not'),value:'not',nested:true},{text:_this.props.t('expr-builder-attr',{type:_this.props.targetType}),value:'ATTR',nested:false}],operands:{'and':[{'operator':'','operand':[]}],'or':[{'operator':'','operand':[]}],'not':[{'operator':'','operand':[]}],'ATTR':{'operator':'','field':'','value':''}},isValid:false});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getOperands",function(operator){switch(operator){case'and':case'or':case'not':return[{'operator':'','operand':[]}];case'ATTR':return{'comparator':'','field':'','value':''};default:return[];}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getSearchTypeFromTarget",function(targetKey,targetVal){var searchType='text';if(targetKey==='manager'||targetKey==='userName'||_this.props.targetType!=='user'&&targetKey==='name'){searchType='typeahead';}else if(targetKey){if(['array','relationship'].indexOf(targetVal.type)>=0){searchType='typeahead';}}return searchType;});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"updateExpression",function(newExpression,path){var expression=null;if(path){expression=lodash_default.a.cloneDeep(_this.state.expression);lodash_default.a.set(expression,path,newExpression);}else{expression=newExpression;}var isValid=_this.validateExpression(expression);_this.setState({expression:expression,isValid:isValid});_this.props.setIsValid(isValid);_this.props.handleChange(expression);});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"removeNode",function(path){var expression=lodash_default.a.cloneDeep(_this.state.expression);var index=lodash_default.a.lastIndexOf(path,'.');var targetPath=path.slice(0,index);var targetNode=path.slice(index+1);if(targetPath&&targetNode){var operand=lodash_default.a.get(expression,targetPath);lodash_default.a.pullAt(operand,targetNode);lodash_default.a.set(expression,targetPath,operand);}var isValid=_this.validateExpression(expression);_this.setState({expression:expression,isValid:isValid});_this.props.setIsValid(isValid);_this.props.handleChange(expression);});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"addNode",function(path){var expression=lodash_default.a.cloneDeep(_this.state.expression);var newOperand={operator:'',operand:[]};if(path){var operand=lodash_default.a.get(expression,"".concat(path,".operand"));operand.push(newOperand);lodash_default.a.set(expression,"".concat(path,".operand"),operand);}else{expression.operand.push(newOperand);}var isValid=_this.validateExpression(expression);_this.setState({expression:expression,isValid:isValid});_this.props.setIsValid(isValid);_this.props.handleChange(expression);});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"validateExpression",function(expr){var expression=expr||_this.state.expression;if(!expression.operator&&!expression.comparator){return false;}else if(expression.operator&&['and','or','not'].indexOf(expression.operator)>=0){return lodash_default.a.every(expression.operand,_this.validateExpression);}else if(lodash_default.a.has(expression,'operand.field')){var operand=expression.operand;return operand.comparator&&operand.field&&(operand.comparator==='changed'||operand.value);}return false;});return _this;}Object(createClass["a" /* default */])(ExpressionBuilderTree,[{key:"componentDidMount",// state
value:function componentDidMount(){var expression=this.props.expression;this.setState({expression:expression});}},{key:"componentDidUpdate",value:function componentDidUpdate(prevProps,prevState){var _this$props=this.props,managed_objects=_this$props.managed_objects,targetType=_this$props.targetType;var managedObjAttrs=this.state.managedObjAttrs;if(targetType&&(!managedObjAttrs||targetType!==prevProps.targetType)){if(targetType==='object'||!managed_objects[targetType]){return null;}var attrs=Object.entries(managed_objects[targetType]).map(function(_ref){var _ref2=Object(slicedToArray["a" /* default */])(_ref,2),key=_ref2[0],value=_ref2[1];var objAttribute={value:key,label:value.title||key,type:value.type,isVirtual:value.isVirtual};return objAttribute;});lodash_default.a.remove(attrs,function(attr){return attr.value==='_id'||attr.isVirtual;});this.setState({managedObjAttrs:attrs});}}},{key:"render",value:function render(){var _this$props2=this.props,t=_this$props2.t,targetType=_this$props2.targetType,theme=_this$props2.theme;var _this$state=this.state,expression=_this$state.expression,managedObjAttrs=_this$state.managedObjAttrs,operators=_this$state.operators,operands=_this$state.operands;return/*#__PURE__*/react_default.a.createElement(EventExpressionNode,{addNode:this.addNode,expression:expression,getOperands:this.getOperands,objAttributes:managedObjAttrs,operators:operators,operands:operands,removeNode:this.removeNode,t:t,theme:theme,targetType:targetType,updateExpression:this.updateExpression});}}]);return ExpressionBuilderTree;}(react["Component"]);var EventExpressionNode=Object(withStyles["a" /* default */])(function(theme){return{expressionNode:function expressionNode(props){return{maxWidth:'100%',paddingTop:theme.spacing(),marginLeft:lodash_default.a.has(props.expression,'field')?0:theme.spacing(1.5),borderLeft:props.expression.operator&&['and','or','not'].indexOf(props.expression.operator)>=0?"3px solid ".concat(theme.palette.forgerock.blue):'none'};},nodeButton:{color:theme.palette.forgerock.white,margin:theme.spacing()},addButton:{backgroundColor:theme.palette.forgerock.blue},removeButton:{marginTop:0,backgroundColor:theme.palette.forgerock.danger},removeButtonGrid:{display:'flex'},operatorText:{marginTop:theme.spacing(),marginBottom:theme.spacing(),position:'relative',right:theme.spacing(),backgroundColor:theme.palette.forgerock.white,textTransform:'uppercase'}};})(function(props){var classes=props.classes,expression=props.expression,getOperands=props.getOperands,objAttributes=props.objAttributes,operators=props.operators,path=props.path,t=props.t,targetType=props.targetType,updateExpression=props.updateExpression;var handleChange=function handleChange(event){var newOperator=lodash_default.a.find(operators,function(op){return op.value===event.target.value;});if(newOperator){var operand=getOperands(newOperator.value);var newExpression={operator:newOperator.value,operand:operand};updateExpression(newExpression,path);}};var handleLeafNodeChange=function handleLeafNodeChange(evt){var _evt$target=evt.target,name=_evt$target.name,value=_evt$target.value;var newExpression=Object(objectSpread["a" /* default */])({},expression,Object(defineProperty["a" /* default */])({},name,value));if(evt.target.value==='changed'){newExpression.value='';}else if(expression.field&&name==='field'){newExpression=Object(objectSpread["a" /* default */])({},newExpression,{comparator:'',value:''});}updateExpression(newExpression,path);};var handleTypeaheadChange=function handleTypeaheadChange(evt,name,val){var newExpression=Object(objectSpread["a" /* default */])({},expression,Object(defineProperty["a" /* default */])({},name,val&&val._id?val._id:val));updateExpression(newExpression,path);};var isNested=function isNested(op){var operatorData=lodash_default.a.find(operators,function(operator){return operator.value===op;});return operatorData?operatorData.nested:false;};var getMenuItemsForComparator=function getMenuItemsForComparator(){var selected=lodash_default.a.find(objAttributes,function(attr){return attr.value===expression.field;});if(!selected){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{value:""});}else if(selected.type==='relationship'){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{value:"changed"},t('expr-builder-changed'));}else if(selected.type==='array'){return['contains','contained'].map(function(comp){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:Object(v4["a" /* default */])(),value:comp},t("expr-builder-".concat(comp)));});}else{return['is','was','changed'].map(function(comp){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:Object(v4["a" /* default */])(),value:comp},t("expr-builder-".concat(comp)));});}};var getInputFromSearchType=function getInputFromSearchType(){var selected=lodash_default.a.find(objAttributes,function(attr){return attr.value===expression.field;});if(selected&&selected.type==='array'){return/*#__PURE__*/react_default.a.createElement(presentational_AsyncSelect,{id:Object(v4["a" /* default */])(),name:"value",fullWidth:true,variant:"outlined",userNameOnly:true,objectToTarget:targetType,targetType:expression.field,value:expression.value,onChange:handleTypeaheadChange});}else if(selected&&selected.type==='relationship'){return null;}return/*#__PURE__*/react_default.a.createElement(OutlinedInput["a" /* default */],{id:Object(v4["a" /* default */])(),name:"value",fullWidth:true,variant:"outlined",value:expression.value,onChange:handleLeafNodeChange,rowsMax:"4"});};return/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,spacing:1,className:classes.expressionNode},objAttributes&&lodash_default.a.has(expression,'field')?/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:3},/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{name:"field",value:expression.field,onChange:handleLeafNodeChange,variant:"outlined",fullWidth:true},objAttributes&&objAttributes.map(function(attr){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:Object(v4["a" /* default */])(),value:attr.value},attr.label);}))),expression.field&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:3},/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{name:"comparator",fullWidth:true,onChange:handleLeafNodeChange,variant:"outlined",value:expression.comparator},getMenuItemsForComparator())),expression.field&&expression.comparator&&expression.comparator!=='changed'&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:3},getInputFromSearchType())):/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:10},/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{name:"operator",value:expression.operator||'',onChange:handleChange,variant:"outlined",fullWidth:true},operators&&operators.map(function(op){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:op.value,value:op.value},op.text);}))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:2,className:classes.removeButtonGrid},lodash_default.a.isFinite(props.index)&&!lodash_default.a.has(expression,'field')&&/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{className:Object(clsx_m["a" /* default */])(classes.nodeButton,classes.removeButton),variant:"contained",size:"small","aria-label":"Remove",onClick:function onClick(){return props.removeNode(path);}},/*#__PURE__*/react_default.a.createElement(Remove_default.a,null))),expression.operator&&isNested(expression.operator)&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:6},/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{className:Object(clsx_m["a" /* default */])(classes.nodeButton,classes.addButton),variant:"contained",size:"small","aria-label":"Add",onClick:function onClick(){return props.addNode(path);}},/*#__PURE__*/react_default.a.createElement(Add_default.a,null))),lodash_default.a.isArray(expression.operand)?expression.operand.map(function(op,i){return/*#__PURE__*/react_default.a.createElement(react["Fragment"],{key:i},/*#__PURE__*/react_default.a.createElement(EventExpressionNode,Object.assign({},props,{index:i,expression:op,path:path?"".concat(path,".operand.").concat(i):"operand.".concat(i)})),i<expression.operand.length-1&&/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.operatorText,variant:"h6"},expression.operator));}):expression.operand&&/*#__PURE__*/react_default.a.createElement(EventExpressionNode,Object.assign({},props,{expression:expression.operand,path:path?"".concat(path,".operand"):'operand'})));});var EventExpressionBuilder_EventExpressionBuilder=function EventExpressionBuilder(props){var _React$useState=react_default.a.useState(false),_React$useState2=Object(slicedToArray["a" /* default */])(_React$useState,2),open=_React$useState2[0],setOpen=_React$useState2[1];var _React$useState3=react_default.a.useState(false),_React$useState4=Object(slicedToArray["a" /* default */])(_React$useState3,2),isValid=_React$useState4[0],setIsValid=_React$useState4[1];var _React$useState5=react_default.a.useState({}),_React$useState6=Object(slicedToArray["a" /* default */])(_React$useState5,2),expression=_React$useState6[0],setExpression=_React$useState6[1];var t=props.t,handleChange=props.handleChange,classes=props.classes;react_default.a.useEffect(function(){var expr=lodash_default.a.cloneDeep(props.expression);unpackExpression(expr);setExpression(expr);},[props.expression]);var handleClickOpen=function handleClickOpen(){setOpen(true);};var handleClose=function handleClose(){setOpen(false);};var packExpression=function packExpression(expr){if(lodash_default.a.isArray(expr.operand)){expr.operand.map(packExpression);}else if(expr.operator==='ATTR'){expr.operator=expr.operand.comparator;delete expr.operand.comparator;}};var unpackExpression=function unpackExpression(expr){if(lodash_default.a.isArray(expr.operand)){expr.operand.map(unpackExpression);}else if(expr.operand){expr.operand.comparator=expr.operator;expr.operator='ATTR';}};var handleSave=function handleSave(){var packedExpression=lodash_default.a.cloneDeep(expression);packExpression(packedExpression);handleChange(event,packedExpression);handleClose();};return/*#__PURE__*/react_default.a.createElement("div",{className:classes.componentRoot},/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{variant:"contained",color:"primary",onClick:handleClickOpen,disabled:!props.targetType},t('btn-open-expression-builder')),/*#__PURE__*/react_default.a.createElement(FormLabel["a" /* default */],{error:lodash_default.a.isEmpty(props.expression)},lodash_default.a.isEmpty(props.expression)?t('expr-builder-unsaved'):t('expr-builder-saved')),/*#__PURE__*/react_default.a.createElement(Dialog["a" /* default */],{maxWidth:"md",fullWidth:true,className:props.classes.dialogContainer,onClose:handleClose,"aria-labelledby":"expression-builder-title",open:open,PaperProps:{className:'appBarShift'}},/*#__PURE__*/react_default.a.createElement(DialogTitle["a" /* default */],{className:classes.builderTitle,id:"expression-builder-title",disableTypography:true},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.builderTitleText,variant:"h6"},t('expression-builder')),/*#__PURE__*/react_default.a.createElement(IconButton["a" /* default */],{"aria-label":"close",className:props.classes.closeButton,onClick:handleClose},/*#__PURE__*/react_default.a.createElement(Close_default.a,null))),/*#__PURE__*/react_default.a.createElement(DialogContent["a" /* default */],{dividers:true},/*#__PURE__*/react_default.a.createElement(EventExpressionBuilder_ExpressionBuilderTree,Object.assign({},props,{expression:expression,handleChange:setExpression,setIsValid:setIsValid}))),/*#__PURE__*/react_default.a.createElement(DialogActions["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{variant:"contained",size:"large",color:"primary",disabled:!isValid,className:props.classes.submitButton,onClick:handleSave},props.t('btn-save')))));};var EventExpressionBuilder_mapStateToProps=function mapStateToProps(state){var config=state.config;return config;};var EventExpressionBuilder_mapDispatchToProps={getManagedObjectConfig:config_actions_getManagedObjectConfig};/* harmony default export */ var presentational_EventExpressionBuilder_EventExpressionBuilder = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(EventExpressionBuilder_mapStateToProps,EventExpressionBuilder_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(EventExpressionBuilder_styles,{withTheme:true}))(EventExpressionBuilder_EventExpressionBuilder));
// CONCATENATED MODULE: ./src/components/presentational/EventExpressionBuilder/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var presentational_EventExpressionBuilder = (presentational_EventExpressionBuilder_EventExpressionBuilder);
// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Switch/Switch.js
var Switch = __webpack_require__(516);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Collapse/Collapse.js
var Collapse = __webpack_require__(490);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/FilledInput/FilledInput.js
var FilledInput = __webpack_require__(450);

// CONCATENATED MODULE: ./src/components/presentational/ExpressionBuilder/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var ExpressionBuilder_styles_styles=function styles(theme){return{componentRoot:{padding:theme.spacing(),'& label':{paddingLeft:theme.spacing()}},title:{margin:0,padding:theme.spacing(2)},builderTitle:{boxShadow:'0 2px 10px 0 rgba(0,0,0,.11)'},builderTitleText:{textAlign:'center'},entryGrid:{paddingTop:'10px',justifyContent:'space-evenly'},parentGrid:{width:'inherit',margin:theme.spacing(),justifyContent:'flex-end'},paperRoot:{width:'100%',padding:theme.spacing(),borderTop:0,borderBottom:0},collapseToggle:{color:theme.palette.info.main,textTransform:'capitalize'},container:{display:'flex',flexWrap:'wrap'},dialog:{minWidth:'400px',overflowY:'visible'},dialogContainer:{margin:'0 auto','@media (min-width: 1280px)':{maxWidth:'66%'}},closeButton:{position:'absolute',right:theme.spacing(1),top:theme.spacing(1),color:theme.palette.grey[500]},filterPaper:{marginTop:theme.spacing()},formLabel:{backgroundColor:theme.palette.forgerock.white,paddingRight:theme.spacing(),paddingLeft:theme.spacing()},submitButton:{backgroundColor:theme.palette.forgerock.blue},targetCountGrid:{display:'flex',justifyContent:'space-around',alignItems:'center'},topLevelButton:{height:'50px'},tabButton:{color:'rgba(0, 0, 0, 0.54)',border:'1px solid',borderColor:'rgba(0, 0, 0, 0.54)',boxShadow:'none',backgroundColor:theme.palette.forgerock.white,'&.selected':{backgroundColor:theme.palette.forgerock.darkGray,color:theme.palette.forgerock.white}},nodeButton:{color:theme.palette.forgerock.white,margin:theme.spacing()},addButton:{backgroundColor:theme.palette.forgerock.blue},removeButton:{marginTop:0,backgroundColor:theme.palette.forgerock.danger},propertyRow:{paddingTop:theme.spacing()},expressionDialogButton:{marginLeft:theme.spacing()},expressionNode:function expressionNode(props){return{maxWidth:'100%',paddingTop:theme.spacing(),paddingLeft:theme.spacing(),marginLeft:theme.spacing(1.5),borderLeft:props.expression.operator&&['AND','OR','NOT'].indexOf(props.expression.operator)>=0?"3px solid ".concat(theme.palette.forgerock.blue):'none'};},operatorText:{marginTop:theme.spacing(),marginBottom:theme.spacing(),position:'relative',right:theme.spacing(3),backgroundColor:theme.palette.forgerock.white,textTransform:'uppercase'}};};/* harmony default export */ var ExpressionBuilder_styles = (ExpressionBuilder_styles_styles);
// CONCATENATED MODULE: ./src/components/presentational/ExpressionBuilder/ExpressionBuilder.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var ExpressionBuilder_ExpressionBuilder=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(ExpressionBuilder,_Component);function ExpressionBuilder(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,ExpressionBuilder);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(ExpressionBuilder)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{operators:[{text:_this.props.t('expr-builder-all',{type:_this.props.targetType}),value:'ALL',nested:false},{text:_this.props.t('expr-builder-and'),value:'AND',nested:true},{text:_this.props.t('expr-builder-or'),value:'OR',nested:true},{text:_this.props.t('expr-builder-not'),value:'NOT',nested:true},{text:_this.props.t('expr-builder-compare',{type:_this.props.targetType}),value:'COMPARE',nested:false}],compareOperators:['EQUALS','CONTAINS'],operands:{'ALL':[],'AND':[{'operator':'','operand':[]}],'OR':[{'operator':'','operand':[]}],'NOT':[{'operator':'','operand':[]}],'COMPARE':{'targetName':'','targetValue':''},'LINKEDTO':{'targetName':'application','targetValue':''}},basicFilters:{user:[{label:'expr-builder-filter-user',expression:{operator:'AND',operand:[{operator:'EQUALS',operand:{targetName:'userName',targetValue:''}}]}},{label:'expr-builder-filter-application',expression:{operator:'AND',operand:[{operator:'LINKEDTO',operand:{targetName:'application',targetValue:''}}]}},{label:'expr-builder-filter-manager',expression:{operator:'AND',operand:[{operator:'EQUALS',operand:{targetName:'manager',targetValue:''}}]}},{label:'expr-builder-filter-authzrole',expression:{operator:'AND',operand:[{operator:'EQUALS',operand:{targetName:'authzRoles',targetValue:''}}]}},{label:'expr-builder-filter-role',expression:{operator:'AND',operand:[{operator:'EQUALS',operand:{targetName:'roles',targetValue:''}}]}},{label:'expr-builder-filter-all',expression:{operator:'ALL',operand:[]}}],object:[{label:'expr-builder-all-caps',expression:{operator:'ALL',operand:[]}},{label:'expr-builder-filter-object',expression:{operator:'AND',operand:[{operator:'EQUALS',operand:{targetName:'name',targetValue:''}}]}}]},showAdvancedTab:false,collapseAdvancedTab:true,targetCount:0});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"expressionIsValid",function(isValid){_this.setState({isValid:isValid});});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getTargetedObjectCount",function(expression){var targetType=_this.props.targetType;httpService.request({url:"".concat(utils_constants.IDM_CONTEXT,"/governance/expressionParser/").concat(targetType),method:'post',params:{_action:'parse'},data:expression}).then(function(_ref){var data=_ref.data;_this.setState({targetCount:data.length||0});}).catch(function(){_this.setState({targetCount:0});});});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"showAdvancedTab",function(showAdvancedTab){_this.setState({showAdvancedTab:showAdvancedTab});});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"showAdvancedTabConfirmDialog",function(){var filterIdx=_this.findMatchingBasicFilterFromExpression();// If filterIdx is not found, display confirmation dialog to let users know that their search will be reset
if(filterIdx<0){_this.setState({showConfirmDialog:true});_this.props.changeDialogType('confirmation');_this.props.changeDialogMessage(_this.props.t('expr-builder-confirmation-msg'));_this.props.changeActiveGovernanceDialog('ExpressionBuilderDialog');}else{_this.showAdvancedTab(false);}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"collapseAdvancedTab",function(){_this.setState(function(state){return{collapseAdvancedTab:!state.collapseAdvancedTab};});});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getOperators",function(path,operator){var _this$state=_this.state,operators=_this$state.operators,compareOperators=_this$state.compareOperators;var ops=lodash_default.a.cloneDeep(operators);if(compareOperators.indexOf(operator)>=0){var idx=lodash_default.a.findIndex(ops,function(op){return op.value==='COMPARE';});ops[idx].value=operator;}return path?lodash_default.a.filter(ops,function(op){return op.value!=='ALL';}):ops;});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getSearchTypeFromTarget",function(targetKey,targetVal){var searchType='text';if(targetKey==='manager'||targetKey==='userName'||_this.props.targetType!=='user'&&targetKey==='name'){searchType='typeahead';}else if(targetKey==='application'){searchType='dropdown';}else if(targetKey){if(['array','relationship'].indexOf(targetVal.type)>=0){searchType='typeahead';}}return searchType;});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getOperands",function(operator){switch(operator){case'ALL':return[];case'AND':case'OR':case'NOT':return[{'operator':'','operand':[]}];case'COMPARE':return{'targetName':'','targetValue':''};case'LINKEDTO':return{'targetName':'application','targetValue':''};default:return[];}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"addNewNode",function(path){var expression=lodash_default.a.cloneDeep(_this.state.expression);var newOperand={operator:'',operand:[]};if(path){var operand=lodash_default.a.get(expression,"".concat(path,".operand"));operand.push(newOperand);lodash_default.a.set(expression,"".concat(path,".operand"),operand);}else{expression.operand.push(newOperand);}_this.setState({expression:expression});_this.props.handleChange(expression);});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"removeNode",function(path){var expression=lodash_default.a.cloneDeep(_this.state.expression);var index=lodash_default.a.lastIndexOf(path,'.');var targetPath=path.slice(0,index);var targetNode=path.slice(index+1);if(targetPath&&targetNode){var operand=lodash_default.a.get(expression,targetPath);lodash_default.a.pullAt(operand,targetNode);lodash_default.a.set(expression,targetPath,operand);}_this.setState({expression:expression});_this.props.handleChange(expression);});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"updateExpression",function(newExpression,path){var expression=null;if(path){expression=lodash_default.a.cloneDeep(_this.state.expression);lodash_default.a.set(expression,path,newExpression);}else{expression=newExpression;}_this.setState({expression:expression});_this.props.handleChange(expression);});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"resetExpression",function(){var expression={};_this.setState({expression:expression});_this.props.handleChange(expression);});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"findMatchingBasicFilterFromExpression",function(){var _this$state2=_this.state,expression=_this$state2.expression,basicFilters=_this$state2.basicFilters;var match=-1;var filters=_this.props.targetType==='user'?basicFilters.user:basicFilters.object;if(expression&&expression.operator==='ALL'){match=lodash_default.a.findIndex(filters,function(filter){return filter.expression.operator==='ALL';});}else if(expression&&expression.operator==='AND'&&expression.operand.length===1){var operandClone=lodash_default.a.cloneDeep(expression.operand[0]);operandClone.operand.targetValue='';match=lodash_default.a.findIndex(filters,function(filter){return filter.expression.operand[0]&&lodash_default.a.isEqual(filter.expression.operand[0],operandClone);});}return match;});return _this;}Object(createClass["a" /* default */])(ExpressionBuilder,[{key:"componentDidMount",// state
value:function componentDidMount(){var _this$props=this.props,getManagedObjectConfig=_this$props.getManagedObjectConfig,showBasicFilters=_this$props.showBasicFilters,expression=_this$props.expression,targetType=_this$props.targetType;getManagedObjectConfig();var newExpression=expression;var newIsValid=false;var newOperators=lodash_default.a.cloneDeep(this.state.operators);if(targetType!=='user'){lodash_default.a.remove(newOperators,function(op){return op.value==='LINKEDTO';});}else{newOperators.push({text:this.props.t('expr-builder-linkedto'),value:'LINKEDTO',nested:false});}if(lodash_default.a.isEqual(expression,{})&&showBasicFilters){newIsValid=true;}else if(expression&&expression.operator){newExpression=this.props.expression;}else{newExpression={operator:'AND',operand:this.state.operands['AND']};this.props.handleChange(newExpression);}this.setState({expression:newExpression,isValid:newIsValid,showAdvancedTab:!showBasicFilters,operators:newOperators});}},{key:"componentDidUpdate",value:function componentDidUpdate(prevProps,prevState){var _this2=this;var _this$props2=this.props,managed_objects=_this$props2.managed_objects,setIsValid=_this$props2.setIsValid,targetType=_this$props2.targetType;var _this$state3=this.state,expression=_this$state3.expression,managedObjAttrs=_this$state3.managedObjAttrs,showAdvancedTab=_this$state3.showAdvancedTab;if(targetType&&targetType!==prevProps.targetType){this.setState(function(state){var operators=lodash_default.a.cloneDeep(_this2.state.operators);if(targetType!=='user'){lodash_default.a.remove(operators,function(op){return op.value==='LINKEDTO';});}else{operators.push({text:_this2.props.t('expr-builder-linkedto'),value:'LINKEDTO',nested:false});}operators[0].text=_this2.props.t('expr-builder-all',{type:targetType});operators[4].text=_this2.props.t('expr-builder-compare',{type:targetType});return Object(objectSpread["a" /* default */])({},state,{operators:operators});});var initialExpression={operator:'AND',operand:this.state.operands['AND']};this.props.handleChange(initialExpression);}if(targetType&&(!managedObjAttrs||targetType!==prevProps.targetType)){if(targetType==='object'||!managed_objects[targetType]){return null;}var attrs=Object.entries(managed_objects[targetType]).map(function(_ref2){var _ref3=Object(slicedToArray["a" /* default */])(_ref2,2),key=_ref3[0],value=_ref3[1];var userAttribute={value:key,label:value.title||key,type:_this2.getSearchTypeFromTarget(key,value),isVirtual:value.isVirtual};return userAttribute;});lodash_default.a.remove(attrs,function(attr){return attr.value==='_id'||attr.isVirtual;});this.setState({managedObjAttrs:attrs});}if(setIsValid&&prevState.isValid!==this.state.isValid){this.props.setIsValid(this.state.isValid);}if(!lodash_default.a.isEqual(expression,prevState.expression)){this.getTargetedObjectCount(expression);if(!lodash_default.a.isEmpty(expression)&&!showAdvancedTab&&this.findMatchingBasicFilterFromExpression()<0){this.setState({showAdvancedTab:true});}}}},{key:"render",value:function render(){var _this3=this;var _this$state4=this.state,basicFilters=_this$state4.basicFilters,expression=_this$state4.expression,collapseAdvancedTab=_this$state4.collapseAdvancedTab,compareOperators=_this$state4.compareOperators,managedObjAttrs=_this$state4.managedObjAttrs,showAdvancedTab=_this$state4.showAdvancedTab,targetCount=_this$state4.targetCount;var _this$props3=this.props,applications=_this$props3.applications,classes=_this$props3.classes,showBasicFilters=_this$props3.showBasicFilters,t=_this$props3.t,targetType=_this$props3.targetType;return/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.parentGrid},showBasicFilters&&/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(presentational_GovernanceDialog,{dialogId:"ExpressionBuilderDialog",dialogType:"confirmation",confirmationMessage:t('expr-builder-confirmation-msg'),onSubmitDialog:function onSubmitDialog(){_this3.showAdvancedTab(false);_this3.props.changeActiveGovernanceDialog(null);}}),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:6},/*#__PURE__*/react_default.a.createElement(ButtonGroup["a" /* default */],{color:"default"},/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{className:Object(clsx_m["a" /* default */])(classes.topLevelButton,classes.tabButton,{'selected':!showAdvancedTab}),variant:"contained",disabled:!targetType,onClick:function onClick(){return _this3.showAdvancedTabConfirmDialog();}},t('expr-builder-filter-btn-basic')),/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{className:Object(clsx_m["a" /* default */])(classes.topLevelButton,classes.tabButton,{'selected':showAdvancedTab}),variant:"contained",disabled:!targetType,onClick:function onClick(){return _this3.showAdvancedTab(true);}},t('expr-builder-filter-btn-advanced'))))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:6,className:classes.targetCountGrid},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{display:"inline"},t('expr-builder-target-count',{type:targetType,count:targetCount})),/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{color:"secondary",className:classes.topLevelButton,disabled:lodash_default.a.isEqual(expression,{}),onClick:this.resetExpression},t('expr-builder-filter-reset'))),expression&&showBasicFilters&&!showAdvancedTab&&/*#__PURE__*/react_default.a.createElement(Paper["a" /* default */],{variant:"outlined",className:Object(clsx_m["a" /* default */])(classes.filterPaper,classes.paperRoot)},/*#__PURE__*/react_default.a.createElement(BasicFilterFields,{expression:expression,targetType:targetType,basicFilters:targetType==='user'?basicFilters.user:basicFilters.object,findMatchingFilter:this.findMatchingBasicFilterFromExpression,updateExpression:this.updateExpression,setExpressionValidity:this.expressionIsValid,objAttributes:managedObjAttrs,applications:applications,t:t})),expression&&showAdvancedTab&&/*#__PURE__*/react_default.a.createElement(Paper["a" /* default */],{elevation:showBasicFilters?1:0,variant:showBasicFilters&&'outlined',className:Object(clsx_m["a" /* default */])(classes.filterPaper,classes.paperRoot)},showBasicFilters&&/*#__PURE__*/react_default.a.createElement(FormControlLabel["a" /* default */],{className:classes.collapseToggle,control:/*#__PURE__*/react_default.a.createElement(Switch["a" /* default */],{color:"primary",checked:!collapseAdvancedTab,onChange:this.collapseAdvancedTab}),label:t('expr-builder-collapse-advanced')}),/*#__PURE__*/react_default.a.createElement(Collapse["a" /* default */],{in:collapseAdvancedTab},/*#__PURE__*/react_default.a.createElement(ExpressionNode,{expression:expression,compareOperators:compareOperators,getOperators:this.getOperators,getOperands:this.getOperands,updateExpression:this.updateExpression,setExpressionValidity:this.expressionIsValid,addNewNode:this.addNewNode,removeNode:this.removeNode,objAttributes:managedObjAttrs,applications:applications,targetType:targetType,t:t}))));}}]);return ExpressionBuilder;}(react["Component"]);var BasicFilterFields=Object(withStyles["a" /* default */])(ExpressionBuilder_styles)(function(props){var _React$useState=react_default.a.useState(''),_React$useState2=Object(slicedToArray["a" /* default */])(_React$useState,2),selectedFilter=_React$useState2[0],setSelectedFilter=_React$useState2[1];var applications=props.applications,expression=props.expression,t=props.t,classes=props.classes,targetType=props.targetType;react_default.a.useEffect(function(){var matchingIdx=props.findMatchingFilter();if(matchingIdx>-1){setSelectedFilter(matchingIdx);}else{setSelectedFilter('');}},[expression]);var getTargetInputFromSelectedFilter=function getTargetInputFromSelectedFilter(){var basicFilters=props.basicFilters,expression=props.expression;var filter=basicFilters&&lodash_default.a.isFinite(selectedFilter)?basicFilters[selectedFilter]:null;if(!filter||filter.label==='expr-builder-filter-all'||!expression.operand||!expression.operand[0]){return/*#__PURE__*/react_default.a.createElement(FilledInput["a" /* default */],{disabled:true,fullWidth:true});}else if(filter.label==='expr-builder-filter-application'){return/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{name:"targetValue",variant:"outlined",fullWidth:true,onChange:handleChange,value:expression.operand[0].operand.targetValue},applications&&applications.map(function(app){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:Object(v4["a" /* default */])(),value:app.name},app.displayName);}));}else{return/*#__PURE__*/react_default.a.createElement(presentational_AsyncSelect,{id:Object(v4["a" /* default */])(),name:"targetValue",variant:"outlined",fullWidth:true,userNameOnly:true,objectToTarget:targetType,targetType:expression.operand[0].operand.targetName,value:expression.operand[0].operand.targetValue,onChange:handleChange});}};var handleChange=function handleChange(evt,child,value){if(!evt){return;}var newExpression=null;if(evt.target.name==='selectedFilter'){newExpression=props.basicFilters[evt.target.value]?props.basicFilters[evt.target.value].expression:{};}else if(evt.target.name==='targetValue'||value){newExpression=lodash_default.a.cloneDeep(props.expression);var targetValue=evt.target.value;if(value){var targetName=props.expression.operand[0].operand.targetName;if(targetType!=='user'&&targetName==='name'||targetName==='userName'){targetValue=value.userName||value.displayName||value.name;}else{targetValue=value._id;}}lodash_default.a.set(newExpression,'operand[0].operand.targetValue',targetValue);}if(newExpression){props.updateExpression(newExpression);}};return/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.entryGrid},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:5},/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{name:"selectedFilter",value:selectedFilter,variant:targetType?'outlined':'filled',disabled:!targetType,onChange:handleChange,onBlur:handleChange,fullWidth:true},props.basicFilters&&props.basicFilters.map(function(filter,i){var label=t(filter.label,{type:targetType});return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:Object(v4["a" /* default */])(),value:i},label);}))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:5},getTargetInputFromSelectedFilter()));});var ExpressionNode=Object(withStyles["a" /* default */])(ExpressionBuilder_styles)(function(props){var classes=props.classes,expression=props.expression,updateExpression=props.updateExpression,setExpressionValidity=props.setExpressionValidity,getOperators=props.getOperators,getOperands=props.getOperands,compareOperators=props.compareOperators,path=props.path;var operators=getOperators(path,expression.operator);react_default.a.useEffect(function(){if(expression.operator==='ALL'){setExpressionValidity(true);}else if(!expression.operator){props.setExpressionValidity(false);}},[expression]);var handleChange=function handleChange(event){var newOperator=lodash_default.a.find(operators,function(op){return op.value===event.target.value;});if(newOperator){var operand=getOperands(newOperator.value);var newExpression={operator:newOperator.value,operand:operand};updateExpression(newExpression,path);}};var handleLeafNodeChange=function handleLeafNodeChange(event){var newExpression={};if(event.target.name==='compareOperator'){newExpression=Object(objectSpread["a" /* default */])({},expression,{operator:event.target.value,operand:Object(objectSpread["a" /* default */])({},expression.operand,{targetValue:''})});}else{newExpression=Object(objectSpread["a" /* default */])({},expression,{operand:Object(objectSpread["a" /* default */])({},expression.operand,Object(defineProperty["a" /* default */])({targetValue:''},event.target.name,event.target.value))});}updateExpression(newExpression,path);};var isNested=function isNested(op){var operatorData=lodash_default.a.find(operators,function(operator){return operator.value===op;});return operatorData?operatorData.nested:false;};var isLeafNode=function isLeafNode(operator){return operator&&compareOperators.concat(['COMPARE','LINKEDTO']).indexOf(operator)>=0;};return/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:Object(clsx_m["a" /* default */])(classes.container,classes.expressionNode)},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:10},/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{value:expression.operator||'',onChange:handleChange,fullWidth:true,variant:"outlined",name:"expression-builder"},operators.map(function(op){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:Object(v4["a" /* default */])(),value:op.value},op.text);}))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:2},lodash_default.a.isFinite(props.index)&&/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{className:Object(clsx_m["a" /* default */])(classes.nodeButton,classes.removeButton),variant:"contained",size:"small","aria-label":"Remove",onClick:function onClick(){return props.removeNode(path);}},/*#__PURE__*/react_default.a.createElement(Remove_default.a,null))),expression.operator&&isNested(expression.operator)&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:6},/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{className:Object(clsx_m["a" /* default */])(classes.nodeButton,classes.addButton),variant:"contained",size:"small","aria-label":"Add",onClick:function onClick(){return props.addNewNode(path);}},/*#__PURE__*/react_default.a.createElement(Add_default.a,null))),isLeafNode(expression.operator)?/*#__PURE__*/react_default.a.createElement(ExpressionBuilder_LeafNode,Object.assign({},props,{expression:expression,compareOperators:compareOperators,handleChange:handleLeafNodeChange})):expression.operand&&expression.operand.map(function(op,i){return/*#__PURE__*/react_default.a.createElement(react["Fragment"],{key:i},/*#__PURE__*/react_default.a.createElement(ExpressionNode,Object.assign({},props,{index:i,expression:op,path:path?"".concat(path,".operand.").concat(i):"operand.".concat(i)})),i<expression.operand.length-1&&/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.operatorText,variant:"h6"},expression.operator));}));});var ExpressionBuilder_LeafNode=function LeafNode(props){var expression=props.expression,compareOperators=props.compareOperators,objAttributes=props.objAttributes,applications=props.applications,handleChange=props.handleChange,t=props.t,targetType=props.targetType,classes=props.classes;var selectedAttr=lodash_default.a.find(objAttributes,function(attr){return attr.value===expression.operand.targetName;});react_default.a.useEffect(function(){var operator=expression.operator,operand=expression.operand;if(operator!=='COMPARE'&&operand.targetName&&operand.targetValue){props.setExpressionValidity(true);}else{props.setExpressionValidity(false);}},[expression]);var handleTypeaheadChange=function handleTypeaheadChange(evt,elem,val){if(!evt&&!val){return;}var field={target:{name:'targetValue'}};var fieldValue='';if(val){if(targetType==='user'){fieldValue=selectedAttr.value==='userName'?val.displayName:val._id;}else{fieldValue=selectedAttr.value==='name'?val.displayName:val._id;}}field.target.value=fieldValue;handleChange(field);};var getInputFromSearchType=function getInputFromSearchType(attribute){if(attribute&&attribute.type==='typeahead'&&props.expression.operator==='EQUALS'){return/*#__PURE__*/react_default.a.createElement(presentational_AsyncSelect,{id:Object(v4["a" /* default */])(),name:"targetValue",fullWidth:true,variant:"outlined",userNameOnly:true,objectToTarget:targetType,targetType:expression.operand.targetName,value:expression.operand.targetValue,onChange:handleTypeaheadChange});}return/*#__PURE__*/react_default.a.createElement(OutlinedInput["a" /* default */],{id:Object(v4["a" /* default */])(),name:"targetValue",fullWidth:true,variant:"outlined",value:expression.operand.targetValue,onChange:handleChange,rowsMax:"4"});};return expression.operator==='LINKEDTO'?/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,spacing:1,className:classes.propertyRow},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:10},/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{name:"targetValue",fullWidth:true,variant:"outlined",onChange:handleChange,value:expression.operand.targetValue},applications&&applications.map(function(app){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:Object(v4["a" /* default */])(),value:app.name},app.displayName);})))):/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,spacing:1,className:classes.propertyRow},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:3},/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{name:"targetName",value:expression.operand.targetName,onChange:handleChange,variant:"outlined",fullWidth:true},objAttributes?objAttributes.map(function(attr){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:Object(v4["a" /* default */])(),value:attr.value},attr.label);}):/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{value:""}))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:3},/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{name:"compareOperator",fullWidth:true,onChange:handleChange,variant:"outlined",value:expression.operator},/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{value:'COMPARE'}),compareOperators.map(function(op){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:op,value:op},t("expr-builder-".concat(op.toLowerCase())));}))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:3},getInputFromSearchType(selectedAttr)));};var ExpressionBuilder_mapStateToProps=function mapStateToProps(state){var config=state.config;return config;};var ExpressionBuilder_mapDispatchToProps={changeDialogMessage:generic_actions_changeDialogMessage,changeDialogType:generic_actions_changeDialogType,getManagedObjectConfig:config_actions_getManagedObjectConfig,changeActiveGovernanceDialog:generic_actions_changeActiveGovernanceDialog};/* harmony default export */ var presentational_ExpressionBuilder_ExpressionBuilder = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(ExpressionBuilder_mapStateToProps,ExpressionBuilder_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(ExpressionBuilder_styles))(ExpressionBuilder_ExpressionBuilder));
// CONCATENATED MODULE: ./src/components/presentational/ExpressionBuilder/ExpressionBuilderDialog.js
var ExpressionBuilderDialog_ExpressionBuilderDialog=function ExpressionBuilderDialog(props){var _React$useState=react_default.a.useState(false),_React$useState2=Object(slicedToArray["a" /* default */])(_React$useState,2),open=_React$useState2[0],setOpen=_React$useState2[1];var t=props.t,errors=props.errors,expression=props.expression,handleChange=props.handleChange,classes=props.classes;var handleClickOpen=function handleClickOpen(){setOpen(true);};var handleClose=function handleClose(value){setOpen(false);};var handleExpressionBuilderChange=function handleExpressionBuilderChange(expr){handleChange(event,expr);};var handleSave=function handleSave(){handleChange(event,expression);handleClose();};return/*#__PURE__*/react_default.a.createElement("div",{className:classes.componentRoot},/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{variant:"contained",color:"primary",onClick:handleClickOpen,className:classes.expressionDialogButton},t('btn-open-expression-builder')),/*#__PURE__*/react_default.a.createElement(FormLabel["a" /* default */],{error:lodash_default.a.isEmpty(props.expression)||!lodash_default.a.isEmpty(errors)},lodash_default.a.isEmpty(expression)||!lodash_default.a.isEmpty(errors)?t('expr-builder-unsaved'):t('expr-builder-saved')),/*#__PURE__*/react_default.a.createElement(Dialog["a" /* default */],{maxWidth:"md",fullWidth:true,className:classes.dialogContainer,onClose:handleClose,"aria-labelledby":"expression-builder-title",open:open,PaperProps:{className:'appBarShift'}},/*#__PURE__*/react_default.a.createElement(DialogTitle["a" /* default */],{className:classes.builderTitle,id:"expression-builder-title",disableTypography:true},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.builderTitleText,variant:"h6"},t('expression-builder')),/*#__PURE__*/react_default.a.createElement(IconButton["a" /* default */],{"aria-label":"close",className:props.classes.closeButton,onClick:handleClose},/*#__PURE__*/react_default.a.createElement(Close_default.a,null))),/*#__PURE__*/react_default.a.createElement(DialogContent["a" /* default */],{dividers:true},/*#__PURE__*/react_default.a.createElement(presentational_ExpressionBuilder_ExpressionBuilder,{expression:expression,targetType:props.targetType,handleChange:handleExpressionBuilderChange,setIsValid:props.setIsValid})),/*#__PURE__*/react_default.a.createElement(DialogActions["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{variant:"contained",size:"large",color:"primary",className:props.classes.submitButton,onClick:handleSave},props.t('btn-save')))));};/* harmony default export */ var ExpressionBuilder_ExpressionBuilderDialog = (Object(redux["d" /* compose */])(Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(ExpressionBuilder_styles))(ExpressionBuilderDialog_ExpressionBuilderDialog));
// CONCATENATED MODULE: ./src/components/presentational/ExpressionBuilder/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var presentational_ExpressionBuilder = (presentational_ExpressionBuilder_ExpressionBuilder);
// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/FormGroup/FormGroup.js
var FormGroup = __webpack_require__(455);

// CONCATENATED MODULE: ./src/components/presentational/ScheduleBuilder/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var ScheduleBuilder_styles_styles=function styles(theme){return{formControl:{'& > *':{margin:theme.spacing(1)}},formControlRow:{paddingLeft:theme.spacing(1),alignItems:'baseline'},formLabel:{backgroundColor:theme.palette.forgerock.white,paddingRight:theme.spacing(),textTransform:'capitalize'},inlineLabel:{fontWeight:'bold'},inlineLabelGrid:{alignSelf:'center'},typographyLabel:{alignSelf:'flex-end',marginLeft:theme.spacing(),marginRight:theme.spacing(),'&[disabled]':{color:theme.palette.action.disabled}}};};/* harmony default export */ var ScheduleBuilder_styles = (ScheduleBuilder_styles_styles);
// CONCATENATED MODULE: ./src/utils/chronStringBuilder.js
var getRandomIntInclusive=function getRandomIntInclusive(min,max){var min1=Math.ceil(min);var max1=Math.floor(max);return Math.floor(Math.random()*(max1-min1+1))+min1;};var chronStringBuilder={toCronString:function toCronString(scheduleObj){var every=null,start=null,date=null;var seconds=getRandomIntInclusive(0,59);var minutes=getRandomIntInclusive(0,4);var secondsMinutes=seconds+' '+minutes;if(scheduleObj.repeatType==='daily'){every=scheduleObj.dailyRate.toString();start=scheduleObj.startDay.toString();return secondsMinutes+' 0 '+(start+'/'+every)+' * ?';}if(scheduleObj.repeatType==='weekly'){var days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];var daySched=[];for(var i=0;i<days.length;i++){if(scheduleObj.daysOfWeek[days[i]]){daySched.push(i+1);}}// If no days are selected, scheduleObj is invalid
if(daySched.length===0)return false;return secondsMinutes+' 0 ? * '+daySched.join(',');}if(scheduleObj.repeatType==='monthly'){every=scheduleObj.monthlyRate.toString();start=scheduleObj.startMonth.toString();date=scheduleObj.monthlyDate.toString();return secondsMinutes+' 0 '+(scheduleObj.useLastDay?'L':date)+' '+(start+'/'+every)+' ?';}if(scheduleObj.repeatType==='yearly'){start=scheduleObj.startMonth.toString();date=scheduleObj.monthlyDate.toString();return'0 0 0 '+(scheduleObj.useLastDay?'L':date)+' '+(start+'/0 ?');}return false;},toScheduleObject:function toScheduleObject(cronString,scheduleObj){var fields=cronString.split(' ');if(fields[4]==='*'){if(fields[5]==='?'){scheduleObj.repeatType='daily';var daySched=fields[3].split('/');scheduleObj.startDay=parseInt(daySched[0]);scheduleObj.dailyRate=parseInt(daySched[1]);}else if(fields[3]==='?'){scheduleObj.repeatType='weekly';var days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];var cronStringDays=fields[5].split(',');scheduleObj.daysOfWeek={Sunday:false,Monday:false,Tuesday:false,Wednesday:false,Thursday:false,Friday:false,Saturday:false};for(var i=0;i<cronStringDays.length;i++){scheduleObj.daysOfWeek[days[parseInt(cronStringDays[i])-1]]=true;}}}else{scheduleObj.repeatType='monthly';if(fields[3]==='L'){scheduleObj.useLastDay=true;}else{scheduleObj.monthlyDate=parseInt(fields[3]);}var monthSched=fields[4].split('/');scheduleObj.startMonth=parseInt(monthSched[0]);scheduleObj.monthlyRate=parseInt(monthSched[1]);}}};/* harmony default export */ var utils_chronStringBuilder = (chronStringBuilder);
// CONCATENATED MODULE: ./src/components/presentational/ScheduleBuilder/ScheduleBuilder.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var ScheduleBuilder_ScheduleBuilder=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(ScheduleBuilder,_Component);function ScheduleBuilder(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,ScheduleBuilder);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(ScheduleBuilder)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{repeatType:'daily',dailyRate:1,startDay:1,daysOfWeek:{'Monday':false,'Tuesday':false,'Wednesday':false,'Thursday':false,'Friday':false,'Saturday':false,'Sunday':false},monthsOfYear:[{name:'January',id:1},{name:'February',id:2},{name:'March',id:3},{name:'April',id:4},{name:'May',id:5},{name:'June',id:6},{name:'July',id:7},{name:'August',id:8},{name:'September',id:9},{name:'October',id:10},{name:'November',id:11},{name:'December',id:12}],monthlyRate:1,monthlyDate:1,startMonth:1,useLastDay:false});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleScheduleChange",function(evt,value,parent){var newState=null;if(parent){newState=Object(objectSpread["a" /* default */])({},_this.state,Object(defineProperty["a" /* default */])({},parent,Object(objectSpread["a" /* default */])({},_this.state[parent],Object(defineProperty["a" /* default */])({},evt.target.name,value))));}else{var val=value.props?value.props.value:value;if(evt&&evt.target.name){newState=Object(objectSpread["a" /* default */])({},_this.state,Object(defineProperty["a" /* default */])({},evt.target.name,val));}}if(!lodash_default.a.isNull(newState)){var chron=utils_chronStringBuilder.toCronString(newState);_this.setState(newState);_this.props.handleChange(chron);}});return _this;}Object(createClass["a" /* default */])(ScheduleBuilder,[{key:"componentDidMount",value:function componentDidMount(){if(this.props.value){var newState={};utils_chronStringBuilder.toScheduleObject(this.props.value,newState);this.setState(newState);}this.setState({hasError:false});}},{key:"componentDidUpdate",value:function componentDidUpdate(prevProps,prevState){var _this$state=this.state,repeatType=_this$state.repeatType,daysOfWeek=_this$state.daysOfWeek;var hasError=false;if(this.props.value===''&&prevProps.value===''){var chron=utils_chronStringBuilder.toCronString(this.state);this.props.handleChange(chron);}else if(repeatType==='weekly'&&!lodash_default.a.isEqual(daysOfWeek,prevState.daysOfWeek)){hasError=lodash_default.a.chain(daysOfWeek).values().every(function(day){return day===false;}).value();// _.values(daysOfWeek)
this.setState({hasError:hasError});}else if(repeatType!=='weekly'&&this.state.hasError){this.setState({hasError:hasError});}}},{key:"render",value:function render(){var _this2=this;var _this$props=this.props,t=_this$props.t,classes=_this$props.classes,field=_this$props.field;var _this$state2=this.state,repeatType=_this$state2.repeatType,daysOfWeek=_this$state2.daysOfWeek,dailyRate=_this$state2.dailyRate,monthsOfYear=_this$state2.monthsOfYear,monthlyRate=_this$state2.monthlyRate,monthlyDate=_this$state2.monthlyDate,startDay=_this$state2.startDay,startMonth=_this$state2.startMonth,useLastDay=_this$state2.useLastDay,hasError=_this$state2.hasError;return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{error:hasError,className:classes.formControl,fullWidth:true},/*#__PURE__*/react_default.a.createElement(FormLabel["a" /* default */],{className:classes.formLabel,component:"legend"},field.label),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:2,className:classes.inlineLabelGrid},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.inlineLabel,component:"span"},t('schedule-builder-repeat'))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:10},/*#__PURE__*/react_default.a.createElement(RadioGroup["a" /* default */],{row:true// aria-label='repeat-type' 
,name:"repeatType"// label='repeat'
,value:repeatType,onChange:this.handleScheduleChange},/*#__PURE__*/react_default.a.createElement(FormControlLabel["a" /* default */],{value:"daily",control:/*#__PURE__*/react_default.a.createElement(Radio["a" /* default */],null),label:t('schedule-builder-daily')}),/*#__PURE__*/react_default.a.createElement(FormControlLabel["a" /* default */],{value:"weekly",control:/*#__PURE__*/react_default.a.createElement(Radio["a" /* default */],null),label:t('schedule-builder-weekly')}),/*#__PURE__*/react_default.a.createElement(FormControlLabel["a" /* default */],{value:"monthly",control:/*#__PURE__*/react_default.a.createElement(Radio["a" /* default */],null),label:t('schedule-builder-monthly')}))))),repeatType==='daily'&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.formControlRow},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:2,className:classes.inlineLabelGrid},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.inlineLabel,component:"span"},t('schedule-builder-repeat-every'))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:10},/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{className:classes.formControl},/*#__PURE__*/react_default.a.createElement(FormGroup["a" /* default */],{row:true},/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{name:"dailyRate",value:dailyRate,onChange:this.handleScheduleChange},Array(30).fill().map(function(x,i){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:i,value:i+1},i+1);})),/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.typographyLabel,component:"span"},t('schedule-builder-daily-rate')))),/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{className:classes.formControl},/*#__PURE__*/react_default.a.createElement(FormGroup["a" /* default */],{row:true},/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{name:"startDay",value:startDay,onChange:this.handleScheduleChange},Array(31).fill().map(function(x,i){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:i,value:i+1},i+1);})),/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.typographyLabel,component:"span"},t('schedule-builder-start-day')))))),repeatType==='weekly'&&/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{className:classes.formControl,value:daysOfWeek,fullWidth:true},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:2,className:classes.inlineLabelGrid},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.inlineLabel,component:"span"},t('schedule-builder-repeat-on'))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:10},/*#__PURE__*/react_default.a.createElement(FormGroup["a" /* default */],{row:true},Object.entries(daysOfWeek).map(function(_ref){var _ref2=Object(slicedToArray["a" /* default */])(_ref,2),key=_ref2[0],value=_ref2[1];return/*#__PURE__*/react_default.a.createElement(FormControlLabel["a" /* default */],{key:Object(v4["a" /* default */])(),control:/*#__PURE__*/react_default.a.createElement(Checkbox["a" /* default */],{checked:value,name:key,onChange:function onChange(evt,val){return _this2.handleScheduleChange(evt,val,'daysOfWeek');}})// name={key}
,label:key});}))))),repeatType==='monthly'&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.formControlRow},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:2,className:classes.inlineLabelGrid},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.inlineLabel,component:"span"},t('schedule-builder-repeat-every'))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:10},/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{className:classes.formControl},/*#__PURE__*/react_default.a.createElement(FormGroup["a" /* default */],{row:true},/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{name:"monthlyRate",value:monthlyRate,onChange:this.handleScheduleChange},Array(30).fill().map(function(x,i){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:i,value:i+1},i+1);})),/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.typographyLabel,component:"span"},t('schedule-builder-monthly-rate')))),/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{className:classes.formControl},/*#__PURE__*/react_default.a.createElement(FormGroup["a" /* default */],{row:true},/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{name:"startMonth",value:startMonth,onChange:this.handleScheduleChange},monthsOfYear.map(function(month){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:month.id,value:month.id},t('getMonthNameFromInt',{date:month.id-1}));}))))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:2,className:classes.inlineLabelGrid},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.inlineLabel,component:"span"},t('schedule-builder-repeat-on'))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:5},/*#__PURE__*/react_default.a.createElement(FormGroup["a" /* default */],{row:true},/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{name:"monthlyDate",value:monthlyDate,disabled:useLastDay,onChange:this.handleScheduleChange},Array(31).fill().map(function(x,i){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:i,value:i+1},i+1);})),/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{disabled:useLastDay,className:classes.typographyLabel,component:"span"},t('schedule-builder-start-day')))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:5},/*#__PURE__*/react_default.a.createElement(FormControlLabel["a" /* default */],{className:classes.checkboxLabel,control:/*#__PURE__*/react_default.a.createElement(Checkbox["a" /* default */],{checked:useLastDay,onChange:this.handleScheduleChange,name:"useLastDay"}),label:t('schedule-builder-last-month-day')}))),hasError&&/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],{error:hasError},t('schedule-builder-invalid')));}}]);return ScheduleBuilder;}(react["Component"]);/* harmony default export */ var presentational_ScheduleBuilder_ScheduleBuilder = (Object(redux["d" /* compose */])(Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(ScheduleBuilder_styles))(ScheduleBuilder_ScheduleBuilder));
// CONCATENATED MODULE: ./src/components/presentational/ScheduleBuilder/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var presentational_ScheduleBuilder = (presentational_ScheduleBuilder_ScheduleBuilder);
// EXTERNAL MODULE: ./node_modules/@material-ui/icons/ArrowBack.js
var ArrowBack = __webpack_require__(287);
var ArrowBack_default = /*#__PURE__*/__webpack_require__.n(ArrowBack);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/ArrowForward.js
var ArrowForward = __webpack_require__(286);
var ArrowForward_default = /*#__PURE__*/__webpack_require__.n(ArrowForward);

// CONCATENATED MODULE: ./src/components/presentational/TransferList/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var TransferList_styles_styles=function styles(theme){return{root:{margin:'auto',width:'auto'},paper:{// width: 200,
height:300,overflow:'auto'},button:{margin:theme.spacing(0.5,0)},formControl:{'& > *':{margin:theme.spacing(0)// marginBottom: 0,
}},formLabel:{backgroundColor:theme.palette.forgerock.white,paddingRight:theme.spacing(),textTransform:'capitalize',marginBottom:0},headerTitle:{fontWeight:'bold',marginRight:theme.spacing()},listHeader:{backgroundColor:theme.palette.background.paper,borderBottom:"1px solid ".concat(theme.palette.divider),textTransform:'capitalize'}};};/* harmony default export */ var TransferList_styles = (TransferList_styles_styles);
// CONCATENATED MODULE: ./src/components/presentational/TransferList/TransferList.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var TransferList_TransferList=function TransferList(props){var _React$useState=react_default.a.useState([]),_React$useState2=Object(slicedToArray["a" /* default */])(_React$useState,2),policyList=_React$useState2[0],setPolicyList=_React$useState2[1];// eslint-disable-line no-unused-vars
var _React$useState3=react_default.a.useState([]),_React$useState4=Object(slicedToArray["a" /* default */])(_React$useState3,2),left=_React$useState4[0],setLeft=_React$useState4[1];var _React$useState5=react_default.a.useState([]),_React$useState6=Object(slicedToArray["a" /* default */])(_React$useState5,2),right=_React$useState6[0],setRight=_React$useState6[1];var _React$useState7=react_default.a.useState(''),_React$useState8=Object(slicedToArray["a" /* default */])(_React$useState7,2),input=_React$useState8[0],setInput=_React$useState8[1];var _React$useState9=react_default.a.useState(false),_React$useState10=Object(slicedToArray["a" /* default */])(_React$useState9,2),filteredByValue=_React$useState10[0],setFilteredByValue=_React$useState10[1];var t=props.t,classes=props.classes,value=props.value,handleChange=props.handleChange,scanPolicies=props.scanPolicies;var filterPolicies=react_default.a.useRef(lodash_default.a.debounce(props.getPoliciesForScan,250));react_default.a.useEffect(function(){filterPolicies.current(input);},[input]);react_default.a.useEffect(function(){if(props.value&&props.value.length>0){var _value=props.value.map(function(policy){return policy.replace('managed/policy/','');});var _policyList=scanPolicies.map(function(policy){return{_id:policy._id,displayName:policy.name};});var selected=lodash_default.a.filter(_policyList,function(policy){return _value.indexOf(policy._id)>=0;});setRight(selected);setFilteredByValue(true);}},[]);react_default.a.useEffect(function(){var policyList=scanPolicies.map(function(policy){return{_id:policy._id,displayName:policy.name};});var selected=right;if(props.value&&props.value.length>0&&!filteredByValue){var _value2=props.value.map(function(policy){return policy.replace('managed/policy/','');});selected=lodash_default.a.filter(policyList,function(policy){return _value2.indexOf(policy._id)>=0;});setRight(selected);setFilteredByValue(true);}setPolicyList(policyList);setLeft(lodash_default.a.differenceBy(policyList,selected,'_id'));},[scanPolicies]);react_default.a.useEffect(function(){if(!lodash_default.a.isEqual(value,right)){handleChange(right);}},[right]);var handleInputChange=function handleInputChange(evt){setInput(evt.target.value);};var handleToggle=function handleToggle(value,array){return function(){var fromArray,fromUpdate,toArray,toUpdate=null;if(array==='left'){fromArray=lodash_default.a.cloneDeep(left);fromUpdate=setLeft;toArray=lodash_default.a.cloneDeep(right);toUpdate=setRight;}else{fromArray=lodash_default.a.cloneDeep(right);fromUpdate=setRight;toArray=lodash_default.a.cloneDeep(left);toUpdate=setLeft;}fromUpdate(lodash_default.a.filter(fromArray,function(policy){return policy._id!==value._id;}));toUpdate(lodash_default.a.sortBy(toArray.concat(value),'displayName'));};};var handleAllRight=function handleAllRight(){setRight(right.concat(left));setLeft([]);};var handleAllLeft=function handleAllLeft(){setLeft(left.concat(right));setRight([]);};var customList=function customList(policies,array){return/*#__PURE__*/react_default.a.createElement(Paper["a" /* default */],{className:classes.paper},/*#__PURE__*/react_default.a.createElement(List["a" /* default */],{dense:true,component:"div",role:"list",subheader:/*#__PURE__*/react_default.a.createElement(ListSubheader["a" /* default */],{className:classes.listHeader},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.headerTitle,component:"span"},array==='left'?t('policies'):t('selected')," "),"".concat(policies.length,"/").concat(scanPolicies.length))},policies.map(function(policy){var labelId="transfer-list-item-".concat(policy.displayName,"-label");return/*#__PURE__*/react_default.a.createElement(ListItem["a" /* default */],{key:policy._id,role:"listitem",button:true,onClick:handleToggle(policy,array)},/*#__PURE__*/react_default.a.createElement(ListItemText["a" /* default */],{id:labelId,primary:policy.displayName}));}),/*#__PURE__*/react_default.a.createElement(ListItem["a" /* default */],null)));};return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:5},/*#__PURE__*/react_default.a.createElement(TextField["a" /* default */],{id:"policy-filter",label:t('search-filter'),placeholder:t('filter'),fullWidth:true,margin:"normal",value:input,onChange:handleInputChange}))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,justify:"center",alignItems:"center",className:classes.root},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12,sm:5},customList(left,'left')),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12,sm:2},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,direction:"column",alignItems:"center"},/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{variant:"outlined",size:"small",className:classes.button,onClick:handleAllRight,disabled:left.length===0,"aria-label":"move all right"},/*#__PURE__*/react_default.a.createElement(ArrowForward_default.a,null)),/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{variant:"outlined",size:"small",className:classes.button,onClick:handleAllLeft,disabled:right.length===0,"aria-label":"move all left"},/*#__PURE__*/react_default.a.createElement(ArrowBack_default.a,null)))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12,sm:5},customList(right,'right'))));};var TransferList_mapStateToProps=function mapStateToProps(state){var async_fields=state.async_fields;return async_fields;};var TransferList_mapDispatchToProps={getPoliciesForScan:async_fields_actions_getPoliciesForScan};/* harmony default export */ var presentational_TransferList_TransferList = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(TransferList_mapStateToProps,TransferList_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(TransferList_styles))(TransferList_TransferList));
// CONCATENATED MODULE: ./src/components/presentational/TransferList/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var presentational_TransferList = (presentational_TransferList_TransferList);
// CONCATENATED MODULE: ./src/components/presentational/DurationSelect/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var DurationSelect_styles_styles=function styles(theme){return{durationLabel:{alignSelf:'center'},formControlLabel:{paddingLeft:theme.spacing(.5),paddingRight:theme.spacing(.5),backgroundColor:theme.palette.forgerock.white}};};/* harmony default export */ var DurationSelect_styles = (DurationSelect_styles_styles);
// CONCATENATED MODULE: ./src/components/presentational/DurationSelect/DurationSelect.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var DurationSelect_DurationSelect=function DurationSelect(props){var classes=props.classes,durationType=props.durationType,errors=props.errors,field=props.field,handleBlur=props.handleBlur,handleChange=props.handleChange,maxUnit=props.maxUnit,t=props.t,touched=props.touched,value=props.value;var fieldId=lodash_default.a.isString(field)?field:field.id;var unitCeiling=maxUnit||30;var getDurationLabel=function getDurationLabel(){if(durationType==='policy-scan'||durationType==='configure-reactive'){return t('duration-select-after-violation');}else if(durationType==='user-cert'||durationType==='object-cert'){return /escalationSchedule\.\d{1,}$/.test(fieldId)?t('duration-select-before-stage-deadline'):t('duration-select-after-campaign');}else if(durationType==='escalation-policy-scan'){return t('duration-select-escalation-expiration');}else if(durationType==='escalation-user-cert'||durationType==='escalation-object-cert'){return t('duration-select-escalation-deadline');}};return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,spacing:1,alignItems:"stretch"},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:4,lg:5},/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{name:"".concat(fieldId,".unit"),fullWidth:true,variant:"outlined",error:Boolean(errors&&touched&&(lodash_default.a.isString(errors)||errors.unit&&touched.unit))},/*#__PURE__*/react_default.a.createElement(InputLabel["a" /* default */],{id:"".concat(fieldId,"-unit-label"),className:classes.formControlLabel},t('duration-select-amount')),/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{labelId:"".concat(fieldId,"-unit-label"),name:"".concat(fieldId,".unit"),value:value.unit,onBlur:handleBlur,onChange:handleChange},Array(unitCeiling).fill().map(function(x,i){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:i,value:i+1},i+1);})),lodash_default.a.isObject(errors)&&touched&&errors.unit&&touched.unit&&/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],{id:"".concat(fieldId,"-helper-text")},errors.unit))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:4,lg:5},/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{name:"".concat(fieldId,".period"),fullWidth:true,variant:"outlined",error:Boolean(errors&&touched&&(lodash_default.a.isString(errors)||errors.period&&touched.period))},/*#__PURE__*/react_default.a.createElement(InputLabel["a" /* default */],{id:"".concat(fieldId,"-period-label"),className:classes.formControlLabel},t('duration-select-period')),/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{labelId:"".concat(fieldId,"-period-label"),name:"".concat(fieldId,".period"),value:value.period,onBlur:handleBlur,onChange:handleChange},/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{value:"days"},t('duration-select-days')),/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{value:"weeks"},t('duration-select-weeks'))),lodash_default.a.isObject(errors)&&touched&&errors.period&&touched.period&&/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],{id:"".concat(fieldId,"-helper-text")},errors.period))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:4,lg:2,className:classes.durationLabel},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{component:"span"},getDurationLabel()))));};/* harmony default export */ var presentational_DurationSelect_DurationSelect = (Object(redux["d" /* compose */])(Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(DurationSelect_styles))(DurationSelect_DurationSelect));
// CONCATENATED MODULE: ./src/components/presentational/DurationSelect/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var presentational_DurationSelect = (presentational_DurationSelect_DurationSelect);
// EXTERNAL MODULE: ./node_modules/@material-ui/icons/ArrowDownward.js
var ArrowDownward = __webpack_require__(289);
var ArrowDownward_default = /*#__PURE__*/__webpack_require__.n(ArrowDownward);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/ArrowUpward.js
var ArrowUpward = __webpack_require__(288);
var ArrowUpward_default = /*#__PURE__*/__webpack_require__.n(ArrowUpward);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/ExpandMore.js
var ExpandMore = __webpack_require__(52);
var ExpandMore_default = /*#__PURE__*/__webpack_require__.n(ExpandMore);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/ExpansionPanel/ExpansionPanel.js + 1 modules
var ExpansionPanel = __webpack_require__(544);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/ExpansionPanelSummary/ExpansionPanelSummary.js
var ExpansionPanelSummary = __webpack_require__(518);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/ExpansionPanelDetails/ExpansionPanelDetails.js
var ExpansionPanelDetails = __webpack_require__(519);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Zoom/Zoom.js
var Zoom = __webpack_require__(522);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/ChevronRight.js
var ChevronRight = __webpack_require__(62);
var ChevronRight_default = /*#__PURE__*/__webpack_require__.n(ChevronRight);

// EXTERNAL MODULE: ./node_modules/babel-preset-react-app/node_modules/@babel/runtime/regenerator/index.js
var regenerator = __webpack_require__(158);
var regenerator_default = /*#__PURE__*/__webpack_require__.n(regenerator);

// EXTERNAL MODULE: ./node_modules/babel-preset-react-app/node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js
var asyncToGenerator = __webpack_require__(223);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/ListItemIcon/ListItemIcon.js
var ListItemIcon = __webpack_require__(517);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/styles/useTheme.js
var useTheme = __webpack_require__(35);

// CONCATENATED MODULE: ./src/components/presentational/EntitlementFilter/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var EntitlementFilter_styles_styles=function styles(theme){return{root:{borderBottom:'1px solid rgba(0, 0, 0, .125)',margin:0,'&.Mui-expanded':{margin:0}},btnEntitlement:{marginRight:theme.spacing()},btnAddEntitlement:{backgroundColor:theme.palette.forgerock.blue,color:theme.palette.forgerock.white},btnRemoveEntitlement:{backgroundColor:theme.palette.error.main,color:theme.palette.forgerock.white,'&:hover':{backgroundColor:theme.palette.error.dark}},checkboxIcon:{minWidth:'max-content'},collapse:{width:'100%'},criteriaLabel:{color:theme.palette.text.hint},entitlementFilterRow:{paddingTop:theme.spacing()},listItem:{width:'100%'},panelHeader:{backgroundColor:theme.palette.grey[200],position:'inherit'},panelContent:{flexWrap:'wrap',padding:theme.spacing()},paper:{padding:theme.spacing()},relationshipAttrLabel:{display:'flex',flexGrow:1,'& > .MuiFormControlLabel-label':{flexGrow:1},'& .MuiTypography-root':{display:'inline-flex',justifyContent:'space-between'}},selectedCountLink:{color:theme.palette.forgerock.blue},'&.MuiListItemIcon-root':{minWidth:0}};};/* harmony default export */ var EntitlementFilter_styles = (EntitlementFilter_styles_styles);
// CONCATENATED MODULE: ./src/components/presentational/EntitlementFilter/EntitlementFilter.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var EntitlementFilter_EntitlementFilter=function EntitlementFilter(props){var classes=props.classes,certifiable_attributes=props.certifiable_attributes,certType=props.certType,filter=props.filter,managed_objects=props.managed_objects,t=props.t;var theme=Object(useTheme["a" /* default */])();var isMounted=react_default.a.useRef(null);var _React$useState=react_default.a.useState({attributes:false,applications:false}),_React$useState2=Object(slicedToArray["a" /* default */])(_React$useState,2),expanded=_React$useState2[0],setExpanded=_React$useState2[1];var _React$useState3=react_default.a.useState(filter),_React$useState4=Object(slicedToArray["a" /* default */])(_React$useState3,2),checked=_React$useState4[0],setChecked=_React$useState4[1];var _React$useState5=react_default.a.useState({}),_React$useState6=Object(slicedToArray["a" /* default */])(_React$useState5,2),attributeOptions=_React$useState6[0],setAttributeOptions=_React$useState6[1];var _React$useState7=react_default.a.useState({}),_React$useState8=Object(slicedToArray["a" /* default */])(_React$useState7,2),queryResults=_React$useState8[0],setQueryResults=_React$useState8[1];var _React$useState9=react_default.a.useState({}),_React$useState10=Object(slicedToArray["a" /* default */])(_React$useState9,2),attrFilterTargets=_React$useState10[0],setAttrFilterTargets=_React$useState10[1];var _React$useState11=react_default.a.useState({}),_React$useState12=Object(slicedToArray["a" /* default */])(_React$useState11,2),modalObj=_React$useState12[0],setModalObj=_React$useState12[1];var queryOperators=[{'label':t('expr-builder-contains'),'operator':'co'},{'label':t('expr-builder-equals'),'operator':'eq'},{'label':t('expr-builder-startsWith'),'operator':'sw'},{'label':t('expr-builder-doesNotContain'),'operator':'!co'},{'label':t('expr-builder-doesNotEqual'),'operator':'!eq'}];var boolOperators=['or','and'];var debouncedQueryForEntitlements=react_default.a.useRef(lodash_default.a.debounce(/*#__PURE__*/function(){var _ref=Object(asyncToGenerator["a" /* default */])(/*#__PURE__*/regenerator_default.a.mark(function _callee(attr){var newAttrQueryResults,entitlements,_id,rest;return regenerator_default.a.wrap(function _callee$(_context){while(1){switch(_context.prev=_context.next){case 0:newAttrQueryResults={pageNumber:1,pageSize:0,result:[],resultCount:0,totalPagedResults:-1};_context.prev=1;_context.next=4;return async_fields_actions_queryForEntitlement(attr);case 4:entitlements=_context.sent;_id=entitlements._id,rest=Object(objectWithoutProperties["a" /* default */])(entitlements,["_id"]);newAttrQueryResults=rest;_context.next=11;break;case 9:_context.prev=9;_context.t0=_context["catch"](1);case 11:// eslint-disable-line no-empty
if(isMounted.current){setAttrFilterTargets(Object(defineProperty["a" /* default */])({},attr.attribute,newAttrQueryResults));}case 12:case"end":return _context.stop();}}},_callee,null,[[1,9]]);}));return function(_x){return _ref.apply(this,arguments);};}(),250));Object(react["useEffect"])(function(){// When component mounted
isMounted.current=true;return function(){// executed on unmount
isMounted.current=false;};},[]);Object(react["useEffect"])(function(){props.getCertifiableAttributes();},[]);Object(react["useEffect"])(function(){if(checked&&checked.attributes){var newAttributeOptions=lodash_default.a.cloneDeep(attributeOptions);lodash_default.a.keys(checked.attributes).map(function(key){if(managed_objects[certType][key]&&managed_objects[certType][key].items){newAttributeOptions[key]=lodash_default.a.cloneDeep(managed_objects[certType][key].items);}});setAttributeOptions(newAttributeOptions);}},[]);Object(react["useEffect"])(function(){setQueryResults(Object(objectSpread["a" /* default */])({},queryResults,attrFilterTargets));},[attrFilterTargets]);Object(react["useEffect"])(function(){if(props.modalObject){setModalObj(props.modalObject);}},[props.modalObject]);var usePrevious=function usePrevious(value){var ref=react_default.a.useRef();Object(react["useEffect"])(function(){ref.current=value;});return ref.current;};var prevChecked=usePrevious(checked);Object(react["useEffect"])(function(){var attribute=lodash_default.a.findKey(checked.attributes,function(value,key){return!prevChecked||!prevChecked.attributes[key]||!lodash_default.a.isEqual(value,prevChecked.attributes[key]);});if(attribute&&checked.attributes[attribute].selected&&attributeIsExpandable('attributes',attribute)){queryEntitlements(attribute);}props.onChange(checked);},[checked.attributes]);Object(react["useEffect"])(function(){props.onChange(checked);},[checked.certifyMetadata]);var handleChange=function handleChange(panel){return function(event,newExpanded){event.stopPropagation();setExpanded(Object(objectSpread["a" /* default */])({},expanded,Object(defineProperty["a" /* default */])({},panel,newExpanded)));};};var handleToggle=function handleToggle(type,value,propToSet){event.stopPropagation();var newChecked=lodash_default.a.cloneDeep(checked);var valuePathArray=value.split('.');var checkedAttr=lodash_default.a.get(newChecked,"".concat(type,".").concat(value,".").concat(propToSet));lodash_default.a.set(newChecked,"".concat(type,".").concat(value,".").concat(propToSet),!checkedAttr);if(type==='attributes'&&propToSet==='isOpen'&&newChecked.attributes[value].isOpen){lodash_default.a.set(newChecked,"".concat(type,".").concat(value,".selected"),true);}if(type==='applications'&&propToSet==='selected'&&valuePathArray.length>1){for(var i=1;i<valuePathArray.length;i++){var nodeInPath=valuePathArray.slice(0,valuePathArray.length-i).join('.');if(lodash_default.a.get("".concat(type,".").concat(nodeInPath,".selected"))){continue;}if(!checkedAttr){lodash_default.a.set(newChecked,"".concat(type,".").concat(nodeInPath,".selected"),!checkedAttr);}lodash_default.a.set(newChecked,"".concat(type,".").concat(nodeInPath,".isDisabled"),!checkedAttr);}}setChecked(newChecked);};var attributeIsExpandable=function attributeIsExpandable(type,attr){if(type==='attributes'){var schemaProps=managed_objects[certType][attr];if(!schemaProps){return false;}if(schemaProps.items&&schemaProps.items.type==='relationship'){return true;}}else if(type==='applications'){var application=lodash_default.a.find(props.certifiable_attributes.application,{name:attr});if(application&&application._systemAttributes&&Object.keys(application._systemAttributes).length>0){return true;}}return false;};var addNewQueryExpression=function addNewQueryExpression(type,attr){var newChecked=lodash_default.a.cloneDeep(checked);var newAttributeOptions=lodash_default.a.cloneDeep(attributeOptions);var targetFilter=lodash_default.a.get(newChecked,"".concat(type,".").concat(attr,".targetFilter"),[]);var queryBoolOperators=lodash_default.a.get(newChecked,"".concat(type,".").concat(attr,".boolOperators"),[]);if(!newAttributeOptions[attr]){newAttributeOptions[attr]=lodash_default.a.cloneDeep(managed_objects[certType][attr].items);setAttributeOptions(newAttributeOptions);}if(targetFilter.length>=1){lodash_default.a.set(newChecked,"".concat(type,".").concat(attr,".boolOperators"),[].concat(Object(toConsumableArray["a" /* default */])(queryBoolOperators),[boolOperators[0]]));}targetFilter.push({path:newAttributeOptions[attr].resourceCollection[0].path,attribute:newAttributeOptions[attr].resourceCollection[0].query.fields[0],operator:queryOperators[0].operator,value:''});lodash_default.a.set(newChecked,"".concat(type,".").concat(attr,".targetFilter"),targetFilter);setChecked(newChecked);};var removeQueryExpression=function removeQueryExpression(type,attr){var newChecked=lodash_default.a.cloneDeep(checked);var attribute=lodash_default.a.get(newChecked,"".concat(type,".").concat(attr));attribute.targetFilter.pop();if(attribute.queryBoolOperators){attribute.queryBoolOperators.pop();}lodash_default.a.set(newChecked,"".concat(type,".").concat(attr),attribute);setChecked(newChecked);};var updateAttributeFilter=function updateAttributeFilter(attr,filterIdx,evt,elem){var newChecked=lodash_default.a.cloneDeep(checked);if(evt.target.name==='boolOperator'){newChecked.attributes[attr].boolOperators[filterIdx-1]=evt.target.value;}else{newChecked.attributes[attr].targetFilter[filterIdx]=Object(objectSpread["a" /* default */])({},newChecked.attributes[attr].targetFilter[filterIdx],Object(defineProperty["a" /* default */])({},evt.target.name,evt.target.value));}setChecked(newChecked);};var getFieldsFromCollection=function getFieldsFromCollection(attr,filter){if(!attributeOptions[attr]){return null;}var fields=lodash_default.a.find(attributeOptions[attr].resourceCollection,{path:filter.path}).query.fields;return fields.map(function(field){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:field,value:field},field);});};var joinQueryExpressions=function joinQueryExpressions(attribute){var expressions=attribute.targetFilter;var attributeBoolOperators=attribute.boolOperators;var joinedArray=[];for(var i in expressions){joinedArray.push(expressions[i]);if(attributeBoolOperators&&attributeBoolOperators[i]){joinedArray.push(attributeBoolOperators[i]);}}return joinedArray;};var queryEntitlements=/*#__PURE__*/function(){var _ref2=Object(asyncToGenerator["a" /* default */])(/*#__PURE__*/regenerator_default.a.mark(function _callee2(attr){var attributeToQuery,entitlementFilter;return regenerator_default.a.wrap(function _callee2$(_context2){while(1){switch(_context2.prev=_context2.next){case 0:attributeToQuery=lodash_default.a.get(checked,"attributes.".concat(attr));entitlementFilter={managedObject:certType,attribute:attr};if(attributeToQuery&&attributeToQuery.targetFilter&&attributeToQuery.targetFilter.length>0){entitlementFilter.query=joinQueryExpressions(attributeToQuery);}debouncedQueryForEntitlements.current(entitlementFilter);case 4:case"end":return _context2.stop();}}},_callee2);}));return function queryEntitlements(_x2){return _ref2.apply(this,arguments);};}();var showTargetedEntitlementsDialog=function showTargetedEntitlementsDialog(evt,attr){evt.stopPropagation();var newModalObject={title:attr,data:queryResults[attr]?queryResults[attr].result:[]};props.changeDialogType('targeted-attribute');props.getModalObject('targeted-attribute',newModalObject,true);props.changeActiveGovernanceDialog('EntitlementFilterDialog');};var getUserEntitlementFilter=function getUserEntitlementFilter(attr){var attrBoolOperators=lodash_default.a.get(checked,"attributes.".concat(attr,".boolOperators"),[]);var targetFilter=lodash_default.a.get(checked,"attributes.".concat(attr,".targetFilter"),[]);return/*#__PURE__*/react_default.a.createElement(Paper["a" /* default */],{className:classes.paper},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{variant:"subtitle1",className:classes.criteriaLabel},"Add criteria to target specific entitlements:"),/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{variant:"contained",color:"secondary",className:Object(clsx_m["a" /* default */])(classes.btnEntitlement,classes.btnAddEntitlement),onClick:function onClick(){return addNewQueryExpression('attributes',attr);},startIcon:/*#__PURE__*/react_default.a.createElement(Add_default.a,null)},"Add"),/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{variant:"contained",color:"secondary",disabled:targetFilter.length===0,className:Object(clsx_m["a" /* default */])(classes.btnEntitlement,classes.btnRemoveEntitlement),onClick:function onClick(){return removeQueryExpression('attributes',attr);},startIcon:/*#__PURE__*/react_default.a.createElement(Remove_default.a,null)},"Remove"),targetFilter.map(function(filter,i){return/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{key:Object(v4["a" /* default */])(),container:true,spacing:1,className:classes.entitlementFilterRow},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:2},i>=1&&/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{name:"boolOperator",variant:"outlined",fullWidth:true,value:attrBoolOperators[i-1],onChange:function onChange(evt,elem){return updateAttributeFilter(attr,i,evt,elem);}},boolOperators.map(function(operator){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:operator,value:operator},t("expr-builder-bool-".concat(operator)));}))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:2},attributeOptions[attr]&&attributeOptions[attr].resourceCollection.length>1&&/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{name:"path",variant:"outlined",fullWidth:true,value:filter.path,renderValue:function renderValue(value){return lodash_default.a.find(attributeOptions[attr].resourceCollection,{path:value}).label;},onChange:function onChange(evt,elem){return updateAttributeFilter(attr,i,evt,elem);}},attributeOptions[attr].resourceCollection.map(function(coll){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:coll.path,value:coll.path},coll.label);}))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:2},/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{name:"attribute",variant:"outlined",fullWidth:true,value:filter.attribute,onChange:function onChange(evt){return updateAttributeFilter(attr,i,evt);}},getFieldsFromCollection(attr,filter))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:2},/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{name:"operator",variant:"outlined",fullWidth:true,value:filter.operator,onChange:function onChange(evt,elem){return updateAttributeFilter(attr,i,evt,elem);}},queryOperators.map(function(_ref3){var label=_ref3.label,operator=_ref3.operator;return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:operator,value:operator},label);}))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:2},/*#__PURE__*/react_default.a.createElement(TextField["a" /* default */],{name:"value"// autoFocus={true}
,variant:"outlined",fullWidth:true,defaultValue:filter.value,placeholder:"search",onChange:function onChange(evt){filter.value=evt.target.value;queryEntitlements(attr);},onBlur:function onBlur(){props.onChange(checked);}})));}));};var getNestedApplicationAttributes=function getNestedApplicationAttributes(appName,appAttributePath,checkedPath){var appAttrs=lodash_default.a.find(props.certifiable_attributes.application,{name:appName});if(!appAttrs||!appAttrs._systemAttributes){return null;}var nestedAttributes=null;if(lodash_default.a.isUndefined(appAttributePath)){appAttributePath='_systemAttributes';}nestedAttributes=lodash_default.a.get(appAttrs,appAttributePath);if(lodash_default.a.isUndefined(nestedAttributes)){return null;}if(!checkedPath){checkedPath="".concat(appName);}return Object.entries(nestedAttributes).map(function(_ref4){var _ref5=Object(slicedToArray["a" /* default */])(_ref4,2),key=_ref5[0],values=_ref5[1];var localCheckedPath=checkedPath.concat('.',key);var valueInChecked=lodash_default.a.get(checked,"applications.".concat(localCheckedPath),{selected:false});return/*#__PURE__*/react_default.a.createElement(react["Fragment"],{key:key},/*#__PURE__*/react_default.a.createElement(ListItem["a" /* default */],{button:true,className:classes.listItem,style:{marginLeft:theme.spacing(appAttributePath.split('.').length)},divider:lodash_default.a.get(checked,"applications.".concat(appName,".").concat(key,".isOpen"))},/*#__PURE__*/react_default.a.createElement(ListItemIcon["a" /* default */],{className:classes.checkboxIcon},/*#__PURE__*/react_default.a.createElement(Checkbox["a" /* default */],{edge:"start",checked:lodash_default.a.get(checked,"applications.".concat(localCheckedPath,".selected"),false),disabled:valueInChecked.isDisabled,onChange:function onChange(){return handleToggle('applications',"".concat(localCheckedPath),'selected');},tabIndex:-1,disableRipple:true,inputProps:{'aria-labelledby':key}})),!nestedAttributes[key].hasOwnProperty('_id')?/*#__PURE__*/react_default.a.createElement(FormControlLabel["a" /* default */],{onClick:function onClick(event){return handleToggle('applications',"".concat(localCheckedPath),'isOpen');},control:lodash_default.a.get(checked,"applications.".concat(localCheckedPath,".isOpen"))?/*#__PURE__*/react_default.a.createElement(ExpandMore_default.a,null):/*#__PURE__*/react_default.a.createElement(ChevronRight_default.a,null),label:key}):/*#__PURE__*/react_default.a.createElement(ListItemText["a" /* default */],{id:key,primary:key})),/*#__PURE__*/react_default.a.createElement(Collapse["a" /* default */],{in:lodash_default.a.get(checked,"applications.".concat(localCheckedPath,".isOpen")),className:classes.collapse},!nestedAttributes[key].hasOwnProperty('_id')&&getNestedApplicationAttributes(appName,appAttributePath.concat(".".concat(key)),localCheckedPath)));});};var renderAttributes=function renderAttributes(type){var attrType,attributes,name=null;if(type==='attributes'||type==='applications'){attrType=type==='attributes'?certType:'application';if(certType==='user'){attributes=certifiable_attributes[attrType];}else if(managed_objects[certType]){attributes=Object.entries(managed_objects[certType]).map(function(_ref6){var _ref7=Object(slicedToArray["a" /* default */])(_ref6,1),key=_ref7[0];return key;});lodash_default.a.remove(attributes,function(attr){return attr==='_id';});}name=type==='attributes'?'attributeName':'name';}if(!attributes){return null;}return attributes.map(function(attr,i){var attrName=lodash_default.a.isObject(attr)?attr[name]:attr;var valueInChecked=lodash_default.a.get(checked,"".concat(type,".").concat(attrName),{selected:false});return/*#__PURE__*/react_default.a.createElement(react["Fragment"],{key:attrName},/*#__PURE__*/react_default.a.createElement(ListItem["a" /* default */],{button:true,className:classes.listItem,divider:lodash_default.a.get(checked,"".concat(type,".").concat(attrName,".isOpen"))},/*#__PURE__*/react_default.a.createElement(ListItemIcon["a" /* default */],{className:classes.checkboxIcon},/*#__PURE__*/react_default.a.createElement(Checkbox["a" /* default */],{edge:"start",checked:lodash_default.a.get(checked,"".concat(type,".").concat(attrName,".selected"),false),disabled:valueInChecked.isDisabled,onChange:function onChange(){return handleToggle(type,attrName,'selected');},tabIndex:-1,disableRipple:true,inputProps:{'aria-labelledby':attrName}})),attributeIsExpandable(type,attrName)?/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(FormControlLabel["a" /* default */],{className:classes.relationshipAttrLabel,onClick:function onClick(){return handleToggle(type,attrName,'isOpen');},control:lodash_default.a.get(checked,"".concat(type,".").concat(attrName,".isOpen"))?/*#__PURE__*/react_default.a.createElement(ExpandMore_default.a,null):/*#__PURE__*/react_default.a.createElement(ChevronRight_default.a,null),label:/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],null,attrName)}),type==='attributes'&&lodash_default.a.get(checked,"".concat(type,".").concat(attrName,".selected"))&&/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{className:classes.selectedCountLink,onClick:function onClick(evt){return showTargetedEntitlementsDialog(evt,attrName);}},t('entitlement-filter-selected-count',{count:lodash_default.a.get(queryResults,"".concat(attrName,".resultCount"),0),entitlement:attrName})),/*#__PURE__*/react_default.a.createElement(presentational_GovernanceDialog,{dialogId:"EntitlementFilterDialog",onSubmitDialog:function onSubmitDialog(){props.changeActiveGovernanceDialog(null);},modalObject:modalObj}))):/*#__PURE__*/react_default.a.createElement(ListItemText["a" /* default */],{id:attrName,primary:attrName})),/*#__PURE__*/react_default.a.createElement(Collapse["a" /* default */],{in:lodash_default.a.get(checked,"".concat(type,".").concat(attrName,".isOpen")),className:classes.collapse},type==='attributes'?getUserEntitlementFilter(attr[name]||attrName):getNestedApplicationAttributes(attr[name])));});};return/*#__PURE__*/react_default.a.createElement("div",null,/*#__PURE__*/react_default.a.createElement(ExpansionPanel["a" /* default */],{TransitionProps:{unmountOnExit:true},square:true,className:classes.root,expanded:expanded.attributes,onChange:handleChange('attributes')},/*#__PURE__*/react_default.a.createElement(ExpansionPanelSummary["a" /* default */],{className:classes.panelHeader},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],null,expanded.attributes?/*#__PURE__*/react_default.a.createElement(ExpandMore_default.a,null):/*#__PURE__*/react_default.a.createElement(ChevronRight_default.a,null)," Attributes")),/*#__PURE__*/react_default.a.createElement(ExpansionPanelDetails["a" /* default */],{className:classes.panelContent},renderAttributes('attributes'))),certType==='user'?/*#__PURE__*/react_default.a.createElement(ExpansionPanel["a" /* default */],{TransitionProps:{unmountOnExit:true},square:true,className:classes.root,expanded:expanded.applications,onChange:handleChange('applications')},/*#__PURE__*/react_default.a.createElement(ExpansionPanelSummary["a" /* default */],{className:classes.panelHeader},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],null,expanded.applications?/*#__PURE__*/react_default.a.createElement(ExpandMore_default.a,null):/*#__PURE__*/react_default.a.createElement(ChevronRight_default.a,null)," ",t('details-application'))),/*#__PURE__*/react_default.a.createElement(ExpansionPanelDetails["a" /* default */],{className:classes.panelContent},renderAttributes('applications'))):/*#__PURE__*/react_default.a.createElement(ExpansionPanel["a" /* default */],{TransitionProps:{unmountOnExit:true},square:true,className:classes.root,expanded:true},/*#__PURE__*/react_default.a.createElement(ExpansionPanelDetails["a" /* default */],{className:classes.panelContent},/*#__PURE__*/react_default.a.createElement(FormControlLabel["a" /* default */]// aria-label="Acknowledge"
,{onClick:function onClick(event){return event.stopPropagation();},onFocus:function onFocus(event){return event.stopPropagation();},value:checked.certifyMetadata,onChange:function onChange(){return setChecked(Object(objectSpread["a" /* default */])({},checked,{certifyMetadata:!checked.certifyMetadata}));},control:/*#__PURE__*/react_default.a.createElement(Checkbox["a" /* default */],{checked:checked.certifyMetadata}),label:t('certify')+' '+t('details-metadata-object')}))));};var EntitlementFilter_mapStateToProps=function mapStateToProps(state){var _state$config=state.config,certifiable_attributes=_state$config.certifiable_attributes,managed_objects=_state$config.managed_objects,modalObject=state.generic.modalObject;return{certifiable_attributes:certifiable_attributes,managed_objects:managed_objects,modalObject:modalObject};};var EntitlementFilter_mapDispatchToProps={getCertifiableAttributes:config_actions_getCertifiableAttributes,getModalObject:generic_actions_getModalObject,changeActiveGovernanceDialog:generic_actions_changeActiveGovernanceDialog,changeDialogType:generic_actions_changeDialogType};/* harmony default export */ var presentational_EntitlementFilter_EntitlementFilter = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(EntitlementFilter_mapStateToProps,EntitlementFilter_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(EntitlementFilter_styles))(EntitlementFilter_EntitlementFilter));
// CONCATENATED MODULE: ./src/components/presentational/EntitlementFilter/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var presentational_EntitlementFilter = (presentational_EntitlementFilter_EntitlementFilter);
// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Card/Card.js
var Card = __webpack_require__(520);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/CardContent/CardContent.js
var CardContent = __webpack_require__(521);

// CONCATENATED MODULE: ./src/components/presentational/EscalationSchedule/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var EscalationSchedule_styles_styles=function styles(theme){return{root:{margin:theme.spacing()},cardContent:{paddingTop:0,'&:last-child':{paddingBottom:theme.spacing(2)}},certifierTypeGrid:{maxWidth:'50%'},escOwnerLabel:{marginTop:"".concat(theme.spacing(3),"px!important")},formControl:{paddingTop:theme.spacing(2),'& > *':{marginTop:theme.spacing(1)},'& > button':{marginLeft:theme.spacing(1)},'& label':{paddingLeft:theme.spacing(.5),paddingRight:theme.spacing(.5),backgroundColor:theme.palette.forgerock.white}},escalationScheduleEntry:{minWidth:'fit-content'}};};/* harmony default export */ var EscalationSchedule_styles = (EscalationSchedule_styles_styles);
// CONCATENATED MODULE: ./src/components/presentational/EscalationSchedule/EscalationSchedule.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var EscalationSchedule_EscalationSchedule=function EscalationSchedule(props){var addEscalationDate=function addEscalationDate(){var newEscalation=lodash_default.a.cloneDeep(props.escalationSchedule);var newSchedule={unit:'',period:'',escalationType:'',escalationId:''};newEscalation.push(newSchedule);props.handleChange('escalationSchedule',newEscalation,null);};var removeEscalationDate=function removeEscalationDate(){if(props.escalationSchedule.length>0){var newEscalation=lodash_default.a.cloneDeep(props.escalationSchedule);newEscalation.pop();props.handleChange('escalationSchedule',newEscalation,null);}};var classes=props.classes,errorObject=props.errorObject,escalationSchedule=props.escalationSchedule,hasError=props.hasError,_handleChange=props.handleChange,t=props.t,touchedObject=props.touchedObject;var isAddEscalationButtonDisabled=function isAddEscalationButtonDisabled(){if(!escalationSchedule||escalationSchedule.length===0||!errorObject){return false;}return errorObject.some(function(err){return err&&(err.unit||err.period||err.escalationType||err.escalationId);});};return/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12,className:classes.formControl},/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{variant:"contained",color:"primary",disabled:isAddEscalationButtonDisabled(),startIcon:/*#__PURE__*/react_default.a.createElement(Add_default.a,null),onClick:function onClick(){return addEscalationDate();}},"Add escalation date"),/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{variant:"contained",className:classes.deleteEscalationEntryBtn,disabled:escalationSchedule.length===0,startIcon:/*#__PURE__*/react_default.a.createElement(Delete_default.a,null),onClick:function onClick(){return removeEscalationDate();}},"Remove escalation date"),escalationSchedule.map(function(escalation,escalationIdx){return/*#__PURE__*/react_default.a.createElement(Card["a" /* default */],{key:escalationIdx,variant:"outlined"},/*#__PURE__*/react_default.a.createElement(CardContent["a" /* default */],{className:classes.cardContent},/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{className:classes.formControl,error:hasError(escalationIdx,'unit')||hasError(escalationIdx,'period'),fullWidth:true},/*#__PURE__*/react_default.a.createElement(presentational_DurationSelect,{durationType:"escalation-".concat(props.formType),errors:hasError(escalationIdx,'unit')||hasError(escalationIdx,'period')?errorObject[escalationIdx]:{},field:"escalationSchedule.".concat(escalationIdx),handleBlur:function handleBlur(evt){return _handleChange(evt.target.name,evt.target.value,escalationIdx);},handleChange:function handleChange(evt){return _handleChange(evt.target.name,evt.target.value,escalationIdx);},touched:touchedObject?touchedObject[escalationIdx]:false,value:escalation})),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,spacing:1,className:classes.escalationScheduleEntry},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:6,className:classes.certifierTypeGrid},/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{variant:"outlined",className:classes.formControl,fullWidth:true,error:hasError(escalationIdx,'escalationType')},/*#__PURE__*/react_default.a.createElement(InputLabel["a" /* default */],{className:classes.escOwnerLabel,id:"escalationOwnerType-".concat(escalationIdx)},t('escalation-ownerType')),/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{variant:"outlined",name:"escalationSchedule.".concat(escalationIdx,".escalationType"),value:escalation.escalationType,onChange:function onChange(evt,child){return _handleChange(evt.target.name,child.props.value,escalationIdx);},onBlur:function onBlur(evt,child,c){return _handleChange(evt.target.name,evt.target.value,escalationIdx);},labelId:"escalationOwnerType-".concat(escalationIdx)},/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{value:"user"},t('stage-builder-certifierType-user')),/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{value:"authzGroup"},t('stage-builder-certifierType-authzGroup')),/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{value:"manager"},props.formType.includes('cert')?t('escalation-owner-certifierManager'):t('escalation-owner-policyOwnerManager'))),hasError(escalationIdx,'escalationType')&&/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],null,t('form-error-required')))),(escalation.escalationType==='user'||escalation.escalationType==='authzGroup')&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:6},/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{variant:"outlined",className:classes.formControl,fullWidth:true,error:hasError(escalationIdx,'escalationId')},/*#__PURE__*/react_default.a.createElement(presentational_AsyncSelect,{name:"escalationSchedule.".concat(escalationIdx,".escalationId"),error:hasError(escalationIdx,'escalationId')?Boolean(errorObject[escalationIdx].escalationId):null,variant:"outlined",label:t('escalation-owner'),fullWidth:true,targetType:escalation.escalationType==='user'?'userName':'authzGroup',value:escalation.escalationId,onChange:function onChange(evt,target,value){return _handleChange(target,value,escalationIdx);},onBlur:function onBlur(evt,target){return _handleChange(target,escalation.escalationId,escalationIdx);}}),hasError(escalationIdx,'escalationId')&&/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],null,t('form-error-required')))))));}));};/* harmony default export */ var presentational_EscalationSchedule_EscalationSchedule = (Object(redux["d" /* compose */])(Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(EscalationSchedule_styles))(EscalationSchedule_EscalationSchedule));
// CONCATENATED MODULE: ./src/components/presentational/EscalationSchedule/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var presentational_EscalationSchedule = (presentational_EscalationSchedule_EscalationSchedule);
// CONCATENATED MODULE: ./src/components/presentational/StageBuilder/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var StageBuilder_styles_styles=function styles(theme){return{root:{margin:theme.spacing()},formControl:{'& > *':{marginLeft:theme.spacing(1),marginTop:theme.spacing(1)}},formLabel:{backgroundColor:theme.palette.forgerock.white,paddingLeft:theme.spacing(),paddingRight:theme.spacing(),textTransform:'capitalize',marginBottom:0},formControlCheckbox:{flexDirection:'row',width:'fit-content'},stageActionDelete:{color:theme.palette.error.main},expansionPanelSummaryGrid:{maxWidth:'fit-content'},certifierGrid:{paddingTop:theme.spacing()},deadlineGrid:{paddingTop:theme.spacing(2)},deadlineLabel:{color:'inherit'},riskGrid:{paddingTop:theme.spacing(2)},stageBtnContainer:{margin:theme.spacing(),paddingRight:theme.spacing(2),'& > .MuiGrid-item':{flexGrow:0}},stageActionBtn:{marginLeft:theme.spacing(),color:theme.palette.forgerock.blue,'&:hover':{backgroundColor:theme.palette.forgerock.blue,color:theme.palette.forgerock.white}},stageSummaryPanel:{paddingTop:theme.spacing(2),marginBottom:theme.spacing(2)},deleteEscalationEntryBtn:{color:theme.palette.forgerock.danger,backgroundColor:theme.palette.forgerock.white,'&:hover':{color:theme.palette.forgerock.white,backgroundColor:theme.palette.forgerock.danger}}};};/* harmony default export */ var StageBuilder_styles = (StageBuilder_styles_styles);
// CONCATENATED MODULE: ./src/components/presentational/StageBuilder/StageBuilder.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var StageBuilder_StageBuilder=function StageBuilder(props){var certType=props.certType,classes=props.classes,errors=props.errors,frequency=props.frequency,stages=props.stages,t=props.t,touched=props.touched;var _React$useState=react_default.a.useState(false),_React$useState2=Object(slicedToArray["a" /* default */])(_React$useState,2),showNewStageButtons=_React$useState2[0],setShowNewStageButtons=_React$useState2[1];Object(react["useEffect"])(function(){if(stages.length===0){addNewStage();}},[]);var addNewStage=function addNewStage(idx){var field=props.field,setFieldValue=props.setFieldValue;var newStages=lodash_default.a.cloneDeep(stages);var newStage=null;if(lodash_default.a.isFinite(idx)){newStage=lodash_default.a.cloneDeep(newStages[idx]);newStage.name=t('stage-builder-new-stage-name',{num:newStages.length+1});newStage.deadline=null;newStage.deadlineDuration={unit:'',period:''};}else{newStage={name:t('stage-builder-new-stage-name',{num:newStages.length+1}),entitlementFilter:{attributes:{}},useRiskLevel:false,riskLevel:{Low:false,Medium:false,High:false},certifierName:'',certifierType:'',certifierKey:'',deadline:null,deadlineDuration:{unit:'',period:''},escalationSchedule:[]};if(certType==='user'){newStage.entitlementFilter.applications={};}else{newStage.entitlementFilter.certifyMetadata=false;}}setShowNewStageButtons(false);newStages.push(newStage);setFieldValue(field.id,newStages,true);};var removeStage=function removeStage(stageIdx){var field=props.field,stages=props.stages,setFieldValue=props.setFieldValue;var newStages=lodash_default.a.cloneDeep(stages);if(stageIdx!==0){lodash_default.a.pullAt(newStages,stageIdx);setFieldValue(field.id,newStages,true);}};var _handleChange=function handleChange(evt,value,idx){if(lodash_default.a.isFinite(idx)){var target=evt&&evt.target&&evt.target.name?evt.target.name:evt;props.handleStageChange(idx,target,value);if(target==='certifierType'&&value==='authzGroup'){for(var i=idx+1;i<props.stages.length;i++){var futureStage=props.stages[i];if(futureStage.certifierType==='prevManager'){props.handleStageChange(i,'certifierType','');}}}}};var handleEscalationScheduleChange=function handleEscalationScheduleChange(target,value,escalationIdx,stageIdx){if(lodash_default.a.isFinite(stageIdx)&&lodash_default.a.isFinite(escalationIdx)){props.handleStageChange(stageIdx,target,value);}else if(target==='escalationSchedule'){var newEscalationPath="".concat(props.field.id,"[").concat(stageIdx,"].escalationSchedule");var lastEscalationIdx=value.length;if(value.length>props.stages[stageIdx].escalationSchedule.length){lastEscalationIdx=value.length-1;}['unit','period','escalationType','escalationId'].forEach(function(key){props.setFieldTouched("".concat(newEscalationPath,"[").concat(lastEscalationIdx,"].").concat(key),false);});props.setFieldValue(newEscalationPath,value,false);}};var getCertifierTypesForStage=function getCertifierTypesForStage(stageIdx){return/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{variant:"outlined",className:classes.formControl,fullWidth:true,error:_hasError(stageIdx,'certifierType')},/*#__PURE__*/react_default.a.createElement(InputLabel["a" /* default */],null,t('stage-builder-certifierType')),/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{name:"certifierType",value:props.stages[stageIdx].certifierType,onChange:function onChange(evt,child){return _handleChange(evt,child.props.value,stageIdx);},label:t('stage-builder-certifierType')},/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{value:"user"},t('stage-builder-certifierType-user')),/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{value:"authzGroup"},t('stage-builder-certifierType-authzGroup')),certType==='user'&&/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{value:"manager"},t('stage-builder-certifierType-manager')),certType==='user'&&/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{disabled:stageIdx===0||props.stages[stageIdx-1].certifierType==='authzGroup',value:"prevManager"},t('stage-builder-certifierType-prevManager')),certType==='user'?/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{value:"entitlementOwner"},t('stage-builder-certifierType-entitlementOwner')):/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{value:"glossaryKey"},t('stage-builder-certifierType-glossaryKey'))),_hasError(stageIdx,'certifierType')&&/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],null,t('form-error-required')));};var getCertifierNameFieldForStage=function getCertifierNameFieldForStage(stageIdx){var stage=props.stages[stageIdx];if(!lodash_default.a.includes(['user','authzGroup','glossaryKey'],stage.certifierType)){return null;}if(stage.certifierType==='glossaryKey'){return/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{variant:"outlined",className:classes.formControl,fullWidth:true,error:_hasError(stageIdx,'certifierKey')},/*#__PURE__*/react_default.a.createElement(InputLabel["a" /* default */],{className:classes.formLabel},t('stage-builder-certifierKey')),/*#__PURE__*/react_default.a.createElement(OutlinedInput["a" /* default */],{name:'certifierKey',value:stage.certifierKey,onChange:function onChange(evt){return _handleChange(evt,evt.target.value,stageIdx);},onBlur:function onBlur(evt){return _handleChange(evt,evt.target.value,stageIdx);}}),_hasError(stageIdx,'certifierKey')&&/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],null,t('form-error-required')));}return/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{variant:"outlined",className:classes.formControl,fullWidth:true,error:_hasError(stageIdx,'certifierName')},/*#__PURE__*/react_default.a.createElement(presentational_AsyncSelect,{name:"certifierName",variant:"outlined",fullWidth:true,label:t('stage-builder-certifierName'),targetType:stage.certifierType==='user'?'userName':'authzGroup',value:stage.certifierName,onChange:function onChange(evt,target,value){return _handleChange(target,value,stageIdx);}}));};var getDeadlineFieldForStage=function getDeadlineFieldForStage(stageIdx){var stage=props.stages[stageIdx];if(frequency==='ad-hoc'){return/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{className:classes.formControl,error:_hasError(stageIdx,'deadline')},/*#__PURE__*/react_default.a.createElement(FormLabel["a" /* default */],{className:classes.deadlineLabel},t('stage-builder-deadline')),/*#__PURE__*/react_default.a.createElement(presentational_DatePicker,{field:"deadline",disablePast:true,disableFuture:false,error:_hasError(stageIdx,'deadline'),value:stage.deadline,onChange:function onChange(evt,target,value){return _handleChange(target,value,stageIdx);}}),_hasError(stageIdx,'deadline')&&/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],null,errors[stageIdx].deadline));}else if(frequency==='scheduled'||frequency==='event-based'){return/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{className:classes.formControl,error:_hasError(stageIdx,'deadlineDuration')&&Boolean(errors[stageIdx].deadlineDuration.unit||errors[stageIdx].deadlineDuration.period),fullWidth:true},/*#__PURE__*/react_default.a.createElement(FormLabel["a" /* default */],{className:classes.deadlineLabel},t('stage-builder-deadline')),/*#__PURE__*/react_default.a.createElement(presentational_DurationSelect,{durationType:props.formType,errors:errors&&errors&&errors[stageIdx]?errors[stageIdx].deadlineDuration:'',field:"deadlineDuration",handleBlur:function handleBlur(evt){return _handleChange(evt.target.name,evt.target.value,stageIdx);},handleChange:function handleChange(evt){return _handleChange(evt.target.name,evt.target.value,stageIdx);},touched:touched&&touched[stageIdx]?touched[stageIdx].deadlineDuration:false,value:stage.deadlineDuration}));}else{return null;}};var _hasError=function hasError(stageIdx,field,escalationIdx,escalationField){var errorFound=Boolean(touched&&errors&&touched[stageIdx]&&errors[stageIdx]&&touched[stageIdx][field]&&errors[stageIdx][field]);if(lodash_default.a.isUndefined(escalationIdx)&&lodash_default.a.isUndefined(escalationField)){return errorFound;}return Boolean(errorFound&&touched[stageIdx][field][escalationIdx]&&errors[stageIdx][field][escalationIdx]&&touched[stageIdx][field][escalationIdx][escalationField]&&errors[stageIdx][field][escalationIdx][escalationField]);};return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,stages.map(function(stage,stageIdx){return/*#__PURE__*/react_default.a.createElement(Paper["a" /* default */],{key:stageIdx,className:classes.root},/*#__PURE__*/react_default.a.createElement(ExpansionPanel["a" /* default */],{defaultExpanded:true},/*#__PURE__*/react_default.a.createElement(ExpansionPanelSummary["a" /* default */],{expandIcon:/*#__PURE__*/react_default.a.createElement(ExpandMore_default.a,null),"aria-label":"Expand",className:classes.stageSummaryPanel},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,className:classes.expansionPanelSummaryGrid,onClick:function onClick(event){return event.stopPropagation();}},/*#__PURE__*/react_default.a.createElement(TextField["a" /* default */],{name:"name",label:"Name",error:_hasError(stageIdx,'name'),variant:"outlined",value:stage.name,onChange:function onChange(evt){return _handleChange(evt,evt.target.value,stageIdx);}}),/*#__PURE__*/react_default.a.createElement(IconButton["a" /* default */],{disabled:stageIdx===0,color:"primary","aria-label":t('stage-builder-move-up'),onClick:_handleChange},/*#__PURE__*/react_default.a.createElement(ArrowUpward_default.a,null)),/*#__PURE__*/react_default.a.createElement(IconButton["a" /* default */],{disabled:stageIdx===stages.length-1,color:"primary","aria-label":t('stage-builder-move-up'),onClick:_handleChange},/*#__PURE__*/react_default.a.createElement(ArrowDownward_default.a,null)),/*#__PURE__*/react_default.a.createElement(IconButton["a" /* default */],{disabled:stageIdx===0,className:classes.stageActionDelete,"aria-label":t('stage-builder-delete-stage'),onClick:function onClick(){return removeStage(stageIdx);}},/*#__PURE__*/react_default.a.createElement(Close_default.a,null)))),/*#__PURE__*/react_default.a.createElement(ExpansionPanelDetails["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,justify:"flex-start"},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12},certType&&/*#__PURE__*/react_default.a.createElement(presentational_EntitlementFilter,{certType:certType,filter:stage.entitlementFilter,onChange:function onChange(filter){return _handleChange('entitlementFilter',filter,stageIdx);}})),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:3,className:classes.riskGrid},/*#__PURE__*/react_default.a.createElement(FormControlLabel["a" /* default */],{className:classes.formControl,control:/*#__PURE__*/react_default.a.createElement(Switch["a" /* default */],{checked:stage.useRiskLevel,onChange:function onChange(evt,value){return _handleChange(evt,value,stageIdx);},name:"useRiskLevel",color:"primary"}),label:t('stage-builder-useRiskLevel')})),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:8,className:classes.riskGrid},/*#__PURE__*/react_default.a.createElement(Collapse["a" /* default */],{in:stage.useRiskLevel},/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{className:classes.formControlCheckbox,fullWidth:true,error:_hasError(stageIdx,'riskLevel')},Object.entries(stage.riskLevel).map(function(_ref){var _ref2=Object(slicedToArray["a" /* default */])(_ref,2),key=_ref2[0],value=_ref2[1];return/*#__PURE__*/react_default.a.createElement(FormControlLabel["a" /* default */],{key:key,className:classes.formControlCheckbox,control:/*#__PURE__*/react_default.a.createElement(Checkbox["a" /* default */],{checked:value,onChange:function onChange(evt,value){return _handleChange(evt,value,stageIdx);},name:"riskLevel.".concat(key),color:"primary"}),label:t("stage-builder-risk-".concat(key.toLowerCase()))});}),_hasError(stageIdx,'riskLevel')&&/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],null,errors[stageIdx].riskLevel)))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12,className:classes.certifierGrid},getCertifierTypesForStage(stageIdx)),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12},getCertifierNameFieldForStage(stageIdx)),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12,className:classes.deadlineGrid},getDeadlineFieldForStage(stageIdx)),/*#__PURE__*/react_default.a.createElement(presentational_EscalationSchedule,{formType:props.formType,errorObject:lodash_default.a.get(errors,"".concat(stageIdx,".escalationSchedule")),escalationSchedule:stage.escalationSchedule,handleChange:function handleChange(target,value,escalationIdx){return handleEscalationScheduleChange(target,value,escalationIdx,stageIdx);},hasError:function hasError(escalationIdx,escalationField){return _hasError(stageIdx,'escalationSchedule',escalationIdx,escalationField);},touchedObject:lodash_default.a.get(touched,"".concat(stageIdx,".escalationSchedule"))})))));}),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,justify:"flex-end",className:classes.stageBtnContainer},!showNewStageButtons&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true},/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{className:classes.stageActionBtn,size:"large",variant:"outlined",onClick:function onClick(){return setShowNewStageButtons(true);}},t('stage-builder-btn-add'))),showNewStageButtons&&/*#__PURE__*/react_default.a.createElement(Zoom["a" /* default */],{in:showNewStageButtons},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true},/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{className:classes.stageActionBtn,size:"large",variant:"outlined",onClick:function onClick(){return addNewStage();}},t('stage-builder-btn-blank')),stages.map(function(stage,stageIdx){return/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{key:"CopyStage".concat(stageIdx),className:classes.stageActionBtn,size:"large",variant:"outlined",onClick:function onClick(){return addNewStage(stageIdx);}},t('stage-builder-btn-copy',{stage:stage.name}));}),/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{className:classes.stageActionBtn,size:"large",variant:"outlined",onClick:function onClick(){return setShowNewStageButtons(false);}},t('btn-cancel'))))));};/* harmony default export */ var presentational_StageBuilder_StageBuilder = (Object(redux["d" /* compose */])(Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(StageBuilder_styles))(StageBuilder_StageBuilder));
// CONCATENATED MODULE: ./src/components/presentational/StageBuilder/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var presentational_StageBuilder = (presentational_StageBuilder_StageBuilder);
// CONCATENATED MODULE: ./src/components/presentational/CreateForms/FormBody.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var FormBody_FormBody=function FormBody(props){var _useState=Object(react["useState"])({}),_useState2=Object(slicedToArray["a" /* default */])(_useState,2),onLoadFields=_useState2[0],setOnLoadFields=_useState2[1];var formSchema=props.formSchema;Object(react["useEffect"])(function(){var fieldsWithOnLoadDefined=formSchema().filter(function(field){return field.onLoad;});fieldsWithOnLoadDefined.forEach(function(field){props.dispatch(async_fields_actions_namespaceObject[field.onLoad]()).then(function(){setOnLoadFields(Object(objectSpread["a" /* default */])({},onLoadFields,Object(defineProperty["a" /* default */])({},field.id,props[field.stateProp])));});});},[]);var onChangeCustomInput=function onChangeCustomInput(e,target,value){var shouldValidate=lodash_default.a.isNull(e)?false:true;props.setFieldTouched(target,shouldValidate);props.setFieldValue(target,value,true);};var onStageChange=function onStageChange(stageIdx,name,value){if(lodash_default.a.isFinite(stageIdx)&&name){props.setFieldValue("stages[".concat(stageIdx,"][").concat(name,"]"),value,true);if(name!=='escalationSchedule'){props.setFieldTouched("stages[".concat(stageIdx,"][").concat(name,"]"),true);}}};var handleEscalationScheduleChange=function handleEscalationScheduleChange(target,value,escalationIdx){if(lodash_default.a.isFinite(escalationIdx)){props.setFieldValue(target,value,true);props.setFieldTouched(target,true);}else if(target==='escalationSchedule'){var lastEscalationIdx=value.length;if(value.length>props.values.escalationSchedule.length){lastEscalationIdx=value.length-1;}['unit','period','escalationType','escalationId'].forEach(function(key){props.setFieldTouched("escalationSchedule[".concat(lastEscalationIdx,"].").concat(key),false);});props.setFieldValue('escalationSchedule',value,false);}};var escalationHasError=function escalationHasError(escalationIdx,escalationField){var escErrors=props.errors.escalationSchedule;var escTouched=props.touched.escalationSchedule;return Boolean(escErrors&&escTouched&&escTouched[escalationIdx]&&escErrors[escalationIdx]&&escTouched[escalationIdx][escalationField]&&escErrors[escalationIdx][escalationField]);};var classes=props.classes,t=props.t,values=props.values,touched=props.touched,errors=props.errors,handleChange=props.handleChange,handleBlur=props.handleBlur,handleSubmit=props.handleSubmit,handleClose=props.handleClose,isValid=props.isValid,isSubmitting=props.isSubmitting;return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.mainFormGrid},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xl:12,md:12,lg:8},/*#__PURE__*/react_default.a.createElement(DialogContent["a" /* default */],{dividers:true,className:classes.dialog},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,className:classes.formInput},formSchema(values).map(function(field){if(!field.isDisplayed)return null;if(field.type==='text'){return/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{key:field.id,variant:"outlined",className:classes.formControl,fullWidth:true,error:errors[field.id]&&touched[field.id]},/*#__PURE__*/react_default.a.createElement(InputLabel["a" /* default */],{className:classes.formLabel,htmlFor:field.id},field.label),/*#__PURE__*/react_default.a.createElement(OutlinedInput["a" /* default */],{id:field.id,value:values[field.id],onChange:handleChange,onBlur:handleBlur,rowsMax:"4",name:field.id,"aria-describedby":"".concat(field.id,"-helper-text")}),errors[field.id]&&touched[field.id]&&/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],{id:"".concat(field.id,"-helper-text")},errors[field.id]));}else if(field.type==='select'){return/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{key:field.id,variant:"outlined",className:classes.formControl,fullWidth:true,error:errors[field.id]&&touched[field.id]},/*#__PURE__*/react_default.a.createElement(InputLabel["a" /* default */],{className:classes.formLabel,htmlFor:field.id},field.label),/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{id:field.id,value:values[field.id],onChange:handleChange,onBlur:handleBlur,rowsMax:"4",name:field.id,"aria-describedby":"".concat(field.id,"-helper-text")},field.options&&field.options.map(function(opt){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:opt.key,value:opt.key,selected:opt.key===values[field.id]},opt.displayName);}),field.stateProp&&props[field.stateProp].map(function(opt){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:opt.key,value:opt.key},opt.displayName);}),values[field.id]&&field.stateProp&&(!props[field.stateProp]||props[field.stateProp].length===0)&&/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:values[field.id],value:values[field.id]},values[field.id])),errors[field.id]&&touched[field.id]&&/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],{id:"".concat(field.id,"-helper-text")},errors[field.id]));}else if(field.type==='checkbox'){return/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{key:field.id,variant:"outlined",className:classes.formControl,error:errors[field.id]&&touched[field.id]},/*#__PURE__*/react_default.a.createElement(FormControlLabel["a" /* default */],{control:/*#__PURE__*/react_default.a.createElement(Checkbox["a" /* default */],{name:field.id,value:values[field.id],checked:values[field.id],onChange:handleChange}),className:classes.formLabel,label:field.label,labelPlacement:"end"}),errors[field.id]&&touched[field.id]&&/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],{id:"".concat(field.id,"-helper-text")},errors[field.id]));}else if(field.type==='range'){return/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{key:field.id,variant:"outlined",className:classes.formControl,fullWidth:true,error:errors[field.id]&&touched[field.id]},/*#__PURE__*/react_default.a.createElement(FormLabel["a" /* default */],null,field.label),/*#__PURE__*/react_default.a.createElement(Slider["a" /* default */],{id:field.id,name:field.id,className:classes.formSlider,value:values[field.id],onChange:function onChange(event,value){return onChangeCustomInput(event,field.id,value);},getAriaValueText:values[field.value],min:1,max:10,step:1,marks:true,valueLabelDisplay:"auto"}),errors[field.id]&&touched[field.id]&&/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],{id:"".concat(field.id,"-helper-text")},errors[field.id]));}else if(field.type==='typeahead'){return/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{key:field.id,className:classes.formControl,fullWidth:true,error:errors[field.id]&&touched[field.id]},/*#__PURE__*/react_default.a.createElement(presentational_AsyncSelect,{name:field.id,variant:"outlined",fullWidth:true,label:field.label,targetType:field.targetType,value:values[field.id],onChange:onChangeCustomInput,error:errors[field.id]&&touched[field.id]}),errors[field.id]&&touched[field.id]&&/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],{id:"".concat(field.id,"-helper-text")},errors[field.id]));}else if(field.type==='expression'){return/*#__PURE__*/react_default.a.createElement(react["Fragment"],{key:field.id},/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{className:classes.formControl,fullWidth:true,error:Boolean(errors[field.id]&&touched[field.id])},/*#__PURE__*/react_default.a.createElement(FormLabel["a" /* default */],null,field.label)),field.dialogView?/*#__PURE__*/react_default.a.createElement(ExpressionBuilder_ExpressionBuilderDialog,{errors:errors[field.id],expression:values[field.id],targetType:values.targetObjectType||'user',handleChange:function handleChange(event,value){return onChangeCustomInput(event,field.id,value);}}):/*#__PURE__*/react_default.a.createElement(presentational_ExpressionBuilder,{expression:values[field.id],targetType:values.certObjectType==='user'?'user':values.targetObjectType,showBasicFilters:true,handleChange:function handleChange(value){return onChangeCustomInput(event,field.id,value);}}),errors[field.id]&&touched[field.id]&&/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{className:classes.formControl,fullWidth:true,error:Boolean(errors[field.id])},/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],{id:"".concat(field.id,"-helper-text")},t('expr-builder-invalid'))));}else if(field.type==='eventExpression'){return/*#__PURE__*/react_default.a.createElement(react["Fragment"],{key:field.id},/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{className:classes.formControl,fullWidth:true,error:Boolean(errors[field.id]&&touched[field.id])},/*#__PURE__*/react_default.a.createElement(FormLabel["a" /* default */],null,field.label)),/*#__PURE__*/react_default.a.createElement(presentational_EventExpressionBuilder,{expression:values[field.id],targetType:values.targetObjectType,handleChange:function handleChange(event,value){return onChangeCustomInput(event,field.id,value);}}),errors[field.id]&&touched[field.id]&&/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{className:classes.formControl,fullWidth:true,error:Boolean(errors[field.id])},/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],{id:"".concat(field.id,"-helper-text")},t('expr-builder-invalid'))));}else if(field.type==='schedule'){return/*#__PURE__*/react_default.a.createElement(react["Fragment"],{key:field.id},/*#__PURE__*/react_default.a.createElement(presentational_ScheduleBuilder,{field:field,value:values[field.id],handleChange:function handleChange(value){return onChangeCustomInput(event,field.id,value);}}),/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{className:classes.formControl,fullWidth:true,error:Boolean(errors[field.id])},errors[field.id]&&touched[field.id]&&/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],{id:"".concat(field.id,"-helper-text")},t('schedule-builder-invalid'))));}else if(field.type==='transfer-list'){return/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{key:field.id,className:classes.formControl,fullWidth:true,error:Boolean(errors[field.id]&&touched[field.id])},/*#__PURE__*/react_default.a.createElement(FormLabel["a" /* default */],{className:classes.formLabel},field.label),/*#__PURE__*/react_default.a.createElement(presentational_TransferList,{field:field,value:values[field.id],handleChange:function handleChange(value){return onChangeCustomInput(event,field.id,value);}}),errors[field.id]&&touched[field.id]&&/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],{id:"".concat(field.id,"-helper-text")},t("".concat(field.id,"-transfer-list-invalid"))));}else if(field.type==='duration'){return/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{key:field.id,className:classes.formControl,fullWidth:true,error:Boolean(errors[field.id]&&touched[field.id]&&touched[field.id].unit&&touched[field.id].period&&(lodash_default.a.isString(errors[field.id])||errors[field.id].unit&&errors[field.id].period))},/*#__PURE__*/react_default.a.createElement(FormLabel["a" /* default */],null,field.label),/*#__PURE__*/react_default.a.createElement(presentational_DurationSelect,{durationType:props.formType,errors:errors[field.id],field:field,handleBlur:handleBlur,handleChange:handleChange,touched:touched[field.id],value:values[field.id]}),errors[field.id]&&touched[field.id]&&lodash_default.a.isString(errors[field.id])&&/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],{id:"".concat(field.id,"-helper-text")},errors[field.id]));}else if(field.type==='date'){return/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{key:field.id,className:classes.formControl,error:Boolean(errors[field.id]&&touched[field.id])},/*#__PURE__*/react_default.a.createElement(FormLabel["a" /* default */],{className:classes.formLabel},field.label),/*#__PURE__*/react_default.a.createElement(presentational_DatePicker,{field:field,disablePast:field.disablePast,disableFuture:field.disableFuture,error:Boolean(errors[field.id]&&touched[field.id]),value:values[field.id],onChange:onChangeCustomInput}),errors[field.id]&&touched[field.id]&&/*#__PURE__*/react_default.a.createElement(FormHelperText["a" /* default */],{id:"".concat(field.id,"-helper-text")},errors[field.id]));}else if(field.type==='stages'){return/*#__PURE__*/react_default.a.createElement(presentational_StageBuilder,{key:field.id,field:field,formType:props.formType,certType:values.certObjectType==='user'?'user':values.targetObjectType,frequency:values.frequency,stages:values[field.id],errors:errors[field.id],touched:touched[field.id],setFieldTouched:props.setFieldTouched,setFieldValue:props.setFieldValue,handleStageChange:onStageChange});}else if(field.type==='escalation'){return/*#__PURE__*/react_default.a.createElement(presentational_EscalationSchedule,{key:field.id,formType:props.formType,errorObject:errors.escalationSchedule,escalationSchedule:values.escalationSchedule,handleChange:handleEscalationScheduleChange,hasError:escalationHasError,touchedObject:touched.escalationSchedule});}}))),/*#__PURE__*/react_default.a.createElement(DialogActions["a" /* default */],{className:classes.dialogActions},/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{size:"large",variant:"outlined",onClick:handleClose},t('btn-cancel')),/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{variant:"contained",size:"large",color:"primary",className:classes.submitButton,disabled:!isValid||isSubmitting,onClick:handleSubmit},t('btn-save'))))));};/* harmony default export */ var CreateForms_FormBody = (FormBody_FormBody);
// CONCATENATED MODULE: ./src/components/presentational/GovernanceDialog/ViewReactive.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var ViewReactive_ViewReactive=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(ViewReactive,_Component);function ViewReactive(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,ViewReactive);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(ViewReactive)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleSubmit",function(form){_this.props.configureReactiveScans(form).then(function(success){_this.props.handleClose();});});return _this;}Object(createClass["a" /* default */])(ViewReactive,[{key:"componentDidMount",value:function componentDidMount(){this.props.getReactiveScanConfiguration();}},{key:"render",value:function render(){var _this$props=this.props,t=_this$props.t,classes=_this$props.classes,dialogType=_this$props.dialogType,reactiveConfig=_this$props.reactiveConfig;return/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,spacing:2},/*#__PURE__*/react_default.a.createElement(ReactiveScanForm,{classes:classes,formSchema:schemas_configureReactiveScansForm,existingFormData:reactiveConfig,formType:dialogType,onSubmit:this.handleSubmit,handleClose:this.props.handleClose,t:t}));}}]);return ViewReactive;}(react["Component"]);var ReactiveScanForm=Object(formik_esm["c" /* withFormik */])({mapPropsToValues:function mapPropsToValues(props){var formFields={};props.formSchema().forEach(function(item){if(props.existingFormData&&props.existingFormData[item.id]){if(item.isStringified){formFields[item.id]=JSON.parse(props.existingFormData[item.id]);}else if(item.type==='duration'){var _props$existingFormDa=props.existingFormData[item.id].split(' '),_props$existingFormDa2=Object(slicedToArray["a" /* default */])(_props$existingFormDa,2),unit=_props$existingFormDa2[0],period=_props$existingFormDa2[1];formFields[item.id]={unit:unit,period:period};}else{formFields[item.id]=props.existingFormData[item.id];}}else if(lodash_default.a.isNull(item.value)){formFields[item.id]=item.value;}else{formFields[item.id]=item.value||'';}});return formFields;},enableReinitialize:true,isInitialValid:function isInitialValid(props){return!lodash_default.a.isNull(props.existingFormData);},handleSubmit:function handleSubmit(values,_ref){var props=_ref.props,resetForm=_ref.resetForm;values.expirationDate="".concat(values.expirationDate.unit," ").concat(values.expirationDate.period);props.onSubmit(values);},validationSchema:function validationSchema(props){return yup_es["object"]().shape(props.formSchema().reduce(createYupSchema,{}));},displayName:'ConfigureReactiveScans'})(CreateForms_FormBody);var ViewReactive_mapStateToProps=function mapStateToProps(state){var reactiveConfig=state.policies.reactiveConfig;return{reactiveConfig:reactiveConfig};};var ViewReactive_mapDispatchToProps={configureReactiveScans:policies_actions_configureReactiveScans,getReactiveScanConfiguration:policies_actions_getReactiveScanConfiguration};/* harmony default export */ var GovernanceDialog_ViewReactive = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(ViewReactive_mapStateToProps,ViewReactive_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(GovernanceDialog_styles))(ViewReactive_ViewReactive));
// EXTERNAL MODULE: ./node_modules/tabler-react/dist/index.es.js
var index_es = __webpack_require__(8);

// EXTERNAL MODULE: ./node_modules/tabler-react/dist/Tabler.css
var Tabler = __webpack_require__(123);

// CONCATENATED MODULE: ./src/components/presentational/GovernanceDialog/ViewCertification.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var ViewCertification_ViewCertification=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(ViewCertification,_Component);function ViewCertification(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,ViewCertification);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(ViewCertification)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"navigateToCertification",function(cert){var certType=cert.certObjectType==='user'?'user':'object';_this.props.onSubmitDialog('/adminCertList/'+certType+'/'+cert._id);_this.props.handleClose();});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getCertifierList",function(list){var certifierList=lodash_default.a.map(list,'displayName').join(', ');return certifierList;});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getProgressOfStage",function(stage){var t=_this.props.t;if(!stage||!stage.totalEvents||!stage.eventStatuses){return null;}var inProgress=stage.eventStatuses['in-progress']||0;var pending=stage.eventStatuses['pending']||0;var complete=stage.totalEvents-(inProgress+pending);return complete+' '+t('of')+' '+stage.totalEvents;});return _this;}Object(createClass["a" /* default */])(ViewCertification,[{key:"componentWillUnmount",value:function componentWillUnmount(){}},{key:"componentDidUpdate",value:function componentDidUpdate(){}},{key:"render",value:function render(){var _this2=this;var _this$props=this.props,classes=_this$props.classes,certification=_this$props.certification,t=_this$props.t;return certification?/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.certification,spacing:2},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */],null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Body,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{key:Object(v4["a" /* default */])()},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,t('name')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,certification.name)),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{key:Object(v4["a" /* default */])()},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,t('description')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,certification.description)),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{key:Object(v4["a" /* default */])()},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,t('start-date')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,moment_default()(certification.startDate).format('L'))),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{key:Object(v4["a" /* default */])()},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,t('open-certifiers')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,this.getCertifierList(certification.openCertifiers)))))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */],null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Header,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('stage')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('deadline')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('progress')))),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Body,null,certification.stages.map(function(stage){return/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{key:stage.name},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,stage.name),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,moment_default()(stage.deadline).format('L')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,_this2.getProgressOfStage(stage)));})))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.navigateButtonContainer,item:true,xs:12},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{className:classes.navigateButton,onClick:function onClick(){return _this2.navigateToCertification(certification);}},t('go-to-campaign'))))):/*#__PURE__*/react_default.a.createElement(LinearProgress["a" /* default */],null);}}]);return ViewCertification;}(react["Component"]);/* harmony default export */ var GovernanceDialog_ViewCertification = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(GovernanceDialog_styles))(ViewCertification_ViewCertification));
// EXTERNAL MODULE: ./node_modules/@material-ui/icons/ModeCommentOutlined.js
var ModeCommentOutlined = __webpack_require__(190);
var ModeCommentOutlined_default = /*#__PURE__*/__webpack_require__.n(ModeCommentOutlined);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Comment.js
var Comment = __webpack_require__(157);
var Comment_default = /*#__PURE__*/__webpack_require__.n(Comment);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/RadioButtonUnchecked.js
var RadioButtonUnchecked = __webpack_require__(156);
var RadioButtonUnchecked_default = /*#__PURE__*/__webpack_require__.n(RadioButtonUnchecked);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/NotInterested.js
var NotInterested = __webpack_require__(189);
var NotInterested_default = /*#__PURE__*/__webpack_require__.n(NotInterested);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/RemoveCircle.js
var RemoveCircle = __webpack_require__(155);
var RemoveCircle_default = /*#__PURE__*/__webpack_require__.n(RemoveCircle);

// CONCATENATED MODULE: ./src/components/presentational/GovernanceDialog/ViewObject.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var ViewObject_ViewObject=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(ViewObject,_Component);function ViewObject(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,ViewObject);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(ViewObject)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{expandedRows:{}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"navigateToCertification",function(){_this.props.onSubmitDialog(_this.props.dialogType,_this.props.selectedRows,_this.state.reassignee);_this.props.handleClose();});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getDisplayOrder",function(obj){if(obj.order&&obj.order.length>0){// Remove duplicates and non-existent keys from 'order' key, and removes order from display object
var orderedKeys=lodash_default.a.uniq(obj.order);delete obj.order;orderedKeys=lodash_default.a.intersection(orderedKeys,lodash_default.a.keys(obj));lodash_default.a.forEach(lodash_default.a.keys(obj),function(key){if(!lodash_default.a.includes(orderedKeys,key)){orderedKeys.push(key);}});return orderedKeys;}else{if(obj.order){delete obj.order;}return lodash_default.a.keys(obj).sort();}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getIconFromOutcome",function(outcome){var classes=_this.props.classes;var icon='';switch(outcome){case'certify':icon=/*#__PURE__*/react_default.a.createElement(CheckCircle_default.a,{className:classes.certifyIcon});break;case'revoke':icon=/*#__PURE__*/react_default.a.createElement(RemoveCircle_default.a,{className:classes.revokeIcon});break;case'abstain':icon=/*#__PURE__*/react_default.a.createElement(NotInterested_default.a,{className:classes.abstainIcon});break;case null:default:icon=/*#__PURE__*/react_default.a.createElement(RadioButtonUnchecked_default.a,{className:classes.incompleteIcon});break;}return icon;});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getDisplayValue",function(value){var t=_this.props.t;if(lodash_default.a.isArray(value)){for(var i=0;i<value.length;i++){if(lodash_default.a.isObject(value[i])){value[i]=value[i].displayName||value[i];if(value[i]==='manager'){value[i]=t('user-manager');}}}return value.join(', ');}else if(lodash_default.a.isObject(value)){return value.displayName||value.toString();}else{return value.toString();}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getIconButton",function(certification){var classes=_this.props.classes;var icon='';if(_this.state.expandedRows[certification.parentId]===true){icon=/*#__PURE__*/react_default.a.createElement(Comment_default.a,{className:classes.selectedComments,onClick:function onClick(){return _this.expandRow(certification.parentId);}});}else if(certification.comments.length>0){icon=/*#__PURE__*/react_default.a.createElement(Comment_default.a,{className:classes.selectableComments,onClick:function onClick(){return _this.expandRow(certification.parentId);}});}else{icon=/*#__PURE__*/react_default.a.createElement(ModeCommentOutlined_default.a,null);}return icon;});return _this;}Object(createClass["a" /* default */])(ViewObject,[{key:"componentWillUnmount",value:function componentWillUnmount(){}},{key:"componentDidUpdate",value:function componentDidUpdate(){}},{key:"expandRow",value:function expandRow(name){var expandedRows=lodash_default.a.cloneDeep(this.state.expandedRows);if(!lodash_default.a.has(expandedRows,name)){expandedRows[name]=true;}else{expandedRows[name]=!expandedRows[name];}lodash_default.a.forEach(lodash_default.a.keys(expandedRows),function(key){if(key!==name){expandedRows[key]=false;}});this.setState({expandedRows:expandedRows});}},{key:"render",value:function render(){var _this2=this;var _this$props=this.props,classes=_this$props.classes,dialogType=_this$props.dialogType,modalObject=_this$props.modalObject,t=_this$props.t,queryingMetadata=_this$props.queryingMetadata;var expandedRows=this.state.expandedRows;return queryingMetadata?/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.linearProgressContainer},/*#__PURE__*/react_default.a.createElement(LinearProgress["a" /* default */],null)):/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.certification,spacing:2},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.detailsContainer,item:true,xs:12},modalObject&&dialogType==='glossary'&&lodash_default.a.keys(modalObject).length>0&&/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */],null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Header,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('key')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('value')))),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Body,null,this.getDisplayOrder(modalObject).map(function(key){return/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{key:key,className:classes.detailsRow},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.detailsCell},key),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.detailsCell},_this2.getDisplayValue(modalObject[key])));}))),modalObject&&modalObject.data&&dialogType==='targeted-attribute'&&/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */],null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Header,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('label-name')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('description')))),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Body,null,modalObject.data.map(function(item){return/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{key:item._id,className:classes.detailsRow},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.detailsCell},item.displayName),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.detailsCell},item.description));}))),modalObject&&modalObject.certifications&&dialogType==='entitlement-history'&&/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */],null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Header,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('header-date')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('header-decision')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('header-certifier')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('header-campaign')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null))),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Body,null,modalObject.certifications.map(function(certification){return certification.parent?expandedRows[certification.parent]&&/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{key:Object(v4["a" /* default */])(),className:classes.detailsCommentRow},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{colSpan:6},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */],null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Body,null,certification.comments.map(function(comment){return/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{key:comment.timeStamp},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{colSpan:6,className:classes.detailsCommentCell},/*#__PURE__*/react_default.a.createElement("strong",null,comment.user.displayName),' ('+moment_default()(comment.timeStamp).format('L')+'): '+comment.comment));}))))):/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{key:Object(v4["a" /* default */])(),className:classes.detailsRow},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.detailsCell},certification.completionDate?moment_default()(certification.completionDate).format('L'):'-'),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.detailsCell},_this2.getIconFromOutcome(certification.outcome)),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.detailsCell},t('summary-'+certification.outcome)),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.detailsCell},certification.certifier.displayName),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.detailsCell},certification.campaign.displayName),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.detailsCell},_this2.getIconButton(certification)));}))),modalObject&&dialogType==='glossary'&&lodash_default.a.keys(modalObject).length===0&&/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],null,t('no-glossary-entry')),modalObject&&dialogType==='targeted-attribute'&&(!modalObject.data||modalObject.data.length===0)&&/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],null,t('no-selected-attributes'))));}}]);return ViewObject;}(react["Component"]);/* harmony default export */ var GovernanceDialog_ViewObject = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(GovernanceDialog_styles))(ViewObject_ViewObject));
// CONCATENATED MODULE: ./src/components/presentational/GovernanceDialog/ViewViolation.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var ViewViolation_ViewViolation=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(ViewViolation,_Component);function ViewViolation(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,ViewViolation);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(ViewViolation)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{extraView:'',comments:null,expirationDate:null});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleAction",function(evt){var violation=_this.props.violation;var action=evt.currentTarget.name;if((action==='approve'||action==='comment')&&_this.state.extraView!==action){_this.setState({extraView:action});}else if(action==='submit'){_this.props.onSubmitDialog(evt,violation._id,_this.state.extraView,_this.state.comments,_this.state.expirationDate);if(_this.state.expirationDate){_this.props.handleClose();}else{_this.setState({extraView:'',comments:null,expirationDate:null});}}else if(action==='remediate'){_this.props.onSubmitDialog(evt,violation._id,action);_this.props.handleClose();}else{_this.setState({extraView:'',comments:null,expirationDate:null});}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"onUpdateComments",function(event){if(event.target&&event.target.value){_this.setState({comments:event.target.value});}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"onUpdateExpirationDate",function(target,value){if(value&&value._d){_this.setState({expirationDate:value._d});}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getViolationDetailsRow",function(label,value){var _this$props=_this.props,classes=_this$props.classes,t=_this$props.t;return/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{className:classes.detailsRow},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,t(label)+':'),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,value));});return _this;}Object(createClass["a" /* default */])(ViewViolation,[{key:"componentWillUnmount",value:function componentWillUnmount(){this._isMounted=false;}},{key:"componentDidMount",value:function componentDidMount(){this.setState({extraView:''});}},{key:"componentDidUpdate",value:function componentDidUpdate(){}},{key:"render",value:function render(){var _this2=this;var _this$props2=this.props,t=_this$props2.t,classes=_this$props2.classes,violation=_this$props2.violation,isOwner=_this$props2.isOwner;return violation?/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.violationViewContainer},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.detailsContainer,item:true,xs:12},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */],null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Body,null,this.getViolationDetailsRow('target-user',violation.targetUser?violation.targetUser.displayName:null),this.getViolationDetailsRow('policy-owner',violation.owner?violation.owner.displayName:null),this.getViolationDetailsRow('violation-detected',moment_default()(violation.startDate).format('L')),violation.status==='in-progress'&&this.getViolationDetailsRow('expiration-date',moment_default()(violation.expirationDate).format('L')),(violation.status==='exception'||violation.status==='exception-expired')&&this.getViolationDetailsRow('exception-start-date',moment_default()(violation.exceptionStartDate).format('L')),(violation.status==='exception'||violation.status==='exception-expired')&&this.getViolationDetailsRow('exception-end-date',moment_default()(violation.exceptionEndDate).format('L')),violation.status!=='in-progress'&&violation.status!=='exception'&&this.getViolationDetailsRow('completed-by',violation.completedBy?violation.completedBy.displayName:null),violation.status!=='in-progress'&&violation.status!=='exception'&&this.getViolationDetailsRow('completion-date',moment_default()(violation.completionDate).format('L')),this.getViolationDetailsRow('policy-name',violation.policyName),this.getViolationDetailsRow('policy-description',violation.policyDescription)))),violation.comments&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12,className:classes.commentsContainer},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */],null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Header,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('date')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('comment')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('by')))),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Body,null,violation.comments.map(function(comment){return/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{key:comment.timeStamp},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,moment_default()(comment.timeStamp).format('lll')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,comment.comment),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,comment.user?comment.user.displayName:null));})))),isOwner&&violation.status==='in-progress'&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12,className:classes.violationButtonContainer},/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{name:"comment",className:classes.violationButton,variant:"contained",color:"primary",onClick:this.handleAction,disabled:this.state.extraView!==''&&this.state.extraView!=='comment'},this.state.extraView==='comment'?t('btn-hide-comment'):t('btn-add-comment')),/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{name:"remediate",className:classes.violationButton,variant:"contained",color:"primary",onClick:this.handleAction,disabled:this.state.extraView!==''},t('btn-remediate')),/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{name:"approve",className:classes.violationButton,variant:"contained",color:"primary",onClick:this.handleAction,disabled:this.state.extraView!==''&&this.state.extraView!=='approve'},this.state.extraView==='approve'?t('btn-hide-exception'):t('btn-grant-exception'))),this.state.extraView!==''&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.violationFormContainer,spacing:4},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12,sm:12},/*#__PURE__*/react_default.a.createElement(TextField["a" /* default */],{label:this.state.extraView==='approve'?t('reason'):t('comment'),type:"text",variant:"outlined",name:"commentInput",id:"commentInput",fullWidth:true,onChange:function onChange(evt){return _this2.onUpdateComments(evt);}})),this.state.extraView==='approve'&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12,sm:12},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.exceptionContainer},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.exceptionLabel},t('exception-expiration-date'),":"),/*#__PURE__*/react_default.a.createElement(presentational_DatePicker,{name:"dateInput",field:"dateInput",variant:"outlined",disablePast:true,disableFuture:false,selectedDate:null,onChange:function onChange(evt,target,value){return _this2.onUpdateExpirationDate(target,value);}}))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{variant:"contained",name:"submit",size:"large",type:"submit",color:"primary",className:classes.violationButton,onClick:this.handleAction,disabled:!this.state.comments||!this.state.expirationDate&&this.state.extraView==='approve'},t('btn-submit-'+this.state.extraView))))):/*#__PURE__*/react_default.a.createElement(LinearProgress["a" /* default */],null);}}]);return ViewViolation;}(react["Component"]);/* harmony default export */ var GovernanceDialog_ViewViolation = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(GovernanceDialog_styles))(ViewViolation_ViewViolation));
// CONCATENATED MODULE: ./src/components/presentational/GovernanceDialog/ViewComments.js
var ViewComments_ViewComments=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(ViewComments,_Component);function ViewComments(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,ViewComments);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(ViewComments)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{comments:''});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"onUpdateComments",function(event){_this.setState({comments:event.target.value||''});});return _this;}Object(createClass["a" /* default */])(ViewComments,[{key:"render",value:function render(){var _this2=this;var _this$props=this.props,t=_this$props.t,comments=_this$props.comments,classes=_this$props.classes,isNotCurrentStage=_this$props.isNotCurrentStage;return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,this.props.showCommentHistory&&comments?/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */],null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Header,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('date')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('comment')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('by')))),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Body,null,comments.map(function(comment){return/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{key:Object(v4["a" /* default */])()},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,moment_default()(comment.timeStamp).format('lll')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,comment.comment),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,comment.user?comment.user.displayName:comment.username));}))):null,!isNotCurrentStage&&/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,justify:"center",alignItems:"center",direction:"row",className:classes.commentsForm},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,width:"100%"},/*#__PURE__*/react_default.a.createElement(TextField["a" /* default */],{label:t('add-new-comment'),type:"text",variant:"outlined",name:"commentInput",id:"commentInput",value:this.state.comments,fullWidth:true,onChange:function onChange(evt){return _this2.onUpdateComments(evt);}})),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.commentButtonContainer,item:true,xs:12,sm:10},/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{disabled:!this.state.comments,variant:"contained",name:"submit",size:"large",type:"submit",color:"primary",onClick:function onClick(event){if(!_this2.state.comments){return null;}if(_this2.props.showCommentHistory){_this2.props.onSubmitDialog('revokeAbstainSubmit',_this2.state.comments);}else if(comments&&lodash_default.a.isEmpty(comments)){_this2.props.onSubmitDialog('revokeAbstainSubmit',_this2.state.comments);}else{_this2.props.onSubmitDialog('revokeAbstainSubmit',_this2.state.comments);}_this2.setState({comments:''});}},t('btn-submit-comments'))))));}}]);return ViewComments;}(react["Component"]);/* harmony default export */ var GovernanceDialog_ViewComments = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(GovernanceDialog_styles))(ViewComments_ViewComments));
// CONCATENATED MODULE: ./src/components/presentational/GovernanceDialog/ViewActionSubmitting.js
var ViewActionSubmitting_ViewActionSubmitting=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(ViewActionSubmitting,_Component);function ViewActionSubmitting(){Object(classCallCheck["a" /* default */])(this,ViewActionSubmitting);return Object(possibleConstructorReturn["a" /* default */])(this,Object(getPrototypeOf["a" /* default */])(ViewActionSubmitting).apply(this,arguments));}Object(createClass["a" /* default */])(ViewActionSubmitting,[{key:"render",value:function render(){return/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,direction:'column'},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true},/*#__PURE__*/react_default.a.createElement(LinearProgress["a" /* default */],null)," "));}}]);return ViewActionSubmitting;}(react["Component"]);/* harmony default export */ var GovernanceDialog_ViewActionSubmitting = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(GovernanceDialog_styles))(ViewActionSubmitting_ViewActionSubmitting));
// CONCATENATED MODULE: ./src/components/presentational/GovernanceDialog/GovernanceDialog.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var GovernanceDialog_GovernanceDialog=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(GovernanceDialog,_Component);function GovernanceDialog(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,GovernanceDialog);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(GovernanceDialog)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleClose",function(){if(_this.props.takingAction){return null;}_this.props.changeActiveGovernanceDialog(null);_this.props.changeModalObject(null);if(_this.props.onClose!==undefined){_this.props.onClose();}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getModalTitle",function(modalObject){var t=_this.props.t;var modalTitle=null;switch(_this.props.dialogType){case'userCertification':case'objectCertification':case'certification':modalTitle=t('campaign-details');break;case'policy':modalTitle=t('policy-details');break;case'violation':modalTitle=t('violation-details');break;case'glossary':modalTitle=modalObject&&!_this.props.queryingMetadata?modalObject.displayName||modalObject.attributeValue:null;break;case'entitlement-history':modalTitle=modalObject?modalObject.entitlementDisplayName:null;break;case'targeted-attribute':modalTitle=modalObject?modalObject.title:null;break;case'reassign-tasks':case'reassign-all':case'choose-certifier':return t(_this.props.dialogType);case'comment':modalTitle='Comments';break;case'revoke':modalTitle='Revoke';break;case'abstain':modalTitle='Abstain';break;case'configure-reactive':modalTitle=t('btn-configure-reactive');break;case'actionSubmitting':modalTitle=t('actionInProgress');break;default:modalTitle=null;}return modalTitle;});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleConfirmationSubmit",function(dialogType){switch(dialogType){case'cancel-cert':case'cancel-violation':case'cancel-exception':case'delete-scan':case'delete-policy':case'reset-all':case'reset-selected':case'sign-off':_this.handleClose();_this.props.onSubmitDialog(dialogType,_this.props.selectedRows);break;case'confirmation':default:_this.props.onSubmitDialog();}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getConfirmationMessage",function(dialogType){var _this$props=_this.props,confirmationMessage=_this$props.confirmationMessage,t=_this$props.t;if(confirmationMessage){return confirmationMessage;}else{return t('confirm-'+dialogType);}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getModalContents",function(dialogType){var _this$props2=_this.props,classes=_this$props2.classes,modalObject=_this$props2.modalObject,t=_this$props2.t;switch(dialogType){case'confirmation':case'cancel-cert':case'cancel-violation':case'cancel-exception':case'delete-scan':case'delete-policy':case'reset-all':case'reset-selected':case'sign-off':return/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],null,_this.getConfirmationMessage(dialogType))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12,className:classes.actionButtonContainer},/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{className:classes.actionButton,variant:"contained",onClick:_this.handleClose},t('btn-cancel')),/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{className:classes.actionButton,variant:"contained",color:"primary",onClick:function onClick(){return _this.handleConfirmationSubmit(dialogType);}},t('btn-ok'))));case'choose-certifier':return/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(List["a" /* default */],{component:"nav",subheader:/*#__PURE__*/react_default.a.createElement(ListSubheader["a" /* default */],{component:"div",id:"nested-list-subheader"},t(dialogType+'-message'))},modalObject&&modalObject.options&&modalObject.options.map(function(option){return/*#__PURE__*/react_default.a.createElement(ListItem["a" /* default */],{key:option._id,value:option._id,onClick:function onClick(){return _this.props.onSubmitDialog(null,modalObject.certId,option._id);},button:true},/*#__PURE__*/react_default.a.createElement(ListItemText["a" /* default */],{primary:option.displayName}));})));case'reassign-tasks':case'reassign-all':return/*#__PURE__*/react_default.a.createElement(GovernanceDialog_ViewReassign,{handleClose:_this.handleClose,onSubmitDialog:_this.props.onSubmitDialog,selectedRows:_this.props.selectedRows,dialogType:dialogType,takingAction:_this.props.takingAction});case'userCertification':case'objectCertification':case'certification':return/*#__PURE__*/react_default.a.createElement(GovernanceDialog_ViewCertification,{certification:modalObject,onSubmitDialog:_this.props.onSubmitDialog,handleClose:_this.handleClose});case'violation':return/*#__PURE__*/react_default.a.createElement(GovernanceDialog_ViewViolation,{violation:modalObject,onSubmitDialog:_this.props.onSubmitDialog,handleClose:_this.handleClose,dialogType:dialogType,isOwner:_this.props.root==='dashboard'});case'glossary':case'targeted-attribute':case'entitlement-history':return/*#__PURE__*/react_default.a.createElement(GovernanceDialog_ViewObject,{modalObject:modalObject,queryingMetadata:_this.props.queryingMetadata||_this.props.queryingModalObject,dialogType:dialogType});case'comment':case'abstain':case'revoke':return/*#__PURE__*/react_default.a.createElement(GovernanceDialog_ViewComments,{key:'comments',showCommentHistory:_this.props.selectedAction==='comment'?true:false,isNotCurrentStage:_this.props.isNotCurrentStage,comments:modalObject,onSubmitDialog:_this.props.onSubmitDialog});case'configure-reactive':return/*#__PURE__*/react_default.a.createElement(GovernanceDialog_ViewReactive,{handleClose:_this.handleClose,dialogType:dialogType});case'actionSubmitting':return/*#__PURE__*/react_default.a.createElement(GovernanceDialog_ViewActionSubmitting,null);}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleSubmit",function(){_this.handleClose();});return _this;}Object(createClass["a" /* default */])(GovernanceDialog,[{key:"componentWillUnmount",value:function componentWillUnmount(){this.setState({modalObject:null});this.props.changeDialogType(null);}},{key:"render",value:function render(){var _this$props3=this.props,t=_this$props3.t,classes=_this$props3.classes,dialogId=_this$props3.dialogId,dialogType=_this$props3.dialogType,activeGovernanceDialog=_this$props3.activeGovernanceDialog,modalObject=_this$props3.modalObject,largeDialog=_this$props3.largeDialog,takingAction=_this$props3.takingAction;var modalTitle=this.getModalTitle(modalObject);return/*#__PURE__*/react_default.a.createElement(Dialog["a" /* default */],{className:classes.dialog,scroll:"paper",PaperProps:{className:'appBarShift'},onClose:this.handleClose,open:activeGovernanceDialog===dialogId,"aria-labelledby":"dialog-title"},/*#__PURE__*/react_default.a.createElement(DialogTitle["a" /* default */],{id:"dialog-title",disableTypography:true},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{variant:"h6"},modalTitle||' '),!takingAction?/*#__PURE__*/react_default.a.createElement(IconButton["a" /* default */],{"aria-label":t('label-close'),className:classes.closeButton,onClick:this.handleClose},/*#__PURE__*/react_default.a.createElement(Close_default.a,null)):null),/*#__PURE__*/react_default.a.createElement(Container["a" /* default */],{className:Object(clsx_m["a" /* default */])(!largeDialog&&classes.dialogContainer,largeDialog&&classes.largeDialogContainer),justify:"center"},/*#__PURE__*/react_default.a.createElement("div",null,this.getModalContents(dialogType))));}}]);return GovernanceDialog;}(react["Component"]);var GovernanceDialog_mapStateToProps=function mapStateToProps(state){var _state$generic=state.generic,activeGovernanceDialog=_state$generic.activeGovernanceDialog,dialogType=_state$generic.dialogType,takingAction=_state$generic.takingAction,_state$certlist=state.certlist,selectedAction=_state$certlist.selectedAction,rowData=_state$certlist.rowData;return{activeGovernanceDialog:activeGovernanceDialog,dialogType:dialogType,selectedAction:selectedAction,rowData:rowData,takingAction:takingAction};};var GovernanceDialog_mapDispatchToProps={changeActiveGovernanceDialog:generic_actions_changeActiveGovernanceDialog,changeModalObject:generic_actions_changeModalObject,changeDialogType:generic_actions_changeDialogType};/* harmony default export */ var presentational_GovernanceDialog_GovernanceDialog = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(GovernanceDialog_mapStateToProps,GovernanceDialog_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(GovernanceDialog_styles))(GovernanceDialog_GovernanceDialog));
// CONCATENATED MODULE: ./src/components/presentational/GovernanceDialog/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var presentational_GovernanceDialog = (presentational_GovernanceDialog_GovernanceDialog);
// CONCATENATED MODULE: ./src/components/presentational/BulkActionMenu/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var BulkActionMenu_styles_styles=function styles(theme){return{button:{marginTop:'20px',marginRight:'5px',height:'50px',minWidth:'100px',backgroundColor:theme.palette.forgerock.blue,borderColor:theme.palette.forgerock.blue,color:theme.palette.forgerock.white,'&:hover':{backgroundColor:theme.palette.forgerock.blue}}};};/* harmony default export */ var BulkActionMenu_styles = (BulkActionMenu_styles_styles);
// CONCATENATED MODULE: ./src/components/presentational/BulkActionMenu/BulkActionMenu.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var BulkActionMenu_BulkActionMenu=function BulkActionMenu(props){var actions=props.actions,selected=props.selected,classes=props.classes,t=props.t;var _React$useState=react_default.a.useState(null),_React$useState2=Object(slicedToArray["a" /* default */])(_React$useState,2),anchorEl=_React$useState2[0],setAnchorEl=_React$useState2[1];var handleClick=function handleClick(event){setAnchorEl(event.currentTarget);};var handleClose=function handleClose(){setAnchorEl(null);};var handleSubmit=function handleSubmit(action){props.onActionClick(action);setAnchorEl(null);};var bulkActions=lodash_default.a.cloneDeep(actions);if(selected.length<=0){bulkActions=lodash_default.a.remove(bulkActions,function(action){return!action.includes('selected');});}return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{"aria-controls":"customized-menu","aria-haspopup":"true",variant:"contained",color:"primary",onClick:handleClick,className:classes.button,disabled:bulkActions.length===0},t('btn-stage-actions')),/*#__PURE__*/react_default.a.createElement(Menu["a" /* default */],{anchorEl:anchorEl,keepMounted:true,open:Boolean(anchorEl),onClose:handleClose},bulkActions.map(function(action){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:action,onClick:function onClick(){handleSubmit(action);}},t('btn-'+action));})));};/* harmony default export */ var presentational_BulkActionMenu_BulkActionMenu = (Object(redux["d" /* compose */])(Object(withStyles["a" /* default */])(BulkActionMenu_styles,{withTheme:true}),Object(react_i18next_dist_es["b" /* withTranslation */])())(BulkActionMenu_BulkActionMenu));
// CONCATENATED MODULE: ./src/components/presentational/BulkActionMenu/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var presentational_BulkActionMenu = (presentational_BulkActionMenu_BulkActionMenu);
// CONCATENATED MODULE: ./src/components/presentational/GovernanceTable/GovernanceTable.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var BorderLinearProgress=Object(withStyles["a" /* default */])(function(theme){return{root:{height:10,borderRadius:5},colorPrimary:{backgroundColor:theme.palette.forgerock.lightGray},bar:{borderRadius:5,backgroundColor:theme.palette.forgerock.blue}};})(LinearProgress["a" /* default */]);var GovernanceTable_GovernanceTable=function GovernanceTable(props){var _React$useState=react_default.a.useState([]),_React$useState2=Object(slicedToArray["a" /* default */])(_React$useState,2),selectedRows=_React$useState2[0],setSelectedRows=_React$useState2[1];var _React$useState3=react_default.a.useState(false),_React$useState4=Object(slicedToArray["a" /* default */])(_React$useState3,2),allSelected=_React$useState4[0],setAllSelected=_React$useState4[1];Object(react["useEffect"])(function(){setSelectedRows([]);setAllSelected(false);},[props.tableData]);var handleCheckboxClick=function handleCheckboxClick(event,rowId,isDisabled){event.stopPropagation();if(isDisabled){return;}var selectedIndex=selectedRows.indexOf(rowId);var newSelected=[];if(selectedIndex>-1){newSelected=lodash_default.a.without(selectedRows,rowId);}else{newSelected=lodash_default.a.concat(selectedRows,rowId);}if(props.tableData&&newSelected.length===props.tableData.length){setAllSelected(true);}else{setAllSelected(false);}setSelectedRows(newSelected);};var handleCheckAll=function handleCheckAll(){if(!props.tableData||props.tableData.length===0){setAllSelected(false);}else if(selectedRows.length===props.tableData.filter(function(row){return!row.isRowInactive;}).length){setSelectedRows([]);setAllSelected(false);}else{var newSelected=props.tableData.filter(function(row){return!row.isRowInactive;}).map(function(row){return row._id;});setSelectedRows(newSelected);setAllSelected(true);}};var getIconFromAction=function getIconFromAction(action){var icon='';switch(action){case'cancel':case'cancel-violation':case'cancel-exception':case'cancel-cert':icon=/*#__PURE__*/react_default.a.createElement(Block_default.a,{className:classes.buttonIcon});break;case'reassign-tasks':case'reassign-all':icon=/*#__PURE__*/react_default.a.createElement(AssignmentInd_default.a,{className:classes.buttonIcon});break;case'delete-selected':case'delete-scan':case'delete-policy':icon=/*#__PURE__*/react_default.a.createElement(Delete_default.a,{className:classes.buttonIcon});break;case'configure-reactive':icon=/*#__PURE__*/react_default.a.createElement(Settings_default.a,{className:classes.buttonIcon});break;case'certify':icon=/*#__PURE__*/react_default.a.createElement(CheckCircle_default.a,{className:classes.buttonIcon});break;case'revoke':icon=/*#__PURE__*/react_default.a.createElement(HighlightOff_default.a,{className:classes.buttonIcon});break;case'sign-off':icon=/*#__PURE__*/react_default.a.createElement(Assignment_default.a,{className:classes.buttonIcon});break;case'reset':icon=/*#__PURE__*/react_default.a.createElement(RotateLeft_default.a,{className:classes.buttonIcon});break;default:icon=/*#__PURE__*/react_default.a.createElement(Add_default.a,{className:classes.buttonIcon});break;}return icon;};var openDialogModal=function openDialogModal(action,data){if(data&&props.getModalObject){if(action!=='choose-certifier'&&action!=='configure-reactive'){props.getModalObject(action,data,false);}else{props.getModalObject(action,data,true);}}props.changeDialogType(action);props.changeActiveGovernanceDialog('GovernanceTableDialog');};var handleTableActions=function handleTableActions(action,taskId,value){switch(action){case'cancel-cert':case'cancel-violation':case'cancel-exception':case'delete-scan':case'delete-policy':case'reset-all':case'reset-selected':case'sign-off':openDialogModal(action);break;case'reassign-tasks':case'reassign-all':case'configure-reactive':openDialogModal(action);break;default:props.handleActions(action,selectedRows);}};var handleRowClick=function handleRowClick(evt,rowId){var tableData=props.tableData;var data=null;if(props.handleRowClick){switch(props.tableType){case'violation':case'violations-active':case'exceptions-active':case'violations-history':case'violation-tasks':case'violation-dashboard':openDialogModal('violation',rowId);break;case'user-dashboard':case'object-dashboard':data=lodash_default.a.find(tableData,['_id',rowId]);var options=data.status==='in-progress'?data.openCertifiers:data.closedCertifiers;if(options&&options.length>1){var _data={certId:rowId,options:options};openDialogModal('choose-certifier',_data);}else if(options){props.handleRowClick(evt,rowId,options[0]._id);}break;case'certList':data=lodash_default.a.find(tableData,['_id',rowId]);var viewable=data&&(!data.isRowInactive||data.isViewable);props.handleRowClick(evt,rowId,!viewable);break;default:props.handleRowClick(evt,rowId);}}};var openCreateModal=function openCreateModal(){props.changeCreateModalType(props.newButtonText,'create');props.setIsCreateModalOpen(true);};var getRowDropDown=function getRowDropDown(row,options){if(lodash_default.a.isUndefined(options)){return'bad data';}else if(options.length==1){return options[0].displayName;}else{return/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{onChange:function onChange(event){props.onRowDropdownSelect(row._id,event);},value:options[0]._id,name:options[0].displayName,onClose:function onClose(event){event.stopPropagation();}},options.map(function(option){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:Object(v4["a" /* default */])(),value:option._id,name:option.displayName},option.displayName);}));}};var getTableCellData=function getTableCellData(row,columnKey,type){var getIconFromOutcome=props.getIconFromOutcome,t=props.t;var value=row[columnKey];if(value&&lodash_default.a.isArray(value)&&type!=='dropdown'){if(value.length===1){value=value[0];}else{value=t('multiple');}}if(columnKey==='progress'){if(row.status==='creating'){value=t('creating');}else{return/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,display:"flex","flex-direction":"row"},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,className:classes.borderProgressContainer,xs:8},/*#__PURE__*/react_default.a.createElement(BorderLinearProgress,{variant:"determinate",value:value})),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:4},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.progressValue,variant:"body1",color:"textSecondary"},row.totalEventsComplete+'/'+row.totalEventCount)));}}else if(columnKey==='outcome'){return getIconFromOutcome(row.ownerOutcome||row.outcome,row.status);}else if(columnKey==='claimedBy'){return value?value.displayName:t('unclaimed');}else if(lodash_default.a.isObject(value)&&value._ref){return value._ref;}else if(lodash_default.a.isObject(value)&&type!='dropdown'){return value.displayName||null;}else if(type==='date'&&value){return moment_default()(value).format('L');}else if(type==='dropdown'){return getRowDropDown(row,value);}else if(type==='violationStatus'){return t(value);}else{return value;}};var bulkActions=props.bulkActions,altActions=props.altActions,classes=props.classes,tableCols=props.tableCols,sortBy=props.sortBy,sortDir=props.sortDir,showCheckboxes=props.showCheckboxes,showOutcome=props.showOutcome,showNewButton=props.showNewButton,newButtonText=props.newButtonText,querying=props.querying,tableData=props.tableData,pageSize=props.pageSize,pagedResultsOffset=props.pagedResultsOffset,totalPagedResults=props.totalPagedResults,handlePagination=props.handlePagination,t=props.t,doNotPaginate=props.doNotPaginate,hideToolbar=props.hideToolbar,hideSearchBar=props.hideSearchBar,useBulkActionMenu=props.useBulkActionMenu;var count=0;if(totalPagedResults){count=totalPagedResults;}else if(tableData.length<pageSize||tableData.length===0){count=tableData.length+pageSize*pagedResultsOffset;}else{count=pageSize*(pagedResultsOffset+1)+1;}return/*#__PURE__*/react_default.a.createElement(Paper["a" /* default */],{className:classes.root},!hideToolbar?/*#__PURE__*/react_default.a.createElement(Toolbar["a" /* default */],{className:classes.tableToolbar},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,direction:"row",justify:"space-between"},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:8,className:classes.bulkActionGrid},showNewButton&&newButtonText&&/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{variant:"outlined",key:"createActionButton",className:classes.tableCreateButton,onClick:function onClick(){return openCreateModal();}}," ",/*#__PURE__*/react_default.a.createElement(Add_default.a,{className:classes.buttonIcon}),t("btn-new-".concat(newButtonText))),useBulkActionMenu?/*#__PURE__*/react_default.a.createElement(presentational_BulkActionMenu,{actions:bulkActions,onActionClick:handleTableActions,selected:selectedRows}):(bulkActions||[]).map(function(action){return/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{id:"bulk-action-button","aria-controls":"bulk-menu","aria-haspopup":"true",variant:"outlined",disabled:selectedRows.length===0&&!action.endsWith('-all'),key:action,className:classes.tableActionButton,onClick:function onClick(){return handleTableActions(action);}}," ",getIconFromAction(action),t('btn-'+action));})),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:4,className:classes.altActionGrid},altActions&&altActions.map(function(action){return/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{id:"alt-action-button","aria-controls":"alt-menu","aria-haspopup":"true",variant:"outlined",key:action,className:classes.tableActionButton,onClick:function onClick(){return handleTableActions(action);}}," ",getIconFromAction(action),t('btn-'+action));})))):'',props.handleActions&&/*#__PURE__*/react_default.a.createElement(presentational_GovernanceDialog,{dialogId:"GovernanceTableDialog",onSubmitDialog:props.handleActions,selectedRows:selectedRows,modalObject:props.modalObject,queryingModalObject:props.queryingModalObject,root:props.root}),!hideSearchBar&&/*#__PURE__*/react_default.a.createElement(Toolbar["a" /* default */],{className:classes.tableToolbar},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,direction:"row",justify:"space-between"},/*#__PURE__*/react_default.a.createElement(TextField["a" /* default */],{className:classes.tableSearchBar,variant:"outlined",label:t('filter-table'),onChange:function onChange(val){return handlePagination({q:val.target.value});},InputProps:{startAdornment:/*#__PURE__*/react_default.a.createElement(InputAdornment["a" /* default */],{className:classes.searchIcon,position:"start"},/*#__PURE__*/react_default.a.createElement(Search_default.a,null))}}))),/*#__PURE__*/react_default.a.createElement(Table["a" /* default */],{size:"small",className:classes.table},/*#__PURE__*/react_default.a.createElement(TableHead["a" /* default */],null,tableData&&tableData.length>0&&/*#__PURE__*/react_default.a.createElement(TableRow["a" /* default */],{className:classes.tableHeadRow},/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{padding:"checkbox",className:classes.tableHeaderCheckbox,onClick:function onClick(){return handleCheckAll();}},lodash_default.a.isUndefined(showCheckboxes)||showCheckboxes&&/*#__PURE__*/react_default.a.createElement(Checkbox["a" /* default */],{className:Object(clsx_m["a" /* default */])(!showCheckboxes&&classes.hidden),checked:allSelected,indeterminate:tableData&&selectedRows.length>0&&!allSelected})),/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{colSpan:1,padding:"checkbox",className:classes.tableCheckbox},showOutcome&&getTableCellData({},'outcome',null)),tableCols.map(function(column){return/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{className:Object(clsx_m["a" /* default */])(classes.tableHeader,column.noSort&&classes.tableLabel),key:column.key,sortDirection:sortBy===column.key?sortDir:false},!column.noSort?/*#__PURE__*/react_default.a.createElement(TableSortLabel["a" /* default */],{active:sortBy===column.key,direction:sortBy===column.key?sortDir:'desc',onClick:function onClick(){return handlePagination({sortBy:column.key});}},column.header,sortBy===column.key?/*#__PURE__*/react_default.a.createElement("span",{className:classes.visuallyHidden},sortDir==='asc'?'sorted ascending':'sorted descending'):null):/*#__PURE__*/react_default.a.createElement("span",null,column.header));}))),/*#__PURE__*/react_default.a.createElement(TableBody["a" /* default */],null,querying?/*#__PURE__*/react_default.a.createElement(TableRow["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{colSpan:tableCols.length},/*#__PURE__*/react_default.a.createElement(LinearProgress["a" /* default */],null))):tableData&&tableData.length>0&&tableData.map(function(tableRow){return/*#__PURE__*/react_default.a.createElement(TableRow["a" /* default */],{key:tableRow._id,className:classes.tableBodyRow,onClick:function onClick(evt){return handleRowClick(evt,tableRow._id);}},/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{colSpan:1,padding:"checkbox",className:classes.tableCheckbox,onClick:function onClick(event){return handleCheckboxClick(event,tableRow._id,tableRow.isRowInactive);}},lodash_default.a.isUndefined(showCheckboxes)||showCheckboxes&&/*#__PURE__*/react_default.a.createElement(Checkbox["a" /* default */],{className:Object(clsx_m["a" /* default */])(!showCheckboxes&&classes.hidden),disabled:tableRow.isRowInactive,checked:selectedRows.indexOf(tableRow._id)>-1})),/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{colSpan:1,padding:"checkbox",className:classes.tableCheckbox},showOutcome&&getTableCellData(tableRow,'outcome',null)),tableCols.map(function(column){return/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{key:Object(v4["a" /* default */])(),colSpan:tableCols.length-1,className:Object(clsx_m["a" /* default */])(classes.root,classes.tableCellGeneric,tableRow.isRowInactive&&classes.tableCellInactive),onClick:function onClick(evt){return handleRowClick(evt,tableRow._id);}},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.tableCellGrid},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{component:"span",className:classes.column,key:column.key},/*#__PURE__*/react_default.a.createElement("span",{className:Object(clsx_m["a" /* default */])(classes.cellItem,classes.cellItemIcon)},getTableCellData(tableRow,column.key,column.type)))));}));}),tableData&&/*#__PURE__*/react_default.a.createElement(TableRow["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{colSpan:tableCols.length},doNotPaginate?'':/*#__PURE__*/react_default.a.createElement(TablePagination["a" /* default */],{className:classes.tablePagination,rowsPerPageOptions:[10,25,50],component:"div",count:count,rowsPerPage:pageSize,page:pagedResultsOffset,backIconButtonProps:{'aria-label':t('paging-prev')},nextIconButtonProps:{'aria-label':t('paging-next')},onChangePage:handlePagination,onChangeRowsPerPage:handlePagination}))))));};var GovernanceTable_mapStateToProps=function mapStateToProps(state){var generic=state.generic;return{generic:generic};};var GovernanceTable_mapDispatchToProps={setIsCreateModalOpen:generic_actions_setIsCreateModalOpen,changeActiveGovernanceDialog:generic_actions_changeActiveGovernanceDialog,changeCreateModalType:generic_actions_changeCreateModalType,changeDialogType:generic_actions_changeDialogType};/* harmony default export */ var presentational_GovernanceTable_GovernanceTable = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(GovernanceTable_mapStateToProps,GovernanceTable_mapDispatchToProps),Object(withStyles["a" /* default */])(GovernanceTable_styles,{withTheme:true}),Object(react_i18next_dist_es["b" /* withTranslation */])())(GovernanceTable_GovernanceTable));
// CONCATENATED MODULE: ./src/components/presentational/GovernanceTable/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var presentational_GovernanceTable = (presentational_GovernanceTable_GovernanceTable);
// CONCATENATED MODULE: ./src/components/presentational/LoadingIndicator/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var LoadingIndicator_styles_styles=function styles(theme){return{progressContainer:{width:'100%',position:'fixed',height:'100%',zIndex:1000,opacity:0.9,margin:theme.spacing(-3)}};};/* harmony default export */ var LoadingIndicator_styles = (LoadingIndicator_styles_styles);
// CONCATENATED MODULE: ./src/components/presentational/LoadingIndicator/LoadingIndicator.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var LoadingIndicator_LoadingIndicator=function LoadingIndicator(props){var classes=props.classes;return/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,alignContent:"center",justify:"center",className:classes.progressContainer},/*#__PURE__*/react_default.a.createElement(CircularProgress["a" /* default */],{color:"primary"}));};/* harmony default export */ var presentational_LoadingIndicator_LoadingIndicator = (Object(withStyles["a" /* default */])(LoadingIndicator_styles,{withTheme:true})(LoadingIndicator_LoadingIndicator));
// CONCATENATED MODULE: ./src/components/presentational/LoadingIndicator/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var presentational_LoadingIndicator = (presentational_LoadingIndicator_LoadingIndicator);
// CONCATENATED MODULE: ./src/components/containers/Dashboard/Dashboard.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var Dashboard_Dashboard=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(Dashboard,_Component);function Dashboard(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,Dashboard);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(Dashboard)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"_isMounted",false);Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{tableCols:[],tableData:[],loading:false,modalObject:null,translationMap:{'user':'page-user-certs','object':'page-object-certs','violation':'page-violations'}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"closeDialog",function(){_this.props.setIsDialogOpen(false);_this.props.changeModalObject(null);});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"openDialogModal",function(dataType,modalObject){_this.props.getModalObject(dataType,modalObject._id);_this.props.changeDialogType(dataType);_this.props.setIsDialogOpen(true);});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"setTableColsForType",function(type,status){var tableCols=[];if(type==='violation'){if(status==='active'){tableCols=[{'header':'User','key':'targetUser','noSort':true},{'header':'Policy','key':'policyName'},{'header':'Owner','key':'owner','noSort':true},{'header':'Expiration Date','key':'expirationDate','type':'date'}];}else if(status==='closed'){tableCols=[{'header':'User','key':'targetUser','noSort':true},{'header':'Policy','key':'policyName'},{'header':'Owner','key':'owner','noSort':true},{'header':'Completion Date','key':'completionDate','type':'date'},{'header':'Result','key':'status','type':'violationStatus'}];}}else{if(status==='active'){tableCols=[{'header':'Campaign Name','key':'name'},{'header':'Certifier','key':'openCertifiers','noSort':true},{'header':'Start Date','key':'startDate','type':'date'},{'header':'Deadline','key':'deadline','type':'date'}];}else{tableCols=[{'header':'Campaign Name','key':'name'},{'header':'Certifier','key':'closedCertifiers','noSort':true},{'header':'Start Date','key':'startDate','type':'date'},{'header':'Completed On','key':'completionDate','type':'date'}];}if(type==='object'){tableCols.splice(2,0,{'header':'Object','key':'certObjectType'});}}_this.setState({tableCols:tableCols});});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"dropDownHandleChange",function(id,event){event.stopPropagation();_this.props.updateActingId(event.target.value);_this.props.history.push('/certificationList/'+_this.props.dashboard.type+'/'+id);});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"changeSelectedType",function(type){var status=_this.props.dashboard.status;_this.setTableColsForType(type,status);_this.props.updateType(type);});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"changeSelectedStatus",function(status){var type=_this.props.dashboard.type;_this.setTableColsForType(type,status);_this.props.updateStatus(status);});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"onPaginationChange",function(evt,page){if(evt.q!=null){_this.props.changeSearchKey(evt.q);}else if(evt.sortBy){// Sorting key changed
var isDesc=evt.sortBy===_this.props.dashboard.sortBy&&_this.props.dashboard.sortDir==='asc';_this.props.changeSortKey(evt.sortBy,isDesc);}else if(evt.target.value){// Rows per page changed
_this.props.updatePagination(Object(objectSpread["a" /* default */])({},_this.props.dashboard,{pageNumber:1,pageSize:evt.target.value}));}else if(lodash_default.a.isNumber(page)){// Page number changed
_this.props.updatePagination(Object(objectSpread["a" /* default */])({},_this.props.dashboard,{pageNumber:page+1}));}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleRowClick",function(evt,selectedRow,action,comments,exceptionDate){var dashboard=_this.props.dashboard;if(dashboard.type==='violation'){_this.props.actOnViolation(selectedRow,action,comments,exceptionDate);}else{_this.props.changeActiveGovernanceDialog(null);_this.props.changeDialogType(null);_this.props.history.push({pathname:'/certificationList/'+_this.props.dashboard.type+'/'+selectedRow,search:'?actingId='+action+'&status='+dashboard.status});}});return _this;}Object(createClass["a" /* default */])(Dashboard,[{key:"componentDidMount",value:function componentDidMount(){this.props.updateActingId('');//Note: This forces componentDidUpdate to run
}},{key:"componentDidUpdate",value:function componentDidUpdate(prevProps){var _this2=this;var _this$props$dashboard=this.props.dashboard,type=_this$props$dashboard.type,status=_this$props$dashboard.status;if(!type||!status){this.props.updateStatus('active',utils_constants.DO_NOT_UPDATE);this.props.updateType('user',utils_constants.DO_NOT_UPDATE);this.props.updateActingId('');this.props.getCertifications().finally(function(){_this2.setTableColsForType('user','active');});}}},{key:"componentWillUnmount",value:function componentWillUnmount(){this._isMounted=false;var status=this.props.dashboard.status;this.props.updatePagination({pageNumber:1,pageSize:this.props.dashboard.pageSize,sortBy:'deadline',status:status},utils_constants.DO_NOT_UPDATE);this.props.changeSearchKey(null,utils_constants.DO_NOT_UPDATE);this.props.updateStatus(null,utils_constants.DO_NOT_UPDATE);this.props.updateType(null,utils_constants.DO_NOT_UPDATE);}},{key:"render",value:function render(){var _this3=this;var _this$props=this.props,dashboard=_this$props.dashboard,classes=_this$props.classes,t=_this$props.t,generic=_this$props.generic;var pageNumber=dashboard.pageNumber,pageSize=dashboard.pageSize,querying=dashboard.querying,type=dashboard.type;var modalObject=generic.modalObject,queryingModalObject=generic.queryingModalObject;if(!dashboard.results){return null;}if(this.state.loading){return/*#__PURE__*/react_default.a.createElement(presentational_LoadingIndicator,null);}return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(presentational_PageTitle,{title:t('page-my-tasks')}),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.buttonContainer,item:true,xs:12},/*#__PURE__*/react_default.a.createElement(ButtonGroup["a" /* default */],{color:"default",fullWidth:true,"aria-label":"full width outlined button group"},utils_constants.TASKS.map(function(taskType){return/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{key:taskType,className:Object(clsx_m["a" /* default */])(classes.certTypeButton,{'selected':taskType===dashboard.type}),variant:"contained",onClick:function onClick(){return _this3.changeSelectedType(taskType);}},t(_this3.state.translationMap[taskType]));}))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.buttonContainer,item:true,xs:12},/*#__PURE__*/react_default.a.createElement(ButtonGroup["a" /* default */],{color:"default",fullWidth:true,"aria-label":"full width outlined button group"},utils_constants.DASHBOARD_STATUSES.map(function(status){return/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{key:status,className:Object(clsx_m["a" /* default */])(classes.certStatusButton,{'selected':status===dashboard.status}),variant:"contained",onClick:function onClick(){return _this3.changeSelectedStatus(status,type);}},t(status));}))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.container,justify:"center"},/*#__PURE__*/react_default.a.createElement(presentational_GovernanceTable,{tableCols:this.state.tableCols,tableData:this.props.dashboard.results,sortBy:this.props.dashboard.sortBy,sortDir:this.props.dashboard.sortDir,handleActions:this.handleRowClick,showNewButton:false,showCheckboxes:false,pageSize:pageSize,pagedResultsOffset:pageNumber-1,handlePagination:this.onPaginationChange,querying:querying,hideBulkActions:true,handleRowClick:this.handleRowClick,tableType:type+'-dashboard',getModalObject:this.props.getModalObject,modalObject:modalObject,queryingModalObject:queryingModalObject,hideToolbar:true,onRowDropdownSelect:this.dropDownHandleChange,root:"dashboard"})));}}]);return Dashboard;}(react["Component"]);var Dashboard_mapStateToProps=function mapStateToProps(state){var dashboard=state.dashboard,generic=state.generic,certlist=state.certlist;return{dashboard:dashboard,generic:generic,certlist:certlist};};var Dashboard_mapDispatchToProps={getCertifications:dashboard_actions_getCertifications,updateStatus:dashboard_actions_updateStatus,updateType:dashboard_actions_updateType,changeSearchKey:dashboard_actions_changeSearchKey,changeSortKey:dashboard_actions_changeSortKey,updatePagination:dashboard_actions_updatePagination,getModalObject:generic_actions_getModalObject,setIsDialogOpen:generic_actions_setIsDialogOpen,changeModalObject:generic_actions_changeModalObject,commentViolation:dashboard_actions_commentViolation,actOnViolation:dashboard_actions_actOnViolation,updateActingId:certlist_actions_updateActingId,changeDialogType:generic_actions_changeDialogType,changeActiveGovernanceDialog:generic_actions_changeActiveGovernanceDialog};/* harmony default export */ var containers_Dashboard_Dashboard = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(Dashboard_mapStateToProps,Dashboard_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(Dashboard_styles))(Dashboard_Dashboard));
// CONCATENATED MODULE: ./src/components/containers/Dashboard/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var containers_Dashboard = (containers_Dashboard_Dashboard);
// EXTERNAL MODULE: ./node_modules/@material-ui/icons/VisibilityOff.js
var VisibilityOff = __webpack_require__(297);
var VisibilityOff_default = /*#__PURE__*/__webpack_require__.n(VisibilityOff);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Visibility.js
var Visibility = __webpack_require__(296);
var Visibility_default = /*#__PURE__*/__webpack_require__.n(Visibility);

// CONCATENATED MODULE: ./src/components/containers/Login.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var Login_styles=function styles(theme){return{loginLogo:{width:'43px',marginBottom:'10px'},loginGrid:{backgroundColor:theme.palette.forgerock.white,border:'1px solid',borderColor:'rgba(33, 37, 41, .125)',borderRadius:'calc(.25rem - 1px) calc(.25rem - 1px) 0 0',maxWidth:'420px',minHeight:'411px',margin:'auto',marginTop:'140px'},loginLabel:{lineHeight:'1.8'},loginText:{minWidth:'300px'},loginButton:{minWidth:'300px',backgroundColor:theme.palette.secondary.main,color:theme.palette.forgerock.white,'&:disabled':{backgroundColor:theme.palette.secondary.main,color:theme.palette.forgerock.white},'&:hover':{backgroundColor:theme.palette.secondary.main,color:theme.palette.forgerock.white}},showPasswordButton:{marginBottom:'5px'}};};var Login_Login=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(Login,_Component);function Login(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,Login);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(Login)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"login",function(values,actions){var userName=values.userName,password=values.password;_this.props.loginUser(userName,password);});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"openAmRedirect",function(provider){return httpService.post(utils_constants.IDM_CONTEXT.concat('/identityProviders'),{provider:provider,landingPage:utils_constants.IDM_URL.concat('/governance/#/login')},{headers:{'X-OpenIDM-Username':'anonymous','X-OpenIDM-Password':'anonymous','X-OpenIDM-NoSession':'true'},params:{'_action':'getAuthRedirect'}}).then(function(_ref){var data=_ref.data;httpService.addDataStoreToken(data.token);return window.location.replace(data.redirect);}).then(function(response){return auth_actions_authenticateUser('','');}).catch(function(error){var _this$props=_this.props,logoutUser=_this$props.logoutUser,history=_this$props.history;logoutUser().then(function(){history.push({pathname:'/'});history.replace({pathname:'/login/oidc'});});});});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"renderFormikForm",function(props){var _this$props2=_this.props,classes=_this$props2.classes,t=_this$props2.t,error=_this$props2.error,message=_this$props2.message;var setSubmitting=props.setSubmitting,handleChange=props.handleChange,handleBlur=props.handleBlur,handleSubmit=props.handleSubmit,values=props.values,setValues=props.setValues,errors=props.errors,touched=props.touched,isSubmitting=props.isSubmitting;var handleClickShowPassword=function handleClickShowPassword(){setValues(Object(objectSpread["a" /* default */])({},values,{showPassword:!values.showPassword}));};var handleMouseDownPassword=function handleMouseDownPassword(event){event.preventDefault();};if(error&&message&&isSubmitting){setSubmitting(false);}return/*#__PURE__*/react_default.a.createElement("form",{onSubmit:handleSubmit},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,justify:"center",alignItems:"center",direction:"column",className:classes.loginGrid,spacing:2},/*#__PURE__*/react_default.a.createElement("img",{className:classes.loginLogo,src:"/governance"+'/img/loginlogo.svg',alt:"logo"}),/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.loginLabel,component:"h1",variant:"h4",color:"inherit","data-test-id":"appBar-text-appTitle",noWrap:true},t('sign-in')),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12,sm:10},/*#__PURE__*/react_default.a.createElement(TextField["a" /* default */],{label:t('label-username'),type:"text",variant:"outlined","data-test-id":"loginPage-textInput-userNameField",name:"userName",fullWidth:true,className:classes.loginText,error:Boolean(touched.userName&&errors.userName),onChange:handleChange,onBlur:handleBlur,value:values.userName,helperText:touched.userName&&errors.userName&&String(errors.userName)})),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12},/*#__PURE__*/react_default.a.createElement(TextField["a" /* default */],{label:t('label-password'),type:values.showPassword?'text':'password',"data-test-id":"loginPage-textInput-passwordField",variant:"outlined",name:"password",fullWidth:true,className:classes.loginText,error:Boolean(touched.password&&errors.password),onChange:handleChange,onBlur:handleBlur,value:values.password,helperText:touched.password&&errors.password&&String(errors.password),InputProps:{endAdornment:/*#__PURE__*/react_default.a.createElement(InputAdornment["a" /* default */],{position:"end"},/*#__PURE__*/react_default.a.createElement(IconButton["a" /* default */],{className:classes.showPasswordButton,"aria-label":"toggle password visibility",onClick:handleClickShowPassword,onMouseDown:handleMouseDownPassword},values.showPassword?/*#__PURE__*/react_default.a.createElement(Visibility_default.a,null):/*#__PURE__*/react_default.a.createElement(VisibilityOff_default.a,null)))}})),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12,sm:10},/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{variant:"contained",size:"large",type:"submit",className:classes.loginButton,"data-test-id":"loginPage-button-loginButton",fullWidth:true},t('btn-login')))));});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"validateFormikForm",function(values){var t=_this.props.t;var errors={};if(!values.userName){errors.userName=t('form-error-required');}if(!values.password){errors.password=t('form-error-required');}return errors;});return _this;}Object(createClass["a" /* default */])(Login,[{key:"render",value:function render(){var token=window.sessionStorage.getItem('amToken')||window.localStorage.getItem('dataStoreToken');var _this$props3=this.props,isLoggedIn=_this$props3.isLoggedIn,authModule=_this$props3.authModule,openAmLogin=_this$props3.openAmLogin;if(isLoggedIn){return/*#__PURE__*/react_default.a.createElement(react_router["a" /* Redirect */],{to:"/"});}else if(token){openAmLogin(token);}else if(this.props.match.params.oidc){this.openAmRedirect(authModule);}if(this.props.authModule==='OPENAM'){this.openAmRedirect(authModule);}return/*#__PURE__*/react_default.a.createElement("div",{className:"login"},/*#__PURE__*/react_default.a.createElement(formik_esm["b" /* Formik */],{initialValues:{userName:'',password:''},validate:this.validateFormikForm,onSubmit:this.login},this.renderFormikForm));}}]);return Login;}(react["Component"]);var Login_mapStateToProps=function mapStateToProps(state){var _state$auth=state.auth,authModule=_state$auth.authModule,isLoggedIn=_state$auth.isLoggedIn,error=_state$auth.error,message=_state$auth.message;return{authModule:authModule,isLoggedIn:isLoggedIn,error:error,message:message};};var Login_mapDispatchToProps=function mapDispatchToProps(dispatch){return{loginUser:function loginUser(userName,password){return dispatch(auth_actions_authenticateUser(userName,password));},logoutUser:function logoutUser(){return dispatch(auth_actions_logoutUser());},openAmLogin:auth_actions_openAmLogin};};/* harmony default export */ var containers_Login = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(Login_mapStateToProps,Login_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(Login_styles))(Login_Login));
// CONCATENATED MODULE: ./src/components/containers/PrivateRoute.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var PrivateRoute=Object(react_router["f" /* withRouter */])(function(_ref){var Component=_ref.component,isLoggedIn=_ref.isLoggedIn,props=_ref.props,rest=Object(objectWithoutProperties["a" /* default */])(_ref,["component","isLoggedIn","props"]);return/*#__PURE__*/react_default.a.createElement(react_router["b" /* Route */],Object.assign({},rest,{render:function render(_props){return/*#__PURE__*/react_default.a.createElement(Component,Object(objectSpread["a" /* default */])({},props,_props));}}));});var PrivateRoute_mapStateToProps=function mapStateToProps(state){var isLoggedIn=state.auth.isLoggedIn;return{isLoggedIn:isLoggedIn};};/* harmony default export */ var containers_PrivateRoute = (Object(es["b" /* connect */])(PrivateRoute_mapStateToProps)(PrivateRoute));
// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Slide/Slide.js
var Slide = __webpack_require__(442);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/withWidth/withWidth.js + 1 modules
var withWidth = __webpack_require__(541);

// CONCATENATED MODULE: ./src/components/presentational/CreateForms/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var CreateForms_styles_styles=function styles(theme){return{dialog:{minWidth:'400px',overflowY:'scroll'},formControl:{'& > *':{margin:theme.spacing(1)}},formLabel:{backgroundColor:theme.palette.forgerock.white,paddingLeft:theme.spacing(),paddingRight:theme.spacing(),textTransform:'capitalize',marginBottom:0},formInput:{margin:'0 auto',maxWidth:'80%',minWidth:'fit-content'},formSlider:{maxWidth:'-webkit-fill-available'},mainFormGrid:{justifyContent:'center',overflowY:'scroll'},slider:{paddingLeft:'15px'},submitButton:{backgroundColor:theme.palette.forgerock.blue},dialogActions:{width:'100%'}};};/* harmony default export */ var CreateForms_styles = (CreateForms_styles_styles);
// CONCATENATED MODULE: ./src/components/presentational/CreateForms/NewPolicy.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var NewPolicyForm=Object(formik_esm["c" /* withFormik */])({mapPropsToValues:function mapPropsToValues(props){var formFields={};props.formSchema().forEach(function(item){if(props.existingFormData&&props.existingFormData[item.id]){if(item.isStringified&&lodash_default.a.isString(props.existingFormData[item.id])){formFields[item.id]=JSON.parse(props.existingFormData[item.id]);}else if(item.type==='duration'){var _props$existingFormDa=props.existingFormData[item.id].split(' '),_props$existingFormDa2=Object(slicedToArray["a" /* default */])(_props$existingFormDa,2),unit=_props$existingFormDa2[0],period=_props$existingFormDa2[1];formFields[item.id]={unit:unit,period:period};}else if(item.type==='escalation'){formFields[item.id]=props.existingFormData[item.id].map(function(schedule){return{escalationType:schedule.escalationType,escalationId:schedule.escalationId,unit:schedule.interval,period:schedule.intervalType};});}else{formFields[item.id]=props.existingFormData[item.id];}}else if(lodash_default.a.isNull(item.value)){formFields[item.id]=item.value;}else{formFields[item.id]=item.value||'';}});return formFields;},enableReinitialize:true,isInitialValid:function isInitialValid(props){return!lodash_default.a.isNull(props.existingFormData);},handleSubmit:function handleSubmit(values,_ref){var props=_ref.props,resetForm=_ref.resetForm;var initialValues=lodash_default.a.cloneDeep(values);if(props.formType==='policy'){if(values.ownerType==='user'){values.owner={_ref:values.owner._ref||'managed/user/'+values.owner.key};}else{values.owner={_ref:values.owner._id||values.owner._ref};}props.formSchema().forEach(function(item){if(item.isStringified){values[item.id]=JSON.stringify(values[item.id]);}});}else if(props.formType==='policy-scan'){values.policies=values.policies.map(function(policy){return"managed/policy/".concat(policy._id);});if(values.scanType==='ad-hoc'){values.expirationDate=values.expirationDate.format('MM/DD/YYYY');delete values.expirationDuration;}else if(values.scanType==='scheduled'){values.expirationDuration="".concat(values.expirationDuration.unit," ").concat(values.expirationDuration.period);delete values.expirationDate;}// Transform escalationSchedule for backend
values.escalationSchedule.forEach(function(schedule){schedule.interval=schedule.unit;schedule.intervalType=schedule.period;if(schedule.escalationType==='manager'){schedule.escalationId='';}else if(schedule.escalationType==='authzGroup'){schedule.escalationId=schedule.escalationId._id;}else if(schedule.escalationType==='user'){schedule.escalationId=schedule.escalationId.key;}delete schedule.unit;delete schedule.period;});}props.onSubmit(values).then(function(response){if(values.scanType==='ad-hoc'){resetForm();props.handleClose();}else{resetForm(initialValues);}});},validationSchema:function validationSchema(props){return yup_es["object"]().shape(props.formSchema().reduce(createYupSchema,{}));},displayName:'NewPolicy'})(CreateForms_FormBody);var NewPolicy_mapStateToProps=function mapStateToProps(state){var async_fields=state.async_fields;return async_fields;};/* harmony default export */ var NewPolicy = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(NewPolicy_mapStateToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(CreateForms_styles),Object(withWidth["a" /* default */])())(NewPolicyForm));
// CONCATENATED MODULE: ./src/components/presentational/CreateForms/NewUserCert.js
function NewUserCert_createForOfIteratorHelper(o,allowArrayLike){var it;if(typeof Symbol==="undefined"||o[Symbol.iterator]==null){if(Array.isArray(o)||(it=NewUserCert_unsupportedIterableToArray(o))||allowArrayLike&&o&&typeof o.length==="number"){if(it)o=it;var i=0;var F=function F(){};return{s:F,n:function n(){if(i>=o.length)return{done:true};return{done:false,value:o[i++]};},e:function e(_e){throw _e;},f:F};}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}var normalCompletion=true,didErr=false,err;return{s:function s(){it=o[Symbol.iterator]();},n:function n(){var step=it.next();normalCompletion=step.done;return step;},e:function e(_e2){didErr=true;err=_e2;},f:function f(){try{if(!normalCompletion&&it.return!=null)it.return();}finally{if(didErr)throw err;}}};}function NewUserCert_unsupportedIterableToArray(o,minLen){if(!o)return;if(typeof o==="string")return NewUserCert_arrayLikeToArray(o,minLen);var n=Object.prototype.toString.call(o).slice(8,-1);if(n==="Object"&&o.constructor)n=o.constructor.name;if(n==="Map"||n==="Set")return Array.from(o);if(n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return NewUserCert_arrayLikeToArray(o,minLen);}function NewUserCert_arrayLikeToArray(arr,len){if(len==null||len>arr.length)len=arr.length;for(var i=0,arr2=new Array(len);i<len;i++){arr2[i]=arr[i];}return arr2;}/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */ /*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var NewUserCertForm=Object(formik_esm["c" /* withFormik */])({mapPropsToValues:function mapPropsToValues(props){var formFields={};var existingFormData=lodash_default.a.cloneDeep(props.existingFormData);props.formSchema().forEach(function(item){if(item.id==='certObjectType'){formFields[item.id]=props.formType==='user-cert'?'user':'object';}else if(existingFormData&&existingFormData[item.id]){if(item.id==='stages'){var formStages=existingFormData.stages.map(function(stage){var newStage=lodash_default.a.cloneDeep(stage);var _newStage$deadline$sp=newStage.deadline.split(' '),_newStage$deadline$sp2=Object(slicedToArray["a" /* default */])(_newStage$deadline$sp,2),unit=_newStage$deadline$sp2[0],period=_newStage$deadline$sp2[1];newStage.deadlineDuration={unit:unit,period:period};newStage.deadline=null;newStage.useRiskLevel=stage.riskLevelFilter.length>0;newStage.riskLevel={Low:false,Medium:false,High:false};newStage.riskLevelFilter.forEach(function(level){return newStage.riskLevel[level]=true;});delete newStage.riskLevelFilter;var attributes=newStage.entitlementFilter.attributes;var filterKeys=Object.keys(attributes);for(var _i=0,_filterKeys=filterKeys;_i<_filterKeys.length;_i++){var key=_filterKeys[_i];if(stage.entitlementFilter.attributes[key].targetFilter){(function(){var targetFilter=[];var boolOperators=[];stage.entitlementFilter.attributes[key].targetFilter.forEach(function(filter,idx){if(idx%2===0){targetFilter.push(filter);}else{boolOperators.push(filter);}});newStage.entitlementFilter.attributes[key].targetFilter=targetFilter;newStage.entitlementFilter.attributes[key].boolOperators=boolOperators;})();}}newStage.escalationSchedule=newStage.escalationSchedule.map(function(escalation){return{unit:escalation.interval,period:escalation.intervalType,escalationType:escalation.escalationType,escalationId:escalation.escalationId};});return newStage;});formFields.stages=formStages;}else if(item.id==='frequency'){formFields[item.id]=existingFormData[item.id].toLowerCase();}else if(item.isStringified&&lodash_default.a.isString(props.existingFormData[item.id])){formFields[item.id]=JSON.parse(props.existingFormData[item.id]);}else{formFields[item.id]=existingFormData[item.id];}}else if(item.id==='targetObjectType'){formFields[item.id]=existingFormData?existingFormData.certObjectType:'';}else if(lodash_default.a.isNull(item.value)){formFields[item.id]=item.value;}else{formFields[item.id]=item.value||'';}});if(formFields.certObjectType==='user'){formFields.targetObjectType='user';}return formFields;},enableReinitialize:true,isInitialValid:function isInitialValid(props){return!lodash_default.a.isNull(props.existingFormData);},handleSubmit:function handleSubmit(values,_ref){var props=_ref.props,resetForm=_ref.resetForm;var initialValues=lodash_default.a.cloneDeep(values);values.certObjectType=values.targetObjectType;delete values.targetObjectType;if(values.frequency==='ad-hoc'){delete values.schedule;delete values.expression;}else if(values.frequency==='event-based'){delete values.schedule;values.expression=JSON.stringify(values.expression);}if(values.defaultCertifierType==='none'){delete values.defaultCertifierType;delete values.defaultCertifierName;}else{values.defaultCertifierName=values.defaultCertifierType==='user'?values.defaultCertifierName.userName||values.defaultCertifierName.displayName:values.defaultCertifierName._id;}var _iterator=NewUserCert_createForOfIteratorHelper(values.stages),_step;try{var _loop=function _loop(){var stage=_step.value;if(values.frequency==='ad-hoc'){delete stage.deadlineDuration;stage.deadline=stage.deadline.format();}else{stage.deadline="".concat(stage.deadlineDuration.unit," ").concat(stage.deadlineDuration.period);delete stage.deadlineDuration;}if(stage.certifierType==='user'){stage.certifierName=stage.certifierName.userName||stage.certifierName.displayName;}else if(stage.certifierType!=='manager'){stage.certifierName=stage.certifierName._id;}// Build riskLevel array
var riskLevel=[];lodash_default.a.keys(stage.riskLevel).forEach(function(level){if(stage.useRiskLevel&&stage.riskLevel[level]){riskLevel.push(level);}});stage.riskLevelFilter=riskLevel;delete stage.riskLevel;delete stage.useRiskLevel;// Transform entitlementFilter for backend
stage.entitlementFilter=findSelectedEntitlements(stage.entitlementFilter);// Transform escalationSchedule for backend
stage.escalationSchedule.forEach(function(schedule){schedule.interval=schedule.unit;schedule.intervalType=schedule.period;delete schedule.unit;delete schedule.period;schedule.escalationId=schedule.escalationId.key||schedule.escalationId._id;});};for(_iterator.s();!(_step=_iterator.n()).done;){_loop();}}catch(err){_iterator.e(err);}finally{_iterator.f();}props.onSubmit(values).then(function(response){if(values.frequency==='ad-hoc'){resetForm();props.handleClose();}else{resetForm(initialValues);}});},validationSchema:function validationSchema(props){return yup_es["object"]().shape(props.formSchema().reduce(createYupSchema,{}));},validateOnChange:false,displayName:'New User Certification'})(CreateForms_FormBody);function findSelectedEntitlements(state,selectedEntitlements){var entitlements=selectedEntitlements?selectedEntitlements:{};if(state){var stateKeys=Object.keys(state);for(var _i2=0,_stateKeys=stateKeys;_i2<_stateKeys.length;_i2++){var key=_stateKeys[_i2];if(state[key]['selected']===false){delete state[key];}if(key&&key!=='isOpen'&&key!=='isDisabled'&&key!=='boolOperators'){if(key&&key==='targetFilter'){var joinedTargetFilter=[];for(var i in state[key]){joinedTargetFilter.push(state[key][i]);if(state['boolOperators']&&state['boolOperators'][i]){joinedTargetFilter.push(state['boolOperators'][i]);}}entitlements[key]=joinedTargetFilter;}else if(!lodash_default.a.isFinite(key)&&lodash_default.a.isObject(state[key])){entitlements[key]=findSelectedEntitlements(state[key]);if(Object.keys(entitlements[key]).length===0){delete entitlements[key];}}else{if(state[key]){entitlements[key]=state[key];}else{delete entitlements[key];}}}}}return entitlements;}var NewUserCert_mapStateToProps=function mapStateToProps(state){var async_fields=state.async_fields;return async_fields;};/* harmony default export */ var NewUserCert = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(NewUserCert_mapStateToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(CreateForms_styles),Object(withWidth["a" /* default */])())(NewUserCertForm));
// CONCATENATED MODULE: ./src/components/presentational/CreateModal/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var CreateModal_styles_styles=function styles(theme){return{container:{display:'flex',flexWrap:'wrap'},createModalTitle:{boxShadow:'0 2px 10px 0 rgba(0,0,0,.11)'},createModalTitleText:{textAlign:'center',textTransform:'capitalize'},dialog:{minWidth:'400px',overflowY:'visible'},closeButton:{position:'absolute',right:theme.spacing(1),top:theme.spacing(1),color:theme.palette.grey[500]}};};/* harmony default export */ var CreateModal_styles = (CreateModal_styles_styles);
// CONCATENATED MODULE: ./src/components/presentational/CreateModal/CreateModal.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var CreateModal_Transition=react_default.a.forwardRef(function Transition(props,ref){return/*#__PURE__*/react_default.a.createElement(Slide["a" /* default */],Object.assign({direction:"down",ref:ref},props));});var CreateModal_CreateModal=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(CreateModal,_Component);function CreateModal(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,CreateModal);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(CreateModal)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{editObject:null,createdObject:null,updateModalTo:null});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleClose",function(){_this.props.setIsCreateModalOpen(false);_this.setState({editObject:null,createdObject:null});});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleSubmit",function(form){var _this$props=_this.props,createModalMode=_this$props.createModalMode,createModalTarget=_this$props.createModalTarget,createModalType=_this$props.createModalType,createCertification=_this$props.createCertification,createPolicy=_this$props.createPolicy,createPolicyScan=_this$props.createPolicyScan,editCertification=_this$props.editCertification,editPolicy=_this$props.editPolicy,editPolicyScan=_this$props.editPolicyScan;if(createModalType==='policy'){if(createModalMode==='edit'){return editPolicy(form,createModalTarget);}return createPolicy(form).then(function(policy){_this.setState({updateModalTo:'edit',createdObject:policy});return policy;});}if(createModalType==='policy-scan'){if(createModalMode==='edit'){return editPolicyScan(form,createModalTarget);}return createPolicyScan(form).then(function(scan){if(form.scanType==='scheduled'){_this.setState({updateModalTo:'edit',createdObject:form});}return scan;});}if(createModalType==='user-cert'||createModalType==='object-cert'){if(createModalMode==='edit'){return editCertification(form,createModalTarget);}return createCertification(form).then(function(cert){if(form.frequency==='scheduled'){_this.setState({updateModalTo:'edit',createdObject:form});}else{_this.handleClose();}return cert;});}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getModalTitle",function(){var _this$props2=_this.props,t=_this$props2.t,createModalMode=_this$props2.createModalMode,createModalType=_this$props2.createModalType;return t("".concat(createModalMode,"-modal"),{type:createModalType});});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getEditModeTarget",function(){var _this$props3=_this.props,certs=_this$props3.certs,createModalMode=_this$props3.createModalMode,createModalType=_this$props3.createModalType,createModalTarget=_this$props3.createModalTarget,policies=_this$props3.policies;var createdObject=_this.state.createdObject;if(createModalMode!=='edit'){return;}if(createModalType==='policy'||createModalType==='policy-scan'||createModalType==='user-cert'||createModalType==='object-cert'){var _ref=createModalType.indexOf('cert')>-1?certs:policies,results=_ref.results;var editObject=createdObject&&createdObject._id===createModalTarget?createdObject:results.find(function(result){return result._id===createModalTarget;});if(editObject){_this.setState({editObject:editObject});}}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getFormFromModalType",function(){var createModalType=_this.props.createModalType;var schema=null;if(createModalType==='policy'||createModalType==='policy-scan'){schema=createModalType==='policy'?schemas_policyForm:schemas_policyScanForm;return/*#__PURE__*/react_default.a.createElement(NewPolicy,{formType:createModalType,formSchema:schema,handleClose:_this.handleClose,onSubmit:_this.handleSubmit,existingFormData:_this.state.editObject});}if(createModalType==='user-cert'||createModalType==='object-cert'){schema=schemas_userCertForm;return/*#__PURE__*/react_default.a.createElement(NewUserCert,{formType:createModalType,formSchema:schema,handleClose:_this.handleClose,onSubmit:_this.handleSubmit,existingFormData:_this.state.editObject});}return null;});return _this;}Object(createClass["a" /* default */])(CreateModal,[{key:"componentDidUpdate",value:function componentDidUpdate(prevProps,prevState){var _this$props4=this.props,changeCreateModalType=_this$props4.changeCreateModalType,createModalMode=_this$props4.createModalMode,createModalType=_this$props4.createModalType,createModalTarget=_this$props4.createModalTarget;var _this$state=this.state,editObject=_this$state.editObject,createdObject=_this$state.createdObject,updateModalTo=_this$state.updateModalTo;if(updateModalTo&&createdObject){var newTarget=createdObject._id;changeCreateModalType(createModalType,updateModalTo,newTarget);}else if(createModalMode==='edit'&&(lodash_default.a.isNull(editObject)||editObject&&editObject._id!==createModalTarget)){this.getEditModeTarget();}else if(createModalMode==='create'&&lodash_default.a.isObject(this.state.editObject)){this.setState({editObject:null});}}},{key:"componentWillUnmount",value:function componentWillUnmount(){this.setState({editObject:null});}},{key:"render",value:function render(){var _this$props5=this.props,t=_this$props5.t,classes=_this$props5.classes,isCreateModalOpen=_this$props5.isCreateModalOpen;var modalTitle=this.getModalTitle();return/*#__PURE__*/react_default.a.createElement(Dialog["a" /* default */],{maxWidth:"lg",fullScreen:true,disableEscapeKeyDown:true,TransitionComponent:CreateModal_Transition,scroll:"paper",PaperProps:{className:'appBarShift'},onClose:this.handleClose,open:isCreateModalOpen,"aria-labelledby":"create-modal-title"},/*#__PURE__*/react_default.a.createElement(DialogTitle["a" /* default */],{className:classes.createModalTitle,id:"create-modal-title",disableTypography:true},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.createModalTitleText,variant:"h6"},modalTitle),/*#__PURE__*/react_default.a.createElement(IconButton["a" /* default */],{"aria-label":t('label-close'),className:classes.closeButton,onClick:this.handleClose},/*#__PURE__*/react_default.a.createElement(Close_default.a,null))),this.getFormFromModalType());}}]);return CreateModal;}(react["Component"]);var CreateModal_mapStateToProps=function mapStateToProps(state){var certs=state.certs,policies=state.policies,_state$generic=state.generic,isCreateModalOpen=_state$generic.isCreateModalOpen,createModalType=_state$generic.createModalType,createModalMode=_state$generic.createModalMode,createModalTarget=_state$generic.createModalTarget;return{certs:certs,policies:policies,isCreateModalOpen:isCreateModalOpen,createModalType:createModalType,createModalMode:createModalMode,createModalTarget:createModalTarget};};var CreateModal_mapDispatchToProps={changeCreateModalType:generic_actions_changeCreateModalType,setIsCreateModalOpen:generic_actions_setIsCreateModalOpen,createCertification:certs_actions_createCertification,editCertification:certs_actions_editCertification,createPolicy:policies_actions_createPolicy,createPolicyScan:policies_actions_createPolicyScan,editPolicy:policies_actions_editPolicy,editPolicyScan:policies_actions_editPolicyScan};/* harmony default export */ var presentational_CreateModal_CreateModal = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(CreateModal_mapStateToProps,CreateModal_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(CreateModal_styles))(CreateModal_CreateModal));
// CONCATENATED MODULE: ./src/components/presentational/CreateModal/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var presentational_CreateModal = (presentational_CreateModal_CreateModal);
// CONCATENATED MODULE: ./src/components/presentational/Frame/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var Frame_styles = (function(theme){return{iframe:{position:'absolute',top:'0',bottom:'0',left:'0',right:'0',width:'100%',height:'100%',border:'none',margin:'0',// nav bar up top height
'padding-top':navBarHeight,'padding-bottom':'0','padding-right':'0','padding-left':'0',transition:muiBaseTheme.transitions.create('padding-left',{easing:muiBaseTheme.transitions.easing.easeOut,duration:muiBaseTheme.transitions.duration.enteringScreen})},open:{// drawer width
'padding-left':drawerWidth}};});
// CONCATENATED MODULE: ./src/components/presentational/Frame/Frame.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var Frame_Frame=/*#__PURE__*/function(_React$Component){Object(inherits["a" /* default */])(Frame,_React$Component);function Frame(){Object(classCallCheck["a" /* default */])(this,Frame);return Object(possibleConstructorReturn["a" /* default */])(this,Object(getPrototypeOf["a" /* default */])(Frame).apply(this,arguments));}Object(createClass["a" /* default */])(Frame,[{key:"render",value:function render(){var _clsx;return/*#__PURE__*/react_default.a.createElement("iframe",{title:this.props.title,src:this.props.url,className:Object(clsx_m["a" /* default */])((_clsx={},Object(defineProperty["a" /* default */])(_clsx,this.props.classes['iframe'],true),Object(defineProperty["a" /* default */])(_clsx,this.props.classes['open'],this.props.isDrawerOpen),_clsx))// sandbox the iframe for maximum security, only turning on the things we know we need for full functionality
,sandbox:'allow-same-origin allow-scripts'});}}]);return Frame;}(react_default.a.Component);var Frame_mapStateToProps=function mapStateToProps(state){var isDrawerOpen=state.generic.isDrawerOpen;return{isDrawerOpen:isDrawerOpen};};var Frame_mapDispatchToProps={};/* harmony default export */ var presentational_Frame_Frame = (Object(es["b" /* connect */])(Frame_mapStateToProps,Frame_mapDispatchToProps)(Object(withStyles["a" /* default */])(Frame_styles)(Frame_Frame)));
// CONCATENATED MODULE: ./src/components/presentational/Frame/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var presentational_Frame = (presentational_Frame_Frame);
// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/styles/withTheme.js + 1 modules
var withTheme = __webpack_require__(546);

// CONCATENATED MODULE: ./src/components/containers/AdminDashboard/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var AdminDashboard_styles_styles=function styles(theme){return{loadingGrid:{marginTop:'24px'},card:{boxShadow:'0 1px 2px 0 rgba(0, 0, 0, 0.05)'},cardRow:{display:'flex',flexDirection:'row',justifyContent:'space-evenly'},dashboardGrid:{marginTop:'20px'},dashboardRow:{justifyContent:'center'},footerGrid:{height:'100%',justifyContent:'flex-end',alignItems:'flex-end'},footerText:{fontSize:'.72rem',textAlign:'right'},noDataText:{paddingTop:'15px',paddingLeft:'15px'},selectFullWidth:{width:'100%'},smallBox:{width:'200px',height:'200px'},tableCard:{},tableFooter:{height:'100%'},pieCol:{maxWidth:'450px'},tableCol:{minWidth:'450px'},tableRow:{cursor:'pointer'}};};/* harmony default export */ var AdminDashboard_styles = (AdminDashboard_styles_styles);
// EXTERNAL MODULE: ./node_modules/react-c3js/react-c3js.js
var react_c3js = __webpack_require__(224);
var react_c3js_default = /*#__PURE__*/__webpack_require__.n(react_c3js);

// CONCATENATED MODULE: ./src/store/actions/admin_dashboard.actions.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var admin_dashboard_actions_getDashboard=function getDashboard(){return function(dispatch,getState){dispatch({type:ADMIN_DASHBOARD.QUERY_DASHBOARD,payload:null});var certEndpoint=utils_constants.IDM_CONTEXT.concat('/governance/adminDashboard');var params={};return httpService.request({url:certEndpoint,method:'get',params:params}).then(function(_ref){var data=_ref.data;dispatch({type:ADMIN_DASHBOARD.QUERY_DASHBOARD_SUCCESS,payload:data});}).catch(function(error){dispatch({type:ADMIN_DASHBOARD.QUERY_DASHBOARD_FAILURE,payload:null});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var admin_dashboard_actions_getSingleDashboardStat=function getSingleDashboardStat(adminProps,stat,page){return function(dispatch,getState){var results=lodash_default.a.cloneDeep(adminProps.results);dispatch({type:ADMIN_DASHBOARD.QUERY_DASHBOARD_SINGLE,payload:null});var certEndpoint=utils_constants.IDM_CONTEXT.concat('/governance/adminDashboard/',stat);var params={pageNumber:page+1};return httpService.request({url:certEndpoint,method:'get',params:params}).then(function(_ref2){var data=_ref2.data;var indexToUpdate=lodash_default.a.findIndex(results,['label',stat]);results[indexToUpdate]=data.result;dispatch({type:ADMIN_DASHBOARD.QUERY_DASHBOARD_SINGLE_SUCCESS,payload:results});}).catch(function(error){dispatch({type:ADMIN_DASHBOARD.QUERY_DASHBOARD_SINGLE_FAILURE,payload:null});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var admin_dashboard_actions_getStoredEntitlement=function getStoredEntitlement(id){return function(dispatch,getState){if(!id){dispatch({type:ADMIN_DASHBOARD.QUERY_ENTITLEMENT_SUCCESS,payload:null});return;}dispatch({type:ADMIN_DASHBOARD.QUERY_ENTITLEMENT,payload:null});var certEndpoint=utils_constants.IDM_CONTEXT.concat('/governance/userEventData/object');var params={targetId:id};return httpService.request({url:certEndpoint,method:'get',params:params}).then(function(_ref3){var data=_ref3.data;dispatch({type:ADMIN_DASHBOARD.QUERY_ENTITLEMENT_SUCCESS,payload:data});}).catch(function(error){dispatch({type:ADMIN_DASHBOARD.QUERY_ENTITLEMENT_FAILURE,payload:null});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var admin_dashboard_actions_getStoredPolicy=function getStoredPolicy(id){return function(dispatch,getState){if(!id){dispatch({type:ADMIN_DASHBOARD.QUERY_POLICY_SUCCESS,payload:null});return;}dispatch({type:ADMIN_DASHBOARD.QUERY_POLICY,payload:null});var certEndpoint=utils_constants.IDM_CONTEXT.concat('/governance/adminDashboard');var params={action:'getPolicyTotals',id:id};return httpService.request({url:certEndpoint,method:'get',params:params}).then(function(_ref4){var data=_ref4.data;dispatch({type:ADMIN_DASHBOARD.QUERY_POLICY_SUCCESS,payload:data});}).catch(function(error){dispatch({type:ADMIN_DASHBOARD.QUERY_POLICY_FAILURE,payload:null});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};
// CONCATENATED MODULE: ./src/components/containers/AdminDashboard/AdminDashboard.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var AdminDashboard_AdminDashboard=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(AdminDashboard,_Component);function AdminDashboard(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,AdminDashboard);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(AdminDashboard)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"_isMounted",false);Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{tableCols:[],tableData:[],modalObject:null,pageNums:{},paginatedStat:null});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getDashboard",function(){_this.props.getDashboard();});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getTableHeaders",function(tableType){var t=_this.props.t;switch(tableType){case'certification':case'objectCertification':case'userCertification':return[t('header-name'),t('header-deadline')];case'violation':return[t('header-name'),t('header-policy'),t('header-deadline')];case'entitlementsCertified':case'entitlementsRevoked':return[t('header-entitlement'),t('header-percentage')];case'policy':return[t('header-policy'),t('header-total-violations')];default:return[];}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getTableColumnKeys",function(tableType){switch(tableType){case'certification':case'objectCertification':case'userCertification':return[{key:'name',type:'string'},{key:'nextDeadline',type:'date'}];case'violation':return[{key:'target',type:'string'},{key:'policyName',type:'string'},{key:'expirationDate',type:'date'}];case'entitlementsCertified':return[{key:'displayName',type:'string'},{key:'certifyPercentage',type:'string'}];case'entitlementsRevoked':return[{key:'displayName',type:'string'},{key:'revokePercentage',type:'string'}];case'policy':return[{key:'name',type:'string'},{key:'violations',type:'string'}];default:return[];}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"openDialogModal",function(dataType,modalObject){dataType=_this.convertTypeToBackendObject(dataType);if(!dataType){return;}_this.props.getModalObject(dataType,modalObject._id);_this.props.changeDialogType(dataType);_this.props.changeActiveGovernanceDialog('AdminDashboardDialog');});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"convertTypeToBackendObject",function(dataType){switch(dataType){case'entitlementsCertified':case'entitlementsRevoked':return'glossary';case'userCertification':case'objectCertification':case'certification':case'violation':return dataType;default:return null;}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"onClickNavigationLink",function(path){_this.props.history.push(path);});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"onSelectStoredItem",function(e,target,value){if(value&&value.key){if(target==='certificationTotals'){_this.props.getStoredEntitlement(value.key);}else if(target==='policyTotals'){_this.props.getStoredPolicy('managed/policy/'+value.key);}}else{if(target==='certificationTotals'){_this.props.getStoredEntitlement(null);}else if(target==='policyTotals'){_this.props.getStoredPolicy(null);}}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getStoredItem",function(type){var admin_dashboard=_this.props.admin_dashboard;var storedEntitlement=admin_dashboard.storedEntitlement,storedPolicy=admin_dashboard.storedPolicy;switch(type){case'certificationTotals':return storedEntitlement;case'policyTotals':return storedPolicy;default:return null;}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getColorsForColumns",function(columns){var colors={};var idx=0;lodash_default.a.forEach(columns,function(column){if(idx<utils_constants.CHART_COLORS.length){colors[column[0]]=utils_constants.CHART_COLORS[idx];}idx++;});return colors;});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getDonutData",function(stat,dataType,isStored){var t=_this.props.t;var columns=[];var categories=null;if(dataType==='certificationTotals'){categories=utils_constants.ENTITLEMENT_CHART_CATEGORIES;}else if(dataType==='policyTotals'){categories=utils_constants.POLICY_CHART_CATEGORIES;}if(isStored){lodash_default.a.forEach(categories,function(category){columns.push([category,stat[category]]);});}else{lodash_default.a.forEach(stat.value,function(entry){if(entry.value>0){columns.push([entry.key,entry.value]);}});}return{columns:columns,type:'donut',size:{height:'10px',width:'10px'},colors:_this.getColorsForColumns(columns),empty:{label:{text:t('no-data')}}};});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"onPaginationChange",function(evt,page,stat){if(lodash_default.a.isNumber(page)){// Page number changed
var pageNums=lodash_default.a.cloneDeep(_this.state.pageNums);pageNums[stat]=page;_this.props.getSingleDashboardStat(Object(objectSpread["a" /* default */])({},_this.props.admin_dashboard),stat,pageNums[stat]);_this.setState({pageNums:pageNums,paginatedStat:stat});}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getLastUpdatedTime",function(){var admin_dashboard=_this.props.admin_dashboard;var results=admin_dashboard.results;var stats=lodash_default.a.cloneDeep(results);stats=lodash_default.a.sortBy(stats,'lastUpdated');var lastUpdated=null;if(stats&&stats.length>0){lastUpdated=stats[0].lastUpdated;}return lastUpdated;});return _this;}Object(createClass["a" /* default */])(AdminDashboard,[{key:"componentDidMount",value:function componentDidMount(){this._isMounted=true;this.getDashboard();}},{key:"componentDidUpdate",value:function componentDidUpdate(prevProps){var admin_dashboard=this.props.admin_dashboard;var querying=admin_dashboard.querying,results=admin_dashboard.results;if(prevProps.admin_dashboard.querying&&!querying){var pageNums=lodash_default.a.cloneDeep(this.state.pageNums);var isChanged=false;lodash_default.a.forEach(results,function(stat){if(stat.displayType==='table'&&!pageNums[stat.label]){pageNums[stat.label]=0;isChanged=true;}});if(isChanged){this.setState({pageNums:pageNums});}}}},{key:"componentWillUnmount",value:function componentWillUnmount(){this._isMounted=false;}},{key:"render",value:function render(){var _this2=this;var _this$props=this.props,t=_this$props.t,classes=_this$props.classes,admin_dashboard=_this$props.admin_dashboard,generic=_this$props.generic;var results=admin_dashboard.results,querying=admin_dashboard.querying,queryingSingle=admin_dashboard.queryingSingle;var modalObject=generic.modalObject,queryingModalObject=generic.queryingModalObject;var paginatedStat=this.state.paginatedStat;return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(presentational_PageTitle,{title:t('admin-dashboard')}),querying?/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.loadingGrid},/*#__PURE__*/react_default.a.createElement(presentational_LoadingIndicator,null)):/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.dashboardGrid},/*#__PURE__*/react_default.a.createElement(index_es["b" /* Grid */].Row,{cards:true,className:classes.dashboardRow},results&&results.map(function(stat){return stat.displayType==='statCard'?/*#__PURE__*/react_default.a.createElement(index_es["b" /* Grid */].Col,{key:stat.label},/*#__PURE__*/react_default.a.createElement(index_es["c" /* StatsCard */],{layout:1,movement:parseInt(stat.change),total:stat.value,label:t(stat.label)})):null;})),/*#__PURE__*/react_default.a.createElement(index_es["b" /* Grid */].Row,{cards:true,deck:true,className:classes.dashboardRow},results&&results.map(function(stat){return stat.displayType==='table'?/*#__PURE__*/react_default.a.createElement(index_es["b" /* Grid */].Col,{key:stat.label,className:classes.tableCol},/*#__PURE__*/react_default.a.createElement(index_es["a" /* Card */],{className:classes.tableCard,title:t(stat.label)},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */],null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Header,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,null,_this2.getTableHeaders(stat.dataType).map(function(header){return/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,{key:header},header);}))),stat.value.length===0?/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Body,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,t('no-data')))):/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Body,null,queryingSingle&&paginatedStat===stat.label?/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{colSpan:_this2.getTableHeaders(stat.dataType).length},/*#__PURE__*/react_default.a.createElement(LinearProgress["a" /* default */],null))):null,stat.value.map(function(row){return/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{className:Object(clsx_m["a" /* default */])(stat.dataType!=='policy'&&classes.tableRow),key:Object(v4["a" /* default */])(),onClick:function onClick(){return _this2.openDialogModal(stat.dataType,row);}},_this2.getTableColumnKeys(stat.dataType).map(function(columnKey){return/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{key:Object(v4["a" /* default */])()},columnKey['type']==='date'?moment_default()(row[columnKey['key']]).format('L'):row[columnKey['key']]);}));}))),/*#__PURE__*/react_default.a.createElement(index_es["a" /* Card */].Footer,{className:classes.tableFooter},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.footerGrid},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(TablePagination["a" /* default */],{className:classes.tablePagination,component:"div",count:-1,labelDisplayedRows:function labelDisplayedRows(_ref){var from=_ref.from,to=_ref.to,count=_ref.count;return t('displaying')+' '+"".concat(from,"-").concat(to);},rowsPerPage:5,rowsPerPageOptions:[5],stat:stat.label,page:_this2.state.pageNums[stat.label]||0,backIconButtonProps:{'aria-label':t('paging-prev'),'disabled':_this2.state.pageNums[stat.label]===0},nextIconButtonProps:{'aria-label':t('paging-next'),'disabled':stat.value.length===0},onChangePage:function onChangePage(evt,page){return _this2.onPaginationChange(evt,page,stat.label);},onChangeRowsPerPage:function onChangeRowsPerPage(evt,page){return _this2.onPaginationChange(evt,page,stat.label);}})))))):null;})),/*#__PURE__*/react_default.a.createElement(index_es["b" /* Grid */].Row,{cards:true,deck:true,className:classes.dashboardRow},results&&results.map(function(stat){return stat.displayType==='pie'?/*#__PURE__*/react_default.a.createElement(index_es["b" /* Grid */].Col,{key:stat.label,className:classes.pieCol},/*#__PURE__*/react_default.a.createElement(index_es["a" /* Card */],null,/*#__PURE__*/react_default.a.createElement(index_es["a" /* Card */].Header,null,/*#__PURE__*/react_default.a.createElement(index_es["a" /* Card */].Title,null,t(stat.label))),/*#__PURE__*/react_default.a.createElement(index_es["a" /* Card */].Body,null,/*#__PURE__*/react_default.a.createElement(presentational_AsyncSelect_AsyncSelect,{name:stat.dataType,targetType:stat.dataType,fullWidth:true,label:t('choose-'+stat.dataType),variant:"outlined",onChange:_this2.onSelectStoredItem}),_this2.getStoredItem(stat.dataType)?/*#__PURE__*/react_default.a.createElement(react_c3js_default.a,{data:_this2.getDonutData(_this2.getStoredItem(stat.dataType),stat.dataType,true)}):/*#__PURE__*/react_default.a.createElement(react_c3js_default.a,{data:_this2.getDonutData(stat,stat.dataType)})))):null;}))),/*#__PURE__*/react_default.a.createElement(presentational_GovernanceDialog,{dialogId:"AdminDashboardDialog",modalObject:modalObject,queryingModalObject:queryingModalObject,onSubmitDialog:this.onClickNavigationLink}));}}]);return AdminDashboard;}(react["Component"]);var AdminDashboard_mapStateToProps=function mapStateToProps(state){var admin_dashboard=state.admin_dashboard,generic=state.generic;return{admin_dashboard:admin_dashboard,generic:generic};};var AdminDashboard_mapDispatchToProps={getDashboard:admin_dashboard_actions_getDashboard,getSingleDashboardStat:admin_dashboard_actions_getSingleDashboardStat,getStoredEntitlement:admin_dashboard_actions_getStoredEntitlement,getStoredPolicy:admin_dashboard_actions_getStoredPolicy,getModalObject:generic_actions_getModalObject,changeActiveGovernanceDialog:generic_actions_changeActiveGovernanceDialog,changeDialogType:generic_actions_changeDialogType};/* harmony default export */ var containers_AdminDashboard_AdminDashboard = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(AdminDashboard_mapStateToProps,AdminDashboard_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(AdminDashboard_styles),withTheme["a" /* default */])(AdminDashboard_AdminDashboard));
// CONCATENATED MODULE: ./src/components/containers/AdminDashboard/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var containers_AdminDashboard = (containers_AdminDashboard_AdminDashboard);
// CONCATENATED MODULE: ./src/components/containers/Certifications/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var Certifications_styles_styles=function styles(theme){return{container:{marginTop:theme.spacing()},formControl:{display:'flex',marginTop:theme.spacing()},formGroup:{display:'flex',justifyContent:'space-evenly'},statusButton:{'&.selected':{backgroundColor:theme.palette.secondary.main,color:theme.palette.secondary.contrastText},'&.hover':{backgroundColor:theme.palette.secondary.main,color:theme.palette.secondary.contrastText}},buttonContainer:{borderBottom:'1px solid rgba(224, 224, 224, 1)',marginBottom:'15px'},certStatusButton:{width:'max-content',color:theme.palette.forgerock.darkGray,backgroundColor:'#fafafa',boxShadow:'none',borderColor:theme.palette.forgerock.blue,borderRadius:'0px',border:'0px','&.selected':{color:theme.palette.forgerock.blue,borderBottom:'3px solid'},'&:hover':{backgroundColor:theme.palette.forgerock.lightGray,boxShadow:'none'}},searchFilter:{marginBottom:theme.spacing()},textField:{marginLeft:theme.spacing(),marginRight:theme.spacing(),minWidth:200}};};/* harmony default export */ var Certifications_styles = (Certifications_styles_styles);
// CONCATENATED MODULE: ./src/components/containers/Certifications/Certifications.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var Certifications_Certifications=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(Certifications,_Component);function Certifications(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,Certifications);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(Certifications)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"_isMounted",false);Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{newButtonText:"".concat(_this.props.match.params.type,"-cert"),bulkActions:['cancel-cert'],tableCols:[],tableData:[]});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"setTableColsForStatus",function(status,type){var tableCols=[];var bulkActions=[];if(status===utils_constants.CERT_STATUS.ACTIVE){tableCols=[{'header':'Campaign Name','key':'name'},{'header':'Campaign Start Date','key':'startDate','type':'date'},{'header':'Next Deadline','key':'nextDeadline','type':'date'},{'header':'Progress','key':'progress','type':'linear','noSort':true}];}else if(status===utils_constants.CERT_STATUS.CLOSED){tableCols=[{'header':'Campaign Name','key':'name'},{'header':'Start Date','key':'startDate','type':'date'},{'header':'Completed On','key':'completionDate','type':'date'},{'header':'Total Events','key':'totalEventsComplete','noSort':true}];}else if(status===utils_constants.CERT_STATUS.SCHEDULED){tableCols=[{'header':'Campaign Name','key':'name'},{'header':'Next Run Date','key':'nextRunDate','type':'date'}];}else if(status===utils_constants.CERT_STATUS.TRIGGERED){tableCols=[{'header':'Campaign Name','key':'name'},{'header':'Description','key':'description'}];}if(type&&type==='object'){tableCols.splice(1,0,{'header':'Object Type','key':'certObjectType'});}if(status!==utils_constants.CERT_STATUS.CLOSED){bulkActions=['cancel-cert'];}_this.setState({bulkActions:bulkActions,tableCols:tableCols});});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"changeSelectedStatus",function(status){var type=_this.props.match.params.type;_this.props.updatePagination(Object(objectSpread["a" /* default */])({},_this.props.certs,{pageNumber:1,status:status}));_this.setTableColsForStatus(status,type);_this.props.changeSearchKey(null,utils_constants.DO_NOT_UPDATE);_this.props.changeSortKey('name',!utils_constants.IS_DESC,utils_constants.DO_NOT_UPDATE);});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"onPaginationChange",function(evt,page){if(evt.q!=null){_this.props.changeSearchKey(evt.q);}else if(evt.sortBy){// Sorting key changed
var isDesc=evt.sortBy===_this.props.certs.sortBy&&_this.props.certs.sortDir==='asc';_this.props.changeSortKey(evt.sortBy,isDesc);}else if(evt.target&&evt.target.value){// Rows per page changed
_this.props.updatePagination(Object(objectSpread["a" /* default */])({},_this.props.certs,{pageNumber:1,pageSize:evt.target.value}));}else if(lodash_default.a.isNumber(page)){// Page number changed
_this.props.updatePagination(Object(objectSpread["a" /* default */])({},_this.props.certs,{pageNumber:page+1}));}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleActions",function(actionType,selectedRows){if(actionType==='cancel-cert'){_this.props.updateTakingAction(true);_this.props.changeDialogType('actionSubmitting');_this.props.changeActiveGovernanceDialog('GovernanceTableDialog');_this.props.cancelCertifications(selectedRows).finally(function(){_this.props.updateTakingAction(false);_this.props.changeDialogType(null);_this.props.changeActiveGovernanceDialog(null);});}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleRowClick",function(evt,selectedRow){var _this$props=_this.props,certs=_this$props.certs,changeCreateModalType=_this$props.changeCreateModalType,setIsCreateModalOpen=_this$props.setIsCreateModalOpen;var newButtonText=_this.state.newButtonText;if(certs.status==='scheduled'||certs.status==='triggered'){// newButtonText will be 'user-cert' or 'object-cert'
changeCreateModalType(newButtonText,'edit',selectedRow);setIsCreateModalOpen(true);}else{_this.props.history.push('/adminCertList/'+_this.props.certs.type+'/'+selectedRow);}});return _this;}Object(createClass["a" /* default */])(Certifications,[{key:"componentDidMount",value:function componentDidMount(){this._isMounted=true;if(this.props.location.pathname.includes(utils_constants.TASKS[0])){this.props.changeCertType(utils_constants.TASKS[0],utils_constants.DO_NOT_UPDATE);this.setTableColsForStatus(this.props.certs.status,utils_constants.TASKS[0]);}else{this.props.changeCertType(utils_constants.TASKS[1],utils_constants.DO_NOT_UPDATE);this.setTableColsForStatus(this.props.certs.status,utils_constants.TASKS[1]);}this.props.getCertifications();}},{key:"componentDidUpdate",value:function componentDidUpdate(prevProps){var type=this.props.match.params.type;if(type!==this.props.certs.type){this.setState({newButtonText:"".concat(type,"-cert")});this.props.changeCertType(type,utils_constants.DO_NOT_UPDATE);this.setTableColsForStatus(utils_constants.CERT_STATUSES[0],type);this.props.updatePagination({status:utils_constants.CERT_STATUSES[0],pageNumber:1,sortBy:'name',sortDir:'asc',pageSize:this.props.certs.pageSize},utils_constants.DO_NOT_UPDATE);this.props.changeSearchKey(null);}}},{key:"componentWillUnmount",value:function componentWillUnmount(){this._isMounted=false;this.props.changeSearchKey(null,utils_constants.DO_NOT_UPDATE);this.props.changeCertType(null,utils_constants.DO_NOT_UPDATE);this.props.updatePagination({status:utils_constants.CERT_STATUSES[0],pageNumber:1,sortBy:'name',sortDir:'asc',pageSize:this.props.certs.pageSize},utils_constants.DO_NOT_UPDATE);}},{key:"render",value:function render(){var _this2=this;var _this$props2=this.props,certs=_this$props2.certs,classes=_this$props2.classes,t=_this$props2.t;var pageNumber=certs.pageNumber,pageSize=certs.pageSize,querying=certs.querying,type=certs.type;return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(presentational_PageTitle,{title:t("page-".concat(certs.type,"-certs"))}),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.buttonContainer,item:true,xs:12},/*#__PURE__*/react_default.a.createElement(ButtonGroup["a" /* default */],{color:"default",fullWidth:true,"aria-label":"full width outlined button group"},utils_constants.CERT_STATUSES.map(function(status){return/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{key:status,className:Object(clsx_m["a" /* default */])(classes.certStatusButton,{'selected':status===certs.status}),variant:"contained",onClick:function onClick(){return _this2.changeSelectedStatus(status);}},t(status));}))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.container,justify:"center"},/*#__PURE__*/react_default.a.createElement(presentational_GovernanceTable,{tableCols:this.state.tableCols,tableData:this.props.certs.results,sortBy:this.props.certs.sortBy,sortDir:this.props.certs.sortDir,q:this.props.certs.q,bulkActions:this.state.bulkActions,handleActions:this.handleActions,handleRowClick:this.handleRowClick,showNewButton:true,newButtonText:this.state.newButtonText,showCheckboxes:certs.status!==utils_constants.CERT_STATUS.CLOSED,pageSize:pageSize,pagedResultsOffset:pageNumber-1,handlePagination:this.onPaginationChange,querying:querying,tableType:type})));}}]);return Certifications;}(react["Component"]);var Certifications_mapStateToProps=function mapStateToProps(state){var certs=state.certs;return{certs:certs};};var Certifications_mapDispatchToProps={changeCertType:certs_actions_changeCertType,changeSortKey:certs_actions_changeSortKey,changeSearchKey:certs_actions_changeSearchKey,changeCreateModalType:generic_actions_changeCreateModalType,setIsCreateModalOpen:generic_actions_setIsCreateModalOpen,cancelCertifications:certs_actions_cancelCertifications,getCertifications:certs_actions_getCertifications,updatePagination:certs_actions_updatePagination,updateTakingAction:generic_actions_updateTakingAction,changeDialogType:generic_actions_changeDialogType,changeActiveGovernanceDialog:generic_actions_changeActiveGovernanceDialog};/* harmony default export */ var containers_Certifications_Certifications = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(Certifications_mapStateToProps,Certifications_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(Certifications_styles))(Certifications_Certifications));
// CONCATENATED MODULE: ./src/components/containers/Certifications/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var containers_Certifications = (containers_Certifications_Certifications);
// CONCATENATED MODULE: ./src/components/containers/AccessDenied/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var AccessDenied_styles_styles=function styles(theme){return{container:{marginTop:theme.spacing()}};};/* harmony default export */ var AccessDenied_styles = (AccessDenied_styles_styles);
// CONCATENATED MODULE: ./src/components/containers/AccessDenied/AccessDenied.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var AccessDenied_AccessDenied=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(AccessDenied,_Component);function AccessDenied(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,AccessDenied);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(AccessDenied)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{loading:false});return _this;}Object(createClass["a" /* default */])(AccessDenied,[{key:"componentDidMount",value:function componentDidMount(){}},{key:"render",value:function render(){var t=this.props.t;return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(presentational_PageTitle,{title:t('page-internal-user'),subtitle:t('internal-user')}));}}]);return AccessDenied;}(react["Component"]);var AccessDenied_mapStateToProps=function mapStateToProps(state){};var AccessDenied_mapDispatchToProps={};/* harmony default export */ var containers_AccessDenied_AccessDenied = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(AccessDenied_mapStateToProps,AccessDenied_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(AccessDenied_styles))(AccessDenied_AccessDenied));
// CONCATENATED MODULE: ./src/components/containers/AccessDenied/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var containers_AccessDenied = (containers_AccessDenied_AccessDenied);
// CONCATENATED MODULE: ./src/components/containers/Policies/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var Policies_styles_styles=function styles(theme){return{buttonContainer:{borderBottom:'1px solid rgba(224, 224, 224, 1)',marginBottom:'15px'},container:{marginTop:theme.spacing()},policyTab:{width:'max-content',color:theme.palette.forgerock.darkGray,backgroundColor:'#fafafa',boxShadow:'none',borderColor:theme.palette.forgerock.blue,borderRadius:'0px',border:'0px','&.selected':{color:theme.palette.forgerock.blue,borderBottom:'3px solid'},'&:hover':{backgroundColor:theme.palette.forgerock.lightGray,boxShadow:'none'}},policyScanHeader:{marginTop:'15px'}};};/* harmony default export */ var Policies_styles = (Policies_styles_styles);
// CONCATENATED MODULE: ./src/components/containers/Policies/Policies.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var Policies_Policies=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(Policies,_Component);function Policies(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,Policies);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(Policies)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{policyTabs:['policies','policy-scans','violations-active','exceptions-active','violations-history'],newButtonText:'',showNewButton:false,bulkActions:[],altActions:[],tableCols:[],activeScanCols:[{'header':'Name','key':'name'},{'header':'Type','key':'scanType'},{'header':'Progress','key':'progress'}],interval:null});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"changeSelectedTab",function(tab){var type=_this.props.policies.type;_this.props.changePolicyType(tab,!(type===tab));});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"updateTableForPolicyType",function(type){var newButtonText='';var showNewButton=false;var tableTitle='';var tableCols=[];var bulkActions=[];var altActions=[];if(type==='policies'){showNewButton=true;newButtonText='policy';bulkActions=['delete-policy'];tableCols=[{'header':'Name','key':'name'},{'header':'Description','key':'description'}];}else if(type==='policy-scans'){showNewButton=true;newButtonText='policy-scan';altActions=['configure-reactive'];bulkActions=['delete-scan'];tableCols=[{'header':'Name','key':'name'},{'header':'Next Run Date','key':'nextRunDate','type':'date'}];}else if(type==='violations-active'){bulkActions=['cancel-violation','reassign-tasks'];tableCols=[{'header':'User','key':'targetUser','noSort':true},{'header':'Policy','key':'policyName'},{'header':'Owner','key':'owner'},{'header':'Expiration Date','key':'expirationDate','type':'date'}];}else if(type==='exceptions-active'){bulkActions=['cancel-exception'];tableCols=[{'header':'User','key':'targetUser','noSort':true},{'header':'Policy','key':'policyName'},{'header':'Owner','key':'owner'},{'header':'Approver','key':'completedBy'},{'header':'Expiration Date','key':'expirationDate','type':'date'}];}else if(type==='violations-history'){bulkActions=[];tableCols=[{'header':'User','key':'targetUser','noSort':true},{'header':'Policy','key':'policyName'},{'header':'Completed By','key':'completedBy'},{'header':'Completion Date','key':'completionDate','type':'date'},{'header':'Result','key':'status','type':'violationStatus'}];}_this.setState({bulkActions:bulkActions,altActions:altActions,showNewButton:showNewButton,newButtonText:newButtonText,tableTitle:tableTitle,tableCols:tableCols});if(tableCols[0]){_this.props.changeSortKey(tableCols[0].key);}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"onPaginationChange",function(evt,page){if(evt.q!=null){_this.props.changeSearchKey(evt.q);}else if(evt.sortBy){// Sorting key changed
var isDesc=evt.sortBy===_this.props.policies.sortBy&&_this.props.policies.sortDir==='asc';_this.props.changeSortKey(evt.sortBy,isDesc);}else if(evt.target&&evt.target.value){// Rows per page changed
_this.props.updatePagination(Object(objectSpread["a" /* default */])({},_this.props.policies,{pageNumber:1,pageSize:evt.target.value}));}else if(lodash_default.a.isNumber(page)){// Page number changed
_this.props.updatePagination(Object(objectSpread["a" /* default */])({},_this.props.policies,{pageNumber:page+1}));}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleActions",function(actionType,targetData,newOwnerId){_this.props.updateTakingAction(true);_this.props.changeDialogType('actionSubmitting');switch(actionType){case'delete-selected':case'delete-policy':_this.props.deletePolicies(targetData).finally(function(){_this.props.updateTakingAction(false);_this.props.changeDialogType(null);_this.props.changeActiveGovernanceDialog(null);});break;case'delete-scan':_this.props.deleteScans(targetData).finally(function(){_this.props.updateTakingAction(false);_this.props.changeDialogType(null);_this.props.changeActiveGovernanceDialog(null);});break;case'cancel-violation':case'cancel-exception':_this.props.cancelViolations(targetData).finally(function(){_this.props.updateTakingAction(false);_this.props.changeDialogType(null);_this.props.changeActiveGovernanceDialog(null);});break;case'reassign-tasks':_this.props.reassignViolations(targetData,newOwnerId).finally(function(){_this.props.updateTakingAction(false);_this.props.changeDialogType(null);_this.props.changeActiveGovernanceDialog(null);});break;case'configure-reactive':_this.props.configureReactiveScans(targetData).finally(function(){_this.props.updateTakingAction(false);_this.props.changeDialogType(null);_this.props.changeActiveGovernanceDialog(null);});break;}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"openEditModal",function(evt,rowId){var _this$props=_this.props,policies=_this$props.policies,changeCreateModalType=_this$props.changeCreateModalType,setIsCreateModalOpen=_this$props.setIsCreateModalOpen;switch(policies.type){case'policies':changeCreateModalType('policy','edit',rowId);setIsCreateModalOpen(true);break;case'policy-scans':changeCreateModalType('policy-scan','edit',rowId);setIsCreateModalOpen(true);break;default:return;}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"updateTableData",function(){var results=_this.props.policies.results;_this.setState({tableData:results});});return _this;}Object(createClass["a" /* default */])(Policies,[{key:"componentDidMount",value:function componentDidMount(){this._isMounted=true;if(this.props.policies.type){this.updateTableForPolicyType(this.props.policies.type);}}},{key:"componentWillUnmount",value:function componentWillUnmount(){this._isMounted=false;this.props.changePolicyType('policies',utils_constants.DO_NOT_UPDATE);this.props.changeSearchKey(null,utils_constants.DO_NOT_UPDATE);this.props.changeSortKey('name',!utils_constants.IS_DESC,utils_constants.DO_NOT_UPDATE);this.props.updatePagination({pageNumber:1,pageSize:this.props.policies.pageSize},utils_constants.DO_NOT_UPDATE);}},{key:"componentDidUpdate",value:function componentDidUpdate(prevProps){var _this$props$policies=this.props.policies,type=_this$props$policies.type,shouldQueryActiveScans=_this$props$policies.shouldQueryActiveScans;if(!type){this.props.changePolicyType(this.state.policyTabs[0]);}else if(type!==prevProps.policies.type){this.updateTableForPolicyType(type);}if(shouldQueryActiveScans&&!prevProps.policies.shouldQueryActiveScans){var interval=setInterval(this.props.getActivePolicyScans,1500);this.setState({interval:interval});}else if(!shouldQueryActiveScans&&this.state.interval){clearTimeout(this.state.interval);this.setState({interval:null});}}},{key:"render",value:function render(){var _this2=this;var _this$props2=this.props,classes=_this$props2.classes,policies=_this$props2.policies,generic=_this$props2.generic,t=_this$props2.t;var policyTabs=this.state.policyTabs;var modalObject=generic.modalObject,queryingModalObject=generic.queryingModalObject;return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(presentational_PageTitle,{title:t('page-policies')}),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.buttonContainer,item:true,xs:12},/*#__PURE__*/react_default.a.createElement(ButtonGroup["a" /* default */],{color:"default",fullWidth:true,"aria-label":"full width outlined button group"},policyTabs.map(function(tab){return/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{key:tab,className:Object(clsx_m["a" /* default */])(classes.policyTab,{'selected':policies.type===tab}),variant:"contained",onClick:function onClick(){return _this2.changeSelectedTab(tab);}},t(tab));}))),this.state.tableTitle&&/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{variant:"h6",id:"tableTitle"},t(this.state.tableTitle)),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.container,justify:"center"},/*#__PURE__*/react_default.a.createElement(presentational_GovernanceTable,{tableCols:this.state.tableCols,tableData:policies.results,sortBy:policies.sortBy,sortDir:policies.sortDir,q:policies.q,bulkActions:this.state.bulkActions,altActions:this.state.altActions,handleActions:this.handleActions,handleRowClick:this.openEditModal,hideToolbar:this.state.bulkActions.length===0,showNewButton:this.state.showNewButton,newButtonText:this.state.newButtonText,showCheckboxes:true,pageSize:policies.pageSize,pagedResultsOffset:policies.pageNumber-1,totalPagedResults:policies.totalPagedResults,handlePagination:this.onPaginationChange,querying:policies.querying,getModalObject:this.props.getModalObject,queryingModalObject:queryingModalObject,modalObject:modalObject,tableType:policies.type})),policies.type==='policy-scans'&&/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.policyScanHeader,variant:"h6",id:"tableTitle"},t('policy-scan-active')),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.container,justify:"center"},/*#__PURE__*/react_default.a.createElement(presentational_GovernanceTable,{tableCols:this.state.activeScanCols,tableData:policies.activeScans,showCheckboxes:false,pageSize:10,pagedResultsOffset:0,totalPagedResults:policies.activeScans.length,hideToolbar:true,hideSearchBar:true,handlePagination:this.onPaginationChange}))));}}]);return Policies;}(react["Component"]);var Policies_mapStateToProps=function mapStateToProps(state){var policies=state.policies,generic=state.generic;return{policies:policies,generic:generic};};var Policies_mapDispatchToProps={changeActiveScansStatus:policies_actions_changeActiveScansStatus,changeCreateModalType:generic_actions_changeCreateModalType,changePolicyType:policies_actions_changePolicyType,changeSortKey:policies_actions_changeSortKey,changeSearchKey:policies_actions_changeSearchKey,getActivePolicyScans:policies_actions_getActivePolicyScans,getPolicies:policies_actions_getPolicies,deletePolicies:policies_actions_deletePolicies,deleteScans:policies_actions_deleteScans,cancelViolations:policies_actions_cancelViolations,reassignViolations:policies_actions_reassignViolations,configureReactiveScans:policies_actions_configureReactiveScans,setIsCreateModalOpen:generic_actions_setIsCreateModalOpen,updatePagination:policies_actions_updatePagination,getModalObject:generic_actions_getModalObject,changeDialogType:generic_actions_changeDialogType,changeActiveGovernanceDialog:generic_actions_changeActiveGovernanceDialog,updateTakingAction:generic_actions_updateTakingAction};/* harmony default export */ var containers_Policies_Policies = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(Policies_mapStateToProps,Policies_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(Policies_styles))(Policies_Policies));
// CONCATENATED MODULE: ./src/components/containers/Policies/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var containers_Policies = (containers_Policies_Policies);
// CONCATENATED MODULE: ./src/components/containers/Settings/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var Settings_styles_styles=function styles(theme){return{aboutContainer:{marginLeft:'15px'},buttonContainer:{marginBottom:'15px'},innerSettingsCell:{border:'0px',paddingTop:'0px'},statusButton:{width:'max-content',color:theme.palette.forgerock.darkGray,backgroundColor:'#fafafa',boxShadow:'none',borderColor:theme.palette.forgerock.blue,borderRadius:'0px',border:'0px','&.selected':{color:theme.palette.forgerock.blue,borderBottom:'3px solid'},'&:hover':{backgroundColor:theme.palette.forgerock.lightGray,boxShadow:'none'}},formContainer:{backgroundColor:theme.palette.forgerock.lightGray,width:'100%'},slider:{paddingTop:50,width:'100%'},settingsButton:{marginTop:'20px',marginRight:'10px',height:'50px',width:'100px',backgroundColor:theme.palette.forgerock.blue,borderColor:theme.palette.forgerock.blue,color:theme.palette.forgerock.white,'&:hover':{//you want this to be the same as the backgroundColor above
backgroundColor:theme.palette.forgerock.blue},'&[disabled]':{variant:'outlined',backgroundColor:'#d3d8e0',color:'black',opacity:0.6}},linkMenuRow:{padding:5},linkMenuItem:{padding:10},sectionHeader:{paddingBottom:'10px'},settingSection:{paddingBottom:'20px'},headerCell:{padding:'5px',width:'20%',border:'none'},innerHeaderCell:{padding:'5px',border:'none',width:'50%'},menuHeaderCell:{padding:'5px',width:'20%',border:'none'},menuCloseCell:{width:'0.1%',padding:0,border:'none'},tableHeader:{marginTop:'5px',backgroundColor:'#d3d8e0'},settingGrid:{marginTop:'10px'},settingTable:{width:'70%'},closeButton:{paddingRight:0,paddingLeft:0}};};/* harmony default export */ var Settings_styles = (Settings_styles_styles);
// CONCATENATED MODULE: ./src/components/containers/Settings/inputFields/BooleanField.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */function BooleanField(props){var field=props.field,handleChange=props.handleChange,values=props.values,t=props.t,classes=props.classes;var fieldHeader=/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],null,t(field.id),":");return/*#__PURE__*/react_default.a.createElement(TableRow["a" /* default */],{className:classes.settingGrid,key:field.id},/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{key:field.id+'label',className:classes.headerCell},fieldHeader),/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{key:field.id+'input',className:Object(clsx_m["a" /* default */])(classes.headerCell,classes.menuHeaderCell)},/*#__PURE__*/react_default.a.createElement(Switch["a" /* default */],{name:field.id,onChange:handleChange,checked:Boolean(values[field.id]),value:Boolean(values[field.id])})));}
// CONCATENATED MODULE: ./src/components/containers/Settings/inputFields/DropdownField.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */function DropdownField(props){var field=props.field,t=props.t,values=props.values,handleChange=props.handleChange,classes=props.classes;var attrObj=lodash_default.a.find(props.options,['key',field.id]);return/*#__PURE__*/react_default.a.createElement(TableRow["a" /* default */],{className:classes.settingGrid,key:field.id},/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{key:field.id+'label',className:classes.headerCell},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],null,attrObj?attrObj.label:t(field.id))),/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{key:field.id+'input',className:classes.headerCell},/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{variant:"outlined",fullWidth:true,name:field.id,value:values[field.id]||'',onChange:handleChange},props.options.map(function(option){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:option.key,value:option.key},option.key);}))));}
// CONCATENATED MODULE: ./src/components/containers/Settings/inputFields/RiskLevelSlider.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */function RiskLevel(props){var field=props.field,classes=props.classes,handleChange=props.handleChange,values=props.values;return/*#__PURE__*/react_default.a.createElement(TableRow["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{className:classes.innerSettingsCell},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,direction:'column',className:classes.slider},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true},/*#__PURE__*/react_default.a.createElement(Slider["a" /* default */],{name:field.id,value:values[field.id],"aria-labelledby":"continuous-slider",onChange:handleChange,min:1,max:9,valueLabelDisplay:"on"})),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],null,"Low: ",values[field.id][0]==1?1:'1 - '+values[field.id][0])),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],null,"Medium: ",values[field.id][1]-values[field.id][0]===1?values[field.id][1]:values[field.id][0]+1+' - '+values[field.id][1])),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],null,"High: ",values[field.id][1]+1==10?10:values[field.id][1]+1+' - 10')))));}
// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Clear.js
var Clear = __webpack_require__(192);
var Clear_default = /*#__PURE__*/__webpack_require__.n(Clear);

// CONCATENATED MODULE: ./src/components/containers/Settings/inputFields/MenuLinks.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */function MenuLinks(props){var field=props.field,values=props.values,classes=props.classes,t=props.t,onChange=props.onChange;var newURL={'name':'','url':''};var URLS=values[field.id]||[];return/*#__PURE__*/react_default.a.createElement(formik_esm["a" /* FieldArray */],{name:field.id,render:function render(arrayHelpers){return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,URLS.map(function(value,index){return/*#__PURE__*/react_default.a.createElement(TableRow["a" /* default */],{key:index,className:classes.settingGrid},/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{className:classes.menuHeaderCell},/*#__PURE__*/react_default.a.createElement(TextField["a" /* default */],{key:index+'textfield1',onChange:onChange,name:"".concat(field.id,"[").concat(index,"].name"),value:values[field.id][index].name,variant:"outlined",className:classes.menuLabel,fullWidth:true})),/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{className:classes.menuHeaderCell},/*#__PURE__*/react_default.a.createElement(TextField["a" /* default */],{onChange:onChange,name:"".concat(field.id,"[").concat(index,"].url"),variant:"outlined",value:values[field.id][index].url,className:classes.menuLink,fullWidth:true})),/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{className:classes.menuCloseCell},/*#__PURE__*/react_default.a.createElement(IconButton["a" /* default */],{"aria-label":t('label-close'),className:classes.closeButton,onClick:function onClick(){return arrayHelpers.remove(index);}},/*#__PURE__*/react_default.a.createElement(Clear_default.a,null))));}),/*#__PURE__*/react_default.a.createElement(TableRow["a" /* default */],{className:classes.buttonContainer},/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{className:classes.innerSettingsCell},/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{className:classes.settingsButton,size:"large",variant:"outlined",type:"button",onClick:function onClick(){return arrayHelpers.push(newURL);}},t('add')),/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{className:classes.settingsButton,size:"large",variant:"outlined",type:"button",onClick:function onClick(){return props.setFieldValue(field.id,field.value,true);}},t('reset')))));}});}
// CONCATENATED MODULE: ./src/components/containers/Settings/Global.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var Global_SimpleForm=function SimpleForm(props){var _useState=Object(react["useState"])(false),_useState2=Object(slicedToArray["a" /* default */])(_useState,2),loading=_useState2[0],setLoading=_useState2[1];Object(react["useEffect"])(function(){setLoading(true);props.getSettings().then(function(settingData){props.getManagedObjectConfig();}).finally(function(){setLoading(false);});},[]);var handleSliderChange=function handleSliderChange(e,target,value){props.setFieldTouched(target,true);if(value[0]===value[1]){if(value[0]===1){value[1]=2;}else{value[0]=value[0]-1;}}props.setFieldValue(target,value,true);};var handleDropDownChange=function handleDropDownChange(e,target,value){props.setFieldTouched(target,true);props.setFieldValue(target,value,true);};var getOptionsFromManagedUsers=function getOptionsFromManagedUsers(){var user_objects=config.managed_objects.user;var options=Object.keys(user_objects).map(function(key){return{'key':key,'label':user_objects[key].description};});return options;};var getSettingSegment=function getSettingSegment(field){if(field.type=='dropdown'){var options=getOptionsFromManagedUsers();if(field.attributes){return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,field.attributes.map(function(attribute){return/*#__PURE__*/react_default.a.createElement(DropdownField,{key:attribute.id,options:options,field:attribute,t:t,classes:classes,handleChange:function handleChange(e,selection){handleDropDownChange(e,attribute.id,selection.props.value);},values:values});}));}else{return/*#__PURE__*/react_default.a.createElement(DropdownField,{options:options,field:field,t:t,classes:classes,handleChange:function handleChange(e,selection){handleDropDownChange(e,field.id,selection.props.value);},values:values});}}else if(field.type=='dblSlider'){return/*#__PURE__*/react_default.a.createElement(RiskLevel,{field:field,values:values,classes:classes,t:t,handleChange:function handleChange(event,value){handleSliderChange(event,field.id,value);}});}else if(field.type=='string'){if(field.id=='menuManagement'){return/*#__PURE__*/react_default.a.createElement(MenuLinks,{field:field,values:values,onChange:handleChange,classes:classes,t:t,setFieldValue:props.setFieldValue});}else{return/*#__PURE__*/react_default.a.createElement(TableRow["a" /* default */],{className:classes.settingGrid,key:field.id},/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{key:field.id+'label',className:classes.headerCell},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],null,t(field.id),":")),/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{key:field.id+'input',className:classes.headerCell},/*#__PURE__*/react_default.a.createElement(OutlinedInput["a" /* default */],{onChange:handleChange,id:field.id,height:".75em",fullWidth:true,value:values[field.id]})));}}else if(field.type=='boolean'){return/*#__PURE__*/react_default.a.createElement(BooleanField,{field:field,values:values,handleChange:handleChange,t:t,classes:classes});}};var values=props.values,handleChange=props.handleChange,handleSubmit=props.handleSubmit,config=props.config,classes=props.classes,t=props.t,dirty=props.dirty;if(!config.settings.results||!config.managed_objects||lodash_default.a.isEmpty(config.managed_objects)){//possible check config.managed_sers.schema as well
return null;}if(loading){return/*#__PURE__*/react_default.a.createElement(presentational_LoadingIndicator,null);}else{return/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.formContainer,direction:'column'},/*#__PURE__*/react_default.a.createElement("form",{onSubmit:handleSubmit,className:classes.formEntire},config.settings.results.map(function(setting){return/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,item:true,key:setting.section,className:classes.settingSection,direction:'column'},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.sectionHeader,variant:"h6"},t(setting.section))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true},/*#__PURE__*/react_default.a.createElement(Table["a" /* default */],{className:classes.settingTable},setting.section!=='Risk Level Management'&&/*#__PURE__*/react_default.a.createElement(TableHead["a" /* default */],{className:classes.tableHeader},/*#__PURE__*/react_default.a.createElement(TableRow["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{className:classes.headerCell},"Name"),/*#__PURE__*/react_default.a.createElement(TableCell["a" /* default */],{colSpan:2,className:classes.headerCell},"Option"))),/*#__PURE__*/react_default.a.createElement(TableBody["a" /* default */],{className:classes.tableBody},setting.fields.map(function(field){var settingSegment=getSettingSegment(field);return/*#__PURE__*/react_default.a.createElement(react["Fragment"],{key:field.id},settingSegment);})))));}),/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{className:classes.settingsButton,type:"submit",disabled:!dirty},t('submit'))));}};var Global=Object(formik_esm["c" /* withFormik */])({mapPropsToValues:function mapPropsToValues(props){var formFields={};if(props.config.settings.results!=null&&props.config.settings.results.length>0){props.config.settings.results.forEach(function(setting){setting.fields.forEach(function(field){if(field.type=='dblSlider'){formFields[field.id]=[field.value.lower,field.value.higher];}else if(field.id=='userAttrMappings'){field.attributes.forEach(function(attribute){formFields[attribute.id]=attribute.value;});}else if(field.type=='boolean'){formFields[field.id]=field.value;}else if(field.id=='menuManagement'){formFields[field.id]=[];field.value.forEach(function(value){formFields[field.id].push(value);});}else{formFields[field.id]=field.value||'';}});});return formFields;}},enableReinitialize:true,// Custom sync validation
validate:function validate(values,props){var errors={};values['menuManagement'].map(function(url){if(url.name==''||url.value==''){errors.menuManagement='Required';}});return errors;},handleSubmit:function handleSubmit(values,formikBag){var props=formikBag.props;var newSettings=lodash_default.a.cloneDeep(props.config.settings);newSettings.results.forEach(function(setting){setting.fields.forEach(function(field){if(field.type=='dblSlider'){field.value.lower=values[field.id][0];field.value.higher=values[field.id][1];}else if(field.id=='userAttrMappings'){field.attributes.forEach(function(attribute){attribute.value=values[attribute.id];});}else{field.value=values[field.id];}});});props.updateSettings({'updatedSettings':newSettings.results});},displayName:'BasicForm'})(Global_SimpleForm);var Global_mapDispatchToProps={getSettings:config_actions_getSettings,updateSettings:config_actions_updateSettings,getManagedObjectConfig:config_actions_getManagedObjectConfig};var Global_mapStateToProps=function mapStateToProps(state){var config=state.config,settings=state.settings;return{config:config,settings:settings};};/* harmony default export */ var Settings_Global = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(Global_mapStateToProps,Global_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(Settings_styles))(Global));
// CONCATENATED MODULE: ./src/components/containers/Settings/About.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var About_About=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(About,_Component);function About(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,About);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(About)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{loading:false});return _this;}Object(createClass["a" /* default */])(About,[{key:"componentDidMount",value:function componentDidMount(){var _this2=this;this.setState({loading:true});this.props.getAboutInfo().finally(function(){_this2.setState({loading:false});});}},{key:"getVersion",value:function getVersion(version){var majorVersion=version.major;var minorVersion=version.minor;return majorVersion+'.'+minorVersion;}},{key:"parseCommit",value:function parseCommit(commit){return commit.substring(commit.length-7);}},{key:"render",value:function render(){var _this$props=this.props,classes=_this$props.classes,t=_this$props.t,config=_this$props.config;var version=null;if(config.settings.about){version=config.settings.about.version;}if(!version){return null;}return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,this.state.loading?/*#__PURE__*/react_default.a.createElement(presentational_LoadingIndicator,null):/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.aboutContainer},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],null,t('version'),": ",this.getVersion(version)),/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],null,t('commit'),": ",this.parseCommit(version.commit))));}}]);return About;}(react["Component"]);var About_mapStateToProps=function mapStateToProps(state){var config=state.config;return{config:config};};var About_mapDispatchToProps={getAboutInfo:config_actions_getAboutInfo};/* harmony default export */ var Settings_About = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(About_mapStateToProps,About_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(Settings_styles))(About_About));
// CONCATENATED MODULE: ./src/components/containers/Settings/Settings.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var Settings_Settings=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(Settings,_Component);function Settings(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,Settings);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(Settings)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{selectedSetting:'global',loading:false});return _this;}Object(createClass["a" /* default */])(Settings,[{key:"changeSelected",value:function changeSelected(selectedSetting){this.setState({selectedSetting:selectedSetting});}},{key:"getView",value:function getView(){switch(this.state.selectedSetting){case'global':return/*#__PURE__*/react_default.a.createElement(Settings_Global,null);case'about':return/*#__PURE__*/react_default.a.createElement(Settings_About,null);}}},{key:"render",value:function render(){var _this2=this;var _this$props=this.props,classes=_this$props.classes,t=_this$props.t;var view=this.getView();return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(presentational_PageTitle,{title:t('System Settings')}),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.buttonContainer,item:true,xs:12},/*#__PURE__*/react_default.a.createElement(ButtonGroup["a" /* default */],{color:"default",fullWidth:true,"aria-label":"full width outlined button group"},utils_constants.SETTINGS.map(function(setting){return/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{key:setting,className:Object(clsx_m["a" /* default */])(classes.statusButton,{'selected':setting===_this2.state.selectedSetting}),variant:"contained",onClick:function onClick(){return _this2.changeSelected(setting);}},t(setting));}))),view);}}]);return Settings;}(react["Component"]);/* harmony default export */ var containers_Settings_Settings = (Object(redux["d" /* compose */])(Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(Settings_styles))(Settings_Settings));
// CONCATENATED MODULE: ./src/components/containers/Settings/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var containers_Settings = (containers_Settings_Settings);
// CONCATENATED MODULE: ./src/components/containers/Notifications/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var Notifications_styles_styles=function styles(theme){return{container:{marginTop:theme.spacing()}};};/* harmony default export */ var Notifications_styles = (Notifications_styles_styles);
// CONCATENATED MODULE: ./src/components/containers/Notifications/Notifications.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var Notifications_Notifications=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(Notifications,_Component);function Notifications(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,Notifications);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(Notifications)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{tableCols:[{'header':_this.props.t('notificationName'),'key':'displayName'}],loading:false,sortAsc:true});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"action",function(evt,selectedRowId){_this.props.history.push('/admin/notification-templates/'+selectedRowId);});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"sortNotifications",function(data){var sortAsc=_this.state.sortAsc;if(sortAsc){return lodash_default.a.sortBy(data,'displayName');}else{return lodash_default.a.sortBy(data,'displayName').reverse();}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleSortChange",function(){_this.setState({sortAsc:!_this.state.sortAsc});});return _this;}Object(createClass["a" /* default */])(Notifications,[{key:"componentDidMount",value:function componentDidMount(){var _this2=this;this.setState({loading:true});this.props.getNotifications().finally(function(){_this2.setState({loading:false});});}},{key:"render",value:function render(){var _this$props=this.props,classes=_this$props.classes,t=_this$props.t;var tableData=this.props.config.notifications.results;if(!tableData){return null;}var sortedData=this.sortNotifications(tableData);return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(presentational_PageTitle,{title:t('page-notification-templates')}),this.state.loading?/*#__PURE__*/react_default.a.createElement(presentational_LoadingIndicator,null):/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.container,justify:"center"},/*#__PURE__*/react_default.a.createElement(presentational_GovernanceTable,{tableCols:this.state.tableCols,tableData:sortedData,bulkActions:null,handleActions:this.handleActions,showNewButton:false,showCheckboxes:false,handlePagination:this.handleSortChange,hideToolbar:true,hideSearchBar:true,doNotPaginate:true,handleRowClick:this.action,tableType:"notifications"})));}}]);return Notifications;}(react["Component"]);var Notifications_mapStateToProps=function mapStateToProps(state){var config=state.config;return{config:config};};var Notifications_mapDispatchToProps={getNotifications:config_actions_getNotifications};/* harmony default export */ var containers_Notifications_Notifications = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(Notifications_mapStateToProps,Notifications_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(Notifications_styles))(Notifications_Notifications));
// CONCATENATED MODULE: ./src/components/containers/Notifications/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var containers_Notifications = (containers_Notifications_Notifications);
// CONCATENATED MODULE: ./src/components/containers/NotificationDetails/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var NotificationDetails_styles_styles=function styles(theme){return{textArea:{minWidth:'100%',font:'inherit',backgroundColor:'white'},notificationRow:{marginBottom:'10px'},notificationContainer:{paddingTop:'15px'},editNotificationButton:{width:'100px',color:theme.palette.forgerock.white,backgroundColor:theme.palette.forgerock.blue,boxShadow:'none',borderColor:theme.palette.forgerock.blue,border:'0px',margin:'10px','&:hover':{backgroundColor:theme.palette.forgerock.blue,boxShadow:'none'}}};};/* harmony default export */ var NotificationDetails_styles = (NotificationDetails_styles_styles);
// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/TextareaAutosize/TextareaAutosize.js
var TextareaAutosize = __webpack_require__(449);

// CONCATENATED MODULE: ./src/components/containers/NotificationDetails/NotificationDetails.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var addCarbonCopyField=function addCarbonCopyField(data){var newData=Object.entries(data);newData.splice(4,0,['cc','']);newData=newData.reduce(function(result,item){result[item[0]]=item[1];return result;},{});return newData;};var NotificationDetails_NotificationDetails=function NotificationDetails(props){var _useState=Object(react["useState"])([]),_useState2=Object(slicedToArray["a" /* default */])(_useState,2),data=_useState2[0],setData=_useState2[1];var _useState3=Object(react["useState"])(false),_useState4=Object(slicedToArray["a" /* default */])(_useState3,2),loading=_useState4[0],setLoading=_useState4[1];Object(react["useEffect"])(function(){var id=props.match.params.id;setLoading(true);props.setSelectedNotification(id);props.getSelectedNotification().finally(function(){setLoading(false);});},[]);Object(react["useEffect"])(function(){setData(props.config.notifications.selected.notification);},[props.config.notifications.selected]);var t=props.t,classes=props.classes;if(!lodash_default.a.isEmpty(data)&&!('cc'in data)){setData(addCarbonCopyField(data));}if(loading){return/*#__PURE__*/react_default.a.createElement(presentational_LoadingIndicator,null);}return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(presentational_PageTitle,{title:t('notification_edit')+' '+t('notification')}),loading?/*#__PURE__*/react_default.a.createElement(presentational_LoadingIndicator,null):/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.notificationContainer},/*#__PURE__*/react_default.a.createElement(formik_esm["b" /* Formik */],{initialValues:data,validate:function validate(values){var errors={};if(lodash_default.a.isEqual(values,data)){//TODO: Add alert for validation
errors.general='Data was not changed';}return errors;},onSubmit:function onSubmit(values,_ref){var setSubmitting=_ref.setSubmitting;props.updateSelectedNotification(values);}},function(_ref2){var values=_ref2.values,errors=_ref2.errors,touched=_ref2.touched,handleChange=_ref2.handleChange,handleBlur=_ref2.handleBlur,handleSubmit=_ref2.handleSubmit,isSubmitting=_ref2.isSubmitting;return/*#__PURE__*/react_default.a.createElement("form",{onSubmit:handleSubmit},Object.keys(data).map(function(key){var field=null;if(key==='enabled'){field=/*#__PURE__*/react_default.a.createElement(Switch["a" /* default */],{name:key,onChange:handleChange,size:"medium",checked:values[key],value:values[key],onBlur:handleBlur});}else if(key==='body'){field=/*#__PURE__*/react_default.a.createElement(TextareaAutosize["a" /* default */],{onChange:handleChange,name:key,value:values[key],className:Object(clsx_m["a" /* default */])(classes.textArea,classes.notificationRow),rowsMax:10,rowsMin:10});}else{field=/*#__PURE__*/react_default.a.createElement(OutlinedInput["a" /* default */],{onChange:handleChange,name:key,value:values[key],className:Object(clsx_m["a" /* default */])(classes.textArea,classes.notificationRow),disabled:key==='_id',fullWidth:true,onBlur:handleBlur});}return/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,key:key,alignItems:'center'},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:1},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],null,t(key))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:10},field));}),/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{type:"submit",disabled:isSubmitting,className:classes.editNotificationButton},t('submit')),/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{type:"button",onClick:function onClick(){props.history.goBack();},className:classes.editNotificationButton},t('btn-cancel')));}))));};var NotificationDetails_mapStateToProps=function mapStateToProps(state){var config=state.config;return{config:config};};var NotificationDetails_mapDispatchToProps={getSelectedNotification:config_actions_getSelectedNotification,setSelectedNotification:config_actions_setSelectedNotification,updateSelectedNotification:config_actions_updateSelectedNotification};/* harmony default export */ var containers_NotificationDetails_NotificationDetails = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(NotificationDetails_mapStateToProps,NotificationDetails_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(NotificationDetails_styles))(NotificationDetails_NotificationDetails));
// CONCATENATED MODULE: ./src/components/containers/UserSummary/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var UserSummary_styles_styles=function styles(theme){return{buttonContainer:{borderBottom:'1px solid rgba(224, 224, 224, 1)',marginBottom:'15px'},cardContainer:{width:'50%'},categoryCell:{paddingTop:'30px!important'},categoryRow:{borderBottom:'1px'},container:{marginTop:theme.spacing()},entitlementRow:{cursor:'pointer'},firstCell:{paddingLeft:'30px!important'},listItemText:{display:'block',overflow:'hidden',textOverflow:'ellipsis'},nested:{paddingLeft:theme.spacing(4)},selectSystemControl:{width:'100%'},selectSystemLabel:{marginLeft:'14px',transform:'translateY(-5px) scale(0.75)'},summaryEntry:{color:theme.palette.forgerock.darkGray},summaryListEntry:{marginBottom:'20px'},summaryListEntryTitle:{color:theme.palette.forgerock.blue},summaryTab:{width:'max-content',color:theme.palette.forgerock.darkGray,backgroundColor:'#fafafa',boxShadow:'none',borderColor:theme.palette.forgerock.blue,borderRadius:'0px',border:'0px','&.selected':{color:theme.palette.forgerock.blue,borderBottom:'3px solid'},'&:hover':{backgroundColor:theme.palette.forgerock.lightGray,boxShadow:'none'}},summaryHeader:{backgroundColor:theme.palette.forgerock.lightGray,paddingTop:'0px',paddingBottom:'0px',minHeight:'0rem'},summaryHeaderGrid:{display:'flex',flexDirection:'row',justifyContent:'space-between',alignItems:'center'},switchContainer:{paddingTop:theme.spacing(2),paddingBottom:theme.spacing(2),paddingLeft:theme.spacing(),display:'flex',flexDirection:'row',alignItems:'baseline'},switchLabel:{fontSize:'0.875rem'},toggleButton:{textTransform:'capitalize'},policyScanHeader:{marginTop:'15px'},summaryInput:{marginRight:'10px'},userSearchContainer:{marginTop:'10px',marginBottom:'30px'}};};/* harmony default export */ var UserSummary_styles = (UserSummary_styles_styles);
// CONCATENATED MODULE: ./src/store/actions/summary.actions.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var summary_actions_getSummary=function getSummary(systemtest){return function(dispatch,getState){dispatch({type:SUMMARY.QUERY_SUMMARY,payload:null});var _getState$summary=getState().summary,pageNumber=_getState$summary.pageNumber,pageSize=_getState$summary.pageSize,sortBy=_getState$summary.sortBy,sortDir=_getState$summary.sortDir,type=_getState$summary.type,user=_getState$summary.user,q=_getState$summary.q;var isSummary=type==='summary';var url=summary_actions_getSummaryEndpointByType(type,user.id);var params={pageSize:pageSize,pageNumber:pageNumber,type:type,status:'active',q:q};if(params.q){params.q=params.q.replace(/\\/g,'\\\\').replace(/"/g,'\\"');}if(isSummary){if(user.id===null){dispatch({type:SUMMARY.QUERY_SUMMARY_SUCCESS,payload:{results:[],certifiables:[]}});return;}//TODO parameterize user ID
params={};if(systemtest){params.system=systemtest;}return httpService.request({url:url,method:'get',params:params}).then(function(_ref){var data=_ref.data;var result=data.result;if(result[0]&&!result[0]._id){result=data.result.map(function(item){return Object(objectSpread["a" /* default */])({},item,{_id:item.objectid});});}dispatch({type:SUMMARY.QUERY_SUMMARY_SUCCESS,payload:{entitlements:result.profile.entitlements,userInfo:result.profile.userInfo,attrOrder:result.order,totalPagedResults:data.totalPagedResults}});}).catch(function(error){dispatch({type:SUMMARY.QUERY_SUMMARY_FAILURE,payload:null});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});}else{if(!sortBy){sortBy='-expirationDate';}params.sortBy=sortDir==='asc'?"+".concat(sortBy):"-".concat(sortBy);params.pageSize=pageSize||10;return httpService.request({url:url,method:'get',params:params}).then(function(_ref2){var data=_ref2.data;var result=data.result;if(result[0]&&!result[0]._id){result=data.result.map(function(item){return Object(objectSpread["a" /* default */])({},item,{_id:item.objectid});});}dispatch({type:SUMMARY.QUERY_SUMMARY_SUCCESS,payload:{results:result,totalPagedResults:data.totalPagedResults}});}).catch(function(error){dispatch({type:SUMMARY.QUERY_SUMMARY_FAILURE,payload:null});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});}};};var summary_actions_getEntitlementHistory=function getEntitlementHistory(entitlementId){return function(dispatch,getState){if(!entitlementId){dispatch({type:SUMMARY.QUERY_ENTITLEMENT_SUCCESS,payload:{singleEntitlementHistory:{}}});return;}dispatch({type:SUMMARY.QUERY_ENTITLEMENT,payload:null});var _getState$summary2=getState().summary,system=_getState$summary2.system,userId=_getState$summary2.userId;var url=utils_constants.IDM_CONTEXT+'/governance/userEventData/user/'+userId+'/history';var params={entitlementId:entitlementId};if(system){params.system=system;}return httpService.request({url:url,method:'get',params:params}).then(function(_ref3){var data=_ref3.data;dispatch({type:SUMMARY.QUERY_ENTITLEMENT_SUCCESS,payload:{singleEntitlementHistory:data.result}});}).catch(function(error){dispatch({type:SUMMARY.QUERY_ENTITLEMENT_FAILURE,payload:null});return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};//REPLACE
var summary_actions_reassignTasks=function reassignTasks(oldCertifierId,newCertifierId,taskIds){return function(dispatch,getState){var type=getState().summary.type;var endpoint=summary_actions_getReassignEndpointByType(type);var data={};if(type==='violation-tasks'||type==='violation'){data={oldOwnerId:oldCertifierId,newOwnerId:newCertifierId,ids:taskIds};}else{data={oldCertifierId:oldCertifierId,newCertifierId:newCertifierId,campaignIds:taskIds};}return httpService.request({url:endpoint,method:'post',data:data}).then(function(_ref4){var result=_ref4.data.result;dispatch(generic_actions_alert(result,'success'));dispatch(summary_actions_getSummary());return data;}).catch(function(error){return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});};};var summary_actions_updateUser=function updateUser(user,noUpdate){return function(dispatch){dispatch({type:SUMMARY.UPDATE_USER,payload:user});dispatch(summary_actions_updateSystems(!user?null:user.key));if(!noUpdate){dispatch(summary_actions_getSummary());}};};//REPLACE
var summary_actions_changeSummaryType=function changeSummaryType(type,noUpdate){return function(dispatch){dispatch({type:SUMMARY.CHANGE_SUMMARY_TYPE,payload:type});if(!noUpdate){dispatch(summary_actions_getSummary());}};};var summary_actions_changeSortKey=function changeSortKey(sortBy,isDesc){return function(dispatch){dispatch({type:SUMMARY.CHANGE_SORTING,payload:{sortBy:sortBy,isDesc:isDesc}});dispatch(summary_actions_getSummary());};};var summary_actions_changeSearchKey=function changeSearchKey(q,noUpdate){return function(dispatch){dispatch({type:SUMMARY.CHANGE_SEARCH_KEY,payload:{q:q}});if(!noUpdate){dispatch(summary_actions_getSummary());}};};var summary_actions_updatePagination=function updatePagination(params,noUpdate){return function(dispatch){dispatch({type:SUMMARY.UPDATE_PAGINATION,payload:params});if(!noUpdate){dispatch(summary_actions_getSummary());}};};var summary_actions_updateSystems=function updateSystems(userId){return function(dispatch){if(userId){return httpService.request({url:utils_constants.IDM_CONTEXT+'/endpoint/linkedView/managed/user/'+userId,method:'get'}).then(function(_ref5){var data=_ref5.data;var systems=summary_actions_getSystemsFromLinkedTo(data.linkedTo);dispatch({type:SUMMARY.UPDATE_SYSTEMS,payload:{systems:systems}});}).catch(function(error){return dispatch(httpFailure(GENERIC.HTTP_FAILURE,error,'error'));});}else{dispatch({type:SUMMARY.UPDATE_SYSTEMS,payload:{systems:[]}});}};};var summary_actions_getSummaryEndpointByType=function getSummaryEndpointByType(type,userId){if(type==='summary'||!type){return utils_constants.IDM_CONTEXT+'/governance/userEventData/user/'+userId;}else{return utils_constants.IDM_CONTEXT+'/governance/dashboard/'+userId;}};var summary_actions_getReassignEndpointByType=function getReassignEndpointByType(type){switch(type){case'user':return utils_constants.IDM_CONTEXT+'/governance/certify/user/reassign';case'object':return utils_constants.IDM_CONTEXT+'/governance/certify/object/reassign';case'violation':return utils_constants.IDM_CONTEXT+'/governance/violation?_action=reassign';default:return'';}};var summary_actions_getSystemsFromLinkedTo=function getSystemsFromLinkedTo(linkedTo){var systems=['IDM'];if(!linkedTo){return[];}lodash_default.a.forEach(linkedTo,function(link){if(link.resourceName.endsWith(link.content._id)){systems.push(link.resourceName.substring(0,link.resourceName.indexOf(link.content._id)-1));}});return systems;};
// CONCATENATED MODULE: ./src/components/containers/UserSummary/UserSummary.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var UserSummary_UserSummary=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(UserSummary,_Component);function UserSummary(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,UserSummary);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(UserSummary)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{summaryTabs:['summary','user','object','violation'],newButtonText:'',showNewButton:false,bulkActions:[],tableCols:[],interval:null,modalEntitlement:{},nestedLists:{},userId:null,userName:null,system:'IDM',type:'summary',viewCurrentOnly:false});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"changeSelectedTab",function(tab){var type=_this.props.summary.type;_this.props.changeSummaryType(tab,!(type===tab));});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"updateTableForSummaryType",function(type){var newButtonText='';var showNewButton=false;var tableTitle='';var tableCols=[];var bulkActions=[];if(type==='summary'){tableTitle='certification-summary';}else if(type==='user'){tableTitle='user-tasks',bulkActions=['reassign-all','reassign-tasks'];tableCols=[{'header':'Campaign Name','key':'name'},{'header':'Certifier','key':'openCertifiers'},{'header':'Start Date','key':'startDate','type':'date'},{'header':'Deadline','key':'deadline','type':'date'}];}else if(type==='object'){tableTitle='object-tasks',bulkActions=['reassign-all','reassign-tasks'];tableCols=[{'header':'Campaign Name','key':'name'},{'header':'Certifier','key':'openCertifiers'},{'header':'Total Event Count','key':'totalEventCount'},{'header':'Start Date','key':'startDate','type':'date'},{'header':'Deadline','key':'deadline','type':'date'}];}else if(type==='violation'){tableTitle='violation',bulkActions=['reassign-all','reassign-tasks'];tableCols=[{'header':'Policy','key':'policyName'},{'header':'User','key':'targetUser'},{'header':'Owner','key':'owner'},{'header':'Expiration Date','key':'expirationDate','type':'date'}];}_this.setState({bulkActions:bulkActions,showNewButton:showNewButton,newButtonText:newButtonText,tableTitle:tableTitle,tableCols:tableCols});if(tableCols[0]){_this.props.changeSortKey(tableCols[0].key);}else{_this.props.getSummary(_this.state.system);}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"onPaginationChange",function(evt,page){if(evt.q!=null){_this.props.changeSearchKey(evt.q);}else if(evt.sortBy){// Sorting key changed
var isDesc=evt.sortBy===_this.props.summary.sortBy&&_this.props.summary.sortDir==='asc';_this.props.changeSortKey(evt.sortBy,isDesc);}else if(evt.target.value){// Rows per page changed
_this.props.updatePagination(Object(objectSpread["a" /* default */])({},_this.props.summary,{pageNumber:1,pageSize:evt.target.value}));}else if(lodash_default.a.isNumber(page)){// Page number changed
_this.props.updatePagination(Object(objectSpread["a" /* default */])({},_this.props.summary,{pageNumber:page+1}));}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"actionFinally",function(){_this.props.updateTakingAction(false);_this.props.changeActiveGovernanceDialog(null);_this.props.changeModalObject(null);_this.props.changeDialogType(null);});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleActions",function(actionType,selectedRows,newCertifierId){var id=_this.props.summary.user.id;_this.props.updateTakingAction(true);_this.props.changeDialogType('actionSubmitting');if(actionType==='reassign-tasks'){_this.props.reassignTasks('managed/user/'+id,newCertifierId,selectedRows).finally(function(){_this.actionFinally();});}if(actionType==='reassign-all'){_this.props.reassignTasks('managed/user/'+id,newCertifierId,null).finally(function(){_this.actionFinally();});}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleRowClick",function(evt,selectedRow){var summary=_this.props.summary;var type=summary.type;_this.props.history.push('/adminCertList/'+type+'/'+selectedRow);});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"updateTableData",function(){var results=_this.props.summary.results;_this.setState({tableData:results});});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"onSelectUser",function(e,target,value){_this.props.changeSummaryType('summary',utils_constants.DO_NOT_UPDATE);_this.props.updateUser(value,!value);});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"onSelectSystem",function(e,target){var value=target.props&&target.props.value?target.props.value:null;_this.setState({system:value});});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getSummaryEntry",function(entry){var classes=_this.props.classes;var result=/*#__PURE__*/react_default.a.createElement(ListItem["a" /* default */],{button:true,className:classes.nested},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,"justify-content":"flex-start",className:classes.summaryEntry},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:6},/*#__PURE__*/react_default.a.createElement(ListItemText["a" /* default */],{primary:entry.entitlementDisplayName})),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:3},/*#__PURE__*/react_default.a.createElement(ListItemText["a" /* default */],{primary:!entry.completionDate?'-':moment_default()(entry.completionDate).format('L')})),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:3},/*#__PURE__*/react_default.a.createElement(ListItemText["a" /* default */],{className:classes.listItemText,primary:_this.getDisplayOutcome(entry)}))));return result;});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getDisplayOutcome",function(entry){var displayOutcome='';switch(entry.outcome){case'certify':displayOutcome='Certified';break;case'revoke':displayOutcome='Revoked';break;case'abstain':displayOutcome='Abstained';break;case null:displayOutcome='Uncertified';break;case'in-progress':return'In-progress';default:displayOutcome=entry.outcome;break;}/*
    if (entry.outcome && entry.outcome) {
      displayOutcome += ' by ' + entry.certifierDisplayName
    }*/return displayOutcome;});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getFlattenedData",function(data){var _this$props=_this.props,summary=_this$props.summary,config=_this$props.config;var viewCurrentOnly=_this.state.viewCurrentOnly;var attrOrder=summary.attrOrder;var managed_objects=config.managed_objects;var user=managed_objects.user;var flattenedData=[];var isIDM=_this.state.system==='IDM';var keys=isIDM?attrOrder:lodash_default.a.keys(data);lodash_default.a.forEach(keys,function(attr){if(!data[attr]){return;}var value=data[attr];var category=isIDM?value[0].attributeName||value[0].attributeDisplayName||user[attr].title:value[0].attributeName;flattenedData.push({category:category});var sorted=lodash_default.a.sortBy(value,'entitlementDisplayName');if(viewCurrentOnly){lodash_default.a.forEach(sorted,function(item){if(item.isCurrentEntitlement===true){flattenedData.push(item);}});}else{flattenedData=lodash_default.a.concat(flattenedData,sorted);}});return flattenedData;});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleToggle",function(){_this.setState({viewCurrentOnly:!_this.state.viewCurrentOnly});});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getFlattenedEntry",function(entry){var flattenedCertifications=[];lodash_default.a.forEach(entry.certifications,function(item){item.parentId=item.campaign._id+'/'+item.completionDate;flattenedCertifications.push(item);if(item.comments.length>0){flattenedCertifications.push({comments:item.comments,parent:item.campaign._id+'/'+item.completionDate});}});entry.certifications=flattenedCertifications;return entry;});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"openDialogModal",function(entry){if(!entry.certifications||entry.certifications.length===0){return;}var data=lodash_default.a.cloneDeep(entry);var flattenedData=_this.getFlattenedEntry(data);_this.setState({modalEntitlement:flattenedData});_this.props.changeDialogType('entitlement-history');_this.props.changeActiveGovernanceDialog('UserSummaryDialog');});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getSubtitle",function(){var user=_this.props.summary.user;if(!user||!user.id){return'No User Selected';}else{return user.displayName;}});return _this;}Object(createClass["a" /* default */])(UserSummary,[{key:"componentDidMount",value:function componentDidMount(){var summary=this.props.summary;var type=summary.type;this._isMounted=true;if(type){this.updateTableForSummaryType(type);}}},{key:"componentWillUnmount",value:function componentWillUnmount(){this._isMounted=false;this.props.changeSearchKey(null,true);this.props.changeSummaryType(this.state.summaryTabs[0],utils_constants.DO_NOT_UPDATE);this.props.updateUser(null,utils_constants.DO_NOT_UPDATE);this.props.changeActiveGovernanceDialog(null,true);this.props.updatePagination({pageNumber:1,pageSize:this.props.summary.pageSize,sortBy:'name'});}},{key:"componentDidUpdate",value:function componentDidUpdate(prevProps,prevState){var summary=this.props.summary;var type=summary.type,queryingEntitlement=summary.queryingEntitlement;if(prevProps&&prevProps.summary.queryingEntitlement&&!queryingEntitlement){this.openDialogModal();}if(prevState&&prevState.system&&prevState.system!==this.state.system){this.props.getSummary(this.state.system);}else if(type!==prevProps.summary.type){this.updateTableForSummaryType(type);}}},{key:"handleClick",value:function handleClick(name){var nestedLists=lodash_default.a.cloneDeep(this.state.nestedLists);if(!lodash_default.a.has(nestedLists,name)){nestedLists[name]=false;}else{nestedLists[name]=!nestedLists[name];}this.setState({nestedLists:nestedLists});}},{key:"render",value:function render(){var _this2=this;var _this$props2=this.props,classes=_this$props2.classes,summary=_this$props2.summary,generic=_this$props2.generic,t=_this$props2.t;var _this$state=this.state,summaryTabs=_this$state.summaryTabs,nestedLists=_this$state.nestedLists,system=_this$state.system,viewCurrentOnly=_this$state.viewCurrentOnly;var modalObject=generic.modalObject,queryingModalObject=generic.queryingModalObject;var entitlements=summary.entitlements,querying=summary.querying;var id=summary.user.id;return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(presentational_PageTitle,{title:t('page-user-summary'),subtitle:this.getSubtitle()}),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.userSearchContainer,display:"flex","flex-direction":"row",container:true},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.summaryInput,item:true,xs:3},/*#__PURE__*/react_default.a.createElement(presentational_AsyncSelect,{name:"userSelector",variant:"outlined",fullWidth:true,onChange:this.onSelectUser,label:"Select user",targetType:"userName",value:this.props.summary.user.displayName})),summary.type==='summary'&&id&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:3},/*#__PURE__*/react_default.a.createElement(FormControl["a" /* default */],{className:classes.selectSystemControl},/*#__PURE__*/react_default.a.createElement(InputLabel["a" /* default */],{className:classes.selectSystemLabel},t('select-system')),/*#__PURE__*/react_default.a.createElement(Select["a" /* default */],{className:classes.systemSelector,name:"systemSelector",variant:"outlined",fullWidth:true,onChange:this.onSelectSystem,label:"Select system",value:id?system||'IDM':'',disabled:!id},summary.systems.map(function(system){return/*#__PURE__*/react_default.a.createElement(MenuItem["a" /* default */],{key:system,value:system},system);}))))),id&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.buttonContainer,item:true,xs:12},/*#__PURE__*/react_default.a.createElement(ButtonGroup["a" /* default */],{color:"default",fullWidth:true,"aria-label":"full width outlined button group"},summaryTabs.map(function(tab){return/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{key:tab,className:Object(clsx_m["a" /* default */])(classes.summaryTab,{'selected':summary.type===tab}),variant:"contained",onClick:function onClick(){return _this2.changeSelectedTab(tab);}},t(tab!=='summary'?tab+'-tasks':tab));}))),summary.type==='summary'&&id&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.switchContainer},/*#__PURE__*/react_default.a.createElement(InputLabel["a" /* default */],{className:classes.switchLabel},t('view-current')),/*#__PURE__*/react_default.a.createElement(Switch["a" /* default */],{name:"currentItems",className:classes.toggleButton,onChange:this.handleToggle,checked:Boolean(viewCurrentOnly),value:Boolean(viewCurrentOnly)})),/*#__PURE__*/react_default.a.createElement(index_es["a" /* Card */],null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */],null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Header,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('header-entitlement')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('header-decision')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('header-date')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].ColHeader,null,t('header-certifier')))),querying?/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Body,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{colSpan:4},/*#__PURE__*/react_default.a.createElement(LinearProgress["a" /* default */],null)))):/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Body,null,this.getFlattenedData(entitlements).map(function(entry){return entry.category?/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{className:classes.categoryRow,key:Object(v4["a" /* default */])()},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.categoryCell},/*#__PURE__*/react_default.a.createElement(IconButton["a" /* default */],{className:classes.expandButton,onClick:function onClick(){_this2.handleClick(entry.category);}},!lodash_default.a.has(nestedLists,entry.category)||nestedLists[entry.category]===true?/*#__PURE__*/react_default.a.createElement(ExpandMore_default.a,null):/*#__PURE__*/react_default.a.createElement(ChevronRight_default.a,null)),/*#__PURE__*/react_default.a.createElement("strong",null,entry.category)),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null)):!lodash_default.a.has(nestedLists,entry.attributeDisplayName||entry.attributeName)||nestedLists[entry.attributeDisplayName||entry.attributeName]===true?/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{key:Object(v4["a" /* default */])(),className:Object(clsx_m["a" /* default */])(entry.certifications[0]&&classes.entitlementRow),onClick:function onClick(){return _this2.openDialogModal(entry);}},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:Object(clsx_m["a" /* default */])(classes.entitlementCell,classes.firstCell)},entry.entitlementDisplayName),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.entitlementCell},entry.certifications[0]?t('summary-'+entry.certifications[0].outcome):t('summary-not-certified')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.entitlementCell},entry.certifications[0]&&entry.certifications[0].completionDate?moment_default()(entry.certifications[0].completionDate).format('L'):'-'),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.entitlementCell},entry.certifications[0]?entry.certifications[0].certifier.displayName:'-')):null;}))))),summary.type!=='summary'&&id&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.container,justify:"center"},/*#__PURE__*/react_default.a.createElement(presentational_GovernanceTable,{tableCols:this.state.tableCols,tableData:lodash_default.a.isArray(summary.results)?summary.results:[],sortBy:summary.sortBy,sortDir:summary.sortDir,bulkActions:this.state.bulkActions,handleActions:this.handleActions,showNewButton:this.state.showNewButton,newButtonText:this.state.newButtonText,showCheckboxes:summary.type!=='summary',pageSize:summary.pageSize,pagedResultsOffset:summary.pageNumber-1,handlePagination:this.onPaginationChange,querying:summary.querying,handleRowClick:this.handleRowClick,getModalObject:this.props.getModalObject,queryingModalObject:queryingModalObject,modalObject:modalObject,tableType:summary.type})),/*#__PURE__*/react_default.a.createElement(presentational_GovernanceDialog,{dialogId:"UserSummaryDialog",onSubmitDialog:function onSubmitDialog(){_this2.props.changeActiveGovernanceDialog(null);},modalObject:this.state.modalEntitlement,largeDialog:true}));}}]);return UserSummary;}(react["Component"]);var UserSummary_mapStateToProps=function mapStateToProps(state){var summary=state.summary,generic=state.generic,config=state.config;return{summary:summary,generic:generic,config:config};};var UserSummary_mapDispatchToProps={changeSummaryType:summary_actions_changeSummaryType,changeSortKey:summary_actions_changeSortKey,changeSearchKey:summary_actions_changeSearchKey,changeDialogType:generic_actions_changeDialogType,changeActiveGovernanceDialog:generic_actions_changeActiveGovernanceDialog,getSummary:summary_actions_getSummary,reassignTasks:summary_actions_reassignTasks,updatePagination:summary_actions_updatePagination,getModalObject:generic_actions_getModalObject,updateUser:summary_actions_updateUser,updateTakingAction:generic_actions_updateTakingAction,changeModalObject:generic_actions_changeModalObject};/* harmony default export */ var containers_UserSummary_UserSummary = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(UserSummary_mapStateToProps,UserSummary_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(UserSummary_styles))(UserSummary_UserSummary));
// CONCATENATED MODULE: ./src/components/containers/UserSummary/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var containers_UserSummary = (containers_UserSummary_UserSummary);
// EXTERNAL MODULE: ./node_modules/@material-ui/icons/TimerOff.js
var TimerOff = __webpack_require__(302);
var TimerOff_default = /*#__PURE__*/__webpack_require__.n(TimerOff);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/HourglassEmpty.js
var HourglassEmpty = __webpack_require__(301);
var HourglassEmpty_default = /*#__PURE__*/__webpack_require__.n(HourglassEmpty);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/HelpOutline.js
var HelpOutline = __webpack_require__(226);
var HelpOutline_default = /*#__PURE__*/__webpack_require__.n(HelpOutline);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Help.js
var Help = __webpack_require__(300);
var Help_default = /*#__PURE__*/__webpack_require__.n(Help);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/RemoveCircleOutline.js
var RemoveCircleOutline = __webpack_require__(299);
var RemoveCircleOutline_default = /*#__PURE__*/__webpack_require__.n(RemoveCircleOutline);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/CheckCircleOutline.js
var CheckCircleOutline = __webpack_require__(298);
var CheckCircleOutline_default = /*#__PURE__*/__webpack_require__.n(CheckCircleOutline);

// EXTERNAL MODULE: ./node_modules/query-string/index.js
var query_string = __webpack_require__(225);
var query_string_default = /*#__PURE__*/__webpack_require__.n(query_string);

// CONCATENATED MODULE: ./src/components/containers/CertificationList/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var CertificationList_styles_styles=function styles(theme){return{container:{marginTop:theme.spacing()},certTitle:{textAlign:'center'},detailsTitle:{boxShadow:'0 2px 10px 0 rgba(0,0,0,.11)'},eventDetailsListContainer:{},entitlementHeaderRow:{marginBottom:'10px'},entitlementCell:{paddingTop:'0.3rem!important',paddingBottom:'0.3rem!important',verticalAlign:'middle!important'},nameCell:{width:'550px'},eventDetailsDialog:{maxHeight:'100%'},formControl:{display:'flex',marginTop:theme.spacing()},formGroup:{display:'flex',justifyContent:'space-evenly'},stageActionButton:{},statusButton:{'&.certify-selected':{backgroundColor:theme.palette.forgerock.success,color:theme.palette.secondary.contrastText},'&.revoke-selected':{backgroundColor:theme.palette.forgerock.danger,color:theme.palette.secondary.contrastText},'&.abstain-selected':{backgroundColor:theme.palette.forgerock.warning,color:theme.palette.secondary.contrastText},'&.hover':{backgroundColor:theme.palette.secondary.main,color:theme.palette.secondary.contrastText}},titleContainer:{justifyContent:'space-between',display:'flex',flexDirection:'row'},incompleteIcon:{color:theme.palette.forgerock.darkGray,opacity:0.5},certifyIcon:{color:theme.palette.forgerock.success},revokeIcon:{color:theme.palette.forgerock.danger},abstainIcon:{color:theme.palette.forgerock.warning},assignmentAttribute:{paddingLeft:"".concat(theme.spacing(6),"px!important"),paddingTop:'14px!important',paddingBottom:'14px!important',border:'none!important'},buttonContainer:{marginBottom:'15px'},certStatusButton:{width:'max-content',color:theme.palette.forgerock.darkGray,backgroundColor:'#fafafa',boxShadow:'none',borderColor:theme.palette.forgerock.blue,borderRadius:'0px',border:'0px','&.selected':{color:theme.palette.forgerock.blue,borderBottom:'3px solid'},'&:hover':{backgroundColor:theme.palette.forgerock.lightGray,boxShadow:'none'}},clickableMetadata:{cursor:'pointer','&:hover':{textDecoration:'underline',color:theme.palette.forgerock.blue}},searchFilter:{marginBottom:theme.spacing()},sectionHeader:{backgroundColor:theme.palette.forgerock.lightGray,paddingTop:'0px',paddingBottom:'0px',minHeight:'0rem',fontWeight:'500'},sectionHeaderGrid:{display:'flex',flexDirection:'row',justifyContent:'space-between',alignItems:'center'},textField:{marginLeft:theme.spacing(),marginRight:theme.spacing(),minWidth:200},toggleButton:{paddingLeft:'0px'},nested:{paddingLeft:theme.spacing(4)},modal:{height:'100%'},borderLinear:{root:{height:10,borderRadius:5},colorPrimary:{backgroundColor:theme.palette.forgerock.lightGray},bar:{borderRadius:5,backgroundColor:theme.palette.forgerock.blue}},borderProgressContainer:{paddingTop:'5px'},campaignInformation:{paddingTop:'20px',display:'flex',flexDirection:'row',justifyContent:'space-around'},dialog:{minWidth:'1000px'},dualSectionContainer:{display:'flex',justifyContent:'center',flexDirection:'row'},progressActionContainer:{paddingTop:'15px'},progressValue:{paddingLeft:'10px'},sectionContainer:{width:'100%',display:'flex',flexDirection:'column',justifyContent:'space-evenly'},stageActionContainer:{display:'flex',flexDirection:'row',justifyContent:'center',alignItems:'baseline'},stageActionButtonContainer:{display:'flex',justifyContent:'flex-start',paddingLeft:'30px'},stageActionProgressContainer:{paddingLeft:'30px',alignSelf:'end'},stageActionLabel:{alignSelf:'center',fontWeight:'500',paddingBottom:'15px'},stageActionLabelContainer:{display:'flex',justifyContent:'center'},stageSelectorLabel:{alignSelf:'center',fontWeight:'500'},stageButton:{minWidth:'90px',color:theme.palette.secondary.contrastText,backgroundColor:theme.palette.forgerock.blue,border:'1px solid',borderColor:theme.palette.forgerock.blue,marginRight:theme.spacing(),'&.hover':{backgroundColor:theme.palette.forgerock.blue,color:theme.palette.secondary.contrastText}},stageContainer:{alignItems:'center',justify:'center',paddingBottom:theme.spacing(4),paddingLeft:theme.spacing(4),paddingRight:theme.spacing(4),display:'flex',flexDirection:'column'},userInfoCard:{width:'95%'},userInfoContainer:{display:'flex',flexDirection:'column',justifyContent:'space-evenly',paddingTop:'20px'},userInfoHeader:{minHeight:'0rem',backgroundColor:theme.palette.forgerock.lightGray}};};/* harmony default export */ var CertificationList_styles = (CertificationList_styles_styles);
// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Tooltip/Tooltip.js
var Tooltip = __webpack_require__(530);

// CONCATENATED MODULE: ./src/components/presentational/ObjectInformation/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var ObjectInformation_styles_styles=function styles(theme){return{container:{alignItems:'center'},objectInfoTableCell:{fontWeight:400,padding:'0.5rem!important',paddingLeft:'1rem!important',border:'none',minWidth:'fit-content',textTransform:'capitalize'},objectInfoTableCellNoTransform:{fontWeight:400,padding:'0.5rem!important',paddingLeft:'1rem!important',border:'none',minWidth:'fit-content'},objectInfoTableRow:{border:'none'},objectInformation:{paddingTop:theme.spacing()*4},pageTitleDivider:{marginBottom:theme.spacing()},headerText:{fontWeight:'500',paddingLeft:'1rem'},sectionHeader:{backgroundColor:theme.palette.forgerock.lightGray,paddingTop:'0px',paddingBottom:'0px',minHeight:'0rem',paddingLeft:'1rem'},sectionHeaderGrid:{display:'flex',flexDirection:'row',justifyContent:'space-between',alignItems:'center'},sectionHeaderTitle:{fontSize:'1rem!important',fontWeight:'400'}};};/* harmony default export */ var ObjectInformation_styles = (ObjectInformation_styles_styles);
// CONCATENATED MODULE: ./src/components/presentational/ObjectInformation/ObjectInformation.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var ObjectInformation_ObjectInformation=function ObjectInformation(props){var campaignInfo=props.campaignInfo,classes=props.classes,infoType=props.infoType,isAdmin=props.isAdmin;var getClass=function getClass(key){if(key==='Active Certifiers'||key==='Completed Certifiers'){return classes.objectInfoTableCellNoTransform;}else{return classes.objectInfoTableCell;}};return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(index_es["a" /* Card */],null,infoType==='stages'&&/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */],{className:classes.objectInformation},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Header,{className:classes.sectionHeader},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.headerText},"Stage Name"),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.headerText},"Deadline"),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.headerText},"Progress"))),isAdmin?/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Body,null,campaignInfo.stages.map(function(stage){return/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{key:stage.name,className:classes.objectInfoTableRow,justify:"flex-start"},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.objectInfoTableCell},stage.name),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.objectInfoTableCell},moment_default()(stage.deadline).format('L')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.objectInfoTableCell},stage.eventsComplete+' of '+stage.eventCount));})):/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Body,null,campaignInfo.stages.map(function(stage){return campaignInfo.totals&&campaignInfo.totals[stage.name]&&/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{key:stage.name},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.objectInfoTableCell},stage.name),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.objectInfoTableCell},moment_default()(stage.deadline).format('L')),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.objectInfoTableCell},lodash_default.a.keys(campaignInfo.totals[stage.name]).map(function(key){return/*#__PURE__*/react_default.a.createElement("span",{key:key},key,": ",campaignInfo.totals[stage.name][key],/*#__PURE__*/react_default.a.createElement("br",null));})));}))),infoType!=='stages'&&/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */],{className:classes.objectInformation},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Header,{className:classes.sectionHeader},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{colSpan:3,className:classes.headerText},"Campaign Information"))),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Body,null,campaignInfo.map(function(key){return/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{key:key.key,className:classes.objectInfoTableRow,justify:"flex-start"},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.objectInfoTableCell},key.key,": "),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:getClass(key.key)},key.value));})))));};/* harmony default export */ var presentational_ObjectInformation_ObjectInformation = (Object(withStyles["a" /* default */])(ObjectInformation_styles,{withTheme:true})(ObjectInformation_ObjectInformation));
// CONCATENATED MODULE: ./src/components/presentational/ObjectInformation/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var presentational_ObjectInformation = (presentational_ObjectInformation_ObjectInformation);
// CONCATENATED MODULE: ./src/components/containers/CertificationList/EventDetailsList.js
var EventDetailsList_EventDetailsList=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(EventDetailsList,_Component);function EventDetailsList(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,EventDetailsList);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(EventDetailsList)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{rowActions:['certify','revoke','abstain'],nestedLists:{},action:'revoke'});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"takeAction",function(action,comment,dataGroup,dataIndex,attrIndex){var oldAction=_this.props.certlist.selectedAction;if(dataGroup!==undefined&&dataIndex!==undefined){var rowData={dataGroup:dataGroup,dataIndex:dataIndex,attrIndex:attrIndex};_this.props.updateRowData(rowData);}if(action==='certify'||action==='reset'||action==='claim'){_this.props.updateSelectedAction(action);_this.props.certActionEvent(null,true);}else if(action==='revokeAbstainSubmit'){if(oldAction==='comment'){_this.props.certActionEvent(comment,false);}else{_this.props.certActionEvent(comment,true);_this.props.changeActiveGovernanceDialog(null);}}else{_this.props.updateSelectedAction(action);_this.props.changeActiveGovernanceDialog('EventDetailsListDialog');_this.props.changeDialogType(action);}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getMetadataIdFromRow",function(data,section,isField,isSystem){switch(section){case'identity':if(isField){return data.field==='email'?'mail':data.field;// Temporary fix for email issue with creation
}else{return data.field+'/'+data.fieldValue;}case'managedObject':// Get the metadata id for the attribute itself (glossary class - identity)
if(isField){return data.objectType;}// Get the metadata id for the managed object value of the entry (glossary class- object)
else if(data.objectId){// Single relationship attribute (e.g. manager)
return data.objectId;}else if(data.relationshipId){// Multi valued relationship attribute (e.g. roles)
return data.fieldValue;}// Get the metadata for the identity value itself (glossary class - identity-value)
else{return data.objectType+'/'+data.attributeValue;}case'application':if(isSystem){return'system/'+data.connector;}else if(isField){return'system-attribute/'+data.displayName+'/'+data.attributeName;}else{return'system-value/'+data.displayName+'/'+data.attributeName+'/'+data.attributeValue;}}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"showMetadataModal",function(evt,data,section,isClickable,isField,isSystem){evt.stopPropagation();if(!isClickable){return;}var metadataId=_this.getMetadataIdFromRow(data,section,isField,isSystem);_this.props.getMetadata('glossary',metadataId);_this.props.changeDialogType('glossary');_this.props.changeActiveGovernanceDialog('EventDetailsListDialog');});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleClose",function(){});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getEventDetailsModalObject",function(){var _this$props=_this.props,certlist=_this$props.certlist,activeStage=_this$props.activeStage;var selectedAction=certlist.selectedAction,rowData=certlist.rowData,eventDetails=certlist.eventDetails,metadataObject=certlist.metadataObject;if(_this.props.eventActionClicked){return selectedAction==='comment'?eventDetails.stages[activeStage].comments:[];}else{if(selectedAction==='comment'){if(!rowData){return null;}var dataGroup=rowData.dataGroup,dataIndex=rowData.dataIndex,attrIndex=rowData.attrIndex;var comments=[];if(attrIndex===undefined){comments=eventDetails.stages[activeStage].eventData[dataGroup][dataIndex].comments;}else{var identifier=dataGroup==='application'?'attributes':'values';var values=eventDetails.stages[activeStage].eventData[dataGroup][dataIndex][identifier];var entitlement=dataGroup==='managedObject'?lodash_default.a.find(values,{'attrIndex':attrIndex}):values[attrIndex];comments=entitlement?entitlement.comments:[];}return comments;}else{return metadataObject||rowData;}}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"showRow",function(attribute){var nestedLists=_this.state.nestedLists;return!attribute.parent||!lodash_default.a.has(nestedLists,attribute.parent)||nestedLists[attribute.parent]===true;});return _this;}Object(createClass["a" /* default */])(EventDetailsList,[{key:"componentWillUnmount",value:function componentWillUnmount(){this._isMounted=false;this.setState({nestedLists:{}});}},{key:"handleClick",value:function handleClick(name){var nestedLists=lodash_default.a.cloneDeep(this.state.nestedLists);if(!lodash_default.a.has(nestedLists,name)){nestedLists[name]=lodash_default.a.startsWith(name,'managed/assignment');}else{nestedLists[name]=!nestedLists[name];}if(name==='assignments'){lodash_default.a.forEach(lodash_default.a.keys(nestedLists),function(key){if(lodash_default.a.startsWith(key,'managed/assignment/')){nestedLists[key]=false;}});}this.setState({nestedLists:nestedLists});}},{key:"actionButtons",value:function actionButtons(dataIndex,attrIndex,dataGroup,outcome,disabled){var _this2=this;var classes=this.props.classes;return/*#__PURE__*/react_default.a.createElement(ButtonGroup["a" /* default */],{key:Object(v4["a" /* default */])(),color:"primary","aria-label":"outlined primary button group"},this.state.rowActions.map(function(action){return/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{size:"small",onClick:function onClick(event){_this2.takeAction(action===outcome?'reset':action,null,dataGroup,dataIndex,attrIndex);},key:Object(v4["a" /* default */])(),disabled:disabled,className:Object(clsx_m["a" /* default */])(classes.statusButton,{'certify-selected':action===outcome&&outcome==='certify'},{'revoke-selected':action===outcome&&outcome==='revoke'},{'abstain-selected':action===outcome&&outcome==='abstain'})},action);}));}},{key:"getFlattenedData",value:function getFlattenedData(data){var flattenedData=[];lodash_default.a.forEach(data,function(entry){flattenedData.push(entry);var subCategory=entry.mapping?'attributes':'values';if(entry[subCategory]&&entry[subCategory].length>0){lodash_default.a.forEach(entry[subCategory],function(value){flattenedData.push(value);if(value.parent&&value.parent==='assignments'){lodash_default.a.forEach(value.assignmentAttributes,function(attribute){var attributeToPush=lodash_default.a.cloneDeep(attribute);attributeToPush.parent=value.fieldValue;attributeToPush.isAssignmentAttribute=true;flattenedData.push(attributeToPush);});}});}});return flattenedData;}},{key:"getAttributeDisplayName",value:function getAttributeDisplayName(attribute,section,isLabel){var _this3=this;var _this$props2=this.props,classes=_this$props2.classes,certlist=_this$props2.certlist;var nestedLists=this.state.nestedLists;var certType=certlist.certType;var isUser=certType==='user';if(section==='identity'){if(isLabel){return/*#__PURE__*/react_default.a.createElement("span",{className:Object(clsx_m["a" /* default */])(isUser&&classes.clickableMetadata),onClick:function onClick(evt){return _this3.showMetadataModal(evt,attribute,section,isUser,true);}},/*#__PURE__*/react_default.a.createElement("strong",null,attribute.displayName));}else{return/*#__PURE__*/react_default.a.createElement("span",{className:Object(clsx_m["a" /* default */])(isUser&&classes.clickableMetadata),onClick:function onClick(evt){return _this3.showMetadataModal(evt,attribute,section,isUser);}},attribute.fieldValue);}}else if(section==='managedObject'){if(attribute.values&&attribute.values.length===0){var split=attribute.displayName.split(': ');return/*#__PURE__*/react_default.a.createElement("span",null,/*#__PURE__*/react_default.a.createElement("span",{className:Object(clsx_m["a" /* default */])(isUser&&classes.clickableMetadata),onClick:function onClick(evt){return _this3.showMetadataModal(evt,attribute,section,isUser,true);}},/*#__PURE__*/react_default.a.createElement("strong",null,split[0])),/*#__PURE__*/react_default.a.createElement("span",{textDecoration:"none"},": "),/*#__PURE__*/react_default.a.createElement("span",{className:Object(clsx_m["a" /* default */])((isUser||attribute.objectId)&&classes.clickableMetadata),onClick:function onClick(evt){return _this3.showMetadataModal(evt,attribute,section,isUser||attribute.objectId);}}," ",split[1]," "));}else if(attribute.certifiable===0&&attribute.values.length>0){return/*#__PURE__*/react_default.a.createElement("span",null,/*#__PURE__*/react_default.a.createElement(IconButton["a" /* default */],{className:classes.toggleButton,onClick:function onClick(){_this3.handleClick(attribute.objectType);}},!lodash_default.a.has(nestedLists,attribute.objectType)||nestedLists[attribute.objectType]===true?/*#__PURE__*/react_default.a.createElement(ExpandMore_default.a,null):/*#__PURE__*/react_default.a.createElement(ChevronRight_default.a,null)),/*#__PURE__*/react_default.a.createElement("span",{className:Object(clsx_m["a" /* default */])(isUser&&classes.clickableMetadata),onClick:function onClick(evt){return _this3.showMetadataModal(evt,attribute,section,isUser,true);}},/*#__PURE__*/react_default.a.createElement("strong",null,attribute.displayName)));}else if(attribute.isAssignmentAttribute){return/*#__PURE__*/react_default.a.createElement("span",null,/*#__PURE__*/react_default.a.createElement("i",null,attribute.name),': '+attribute.value);}else{return/*#__PURE__*/react_default.a.createElement("span",null,attribute.parent&&attribute.parent==='assignments'&&attribute.assignmentAttributes.length>0&&/*#__PURE__*/react_default.a.createElement(IconButton["a" /* default */],{className:classes.toggleButton,onClick:function onClick(){_this3.handleClick(attribute.fieldValue);}},nestedLists[attribute.fieldValue]===true?/*#__PURE__*/react_default.a.createElement(ExpandMore_default.a,null):/*#__PURE__*/react_default.a.createElement(ChevronRight_default.a,null)),/*#__PURE__*/react_default.a.createElement("span",{className:classes.clickableMetadata,onClick:function onClick(evt){return _this3.showMetadataModal(evt,attribute,section,true);}},attribute.displayName));}}else if(section==='application'){if(attribute.attributes){var identifier=attribute.displayName+'_'+attribute.objectType;return/*#__PURE__*/react_default.a.createElement("span",null,/*#__PURE__*/react_default.a.createElement(IconButton["a" /* default */],{className:classes.toggleButton,onClick:function onClick(){_this3.handleClick(identifier);}},!lodash_default.a.has(nestedLists,identifier)||nestedLists[identifier]===true?/*#__PURE__*/react_default.a.createElement(ExpandMore_default.a,null):/*#__PURE__*/react_default.a.createElement(ChevronRight_default.a,null)),/*#__PURE__*/react_default.a.createElement("span",{className:classes.clickableMetadata,onClick:function onClick(evt){return _this3.showMetadataModal(evt,attribute,section,true,false,true);}},/*#__PURE__*/react_default.a.createElement("strong",null,attribute.displayName+' - '+attribute.objectType)));}else{return/*#__PURE__*/react_default.a.createElement("span",null,/*#__PURE__*/react_default.a.createElement("span",{className:classes.clickableMetadata,onClick:function onClick(evt){return _this3.showMetadataModal(evt,attribute,section,true,true);}},/*#__PURE__*/react_default.a.createElement("strong",null,attribute.attributeName)),/*#__PURE__*/react_default.a.createElement("span",{textDecoration:"none"},": "),/*#__PURE__*/react_default.a.createElement("span",{className:classes.clickableMetadata,onClick:function onClick(evt){return _this3.showMetadataModal(evt,attribute,section,true);}},attribute.attributeValue));}}else if(section==='metadata'){return/*#__PURE__*/react_default.a.createElement("span",null,/*#__PURE__*/react_default.a.createElement("strong",null,attribute.attributeName+': ')," ",attribute.displayName.toString());}}},{key:"getDataGroupIndex",value:function getDataGroupIndex(attribute,section){var data=this.props.data;var group=null;switch(section){case'application':group=attribute.connector?attribute.connector+'_'+attribute.objectType:attribute.parent;break;case'managedObject':group=attribute.objectType||attribute.parent;break;case'metadata':group=attribute.objectType;}for(var i=0;i<data.length;i++){if(section==='application'&&data[i].connector+'_'+data[i].objectType===group){return i;}else if(section!=='application'&&data[i].objectType===group){return i;}}}},{key:"render",value:function render(){var _this4=this;var _this$props3=this.props,data=_this$props3.data,section=_this$props3.section,classes=_this$props3.classes,certlist=_this$props3.certlist,canTakeAction=_this$props3.canTakeAction,queryingMetadata=_this$props3.queryingMetadata,activeStage=_this$props3.activeStage;var isAdminView=certlist.isAdminView,selectedAction=certlist.selectedAction,stageSelected=certlist.stageSelected;var nestedLists=this.state.nestedLists;var eventDetailsModalObject=this.getEventDetailsModalObject();var isNotCurrentStage=activeStage!==stageSelected;return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,section==='identity'?/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */],null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Body,null,data.map(function(attribute){return/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{key:attribute.field},/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,_this4.getAttributeDisplayName(attribute,section,true)),/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,null,_this4.getAttributeDisplayName(attribute,section)));}))):/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */],null,/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Body,null,this.getFlattenedData(data).map(function(attribute){return _this4.showRow(attribute)&&/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Row,{key:Object(v4["a" /* default */])()},attribute.isAssignmentAttribute?nestedLists[attribute.parent]&&/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{colSpan:3,className:Object(clsx_m["a" /* default */])(classes.entitlementCell,classes.nameCell,classes.assignmentAttribute)},_this4.getAttributeDisplayName(attribute,section)):/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:Object(clsx_m["a" /* default */])(classes.entitlementCell,classes.nameCell)},_this4.getAttributeDisplayName(attribute,section)),!attribute.isAssignmentAttribute&&/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.entitlementCell},attribute.certifiable===1&&_this4.actionButtons(_this4.getDataGroupIndex(attribute,section),attribute.entitlementIndex,section,attribute.outcome,isAdminView||!canTakeAction)),!attribute.isAssignmentAttribute&&/*#__PURE__*/react_default.a.createElement(index_es["d" /* Table */].Col,{className:classes.entitlementCell},attribute.certifiable===1&&(!isNotCurrentStage||attribute.comments&&attribute.comments.length>0)&&/*#__PURE__*/react_default.a.createElement(IconButton["a" /* default */],{onClick:function onClick(){_this4.takeAction('comment',null,section,_this4.getDataGroupIndex(attribute,section),attribute.entitlementIndex);}},!attribute.comments||attribute.comments.length<=0?/*#__PURE__*/react_default.a.createElement(ModeCommentOutlined_default.a,null):/*#__PURE__*/react_default.a.createElement(Comment_default.a,null))));}))),/*#__PURE__*/react_default.a.createElement(presentational_GovernanceDialog,{dialogId:"EventDetailsListDialog",modalObject:eventDetailsModalObject,isNotCurrentStage:isNotCurrentStage,queryingMetadata:queryingMetadata,onSubmitDialog:this.props.eventActionClicked?this.props.eventAction:this.takeAction,onClose:this.props.eventActionClicked||selectedAction==='comment'?this.props.eventActionOnDialogClose:this.handleClose}));}}]);return EventDetailsList;}(react["Component"]);var EventDetailsList_mapStateToProps=function mapStateToProps(state){var certlist=state.certlist;return{certlist:certlist};};var EventDetailsList_mapDispatchToProps={certActionEvent:certlist_actions_certActionEvent,changeActiveGovernanceDialog:generic_actions_changeActiveGovernanceDialog,changeDialogType:generic_actions_changeDialogType,getModalObject:generic_actions_getModalObject,getMetadata:certlist_actions_getMetadata,updateSelectedAction:certlist_actions_updateSelectedAction,updateRowData:certlist_actions_updateRowData};/* harmony default export */ var CertificationList_EventDetailsList = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(EventDetailsList_mapStateToProps,EventDetailsList_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(CertificationList_styles))(EventDetailsList_EventDetailsList));
// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Stepper/Stepper.js + 1 modules
var Stepper = __webpack_require__(547);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Step/Step.js
var Step = __webpack_require__(529);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/StepLabel/StepLabel.js + 3 modules
var StepLabel = __webpack_require__(537);

// CONCATENATED MODULE: ./src/components/presentational/StageStepper/styles.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var StageStepper_styles_styles=function styles(theme){return{root:{margin:'auto',width:'auto'},paper:{// width: 200,
height:300,overflow:'auto'},button:{margin:theme.spacing(0.5,0)},formControl:{'& > *':{margin:theme.spacing(0)// marginBottom: 0,
}},formLabel:{backgroundColor:theme.palette.forgerock.white,paddingRight:theme.spacing(),textTransform:'capitalize',marginBottom:0},headerTitle:{fontWeight:'bold',marginRight:theme.spacing()},listHeader:{backgroundColor:theme.palette.background.paper,borderBottom:"1px solid ".concat(theme.palette.divider),textTransform:'capitalize'},stageStep:{cursor:'pointer'},stageStepper:{backgroundColor:'inherit',paddingBottom:'0px',paddingTop:'0px'}};};/* harmony default export */ var StageStepper_styles = (StageStepper_styles_styles);
// CONCATENATED MODULE: ./src/components/presentational/StageStepper/StageStepper.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var StageStepper_StageStepper=function StageStepper(props){var classes=props.classes,changeSelectedStage=props.changeSelectedStage,changeActiveStage=props.changeActiveStage,altLabel=props.altLabel,stagesParent=props.stagesParent,onlyChangeActive=props.onlyChangeActive,activeStage=props.activeStage;var steps=getSteps();var handleStageChange=function handleStageChange(index){if(changeActiveStage){changeActiveStage(index);}if(changeSelectedStage){changeSelectedStage(index);}};function getSteps(){var steps=[];if(stagesParent&&stagesParent.stages){var nameProp=onlyChangeActive?'stageName':'name';steps=lodash_default.a.map(stagesParent.stages,nameProp);}return steps;}return/*#__PURE__*/react_default.a.createElement("div",{className:classes.root},/*#__PURE__*/react_default.a.createElement(Stepper["a" /* default */],{nonLinear:true,className:classes.stageStepper,activeStep:activeStage,alternativeLabel:altLabel},steps.map(function(label,index){return/*#__PURE__*/react_default.a.createElement(Step["a" /* default */],{key:label,className:classes.stageStep,value:index,onClick:function onClick(){return handleStageChange(index);}},/*#__PURE__*/react_default.a.createElement(StepLabel["a" /* default */],null,label));})));};/* harmony default export */ var presentational_StageStepper_StageStepper = (Object(redux["d" /* compose */])(Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(StageStepper_styles))(StageStepper_StageStepper));
// CONCATENATED MODULE: ./src/components/presentational/StageStepper/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var presentational_StageStepper = (presentational_StageStepper_StageStepper);
// CONCATENATED MODULE: ./src/components/containers/CertificationList/EventDetails.js
var EventDetails_Transition=react_default.a.forwardRef(function Transition(props,ref){return/*#__PURE__*/react_default.a.createElement(Slide["a" /* default */],Object.assign({direction:"down",ref:ref},props));});var EventDetails_BorderLinearProgress=Object(withStyles["a" /* default */])(function(theme){return{root:{height:10,borderRadius:5},colorPrimary:{backgroundColor:theme.palette.forgerock.lightGray},bar:{borderRadius:5,backgroundColor:theme.palette.forgerock.blue}};})(LinearProgress["a" /* default */]);var EventDetails_EventDetails=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(EventDetails,_Component);function EventDetails(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,EventDetails);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(EventDetails)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{showSection:{'identity':true,'managedObject':true,'application':true,'metadata':true},rowActions:['certify','revoke','abstain'],managedObjectDisplayName:null,applicationDisplayName:null,activeStage:_this.props.certlist.results.firstEventStage||_this.props.certlist.selectedStage||0,eventActionClicked:false});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"changeActiveStage",function(activeStage){_this.setState({activeStage:activeStage});});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"takeAction",function(action,comment){var oldAction=_this.props.certlist.selectedAction;if(action==='certify'||action==='reset'||action==='claim'){_this.props.updateSelectedAction(action);_this.props.certActionEvent(null);}else if(action==='revokeAbstainSubmit'){if(oldAction!=='comment'){_this.props.certActionEvent(comment,true);_this.props.changeActiveGovernanceDialog(null);_this.setState({eventActionClicked:false});}else{_this.props.certActionEvent(comment,false);}}else{_this.props.changeActiveGovernanceDialog('EventDetailsListDialog');_this.props.changeDialogType(action);_this.props.updateSelectedAction(action);_this.setState(function(){return{eventActionClicked:true};});}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"onDialogClose",function(value){_this.props.updateSelectedAction('');_this.props.updateRowData(null);_this.setState({eventActionClicked:value});});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"pageTitle",function(){var _this$props=_this.props,classes=_this$props.classes,certlist=_this$props.certlist;var eventDetails=certlist.eventDetails;var event=eventDetails.stages[0];return event&&/*#__PURE__*/react_default.a.createElement(DialogTitle["a" /* default */],{className:classes.detailsTitle,id:"create-modal-title",disableTypography:true},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.titleContainer,container:true},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:1}),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:4},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{variant:"h6",className:classes.certTitle},event.target.displayName)),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:1},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,"justify-content":"flex-end",display:"flex"},/*#__PURE__*/react_default.a.createElement(IconButton["a" /* default */],{onClick:_this.props.handleClose},/*#__PURE__*/react_default.a.createElement(Close_default.a,null))))));});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getProgressBar",function(stage){var classes=_this.props.classes;var totalProgress=stage.complete/stage.total*100;return/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,display:"flex","flex-direction":"row"},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,className:classes.borderProgressContainer,xs:10},/*#__PURE__*/react_default.a.createElement(EventDetails_BorderLinearProgress,{variant:"determinate",value:totalProgress})),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:2},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.progressValue,variant:"body1",color:"textSecondary"},"".concat(Math.round(totalProgress),"%"))));});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getCertifiersDisplayString",function(stage){if(stage.openCertifiers){return lodash_default.a.map(stage.openCertifiers,'displayName').join(', ');}return stage.certifier.displayName;});return _this;}Object(createClass["a" /* default */])(EventDetails,[{key:"componentDidMount",value:function componentDidMount(){}},{key:"componentDidUpdate",value:function componentDidUpdate(prevProps){}},{key:"componentWillUnmount",value:function componentWillUnmount(){this._isMounted=false;this.props.setSelectedEventIndex(null,false);}},{key:"toggleSection",value:function toggleSection(section){var showSection=lodash_default.a.cloneDeep(this.state.showSection);showSection[section]=!showSection[section];this.setState({showSection:showSection});}},{key:"handleClick",value:function handleClick(name){if(this.state.displayName===name){this.setState({displayName:null});}else{this.setState({displayName:name});}}},{key:"render",value:function render(){var _this2=this;var _this$props2=this.props,classes=_this$props2.classes,certlist=_this$props2.certlist,t=_this$props2.t,queryingMetadata=_this$props2.queryingMetadata;var eventDetails=certlist.eventDetails,queryingEventDetails=certlist.queryingEventDetails,certType=certlist.certType,isAdminView=certlist.isAdminView;if(!eventDetails||queryingEventDetails){return null;}var selectedStage=eventDetails.stages[this.state.activeStage];var outcome=selectedStage.outcome;var eventData=selectedStage.eventData;var canTakeAction=lodash_default.a.includes(selectedStage.actions,'certify');return/*#__PURE__*/react_default.a.createElement(Dialog["a" /* default */],{maxWidth:"lg",TransitionComponent:EventDetails_Transition,PaperProps:{className:'appBarShift'},fullScreen:true,className:classes.eventDetailsDialog,onClose:this.handleClose,"aria-labelledby":"create-modal-title",scroll:"paper",open:this.props.open},this.pageTitle(),/*#__PURE__*/react_default.a.createElement(DialogContent["a" /* default */],{className:classes.dialog},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.campaignInformation,container:true},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.userInfoContainer,item:true,xl:8,lg:8,md:12},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,className:classes.stageContainer},eventDetails.stages.length>1&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.stageActionContainer},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:2,className:classes.stageActionLabelContainer},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.stageActionLabel},t('stage-selector'),":")),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:10},/*#__PURE__*/react_default.a.createElement(presentational_StageStepper,{stagesParent:eventDetails,changeActiveStage:this.changeActiveStage,activeStage:this.state.activeStage,onlyChangeActive:true,altLabel:false}))),!isAdminView&&selectedStage.actions&&selectedStage.actions.length>0&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.stageActionContainer},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:2,className:classes.stageActionLabelContainer},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.stageActionLabel},t('event-actions'),":")),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:10,className:classes.stageActionButtonContainer},selectedStage.actions&&selectedStage.actions.map(function(action){return/*#__PURE__*/react_default.a.createElement(Button["a" /* default */],{onClick:function onClick(event){_this2.takeAction(action);},key:Object(v4["a" /* default */])(),className:Object(clsx_m["a" /* default */])(classes.stageButton,classes.stageActionButton,{'selected':action===outcome})},action);}))),(selectedStage.openCertifiers||selectedStage.certifier)&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:Object(clsx_m["a" /* default */])(classes.stageActionContainer,classes.progressActionContainer)},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:2,className:classes.stageActionLabelContainer},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.stageActionLabel},selectedStage.openCertifiers?t('stage-active-certifiers'):t('stage-certifier'),":")),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:10,className:classes.stageActionProgressContainer},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],null,this.getCertifiersDisplayString(selectedStage)))),selectedStage.claimedBy&&selectedStage.claimedBy.displayName&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:Object(clsx_m["a" /* default */])(classes.stageActionContainer,classes.progressActionContainer)},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:2,className:classes.stageActionLabelContainer},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.stageActionLabel},t('claimed-by'),":")),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:10,className:classes.stageActionProgressContainer},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],null,selectedStage.claimedBy.displayName))),selectedStage.completionDate&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:Object(clsx_m["a" /* default */])(classes.stageActionContainer,classes.progressActionContainer)},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:2,className:classes.stageActionLabelContainer},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.stageActionLabel},t('completion-date'),":")),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:10,className:classes.stageActionProgressContainer},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],null,moment_default()(selectedStage.completionDate).format('LLL')))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:Object(clsx_m["a" /* default */])(classes.stageActionContainer,classes.progressActionContainer)},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:2,className:classes.stageActionLabelContainer},/*#__PURE__*/react_default.a.createElement(Typography["a" /* default */],{className:classes.stageActionLabel},t('stage-progress'),":")),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:10,className:classes.stageActionProgressContainer},this.getProgressBar(selectedStage)))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12,className:classes.sectionContainer},lodash_default.a.keys(this.state.showSection).map(function(section){return eventData[section].length>0?/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12,key:section},/*#__PURE__*/react_default.a.createElement(index_es["a" /* Card */],null,/*#__PURE__*/react_default.a.createElement(index_es["a" /* Card */].Header,{className:classes.sectionHeader},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.sectionHeaderGrid},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(index_es["a" /* Card */].Title,null,certType==='user'?t('details-'+section):t('details-'+section+'-object'))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],null,/*#__PURE__*/react_default.a.createElement(IconButton["a" /* default */],{onClick:function onClick(){return _this2.toggleSection(section);}},_this2.state.showSection[section]?/*#__PURE__*/react_default.a.createElement(ExpandMore_default.a,null):/*#__PURE__*/react_default.a.createElement(ChevronRight_default.a,null))))),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.sectionContainer},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,item:true,direction:'column'},_this2.state.showSection[section]?/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.eventDetailsListContainer},/*#__PURE__*/react_default.a.createElement(CertificationList_EventDetailsList,{data:eventData[section],section:section,queryingMetadata:queryingMetadata,canTakeAction:canTakeAction,activeStage:_this2.state.activeStage,getIconFromOutcome:_this2.props.getIconFromOutcome,eventActionClicked:_this2.state.eventActionClicked,eventAction:_this2.takeAction,eventActionOnDialogClose:_this2.onDialogClose})):null)))):null;}))))));}}]);return EventDetails;}(react["Component"]);var EventDetails_mapStateToProps=function mapStateToProps(state){var certlist=state.certlist,auth=state.auth;return{certlist:certlist,auth:auth};};var EventDetails_mapDispatchToProps={getEventDetails:certlist_actions_getEventDetails,changeSelectedStage:certlist_actions_changeSelectedStage,incrementSelectedStage:certlist_actions_incrementSelectedStage,decrementSelectedStage:certlist_actions_decrementSelectedStage,certActionEvent:certlist_actions_certActionEvent,setSelectedEventIndex:certlist_actions_setSelectedEventIndex,changeDialogType:generic_actions_changeDialogType,getModalObject:generic_actions_getModalObject,updateSelectedAction:certlist_actions_updateSelectedAction,updateRowData:certlist_actions_updateRowData,changeActiveGovernanceDialog:generic_actions_changeActiveGovernanceDialog};/* harmony default export */ var CertificationList_EventDetails = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(EventDetails_mapStateToProps,EventDetails_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(CertificationList_styles))(EventDetails_EventDetails));
// CONCATENATED MODULE: ./src/components/containers/CertificationList/CertificationList.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var CertificationList_CertificationList=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(CertificationList,_Component);function CertificationList(){var _getPrototypeOf2;var _this;Object(classCallCheck["a" /* default */])(this,CertificationList);for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=Object(possibleConstructorReturn["a" /* default */])(this,(_getPrototypeOf2=Object(getPrototypeOf["a" /* default */])(CertificationList)).call.apply(_getPrototypeOf2,[this].concat(args)));Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"state",{newButtonText:'stage-actions',bulkActions:['cancel-cert'],rowActions:['certify','revoke','abstain','comment','reset'],campaignInfo:[],tableCols:[],tableData:[],openComments:false,loadingData:false,showEventDetails:false,setInitialStage:false,loading:false});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"setTableCols",function(status){var _this$props=_this.props,certlist=_this$props.certlist,t=_this$props.t;var results=certlist.results,actingId=certlist.actingId;var stages=results.stages,stageSelected=results.stageSelected;var events=[];if(stages&&stageSelected&&stages[stageSelected]){events=stages[stageSelected].events;}else if(stages){events=stages[0].events;}else{events=[];}var tableCols=[];if(events.length===0){if(_this.state.tableCols.length>0){return;}tableCols=[];}else{var event=events[0];lodash_default.a.forEach(event.eventData.identity,function(attribute){tableCols.push({'header':attribute.displayName,'key':attribute.field});});if(lodash_default.a.includes(actingId,'managed/role')||lodash_default.a.includes(actingId,'internal/role')){tableCols.push({'header':t('header-claimed-by'),'key':'claimedBy'});}else{tableCols.push({'header':t('header-certifier'),'key':'certifier'});}}_this.setState({tableCols:tableCols});});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"changeSelectedStage",function(stageSelected){_this.setState({showEventDetails:false});_this.props.updatePagination(Object(objectSpread["a" /* default */])({},_this.props.certlist,{pageNumber:1,stageSelected:stageSelected}));});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"onPaginationChange",function(evt,page){if(evt.q!=null){_this.props.changeSearchKey(evt.q);}else if(evt.sortBy){// Sorting key changed
var isDesc=evt.sortBy===_this.props.certlist.sortBy&&_this.props.certlist.sortDir==='asc';_this.props.changeSortKey(evt.sortBy,isDesc);}else if(evt.target.value){// Rows per page changed
_this.props.updatePagination(Object(objectSpread["a" /* default */])({},_this.props.certlist,{pageNumber:1,pageSize:evt.target.value}));}else if(lodash_default.a.isNumber(page)){// Page number changed
_this.props.updatePagination(Object(objectSpread["a" /* default */])({},_this.props.certlist,{pageNumber:page+1}));}_this.setState({tableChanged:true});});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleActions",function(actionType,selectedRows,input){var queryFilter='';var data=null;//TODO: figure out what to do with certify-remaining
if(actionType.includes('all')){queryFilter='true';}else{selectedRows.map(function(row,index){if(index+1===selectedRows.length){queryFilter+="(_id eq \"".concat(row,"\")");}else{queryFilter+="(_id eq \"".concat(row,"\") or");}});}if(actionType==='reassign-tasks'||actionType==='reassign-all'){data={newCertifierId:input};}_this.props.updateTakingAction(true);_this.props.changeActiveGovernanceDialog('GovernanceTableDialog');_this.props.changeDialogType('actionSubmitting');_this.props.certActionStage(actionType,queryFilter,data).finally(function(){_this.props.changeActiveGovernanceDialog(null);_this.props.updateTakingAction(false);_this.props.changeDialogType(null);if(actionType==='sign-off'){_this.props.history.push('/my-tasks');}});});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleRowActions",function(evt,id,noShow){evt.stopPropagation();if(!noShow){_this.props.setSelectedEventIndex(id,true);_this.props.getEventDetails();_this.setState({showEventDetails:true});}});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"updateTableData",function(){var _this$props$certlist=_this.props.certlist,results=_this$props$certlist.results,stageSelected=_this$props$certlist.stageSelected;_this.setState({tableData:results.stages[stageSelected].events});});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"handleClose",function(){_this.setState({showEventDetails:false});_this.props.removeEventDetails();_this.props.getCertificationList();});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getIconFromOutcome",function(outcome,status){var _this$props2=_this.props,classes=_this$props2.classes,certlist=_this$props2.certlist,t=_this$props2.t;var isAdminView=certlist.isAdminView;var icon='';var tooltipText='';if(!outcome&&!status){tooltipText='incomplete';icon=/*#__PURE__*/react_default.a.createElement(RadioButtonUnchecked_default.a,{visibility:"hidden",className:classes.incompleteIcon});}else if(status==='in-progress'||status==='reviewed'||status==='signed-off'){var signedOffIcon=!isAdminView||isAdminView&&status==='signed-off';var signedOffText=status==='signed-off';switch(outcome){case null:tooltipText='incomplete';icon=/*#__PURE__*/react_default.a.createElement(RadioButtonUnchecked_default.a,{className:classes.incompleteIcon});break;case'certify':tooltipText=signedOffText?'certify-signed-off':'certify';icon=signedOffIcon?/*#__PURE__*/react_default.a.createElement(CheckCircle_default.a,{className:classes.certifyIcon}):/*#__PURE__*/react_default.a.createElement(CheckCircleOutline_default.a,{className:classes.certifyIcon});break;case'revoke':tooltipText=signedOffText?'revoke-signed-off':'revoke';icon=signedOffIcon?/*#__PURE__*/react_default.a.createElement(RemoveCircle_default.a,{className:classes.revokeIcon}):/*#__PURE__*/react_default.a.createElement(RemoveCircleOutline_default.a,{className:classes.revokeIcon});break;case'abstain':tooltipText=signedOffText?'abstain-signed-off':'abstain';icon=signedOffIcon?/*#__PURE__*/react_default.a.createElement(Help_default.a,{className:classes.abstainIcon}):/*#__PURE__*/react_default.a.createElement(HelpOutline_default.a,{className:classes.abstainIcon});break;default:}}else{tooltipText=status;switch(status){case'certify':icon=/*#__PURE__*/react_default.a.createElement(CheckCircle_default.a,{className:classes.certifyIcon});break;case'revoke':icon=/*#__PURE__*/react_default.a.createElement(RemoveCircle_default.a,{className:classes.revokeIcon});break;case'abstain':icon=/*#__PURE__*/react_default.a.createElement(NotInterested_default.a,{className:classes.abstainIcon});break;case'cancelled':icon=/*#__PURE__*/react_default.a.createElement(Clear_default.a,{className:classes.incompleteIcon});break;case'no-certifier':icon=/*#__PURE__*/react_default.a.createElement(HelpOutline_default.a,{className:classes.incompleteIcon});break;case'pending':icon=/*#__PURE__*/react_default.a.createElement(HourglassEmpty_default.a,{className:classes.incompleteIcon});break;case'expired':icon=/*#__PURE__*/react_default.a.createElement(TimerOff_default.a,{className:classes.incompleteIcon});break;}}icon=/*#__PURE__*/react_default.a.createElement(Tooltip["a" /* default */],{placement:"top",title:t('tooltip-'+tooltipText),"aria-label":"iconTip"},icon);return icon;});Object(defineProperty["a" /* default */])(Object(assertThisInitialized["a" /* default */])(Object(assertThisInitialized["a" /* default */])(_this)),"getBulkActions",function(){var certlist=_this.props.certlist;var stageSelected=certlist.stageSelected,isAdminView=certlist.isAdminView;var stages=certlist.results.stages;if(isAdminView&&stages[stageSelected].certifierType!=='entitlementOwner'){return['reassign-all','reassign-tasks'];}if(!stages[stageSelected].actions){return[];}var actions=lodash_default.a.cloneDeep(stages[stageSelected].actions);if(actions.includes('claim')){lodash_default.a.remove(actions,function(n){return n==='claim';});actions.push('claim-all');actions.push('claim-selected');}if(actions.includes('certify-remaining')){lodash_default.a.remove(actions,function(n){return n==='certify-remaining';});actions.push('certify-all');actions.push('certify-selected');}if(actions.includes('reset')){lodash_default.a.remove(actions,function(n){return n==='reset';});}actions.push('reset-all');actions.push('reset-selected');return actions;});return _this;}Object(createClass["a" /* default */])(CertificationList,[{key:"componentDidMount",value:function componentDidMount(){var _this2=this;var isAdminView=this.props.match.path.includes('admin');var params=query_string_default.a.parse(this.props.location.search);this.props.changeSelectedStage(0,utils_constants.DO_NOT_UPDATE);this.props.setUserAdmin(isAdminView);if(!isAdminView&&params.actingId&&params.status){this.props.updateStatus(params.status);this.props.updateActingId(params.actingId);this.props.updateCertId(this.props.match.params.id,this.props.match.params.type,utils_constants.DO_NOT_UPDATE);}else{this.props.updateCertId(this.props.match.params.id,this.props.match.params.type,utils_constants.DO_NOT_UPDATE);}this.setState({loading:true});this.props.getCertificationList().finally(function(){_this2.setState({loading:false});_this2.setTableCols();_this2.props.changeSelectedStage(_this2.props.certlist.results.firstEventStage||0,utils_constants.DO_NOT_UPDATE);});}},{key:"componentDidUpdate",value:function componentDidUpdate(prevProps){var params=query_string_default.a.parse(this.props.location.search);if(this.props.certlist.actingId!==params.actingId){this.props.updateActingId(params.actingId);}}},{key:"componentWillUnmount",value:function componentWillUnmount(){this._isMounted=false;this.props.changeSearchKey(null,utils_constants.DO_NOT_UPDATE);this.props.updatePagination({pageNumber:1,pageSize:this.props.certlist.pageSize,stageSelected:0,ascOrder:!utils_constants.IS_DESC,sortBy:'firstName'},utils_constants.DO_NOT_UPDATE);}},{key:"getCampaignInformation",value:function getCampaignInformation(){var t=this.props.t;var _this$props$certlist2=this.props.certlist,results=_this$props$certlist2.results,stageSelected=_this$props$certlist2.stageSelected;var currentStage=results.stages[stageSelected];var campaignInfo=[{'key':t('campaign-status'),'value':results.status}];if(this.isAdminView()){campaignInfo.push({'key':t('progress'),'value':results.totalEventsComplete+' '+t('of')+' '+results.totalEventCount});if(results.systemMessages&&results.systemMessages.info){lodash_default.a.forEach(results.systemMessages.info,function(error){campaignInfo.push({'key':t('error'),'value':t(error.message)});});}var openCertifierValue=lodash_default.a.map(currentStage.openCertifiers,'displayName').join(', ');var closedCertifierValue=lodash_default.a.map(currentStage.closedCertifiers,'displayName').join(', ');if(openCertifierValue!==''){campaignInfo.push({'key':'Active Certifiers','value':openCertifierValue// Change to stage
});}if(closedCertifierValue!==''){campaignInfo.push({'key':'Completed Certifiers','value':closedCertifierValue// Change to stage
});}}return campaignInfo;}},{key:"getStageInformation",value:function getStageInformation(){var results=this.props.certlist.results;if(this.isAdminView()){return results.stages;}else{return results.totals;}}},{key:"isAdminView",value:function isAdminView(){if(this.props.match==undefined){return false;}var url=this.props.match.url;if(lodash_default.a.startsWith(url,'/certificationList')){return false;}else if(lodash_default.a.startsWith(url,'/adminCertList')){return true;}}},{key:"render",value:function render(){var _this$props3=this.props,certlist=_this$props3.certlist,classes=_this$props3.classes,t=_this$props3.t;var status=certlist.results.status;var pageNumber=certlist.pageNumber,pageSize=certlist.pageSize,querying=certlist.querying,queryingMetadata=certlist.queryingMetadata,results=certlist.results;var stages=certlist.results.stages;var stageSelected=certlist.stageSelected;if(results.stages===undefined){return null;}if(this.state.loading){return/*#__PURE__*/react_default.a.createElement(presentational_LoadingIndicator,null);}return/*#__PURE__*/react_default.a.createElement(react["Fragment"],null,/*#__PURE__*/react_default.a.createElement(presentational_PageTitle,{title:results.name,subtitle:results.description}),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.campaignInformation,container:true},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:5},/*#__PURE__*/react_default.a.createElement(presentational_ObjectInformation,{title:t('campaign-information'),infoType:"campaign",isAdmin:this.isAdminView(),campaignInfo:this.getCampaignInformation()})),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:5},/*#__PURE__*/react_default.a.createElement(presentational_ObjectInformation,{title:t('stages-information'),infoType:"stages",isAdmin:this.isAdminView(),campaignInfo:results}))),stages.length>1&&/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{className:classes.buttonContainer,item:true,xs:12},/*#__PURE__*/react_default.a.createElement(presentational_StageStepper,{stagesParent:certlist.results,onlyChangeActive:false,activeStage:certlist.stageSelected,changeSelectedStage:this.changeSelectedStage,altLabel:true})),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:classes.container,justify:"center"},/*#__PURE__*/react_default.a.createElement(presentational_GovernanceTable,{tableCols:this.state.tableCols,tableData:stages[stageSelected].events,sortBy:this.props.certlist.sortBy,sortDir:this.props.certlist.sortDir,bulkActions:this.getBulkActions(),useBulkActionMenu:!this.props.certlist.isAdminView,rowActions:this.state.rowActions,handleActions:this.handleActions,handleRowActions:this.handleRowActions,showNewButton:false,newButtonText:this.state.newButtonText,showCheckboxes:status==='in-progress',hideToolbar:status!=='in-progress',showOutcome:true,pageSize:pageSize,pagedResultsOffset:pageNumber-1,handlePagination:this.onPaginationChange,querying:querying,openComments:false,handleRowClick:this.handleRowActions,tableType:'certList',getIconFromOutcome:this.getIconFromOutcome})),/*#__PURE__*/react_default.a.createElement(CertificationList_EventDetails,{open:this.state.showEventDetails,eventDetails:this.props.eventDetails,queryingEventDetails:this.props.queryingEventDetails,queryingMetadata:queryingMetadata,handleClose:this.handleClose,events:stages[stageSelected].events,getIconFromOutcome:this.getIconFromOutcome}));}}]);return CertificationList;}(react["Component"]);var CertificationList_mapStateToProps=function mapStateToProps(state){var certlist=state.certlist,auth=state.auth;return{certlist:certlist,auth:auth};};var CertificationList_mapDispatchToProps={changeSelectedStage:certlist_actions_changeSelectedStage,changeSortKey:certlist_actions_changeSortKey,getCertificationList:certlist_actions_getCertificationList,updatePagination:certlist_actions_updatePagination,updateCertId:certlist_actions_updateCertId,changeSearchKey:certlist_actions_changeSearchKey,setSelectedEventIndex:certlist_actions_setSelectedEventIndex,removeEventDetails:certlist_actions_removeEventDetails,setUserAdmin:certlist_actions_setUserAdmin,certActionStage:certlist_actions_certActionStage,updateActingId:certlist_actions_updateActingId,getEventDetails:certlist_actions_getEventDetails,changeActiveGovernanceDialog:generic_actions_changeActiveGovernanceDialog,changeModalObject:generic_actions_changeModalObject,updateTakingAction:generic_actions_updateTakingAction,changeDialogType:generic_actions_changeDialogType,updateStatus:certlist_actions_updateStatus};/* harmony default export */ var containers_CertificationList_CertificationList = (Object(redux["d" /* compose */])(Object(es["b" /* connect */])(CertificationList_mapStateToProps,CertificationList_mapDispatchToProps),Object(react_i18next_dist_es["b" /* withTranslation */])(),Object(withStyles["a" /* default */])(CertificationList_styles))(CertificationList_CertificationList));
// CONCATENATED MODULE: ./src/components/containers/CertificationList/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 *//* harmony default export */ var containers_CertificationList = (containers_CertificationList_CertificationList);
// CONCATENATED MODULE: ./src/App.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */var App_App=/*#__PURE__*/function(_Component){Object(inherits["a" /* default */])(App,_Component);function App(){Object(classCallCheck["a" /* default */])(this,App);return Object(possibleConstructorReturn["a" /* default */])(this,Object(getPrototypeOf["a" /* default */])(App).apply(this,arguments));}Object(createClass["a" /* default */])(App,[{key:"componentDidMount",value:function componentDidMount(){var _this=this;if(!this.props.authModule||this.props.authModule!=='AM'){this.props.getAuthenticationModule().then(function(){_this.props.checkIfAuthenticated();});}else{this.props.checkIfAuthenticated();}}},{key:"componentDidUpdate",value:function componentDidUpdate(prevProps){var props=this.props;var IDM_version=props.IDM_version,isLoggedIn=props.isLoggedIn,checkIfAuthenticated=props.checkIfAuthenticated,getIDMVersion=props.getIDMVersion,getManagedObjectConfig=props.getManagedObjectConfig,getMembershipProperties=props.getMembershipProperties,setIsDrawerOpen=props.setIsDrawerOpen,history=props.history,managed_objects=props.managed_objects;if(!IDM_version){getIDMVersion();}if(!prevProps.isLoggedIn&&isLoggedIn){if(prevProps.location.pathname==='/login'){getMembershipProperties();getManagedObjectConfig();setIsDrawerOpen(true);}if(this.props.authorization.component==='internal/user'){setIsDrawerOpen(false);history.push('/access-denied');}}else if(!isLoggedIn&&props.location.pathname!=='/login'){checkIfAuthenticated().then(function(result){if(!result){setIsDrawerOpen(false);history.push('/login');}});}if(prevProps.location!==this.props.location){if(this.props.authorization.component==='internal/user'){history.push('/access-denied');}}if(!managed_objects){getManagedObjectConfig();}}},{key:"render",value:function render(){var _this$props=this.props,isLoggedIn=_this$props.isLoggedIn,t=_this$props.t;if(this.props.auth&&this.props.auth.authorization&&this.props.auth.authorization.component==='internal/user'){this.props.history.push('/access-denied');}return/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{container:true,className:"App"},/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,xs:12},/*#__PURE__*/react_default.a.createElement(containers_NavBar,null)),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true}),/*#__PURE__*/react_default.a.createElement(Grid["a" /* default */],{item:true,className:Object(clsx_m["a" /* default */])('mainContent',this.props.isDrawerOpen&&'contentShift')},/*#__PURE__*/react_default.a.createElement("main",null,/*#__PURE__*/react_default.a.createElement(containers_PrivateRoute,{path:"/login/:oidc?",component:containers_Login}),isLoggedIn&&/*#__PURE__*/react_default.a.createElement(presentational_CreateModal,null),/*#__PURE__*/react_default.a.createElement(containers_PrivateRoute,{path:"/my-tasks",component:containers_Dashboard}),/*#__PURE__*/react_default.a.createElement(containers_PrivateRoute,{path:"/admin/dashboard",component:containers_AdminDashboard}),/*#__PURE__*/react_default.a.createElement(containers_PrivateRoute,{path:"/admin/certifications/:type",component:containers_Certifications}),/*#__PURE__*/react_default.a.createElement(containers_PrivateRoute,{path:"/admin/policies",component:containers_Policies}),/*#__PURE__*/react_default.a.createElement(containers_PrivateRoute,{path:"/admin/notification-templates/:id",component:containers_NotificationDetails_NotificationDetails}),/*#__PURE__*/react_default.a.createElement(containers_PrivateRoute,{path:"/admin/system-settings",component:containers_Settings}),/*#__PURE__*/react_default.a.createElement(containers_PrivateRoute,{exact:true,path:"/admin/notification-templates",component:containers_Notifications}),/*#__PURE__*/react_default.a.createElement(containers_PrivateRoute,{exact:true,path:"/admin/user-summary",component:containers_UserSummary}),/*#__PURE__*/react_default.a.createElement(containers_PrivateRoute,{path:"/admin/user-summary/:id",component:containers_UserSummary}),/*#__PURE__*/react_default.a.createElement(containers_PrivateRoute,{path:"/access-denied",component:containers_AccessDenied}),/*#__PURE__*/react_default.a.createElement(containers_PrivateRoute,{path:"/certificationList/:type/:id",component:containers_CertificationList}),/*#__PURE__*/react_default.a.createElement(containers_PrivateRoute,{path:"/adminCertList/:type/:id",component:containers_CertificationList}),/*#__PURE__*/react_default.a.createElement(containers_PrivateRoute,{path:"/glossaryAdmin/glossary-editor",component:presentational_Frame,props:{url:utils_constants.IDM_URL.concat('/commons'),title:t('page-glossary-editor')}}),/*#__PURE__*/react_default.a.createElement(react_router["b" /* Route */],{exact:true,path:"/",render:function render(){return/*#__PURE__*/react_default.a.createElement(react_router["a" /* Redirect */],{to:"/my-tasks"});}}))),/*#__PURE__*/react_default.a.createElement(utils_Notifier,null));}}]);return App;}(react["Component"]);var App_mapStateToProps=function mapStateToProps(state){var _state$auth=state.auth,authModule=_state$auth.authModule,isLoggedIn=_state$auth.isLoggedIn,authenticationId=_state$auth.authenticationId,roles=_state$auth.roles,authorization=_state$auth.authorization,isDrawerOpen=state.generic.isDrawerOpen,_state$config=state.config,IDM_version=_state$config.IDM_version,managed_objects=_state$config.managed_objects;return{authModule:authModule,isLoggedIn:isLoggedIn,authenticationId:authenticationId,roles:roles,isDrawerOpen:isDrawerOpen,authorization:authorization,IDM_version:IDM_version,managed_objects:managed_objects};};var App_mapDispatchToProps={getIDMVersion:config_actions_getIDMVersion,getAuthenticationModule:auth_actions_getAuthenticationModule,checkIfAuthenticated:auth_actions_checkIfAuthenticated,logoutUser:auth_actions_logoutUser,setIsDrawerOpen:generic_actions_setIsDrawerOpen,getManagedObjectConfig:config_actions_getManagedObjectConfig,getMembershipProperties:config_actions_getMembershipProperties};/* harmony default export */ var src_App = (Object(es["b" /* connect */])(App_mapStateToProps,App_mapDispatchToProps)(Object(react_i18next_dist_es["b" /* withTranslation */])()(App_App)));
// CONCATENATED MODULE: ./src/serviceWorker.js
// This optional code is used to register a service worker.
// register() is not called by default.
// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on subsequent visits to a page, after all the
// existing tabs open on the page have been closed, since previously cached
// resources are updated in the background.
// To learn more about the benefits of this model and instructions on how to
// opt-in, read https://bit.ly/CRA-PWA
var isLocalhost=Boolean(window.location.hostname==='localhost'||// [::1] is the IPv6 localhost address.
window.location.hostname==='[::1]'||// 127.0.0.1/8 is considered localhost for IPv4.
window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));function register(config){if( true&&'serviceWorker'in navigator){// The URL constructor is available in all browsers that support SW.
var publicUrl=new URL("/governance",window.location.href);if(publicUrl.origin!==window.location.origin){// Our service worker won't work if PUBLIC_URL is on a different origin
// from what our page is served on. This might happen if a CDN is used to
// serve assets; see https://github.com/facebook/create-react-app/issues/2374
return;}window.addEventListener('load',function(){var swUrl="".concat("/governance","/service-worker.js");if(isLocalhost){// This is running on localhost. Let's check if a service worker still exists or not.
checkValidServiceWorker(swUrl,config);// Add some additional logging to localhost, pointing developers to the
// service worker/PWA documentation.
navigator.serviceWorker.ready.then(function(){// eslint-disable-next-line
console.log('This web app is being served cache-first by a service '+'worker. To learn more, visit https://bit.ly/CRA-PWA');});}else{// Is not localhost. Just register service worker
registerValidSW(swUrl,config);}});}}function registerValidSW(swUrl,config){navigator.serviceWorker.register(swUrl).then(function(registration){registration.onupdatefound=function(){var installingWorker=registration.installing;if(installingWorker==null){return;}installingWorker.onstatechange=function(){if(installingWorker.state==='installed'){if(navigator.serviceWorker.controller){// At this point, the updated precached content has been fetched,
// but the previous service worker will still serve the older
// content until all client tabs are closed.
// eslint-disable-next-line
console.log('New content is available and will be used when all '+'tabs for this page are closed. See https://bit.ly/CRA-PWA.');// Execute callback
if(config&&config.onUpdate){config.onUpdate(registration);}}else{// At this point, everything has been precached.
// It's the perfect time to display a
// "Content is cached for offline use." message.
// eslint-disable-next-line
console.log('Content is cached for offline use.');// Execute callback
if(config&&config.onSuccess){config.onSuccess(registration);}}}};};}).catch(function(error){// eslint-disable-next-line
console.error('Error during service worker registration:',error);});}function checkValidServiceWorker(swUrl,config){// Check if the service worker can be found. If it can't reload the page.
fetch(swUrl).then(function(response){// Ensure service worker exists, and that we really are getting a JS file.
var contentType=response.headers.get('content-type');if(response.status===404||contentType!=null&&contentType.indexOf('javascript')===-1){// No service worker found. Probably a different app. Reload the page.
navigator.serviceWorker.ready.then(function(registration){registration.unregister().then(function(){window.location.reload();});});}else{// Service worker found. Proceed as normal.
registerValidSW(swUrl,config);}}).catch(function(){// eslint-disable-next-line
console.log('No internet connection found. App is running in offline mode.');});}function unregister(){if('serviceWorker'in navigator){navigator.serviceWorker.ready.then(function(registration){registration.unregister();});}}
// CONCATENATED MODULE: ./src/index.js
/*
 * Copyright 2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
*/ // polyfill imports must come BEFORE all other imports.  support IE 11.
// @material-ui/pickers is an add-on library for date/time pickers
var src_history=Object(esm_history["b" /* createHashHistory */])();httpService.setupInterceptors(src_store,src_history);// add action to all snackbars
var notistackRef=react_default.a.createRef();var onClickDismiss=function onClickDismiss(key){return function(){notistackRef.current.closeSnackbar(key);};};var arApp=/*#__PURE__*/react_default.a.createElement(es["a" /* Provider */],{store:src_store},/*#__PURE__*/react_default.a.createElement(react_router["c" /* Router */],{history:src_history},/*#__PURE__*/react_default.a.createElement(ThemeProvider["a" /* default */],{theme:styles_theme},/*#__PURE__*/react_default.a.createElement(useUtils_cfb96ac9["a" /* M */],{utils:index_esm["a" /* default */]},/*#__PURE__*/react_default.a.createElement(notistack_esm["a" /* SnackbarProvider */],Object(objectSpread["a" /* default */])({},clientConfig_default.a.alert.baseProps,{ref:notistackRef,action:function action(key){return/*#__PURE__*/react_default.a.createElement(IconButton["a" /* default */],{key:"close","aria-label":"close",color:"inherit",onClick:onClickDismiss(key)},/*#__PURE__*/react_default.a.createElement(Close_default.a,{style:{fontSize:20}}));}}),/*#__PURE__*/react_default.a.createElement(CssBaseline["a" /* default */],null),/*#__PURE__*/react_default.a.createElement(react_router["b" /* Route */],{component:src_App}))))));var src_authCallback=function authCallback(){react_dom_default.a.render(arApp,document.getElementById('root'));};httpService.getUiConfig(src_store,src_authCallback);// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
unregister();

/***/ }),

/***/ 64:
/***/ (function(module, exports) {

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
This file is for frontend utilities that are shared across applications.
*/

/**
 * Just a function that adds a prefix to all values in a dictionary.  Only used for frontend actionType making.
 *
 * @param      {string}  prefix_string  The prefix to put in front of each value
 * @param      {array}  list           The list of values
 * @return     {object}  The dictionary of keys and prefixed values
 */
function prefix(prefix_string, list) {
  var action_type_object = {};

  var _iterator = _createForOfIteratorHelper(list),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var string = _step.value;
      action_type_object[string] = '' + prefix_string + '/' + string;
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  return action_type_object;
}

module.exports = {
  prefix: prefix
};

/***/ })

},[[330,1,2]]]);
//# sourceMappingURL=main.3a6184f4.chunk.js.map