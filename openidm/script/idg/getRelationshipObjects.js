/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/* global openidm, input */
var _ = require('commons/lib/lodash4.js');
var __ = require('commons/utils/jsUtils.js');
var idmUtils = require('commons/utils/idmUtils.js');
var utils = require('idg/utils/generalUtilities.js');
var req = this.request;

run();

function run(){
  var response = null;
  if (req.method === 'read' || req.method === 'create') {
  
    var queryParams = req.additionalParameters;
    if (req.content) {
      var QUERY = req.content.query;
      if (!validateQueryExpression(QUERY)) {
        __.requestError('invalid query parameters', 400);
      }
    }
    if (queryParams) {
      //Required query parameters for looking up a particular attribute on a managed object
      var managed_object_name = queryParams.managedObject;
      var attributes = queryParams.attribute.split(',');

      // Get pagination information from request. Set defaults if not provided
      var PAGE_SIZE = queryParams.pageSize ? Number(queryParams.pageSize) : false;
      var PAGE_NUMBER = queryParams.pageNumber ? Number(queryParams.pageNumber) : false;
      var SORT_BY = queryParams.sortKey ? queryParams.sortKey : false;
      var ASC_ORDER = queryParams.ascOrder ? queryParams.ascOrder : false;

      var PAGE_OFFSET = (PAGE_NUMBER - 1) * PAGE_SIZE;
    }

    // validate the attributes are non-empty
    if (!attributes) {
      __.requestError('attribute is missing or empty', 400)
    }

    var all_managed = openidm.read('config/managed');
    var managedFile = all_managed.objects;
    var targetObject = _.find(managedFile, function(obj) {
      return obj.name === managed_object_name;
    });

    // Validate the incoming managed object name is an existing managed object
    if (!targetObject) {
      __.requestError(managed_object_name + ' is not a managed object', 404)
    }

    var targetValues = [];
    for (var h = 0; h < attributes.length; h++) {
      var attribute_name = attributes[h];
      var attribute = targetObject.schema.properties[attribute_name];
      if (!attribute) {
        __.requestError(attribute_name + ' is not an attribute on ' + managed_object_name, 404);
      } else if (attribute.type === 'relationship' && !attribute.resourceCollection) {
        __.requestError(attribute_name + ' is not a relationship attribute on ' + managed_object_name, 400);
      } else if (attribute.type !== 'relationship' && (!attribute.items || attribute.items.type !== 'relationship' || !attribute.items.resourceCollection)) {
        __.requestError(attribute_name + ' is not a relationship attribute on ' + managed_object_name, 400);
      }
        
      var collection = [];  
  
      if (attribute.type === 'relationship') {
        collection = attribute.resourceCollection;
      } else {
        collection = attribute.items.resourceCollection;
      }
  
      // if the request includes a query, iterate over criteria to build a result set
      if (QUERY) {
        var operator = null;
        for (var i = 0; i < QUERY.length; i++) {
          var q = QUERY[i];
          if (typeof q === 'object') {
            var queryString = retrieveQueryStringFromObject(q);
            var queryObject = {
              '_queryFilter': queryString,
              '_sortKeys': '_id'
            };
            var results = queryResourceCollections(managedFile, q, queryObject);
            if (operator) {
              targetValues = operator.toUpperCase() === 'AND' ? intersectionOf(targetValues, results) : _.union(targetValues, results);
              operator = null;
            } else {
              targetValues = results;
            }
          } else if (typeof q === 'string') {
            operator = q;
          }
        } // end of: q in query
      } else {
        // if there is no query, find all matching entitlement objects
        for (var i = 0; i < collection.length; i++) {
          var resource = collection[i];
          targetValues = targetValues.concat(queryResourceCollections(managedFile, resource, {'_queryFilter': 'true'}));  
          
        } // end of: resource of collection
        
      }
    } // end of: attribute_name in attributes
    // sort and paginate the result and return to user
    targetValues = _.uniq(targetValues, function(val) { return val._id });
    var formattedResults = __.cloneDeep(targetValues);
    var TOTAL_PAGES = -1;
    if (SORT_BY) {
      formattedResults = _.sortBy(formattedResults, SORT_BY);
      if (!ASC_ORDER) {
        formattedResults.reverse();
      }
    }
    if (PAGE_SIZE && PAGE_NUMBER) {
      TOTAL_PAGES = Math.ceil(targetValues.length / PAGE_SIZE);
      var PAGE_END = PAGE_OFFSET + PAGE_SIZE;
      PAGE_END = PAGE_END > formattedResults.length ? formattedResults.length : PAGE_END;
      formattedResults = formattedResults.slice(PAGE_OFFSET, PAGE_END);
    }

    response = {
      result: formattedResults,
      resultCount: targetValues.length,
      totalPagedResults: TOTAL_PAGES,
      pageSize: PAGE_SIZE || targetValues.length,
      pageNumber: PAGE_NUMBER || 1
    };
    if (SORT_BY) {
      response.sortKey = SORT_BY;
      response.ascOrder = ASC_ORDER;
    }
    
    // Not a Read request
  } else {
    __.requestError(req.method + ' is not a valid method for this endpoint', 400);
  } 
  return response;
}

function intersectionOf(list1, list2) {
  return list1.reduce(function(prev, curr){
    list2.some(function(obj){
      return _.isEqual(obj, curr)
    }) ? prev.push(curr): false;
    return prev
  }, []);
}

function validateQueryExpression(query) {
  return _.every(query, function(q) {
    return (
      (q.path && q.attribute && q.operator && q.value) ||
      (typeof q === 'string' && ['AND','OR'].indexOf(q.toUpperCase()) >= 0)
    );
  });
}

function retrieveQueryStringFromObject(queryObj) {
  var queryString = '';
  var negation = false;
  var attr = queryObj.attribute;
  var op = queryObj.operator;
  var val = queryObj.value;
  if (op.indexOf('!') === 0) {
    op = op.slice(1);
    negation = true;
  }

  queryString = attr + ' ' + op + ' "' + val + '"';

  if (negation) {
    queryString = '!(' + queryString + ')';
  }

  return queryString;
}

function queryResourceCollections(managedFile, resource, query) {
  var targetValues = [];
  var queriedResource = openidm.query(resource.path, query).result;
  for (var j = 0; j < queriedResource.length; j++) {
    var value = queriedResource[j];
    var target = {};
    target._id = resource.path.concat('/',value._id);

    var valueToDisplay = '';
    var toSearchFor = resource.path.replace('managed/', '');

    _.find(managedFile, function(resourceSearch) {
      if (resourceSearch.name === toSearchFor) {
        return _.find(resourceSearch.schema.order, function(it) {
          if (resourceSearch.schema.properties[it].searchable === true) {
            valueToDisplay = it;
            return valueToDisplay;
          }
        });
        
      }
    });

    target.displayName = value[valueToDisplay] ? value[valueToDisplay]: value._id;
    target.description = value.description;
    targetValues.push(target);

  } //end of: value of openidm.query
  return targetValues;
} // queryResourceCollections
