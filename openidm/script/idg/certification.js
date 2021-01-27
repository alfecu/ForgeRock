/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
/* global request, context, openidm */
/* eslint consistent-return: off */
// note(ML): See scheduledCertification.js and triggeredCertification.js for where non-ad-hoc cert code begins.

var _ = require('commons/lib/lodash4.js');
var __ = require('commons/utils/jsUtils.js');
var moment = require('commons/lib/moment.js')
var idmUtils = require('commons/utils/idmUtils.js');
var glossaryCRUD = require('commons/utils/glossaryCRUD.js');
var COMMONSCONSTANT = require('commons/utils/globalConstants.js');
var CONSTANT = require('idg/utils/globalConstants.js');
var utils = require('idg/utils/generalUtilities.js');
var displayUtils = require('idg/utils/displayUtils.js');
var glossaryUtils = require('commons/utils/glossaryUtils.js');
var qf = require('idg/utils/queryFilter.js');
var c = require('idg/utils/campaign.js');
var CERT_VALS = require('idg/utils/certificationValidations.js');

var queryParams = null;
var _defaultCertifierIsSet = false;
var INVOKED_FROM_SCHEDULER = false;
var INVOKED_FROM_EVENT = false;
var scheduledCertId = null;
var action = null;
var USERNAME = null;
var CERT_OBJECT_TYPE = null;
var CERT_REPO_PATH = null;
var EVENT_REPO_PATH = null;
var SCHEDULED_PATH = null;
var ADHOC_TEMPLATE_PATH = null;
var TRIGGERED_TEMPLATE_PATH = null;
var SCHEDULED_TEMPLATE_PATH = null;
var DELEGATION_ENABLED = false;
var DELEGATE_PROPERTIES = null;
var DISPLAY_NAME_MAP = {};

run();
function run() {

  setRequestInformation()

  /*
   * POST /governance/certification?_action=create
   */
  if (utils.actionIs('CREATE', action) && (utils.methodIs('CREATE') || INVOKED_FROM_SCHEDULER)) {
    var _policyViolations = [];
    var reqBody = null;

    if (INVOKED_FROM_SCHEDULER) {
      var scheduledCertId = input.scheduledCertId;
      setCertificationPaths(input.certificationType);
      reqBody = openidm.read(SCHEDULED_PATH + scheduledCertId);
    }
    else {
      reqBody = request.content;
      setCertificationPaths(reqBody.certObjectType);
    }

    var frequency = reqBody.frequency || '';

    // Set certification type to 'Identity'
    reqBody.type = 'identity';
    if (frequency.toLowerCase() !== 'event-based' && frequency.toLowerCase() !== 'scheduled') {
      reqBody.frequency = 'Ad-hoc';
    }

    // validate target filter
    var targetFilter = reqBody.targetFilter;
    CERT_VALS.validateTargetFilter(targetFilter, CERT_OBJECT_TYPE);

    // NOTE: set cancellable
    reqBody.cancellable = true;

    // NOTE: Perform validations
    CERT_VALS.runAllPolicies(reqBody, _policyViolations);

    _policyViolations = _.uniq(_policyViolations);
    if (_policyViolations.length) {
      throw {
        code: 400,
        message: 'Policy violations',
        detail: { policyViolations: _policyViolations }
      };
    }

    // Check if default Certifier is set
    if (reqBody.defaultCertifierType && reqBody.defaultCertifierName) {
      _defaultCertifierIsSet = true;
    }

    var payload = reqBody;

    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     * START: Additional processing
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
    payload.startDate = moment().format();

    payload.status = CONSTANT.STATUS.CREATING;
    payload.totalEventCount = 0;

    processStageSpecificInput(payload);

    /*
     * SAVE CERTIFICATION
     */
    var newCert = openidm.create(CERT_REPO_PATH, null, payload);

    /*
     * CREATE AUDIT ENTRY
     */
    var objectId = CERT_REPO_PATH + newCert._id;
    var auditMsg = 'Certification has been created.';
    var auditEntry = buildAuditEntry('certification-audit', USERNAME, objectId, 'CREATE', null, newCert, 0, auditMsg, 'SUCCESS');
    utils.createNewAuditEvent(openidm, context, auditEntry);

    // Update scheduled cert definition
    if (INVOKED_FROM_SCHEDULER) {
      updateScheduledCertificationNextRunDate(scheduledCertId);
    }

    DELEGATE_PROPERTIES = utils.getDelegateProperties();
    DELEGATION_ENABLED = DELEGATE_PROPERTIES.isDelegationEnabled;

    startCertificationCreationThread(newCert);

    return {
      content: newCert
    };
  }
  else if (
    utils.methodIs('READ') &&
    (utils.urlParamsCount(request.resourcePath, 0) ||
     utils.urlParamsCount(request.resourcePath, 1)) &&
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
    var PAGE_SIZE = Number(queryParams.pageSize) || 10;
    var PAGE_NUMBER = Number(queryParams.pageNumber) || 0;
    var SORT_BY = queryParams.sortBy || 'name';
    var FILTER = queryParams.q || false;
    var STATUS = queryParams.status;
    var response = null;

    var PAGE_OFFSET = (PAGE_NUMBER - 1) * PAGE_SIZE;

    var objectType = 'user'
    if (request.resourcePath !== '' && request.resourcePath !== 'user') {
      objectType = request.resourcePath
    }
    setCertificationPaths(objectType);

    // Search for certifications with this Status URL param
    var params = {
      _queryFilter: qf.queryCertsByStatus(STATUS, FILTER),
      _pageSize: PAGE_SIZE,
      _pagedResultsOffset: PAGE_OFFSET,
      _sortKeys: SORT_BY
    };
    var res = openidm.query(CERT_REPO_PATH, params);

    // Build object with specific properties
    response = res.result.map(function(cert) {
      var stgs = cert.stages;
      var numStages = stgs.length;
      var eventsPerStage;

      // NOTE: if "events" is not defined it means thread is not done creating them
      if (stgs[0].events) {
        eventsPerStage = stgs[0].events.length;
      }
      var lastStageDeadline = stgs[numStages - 1].deadline;

      return {
        _id: cert._id,
        name: cert.name,
        cancellable: cert.cancellable,
        type: cert.type,
        frequency: cert.frequency,
        eventsPerStage: eventsPerStage || CONSTANT.STATUS.PENDING,
        startDate: cert.startDate,
        deadline: lastStageDeadline
      }
    });

    return {
      result: response
    };

  }//end:else-if

  __.requestError('certification.js: Request not supported.', 400);

}//end:run()

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * HELPER FUNCTIONS
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Function _addStageData
 * ~~~~~~~~~~~~~~~~~~~~~~~~ */
function _addStageData(certStage, certRootObj, targetList, certifiable_attrs) {

  var certifierType = formatInput(certStage.certifierType);
  var certifierName = '';
  var certifierId = '';
  var isDelegated = false;
  var delegatedBy = null;
  var delegateMap = {};

  if (
    certifierType.equalsIgnoreCase('user') ||
    certifierType.equalsIgnoreCase('authzRoles') || 
    certifierType.equalsIgnoreCase('authzGroup')
    ) {
    certifierName = formatInput(certStage.certifierName);
    certifierId = formatInput(certStage.certifierId);
  }

  if (certifierType.equalsIgnoreCase('user') && DELEGATION_ENABLED) {
    var delegateUser = utils.getUserDelegate(certifierId, DELEGATE_PROPERTIES);
    if (delegateUser) {
      delegateMap[certifierId] = delegateUser;
      delegatedBy = certifierId;
      certifierId = delegateUser._id;
      certifierName = delegateUser.userName;
      isDelegated = true;
    }
  }


  var riskLevel = convertRiskLevelArray(certStage.riskLevelFilter);

  // Reference objects
  var openidmManagedObject = openidm.read('config/org.forgerock.openidm.managed').objects;
  var displayNameResource = openidm.read('config/managed').objects;
  
  var entitlementFilter = certStage.entitlementFilter;

  certifiable_attrs = processEntitlementFilter(certifiable_attrs, entitlementFilter);

  // Process certifier information ~~~~~~~~~~~~~~~~~~~~~~~~~~~
  if (certifierType.equalsIgnoreCase(CONSTANT.CERTIFIER_TYPE.AUTH_ROLE) || certifierType.equalsIgnoreCase(CONSTANT.CERTIFIER_TYPE.GROUP)) {
    certifierName = certifierName.substring(certifierName.lastIndexOf('/') + 1);
  }

  if (targetList) {

    // var governanceProperties = utils.getManagedGovernanceProps(null, null);
    var governanceProperties = {};

    targetList.forEach(function(targetInfo, _idx) {
      var targetId = targetInfo._id;
      var continueCertCreation = false;
      var newCertStatus = openidm.query(CERT_REPO_PATH, {
        _queryFilter: qf.isId(certRootObj._id),
        _fields: ['status']
      });
      if (newCertStatus.result && newCertStatus.result.length > 0) {
        continueCertCreation = newCertStatus.result[0].status === CONSTANT.STATUS.CREATING;
      }
  
      if (continueCertCreation) {
        insertUserCertEvents(
          openidm,
          targetId,
          certifierType,
          certifierName,
          certifierId,
          riskLevel,
          targetInfo,
          certifiable_attrs,
          governanceProperties,
          openidmManagedObject,
          displayNameResource,
          certStage,
          certRootObj,
          _idx,
          isDelegated,
          delegatedBy,
          delegateMap
        );
      }
    });
  }

}//end:_addStageData

/*
 * Function formatInput
 */
function formatInput(_input) {
  var input = _.isEmpty(_input) ? '' : _input;

  if (input.substring(0,1) === '"') {
    input = input.substring(1);
  }
  if (input.substring(input.length - 1) === '"') {
    input = input.substring(0,input.length - 1);
  }
  input = input.trim();
  return input;
}

/*
 * Function convertRiskLevelArray
 */
function convertRiskLevelArray(riskLevel) {
  var result = [];
  
  _.forEach(riskLevel, function(level) {
    var stringNumber = level.replace('"','');
    var intNumber = 0;
    var tempLow = 1;
    var tempHigh = 1;
    var isNumber = false;
    if (stringNumber.equalsIgnoreCase('low')) {
      tempHigh = getRiskLevelLowerValue();
    }
    else if (stringNumber.equalsIgnoreCase('Medium')) {
      tempLow = getRiskLevelLowerValue() + 1;
      tempHigh = getRiskLevelHigherValue();
    }
    else if (stringNumber.equalsIgnoreCase('High')) {
      tempLow = getRiskLevelHigherValue() + 1;
      tempHigh = 10;
    }
    else {
      //only if this is a valid number
      if (Number(stringNumber) !== NaN) {
        isNumber = true;
        intNumber = Number(stringNumber);
      }
    }
    if (isNumber === false) {
      while (tempLow <= tempHigh) {
        result.push(tempLow);
        tempLow++;
      }
    }
    else {
      //already validated
      result.push(intNumber);
    }
  });

  return result;
}

/*
 * Function getRiskLevelHigherValue
 */
function getRiskLevelHigherValue() {
  var riskLevel = getRiskLevelFromSettings();
  return riskLevel.higher;
}

/*
 * Function getRiskLevelLowerValue
 */
function getRiskLevelLowerValue() {
  var riskLevel = getRiskLevelFromSettings();
  return riskLevel.lower;
}

/*
 * Function getRiskLevelFromSettings
 */
function getRiskLevelFromSettings() {
  var riskLevel = openidm.read('governance/systemSettings', {field: 'riskLevel'}).systemSettings;
  return riskLevel.value;
}

/*
 * Function insertUserCertEvents
 */
function insertUserCertEvents(
  openidm,
  targetId,
  certifierType,
  certifierName,
  certifierId,
  riskLevel,
  targetInfo,
  certifiableList,
  governanceProperties,
  openidmManagedObject,
  displayNameResource,
  certStage,
  certRootObj,
  eventIndex,
  isDelegated,
  delegatedBy,
  delegateMap
) {
  // Comparison values
  var targetName = isUserCert() ? targetInfo.userName : targetInfo.name;
  var longTargetId = 'managed/' + CERT_OBJECT_TYPE + '/' + targetId

  var _tmpEvent = {
    campaignId: certRootObj._id,
    stageIndex: certStage.stageIndex,
    eventIndex: eventIndex,
    certifierType: certifierType,
    certifierId: certifierId,
    certifierName: certifierName,
    completionDate : null,
    completedBy : null,
    targetId: targetId,
    longTargetId: longTargetId,
    targetName: targetName,
    status: certStage.stageIndex === 0 ? CONSTANT.STATUS.IN_PROGRESS : CONSTANT.STATUS.PENDING,
    comments: [],
    outcome: null,
    expirationDate: moment(certStage.deadline).format(),
    isDelegated: isDelegated,
    delegatedBy: delegatedBy
  };

  var certifierFound = true;
  var prevEventObj;
  if (certStage.stageIndex > 0) {
    var prevStageIndex = _tmpEvent.stageIndex - 1;
    var fields = ['certifierType', 'status', 'certifierId', 'isDelegated', 'delegatedBy'];
    prevEventObj = c.getEvent(certRootObj._id, prevStageIndex, _tmpEvent.eventIndex, CERT_OBJECT_TYPE, true, fields);
  }

  //Calculate and set certifier information
  if (certStage.certifierType === CONSTANT.CERTIFIER_TYPE.GLOSSARY_KEY) {
    if (!governanceProperties[longTargetId]) {
      var tmpGlossaryObj = glossaryCRUD.queryObjs({ 
        _queryFilter: 'class eq "object" and objectId eq "' + longTargetId + '"'
      }).result[0];
      governanceProperties[longTargetId] = tmpGlossaryObj || null;
    }
    var targetEntry = governanceProperties[longTargetId];
    var targetCertifier = targetEntry[certStage.certifierKey] || null;
    // If glossary entry for the target item has the defined key, and it is a managed user or role
    if (targetEntry && targetCertifier && (_.includes(targetCertifier, 'managed/role') || _.includes(targetCertifier, 'managed/user'))) {
      if (_.includes(targetCertifier, 'managed/user')) {  
        certifierType = 'user'
        _tmpEvent.certifierType = 'user';
        _tmpEvent.certifierName = idmUtils.getUserName(targetCertifier);
        _tmpEvent.certifierId = idmUtils.ensureUserIdShort(targetCertifier);
        if (DELEGATION_ENABLED) {
          var delegateUser = utils.getUserDelegate(_tmpEvent.certifierId, DELEGATE_PROPERTIES);
          if (delegateUser) {
            delegateMap[_tmpEvent.certifierId] = delegateUser;
            _tmpEvent.delegatedBy = _tmpEvent.certifierId;
            _tmpEvent.certifierId = delegateUser._id;
            _tmpEvent.certifierName = delegateUser.userName;
            _tmpEvent.isDelegated = true;
          }
        }
      }
      else {
        certifierType = 'authzGroup'
        _tmpEvent.certifierType = 'authzGroup';
        _tmpEvent.certifierName = targetEntry.displayName;
        _tmpEvent.certifierId = targetCertifier;
      }
    } 
    else {
      certifierFound = false;
    }
  }
  if (certifierType === CONSTANT.CERTIFIER_TYPE.MANAGER) {
    _tmpEvent.certifierType = 'manager';
    if (_.isEmpty(targetInfo.manager)) {
      certifierFound = false;
    } else {
      _tmpEvent.certifierName = targetInfo.manager.userName;
      _tmpEvent.certifierId = targetInfo.manager._ref.substring(targetInfo.manager._ref.lastIndexOf('/') + 1);
      if (DELEGATION_ENABLED) {
        var delegateUser = checkForDelegate(delegateMap, _tmpEvent.certifierId);
        if (delegateUser) {
          delegateMap[_tmpEvent.certifierId] = delegateUser;
          _tmpEvent.delegatedBy = _tmpEvent.certifierId;
          _tmpEvent.certifierId = delegateUser._id;
          _tmpEvent.certifierName = delegateUser.userName;
          _tmpEvent.isDelegated = true;
        }
      }
    }
  }
  else if (certifierType === CONSTANT.CERTIFIER_TYPE.USER) {
    _tmpEvent.certifierType = 'user';
  }
  else if (
    certifierType.equalsIgnoreCase(CONSTANT.CERTIFIER_TYPE.AUTH_ROLE) || 
    certifierType.equalsIgnoreCase(CONSTANT.CERTIFIER_TYPE.GROUP)
  ) {
    _tmpEvent.certifierType = CONSTANT.CERTIFIER_TYPE.GROUP;
    _tmpEvent.certifierName = certifierName;
  }
  else if (certifierType === CONSTANT.CERTIFIER_TYPE.PREV_MANAGER) {
    //prevManager should not be set on first stage, or if the previous stage was a role.
    //set type to avoid null errors, but will use default certifier logic if available
    _tmpEvent.certifierType = 'prevManager';
    if(!prevEventObj) {
      certifierFound = false;
    } else {
      if (
        !prevEventObj.certifierType.equalsIgnoreCase(CONSTANT.CERTIFIER_TYPE.AUTH_ROLE) && 
        !prevEventObj.certifierType.equalsIgnoreCase(CONSTANT.CERTIFIER_TYPE.GROUP) &&
        !prevEventObj.status.equalsIgnoreCase('no-certifier')){
        // Get previous certifier id (or original certifier id delegated)
        var prevCertifierId = prevEventObj.isDelegated && prevEventObj.delegatedBy ? prevEventObj.delegatedBy : prevEventObj.certifierId;
        var prevCertifierObj = idmUtils.queryManagedUsers(prevCertifierId, ['manager', 'manager/userName'], COMMONSCONSTANT.IDM_METHOD.READ);
        if (prevCertifierObj.manager && !prevCertifierObj.manager._id.equalsIgnoreCase('')){
          _tmpEvent.certifierName = prevCertifierObj.manager.userName;  
          _tmpEvent.certifierId = prevCertifierObj.manager._id;
          if (DELEGATION_ENABLED) {
            var delegateUser = checkForDelegate(delegateMap, _tmpEvent.certifierId);
            if (delegateUser) {
              delegateMap[_tmpEvent.certifierId] = delegateUser;
              _tmpEvent.delegatedBy = _tmpEvent.certifierId;
              _tmpEvent.certifierId = delegateUser._id;
              _tmpEvent.certifierName = delegateUser.userName;
              _tmpEvent.isDelegated = true;
            }
          }
        }
        else{
          certifierFound = false;
        }
      } else {
        certifierFound = false;
      }
    }
  }
  else if (certifierType === CONSTANT.CERTIFIER_TYPE.ENTITLEMENT_OWNER) {
    /* 
     * If the certifierType is 'entitlementOwner', the variable certifierFound 
     * won't be set until after eventData is populated and the entitlement owner ids
     * are found.
     */
    _tmpEvent.certifierType = 'entitlementOwner';
    _tmpEvent.openCertifierIds = '';
    _tmpEvent.closedCertifierIds = '';
  }
  else {
    __.requestError('Unrecognized certifier type "' + certifierType + '".', 500);
  }

  /*  IDENTITY
    * Now with userFullId the whole long id, and eventId the certification event id, create data table fields
    * Creates data fields for Identity
    */
  _tmpEvent.eventData = {
    identity: createEventInformationData(targetInfo, openidmManagedObject),
    managedObject: [],
    application: [],
    metadata: [],
  };

  // Add each attribute from identity to the event's top level (for sorting and searching purposes)
  _.forEach(_tmpEvent.eventData.identity, function(item) {
    _tmpEvent[item.field] = item.fieldValue
  });

  var addMetadata = certStage.entitlementFilter.certifyMetadata === true;
  
  // Get the stage specific entitlements
  // NOTE: this will get passed whatever expressions are used to parse the entitlements once added to the parent function
  getStageEntitlements(_tmpEvent, targetInfo, governanceProperties, certifiableList, riskLevel, displayNameResource, targetName, delegateMap, addMetadata);

  var _riskLevels = __getRiskLevelsFromEventData(_tmpEvent.eventData);
  var riskScore = utils.calculateRiskScore(_riskLevels);
  _tmpEvent.riskScore = riskScore;

  if (certifierType.equalsIgnoreCase('entitlementOwner')) {
    var eventDataWithNoCertifier = [];
    _.forEach(_tmpEvent.eventData.managedObject, function(item) {
      var valuesWithNoCertifier = _.filter(item.values, function(ent) { return ent.certifierId === null; });
      eventDataWithNoCertifier = eventDataWithNoCertifier.concat(valuesWithNoCertifier);
    });
    
    if (eventDataWithNoCertifier.length > 0) {
      certifierFound = false;
    }
    
  }

  if(!certifierFound){
    // if default certifier found, assign to event and add comment
    // Assigned default certifier
    if(_defaultCertifierIsSet) {
     
      var defaultCertifierId = (certRootObj.defaultCertifierType === 'user') ? 
        utils.getUserId(certRootObj.defaultCertifierName) : 
        certRootObj.defaultCertifierName;

      if (certifierType.equalsIgnoreCase('entitlementOwner')) {
        if (certRootObj.defaultCertifierType === 'user') {
          defaultCertifierId = utils.ensureUserIdLong(defaultCertifierId)
        }
        _tmpEvent.openCertifierIds = _tmpEvent.openCertifierIds === '' ?
          defaultCertifierId :
          _tmpEvent.openCertifierIds + ',' + defaultCertifierId
        _.forEach(eventDataWithNoCertifier, function(evtData) {
          evtData.certifierId = defaultCertifierId;
        });
      } else {
        _tmpEvent.certifierType = certRootObj.defaultCertifierType;
        _tmpEvent.certifierName = certRootObj.defaultCertifierName;
        _tmpEvent.certifierId = defaultCertifierId;
      }

      _tmpEvent.comments.push({
        action: 'no-certifier',
        timeStamp: moment().format(),
        username: 'SYSTEM',
        userId: 'SYSTEM',
        comment: 'Assigned default certifier to some or all entitlements'
      });
      
      _tmpEvent.usingDefaultCertifier = true;
      
    } else {
      // NOTE(dani): if certifier not found and no default certifier set
      // special status and return.
      _tmpEvent.status = 'no-certifier';
      _tmpEvent.comments.push({
        action: 'no-certifier',
        timeStamp: moment().format(),
        username: 'SYSTEM',
        userId: 'SYSTEM',
        comment: 'No certifier found'
      });
    }
  }

  // AS: if event is empty, set special status and return.
  if (_isEmptyEvent(_tmpEvent)) {
    _tmpEvent.status = CONSTANT.STATUS.EMPTY;
    _tmpEvent.comments.push({
      action: 'event-empty',
      timeStamp: moment().format(),
      username: 'SYSTEM',
      userId: 'SYSTEM',
      comment: 'No data found for event'
    });
    certRootObj.totalEventCount--;
  }

  // Add event to stage
  // certStage.events.push(_tmpEvent);
  var newEvent = openidm.create(EVENT_REPO_PATH, null, _tmpEvent);

  /*
    * CREATE AUDIT ENTRY
    */
   
  var objectId = EVENT_REPO_PATH + newEvent._id;
  var auditMsg = 'Certification event has been created.';
  var auditEntry = buildAuditEntry('certification-event-audit', USERNAME, objectId, 'CREATE', null, newEvent, 0, auditMsg, 'SUCCESS');

  // NOTE: create audit
  utils.createNewAuditEvent(openidm, context, auditEntry);

}//end:insertUserCertEvents

/*
 * Function getStageEntitlements
 */
function getStageEntitlements(_tmpEvent, targetInfo, govProps, certifiableList, riskLevel, displayNameResource, targetName, delegateMap, addMetadata) {
  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    * Creates data fields for Managed Objects
    * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
    // For each element in certifiableList ie [roles, authzRoles, userName]
  var numGenerics = 0;
  var certifierIds = [];
  var certifierType = _tmpEvent.certifierType;
  
  if (certifiableList.identity) {
    _.forOwn(certifiableList.identity, function(val, resourceName) {
      // See if targetInfo has that field
      if (targetInfo[resourceName]) {
        
        var certifiable = 1;
        var firstPass = true;
        var _targetInfoResourceName = targetInfo[resourceName];
        if (typeof val === 'object') {
          _targetInfoResourceName = _.filter(_targetInfoResourceName, function(resource) {
            return val.indexOf(resource._ref) > -1;
          });
        }
        var __managedObjAttr = null;

        if (_targetInfoResourceName && 
            _targetInfoResourceName.length && 
            typeof _targetInfoResourceName === 'object' && 
            _targetInfoResourceName[0]._ref) {
          // It is a list like roles, authzRoles, reports
    
          _targetInfoResourceName.forEach(function(it) {  
            var roleName = it._ref;
            var objectId = roleName.substring(roleName.lastIndexOf('/') + 1);
            var isObjectUser = it._refResourceCollection === 'managed/user';
            var isObjectAssignment = it._refResourceCollection === 'managed/assignment';
            if (!govProps[roleName]) {
              // certifiableList
              var tmpGlossaryObj = glossaryCRUD.queryObjs({ 
                _queryFilter: 'class eq "object" and objectId eq "' + roleName + '"'
              }).result[0];
              govProps[roleName] = tmpGlossaryObj || null;
            }
            if (!isEntitlementValidForRiskLevel(riskLevel, govProps[roleName])) {
              return;
            }
            if (roleName !== idmUtils.ensureInternalRoleIdLong('openidm-authorized')) {
              if (firstPass) {
                var resourceDisplayName = getAttributeDisplayName(resourceName, displayNameResource);

                __managedObjAttr = {
                  objectType: resourceName,
                  displayName: resourceDisplayName,
                  certifiable: 0,
                  outcome: null,
                  riskLevel: 0,
                  comments: null,
                  values: []
                };

                _tmpEvent.eventData.managedObject.push(__managedObjAttr);
                firstPass = false;
              }
              var displayName = displayUtils.getDisplayObject(roleName, isObjectUser, DISPLAY_NAME_MAP).displayName;

              var currRiskLevel = null;
              if (govProps[roleName] != null && govProps[roleName].riskLevel) {
                currRiskLevel = govProps[roleName].riskLevel
              }

              var __tmpObjValue = {
                entitlementIndex: __managedObjAttr.values.length,
                displayName: displayName,
                fieldValue: roleName,
                relationshipId: it._refProperties._id,
                certifiable: certifiable,
                outcome: null,
                riskLevel: processRiskLevel(currRiskLevel),
                comments: null
              };

              // If assignment, capture all of the assigned values from the assignment and add to entitlement
              if (isObjectAssignment) {
                __tmpObjValue.assignmentAttributes = [];
                var assignmentData = openidm.read(roleName, null, [ 'attributes' ]);
                var attributes = assignmentData.attributes;
                _.forEach(attributes, function(attribute) {
                  var values = __.__isArray(attribute.value) ? attribute.value : [ attribute.value ];
                  _.forEach(values, function(value) {
                    __tmpObjValue.assignmentAttributes.push(
                      {
                        name: attribute.name,
                        value: value,
                      }
                    );
                  })
                })
              }

              /*
              * AS: __tmpObjValue will be added to the values array in most cases.
              * However, if the certifierType is "entitlementOwner", __tmpObjValue should 
              * only be added if there is a certifier (the entitlement owner OR a default certifier)
              * who can take action on it.
              */ 
              var addAttributeToValuesArray = _defaultCertifierIsSet;
              if (certifierType && certifierType.equalsIgnoreCase('entitlementOwner')) {
  
                var roleEO = null;
                if (govProps[roleName] && govProps[roleName].entitlementOwner) {
                  roleEO = govProps[roleName].entitlementOwner;
                  // If entitlementOwner is a user and delegation is enabled
                  if (DELEGATION_ENABLED && roleEO.indexOf('managed/user') >= 0) {
                    var delegateUser = checkForDelegate(delegateMap, roleEO);
                    if (delegateUser) {
                      __tmpObjValue.isDelegated = true;
                      __tmpObjValue.delegatedBy = roleEO;
                      _tmpEvent.isDelegated = true; // set delegated at item and event level if anything is delegated
                      delegateMap[roleEO] = delegateUser;
                      roleEO = idmUtils.ensureUserIdLong(delegateUser._id);
                    }
                  }
                __tmpObjValue.certifierId = roleEO;
                }

                if (__tmpObjValue.certifierId) {
                  addAttributeToValuesArray = true;
                  certifierIds.push(__tmpObjValue.certifierId);
                }
              } else {
                addAttributeToValuesArray = true;
              }
              var managedObject = _.find(_tmpEvent.eventData.managedObject, function(mo) {
                return mo.objectType === resourceName;
              });

              if (addAttributeToValuesArray) {
                managedObject.values.push(__tmpObjValue);
              }
            }
          });
          var moIndex = _.findIndex(_tmpEvent.eventData.managedObject, function(mo) {
            return mo.objectType === resourceName;
          });
          if (moIndex > -1 && _tmpEvent.eventData.managedObject[moIndex].values.length === 0) {
            _tmpEvent.eventData.managedObject.splice(moIndex, 1);
          }
        } else if (_targetInfoResourceName && _targetInfoResourceName.length) {

          // Load in risk levels for identity values, if needed
          if (!govProps.identity) {
            govProps.identity = riskLevel.length > 0 ? getGlossaryIdentityValues() : {};
          }

          // It is non-relationship attribute, do not include in entitlement owner certs
          if (certifierType && !(certifierType.equalsIgnoreCase('entitlementOwner'))) {
            var resourceDisplayName = getAttributeDisplayName(resourceName, displayNameResource);
            
            var identityValueCategory = govProps.identity[resourceName] || {}
            if (!isEntitlementValidForRiskLevel(riskLevel, identityValueCategory[_targetInfoResourceName])) {
              return;
            }

            if (__.__isArray(_targetInfoResourceName)) {
              if (firstPass) {
                __managedObjAttr = {
                  objectType: resourceName,
                  displayName: resourceDisplayName,
                  certifiable: 0,
                  outcome: null,
                  riskLevel: 0,
                  comments: null,
                  values: []
                };

                _tmpEvent.eventData.managedObject.push(__managedObjAttr);
                firstPass = false;
              }

              var isArrayOfObjects = _targetInfoResourceName[0] && (typeof _targetInfoResourceName[0] === 'object');
              _.forEach(_targetInfoResourceName, function(item) {
                var displayName = item;
                // Special case for assignment objects attributes as they are an OOTB defined object
                if (CERT_OBJECT_TYPE === 'assignment' && resourceName === 'attributes') {
                  displayName = item.name + ': ' + item.value.join(',');
                }
                else if (isArrayOfObjects) {
                  displayName = item.name;
                }
                var __tmpObjValue = {
                  entitlementIndex: __managedObjAttr.values.length,
                  objectType: resourceName,
                  attributeName: resourceDisplayName,
                  attributeValue: displayName,
                  displayName: displayName,
                  certifiable: 1,
                  outcome: null,
                  riskLevel: 0,
                  comments: null,
                  values: []
                };
                var managedObject = _.find(_tmpEvent.eventData.managedObject, function(mo) {
                  return mo.objectType === resourceName;
                });
                managedObject.values.push(__tmpObjValue);
              });
            }
            else {
              var __tmpObjValue = {
                objectType: resourceName,
                attributeName: resourceDisplayName,
                attributeValue: _targetInfoResourceName,
                displayName: resourceDisplayName + ": " + _targetInfoResourceName,
                certifiable: 1,
                outcome: null,
                riskLevel: 0,
                comments: null,
                values: []
              };
              _tmpEvent.eventData.managedObject.splice(numGenerics, 0, __tmpObjValue);
              numGenerics++;
            }
          }
        } else if (_targetInfoResourceName && typeof _targetInfoResourceName === 'object' && _targetInfoResourceName._ref) {
          it = _targetInfoResourceName;
          // It is many-to-one attribute
          var roleName = it._ref;
          var objectId = roleName.substring(roleName.lastIndexOf('/') + 1)
          var isObjectUser = it._refResourceCollection === 'managed/user';
          if (!govProps[roleName]) {
            // certifiableList
            var tmpGlossaryObj = glossaryCRUD.queryObjs({ 
              _queryFilter: 'class eq "object" and objectId eq "' + roleName + '"'
            }).result[0];
            govProps[roleName] = tmpGlossaryObj || null;
          }
          if (!isEntitlementValidForRiskLevel(riskLevel, govProps[roleName])) {
            return;
          }
          var resourceDisplayName = getAttributeDisplayName(resourceName, displayNameResource);
          var displayName = displayUtils.getDisplayObject(roleName, isObjectUser, DISPLAY_NAME_MAP).displayName;

          var currRiskLevel = null;
          if (govProps[roleName] != null && govProps[roleName].riskLevel) {
            currRiskLevel = govProps[roleName].riskLevel
          }

          var __tmpObjValue = {
            objectType: resourceName,
            attributeName: resourceDisplayName,
            attributeValue: displayName,
            displayName: resourceDisplayName + ": " + displayName,
            objectId: roleName,
            certifiable: 1,
            outcome: null,
            relationshipId: it._refProperties._id,
            riskLevel: processRiskLevel(currRiskLevel),
            comments: null,
            values: []
          };

          /*
          * AS: __tmpObjValue will be added to the values array in most cases.
          * However, if the certifierType is "entitlementOwner", __tmpObjValue should 
          * only be added if there is a certifier (the entitlement owner OR a default certifier)
          * who can take action on it.
          */ 
          var addAttributeToValuesArray = _defaultCertifierIsSet;
		      if (!govProps[roleName]) {
            // certifiableList
            var tmpGlossaryObj = glossaryCRUD.queryObjs({ 
              _queryFilter: 'class eq "object" and objectId eq "' + roleName + '"'
            }).result[0];
            govProps[roleName] = tmpGlossaryObj || null;
          }

          if (certifierType && certifierType.equalsIgnoreCase('entitlementOwner')) {
  
            var roleEO = null;
            if (govProps[roleName] && govProps[roleName].entitlementOwner) {
              roleEO = govProps[roleName].entitlementOwner;
              // If entitlementOwner is a user and delegation is enabled
              if (DELEGATION_ENABLED && roleEO.indexOf('managed/user') >= 0) {
                var delegateUser = checkForDelegate(delegateMap, roleEO);
                if (delegateUser) {
                  __tmpObjValue.isDelegated = true;
                  __tmpObjValue.delegatedBy = roleEO;
                  _tmpEvent.isDelegated = true; // set delegated at item and event level if anything is delegated
                  delegateMap[roleEO] = delegateUser;
                  roleEO = idmUtils.ensureUserIdLong(delegateUser._id);
                }
              }
            __tmpObjValue.certifierId = roleEO;
            }

            if (__tmpObjValue.certifierId) {
              addAttributeToValuesArray = true;
              certifierIds.push(__tmpObjValue.certifierId);
            }
          } else {
            addAttributeToValuesArray = true;
          }

          if (addAttributeToValuesArray) {
            _tmpEvent.eventData.managedObject.splice(numGenerics, 0, __tmpObjValue);
            numGenerics++;
          }
        }
      }//end:if
    })//end:each
  }

  if (isUserCert()) {
    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      * Create event data for Resources
      * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
    var resourceObjectPath = '';
    var resourceUser = '';
    var mappingName = '%';
    var syncConfig = openidm.read('config/sync');
    var linkQualifier = '';

    //If this is an identity cert, then we need to retrieve all accounts linked to the user, regardless of mappingName
    userLinks = utils.getUserLinks(_tmpEvent.targetId);
    for (idx in userLinks) {
      var userLink = userLinks[idx];
      resourceUser = utils.getUserResourceIdFromLink(userLink, targetInfo._id);
      // Process the resource object
      var resourceFullName = targetName;
      var resourceObjectType = '';
      linkQualifier = userLink.linkQualifier;

      for (var i in syncConfig.mappings) {
        var mapping = syncConfig.mappings[i];
        if (mapping.name.equalsIgnoreCase(userLink.linkType)) {
          resourceObjectPath = mapping.target !== 'managed/user' ? mapping.target : mapping.source;
          break;
        }
      }
    
      var resourcePathParts = resourceObjectPath.split('/');
      resourceFullName = resourcePathParts[1];
      resourceObjectType = resourcePathParts[2];

      var resourceSettings = certifiableList.system[resourceFullName];
      /* 
      * Skip processing this resource if it is not included in the list of certifiable attributes,
      * or if the resource risk level is not within the stage's riskLevelFilter
      */ 
      if (!resourceSettings || !isEntitlementValidForRiskLevel(riskLevel, resourceSettings)) {
        continue;
      }

      var resourceObject = openidm.read(resourceObjectPath + '/' + resourceUser);

      var intCertifiable = 0;
      var resourceRiskLevel = processRiskLevel(resourceSettings.riskLevel);
      
      if (resourceSettings && resourceSettings.hasOwnProperty('certifiable')) {
        intCertifiable = processCertifiable(resourceSettings.certifiable.toString());
      }

      // Insert a resource if it is certifiable
      if (intCertifiable == 1) {
        var firstResourceRun = true;
        // Insert the entitlements for that resource
        var __resourceObject = null;
        var isResourceDelegated = false;
        var resourceDelegatedBy = null;
        
        var certifierId = resourceSettings && resourceSettings.entitlementOwner ? resourceSettings.entitlementOwner : null;
        if (certifierType && certifierType.equalsIgnoreCase('entitlementOwner')) {
          if (!certifierId && !_defaultCertifierIsSet) {
            continue;
          }
          // If entitlementOwner is a user and delegation is enabled
          if (DELEGATION_ENABLED && certifierId && certifierId.indexOf('managed/user') >= 0) {
            var delegateUser = checkForDelegate(delegateMap, certifierId);
            if (delegateUser) {
              isResourceDelegated = true;
              resourceDelegatedBy = idmUtils.ensureUserIdShort(certifierId);
              _tmpEvent.isDelegated = true; // set delegated at event level if anything is delegated
              delegateMap[certifierId] = delegateUser;
              certifierId = 'managed/user/' + delegateUser._id;
            }
          }
        } 

        _.keys(resourceObject).forEach(function(_key) {

          if (firstResourceRun) {
            __resourceObject = {
              mapping: userLink.linkType,
              linkQualifier: linkQualifier,
              connector: resourceFullName,
              objectType: resourceObjectType,
              resourceId: resourceUser,
              displayName: resourceFullName,
              certifiable: intCertifiable,
              outcome: null,
              riskLevel: resourceRiskLevel,
              comments: null,
              attributes: []
            };
          if (certifierType && certifierType.equalsIgnoreCase('entitlementOwner')) {
            __resourceObject.certifierId = certifierId;
            if (isResourceDelegated) {
              __resourceObject.isDelegated = isResourceDelegated;
              __resourceObject.delegatedBy = resourceDelegatedBy;
            }
            if (certifierId) {
              certifierIds.push(certifierId);
            }
          }

            _tmpEvent.eventData.application.push(__resourceObject);
            firstResourceRun = false;
          }

          var key = _key;
          var value = resourceObject[_key];
          intCertifiable = 0;

          var certifiableListObject = _.find(resourceSettings._properties[resourceObjectType], function(resource) {
            return resource.attributeName === key;
          });

          if (_.isEmpty(value)) {
            // Do not process empty value
          } else if (checkAttributeInclusionInEvent(certifiableListObject)) {
            
            if ('_id' !== key && certifiableListObject) {
              // Set certifiable
              if (certifiableListObject.certifiable === true) {
                intCertifiable = 1;
              } else {
                intCertifiable = 0;
              }

              // map values
              var __resourceObjectValue = {
                entitlementIndex: __resourceObject.attributes.length,
                attributeName: key, 
                displayName: resourceFullName, 
                attributeValue: value, 
                certifiable: intCertifiable,
                outcome: null,
                riskLevel: resourceRiskLevel,
                comments: null
              }

              if (certifierType && certifierType.equalsIgnoreCase('entitlementOwner')) {
                __resourceObjectValue.certifierId = certifierId;
                if (isResourceDelegated) {
                  __resourceObject.isDelegated = isResourceDelegated;
                  __resourceObject.delegatedBy = resourceDelegatedBy;
                }
                if (certifierId) {
                  certifierIds.push(certifierId);
                }
              }

              if (value.length && typeof value === 'object') {
                //if this is a multi-valued attribute
                value.forEach(function(it) {
                  var arrayAttributeValue = __.cloneDeep(__resourceObjectValue);
                  arrayAttributeValue.attributeValue = it;
                  __resourceObject.attributes.push(arrayAttributeValue);
                  __resourceObjectValue.entitlementIndex += 1;
                });
              } else {
                __resourceObject.attributes.push(__resourceObjectValue);
              }
            }//end:if
          }//end:else if
        });//end:each
      }//end:if
    }//end:for-in
  }
  // Certify object metadata
  if (!govProps[_tmpEvent.longTargetId]) {
    govProps[_tmpEvent.longTargetId] = glossaryUtils.getGlossaryObjectForRole(_tmpEvent.longTargetId);
  }
  var targetMetadata = govProps[_tmpEvent.longTargetId];
  if (!isUserCert() && targetMetadata && addMetadata) {
    var exclusionList = [ '_id', 'objectId', '_rev', 'order', 'constraints', 'class']
    _.forOwn(targetMetadata, function(val, key) {
      if (_.includes(exclusionList, key)) {
        return;
      }

      var displayValue = val;
      // If approvers list, convert keys to long ids
      if (key === 'approvers') {
        var approverList = __.cloneDeep(val);
        for (var i = 0; i < approverList.length; i++) {
          var approverKey = approverList[i];
          if (targetMetadata[approverKey]) {
            approverList[i] = approverKey === 'manager' ? 'User Manager' : targetMetadata[approverKey];
          }
        }
        var approverListDisplayObjects = displayUtils.getDisplayObjectList(approverList, DISPLAY_NAME_MAP);
        displayValue = _.map(approverListDisplayObjects, 'displayName').join(', ');
      }
      
      if (targetMetadata.constraints && 
        targetMetadata.constraints[key] && 
        targetMetadata.constraints[key].type &&
        targetMetadata.constraints[key].type === 'managed object id') {
          var displayObj = displayUtils.getDisplayObject(val, !idmUtils.isLongRoleId(val), DISPLAY_NAME_MAP);
          displayValue = displayObj.displayName;
      }

      var __tmpObjValue = {
        objectType: key,
        attributeName: key,
        attributeValue: val,
        displayName: displayValue,
        certifiable: 1,
        outcome: null,
        riskLevel: 0,
        comments: null,
        values: []
      };

      _tmpEvent.eventData.metadata.push(__tmpObjValue);
    });
  }
  if (certifierIds.length > 0) {
    c.setOpenCertifierIds(_tmpEvent, certifierIds);
  }
}

/*
 * function checkAttributeInclusionInEvent
 */
function checkAttributeInclusionInEvent(certListObject) {
  var isIncluded = false;
  if (certListObject) {
    isIncluded = certListObject.certifiable === true || certListObject.displayInUserInfo === true;
  }
  return isIncluded;
}

/*
 * Function deleteCertEvents
 */
function deleteCertEvents(certId) {
  var queryFilter = qf.eq('campaignId', certId);
  var params = { _queryFilter: queryFilter, _fields: ['_id', '_rev']}
  var eventsToDelete = openidm.query(EVENT_REPO_PATH, params).result;
  eventsToDelete.forEach(function(event) {
    /*
    * CREATE AUDIT ENTRY
    */
    var objectId = EVENT_REPO_PATH + event._id;
    var auditEntry = buildAuditEntry('certification-event-audit', USERNAME, objectId, 'DELETE', event, null, null, null, null);

    var deletedEvent = openidm.delete(objectId, event._rev);
    if (deletedEvent) {
      auditEntry.revision = deletedEvent._rev;
      auditEntry.message = 'Certification event has been deleted.';
      auditEntry.after = deletedEvent;
      auditEntry.status = 'SUCCESS'
    } else {
      auditEntry.revision = event._rev;
      auditEntry.message = 'Certification event was not deleted.';
      auditEntry.after = event;
      auditEntry.status = 'FAILURE'
    }
    // NOTE: create audit
    utils.createNewAuditEvent(openidm, context, auditEntry);
  });
}

/*
 * Function getDisplayName
 */
function getDisplayName(openidmManagedObject, fieldName) {
  var result = 'tempName';
  for (var _key in openidmManagedObject) {
    // Get the object with the display names
    if (openidmManagedObject[_key].name.equalsIgnoreCase(CERT_OBJECT_TYPE)) {
      // See if the name of the resource is equal, for identity, its user
      var schema = openidmManagedObject[_key].schema;
      schema = schema.properties;
      schema = schema[fieldName];
      if (!schema) {
        return fieldName;
      }
      schema = schema.title;
      result = schema;
    }
  }
  return result;
}

/*
 * Function getDefaultRiskLevel
 * Description: Default risk level for any role or managed object without a risk level
 */
function getDefaultRiskLevel() {
  return 1;
}

/*
 * Function getAttributeDisplayName
 */
function getAttributeDisplayName(attribute, displayNameResource) {
  var displayName = attribute;

  var resource = _.find(displayNameResource, function(item) {
    return item.name === CERT_OBJECT_TYPE;
  })

  if (resource !== null
    && resource['schema'] !== null
    && resource['schema']['properties'] !== null
    && resource['schema']['properties'][attribute] !== null
    && resource['schema']['properties'][attribute].title !== null
  ) {
    displayName = resource['schema']['properties'][attribute].title;
  }

  return displayName;
}

/*
 * Function processRiskLevel
 */
function processRiskLevel(riskLevel) {
  var result = getDefaultRiskLevel();

  if (riskLevel >= 1 && riskLevel <= 10) {
    result = riskLevel;
  } else if (_.isNull(riskLevel) || riskLevel.equalsIgnoreCase('Low')) {
    result = getRiskLevelLowerValue();
  } else if (riskLevel.equalsIgnoreCase('Medium')) {
    result = getRiskLevelHigherValue();
  } else if (riskLevel.equalsIgnoreCase('High')) {
    result = 10;
  }

  return result;
}

/*
 * Function processCertifiable
 */
function processCertifiable(certifiable) {
  var result = 0;
  if (
    certifiable !== null ||
    certifiable !== undefined ||
    certifiable !== '' ||
    certifiable.equalsIgnoreCase('true')
  ) {
    result = 1;
  }
  return result;
}

/*
 * Function __getRiskLevelsFromEventData
 */
function __getRiskLevelsFromEventData(eventDataObj) {
  var tmp = [];

  eventDataObj.identity.forEach(function(obj) {
    tmp.push(obj.riskLevel);
  });
  eventDataObj.managedObject.forEach(function(obj) {
    obj.values.forEach(function(obj1) {
      tmp.push(obj1.riskLevel);
    });
  });

  eventDataObj.application.forEach(function(obj) {
    tmp.push(obj.riskLevel);
    obj.attributes.forEach(function(obj1) {
      tmp.push(obj1.riskLevel);
    });
  });

  return tmp;
}

/*
 * Function _getCertifierTypeAndCertifierIdFromOpenEvents
 */
function _getCertifierTypeAndCertifierIdFromOpenEvents(stageEvents) {
  var tmp = [];
  stageEvents.forEach(function(evt) {
    if (evt.status.equalsIgnoreCase(CONSTANT.STATUS.IN_PROGRESS)) {
      var evtData = {
        certifierType: evt.certifierType,
        usingDefaultCertifier: evt.usingDefaultCertifier
      };
      if (evt.certifierType.equalsIgnoreCase('entitlementOwner')) {
        evtData.openCertifierIds = evt.openCertifierIds;
      } else {
        evtData.certifierId = evt.certifierId;
      } 
      tmp.push(evtData);  
    }
  });
  return tmp;
}

/*
 * Function getAttributeInstanceDisplayName
 */
function getAttributeInstanceDisplayName(
  managedObject,
  managedObjectFull,
  displayNameResource,
  resourceLookingFor
) {
  if (_.includes(resourceLookingFor, 'admin')) {
    return resourceLookingFor;
  }

  var searchList = ['_id'];

  // Get all managedobjects
  var result = '';
  var toSearch = '';

  for (var index in displayNameResource) {
    var resource = displayNameResource[index];

    // Get the object name
    managedObjectName = resource.name;

    if (managedObjectName.equalsIgnoreCase(managedObject)) {
      var foundResult = false;

      resource.schema.order.forEach(function(it) {
        if (resource['schema']['properties'][it]['searchable'] && !foundResult) {
          searchList.push(it);
          toSearch = it;
          foundResult = true;
        }
      });
      break;
    }
  }//end:for

  var list = openidm.query(managedObjectFull, {
    _queryFilter: qf.isId(resourceLookingFor),
    _fields: searchList
  });

  list.result.forEach(function(it) {
    if (it[toSearch]) {
      result = it[toSearch];
    } else {
      result = it._id;
    }
  });

  return result;
}

/*
 * Function _removeUsersWithAccountStatus
 */
function _removeUsersWithAccountStatus(users, statusArray) {
  var i, status;

  return users.filter(function(targetInfo) {
    for (i in statusArray) {
      status = statusArray[i];

      if (targetInfo.accountStatus.equalsIgnoreCase(status)) {
        return false;
      }
    }
    return true;
  });
}


function processStageSpecificInput(payload) {
  var regx = /(^[1-9]\d* (days|weeks)$)/;
  payload.stages.forEach(function(stg, _idx) {
    stg.stageIndex = _idx;
    stg.expired = false;

    // Grab the first escalation information from schedule if it exists
    if (stg.escalationSchedule && stg.escalationSchedule.length > 0) {
      var nextEscalation = stg.escalationSchedule.shift();
      var nextIntervalType = nextEscalation.intervalType || 'days';
      stg.escalationDate = moment(stg.deadline).subtract(nextEscalation.interval, nextIntervalType).format();
      stg.escalationType = nextEscalation.escalationType;
      if (stg.escalationType === CONSTANT.ESCALATION_TYPE.MANAGER) {
        stg.escalationName = null;
      }
      else if (
        stg.escalationType === CONSTANT.ESCALATION_TYPE.AUTH_ROLE || 
        stg.escalationType === CONSTANT.ESCALATION_TYPE.GROUP
      ) {
        stg.escalationName = nextEscalation.escalationId;
        stg.escalationId = nextEscalation.escalationId;
      }
      else if (stg.escalationType === CONSTANT.ESCALATION_TYPE.USER) {
        stg.escalationName = idmUtils.getUserName(nextEscalation.escalationId);
      }
    }

    if (stg.certifierType.equalsIgnoreCase(CONSTANT.CERTIFIER_TYPE.USER)) {
      stg.certifierId = utils.getUserId(stg.certifierName);
    }
    else if (
      stg.certifierType.equalsIgnoreCase(CONSTANT.CERTIFIER_TYPE.AUTH_ROLE) || 
      stg.certifierType.equalsIgnoreCase(CONSTANT.CERTIFIER_TYPE.GROUP)
    ) {
      stg.certifierId = stg.certifierName;
    }

    if (CONSTANT.ESCALATION_TYPE.USER.equalsIgnoreCase(stg.escalationType)) {
      stg.escalationId = utils.getUserId(stg.escalationName);
    }
    else if (!CONSTANT.ESCALATION_TYPE.MANAGER.equalsIgnoreCase(stg.escalationType)) {
      stg.escalationId = stg.escalationName;
    }

    // NOTE: if definition is scheduled or triggered, convert deadline
    // and escalationDate to actual date
    if (regx.test(stg.deadline)) {
      stg.deadline = utils.getFormattedDate(stg.deadline);
      stg.deadline = moment(stg.deadline).format();
      if (stg.escalationDate) {
        if (stg.escalationDate === '') {
          stg.escalationDate = null;
        }
      }
    }

    // NOTE: set deadline for Campaign to be deadline of last stage
    if (!payload.deadline || (stg.deadline > payload.deadline)) {
      payload.deadline = stg.deadline;
    }
  });
}

// ==============================================
// EVENTS THREAD
// ==============================================

function th_CreateEvents(newCert) {
  var targetFilter = newCert.targetFilter
  __.log('========= EVENTS THREAD STARTED FOR CERT CREATION =========');
  
  var initialCert = __.cloneDeep(newCert);
  newCert.systemMessages = { errors: [], info: [] };

  try {
    var CAMPAIGN_ID = newCert._id;
    var targetList = null;
    var targetIds = openidm.action('governance/expressionParser/' + CERT_OBJECT_TYPE, 'parse', { expression: targetFilter });
    
    if (targetIds) {
      newCert.totalEventCount = targetIds.length * newCert.stages.length;
    }

    /*
     * CREATE AUDIT ENTRY
     */
    var objectId = CERT_REPO_PATH + newCert._id;
    var auditMsg = 'Certification has been updated with total events count.';
    var auditEntry = buildAuditEntry('certification-audit', 'idg-system', objectId, 'UPDATE', initialCert, newCert, ++initialCert._rev, auditMsg, 'SUCCESS');

    if (targetIds && targetIds.length > 0) {
      var certifiableAttrs = utils.getCertifiableAttrs(CERT_OBJECT_TYPE);
      targetList = _getTargetListFromIds(targetIds, certifiableAttrs);
      utils.createNewAuditEvent(openidm, context, auditEntry);
      openidm.update(CERT_REPO_PATH + CAMPAIGN_ID, null, newCert);
      newCert.stages[0].startDate = moment().format();
      newCert.stages.forEach(function(stg) {
        _addStageData(stg, newCert, targetList, certifiableAttrs);
      });
    }

    auditEntry.message = 'Certification has been updated after generating events.';
    /*
     * NOTE: Check if the certification has events otherwise cancel it.
     */
    if (newCert.totalEventCount === 0) {
      newCert.status = CONSTANT.STATUS.CANCELLED;
      newCert.completionDate = moment().format();
        
      newCert.systemMessages.info.push({
        message: 'no-events-generated.'
      });

      // NOTE: update repo object
      openidm.update(CERT_REPO_PATH + CAMPAIGN_ID, null, newCert);

      // NOTE: create audit
      utils.createNewAuditEvent(openidm, context, auditEntry);

      logger.debug('========= EVENTS THREAD FOR ' + CAMPAIGN_ID + ' RETURNED: NO EVENTS =========')
      return;
    }
    newCert.status = CONSTANT.STATUS.IN_PROGRESS;

    // This next section should iterate over each stage's events and activate the earliest event for each event index.
    var campaignHasActiveEvents = false;
    var activeEventIndices = [];
    newCert.stages.forEach(function(stage, j) {
      // Grab the events for the current stage and iterate over them to activate any future events
      var events = c.getEventsInStage(newCert._id, stage.stageIndex, CERT_OBJECT_TYPE, null, true);
      events.forEach(function(_event) {
        // If event is pending, set to in progress, event index to active, and campaign to active
        if (_event.status === CONSTANT.STATUS.PENDING && !activeEventIndices[_event.eventIndex]) {
          _event.status === CONSTANT.STATUS.IN_PROGRESS
          campaignHasActiveEvents = true;
          utils.updateEventRepo(EVENT_REPO_PATH, _event);
          activeEventIndices[_event.eventIndex] = true;
        }
        // If there event is in progress, set event index to active, and campaign to active
        else if (_event.status === CONSTANT.STATUS.IN_PROGRESS) {
          campaignHasActiveEvents = true;
          activeEventIndices[_event.eventIndex] = true; // mark this event index as active
        }
        // If event has no certifier, set its completion date and update repo
        else if (_event.status === CONSTANT.STATUS.NO_CERTIFIER || _event.status === CONSTANT.STATUS.EMPTY) {
          _event.completionDate = moment().format();
          _event.completedBy = null;
          utils.updateEventRepo(EVENT_REPO_PATH, _event);
          // completedEventIndices.push(_event.eventIndex);
        }
      });
    });

    newCert = c.updateCampaignInformation(newCert, CERT_OBJECT_TYPE);

    // If all events have status "no-certifier" do not send notifications.
    if (!campaignHasActiveEvents) {
      newCert.status = CONSTANT.STATUS.SIGNED_OFF;
      newCert.completionDate = moment().format();

      newCert.systemMessages.info.push({
        message: 'no-certifier-for-any-events'
      });

      newCert.openCertifierIds = '';
      newCert.closedCertifierIds = '';

      // NOTE: update repo object
      openidm.update(CERT_REPO_PATH + CAMPAIGN_ID, null, newCert);

      // NOTE: create audit
      utils.createNewAuditEvent(openidm, context, auditEntry);

      logger.debug('========= EVENTS THREAD FOR ' + CAMPAIGN_ID + ' RETURNED: NO-CERTIFIER =========')
      return;
    }

    /*
     * SEND NOTIFICATIONS (AD-HOC, SCHEDULED, or TRIGGERED)
     */
    var certificationName = newCert.name;
    var _freq = newCert.frequency;

    for (var _idx in newCert.stages) {
      var certStage = newCert.stages[_idx];
      var stageEvents = c.getEventsInStage(newCert._id, certStage.stageIndex, CERT_OBJECT_TYPE);
      var owners = [];
      // NOTE: if all events in stage have no certifier, continue to next stage
      if (c.isAllNoCertifier(stageEvents)) {
        continue;
      }

      var _eventsCertTypeAndCertId = [];
      _eventsCertTypeAndCertId = _getCertifierTypeAndCertifierIdFromOpenEvents(stageEvents);

      _eventsCertTypeAndCertId.forEach(function(_event) {
        if (_.isEmpty(_event.certifierType)) { // Event does not have certifier
          return;
        }
        if (_event.certifierType.equalsIgnoreCase('entitlementOwner')) {
          var openCertifiers = c.getOpenCertifierIds(_event);
          for (var idx in openCertifiers) {
            owners.push({
              notificationOwner: openCertifiers[idx],
              usingDefaultCertifier: _event.usingDefaultCertifier
            });
          }
        }
        else if (
          _event.certifierType.equalsIgnoreCase('authzRoles') || 
          _event.certifierType.equalsIgnoreCase('authzGroup')
        ) {
          owners.push({
            notificationOwner: _event.certifierId,
            usingDefaultCertifier: _event.usingDefaultCertifier
          });
        } else {
          owners.push({
            notificationOwner: 'managed/user/' + _event.certifierId,
            usingDefaultCertifier: _event.usingDefaultCertifier
          });
        }
      });//end:forEach

      _.uniqBy(owners, 'notificationOwner').forEach(function(ownerHash) {
        var _templatePath;
        var params = {
          id: newCert._id,
          toEmailAddress: ownerHash.notificationOwner,
          certificationName: certificationName
        };

        if (_freq.equalsIgnoreCase('Ad-hoc')) {
          _templatePath = ADHOC_TEMPLATE_PATH;
        }
        else if (_freq.equalsIgnoreCase('Event-based')) {
          _templatePath = TRIGGERED_TEMPLATE_PATH;
        }
        else if (_freq.equalsIgnoreCase('Scheduled')) {
          _templatePath = SCHEDULED_TEMPLATE_PATH;
        }

        if (ownerHash.usingDefaultCertifier) {
          _templatePath += '_DEFAULT_CERTIFIER';
        }

        utils.sendNotification(_templatePath, params)
      });

      // NOTE: once notifications are sent for stage we don't need to continue
      break;
    }//end:for-in

    /*
     * NOTE: create audit and update repo
     */
    openidm.update(CERT_REPO_PATH + CAMPAIGN_ID, null, newCert);
    utils.createNewAuditEvent(openidm, context, auditEntry);

    logger.debug('========= EVENTS THREAD FOR ' + CAMPAIGN_ID + ' ENDED: SUCCESS =========');

  } catch(e) {
    // For debugging. Do not remove
    logger.warn('Error while creating events.');
    logger.warn(e.message);
    if (e.stack) {
      logger.warn(e.stack);
    }

    var errorText = e.stack ? e.stack : e.message
    // NOTE: log error in campaign
    newCert.systemMessages.errors.push({
      message: 'script-error',
      error: 'Error: ' + errorText
    });

    // NOTE: set status, completionDate and completedBy
    newCert.status = CONSTANT.STATUS.CANCELLED;
    newCert.completionDate = moment().format();
    newCert.completedBy = 'idg-system';
    newCert.openCertifierIds = '';
    newCert.closedCertifierIds = '';

    // Cancel any events that have been created
    deleteCertEvents(CAMPAIGN_ID);

    openidm.update(CERT_REPO_PATH + CAMPAIGN_ID, null, newCert);

    var objectId = CERT_REPO_PATH + newCert._id;
    var auditMsg = 'Certification failed to create events.';
    var auditEntry = buildAuditEntry('certification-audit', 'idg-system', objectId, 'CANCEL', initialCert, newCert, ++initialCert._rev, auditMsg, 'FAILURE');

    utils.createNewAuditEvent(openidm, context, auditEntry);

    logger.debug('========= EVENTS THREAD FOR ' + CAMPAIGN_ID + ' ENDED: ERROR =========')
  }
}

function _getTargetListFromIds(targetIds, certifiable_attrs) {
  var targetList = [];

  var searchList = []
  if (isUserCert()) {
    searchList = _.concat(searchList, ['userName', '_id', 'sn', 'givenName', 'mail', 'manager/userName', 'manager/givenName', 'manager/sn', 'accountStatus']);
    searchList = _.concat(searchList, _.values(utils.getDictOfFieldsToDisplayInUserTable()));
  }
  else {
    searchList = ['name', 'description'];
  }
  if (certifiable_attrs.identity) {
    _.forOwn(certifiable_attrs.identity, function(value, key) {
      searchList.push(key);
    });
  }

  var _STATUSES_ = ['disabled'];
  var currentQueryCount = 0
  var totalCount = 0
  var queryFilter = ''
  targetIds.forEach(function(id) {
    if (queryFilter.equals('')) {
      queryFilter = '_id eq "' + id + '"';
    } else {
      queryFilter = queryFilter + ' or _id eq "' + id + '"';
    }
    currentQueryCount++;
    totalCount++;
    if (currentQueryCount >= 50 || totalCount == targetIds.length) {
      var targets = [];

      if (isUserCert()) {
        targets = idmUtils.queryManagedUsers(queryFilter, searchList, COMMONSCONSTANT.IDM_METHOD.QUERY);
      }
      else {
        var params = {
          _queryFilter: queryFilter,
          _fields: searchList,
        }
        targets = openidm.query('managed/' + CERT_OBJECT_TYPE, params).result;
      
      }
      targets.forEach(function(target) {
        targetList.push(target);
      })
      currentQueryCount = 0;
      queryFilter = ''
    }    
  });

  if (targetList && isUserCert()) {
    // NOTE: filter out disabled accounts
    targetList = _removeUsersWithAccountStatus(targetList, _STATUSES_);
  }
  
  return targetList;
}//end:_getTargetListFromIds

/*
 * Function _isEmptyEvent
 * @returns Boolean
 */
function _isEmptyEvent(evt) {
  var numApps = evt.eventData.application.length;
  var numObjs = evt.eventData.managedObject.length;
  var numMeta = evt.eventData.metadata.length;
  return (numApps + numObjs + numMeta) <= 0;
}


/**
 * Modify which attributes are included in certifiableAttrs based on a stage's entitlement filter
 * @param {Object} certifiable_attrs certifiable attributes
 * @param {Object} entitlementFilter entitlement filter for a given stage
 * @return {Object} modified object of certifiable attributes to include in this stage
 */

function processEntitlementFilter(certifiable_attrs, entitlementFilter) {
  // NOTE: grab all connector configurations
  if (entitlementFilter) {
    if (certifiable_attrs.identity) {
      _.forOwn(certifiable_attrs.identity, function(val, key) {
        if (entitlementFilter.attributes && entitlementFilter.attributes[key] && entitlementFilter.attributes[key].selected) {
          if (entitlementFilter.attributes[key].targetFilter) {
            var content = {
              query: []
            };
            for (var i in entitlementFilter.attributes[key].targetFilter) {
              content.query.push(entitlementFilter.attributes[key].targetFilter[i]);
            }
            var params = {
              'managedObject': CERT_OBJECT_TYPE,
              'attribute': key
            };
          
            var targets = openidm.create('governance/getRelationshipObjects', null, content, params).result;
            certifiable_attrs.identity[key] = _.map(targets, function(target) {
              return target._id;
            });
          }
        } else {
          delete certifiable_attrs.identity[key];
        }
      }); // _.forOwn: certifiable_attrs.identity
    }
    if (isUserCert() && certifiable_attrs.system && !_.isEmpty(certifiable_attrs.system)) {
      var _allConnectors = openidm.action('system', 'test', {});
      _.forOwn(certifiable_attrs.system, function(val, key) {
        var appEntitlementFilter = entitlementFilter.applications ? entitlementFilter.applications[key] : false;
        if (appEntitlementFilter) {
          _allConnectors.forEach(function(ctor) {
            if (ctor.name === key && (!ctor.ok || !ctor.enabled)) {
              __.requestError('Connector not ready: ' + ctor.name, 500);
            }
          });
          _.forOwn(appEntitlementFilter, function(v, k) {
            if (k !== 'selected' && certifiable_attrs.system[key][k]) {
              certifiable_attrs.system[key][k].certifiable = _.filter(certifiable_attrs.system[key][k].certifiable, function(a){
                return v[a] && v[a].selected;
              });
            }
          });
        } else {
          delete certifiable_attrs.system[key];
        }
      });
    }
  } // if: entitlementFilter
  return certifiable_attrs;
}

function isEntitlementValidForRiskLevel(riskLevel, entitlementProps) {
  var isValid = false;
  if (riskLevel.length === 0) {
    isValid = true
  } else if (
    entitlementProps && 
    entitlementProps.riskLevel && 
    riskLevel.indexOf(entitlementProps.riskLevel) > -1
  ) {
    isValid = true;
  }

  return isValid;
}

function updateScheduledCertificationNextRunDate(scheduledCertId) {
  var scheduledCert = openidm.read(SCHEDULED_PATH + scheduledCertId);
  var schedulerId = scheduledCert.schedulerId;
  var schedulerObj = openidm.read('scheduler/job/' + schedulerId);
  var nextRunDate = moment(schedulerObj.nextRunDate).format();
  scheduledCert.nextRunDate = nextRunDate;
  var result = openidm.update(SCHEDULED_PATH + scheduledCertId, scheduledCert._rev, scheduledCert);

  return {
    result: { _id: result._id }
  };
}

function createEventInformationData(targetInfo, openidmManagedObject) {
  var field_to_repo_key = {}
  if (isUserCert()) {
    field_to_repo_key = utils.getDictOfFieldsToDisplayInUserTable();
  }
  else {
    field_to_repo_key = {
      'name': 'name',
      'description': 'description',
    }
  }
  var fields = _.keys(field_to_repo_key);
  // create identity objects
  var event_information = _.map(fields, function(field) {
    var repo_key = field_to_repo_key[field];
    var fieldValue = targetInfo[repo_key]
    if (field === 'manager' && targetInfo.manager && targetInfo.manager.givenName && targetInfo.manager.sn) {
      fieldValue = targetInfo.manager.givenName + ' ' + targetInfo.manager.sn
    }
    return {
      field: field,
      displayName: getDisplayName(openidmManagedObject, repo_key),
      fieldValue: fieldValue,
      riskLevel: 0,
    }
  });
  return event_information;
}

function buildAuditEntry(eventName, username, objectId, operation, before, after, revision, message, status) {
  var timeStamp = moment().format();
  var auditEntry = {
      timestamp: timeStamp,
      eventName: eventName,
      userId: username,
      runAs: username,
      objectId: objectId,
      operation: operation,
      before: before,
      after: after,
      changedFields: [],
      revision: revision,
      passwordChanged: false,
      message: message,
      status: status,
    };
  return auditEntry;
}

function setRequestInformation() {
  try {
    if (input) {
      // If input exists it means this script was invoked from an event
      INVOKED_FROM_SCHEDULER = true;
      action = 'create';
      USERNAME = 'SCHEDULER';
      context = null;
    }
  }
  catch(ex) {
    // "request" object exists which means this is a REST call
    USERNAME = utils.getUserNameFromCookie(context);
    queryParams = request.additionalParameters;
    try {
      // Try to get action from REST call
      action = context.parent.parent.parameters._action[0];
    } catch(e) {
      // Rest call coming from script not from UI
      // default to 'create'
      action = 'create';
      INVOKED_FROM_EVENT = true;
    }
  }
}

function checkForDelegate(delegateMap, certifierId) {
  if (!_.hasIn(delegateMap, certifierId)) {
    return utils.getUserDelegate(certifierId, DELEGATE_PROPERTIES);
  }
  else {
    return delegateMap[certifierId];
  }
}

function getGlossaryIdentityValues() {
  var identityValues = glossaryCRUD.queryObjs({ _queryFilter: 'class eq "identity-value"'}).result;
  var identity = {}
  _.forEach(identityValues, function(entry) {
    if (entry.riskLevel) {
      identity[entry.attributeName] = identity[entry.attributeName] || {};
      identity[entry.attributeName][entry.attributeValue] = { riskLevel: entry.riskLevel }
    }
  });
  return identity;
}

function setCertificationPaths(certObjectType) {
  CERT_OBJECT_TYPE = certObjectType ? certObjectType : 'user';
  if (isUserCert()) {
    CERT_REPO_PATH = CONSTANT.REPO_PATH.USER_CERT;
    EVENT_REPO_PATH = CONSTANT.REPO_PATH.USER_EVENT;
    SCHEDULED_PATH = CONSTANT.REPO_PATH.SCHEDULED_USER_CERT;
    ADHOC_TEMPLATE_PATH = 'governance/sendNotification/CERTIFICATION_CREATED_ADHOC';
    SCHEDULED_TEMPLATE_PATH = 'governance/sendNotification/CERTIFICATION_CREATED_SCHEDULED';
    TRIGGERED_TEMPLATE_PATH = 'governance/sendNotification/CERTIFICATION_CREATED_TRIGGERED';
  }
  else {
    CERT_REPO_PATH = CONSTANT.REPO_PATH.OBJECT_CERT;
    EVENT_REPO_PATH = CONSTANT.REPO_PATH.OBJECT_EVENT;
    SCHEDULED_PATH = CONSTANT.REPO_PATH.SCHEDULED_OBJECT_CERT;
    ADHOC_TEMPLATE_PATH = 'governance/sendNotification/OBJECT_CERTIFICATION_CREATED_ADHOC'
    SCHEDULED_TEMPLATE_PATH = 'governance/sendNotification/OBJECT_CERTIFICATION_CREATED_SCHEDULED';
    TRIGGERED_TEMPLATE_PATH = 'governance/sendNotification/OBJECT_CERTIFICATION_CREATED_TRIGGERED';
  }
}

function startCertificationCreationThread(newCert) {
  // NOTE: run thread for creating events
  var _buildRunnable = function(newCert) {
    return function() { th_CreateEvents(newCert); }
  }
  var runnable = _buildRunnable(newCert);
  var th_events = java.lang.Thread(runnable);
  th_events.start();
}

function isUserCert() {
  return CERT_OBJECT_TYPE === 'user'
}