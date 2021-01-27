/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
Glossary-specific utilities.
*/
var _ = require('../lib/lodash4.js');
var Papa = require('../lib/papaparse.js');

var qf = require('./queryFilterBuilder.js');
var __ = require('./jsUtils.js');
var CONSTANT = require('./globalConstants.js');
var commonUtils = require('./commonUtils.js');
var glossaryConstraints = require('./glossaryConstraints.js');
var validate = require('./glossaryValidators.js');
var glossaryCRUD = require('./glossaryCRUD.js');
var managedObjectUtils = require('./managedObjectUtils.js');


// FUNCTIONS
function isClassFactory(classname) {
  // filter functions for the class of a glossary object
  return function(obj) {
    return obj.class === classname;
  };
}

function populateRequiredKeys(obj, blank_value) {
  // Given a glossary object, populate it's required keys (except _id) with a blank value if the key doesn't already exist
  var required_keys = _.difference(validate.getRequiredKeys(obj['class']), ['_id']);
  required_keys.forEach(function(required_key) {
    if (!obj.hasOwnProperty(required_key)) {
      obj[required_key] = blank_value;
    }
  });
}

function getNewObjectTemplate(_class) {
  // Returns an object (not stored in db) with some values filled in.
  // Used in the GUI when creating a new object.
  var new_obj = {};
  new_obj['class'] = _class;
  var blank_value = '';
  // Put in some blank values
  populateRequiredKeys(new_obj, blank_value);
  // For keys present so far, fill in default values
  commonUtils.defaultToDefaultValues(new_obj, glossaryConstraints[_class], blank_value);
  return new_obj;
}

function getGlossaryObjectForManagedObject(object_id) {
  return getGlossaryObjectForEntitlement(object_id);
}

function getGlossaryObjectForRole(role_id) {
  return getGlossaryObjectForManagedObject(role_id);
}

function getGlossaryObjectForEntitlement(entitlement_id) {
  var queryFilter = getGlossaryQueryFilter(entitlement_id);
  var role_glossary_obj = null;
  var queryParams = {
    _queryFilter: queryFilter,
  };
  var response = glossaryCRUD.queryObjs(queryParams);
  if (response && response.result && response.result[0]) {
    role_glossary_obj = response.result[0];
  }
  return role_glossary_obj;
}

function getDisplayableGlossaryObjectForEntitlement(object_id) {
  var glossary_object = getGlossaryObjectForEntitlement(object_id);
  var displayable_object = glossary_object ? managedObjectUtils.addDisplayNamesToGlossaryItem(glossary_object, {}) : {};

  return displayable_object;
}

function getGlossaryQueryFilter(id) {
  if (_.startsWith(id, 'managed/')) {
    return 'class eq "object" and objectId eq "' + id + '"';
  }
  else if (_.startsWith(id, 'system/') || _.startsWith(id, 'system-attribute/') || _.startsWith(id, 'system-value/')) {
    var split = id.split('/');
    var glossaryClass = split[0];
    var system = split[1] || null;
    var attr = split[2] || null;
    var value = split[3] || null;
    return 'class eq "' + glossaryClass + '"' +
      (system ? ' and system eq "' + system + '"' : '') + 
      (attr ? ' and attributeName eq "' + attr + '"' : '') + 
      (value ? ' and attributeValue eq "' + value + '"' : '');
  }
  else {
    var split = id.split('/');
    var attr = split[0] || null;
    var value = split[1] || null;
    var glossaryClass = value ? 'identity-value' : 'identity'
    return 'class eq "' + glossaryClass + '"' + 
      (attr ? ' and attributeName eq "' + attr + '"' : '') + 
      (value ? ' and attributeValue eq "' + value + '"' : '');
  }
};

function doesKeyHaveFiniteValues(key, _class) {
  if (_.isUndefined(_class)) {
    __.requestError('_class argument undefined', 500);
  }
  var constraints = glossaryConstraints[_class];
  return commonUtils.doesKeyHaveFiniteValues(key, constraints);
}

function getFiniteValuesForKey(key, _class) {
  var constraints = glossaryConstraints[_class];
  return commonUtils.getFiniteValuesForKey(key, constraints);
}

function typeCastedGlossaryObjectValues(glossary_obj) {
  // Given a glossary object who's values are user-inputted strings, try to typecast each value to what it should be based on the constraints.
  var _class = glossary_obj['class'];
  validate.class(_class);
  var obj_constraint = glossaryConstraints[_class];
  var new_glossary_obj = commonUtils.typeCastObjectValues(glossary_obj, obj_constraint);
  return new_glossary_obj;
}

function getTypeOfPropertyInGlossaryObject(key, glossary_object) {
  var builtin_constraints = glossaryConstraints[glossary_object.class];
  var local_constraints = glossary_object['constraints'];
  return commonUtils.getTypeFromConstraintsObject(key, builtin_constraints) ||
      commonUtils.getTypeFromConstraintsObject(key, local_constraints) ||
      __.requestError('Key ' + key + ' has no type information. Every key needs type information in constraints', 500);
}

/**
 * Given a glossary key, is the corresponding value non scalar (such as an object or array) so that it needs to be JSON stringified for export/import
 */
function doesKeyHaveNonscalarValue(key, glossary_object) {
  var value_type = getTypeOfPropertyInGlossaryObject(key, glossary_object);
  return _.includes(CONSTANT.NONSCALAR_TYPES, value_type);
}

function doesKeyHaveManagedObjectIdValue(key, glossary_object) {
  var value_type = getTypeOfPropertyInGlossaryObject(key, glossary_object);
  return value_type === 'managed object id';
}

function doesKeyHaveArrayValue(key, glossary_object) {
  var value_type = getTypeOfPropertyInGlossaryObject(key, glossary_object);
  return value_type === 'array';
}

function glossaryObjectToCSVObject(glossary_object) {
  // takes in a glossary object and outputs a csv object that can be used to generate a row in the csv file
  var csv_object = __.clonedDeep(glossary_object);
  // We don't need the _id nor _rev and they would only cause problems
  delete csv_object['_id'];
  delete csv_object['_rev'];
  // transform some values
  for (var key in csv_object) {
    var value = csv_object[key];
    // values of undefined will become the STRING "undefined"
    if (value === undefined) {
      csv_object[key] = "undefined";
    }
    // values of null will become the STRING "null"
    else if (value === null) {
      csv_object[key] = "null";
    }
    // managed object ids must be transformed to an export id
    else if (doesKeyHaveManagedObjectIdValue(key, glossary_object)) {
      csv_object[key] = commonUtils.getExportIdFromManagedObjectId(value);
    }
    // Papaparse does not support values that are dictionaries, so we'll use JSON.stringify immediately before using Papa
    else if (doesKeyHaveNonscalarValue(key, glossary_object)) {
      csv_object[key] = JSON.stringify(value);
    }
  }
  return csv_object;
}

function csvObjectToGlossaryObject(csv_object) {
  // Takes in a csv object that came from a CSV file and outputs a glossary object.
  var glossary_object = __.clonedDeep(csv_object);
  // transform some values
  // we MUST transform CONSTRAINTS first, because it will be used for doesKeyHaveNonscalarValue below
  glossary_object['constraints'] = JSON.parse(glossary_object['constraints']);
  for (var key in glossary_object) if (key !== 'constraints') {
    var value = glossary_object[key];
    // blank values will be ommitted entirely
    if (value === null) {
      delete glossary_object[key];
    }
    // values of "null" will become an actual null
    else if (value === "null") {
      glossary_object[key] = null;
    }
    // values of "undefined" will become an actual undefined
    else if (value === "undefined") {
      glossary_object[key] = undefined;
    }
    // export ids must be transformed back to managed object ids
    else if (doesKeyHaveManagedObjectIdValue(key, glossary_object)) {
      var managed_object_id = commonUtils.getManagedObjectIdFromExportId(value);
      glossary_object[key] = managed_object_id;
    }
    // for arrays, we need to explicitly typecast them, otherwise they will become objects like {"0": "hi", "1": "there"}
    else if (doesKeyHaveArrayValue(key, glossary_object)) {
      glossary_object[key] = _.toArray(JSON.parse(value));
    }
    // Papaparse does not support values that are dictionaries, so we'll use JSON.parse immediately after using Papa to restore those
    else if (doesKeyHaveNonscalarValue(key, glossary_object)) {
      glossary_object[key] = JSON.parse(value);
    }
  }
  return glossary_object;
}

function csvObjectsToCSV(objects, col_precedence) {
  // collect all column names
  var col_names = [];
  objects.forEach(function(object) {
    for (var key in object) {
      col_names.push(key);
    }
  });
  // guarantee col names are unique and in the appropriate order
  var unique_col_names = _.uniq(col_names);
  var header_col_names = __.sortedByPrecedence(unique_col_names, col_precedence);
  // generate the header and row data for Papa
  // see https://www.papaparse.com/docs#json-to-csv
  var data = {
    fields: header_col_names,
    data: objects,
  };
  var unparse_config = {
    skipEmptyLines: 'greedy',
    linebreak: '\n',
  };
  var csv_string = Papa.unparse(data, unparse_config);
  return csv_string;
}

function csvToCSVObjects(csv_string) {
  var parse_config = {
    // read the first row as header and use as keys
    header: true,
    // converts numeric and boolean values
    dynamicTyping: true,
    skipEmptyLines: 'greedy',
  };
  var parsed = Papa.parse(csv_string, parse_config);
  var csv_objects = parsed.data;
  return csv_objects;
}

function exportGlossaryToCSVString(glossary_objects) {
  var csv_objects = glossary_objects.map(glossaryObjectToCSVObject);
  var csv = csvObjectsToCSV(csv_objects, CONSTANT.GLOSSARY_KEY_PRIORITIZATION_ORDER);
  return csv;
}

// eslint-disable-next-line no-unused-vars
function exportGlossaryToCSVDict(glossary_objects) {
  // Note(ML): Not in use.  Use this if you want to export sorting by glossary object type instead of one big CSV file.
  var csv_dict = {};
  var csv_objects = glossary_objects.map(glossaryObjectToCSVObject);
  CONSTANT.GLOSSARY_CLASSES.forEach(function(classname) {
    var csv_objects_of_class = csv_objects.filter(function(csv_object) {
      return csv_object.class === classname;
    });
    var csv = csvObjectsToCSV(csv_objects_of_class, CONSTANT.GLOSSARY_KEY_PRIORITIZATION_ORDER);
    csv_dict[classname] = csv;
  });
  return csv_dict;
}

/**
 * Import a glossary object into IDM.  This function will catch error so as not to interrupt the import of many glossary objects.
 *
 * @param      {object}  glossary_object  The glossary object to import.
 * @returns    {string|undefined}  Undefined if no error, or the error message string if error.
 */
function importGlossaryObject(glossary_object) {
  try {
    // put the object into the database
    glossaryCRUD.createOrUpdateObj(glossary_object);
    return undefined;
  }
  catch (e) {
    return e.message;
  }
}

/**
 * Import glossary objects into IDM.  This function will catch errors so as not to interrupt the import of many glossary objects.
 *
 * @param      {object}  glossary_objects  The glossary objects to import.
 * @returns    {array}  Array of error messages that occured during import.
 */
function importGlossaryObjects(glossary_objects) {
  var classes_prioritized = __.sortedByPrecedence(CONSTANT.GLOSSARY_CLASSES, CONSTANT.GLOSSARY_CLASS_DEPENDENCY_ORDER);
  var error_messages = [];
  for (var index in classes_prioritized) {
    var _class = classes_prioritized[index];
    // import glossary objects of that class
    var new_error_messages = glossary_objects.filter(isClassFactory(_class)).map(importGlossaryObject);
    error_messages = error_messages.concat(new_error_messages);
  }
  // ignore non-errors
  error_messages = _.compact(error_messages);
  // return an array of errors
  return error_messages
}

function exportToCSV() {
  // validate all glossary objects before export. we really need all data to be valid before we do this
  validateAllGlossaryObjects();
  var glossary_objects = glossaryCRUD.getAllObjs().result;
  return exportGlossaryToCSVString(glossary_objects);
}

function importFromCSV(csv_string) {
  var csv_objects = csvToCSVObjects(csv_string);
  var glossary_objects = csv_objects.map(csvObjectToGlossaryObject);
  return importGlossaryObjects(glossary_objects);
}

function validateAllGlossaryObjects() {
  // validate every glossary object (useful for a developer or admin)
  var response = glossaryCRUD.getAllObjs();
  var objs = response.result;
  objs.forEach(function(obj) {
    validate.object(obj, false);
  });
}

module.exports = {
  doesKeyHaveFiniteValues: doesKeyHaveFiniteValues,
  getFiniteValuesForKey: getFiniteValuesForKey,
  getNewObjectTemplate: getNewObjectTemplate,
  getGlossaryObjectForRole: getGlossaryObjectForRole,
  exportToCSV: exportToCSV,
  importFromCSV: importFromCSV,
  typeCastedGlossaryObjectValues: typeCastedGlossaryObjectValues,
  validateAllGlossaryObjects: validateAllGlossaryObjects,
  getGlossaryObjectForManagedObject: getGlossaryObjectForManagedObject,
  getGlossaryObjectForRole: getGlossaryObjectForRole,
  getGlossaryObjectForEntitlement: getGlossaryObjectForEntitlement,
  getDisplayableGlossaryObjectForEntitlement: getDisplayableGlossaryObjectForEntitlement,
};
