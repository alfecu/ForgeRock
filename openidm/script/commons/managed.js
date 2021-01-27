/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
Endpoint for retrieving requestable ITEMS.

This endpoint is meant for the FRONTEND.  It only exposes public information, wraps the object, and includes a computed displayName.
*/
var __ = require('commons/utils/jsUtils.js');
var idmUtils = require('commons/utils/idmUtils.js');
var managedObjectUtils = require('commons/utils/managedObjectUtils.js');

// get params
var url = request.resourcePath;
var urlSegments = url.split('/');
var PARAMS = request.additionalParameters;
var requestMethod = null;
try {
  requestMethod = request.method;
} catch(e) {}

function main() {
  if (requestMethod === 'read' && urlSegments.length === 1) {
    /*
     * ~~~~~~~~~ USAGE ~~~~~~~~
     * method: GET
     * URL: /openidm/commons/managed/<type>?queryString=<optional>
     * queryString: Space-separated string of things to search for.
    */
    var query_string = PARAMS.queryString || '';
    var queryParams = idmUtils.getQueryParams(PARAMS);
    var type = urlSegments[0];
    return managedObjectUtils.getManagedObjectsByQueryString(type, query_string, queryParams);
  }
  else if (requestMethod === 'read' && urlSegments.length === 2) {
    /*
     * ~~~~~~~~~ USAGE ~~~~~~~~
     * method: GET
     * URL: /openidm/commons/managed/<type>/<object id>
    */
    var type = urlSegments[0];
    var obj_id = urlSegments[1];
    var result = managedObjectUtils.getManagedObjectById(type, obj_id);
    return {"result": result};
  }
  else {
    /*
     * Request not supported. Respond with bad request
     */
    __.requestError('User request not supported.  If you are using an id in your request, please verify that it is correct.', 400);
  }
}

main();
