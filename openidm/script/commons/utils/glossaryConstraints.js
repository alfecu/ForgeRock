/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
Data Model / Constraints for glossary objects.

Currently follows the Validate.js (validatejs.org) constraints syntax.
*/
var _ = require('../lib/lodash4.js');

var __ = require('./jsUtils.js');
var CONSTANT = require('./globalConstants.js');

// thing in-common for all glossary objects
var common = {
  _id: {
    presence: true,
    type: 'id',
  },
  // even though we aren't doing anything with _rev, we want to track it here so that our code recognizes it as a builtin constrained key, as opposed to a custom user key
  _rev: {
    // could be missing on new obj, and that's fine
    presence: false,
  },
  class: {
    presence: true,
    type: 'string',
    inclusion: {
      within: CONSTANT.GLOSSARY_CLASSES,
    },
    defaultValue: 'object',
  },
  constraints: {
    presence: true,
    type: 'object',
    defaultValue: {},
  }
};

// glossary identity object
var identity = __.extendedStrict(common, {
  attributeName: {
    presence: true,
    type: 'string',
  },
  certifiable: {
    type: 'boolean',
    defaultValue: true,
  },
  displayable: {
    type: 'boolean',
    defaultValue: true,
  },
});

// glossary identity-value object
// note: this corresponds to the identity object
var identityValue = __.extendedStrict(common, {
  attributeName: {
    presence: true,
    type: 'string',
  },
  attributeValue: {
    presence: true,
  },
});

// glossary 'object' object
var object = __.extendedStrict(common, {
  displayName: {
    // it's possible we will remove this in the future and make an AR-style computed display name
    presence: true,
    type: 'string',
  },
  objectId: {
    // the id of the managed object it references
    presence: true,
    type: 'managed object id',
  },
  order: {
    presence: true,
    type: 'array',
    subType: 'string',
    defaultValue: [],
  },
});

// glossary system object
var system = __.extendedStrict(common, {
  name: {
    presence: true,
    type: 'string',
  },
  riskLevel: {
    type: 'integer',
    numericality: {
      onlyInteger: true,
      // note(ML): Do NOT use the 'greaterThanOrEqualTo' or similar features of numericality in validatejs.  I do not support it.  Use inclusion within range, like below.
    },
    inclusion: {
      within: _.range(1, 10+1),
    },
    defaultValue: 1,
  },
  idgOwner: {
    type: 'managed object id',
  },
  certifiable: {
    presence: false,
    type: 'boolean',
    defaultValue: true,
  },
});

// glossary system-attribute object
var systemAttribute = __.extendedStrict(common, {
  system: {
    presence: true,
    type: 'string',
  },
  objectType: {
    // a 'system' (such as OpenDJ) breaks down into various 'object types' (such as 'account' and 'group')
    // see https://backstage.forgerock.com/docs/idm/6.5/integrators-guide/#object-types
    presence: true,
    type: 'string',
  },
  attributeName: {
    presence: true,
    type: 'string',
  },
  order: {
    presence: true,
    type: 'integer',
    numericality: {
      onlyInteger: true,
    },
    defaultValue: 1,
  },
});

// glossary system-value object
// note: this corresponds to the system-attribute object
var systemValue = __.extendedStrict(common, {
  system: {
    presence: true,
    type: 'string',
  },
  objectType: {
    // a 'system' (such as OpenDJ) breaks down into various 'object types' (such as 'account' and 'group')
    // see https://backstage.forgerock.com/docs/idm/6.5/integrators-guide/#object-types
    presence: true,
    type: 'string',
    defaultValue: '',
  },
  attributeName: {
    presence: true,
    type: 'string',
  },
  attributeValue: {
    presence: true,
  },
});

/**
 * A requestable item bundle is essentially a set of requestable items.  It has it's own name.  It's purpose is so that users can conveniently choose a whole bunch of requestable items at once when creating a request.
 */
var requestableItemBundle = __.extendedStrict(common, {
  name: {
    presence: true,
    type: 'string',
  },
  description: {
    type: 'string',
  },
  itemIds: {
    presence: true,
    type: 'array',
    subType: 'id',
    defaultValue: [],
  },
});


module.exports = {
  common: common,
  identity: identity,
  'identity-value': identityValue,
  object: object,
  system: system,
  'system-attribute': systemAttribute,
  'system-value': systemValue,
  'requestable-item-bundle': requestableItemBundle,
};
