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
var moment = require('commons/lib/moment.js')
var SCHEDULED = false;

var queryParams = null;
var CURRENT_TIME = null;
var USER_CERT_TOTALS = null;
var OBJECT_CERT_TOTALS = null;
var ACTIVE_USER_EVENT_TOTALS = null;
var POLICY_TOTALS = null;
var GLOSSARY_TOTALS = null;
var ACTIVE_USER_CERTS = null;
var ACTIVE_OBJECT_CERTS = null;
var ACTIVE_VIOLATIONS = null;
var POLICY_RESULTS = null;
var ENTITLEMENT_RESULTS = null;
var ENTITLEMENT_TOTALS = null;
var VIOLATION_TOTALS = null;

var PAGE_NUMBER = 1;
var TABLE_SIZE = 5

// If we want to make the dashboard results customizable in the future, this list can/should be read from a settings file
// and then used to grab the desired data for the front end
var STATISTIC_LIST = [
  'activeUserCampaigns', 
  'activeUserEvents', 
  'activeObjectCampaigns', 
  'activePolicies',
  'activeViolations',
  'glossaryEntries',
  'upcomingUserCertificationDeadlines',
  'upcomingObjectCertificationDeadlines',
  'upcomingViolationDeadlines',
  'mostCertifiedEntitlements',
  'mostRevokedEntitlements',
  'highestViolationCount',
  'certificationResults',
  'violationResults',
];

var REPO_STATS = [
  'highestViolationCount',
  'mostCertifiedEntitlements',
  'mostRevokedEntitlements',
  'certificationResults',
  'violationResults',
];

run();
function run() {
  try {
    queryParams = request.additionalParameters;
  }
  catch (e) {
    queryParams = {};
    SCHEDULED = true;
  }

  CURRENT_TIME = moment().format();

  /*
   * Get a specific piece of data for the admin dashboard charts (entitlement/policy history)
   * 
   * GET /governance/adminDashboard?action=<action>
   */
  if (utils.methodIs('READ') &&
    utils.urlParamsCount(request.resourcePath, 0) &&
    queryParams.hasOwnProperty('action')) {

    var ACTION = queryParams.action;
    var FILTER = queryParams.q;
    var ID = queryParams.id;

    // Get list of available entitlements to view on dashboard, with optional filter
    if (ACTION === 'getStoredEntitlements') {
     
      var results = [];
      var repo = readDashboardRepoData();
      _.forOwn(repo.entitlements, function(value, key) {
        if (FILTER && !_.includes(value.displayName.toLowerCase(), FILTER.toLowerCase())) {
          return;
        }
        results.push({ key: value._id, displayName: value.displayName });
      });
      
      return {
        result: _.sortBy(results, ['label'])
      }
      
    }
    // Get stored data on a given policy
    else if (ACTION === 'getPolicyTotals') {
      var results = [];
      var repo = readDashboardRepoData();
      var policies = repo ? repo.policies : {};
      var result = null;
      if (ID) {
        result = policies[ID] ? policies[ID] : 
        {
          violations: 0,
          remediated: 0,
          exceptions: 0,
          cancelled: 0,
          expired: 0,
          _id: ID,
          name: null,
        }
      }
      else {
        result = policies;
      }

      return {
        result: result
      }
    }
    else {
      __.requestError('Action: ' + ACTION + ' is not supported.', 400);
    }
  }
  else if (
    utils.methodIs('READ') &&
    utils.urlParamsCount(request.resourcePath, 1)
  ) {
    /*
     * GET request that returns the a single data set for the admin dashboards
     * 
     * GET /governance/adminDashboard/<statId>  (e.g. activePolicies)
     */

    PAGE_NUMBER = (queryParams.pageNumber) || 1;
    var requestedStat = request.resourcePath;
     
    if (PAGE_NUMBER < 1) {
      __.requestError('Page number must be greater than 0.', 400);
    }
    // Check that it stat is valid
    if (!_.includes(STATISTIC_LIST, requestedStat)) {
      __.requestError('The requested statistic "' + requestedStat + '" is not a valid option', 400);
    }

    // Make the appropriate REST call to get the relevant data for the stat
    var repo = _.includes(REPO_STATS, requestedStat) ? readDashboardRepoData() : null;
    fetchDataForStatistics(requestedStat, repo);

    var previousDataSet = repo && repo.previousStats && repo.previousStats.length > 0 ? repo.previousStats[repo.previousStats.length - 1] : null;
    var previousData = previousDataSet && previousDataSet[requestedStat] ? previousDataSet[requestedStat] : null;
    var repoLastUpdated = repo ? repo.lastUpdated : null;
    var dashboardData = processDataForStatistic(requestedStat, previousData, repoLastUpdated);
    
    return {
      result: dashboardData
    };
  }
  else if (
    (utils.methodIs('READ') &&
    utils.urlParamsCount(request.resourcePath, 0)) ||
    SCHEDULED
  ) {
    /*
     * GET request that returns the data for the admin dashboards
     * 
     * GET /governance/adminDashboard
     */
    
    var repo = readDashboardRepoData();
    
    // For each statistic, make the appropriate REST call to get the relevant data
    _.forEach(STATISTIC_LIST, function(statistic) {
      fetchDataForStatistics(statistic, repo);
    })

    var dashboardData = [];
    _.forEach(STATISTIC_LIST, function(name) {
      var previousDataSet = repo && repo.previousStats && repo.previousStats.length > 0 ? repo.previousStats[repo.previousStats.length - 1] : null;
      var previousData = previousDataSet && previousDataSet[name] ? previousDataSet[name] : null;
      var repoLastUpdated = repo ? repo.lastUpdated : null;
      var dataEntry = processDataForStatistic(name, previousData, repoLastUpdated);
      if (dataEntry) {
        dashboardData.push(dataEntry);
      }
    });

    if (SCHEDULED || !repo) {
      repo = updateRepoData(repo, dashboardData);
    }

    return {
      result: {
        stats: dashboardData
      }
    };

  }//end:else-if

  __.requestError('Request not supported.', 400);

}//end:run()

function updateRepoData(repoData, dashboardData) {
  var currentRepoData = {}
  currentRepoData.lastUpdated = moment().format();

  // Update entitlement data
  var currentEntitlementData = openidm.read('governance/userEventData/object').result;
  currentRepoData.entitlements = currentEntitlementData.entitlements;
  currentRepoData.entitlementTotals = currentEntitlementData.entitlementTotals;

  //Update violation data
  var lastUpdated = repoData && repoData.lastUpdated ? repoData.lastUpdated : null;
  var currentPolicyData = updateStoredPolicyInformation(repoData, lastUpdated);
  currentRepoData.policies = currentPolicyData.policies;
  currentRepoData.policyTotals = currentPolicyData.policyTotals;

  // For any value in the current data that is a number, save to daily repo snapshot for daily percentage change comparisons, up to 60 iterations
  var previousStats = repoData && repoData.previousStats ? repoData.previousStats : null;
  currentRepoData.previousStats = previousStats || [];
  if (currentRepoData.previousStats.length >= 59) {
    currentRepoData.previousStats = currentRepoData.previousStats.slice(Math.max(currentRepoData.previousStats.length - 59, 0));
  }

  var newStats = {
    updated: currentRepoData.lastUpdated
  };
  _.forEach(dashboardData, function(entry) {
    if (entry.value && !isNaN(entry.value) && !__.__isArray(entry.value)) {
      newStats[entry.label] = entry.value;
    }
  });
  currentRepoData.previousStats.push(newStats);

  // Save data to repo
  openidm.update(CONSTANT.REPO_PATH.ENTITLEMENT_HISTORY, null, currentRepoData);

  return currentRepoData;
}

// Get stored repository object with dashboard data
function readDashboardRepoData() {
  var adminDashboardData = {};
  try {
    adminDashboardData = openidm.read(CONSTANT.REPO_PATH.ENTITLEMENT_HISTORY);
  }
  catch(e) {
    adminDashboardData = openidm.read(CONSTANT.REPO_PATH.ADMIN_DASHBOARD_BACKUP);
  }
  return adminDashboardData;
}

function getTotals(type) {
  var totals = {};
  var queryInfo = getQueryInformationForType(type);
  var params = {
    _queryFilter: queryInfo.queryFilter || 'true',
    _fields: queryInfo.fields,
  }
  var results = queryRepo(queryInfo.repoPath, params)
  totals.total = results.length;
  totals.totalsByType = {};

  _.forEach(results, function(result) {
    if (!result[queryInfo.type]) {
      return;
    }
    if (!totals.totalsByType[result[queryInfo.type].toString()]) {
      totals.totalsByType[result[queryInfo.type].toString()] = 0;
    }
    totals.totalsByType[result[queryInfo.type].toString()] += 1;
  });

  return totals;
}

function getCertificationsByDeadline(type) {
  var queryInfo = getQueryInformationForType(type);
  var params = {
    _queryFilter: 'status eq "in-progress"',
    _fields: ['_id', 'name', 'nextDeadline'],
    _sortKeys: "nextDeadline",
    _pageSize: TABLE_SIZE,
    _pagedResultsOffset: TABLE_SIZE * (PAGE_NUMBER - 1),
  }
  var certs = queryRepo(queryInfo.repoPath, params);
  return certs;
}

function queryRepo(repoPath, params) {
  var queryResult = openidm.query(repoPath, params);
  return queryResult.result;
}

function updateStoredPolicyInformation(repoData, lastUpdated) {
  var policyData = null;
  if (!repoData) {
    policyData = {
      policies: {},
      policyTotals: {
        violations: 0,
        remediated: 0,
        exceptions: 0,
        cancelled: 0,
        expired: 0,
      }
    };
  }
  else {
    policyData = {
      policies: repoData.policies || {},
      policyTotals: repoData.policyTotals || {
        violations: 0,
        remediated: 0,
        exceptions: 0,
        cancelled: 0,
        expired: 0,
      },
    }
  }

  var _queryFilter = lastUpdated ? 'startDate gt "' + lastUpdated + '"' : 'true';
  var queryInfo = getQueryInformationForType('all-violations');
  var params = {
    _sortKeys: '-startDate',
    _fields: queryInfo.fields,
    _queryFilter: _queryFilter,
  }
  var violations = queryRepo(queryInfo.repoPath, params);
  
  if (violations.length === 0) {
    return policyData;
  }

  _.forEach(violations, function(violation) {
    if (!policyData.policies[violation.policyId]) {
      policyData.policies[violation.policyId] = {
        violations: 0,
        remediated: 0,
        exceptions: 0,
        cancelled: 0,
        expired: 0,
        _id: violation.policyId,
        name: violation.policyName,
      }
    }
    policyData.policyTotals.violations++;
    policyData.policies[violation.policyId].violations++;
    switch(violation.status) {
      case CONSTANT.STATUS.CANCELLED:
        policyData.policyTotals.cancelled++;
        policyData.policies[violation.policyId].cancelled++;
        break;
      case CONSTANT.STATUS.REMEDIATED:
        policyData.policyTotals.remediated++;
        policyData.policies[violation.policyId].remediated++;
        break;
      case CONSTANT.STATUS.EXCEPTION:
      case CONSTANT.STATUS.EXCEPTION_EXPIRED:
        policyData.policyTotals.exceptions++;
        policyData.policies[violation.policyId].exceptions++;
        break;
      case CONSTANT.STATUS.EXPIRED:
        policyData.policyTotals.expired++;
        policyData.policies[violation.policyId].expired++;
        break;
      default:
        break;
    }
  });

  return policyData;
}

function getViolationsByDeadline() {
  var params = {
    status: 'active',
    sortBy: 'expirationDate',
    fields: '_id,policyName,policyId,targetId,target,owner,ownerDisplayName,expirationDate',
    pageSize: TABLE_SIZE,
    pageNumber: PAGE_NUMBER,
  }
  return openidm.read('governance/violation/admin', params).result;
}

function fetchDataForStatistics(statistic, repo) {
  switch (statistic) {
  case 'activeUserCampaigns':
    USER_CERT_TOTALS = getTotals('activeUser');
    break;
  case 'activeObjectCampaigns':
    OBJECT_CERT_TOTALS = getTotals('activeObject');
    break;
  case 'activeUserEvents':
    ACTIVE_USER_EVENT_TOTALS = getTotals('activeUserEvents');
    break;
  case 'glossaryEntries':
    GLOSSARY_TOTALS = getTotals('glossary');
    break;
  case 'activePolicies':
    POLICY_TOTALS = getTotals('policies');
    break;
  case 'upcomingUserCertificationDeadlines':
    ACTIVE_USER_CERTS = getCertificationsByDeadline('user');
    break;
  case 'upcomingObjectCertificationDeadlines':
    ACTIVE_OBJECT_CERTS = getCertificationsByDeadline('object');
    break;
  case 'upcomingViolationDeadlines':
  case 'activeViolations':
    ACTIVE_VIOLATIONS = ACTIVE_VIOLATIONS !== null ? ACTIVE_VIOLATIONS : getViolationsByDeadline();
    break;
  case 'highestViolationCount':
    POLICY_RESULTS = (POLICY_RESULTS || !repo) ? POLICY_RESULTS : _.values(repo.policies);
    break;
  case 'mostCertifiedEntitlements': 
  case 'mostRevokedEntitlements':
    ENTITLEMENT_RESULTS = (ENTITLEMENT_RESULTS || !repo) ? ENTITLEMENT_RESULTS : _.values(repo.entitlements);
    break;
  case 'certificationResults':
    ENTITLEMENT_TOTALS = (ENTITLEMENT_TOTALS || !repo) ? ENTITLEMENT_TOTALS : repo.entitlementTotals;
    break;
  case 'violationResults':
    VIOLATION_TOTALS = (VIOLATION_TOTALS || !repo) ? VIOLATION_TOTALS : repo.policyTotals;
    break;
  }
}

function paginateRepoList(data) {
  if (!data) {
    return
  }
  else {
    var offset = (PAGE_NUMBER - 1) * TABLE_SIZE;
    return data.slice(offset, offset + TABLE_SIZE);
  }
}

function processDataForStatistic(name, previousValue, lastUpdated) {
  var dataEntry = null
  switch (name) {
    case 'activeUserCampaigns':
      dataEntry = wrapDataForFrontend(name, USER_CERT_TOTALS.totalsByType['in-progress'] || 0, previousValue, CURRENT_TIME, CONSTANT.CHART_TYPE.STAT_CARD);
      break;
    case 'activeObjectCampaigns':
      dataEntry = wrapDataForFrontend(name, OBJECT_CERT_TOTALS.totalsByType['in-progress'] || 0, previousValue, CURRENT_TIME, CONSTANT.CHART_TYPE.STAT_CARD);
      break;
    case 'activeUserEvents':
      dataEntry = wrapDataForFrontend(name, ACTIVE_USER_EVENT_TOTALS.total || 0, previousValue, CURRENT_TIME, CONSTANT.CHART_TYPE.STAT_CARD);
      break;
    case 'activePolicies':
      dataEntry = wrapDataForFrontend(name, POLICY_TOTALS.total || 0, previousValue, CURRENT_TIME, CONSTANT.CHART_TYPE.STAT_CARD);
      break;
    case 'activeViolations':
      dataEntry = wrapDataForFrontend(name, ACTIVE_VIOLATIONS.length, previousValue, CURRENT_TIME, CONSTANT.CHART_TYPE.STAT_CARD);
      break;
    case 'glossaryEntries':
      dataEntry = wrapDataForFrontend(name, GLOSSARY_TOTALS.total, previousValue, CURRENT_TIME, CONSTANT.CHART_TYPE.STAT_CARD);
      break;
    case 'upcomingUserCertificationDeadlines':
      dataEntry = wrapDataForFrontend(name, ACTIVE_USER_CERTS, previousValue, CURRENT_TIME, CONSTANT.CHART_TYPE.TABLE, 'userCertification');
      break;
    case 'upcomingObjectCertificationDeadlines':
      dataEntry = wrapDataForFrontend(name, ACTIVE_OBJECT_CERTS, previousValue, CURRENT_TIME, CONSTANT.CHART_TYPE.TABLE, 'objectCertification');
      break;
    case 'upcomingViolationDeadlines':
      dataEntry = wrapDataForFrontend(name, ACTIVE_VIOLATIONS, previousValue, CURRENT_TIME, CONSTANT.CHART_TYPE.TABLE, 'violation');
      break;
    case 'mostCertifiedEntitlements':
      var sortedByCertified = sortEntitlements(ENTITLEMENT_RESULTS, 'certifyPercentage', true);
      paginatedMostCertified = paginateRepoList(sortedByCertified);
      dataEntry = wrapDataForFrontend(name, paginatedMostCertified, previousValue, lastUpdated, CONSTANT.CHART_TYPE.TABLE, 'entitlementsCertified');
      break;
    case 'mostRevokedEntitlements':
      var sortedByRevoked = sortEntitlements(ENTITLEMENT_RESULTS, 'revokePercentage', true);
      paginatedMostRevoked = paginateRepoList(sortedByRevoked);
      dataEntry = wrapDataForFrontend(name, paginatedMostRevoked, previousValue, lastUpdated, CONSTANT.CHART_TYPE.TABLE, 'entitlementsRevoked');
      break;
    case 'highestViolationCount':
      var mostViolations = sortEntitlements(POLICY_RESULTS, 'violations', true);
      mostViolationsPaginated = paginateRepoList(mostViolations);
      dataEntry = wrapDataForFrontend(name, mostViolationsPaginated, previousValue, lastUpdated, CONSTANT.CHART_TYPE.TABLE, 'policy');
      break;
    case 'certificationResults':
      dataEntry = wrapDataForFrontend(name, ENTITLEMENT_TOTALS, previousValue, lastUpdated, CONSTANT.CHART_TYPE.PIE, 'certificationTotals');
      break;
    case 'violationResults':
      dataEntry = wrapDataForFrontend(name, VIOLATION_TOTALS, previousValue, lastUpdated, CONSTANT.CHART_TYPE.PIE, 'policyTotals');
      break;
    default:
      dataEntry = null;
      break;
  }
  return dataEntry;
}

function wrapDataForFrontend(label, value, previousValue, lastUpdated, displayType, dataType) {
  
  if (!value && value !== 0) {
    return null;
  }
  var change = 0;
  if (value && previousValue && !isNaN(value) && !isNaN(previousValue)) {
    var diff = value - previousValue;
    if (diff === 0) {
      change = 0;
    }
    else if (previousValue === 0) {
      change = 100;
    }
    else {
      change = (diff / previousValue) * 100;
    }
    change = change.toFixed(1);
  }
  if (displayType === CONSTANT.CHART_TYPE.PIE) {
    var list = [];
    _.forOwn(value, function(value, key) {
      if (key !== 'totalCompleted' && key !== 'violations') {
        list.push({key: key, value: value});
      }
    });
    value = sortEntitlements(list, dataType, false);
  }
  return {
    label: label,
    value: value,
    change: change,
    lastUpdated: lastUpdated,
    displayType: displayType,
    dataType: dataType,
  };
}

function getQueryInformationForType(type) {
  switch(type) {
    case 'user':
      return {
        repoPath: CONSTANT.REPO_PATH.USER_CERT,
        fields: ['status'],
        type: 'status',
      }
    case 'activeUser':
      return {
        repoPath: CONSTANT.REPO_PATH.USER_CERT,
        fields: ['status'],
        type: 'status',
        queryFilter: 'status eq "in-progress"',
      }
    case 'object':
      return {
        repoPath: CONSTANT.REPO_PATH.OBJECT_CERT,
        fields: ['status'],
        type: 'status',
        queryFilter: 'status eq "in-progress"',
      }
    case 'activeObject':
      return {
        repoPath: CONSTANT.REPO_PATH.OBJECT_CERT,
        fields: ['status'],
        type: 'status',
      }
    case 'violations':
      return {
        repoPath: CONSTANT.REPO_PATH.VIOLATION,
        fields: ['policyName','policyId','startDate','targetId','owner','ownerDisplayName','expirationDate'],
        type: null,
      }
    case 'all-violations':
      return {
        repoPath: CONSTANT.REPO_PATH.VIOLATION,
        fields: ['policyName','policyId','startDate','status'],
        type: null
      }
    case 'userEvent':
      return {
        repoPath: CONSTANT.REPO_PATH.USER_EVENT,
        fields: ['status'],
        type: 'status',
      }
    case 'activeUserEvents':
      return {
        repoPath: CONSTANT.REPO_PATH.USER_EVENT,
        fields: ['status'],
        type: 'status',
        queryFilter: 'status eq "in-progress" or status eq "reviewed"',
      }
    case 'objectEvent':
      return {
        repoPath: CONSTANT.REPO_PATH.OBJECT_EVENT,
        fields: ['status'],
        type: 'status',
      }
    case 'glossary':
      return {
        repoPath: CONSTANT.REPO_PATH.GLOSSARY,
        fields: ['class'],
        type: 'class',
      }
    case 'policies':
      return {
        repoPath: 'managed/policy',
        fields: ['_id', 'active'],
        type: 'active',
      }
    default:
      return null;
  }
}

function sortEntitlements(items, type, ascendingOrder) {
  if (!items) {
    return null;
  }
  var sortFunc = getSortFunction(type, ascendingOrder);
  var sorted = sortFunc ? items.sort(sortFunc) : items.sort;
  return sorted;
}

function getSortFunction(type, ascendingOrder) {
  switch(type) {
    case 'certifyPercentage':
    case 'revokePercentage':
    case 'abstainPercentage':
    case 'violations':
      return function(a, b) {
        if (b[type] - a[type] === 0) {
          return b.totalCompleted - a.totalCompleted;
        }
        else if (ascendingOrder) {
          return b[type] - a[type];
        }
        else {
          return a[type] - b[type];
        }
      }
    case 'policyTotals':
    case 'certificationTotals':
      return function(a, b) {
        return b.value - a.value;
      }
    default:
      return null;
  }
}