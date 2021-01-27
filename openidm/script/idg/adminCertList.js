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
var displayUtils = require('idg/utils/displayUtils.js');
var qf = require('idg/utils/queryFilter.js');
var c = require('idg/utils/campaign.js');
var validate = require('idg/utils/validations.js');

var queryParams = null;

run();
function run() {
  queryParams = request.additionalParameters;

  if (
    utils.methodIs('READ') &&
    utils.urlParamsCount(request.resourcePath, 2)
  ) {
    /*
     * GET request that returns the certification summary for a cert id 
     */

    // NOTE: get pagination information from request. Set defaults if not provided
    var PAGE_SIZE = Number(queryParams.pageSize);
    var PAGE_NUMBER = Number(queryParams.pageNumber);
    var SORT_BY = queryParams.sortBy || 'email';
    var FILTER = queryParams.q || false;
    var SELECTED = queryParams.selected || 0;

    var url = request.resourcePath;
    var urlSegments = url.split('/');
    var CERTIFICATION_TYPE = urlSegments[0];
    var CAMPAIGN_ID = urlSegments[1];
    var CERT_REPO_PATH = CERTIFICATION_TYPE === 'user' ? CONSTANT.REPO_PATH.USER_CERT : CONSTANT.REPO_PATH.OBJECT_CERT;
    var EVENT_REPO_PATH = CERTIFICATION_TYPE === 'user' ? CONSTANT.REPO_PATH.USER_EVENT : CONSTANT.REPO_PATH.OBJECT_EVENT;

    validate.sortByForCerts(SORT_BY);

    var PAGE_OFFSET = (PAGE_NUMBER - 1) * PAGE_SIZE;

    // NOTE: fetch full Campaign repo object for ID provided
    var campaignObject = openidm.read(CERT_REPO_PATH + CAMPAIGN_ID);

    if (Number(SELECTED) + 1 > campaignObject.stages.length) {
      __.requestError('Campaign does not have a stage for the selected value.' + campaignObject.stages.length + ' + ' + (Number(SELECTED) + 1), 400);
    }

    // NOTE: build params
    var querySearchFilter = (FILTER) ?
      ' and ' + qf.certContainmentFilter(FILTER) :
      '';
      
    _queryCampaignId = '(campaignId eq "' + CAMPAIGN_ID + '")';
    var field_to_repo_key = {};
    if (CERTIFICATION_TYPE === 'user') {
      field_to_repo_key = utils.getDictOfFieldsToDisplayInUserTable();
    }
    else {
      field_to_repo_key = {
        'name': 'name',
        'description': 'description',
      }
    }
    var fields = _.keys(field_to_repo_key);

    if (FILTER) {
      querySearchFilter = 'and ('
      for (var i = 0; i < fields.length; i++) {
        querySearchFilter += '/' + fields[i] + ' co "' + FILTER + '"'
        if (i < fields.length - 1) {
          querySearchFilter += ' or '
        }
        else {
          querySearchFilter += ')'
        }
      }
    }

    // Build params object
    var params = {};
    if (PAGE_SIZE) {
      params._pageSize = PAGE_SIZE;
    }
    if (PAGE_OFFSET) {
      params._pagedResultsOffset = PAGE_OFFSET || 0;
    }
    if (SORT_BY) {
      params._sortKeys = SORT_BY;
    }

    campaignObject.stages.forEach(function(stg) {
      // put the certifier display name on the stage object
      if (String(stg.stageIndex) === SELECTED) {
        // Get events for stage
        params._queryFilter = qf.isEventInStage(CAMPAIGN_ID, String(stg.stageIndex)) + querySearchFilter;
        stg.events = openidm.query(EVENT_REPO_PATH, params).result;
      }
      else {
        stg.events = [];
      }
    });

    var id_map = {};
    campaignObject = displayUtils.addDisplayNamesToCampaign(campaignObject, null, id_map, true);
    campaignObject = c.updateCampaignStatusNumbers(campaignObject);

    return {
      result: campaignObject
    };

  }//end:else-if

  __.requestError('Request not supported.', 400);

}//end:run()
