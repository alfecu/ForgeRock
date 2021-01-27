/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
var _ = require('commons/lib/lodash4.js');
var __ = require('commons/utils/jsUtils.js');
var OBJECT_PROPS = null;
var moment = require('commons/lib/moment.js');

run();
function run() {
  var content = request.content;
  if (content.remediationType === 'revokeCertification') {
    var stages = content.stages;
    var stageIndex = content.stageIndex;
    return revokeEntitlementsFromTarget(stages[stageIndex]);
  }
  else if (content.remediationType === 'revokeViolation') {
    return revokeViolationEntitlementsFromTarget(content.targetId, content.expression)
  }
}

// Remediate all relationships/attributes in IDM, and return all revoked metadata/applications that were revoked
function revokeEntitlementsFromTarget(event) {
  var targetId = event.longTargetId;
  var targetType = targetId.split('/')[1];
  OBJECT_PROPS = getManagedObjectProperties(targetType);
  return removeEntitlementsFromCertification(event);
}

//Parse through the certification results, and remediate all revoked access from user
function removeEntitlementsFromCertification(event) {
  var eventData = event.eventData;
  var managedObject = eventData.managedObject;
  var applicationList = eventData.application;
  var metadataList = eventData.metadata;
  var attributesToRemove = [];
  // Iterate over the managed object section of the certification  
  _.forEach(managedObject, function(entry) {
    var entitlementsToCheck = entry.values.length > 0 ? entry.values : [ entry ];
    _.forEach(entitlementsToCheck, function(entitlement) {
      if (entitlement.outcome === 'revoke') {
        if (entitlement.relationshipId) {
          removeRelationship(event.longTargetId, entitlement.relationshipId, (entitlement.fieldValue || entitlement.objectId), entry.objectType);
        }
        else {
          attributesToRemove.push(entitlement);
        }
      }
    });
  });
  var remediated = remediateAttributes(event.longTargetId, attributesToRemove);
  createAuditEntry(event.longTargetId, null, null, _.map(attributesToRemove, 'objectType'), remediated);

  // Iterate over certified applications and filter out any that were revoked
  var revokedApplications = {}
  _.forEach(applicationList, function(application) {
    var attributesToRevoke = _.map(_.filter(application.attributes, {outcome: 'revoke'}), 'attributeName');
    if (attributesToRevoke.length > 0) {
      revokedApplications[application.mapping] = attributesToRevoke;
    }
  });

  // Grab all metadata keys that were revoked in event
  var revokedMetadataKeys = _.map(_.filter(metadataList, {outcome: 'revoke'}), 'attributeName');

  // Return applications to revoke and metadata to revoke for manual removal tasks
  return {
    metadataToRevoke: revokedMetadataKeys,
    applicationToRevoke: revokedApplications,
  }
}

/*
*
* VIOLATION FUNCTIONS
*
*/

function revokeViolationEntitlementsFromTarget(targetId, expression) {
  OBJECT_PROPS = getManagedObjectProperties('user');
  var parsedExpression = JSON.parse(expression);
  var remediationList = [];
  traverseViolationExpression(parsedExpression, remediationList);
  var fieldsToRemediate = _.map(remediationList, 'objectType');
  var userObj = openidm.read(targetId, null, fieldsToRemediate);
  return removeEntitlementsFromViolation(remediationList, targetId, userObj);
}

function removeEntitlementsFromViolation(remediationList, targetId, userObj) {
  var attributesToRemove = [];
  // Iterate over entitlements found in the policy
  _.forEach(remediationList, function(entry) {
    var prop = entry.objectType;
    var value = entry.value;
    if (!OBJECT_PROPS[prop]) {
      return;
    }
    var schemaProp = OBJECT_PROPS[prop];
    // If is a direct relationship (e.g. manager)
    if (schemaProp.type === 'relationship') {
      if(userObj[prop] && userObj[prop]._ref && userObj[prop]._ref === entry.value) {
        // Remove individual relationship
        removeRelationship(targetId, userObj[prop]._refProperties._id, value, prop);
      }
    }
    // Is a multi value relationship (e.g. roles)
    if (schemaProp.type === 'array' && schemaProp.items && schemaProp.items.type === 'relationship') {
      var foundObj = _.find(userObj[prop], { _ref: value});
      if (foundObj) {
        // Remove individual relationship
        removeRelationship(targetId, foundObj._refProperties._id, value, prop);
      }
    }
    // Is a basic attribute (e.g. jobCode, accountStatus)
    else {
      attributesToRemove.push(entry);
    }
  });
  // Remove all regular attributes in single patch operation
  if (attributesToRemove.length > 0) {
    var remediated = remediateAttributes(targetId, attributesToRemove);
    createAuditEntry(targetId, null, null, _.map(attributesToRemove, 'objectType'), remediated);
  }
  return {
    removedAttributes: attributesToRemove
  }
}

// Traverse a violation expression for all attributes included
function traverseViolationExpression(node, remediationList) {
  switch (node.operator) {
  case 'AND':
  case 'OR':
  case 'NOT':
    _.forEach(node.operand, function(operand) {
      traverseViolationExpression(operand, remediationList);
    });
    break;
  case 'EQUALS':
  case 'CONTAINS':
    remediationList.push({
      objectType: node.operand.targetName,
      value: node.operand.targetValue,
    })
    break;
  default:
    break;
  }
}

/*
*
*  GENERAL REMEDIATION FUNCTIONS
*
*/

// Delete the relationship between user and entitlement
function removeRelationship(targetId, relationshipId, removedId, attr) {
  var success = true;
  try {
    openidm.delete(targetId + '/' + attr + '/' + relationshipId, null);
  }
  catch (e) {
    success = false;
  }
  createAuditEntry(targetId, relationshipId, removedId, [ attr ], success);
}


// Create an openidm.patch payload from all non-relationship attributes that have been revoked and update user
function remediateAttributes(targetId, attributes) {
  var payload = [];
  var arrayAttributes = {};
  _.forEach(attributes, function(attribute) {
    var prop = attribute.objectType;
    var propType = OBJECT_PROPS[prop].type;
    if (propType === 'array') {
      if (!arrayAttributes[prop]) {
        arrayAttributes[prop] = [];
      }
      arrayAttributes[prop].push(attribute);
    }
    else {
      var remediatedValue = getRemediatedValue(attribute.attributeValue, propType);
      payload.push(getPayloadItemForAttribute(prop, remediatedValue));
    }
  });

  var arrayAttributeKeys = _.keys(arrayAttributes);
  var userObjWithArrayAttrs = openidm.read(targetId, null, arrayAttributeKeys);
  _.forEach(arrayAttributeKeys, function(attr) {
    var userAttr = _.cloneDeep(userObjWithArrayAttrs[attr]);
    if (OBJECT_PROPS[attr].items && OBJECT_PROPS[attr].items.type === 'object') {
      // Removing objects from an array of objects attribute
      var isAssignmentAttributes = _.startsWith(targetId, 'managed/assignment') && attr === 'attributes';
      _.forEach(arrayAttributes[attr], function(valueToRemove) {
        // A special case for OOTB assignment attributes, which has a known object array schema and needs to be supported
        userAttr = _.remove(userAttr, function(item) {
          var valueToCompare = isAssignmentAttributes ? item.name + ': ' + item.value.join(',') : item.name;
          valueToRemove.displayName === valueToCompare;
        });
      });
      payload.push(getPayloadItemForAttribute(attr, userAttr));  
    }
    else {
      // Removing values from a regular array attribute (array of strings, )
      var newUserAttr = _.difference(userAttr, arrayAttributes[attr]);
      payload.push(getPayloadItemForAttribute(attr, newUserAttr));
    }
  })


  var success = true;
  try {
    var updatedUser = openidm.patch(targetId, null, payload);
  }
  catch (e) {
    success = false;
  }

  return success;
}

// Returns a generic remediated value for a given attribute type
function getRemediatedValue(value, type) {
  switch (type) {
  case 'string':
    return 'REMEDIATED';
  case 'boolean':
    return false;
  case 'integer':
    return 0;
  case 'array':
    return [];
  case 'object':
    return {};
  }
}

// Creates a single patch entry to be included in an openidm.patch payload
function getPayloadItemForAttribute(prop, value) {
  return {
    operation: 'replace',
    field: '/' + prop,
    value: value,
  }
}

// Create an audit entry, successful or not, for a remediation
function createAuditEntry(targetId, relationshipId, removedObjectId, changedFields, isSuccess ) {
  var timestamp = moment().format();

  var message = '';
  if (relationshipId) {
    message = isSuccess ? 
    'The relationship with id ' + relationshipId + ' between ' + targetId + ' and ' + removedObjectId + ' has been removed.' :
    'FAILURE: The relationship with id ' + relationshipId + ' between ' + targetId + ' and ' + removedObjectId + ' could NOT be removed.'
  }
  else {
    message = isSuccess ?
    'The following fields on object with id ' + targetId + ' have been remediated: ' + changedFields :
    'FAILURE: The following fields on object with id ' + targetId + ' were not remediated successfully: ' + changedFields;
  }

	var auditEntry = {
		eventName: 'relationship-remediation',
		transactionId: timestamp,
		timestamp: timestamp,
		userId: '',
		runAs: 'SYSTEM"',
		objectId: targetId,
		operation: 'Entitlement Revocation',
		changedFields: changedFields,
		revision: null,
		passwordChanged: false,
		message: message,
		status: isSuccess ? "SUCCESS" : "FAILURE"
	};
	openidm.create("audit/activity", null, auditEntry);
}

// Get managed object schema
function getManagedObjectProperties(type) {
  var managed_objects = openidm.read('config/managed').objects;
  var props = _.find(managed_objects, {'name': type}).schema.properties;
  return props;
}