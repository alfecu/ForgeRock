/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/* global request, context, openidm */
/* eslint consistent-return: off */
var _ = require('commons/lib/lodash4.js');
var __ = require('commons/utils/jsUtils.js');
var idmUtils = require('commons/utils/idmUtils.js');
var CONSTANT = require('idg/utils/globalConstants.js');
var utils = require('idg/utils/generalUtilities.js');
var qf = require('idg/utils/queryFilter.js');
var c = require('idg/utils/campaign.js');
var moment = require('commons/lib/moment.js');

var queryParams = null;



run();
function run() {
  var RESOURCE = request.resourcePath;
  queryParams = request.additionalParameters;

  if (
    utils.methodIs('READ') &&
    RESOURCE && 
    (
      utils.queryParamsAre(['pageNumber', 'pageSize']) ||
      utils.queryParamsAre(['pageNumber', 'pageSize', 'sortBy']) ||
      utils.queryParamsAre(['pageNumber', 'pageSize', 'sortBy', 'q'])
    )
  ) {
    /*
     * GET request that returns a list of all policies for URL params
     */
    // NOTE: get pagination information from request. Set defaults if not provided
    var PAGE_SIZE = Number(queryParams.pageSize);
    var PAGE_NUMBER = Number(queryParams.pageNumber) || 1;
    var SORT_BY = queryParams.sortBy;
    var FILTER = 'true';
    var PAGE_OFFSET = PAGE_NUMBER - 1;
    var REPO = null;
    var HISTORY_VIEW = false;
    RESOURCE = RESOURCE.toLowerCase();

    var params = {};
    
    if (utils.urlParamsCount(RESOURCE, 1)) {
      /*
      * If there is one resource path (ex: adminPolicy/policies, adminPolicy/exceptions),
      * then return active instances of that resource
      */
      if (RESOURCE === 'policies') {
        REPO = 'managed/policy';
        if (SORT_BY) {
          params._sortKeys = SORT_BY;
        }
        if (queryParams.q) {
          var managed_objects = openidm.read('config/managed').objects;
          var fields = _.find(managed_objects, {'name': 'policy'}).schema.order;
          FILTER = qf.coIn(queryParams.q, fields);
        }
      } else if (RESOURCE === 'policy-scans') {
        REPO = 'repo/governance/scheduledPolicyScan/';
        if (SORT_BY) {
          params._sortKeys = SORT_BY;
        }
        if (queryParams.q) {
          FILTER = qf.and([FILTER, qf.coIn(queryParams.q, ['name', 'filterType', 'filterValue', 'nextRunDate'])]);
        }
      } else if (RESOURCE === 'violations' || RESOURCE === 'exceptions') {
        REPO = 'repo/relationships';
        FILTER = 'firstPropertyName eq "' + RESOURCE + '" or secondPropertyName eq "' + RESOURCE + '"'
        if (queryParams.q) {
          FILTER = qf.and([FILTER, qf.coIn(queryParams.q, ['properties/policyName', 'owner', 'target', 'approver'])]);
        }
      }
  
    } else if (utils.urlParamsCount(RESOURCE, 2)) {
      /*
      * If there are two resources (ex: adminPolicy/history/violations, adminPolicy/history/exceptions),
      * then return instances of that resource that have been acted on
      */
     HISTORY_VIEW = true;
     var requestedResource = RESOURCE.split('/')[1];
     REPO = 'audit/activity';
    //  delete params._sortKeys;
     params._fields = ['userId','runAs','before','after','eventName','timestamp'];
     if (requestedResource === 'violations') {
       FILTER = 'eventName eq "policyremediation" or eventName eq "policyexception" or eventName eq "violationdeletion" or eventName eq "policyviolationexpired"';
     } else if (requestedResource === 'exceptions') {
      FILTER = 'eventName eq "policyexceptionexpired" or eventName eq "policyexceptioncancelled"';
     }
    }

    params._queryFilter = FILTER;

    var response = openidm.query(REPO, params);

    if (HISTORY_VIEW) {
      response.result = _.map(response.result, bundleHistoricalRelationship);
    } else if (RESOURCE === 'violations' || RESOURCE === 'exceptions') {
      response.result = _.map(response.result, bundleActiveRelationship);
      if (SORT_BY) {
        var desc = SORT_BY[0] === '-';
        SORT_BY = SORT_BY.replace(/\+|\-/gi, '');
        response.result = _.sortBy(response.result, SORT_BY);
        if (desc) {
          _.reverse(response.result);
        }
      }
    } 
    
    response = paginateResponse(response, PAGE_SIZE, PAGE_OFFSET);

    return response;

  } else if (
    utils.methodIs('CREATE') &&
    utils.queryParamsAre(['action']) &&
    queryParams.action === 'delete' && 
    utils.urlParamsCount(RESOURCE, 1)
  ) {
    /*
     * DELETE ONE OR MORE POLICIES
     */

    // NOTE: verify request body contains Ids { ids: [ 'sdf234234', '23sfsf' ] }
    if (!__.__isArray(request.content.ids)) {
      __.requestError('You must provide an array of ids.', 400);
    }
    
    if (RESOURCE === 'policies' || RESOURCE === 'policy-scans') {
      var IS_SUPPORTED_RESOURCE = true;
      switch (RESOURCE) {
        case 'policies':
          REPO = 'managed/policy';
          break;
        case 'policy-scans':
          REPO = 'repo/governance/scheduledPolicyScan';
          break;
        default:
          IS_SUPPORTED_RESOURCE = false;
          break;
      }
      if (!IS_SUPPORTED_RESOURCE) {
        __.requestError('Resource type not supported.', 400);
      }
      var policyIds = request.content.ids;
      var idsNotProcessed = [];

      // process all policy ids for deletion
      policyIds.forEach(function(POLICY_ID) {
        var targetPolicyId = REPO + '/' + POLICY_ID;
        var policyObject = openidm.read(targetPolicyId);

        if (_.isEmpty(policyObject)) {
          idsNotProcessed.push(POLICY_ID);
          return;
        }

        openidm.delete(REPO + '/' + POLICY_ID, policyObject._rev);
      });

      return {
        result: 'Success. Ids not processed were not found as repo objects.',
        notProcessed: idsNotProcessed
      };
    }
  } else if (
    utils.methodIs('CREATE') &&
    utils.queryParamsAre(['action']) &&
    queryParams.action === 'create'
  ) {
    /**
     * CREATE NEW POLICY
     */
    var reqBody = request.content;
    var newPolicy = openidm.create('managed/policy', null, reqBody);

    return newPolicy;
  } else if (
    utils.methodIs('CREATE') &&
    utils.queryParamsAre(['action']) &&
    queryParams.action === 'update' && 
    utils.urlParamsCount(RESOURCE, 1)
  ) {
    /**
     * UPDATE EXISTING POLICY
     */
    var reqBody = request.content;
    var policyId = RESOURCE;
    var existingPolicy = openidm.read('managed/policy/' + policyId);
    var response = {};
    if (existingPolicy) {
      response = openidm.update('managed/policy/' + existingPolicy._id, null, reqBody);
    } else {
      __.requestError('No policy found with that id.', 400);
    }

    return response;
  } //end:else-if

  __.requestError('Request not supported.', 400);

}//end:run

function paginateResponse(response_obj, pageSize, pageOffset) {
  var resultCount = response_obj.resultCount;
  var start = 0;
  var end = resultCount;

  if (pageSize < resultCount) {
    start = pageSize * pageOffset;
    end = start + pageSize;
    response_obj.result = response_obj.result.slice(start, end);
  }
  
  response_obj.totalPagedResults = response_obj.resultCount;

  if (response_obj.resultCount > pageSize) {
    response_obj.resultCount = response_obj.result.length;
  }
  return response_obj;
}

function bundleActiveRelationship(relationship) {
  var relationshipType = null;
  if (relationship.properties.owner) {
    // If owner property is present, relationship is a violation
    relationshipType = 'violation';
  } else if (relationship.properties.approver) {
    // Else if approver property is present, relationship is an exception
    relationshipType = 'exception';
  }
  // Now given the object, retrieve all of its fields
  var shortId = relationship._id;
  var objectid = relationship._id;
  var expression = relationship.properties.expression;
  var policyName = relationship.properties.policyName;
  // add check if starts with 'managed/user', its target, or 'managed/policy', its policyId
  var targetName = relationship.properties.target;
  var policyId = relationship.secondResourceCollection + '/' + relationship.secondResourceId;
  var riskLevel = relationship.properties.riskLevel;
  var expirationDate = relationship.properties.expirationDate;
  var comments = relationship.properties.comments;

  var escalationDate = relationship.properties.escalationDate;
  var escalationOwner = relationship.properties.escalationOwner;
  var owner = null;
  var approver = null;

  if (relationshipType === 'exception' ) {
    owner = openidm.read(policyId).owner._ref;
    approver = relationship.properties.approver;
  } else {
    owner = relationship.properties.owner;
  }

  if (owner.indexOf('managed/user') === 0) {
    owner = idmUtils.getUserName(owner);
  } else {
    owner = utils.getRoleDisplayNameFromId(owner);
  }
  
  var bundledRelationship = {
    policyName: policyName,
    shortId: shortId,
    objectid: objectid,
    targetName: targetName,
    policyId: policyId,
    riskLevel: riskLevel,
    expirationDate: expirationDate,
    expression: expression,
    owner: owner,
    approver: approver,
    comments: comments,
  };

  if (relationshipType === 'exception') {
    bundledRelationship.startDate = relationship.properties.startDate;
  } else {
    bundledRelationship.escalationDate = escalationDate;
    bundledRelationship.escalationOwner = escalationOwner;
  }

  return bundledRelationship;
}

function bundleHistoricalRelationship(relationship) {
  var actingUser = relationship.runAs; 
  var policyObject = relationship.before; 
  var violationObject = relationship.after; 
  var status = relationship.eventName; 
  var date = relationship.timestamp;
  
  var fullPolicy = JSON.parse(policyObject);
  var fullViolation = JSON.parse(violationObject);

  var relationship_obj = {
    _id: fullViolation._refProperties._id,
    policy: fullPolicy.name,
    targetUser: fullViolation._refProperties.target,
    actingUser: actingUser,
    riskLevel: fullPolicy.riskLevel,
    expirationDate: fullViolation._refProperties.expirationDate,
    expression: fullPolicy.expression,
    completeDate: moment(date).format(),
    escalationDate: fullViolation._refProperties.escalationDate,
    escalationOwner: fullViolation._refProperties.escalationOwner,
    comments: fullViolation._refProperties.comments,
  }

  if (fullPolicy.owner._ref.indexOf('managed/user') === 0) {
    relationship_obj.owner = idmUtils.getUserName(fullPolicy.owner._ref);
  } else {
    relationship_obj.owner = utils.getRoleDisplayNameFromId(fullPolicy.owner._ref);
  }

  switch(status) {
    case 'policyremediation':
      relationship_obj.status = 'Remediated';
      break;
    case 'policyexception':
      relationship_obj.status = 'Exception';
      break;
    case 'violationdeletion':
      relationship_obj.status = 'Deleted';
      break;
    case 'policyviolationexpired':
      relationship_obj.status = 'Expired';
      break;
    case 'policyexceptionexpired':
      relationship_obj.status = 'Expired';
      break;
    case 'policyexceptioncancelled':
			relationship_obj.status = 'Cancelled';
      break;
  }

  return relationship_obj;
}