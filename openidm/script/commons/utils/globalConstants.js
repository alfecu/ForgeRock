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
var _ = require('../lib/lodash4.js');

// idm constants
// Regex that matches IDM id format, such as 35985500-57c9-4653-bc44-4542310f3b5f
// An IDM _id consists of 8 hexademical digits, then a dash, then 4 dash 4 dash 4 dash 12.
var ID_SUB_PATTERN = '[a-f\\d]{8}-[a-f\\d]{4}-[a-f\\d]{4}-[a-f\\d]{4}-[a-f\\d]{12}';
var ID_PATTERN = new RegExp('^' + ID_SUB_PATTERN + '$');
var MANAGED_OBJECT_ID_PATTERN = new RegExp('^managed/.*/' + ID_SUB_PATTERN + '$');

// Regex that matches activiti user task id format, such as 1127
var USER_TASK_ID_PATTERN = /^\d+$/;

// the moment.js format specification of the date strings that IDM uses
// example formatted date: 2019-08-03T04:00:00.000Z
var DATE_STRING_FORMAT = 'YYYY-MM-DD[T]HH[:]mm[:]ss[.]SSS[Z]';

// a list of all types that appear across all our constraints.
var TYPES = [
  'string',
  'boolean',
  'integer',
  'id',
  'managed object id',
  'object',
  'array',
  'date string',
];
// a sublist of TYPES which includes only the NON-scalar types.  Corresponding values need to be JSON-stringified on export.
var NONSCALAR_TYPES = [
  'object',
  'array',
];

// idm methods
var IDM_METHOD = {
  READ: 'READ',
  QUERY: 'QUERY',
};

// glossary stuff
var GLOSSARY_CLASS_TO_UNIQUE_KEY_COMBINATION = {
  'identity': ['class', 'attributeName'],
  'identity-value': ['class', 'attributeName', 'attributeValue'],
  // there should only be one glossary object of type 'object' for any given objectId, but that is enforced in glossaryCRUD
  'object': ['class', 'objectId'],
  'system': ['class', 'name'],
  'system-attribute': ['class', 'system', 'attributeName'],
  'system-value': ['class', 'system', 'attributeName', 'attributeValue'],
  'requestable-item-bundle': ['class', 'name'],
};
var GLOSSARY_CLASSES = _.keys(GLOSSARY_CLASS_TO_UNIQUE_KEY_COMBINATION);
// There is a natural dependency structure of glossary objects of different types.
var GLOSSARY_CLASS_DEPENDENCY_ORDER = [
  // 'identity' must exist before an 'identity-value' that refers to it
  'identity',
  'identity-value',
  // 'system' must exist before 'system-attribute' which must exist before 'system-value'
  'system',
  'system-attribute',
  'system-value',
  // requestable items should exist before bundles that refer to them
  'object',
  'requestable-item-bundle',
];
var GLOSSARY_KEY_PRIORITIZATION_ORDER = ['_id', 'class', 'name', 'system', 'attributeName', 'attributeValue', 'objectId', 'requestable', 'type', 'objectType', 'order', 'idgOwner', 'certifiable', 'displayable', 'riskLevel'];
var GLOSSARY_LAST_KEY_ORDER = [''];


// roles
var ROLE = {
  IDM_AUTHORIZED: 'openidm-authorized',
  IDM_ADMIN: 'openidm-admin',
  AR_ADMIN: 'access-request-admin',
  GOV_ADMIN: 'governance-administrator',
  // for glossary stuff only (not necc other commons stuff)
  GLOSSARY_ADMIN: 'glossary-admin',
};

// query filter constants (only simple constants here.  See queryFilter.js for more complex filters)
var QUERY_FILTER = {
  TRUE: 'true',
  FALSE: 'false',
};

// resource path constants
var RESOURCE_PATH = {
  GLOSSARY: 'repo/glossary/',
  MANAGED: 'managed/',
};

// The amount of time to wait before firing an event when debouncing a typeahead (frontend only)
var DEBOUNCE_TYPEAHEAD_WAIT_TIME = 250;

// The default type of a managed object, currently only used for GUI managed object searching
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
  DEFAULT_MANAGED_OBJECT_TYPE: DEFAULT_MANAGED_OBJECT_TYPE,
};
