/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
Glossary endpoint for all your glossary needs, such as fetching glossary data, importing new data into glossary, exporting glossary.
*/
var __ = require('commons/utils/jsUtils.js');
var idmUtils = require('commons/utils/idmUtils.js');
var glossary = require('commons/utils/glossaryUtils.js');
var glossaryCRUD = require('commons/utils/glossaryCRUD.js');
var glossaryUtils = require('commons/utils/glossaryUtils.js');

// get params
var url = request.resourcePath;
var urlSegments = url.split('/');
var PARAMS = request.additionalParameters;
var METHOD = null;
try {
  METHOD = request.method;
} catch(e) {
  // pass
}

// FUNCTION is the suffix AFTER /openidm/commons/glossary
var FUNCTION = urlSegments[urlSegments.length - 1];

function main() {
  if (METHOD === 'read' && FUNCTION === '') {
    /*
     * ~~~~~~~~~ USAGE ~~~~~~~~
     * method: GET
     * URL: /openidm/commons/glossary?queryFilter=<optional>&fields=<optional>
     * queryFilter: If supplied, a valid IDM query filter.
     * fields: If supplied, a comma separated list of object keys to include in the returned objects.
    */
    var queryParams = idmUtils.getQueryParams(PARAMS);
    return glossaryCRUD.queryObjs(queryParams, PARAMS.displayable);
  }
  else if (METHOD === 'read' && FUNCTION === 'managed' && PARAMS.targetId) {
    /*
     * ~~~~~~~~~ USAGE ~~~~~~~~
     * method: GET
     * URL: /openidm/commons/glossary/managed?targetId='managed/role/ID'
    */
    return glossaryUtils.getDisplayableGlossaryObjectForEntitlement(PARAMS.targetId);
  }
  else if (METHOD === 'read' && idmUtils.isInIdFormat(FUNCTION)) {
    /*
     * ~~~~~~~~~ USAGE ~~~~~~~~
     * method: GET
     * URL: /openidm/commons/glossary/<glossary object id>
    */
    var obj_id = FUNCTION;
    return glossaryCRUD.getObjById(obj_id, PARAMS.displayable);
  }
  else if (METHOD === 'create' && FUNCTION === '') {
    /*
     * ~~~~~~~~~ USAGE ~~~~~~~~
     * method: POST
     * URL: /openidm/commons/glossary
     * Content-Type: application/json
     * body/content: {
     *   "class": "identity",
     *   "attributeName": "jobCode",
     *   "certifiable": false,
     *   "displayable": true,
     *   "mykey": "myvalue",
     *   "description": "The code of the job."
     * }
     */
    var content = request.content;
    var obj = content;
    return glossaryCRUD.createNewObj(obj);
  }
  else if (METHOD === 'create' && FUNCTION === 'put') {
    /*
     * ~~~~~~~~~ USAGE ~~~~~~~~
     * method: POST
     * URL: /openidm/commons/glossary/put
     * Content-Type: application/json
     * body/content: {
     *   "_id": "14cce5f2-fcc6-4869-a79b-8c2a2e71ee18",
     *   "class": "identity",
     *   "attributeName": "jobCode",
     *   "certifiable": false,
     *   "displayable": true,
     *   "mykey": "myvalue",
     *   "description": "The code of the job."
     * }
     */
    var content = request.content;
    var obj = content;
    return glossaryCRUD.createOrUpdateObj(obj);
  }
  else if (METHOD === 'delete' && idmUtils.isInIdFormat(FUNCTION)) {
    /*
     * ~~~~~~~~~ USAGE ~~~~~~~~
     * method: DELETE
     * URL: /openidm/commons/glossary/<glossary object id>
    */
    var obj_id = FUNCTION;
    return glossaryCRUD.deleteObjById(obj_id);
  }
  else if (METHOD === 'read' && FUNCTION === 'exportToCSV') {
    /*
     * ~~~~~~~~~ USAGE ~~~~~~~~
     * method: GET
     * URL: /openidm/commons/glossary/exportToCSV
    */
    var csv_dict = glossary.exportToCSV();
    return {result: csv_dict};
  }
  // Note that a 'PUT' request didn't export the FUNCTION in the url, so I decided to use a POST request.
  else if (METHOD === 'create' && FUNCTION === 'importFromCSV') {
    /*
     * ~~~~~~~~~ USAGE ~~~~~~~~
     * method: POST
     * URL: /openidm/commons/glossary/importFromCSV
     * Content-Type: "application/json"
     * body: {
     *   objectClass: "<glossary object class name here>",
     *   csvString: "<csv file contents here as single string>"
     * }
    */
    var csv_string = request.content.csvString;
    var error_messages = glossary.importFromCSV(csv_string);
    return {
        result: 'CSV import complete. See errorMessages property for any errors.',
        errorMessages: error_messages,
    };
  }
  else {
    /*
     * Request not supported. Respond with bad request
     */
    __.requestError('Request not supported.  If you are using an id in your request, please verify that it is correct.', 400);
  }
}

main();
