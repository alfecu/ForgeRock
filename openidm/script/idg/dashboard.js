var _ = require('commons/lib/lodash4.js');
var __ = require('commons/utils/jsUtils.js');
var moment = require('commons/lib/moment.js')
var idmUtils = require('commons/utils/idmUtils.js');
var CCONSTANT = require('commons/utils/globalConstants.js');
var utils = require('idg/utils/generalUtilities.js');
var displayUtils = require('idg/utils/displayUtils.js');
var qf = require('idg/utils/queryFilter.js');
var c = require('idg/utils/campaign.js');

var queryParams = null;
var USERNAME = null;
var USER_ID = null;
var INTERNAL = false
var AUTH_ROLES = null;

run();
function run() {
    var authInfo = openidm.read('info/login');
    USER_ID = authInfo.authorization.id
    USERNAME = authInfo.authenticationId;
    AUTH_ROLES = authInfo.authorization.roles;

    queryParams = request.additionalParameters;
    var FILTER = queryParams.q || false;
    LOGGED_IN_USER_ID = idmUtils.getUserIdFromCookie(context);

    var PAGE_SIZE = Number(queryParams.pageSize);
    var PAGE_NUMBER = Number(queryParams.pageNumber) || 0;
    var SORT_BY = queryParams.sortBy || 'name';
    var FILTER = queryParams.q || false;
    var STATUS = queryParams.status;
    var TYPE = queryParams.type;
    var PAGE_OFFSET = (PAGE_NUMBER - 1) * PAGE_SIZE;
      
    if (utils.methodIs('READ') &&
    (utils.urlParamsCount(request.resourcePath, 0) ||
    (utils.urlParamsCount(request.resourcePath, 1) && isAdmin()))
    ) {
      if(!queryParams.status || !queryParams.type){
        __.requestError('Request must include status and type', 400);
      }
      
      var userOnly = utils.urlParamsCount(request.resourcePath, 1);
      var userToSearch = userOnly ? request.resourcePath : LOGGED_IN_USER_ID;

      if (TYPE === 'violation') {
        queryParams.owner = idmUtils.ensureUserIdLong(userToSearch);
        var endpoint = utils.urlParamsCount(request.resourcePath, 1) ? 'governance/violation/admin' : 'governance/violation';
        return openidm.read(endpoint, queryParams);
      }
      else {
        var FIELDS = [ '_id', 'name', 'description', 'openCertifierIds', 'closedCertifierIds', 'startDate', 'deadline', 'totalEventCount', 'certObjectType', 'status', 'stages', 'completionDate' ]
        var query = qf.queryDashboard(STATUS, TYPE, FILTER, userToSearch, userOnly);
        var params = {
          "_queryFilter" : query,
          _pageSize: PAGE_SIZE,
          _pagedResultsOffset: PAGE_OFFSET,
          _sortKeys: SORT_BY,
          _fields: FIELDS,
        };

        var results = openidm.query(getPath(TYPE), params);

        _.forEach(results.result, function(campaign) {
          getCertifierOptionsForUser(campaign, STATUS, userToSearch, userOnly);
        });

        mapResultsForFrontEnd(results.result)
        return results;
      }
    }
    else{
        __.requestError('Operation not supported', 400);
    }
}

function getPath(paramPath){
  switch(paramPath){
    case 'user':
      return 'repo/governance/userCertification/'
    case 'object':
      return 'repo/governance/objectCert/';
    case 'violation':
      return 'repo/governance/violation/';
    default:
      return null;
  }
}

function getCertifierOptionsForUser(campaign, status, userToSearch, userOnly) {
  var identifier = status === 'active' ? 'openCertifierIds' : 'closedCertifierIds';
  if (!campaign[identifier] || campaign[identifier] === '') {
    return;
  }
  var certifierOptions = [];
  var longUserId = idmUtils.ensureUserIdLong(userToSearch);

  if (_.includes(campaign[identifier], longUserId)) {
    certifierOptions.push(longUserId);
  }
  if (!userOnly) {
    var userRoles = idmUtils.getUserRoles(longUserId);
    _.forEach(userRoles, function(id) {
      if (_.includes(campaign[identifier], id)) {
        certifierOptions.push(id);
      }
    });
  }

  campaign[identifier] = certifierOptions.join(',');
}

function mapResultsForFrontEnd(results, type) {
  var idMap = {}
  return _.map(results, function(result) {
    if (type === 'violation') {
      displayUtils.addDisplayNamesToViolation(result, null, idMap, false);
    }
    else {
      displayUtils.addDisplayNamesToCampaign(result, null, idMap, false);
    }
    return result;
  });
} 

function isAdmin() {
  return _.includes(AUTH_ROLES, idmUtils.ensureInternalRoleIdLong(CCONSTANT.ROLE.GOV_ADMIN));
}