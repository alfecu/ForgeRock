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
var displayUtils = require('idg/utils/displayUtils.js');
var qf = require('idg/utils/queryFilter.js');
var c = require('idg/utils/campaign.js');

var queryParams = null;
var CERTIFICATION_TYPE = 'user';
var CERT_REPO_PATH = null;
var EVENT_REPO_PATH = null;
var ID_MAP = {};


run();
function run() {
  
  queryParams = request.additionalParameters;

  if (
    utils.methodIs('READ') &&
    utils.urlParamsCount(request.resourcePath, 2)
  ) {
    /*
     * GET request that returns the requested cert by ID
     * Usage: /openidm/governance/adminCertification/<certType>/<ID>
     */
    var url = request.resourcePath;
    var urlSegments = url.split('/');
    setCertificationPaths(urlSegments[0]);
    var campaignId = urlSegments[1];

    var campaign = c.getCampaignAndUpdateInformation(campaignId, CERTIFICATION_TYPE);
    return wrapCampaignForDisplay(campaign, ID_MAP, true);  
  }
  else if (
    utils.methodIs('READ') &&
    utils.urlParamsCount(request.resourcePath, 1) &&
    (
      utils.queryParamsAre(['status']) ||
      utils.queryParamsAre(['status', 'pageNumber', 'pageSize', 'sortBy']) ||
      utils.queryParamsAre(['status', 'pageNumber', 'pageSize', 'sortBy', 'q'])
    )
  ) {
    /*
     * GET request that returns a list of all certs for URL params
     * Active: ?status=in+progress,reviewed
     * Closed: ?status=cancelled,signed-Off,expired,terminated
     */

    // NOTE: get pagination information from request. Set defaults if not provided
    var PAGE_SIZE = Number(queryParams.pageSize);
    var PAGE_NUMBER = Number(queryParams.pageNumber) || 0;
    var SORT_BY = queryParams.sortBy || 'name';
    var FILTER = queryParams.q || false;
    var STATUS = queryParams.status;
    var response = null;

    var PAGE_OFFSET = (PAGE_NUMBER - 1) * PAGE_SIZE;

    setCertificationPaths(request.resourcePath);

    var params = {
      _queryFilter: qf.queryCertsByStatus(STATUS, FILTER, true),
      _pageSize: PAGE_SIZE,
      _pagedResultsOffset: PAGE_OFFSET || 0,
      _sortKeys: SORT_BY
    };
    var res = openidm.query(CERT_REPO_PATH, params);

    // Build object with specific properties
    res.result = res.result.map(function(cert) {
      return wrapCampaignForDisplay(cert, ID_MAP);
    });

    return res;
    
  }//end:else-if

  __.requestError('IDG: adminCertification.js: Request not supported.', 400);

}//end:run

// Set constants for certification type and paths
function setCertificationPaths(certType) {
  CERTIFICATION_TYPE = certType;

  if (CERTIFICATION_TYPE !== 'user' && CERTIFICATION_TYPE !== 'object') {
    __.requestError('The provided type "' + CERTIFICATION_TYPE + '" is not a valid certification type.', 400);
  }

  CERT_REPO_PATH = CERTIFICATION_TYPE === 'user' ? CONSTANT.REPO_PATH.USER_CERT : CONSTANT.REPO_PATH.OBJECT_CERT;
  EVENT_REPO_PATH = CERTIFICATION_TYPE === 'user' ? CONSTANT.REPO_PATH.USER_EVENT : CONSTANT.REPO_PATH.OBJECT_EVENT;
}

function wrapCampaignForDisplay(cert, id_map, detailedView) {
  var stgs = cert.stages;
  var numStages = stgs.length;
  var lastStageDeadline = stgs[numStages - 1].deadline;
  cert = c.updateCampaignStatusNumbers(cert);

  var certData = {
    _id: cert._id,
    name: cert.name,
    description: cert.description,
    cancellable: cert.cancellable,
    certObjectType: cert.certObjectType,
    frequency: cert.frequency,
    totalEventCount: cert.totalEventCount,
    totalEventsComplete: cert.totalEventsComplete,
    totalEventsIncomplete: cert.totalEventsIncomplete,
    startDate: cert.startDate,
    deadline: lastStageDeadline,
    nextDeadline: cert.nextDeadline,
    status: cert.status,
    progress: (cert.totalEventsComplete / cert.totalEventCount) * 100,
    openCertifierIds: cert.openCertifierIds,
    closedCertifierIds: cert.closedCertifierIds,
    completionDate: cert.completionDate,
  };

  if (detailedView) {
    certData.stages = cert.stages;
  }

  certData = displayUtils.addDisplayNamesToCampaign(certData, null, id_map, true);

  if (certData.status === 'creating') {
    var fields = ['_id'];
    var events = c.getEventsInCampaign(certData._id, CERTIFICATION_TYPE, fields);
    certData.createdEventCount = events ? events.length : 0;
  }

  return certData;
}

