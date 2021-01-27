/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
(function () {
var _ = require('commons/lib/lodash4.js');
var qf = require('idg/utils/queryFilter.js');
var CONSTANT = require('idg/utils/globalConstants.js');
var TRIGGERED_CERT_REPO_PATH = null;
var CERT_REPO_PATH = null;


exports.triggerCerts = function(oldObject, newObject, objectType) {
var _thread = java.lang.Thread(function() {
  if (_.isEmpty(oldObject) || _.isEmpty(newObject) || !objectType) {
    return false;
  }
  setCertificationPath(objectType);
  var _allEventBasedCerts = openidm.query(TRIGGERED_CERT_REPO_PATH, { _queryFilter: 'true' });
  _allEventBasedCerts.result.forEach(function(cert) {
    // If an instance of this cert exists already, don't proceed.
    var identifier = objectType === 'user' ? newObject.userName : newObject.name;
    if (isInProgress(cert, identifier)) {
      return
    }
    // If the information does *not* fit the event filter (cert.expression), *don't* proceed.
    if (!isSatisfyExpression(oldObject, newObject, JSON.parse(cert.expression))) {
      return
    }

    // Proceed to create the campaign.
    createCampaign(cert, newObject, objectType);

  });
});
_thread.start();
};

function setCertificationPath(objectType) {
  TRIGGERED_CERT_REPO_PATH = objectType === 'user' ? CONSTANT.REPO_PATH.TRIGGERED_USER_CERT : CONSTANT.REPO_PATH.TRIGGERED_OBJECT_CERT;
  CERT_REPO_PATH = objectType === 'user' ? CONSTANT.REPO_PATH.USER_CERT : CONSTANT.REPO_PATH.OBJECT_CERT;
}

function createCampaign(cert, managedObject, objectType) {
  var attributeName = objectType === 'user' ? 'userName' : 'name';
  var attributeValue = objectType === 'user' ? managedObject.userName : managedObject.name;
  var certType = objectType === 'user' ? 'user' : 'object';

  // set the target filter to target ONLY the user
  var target_filter = {
    "operator": "AND",
    "operand": [
      {
        "operator": "EQUALS",
        "operand": {
          "targetName": attributeName,
          "targetValue": attributeValue,
        },
      },
    ],
  };

  cert.targetFilter = target_filter;
  cert.certObjectType = objectType;
  cert.triggerId = cert._id;
  cert.targetName = attributeValue;
  delete cert._id;
  openidm.create('governance/certification/' + certType, null, cert);
}

function isInProgress(cert, identifier) {
  // returns whether an identical cert is already in progress for that user
  var params = {
    _queryFilter: qf.and([
      qf.eq('triggerId', cert._id),
      qf.eq('targetName', identifier),
      qf.isStatusInProgress(),
    ]),
  };
  var results = openidm.query(CERT_REPO_PATH, params);
  return Boolean(results.result && results.result.length)
}

function isSatisfyExpression(oldData, newData, node){
  switch (node["operator"]) {
    case "and":
      return isSatisfyExpressionAnd(oldData, newData, node)
    case "or":
      return isSatisfyExpressionOr(oldData, newData, node)
    case "not":
      return isSatisfyExpressionNot(oldData, newData, node)
    case "is":
      return isSatisfyExpressionIdentity(newData, node.operand)
    case "was":
      return isSatisfyExpressionIdentity(oldData, node.operand)
    case "contains":
      return isSatisfyExpressionContain(newData, node.operand)
    case "contained":
      return isSatisfyExpressionContain(oldData, node.operand)
    case "changed":
      return isSatisfyExpressionChanged(oldData, newData, node.operand)
    default:
      return false
  }
}

function isSatisfyExpressionAnd(oldData, newData, node) {
  if (node["operands"] == null || !(node["operands"] instanceof Array) ) {          
    return false
  }

  for (var childNode in node["operands"]) {
    if (!isSatisfyExpression(oldData, newData, node["operands"][childNode])) {
      return false
    }
  }
  return true
}

function isSatisfyExpressionOr(oldData, newData, node) {
  if (node["operands"] == null || !(node["operands"] instanceof Array) ) {
    return false
  }

  for (var childNode in node["operands"]) {
    if (isSatisfyExpression(oldData, newData, node["operands"][childNode])) {
      return true
    }
  }
  return false
}

function isSatisfyExpressionNot(oldData, newData, node){
  if (node["operands"] == null || !(node["operands"] instanceof Array) ) {
    return false
  }
  return !isSatisfyExpression(oldData, newData, node["operands"][0])
}

function isSatisfyExpressionIdentity(data, node) {
  // note(ML): this conditional should be checked
  if (node["field"] == null || data[node["field"]] == null || !(typeof node["field"] === "string") || !(typeof data[node["field"]] === "string")) {
    return false
  }
  return data[node["field"]].equalsIgnoreCase(node["value"])
}

function isSatisfyExpressionChanged(oldData, newData, node) {
  return !_.isEqual(oldData[node["field"]], newData[node["field"]]);
}

function isSatisfyExpressionContain(data, node) {
  if (node["field"] == null || !(typeof node["field"] === "string")){
    return false
  }

  for (var key in data){
    if (typeof data[key] === "string"){
      continue
    } else if (data[key] instanceof Array){
      for (var item in data[key]){
        if(data[key][item] != null && data[key][item]["_ref"] && data[key][item]["_ref"].equalsIgnoreCase(node["value"])){
          return true
        }
      }
    } else if (data[key] != null && data[key]["_ref"] != null && data[key]["_ref"].equalsIgnoreCase(node["value"])){
      return true
    }
  }
  return false
}
 
}());
