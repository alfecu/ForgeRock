/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
/* global openidm */
/* eslint no-invalid-this: "off"*/
var _ = require('commons/lib/lodash4.js');

execute();
function execute() {
  var request = this.request;
  var method = request.method || '';
  var params = request.additionalParameters;

  if (method.equalsIgnoreCase('READ')) {
    var systemSettings = getSystemSettings(params);
    return({"systemSettings": systemSettings});

  } else if (method.equalsIgnoreCase('CREATE')) {
      var newSettings = updateSystemSettings(request);
    return (newSettings);
  }

  var noSuchMethodTypeError = {code: 404, message:'No such method type supported'};
  throw noSuchMethodTypeError;

}

function getSystemSettings(params){
  var settings = openidm.read('config/systemSettings').systemSettings;
  // if the "field" parameter is included in the request,
  // only return that specific settings field
  if (params.field) {
    settings = _.compact(_.map(settings, function(s) {
      return _.filter(s.fields, {'id': params.field})[0];
    }))[0];
  }
  return settings;
}

function updateSystemSettings(request){
  // var currentSettings = openidm.read(configPath);
  var systemSettings = { 'systemSettings': request.content.updatedSettings };
  openidm.update('config/systemSettings', null, systemSettings);
  return systemSettings;
}
