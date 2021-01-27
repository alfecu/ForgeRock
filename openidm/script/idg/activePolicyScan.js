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

run();
function run() {
  queryParams = request.additionalParameters;

  if (
    utils.methodIs('READ') &&
    (utils.urlParamsCount(request.resourcePath, 0) || utils.urlParamsCount(request.resourcePath, 1))
  ) {
    /*
     * GET request that returns the list of active policy scans 
     */

    var _queryFilter = null;
    
    if (request.resourcePath && request.resourcePath !== null) {

      _queryFilter = '/_id eq "' + request.resourcePath.replace('%20','') + '"';
    }
    else {
      _queryFilter = 'true';
    }

    var policies = openidm.query(CONSTANT.REPO_PATH.POLICY_SCAN, {_queryFilter: _queryFilter}).result

    return {
      activePolicyScans: policies
    };

  }//end:else-if

  __.requestError('Request not supported.', 400);

}//end:run()
