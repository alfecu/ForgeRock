/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
Config endpoint for setting the /config/accessRequest /conf/accessRequest.json object
*/
var _ = require('commons/lib/lodash4');
var __ = require('commons/utils/jsUtils.js');

var CONSTANT = require('commons/utils/globalConstants.js');
var commonUtils = require('commons/utils/commonUtils.js');

// get params
var url = request.resourcePath;
var urlSegments = url.split('/');
var METHOD = null;
try {
  METHOD = request.method;
} catch(e) {}

var CONTENT = request.content;
// FUNCTION is the suffix AFTER /openidm/access-request/config
var FUNCTION = urlSegments[urlSegments.length - 1];

function main() {
  if (METHOD === 'read' && FUNCTION === '') {
    /*
     * ~~~~~~~~~ USAGE ~~~~~~~~
     * method: GET
     * URL: /openidm/access-request/config
    */
    var result = commonUtils.getConfig();
    return {"result": result};
  }
  else if (METHOD === 'create' && FUNCTION === '') {
    /*
     * ~~~~~~~~~ USAGE ~~~~~~~~
     * method: POST
     * URL: /openidm/access-request/config
     * Content-Type: application/json.
     * body: The config object in JSON.
    */
    var config_obj = CONTENT;
    var result = commonUtils.setConfig(config_obj);
    return {"result": result};
  }
  else {
    /*
     * Request not supported. Respond with bad request
     */
    __.requestError('Request not supported.  If you are using an id in your request, please verify that it is correct.', 400);
  }
}

main();
