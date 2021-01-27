/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
Workflow endpoint.
*/
var __ = require('commons/utils/jsUtils.js');
var idmUtils = require('commons/utils/idmUtils.js');

// get params
var url = request.resourcePath;
var urlSegments = url.split('/');
var METHOD = null;
try {
  METHOD = request.method;
} catch(e) {
  // pass
}
// FUNCTION is the suffix AFTER /openidm/access-request/workflow
var FUNCTION = urlSegments[urlSegments.length - 1];

function main() {
  if (METHOD === 'read' && FUNCTION === '') {
    /*
     * ~~~~~~~~~ USAGE ~~~~~~~~
     * method: GET
     * URL: /openidm/commons/workflow
    */
    var result = idmUtils.getWorkflowNames();
    return {"result": result};
  }
  else {
    __.requestError('User request not supported.  If you are using an id in your request, please verify that it is correct.', 400);
  }
}

main();
