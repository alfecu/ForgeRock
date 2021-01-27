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
var CONSTANT = require('idg/utils/globalConstants.js');
var utils = require('idg/utils/generalUtilities.js');
var glossaryCRUD = require('commons/utils/glossaryCRUD.js');

var queryParams = null;

run();
function run() {
  queryParams = request.additionalParameters;

  if (
    utils.methodIs('READ')
  ) {
    var response = {};
    var managedObjectConfig = openidm.read("config/managed").objects;
    if (!managedObjectConfig) {
      __.requestError('Unable to read managed object config.', 400);
    }
    // If a managedObject type is specified, return schema for that object only
    if (queryParams && queryParams.type) {
      var object =  _.find(managedObjectConfig, function(obj) { 
        return obj.name === queryParams.type 
      });
      if (!object) {
        __.requestError('Invalid managed object type specified.', 400);
      }
      response[object.name] = object;

      return response;
    } 

    response.managedObjects = {};
    _.forEach(managedObjectConfig, function(obj) { response.managedObjects[obj.name] = obj.schema.properties });

    //Get all applications
    response.applications = [];
    var config = openidm.read('config');
    var configurations = config.configurations;
    var connectors = [];
    for (var i in configurations) {
      configuration = configurations[i];
      if (configuration._id.indexOf('provisioner') === 0) {
        connectors.push(configuration._id.substring(configuration._id.lastIndexOf('/') + 1));
      }
    }
    for (var i in connectors) {
      var application = connectors[i];
      //Get certifiable value and risk level
      var certifiable = false;
      var riskLevel = 1;
      var entitlementOwner = null;

      var query_filter = 'class eq "system" and name eq "'+ application + '"';
      var glossaryData = glossaryCRUD.queryObjs({ _queryFilter: query_filter }).result;
      for (var j in glossaryData) {
        var entry = glossaryData[j];
        if (entry.certifiable) {
          certifiable = entry.certifiable;
        }
        if (entry.riskLevel) {
          riskLevel = entry.riskLevel;
        }
        if (entry.entitlementOwner) {
          entitlementOwner = entry.entitlementOwner;
        }
      }//end:for:glossaryData
      
      response.applications.push({
        name: application, 
        displayName: application, 
        certifiable: certifiable, 
        riskLevel: riskLevel, 
        entitlementOwner: entitlementOwner
      });
    }//end:for:availableConnectors

    return response;
  }//end:else-if

  __.requestError('Request not supported.', 400);

}//end:run()
