/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
/* global logger, openidm, input */

var _ = require('commons/lib/lodash4.js');
var __ = require('commons/utils/jsUtils.js');
var idmUtils = require('commons/utils/idmUtils.js');
var CCONSTANT = require('commons/utils/globalConstants.js');
var utils = require('idg/utils/generalUtilities.js');
var qf = require('idg/utils/queryFilter.js');
var CERT_VALS = require('idg/utils/certificationValidations.js');
var OBJECT_TYPE = null;

var req = null;
var expression = null;

var MANAGED_OBJECTS_CONFIG = null;

(function(){
  req = this.request;

  // Read managed object type
  if (req.resourcePath && req.resourcePath !== '') {
    OBJECT_TYPE = req.resourcePath
  }
  else {
    OBJECT_TYPE = 'user';
  }
  MANAGED_OBJECTS_CONFIG = getManagedObjectConfig(OBJECT_TYPE);
  if (!MANAGED_OBJECTS_CONFIG) {
    __.requestError(OBJECT_TYPE + ' is not a valid managed object type', 400);
  }

  var targetIds = null;
  if (req.method === 'action' && req.action === 'parse') {
    expression = req.content.expression || req.content;
    // validate
    CERT_VALS.validateTargetFilter(expression, OBJECT_TYPE);
    // get target ids matching expression
    targetIds = _getTargetIdsFromExpression(expression);
  } else {
    __.requestError('Endpoint does not support this method or action', 403);
  }
  return targetIds;
}());

/*
 * Function _getTargetIdsFromExpression
 * @returns [ Target ]
 */
function _getTargetIdsFromExpression(targetFilter) {
  var targetIds = recursiveReadNodes(targetFilter);
  return _.uniq(targetIds);
}

/**
 * Gets all target ids with the specified attribute, or combination of attributes
 * @param {Object} node The node of the expression
 * @param {boolean} isNegation
 * @return {Array}  List of target IDs that have the attribute
 */
function recursiveReadNodes(expressionNode) {
  var node = expressionNode;
  if (node.length === 1) {
    node = node[0];
  } else if (_.isArray(node)) {
    var allResults = _.map(node, function(n) {
      return recursiveReadNodes(n);
    });
    return _.flatten(allResults);
  }
  var operator = node.operator ? node.operator.toUpperCase() : null;
  var operand = node.operand;
  var targetIds = null;

  switch (operator) {
    case 'ALL':
      var response = openidm.query('managed/' + OBJECT_TYPE, { _queryFilter: 'true', _fields: ['_id'] });
      var targetList = response? response.result: [];
      targetIds = _.map(targetList, '_id');
      break;
    case 'AND':
      var allResults = operand.map(recursiveReadNodes);
      targetIds = _.intersection.apply(this, allResults);
      break;
    case 'OR':
      var allResults = operand.map(recursiveReadNodes);
      targetIds = _.union.apply(this, allResults);
      break;
    case 'NOT':
      targetIds = getComplementSet(recursiveReadNodes(operand));
      break;
    case 'LINKEDTO':
      targetIds = getTargetIdsWithApplication(operand.targetName, operand.targetValue);
      break;
    case 'EQUALS':
    case 'MATCHES':
    case 'CONTAINS':
      var attribute = operand.targetName;
      var attributeType = MANAGED_OBJECTS_CONFIG[attribute].type;
      var value = operand.targetValue;

      if (!value) {
        var error_message = 'Target value expected for attribute: ' + attribute;
        __.requestError(error_message, 406);
      } else if (idmUtils.isLongInternalRoleId(value)) {
        var response = openidm.query(value + '/authzMembers', { '_queryFilter' : 'true' }, [ '_id' ])
        var targetList = response ? response : [];
        targetIds = _.map(targetList, '_id');
      } else if (_.includes(['string', 'integer', 'number', 'boolean'], attributeType)) {
        targetIds = getTargetIdsWithPrimitiveAttribute(attribute, value, operator);
      } else if (_.includes(['array', 'relationship'], attributeType)) {
        targetIds = getTargetIdsWithRelationship(attribute, value);
      } else {
        var error_message = 'Unexpected attribute type: ' + attributeType + ' for node: ' + JSON.stringify(node);
        __.requestError(error_message, 406);
      }
      break;
    default:
      var error_message = 'Unexpected operator: ' + operator + ' for node: ' + JSON.stringify(node);
      __.requestError(error_message, 406);
  }
  return targetIds
}

/**
 * Gets all ids of objects that are linked to the specified application
 * @param {String} appType The type of linked system (currently only supports 'application')
 * @param {String} appName The name of the linked system
 * @return {Array} List of target IDs that have the application
 * Note this function should be for managed users ONLY, should not be called by other objects
 */
function getTargetIdsWithApplication(appType, appName) {
  
  if (!appType || !appName) {
    return __.requestError('Application or linked system could not be queried', 406);
  }

    var mappingNames = '';
    var queryResults = [];

    var syncConfig = openidm.read('config/sync');

    for (var __k in syncConfig.mappings) {
      var mapping = syncConfig.mappings[__k];
      if (
        mapping.source.equalsIgnoreCase('managed/' + OBJECT_TYPE) &&
        mapping.target.match(new RegExp('^system\/' + appName + '\/.+$','g'))
      ) {
        if (mappingNames) {
          mappingNames = mappingNames + ' or linkType eq \'' + mapping.name + '\'';
        }
        else {
          mappingNames = 'linkType eq \'' + mapping.name + '\'';
        }
      }
    }
    if (mappingNames) {
      var sourceIds = openidm.query('repo/links', { _queryFilter: mappingNames })
      var targetsWithApplication = _.map(sourceIds.result, function(result) {
        return result.firstId ? result.firstId : result.firstResourceCollection + '/' + result.firstResourceId;
      });
      if (targetsWithApplication) {
        var query = idmUtils.queryManagedUsers('true', ['_id'], CCONSTANT.IDM_METHOD.QUERY);
        queryResults = _.filter(query, function(target) {
          return targetsWithApplication.indexOf(target._id) >= 0 || targetsWithApplication.indexOf('managed/' + OBJECT_TYPE + '/'.concat(target._id)) >= 0;
        });
      }
    }
  
  return queryResults.map(function (item) {
    return item._id;
  });
}
/**
 * Gets all ids of objects with value of the specified relationship attribute to the specified object
 * @param {String} attribute The relationship attribute
 * @param {String} value The value of the relationship attribute
 * @return {Array} List of target IDs that are in the relationship
 */
function getTargetIdsWithRelationship(attribute, value) {
  var resourceCollection = null;
  var reverseProperty = null;
  var schemaProperties = MANAGED_OBJECTS_CONFIG[attribute];
  if (!schemaProperties) {
    return __.requestError('Property '+ attribute +' could not be queried', 403);
  }
  resourceCollection = schemaProperties.resourceCollection || schemaProperties.items.resourceCollection;
  reverseProperty = schemaProperties.reversePropertyName || schemaProperties.items.reversePropertyName;

  var queryResults = [];
  _.each(resourceCollection, function(coll) {
    var query = null;
    if (value.indexOf(coll.path) > -1) {
      query = openidm.read(value, {}, [reverseProperty]);
      filteredQuery = _.filter(query[reverseProperty], function(item) { 
        return (item._ref.indexOf('managed/' + OBJECT_TYPE) > -1)
      });
      queryResults = queryResults.concat(_.map(filteredQuery, '_ref'));
    } else {
      var queries = _.map(coll.query.fields, function(field) { return qf.eq(field, value) });
      var queryFilter = qf.or(queries);
      query = openidm.query(coll.path, { _queryFilter: queryFilter, _fields: reverseProperty });
      _.each(query.result, function(res) {
        filteredRes = _.filter(res[reverseProperty], function(item) { 
          return (item._ref.indexOf('managed/' + OBJECT_TYPE) > -1)
        });
        queryResults = queryResults.concat(_.flatten(filteredRes, '_ref'));
      });
    }
  });

  return _.map(queryResults, function(id) { return id.replace('managed/' + OBJECT_TYPE + '/',''); });
}

/**
 * Gets all target ids with the specified primitive attribute
 * @param {String} attribute The object attribute
 * @param {String} value     The attribute value
 * @param {String} operator  The search comparison operator
 * @return {Array} List of target IDs that have the attribute
 */
function getTargetIdsWithPrimitiveAttribute(attribute, value, operator) {
  var op = '';
  switch(operator) {
  case 'EQUALS':
    op = 'eq';
    break;
  case 'CONTAINS':
    op = 'co';
    break;
  default:
    op = 'eq';
    break;
  }

  var query = null;
  if (OBJECT_TYPE === 'user') {
    query = idmUtils.queryManagedUsers(attribute + ' ' + op + ' "' + value + '"', ['_id'], CCONSTANT.IDM_METHOD.QUERY);
  }
  else {
    query = openidm.query('managed/' + OBJECT_TYPE, { '_queryFilter': attribute + ' ' + op + ' "' + value + '"' }, ['_id']).result
  }
  return query.map(function (item) {
    return item._id;
  });
}

/**
 * Returns all managed objects in OpenIDM that are not in the array that's passed in
 * @param {Array} ids Array of ids of the targets who we do not want
 * @return {Array} List of all target ids in the system who have in id that's not in the ids array
 */
function getComplementSet(ids) {
  // Make a query that requests all target ids that are not in that list
  var queries = ids.map(function (id, index, arr) {
    var toReturn = '! _id eq "' + id + '"';
    if (index == (arr.length - 1)) {
      return toReturn;
    } else {
      return toReturn += ' and ';
    }
  });
  var queryFilter = queries.join('');

  if(queryFilter == ''){
    queryFilter = 'true';
  }
  var queryParams = {
    '_queryFilter' : queryFilter,
    '_fields' : ['_id']
  };
  var query = openidm.query('managed/' + OBJECT_TYPE, queryParams);
  return query.result.map(function (item) {
    return item._id;
  });
}

/**
 * Returns managed object configuration of the requested object type
 * @param {String} objectType Type of object requested
 * @return {Object} Config object
 */
function getManagedObjectConfig(objectType) {
  var config = _.find(openidm.read('config/managed').objects,
    function(obj) {
      return obj.name === objectType;
    }
  )
  if (config && config.schema && config.schema.properties) {
    return config.schema.properties
  }
  return null;
}