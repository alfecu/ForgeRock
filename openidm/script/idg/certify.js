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
var CCONSTANT = require('commons/utils/globalConstants.js');
var moment = require('commons/lib/moment.js');
var CONSTANT = require('idg/utils/globalConstants.js');
var utils = require('idg/utils/generalUtilities.js');
var displayUtils = require('idg/utils/displayUtils.js');
var qf = require('idg/utils/queryFilter.js');
var c = require('idg/utils/campaign.js');
var validate = require('idg/utils/validations.js');

var queryParams = null;

var LOGGED_IN_USER_ID = null;
var USER_ROLES = null;

var SYSTEM = 'system';
var REVIEWED = 'reviewed';
var CERTIFICATION_TYPE = 'user'; // default to user
var CERT_REPO_PATH = null;
var EVENT_REPO_PATH = null;
var NOTIFICATION_CREATED_TEMPLATE = null;
var NOTIFICATION_COMPLETED_TEMPLATE = null;


run();
function run() {
  queryParams = request.additionalParameters;
  LOGGED_IN_USER_ID = idmUtils.getUserIdFromCookie(context);
  LOGGED_IN_USERNAME = utils.getUserNameFromCookie(context);

  USER_ROLES = idmUtils.getUserRoles(LOGGED_IN_USER_ID);

  if (
    utils.methodIs('CREATE') &&
    queryParams.hasOwnProperty('action') &&
    !queryParams.hasOwnProperty('dataGroup') &&
    utils.urlParamsCount(request.resourcePath, 3)
  ) {
    /*
     * ~~~~~~~~~ TASK ACTIONS ~~~~~~~~
     * method: POST
     * URL: certify/<type>/<campaign id>/<stage idx>/
     * params: action=[see below]
     * Certify-Remaining, Sign-Off, Reset
     */

    var url = request.resourcePath;
    var urlSegments = url.split('/');
    var reqBody = request.content;

    CERTIFICATION_TYPE = urlSegments[0];
    setCertificationPaths(CERTIFICATION_TYPE)
    var CAMPAIGN_ID = urlSegments[1];
    var STAGE_INDEX = Number(urlSegments[2]);
    var _ACTION = queryParams.action;
    var ACTING_ID = queryParams.actingId;
    var query_filter = queryParams.queryFilter || CCONSTANT.QUERY_FILTER.TRUE;

    // validations
    validate.actingId(ACTING_ID, LOGGED_IN_USER_ID);
    // NOTE: get repo object with certId provided
    var campaignObject = openidm.read(CERT_REPO_PATH + CAMPAIGN_ID);
    // NOTE: check if stage index exists in campaignObject
    if (!__.indexExists(campaignObject.stages, STAGE_INDEX)) {
      __.requestError('Stage index does not exist in campaign.', 400);
    }


    // NOTE: handle actions
    var STAGE = campaignObject.stages[STAGE_INDEX];
    /*
     * NOTE: process action
     */
    processActionOnStage(campaignObject, STAGE, CAMPAIGN_ID, STAGE_INDEX, _ACTION, ACTING_ID, query_filter, reqBody);

    // Update repo object
    campaignObject.stages[STAGE_INDEX] = STAGE;
    if (_ACTION === CONSTANT.STAGE_ACTION.SIGN_OFF || _ACTION === CONSTANT.STAGE_ACTION.REASSIGN) {
      campaignObject = c.updateCampaignInformation(campaignObject, CERTIFICATION_TYPE);
    }
    __updateRepoObject(campaignObject, CAMPAIGN_ID);

    return {
      result: 'Task action was successful.'
    };
  }
  else if (
    utils.methodIs('CREATE') &&
    queryParams.hasOwnProperty('action') &&
    !queryParams.hasOwnProperty('dataGroup') &&
    utils.urlParamsCount(request.resourcePath, 4)
  ) {
    /*
     * ~~~~~~~~~ EVENT ACTIONS ~~~~~~~~
     * method: POST
     * URL: certify/<type>/<campaign id>/<stage idx>/<event idx>
     * params: action=[see below]
     * (certified, revoked, abstained or reset)
     */

    // NOTE: get campaign id, stage index, and event index from request
    var url = request.resourcePath;
    var urlSegments = url.split('/');
    var reqBody = request.content;

    CERTIFICATION_TYPE = urlSegments[0];
    setCertificationPaths(CERTIFICATION_TYPE)
    var CAMPAIGN_ID = urlSegments[1];
    var STAGE_INDEX = Number(urlSegments[2]);
    var EVENT_INDEX = Number(urlSegments[3]);
    var _ACTION = queryParams.action;
    var comment = reqBody.comment;
    var ACTING_ID = queryParams.actingId;
    validate.actingId(ACTING_ID, LOGGED_IN_USER_ID);

    // NOTE: get repo object with certId provided
    var campaignObject = openidm.read(CERT_REPO_PATH + CAMPAIGN_ID);
    /*
     * NOTE: validate:
     * - stage index is valid
     * - event index is valid
     * - logged in user is certifier of target event
     */
    var EVENT = __validateRequest(
      campaignObject,
      STAGE_INDEX,
      EVENT_INDEX,
      _ACTION,
      comment
    );

    /*
     * NOTE: process action
     */

    var is_event_comment_added = processActionOnEvent(campaignObject, EVENT, _ACTION, ACTING_ID, reqBody);
    // NOTE: if a comment was added to the event.
    // Set flag on same event for other stages.
    if (is_event_comment_added) {
      campaignObject.stages.forEach(function(stg) {
        if (STAGE_INDEX === stg.stageIndex) {
          return;
        }
        var _event = c.getEvent(campaignObject._id, stg.stageIndex, EVENT_INDEX, CERTIFICATION_TYPE);
        _event.attentionRequired = true;
        utils.updateEventRepo(EVENT_REPO_PATH, _event);
      });
    }
    
    // If certifiers changed, update campaign
    if (_ACTION === CONSTANT.STAGE_ACTION.REASSIGN) {
      campaignObject = c.updateCampaignInformation(campaignObject, CERTIFICATION_TYPE);
    }

    // Update repo object
    __updateRepoObject(campaignObject, CAMPAIGN_ID);
    utils.updateEventRepo(EVENT_REPO_PATH, EVENT);

    return { result: 'success' };
  }
  else if (
    utils.methodIs('CREATE') &&
    utils.urlParamsCount(request.resourcePath, 4) &&
    (
      utils.queryParamsAre(['action', 'dataGroup', 'dataIndex']) ||
      utils.queryParamsAre(['action', 'dataGroup', 'dataIndex', 'attrIndex'])
    )
  ) {
    /*
     * ~~~~~~~~~ EVENT DETAILS ACTIONS ~~~~~~~~
     * method: POST
     * URL: certify/<type>/<campaign id>/<stage idx>/<event idx>
     * params: action, dataGroup, dataIndex, attrIndex
     */
    var EVENT_DETAIL_COMMENT_ADDED = false;

    var url = request.resourcePath;
    var urlSegments = url.split('/');
    var reqBody = request.content;

    CERTIFICATION_TYPE = urlSegments[0];
    setCertificationPaths(CERTIFICATION_TYPE); 
    var CAMPAIGN_ID = urlSegments[1];
    var STAGE_INDEX = Number(urlSegments[2]);
    var EVENT_INDEX = Number(urlSegments[3]);

    var comment = reqBody.comment;

    var _ACTION = queryParams.action;
    var dataGroup = queryParams.dataGroup;
    var dataIndex = Number(queryParams.dataIndex);
    var attrIndex = Number(queryParams.attrIndex);

    // NOTE: get repo object with certId provided
    var campaignObject = openidm.read(CERT_REPO_PATH + CAMPAIGN_ID);

    /*
     * NOTE: validate:
     * - stage index is valid
     * - event index is valid
     * - logged in user is certifier of target event
     */
    var EVENT = __validateRequest(
      campaignObject,
      STAGE_INDEX,
      EVENT_INDEX,
      _ACTION,
      comment
    );

    /*
     * NOTE: validate query params
     */
    _validateParamsForEvent(EVENT, dataGroup, dataIndex, isAttrLevel, attrIndex);

    /*
     * NOTE: set variables from event data
     */
    var dataCollectionKey = dataGroup === 'managedObject' || dataGroup === 'metadata' ? 'values' : 'attributes';
    var detailGroup = EVENT.eventData[dataGroup][dataIndex];

    // Initialize array of comments if null
    if (_.isEmpty(detailGroup.comments)) {
      detailGroup.comments = [];
    }
    var detailAttribute = null;

    // validate attr index and see if we are using it
    if (_.isNaN(attrIndex)) {
      // don't do the attribute-level things in the script
      var isAttrLevel = false;
    }
    else if (!_.isNumber(attrIndex) || attrIndex < 0 || attrIndex >= detailGroup[dataCollectionKey].length) {
      __.requestError('attrIndex url argument must be a Number between 0 and ' + detailGroup[dataCollectionKey].length, 400);
    }
    else {
      var isAttrLevel = true;
    }

    if (isAttrLevel) {
      detailAttribute = detailGroup[dataCollectionKey][attrIndex];
      // Initialize array of comments if null
      if (_.isEmpty(detailAttribute.comments)) {
        detailAttribute.comments = [];
      }
    }

    // NOTE: verify that event detail and detail attribute are certifable
    // before processing. Throw error if they're not.
    if (isAttrLevel) {
      if (detailAttribute && !Number(detailAttribute.certifiable)) {
        __.requestError('certify.js:: event detail attribute is not certifiable', 400);
      }
    }
    else {
      if (detailGroup && !Number(detailGroup.certifiable)) {
        __.requestError('certify.js:: event detail is not certifiable', 400);
      }
    }

    /*
     * NOTE: process action
     */
    switch (_ACTION) {
      case CONSTANT.EVENT_ACTION.CERTIFY:
        if (isAttrLevel) {
          _certifyEventDetailAttribute(detailAttribute);
        } else {
          _certifyDetailGroup(detailGroup);
          pushDetailGroupOutcomeToChildren(detailGroup, dataCollectionKey);
        }
        break;
      case CONSTANT.EVENT_ACTION.REVOKE:
        if (isAttrLevel) {
          _revokeEventDetailAttribute(detailAttribute, comment);
        } else {
          _revokeEventDetail(detailGroup, comment);
          pushDetailGroupOutcomeToChildren(detailGroup, dataCollectionKey);
        }
        EVENT_DETAIL_COMMENT_ADDED = true;
        break;
      case CONSTANT.EVENT_ACTION.RESET:
        if (isAttrLevel) {
          _resetEventDetailAttribute(detailAttribute);
        } else {
          _resetEventDetail(detailGroup, dataCollectionKey);
        }
        break;
      case CONSTANT.EVENT_ACTION.COMMENT:
        if (isAttrLevel) {
          _commentEventDetailAttribute(detailAttribute, comment);
        } else {
          _commentEventDetail(detailGroup, comment);
        }
        EVENT_DETAIL_COMMENT_ADDED = true;
        break;
      case CONSTANT.EVENT_ACTION.ABSTAIN:
        if (isAttrLevel) {
          _abstainEventDetailAttribute(detailAttribute, comment);
        } else {
          _abstainEventDetail(detailGroup, comment);
          pushDetailGroupOutcomeToChildren(detailGroup, dataCollectionKey);
        }
        EVENT_DETAIL_COMMENT_ADDED = true;
        break;
      default:
        __.requestError('Action "' + _ACTION +'" not supported.', 400);
    }
    // NOTE: update event completionDate, completedBy, status,
    // and/or outcome based on changes after "action" was processed.
    if (c.isHasNoOutcome(EVENT)) {
      EVENT['outcome'] = c.getInheritedOutcomeOfEvent(EVENT);
    }
    _updateEventStatus(EVENT, _ACTION);

    // Get attribute identifiers to search for in other stages
    var detailGroupName = isAttrLevel ? detailGroup.displayName : detailGroup.attributeName;
    var attributeName = isAttrLevel ? detailGroup[dataCollectionKey][attrIndex].displayName : null;

    // NOTE: if a comment was added to the event.
    // Set flag on same event for other stages.
    if (EVENT_DETAIL_COMMENT_ADDED) {
      campaignObject.stages.forEach(function(stg) {
        if (STAGE_INDEX === stg.stageIndex) {
          return;
        }

        var _event = c.getEvent(CAMPAIGN_ID, stg.stageIndex, EVENT_INDEX, CERTIFICATION_TYPE);

        _event.attentionRequired = true;

        var stageAttr = getAttrFromEventData(_event.eventData, dataGroup, detailGroupName, dataCollectionKey, attributeName);
        if (stageAttr !== null) {
          stageAttr.attentionRequired = true;
        }

        utils.updateEventRepo(EVENT_REPO_PATH, _event);
      });
    }

    // Update repo object
    __updateRepoObject(campaignObject, CAMPAIGN_ID);
    utils.updateEventRepo(EVENT_REPO_PATH, EVENT);

    return {
      result: 'Action "' + _ACTION  + '" performed successfully.'
    };
  } else if (
    utils.methodIs('CREATE') &&
    utils.urlParamsCount(request.resourcePath, 2)
  ) {
    /*
     * ~~~~~~~~~ BULK REASSIGN ~~~~~~~~
     * method: POST
     * URL: certify/<type>/reassign
     * body: oldCertifierId, newCertifierId, eventIds (optional)
     */
    var url = request.resourcePath;
    var urlSegments = url.split('/');
    var reqBody = request.content;

    CERTIFICATION_TYPE = urlSegments[0];
    setCertificationPaths(CERTIFICATION_TYPE)

    if (urlSegments[1] !== 'reassign') {
      __.requestError('Request not supported.', 400);
    }

    if (!reqBody.oldCertifierId || !reqBody.newCertifierId) {
      __.requestError('Reassign must include both oldCertifierId and newCertifierId in body');
    }

    if (!idmUtils.isLongOwnerId(reqBody.oldCertifierId) || !idmUtils.isLongOwnerId(reqBody.newCertifierId)) {
      __.requestError('IDs must be in the long format (e.g. managed/user/id or internal/role/id)', 400);
    }

    var eventIds = []
    if (reqBody.campaignIds) {
      eventIds = getEventIdsFromCampaignIds(reqBody.campaignIds, reqBody.oldCertifierId);
    }
    if (reqBody.eventIds) {
      eventIds.concat(reqBody.eventIds);
    }
    
    if (eventIds.length > 0) {
      reassignSelectedEventsForCertifierId(eventIds, reqBody.oldCertifierId, reqBody.newCertifierId);
    }
    else {
      reassignAllEventsForCertifierId(reqBody.oldCertifierId, reqBody.newCertifierId);
    }

    return {
      result: 'Reassign action performed successfully.'
    };
  }

  /*
   * Request not supported. Respond with bad request
   */
  __.requestError('Request not supported.', 400);

}//end:run


/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * HELPER FUNCTIONS
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

/*
 * Function __validateRequest
 */
function __validateRequest(
  campaignObject,
  STAGE_INDEX,
  EVENT_INDEX,
  _ACTION,
  comment
) {
  // NOTE: check if stage index exists in campaignObject
  if (!__.indexExists(campaignObject.stages, STAGE_INDEX)) {
    __.requestError('Stage index does not exist in campaign.', 400);
  }


  var EVENT = c.getEvent(campaignObject._id, STAGE_INDEX, EVENT_INDEX, CERTIFICATION_TYPE);
  /*
   * NOTE: check event status.
   * if status is Cancelled or Signed-Off, return error
   */
  if (c.isFinal(EVENT)) {
    __.requestError('This event has a final status. Status: ' + EVENT.status, 403);
  }

  /*
   * NOTE: validate _ACTION
   */
  validate.eventAction(_ACTION);
  /* NOTE: check event certifierType, if it's role check if current user has
   * the role. If user doesn't; throw error.
   * if it's 'user' or 'manager' check if certifierId matches current user Id
   * if user doesn't throw error.
   */
  if (_ACTION !== CONSTANT.EVENT_ACTION.COMMENT && _ACTION !== CONSTANT.EVENT_ACTION.REASSIGN) {
    var _res = _isUserTheCertifier(EVENT, _ACTION);
    if (typeof _res === 'string') {
      __.requestError(_res, 400);
    }
  }

  /*
   * Validate _ACTION and Comment
   */
  if (
    _.includes([CONSTANT.EVENT_ACTION.REVOKE, CONSTANT.EVENT_ACTION.ABSTAIN, CONSTANT.EVENT_ACTION.COMMENT], _ACTION)
    &&
    _.isEmpty(comment)
  ) {
    __.requestError('A comment is required.', 400);
  }

  return EVENT;
}//end:__validateRequest



/*
 * Function _commentEvent
 */
function _commentEvent(EVENT, comment, action) {
  EVENT.comments.push(_buildCommentObject(comment, action));
}

/*
 * Function _buildCommentObject
 */
function _buildCommentObject(comment, action) {
  var userId =
    action === SYSTEM ? SYSTEM : 'managed/user/' + LOGGED_IN_USER_ID;

  return {
    action: action,
    timeStamp: moment().format(),
    userId: userId,
    comment: comment 
  };
}

function getAttrFromEventData (eventData, dataGroup, topLevelName, valueArrayKey, nestedName) {
  for (var i = 0; i < eventData[dataGroup].length; i++) {
    var attr = eventData[dataGroup][i];
    if (attr.attributeName && attr.attributeName === topLevelName) {
      return attr;
    } else if (attr.displayName && attr.displayName === topLevelName) {
      for (var j = 0; j < attr[valueArrayKey].length; j++) {
        if (attr[valueArrayKey][j].displayName == nestedName) {
          return attr[valueArrayKey][j];
        }
      }
      return null;
    }
  }
  return null;
}

/*
 * Function _claimEvent
 * takes an event property and changes.. editing the changeBy property to be a different value
 */
function _claimEvent(event, acting_id) {
  if (event['claimedBy']) {
    return
  }
  if (event['certifierType'] === CONSTANT.CERTIFIER_TYPE.ENTITLEMENT_OWNER) {
    _claimCertifiablesGranular(event, acting_id);
  } else {
    event['claimedBy'] = LOGGED_IN_USER_ID;
  }
}

/*
 * This function will claim each certifiable that you or one of your auth roles owns
 */
function _claimCertifiablesGranular(event, acting_id) {
  var objs = c.getCertifiablesInEventClaimableForCertifierIdForUserUnclaimed(event, acting_id, LOGGED_IN_USER_ID);
  objs.forEach(function(obj){
    obj['claimedBy'] = LOGGED_IN_USER_ID;
  });
}

/*
 * Function _updateRepoObject
 */
function __updateRepoObject(campaignObject, CAMPAIGN_ID) {
  openidm.update(CERT_REPO_PATH + CAMPAIGN_ID, null, campaignObject);
}

function _updateEventStatus(event, action) {
  // update the event status, completedBy, and completionDate

  // if the event status is final, we are not allowed to edit it
  if (c.isFinal(event)) {
    var message = 'Cannot alter the event because its status is already "' + event.status + '".';
    __.requestError(message, 500);
  }
  // if the action is sign off, then go ahead and sign off
  if (action === CONSTANT.EVENT_ACTION.SIGN_OFF) {
    _validateEventsForSignOff([event]);
    __signOffObject(event);
  }
  // if action is reset, reset it back to an in-progress state
  else if (action === CONSTANT.EVENT_ACTION.RESET) {
    event.status = 'in-progress';
    event.completionDate = null;
    event.completedBy = null;
  }
  // in all other scenarios, detect the status from the entitlements themselves...
  else {
    if (c.isAllCertifiablesInEventHasOutcome(event)) {
      event.status = REVIEWED;
    }
  }

  // push updates to repo
  utils.updateEventRepo(EVENT_REPO_PATH, event);
}

function _notifySignOffSuccess(campaign_id, campaign_name) {
  var params = {
    certId: campaign_id,
    certificationName: campaign_name,
  };
  utils.sendNotificationToUser(
    idmUtils.ensureUserIdLong(LOGGED_IN_USER_ID), NOTIFICATION_COMPLETED_TEMPLATE, params
  );
}

function __signOffObject(object) {
  // object is typically and event, but could be an entitlement (and possibly a campaign, but currently not)
  object.status = 'signed-off';
  object.completedBy = 'managed/user/' + LOGGED_IN_USER_ID;
  object.completionDate = moment().format();
}

function _updateOpenClosedCertifierIds(events_to_sign_off) {
  // In entitlementOwner case, for each event that we set to signed-off, see if we need
  // to move the certifierId from openCertifierIds to closedCertifierIds, and do so
  events_to_sign_off.forEach(function(event) {
    if (event['certifierType'] !== 'entitlementOwner') {
      __.requestError('_updateOpenClosedCertifierIdsGranular function should only be called on entitlementOwner events', 500);
    }
    var open_certifier_ids = c.getOpenCertifierIds(event);
    var closed_certifier_ids = c.getClosedCertifierIds(event);
    var newly_closed_certifier_ids = _.filter(open_certifier_ids, function(open_certifier_id) {
      return c.isClosedCertifierId(event, open_certifier_id);
    });
    // move from open to closed
    var updated_open_certifier_ids = _.difference(open_certifier_ids, newly_closed_certifier_ids);
    var updated_closed_certifier_ids = _.union(closed_certifier_ids, newly_closed_certifier_ids);
    c.setOpenCertifierIds(event, updated_open_certifier_ids);
    c.setClosedCertifierIds(event, updated_closed_certifier_ids);
  });
}

function _signOffCertifiablesAndEvents(events, acting_id) {
  // Sign off individual certifiables (AND events) (currently this function is ONLY for certifierType 'entitlementOwner').
  // Set the certifiable's status to signed-off for all certifiables that you have claimed (you or the role you are acting as).
  // Passively sign off the things you can and leave everything else alone without error.
  events.forEach(function(event) {
    // sign off your certifiables
    var objs_to_sign_off = c.getCertifiablesInEventToSignOff(event, acting_id, LOGGED_IN_USER_ID);
    objs_to_sign_off.forEach(__signOffObject);
    // if all certifiables in the event are signed off, sign off the event too
    if (!c.isFinal(event) && c.isAllCertifiablesInEventSignedOff(event)) {
      // don't use signOffObject because the `completedBy` should be at the entitlement level
      event['status'] = 'signed-off';
      event['completionDate'] = moment().format();
    }
  });
  // now that they are signed off, move openCertifierIds to closedCertifierIds where appropriate
  _updateOpenClosedCertifierIds(events);
  // update events
  events.forEach(function(event) {
    utils.updateEventRepo(EVENT_REPO_PATH, event);
  });
}

function _getEventsWhereUserIsCertifier(events, acting_id) {
  return _.filter(events, function(event) {
    var is_user_certifier = _isUserTheCertifier(event);
    var is_event_signed_off = c.isSignedOff(event);
    var is_for_acting_id = c.isForActingId(acting_id, LOGGED_IN_USER_ID)(event)
    return typeof is_user_certifier === 'boolean' && is_user_certifier && !is_event_signed_off && is_for_acting_id
  })
}

function _validateEventsForSignOff(events) {
  if (!c.isAllReviewed(events)) {
    __.requestError('All events must have status "reviewed" before signing off.', 403);
  }
}

function _signOffEventsWhole(events) {
  // Set the status to signed-off for all events in the task
  events.forEach(function(event) {
    if (event.status === REVIEWED) {
      __signOffObject(event);
    }
  });
  // update events
  events.forEach(function(event) {
    utils.updateEventRepo(EVENT_REPO_PATH, event);
  });}

function _remediateEventsInStage(campaign, stage_index, events) {
  var remProc = campaign.remediationProcess;
  if (!_.isEmpty(remProc) && !remProc.equalsIgnoreCase('None')) {
    events.forEach(function(event) {
      var workflowData = utils.buildWorkflowPayload(campaign, event.eventIndex, event, stage_index, EVENT_REPO_PATH);
      var tempWorkflow = openidm.create('workflow/processinstance', null, workflowData);
      // add comment to the event
      var comment = 'Remediation process id: ' + tempWorkflow._id;
      event.comments.push(_buildCommentObject(comment, SYSTEM));
    });
  }
  // update events
  events.forEach(function(event) {
    utils.updateEventRepo(EVENT_REPO_PATH, event);
  });}

function finalizeCampaign(campaign, campaign_id, stage_index, events_to_sign_off) {
  // run remediation workflow for campaign if there is one
  _remediateEventsInStage(campaign, stage_index, events_to_sign_off);

  // NOTE: Campaign cannot be cancelled by an Admin after 
  // workflow could have been initiated.
  if (!_.isEmpty(events_to_sign_off)) {
    campaign.cancellable = false;
  }

  // NOTE: if ALL events (not only user owned) are signed-off
  // then sign-off campaign (update repo).
  if (c.canSignOffCampaign(campaign_id, CERTIFICATION_TYPE)) {
    campaign.status = 'signed-off';
    campaign.stages[stage_index].completionDate = moment().format();
    campaign.completionDate = moment().format();
  } 
}

function _remediateInStageAndSignOffCampaign(campaign, campaign_id, stage_index, events_to_sign_off, is_stage_complete) {
  // this function really does two separate things that should be divorced
  var numberOfStages = campaign.stages.length;
  var isLastStage = numberOfStages === (stage_index + 1);

  // NOTE: check if all subsequent stages are "done", if so, initiate
  // remediation workflow.
  var nextStagesHaveNoCertifier = utils.nextStagesHaveNoCertifier(
    _.range((stage_index + 1), numberOfStages),
    campaign,
    EVENT_REPO_PATH
  );
  if (isLastStage || nextStagesHaveNoCertifier) {
    finalizeCampaign(campaign, campaign_id, stage_index, events_to_sign_off);
  } else {
    /*
    - NOTE: If it is not the last stage, need to update the subsequent stage status from
      "Pending" to "in-progress" so that the tasks for the next stage will show up in the dashboard.
    */
    var eventIndices = []; // Track the events that we're advancing
    do {

      // Add end dates for stage
      if (is_stage_complete) {
        campaign.stages[stage_index].completionDate = moment().format();
        campaign.stages[stage_index + 1].startDate = moment().format();
      }

      // Grab the event indices that are signed off
      eventIndices = _.map(events_to_sign_off, function(event) {
        return event.eventIndex;
      })

      // Grab the next stage events and filter them by those that are completed in the stage before
      var next_stage_events = c.getEventsInStage(campaign_id, stage_index + 1), CERTIFICATION_TYPE;
      var events_to_advance = _.filter(next_stage_events, function(event) {
        return _.includes(eventIndices, event.eventIndex)
      })
      stage_index += 1;

      // Update next stage events
      events_to_advance.forEach(function(event) {
        if (event.status.equalsIgnoreCase(CONSTANT.STATUS.PENDING)) {
          event.status = CONSTANT.STATUS.IN_PROGRESS;
          utils.updateEventRepo(EVENT_REPO_PATH, event);
          is_stage_complete = false;
        }
        else if (event.status.equalsIgnoreCase(CONSTANT.STATUS.EMPTY) || event.status.equalsIgnoreCase(CONSTANT.STATUS.NO_CERTIFIER)) {
          event.completionDate = moment().format();
          event.completedBy = null;
          utils.updateEventRepo(EVENT_REPO_PATH, event);
        }
      });
      // Filter out those events in this stage that are set to in progress, to just leave those events that need to be advanced again
      events_to_sign_off = _.filter(events_to_advance, function(event) {
        return event.status !== CONSTANT.STATUS.IN_PROGRESS
      });
      is_stage_complete = c.isAllFinal(next_stage_events);
    } while (stage_index + 1 < numberOfStages)

    finalizeCampaign(campaign, campaign_id, stage_index, events_to_sign_off);
  }
}

/*
 * Function _signOffStage
 */
function _signOffStage(STAGE, campaignObject, STAGE_INDEX, CAMPAIGN_ID, acting_id) {
  // get relevant events
  var stage_events = c.getEventsInStage(CAMPAIGN_ID, STAGE_INDEX, CERTIFICATION_TYPE);
  var events_to_sign_off = _getEventsWhereUserIsCertifier(stage_events, acting_id);
  var are_events_in_stage_complete = true;
  var is_whole_stage_complete = c.isAllFinal(stage_events);
  var completed_events = []
  // sign off events granularly (partial) or whole (entire events)
  if (events_to_sign_off[0]['certifierType'] === 'entitlementOwner') {
    _signOffCertifiablesAndEvents(events_to_sign_off, acting_id);
    completed_events = _.filter(events_to_sign_off, c.isFinal);
    are_events_in_stage_complete = !_.isEmpty(completed_events);
  }
  else {
    // verify that we are allowed to sign off the events (throws error if not)
    _validateEventsForSignOff(events_to_sign_off);
    _signOffEventsWhole(events_to_sign_off);
  }

  // remediate, sign off campaign, update event statuses from 'pending' to 'in-progress' if necessary
  if (are_events_in_stage_complete) {
    _remediateInStageAndSignOffCampaign(campaignObject, CAMPAIGN_ID, STAGE_INDEX, events_to_sign_off, is_whole_stage_complete);
  }
  // update all events in target stage
  events_to_sign_off.forEach(function(event) {
    utils.updateEventRepo(EVENT_REPO_PATH, event);
  });

  // NOTE: notify certifier that sign-off action was successful
  _notifySignOffSuccess(CAMPAIGN_ID, campaignObject.name);
}

/*
 * Function _isUserTheCertifier
 */
function _isUserTheCertifier(_event, action) {
  if (_event.status.equalsIgnoreCase('no-certifier')) {
    return false;
  }
  var CERTIFIER_TYPE = _event.certifierType;
  var CERTIFIER_ID = _event.certifierId;
  var CLAIMED_BY_ID = _event.claimedBy || '';
  var _ACTION = action || '';

  if (CERTIFIER_TYPE === CONSTANT.CERTIFIER_TYPE.AUTH_ROLE || CERTIFIER_TYPE === CONSTANT.CERTIFIER_TYPE.GROUP) {
    if (CLAIMED_BY_ID === LOGGED_IN_USER_ID && _ACTION !== CONSTANT.EVENT_ACTION.CLAIM) {
      if (!_.includes(USER_ROLES, CERTIFIER_ID)) {
        return 'User does not have required role.';
      }
    } else if (_ACTION !== CONSTANT.EVENT_ACTION.CLAIM && _ACTION !== CONSTANT.EVENT_ACTION.REASSIGN) {
      return 'This event has not been claimed by this user.';
    }
    return true;
  }
  else if (
    CERTIFIER_TYPE.equalsIgnoreCase('user') ||
    CERTIFIER_TYPE.equalsIgnoreCase('manager') ||
    CERTIFIER_TYPE.equalsIgnoreCase('prevManager')
  ) {
    if (CERTIFIER_ID !== LOGGED_IN_USER_ID) {
      return 'User Id does not match certifier Id.';
    }
    return true;
  }
  else if (CERTIFIER_TYPE.equalsIgnoreCase('entitlementOwner')) {
    // they should only get events they are allowed to certify in the first place
    // but they are NOT necessarily the certifier for ALL entitlements in the event
    return true
  }
  else {
    return 'Certifier type must be group, user, manager, prevManager, or entitlementOwner.'
  }
}

/*
 * Function _validateParamsForEvent
 */
function _validateParamsForEvent(EVENT, dataGroup, dataIndex, isAttrLevel, attrIndex) {
  if (dataGroup !== 'managedObject' && dataGroup !== 'application' && dataGroup !== 'metadata') {
    __.requestError('dataGroup value: "' + dataGroup + '" is not supported.', 400);
  }

  if (!EVENT.eventData[dataGroup][dataIndex]) {
    __.requestError('dataIndex "' + dataIndex + '" does not exist in dataGroup: ' + dataGroup + '.', 400);
  }

  if (isAttrLevel) {
    var key = dataGroup === 'managedObject' || dataGroup === 'metadata' ? 'values' : 'attributes';
    if (!EVENT.eventData[dataGroup][dataIndex][key][attrIndex]) {
      __.requestError(
        'attrIndex: "' + attrIndex + '" does not exist in dataIndex ' + dataIndex + ' for dataGroup: ' + dataGroup + '.',
        400
      );
    }
  }//end:if
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Event Details & Event Detail Attributes actions
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/*
 * Function _certifyEventDetailAttribute
 */
function _certifyEventDetailAttribute(detailAttribute) {
  _setOutcome(detailAttribute, CONSTANT.EVENT_ACTION.CERTIFY);
}

/*
 * Function _certifyEventDetail
 */
function _certifyDetailGroup(detailGroup) {
  _setOutcome(detailGroup, CONSTANT.EVENT_ACTION.CERTIFY);
}

/*
 * Function _revokeEventDetailAttribute
 */
function _revokeEventDetailAttribute(detailAttribute, comment) {
  _setOutcome(detailAttribute, CONSTANT.EVENT_ACTION.REVOKE);
  detailAttribute.comments.push(_buildCommentObject(comment, CONSTANT.EVENT_ACTION.REVOKE));
}

/*
 * Function _revokeEventDetail
 */
function _revokeEventDetail(detailGroup, comment) {
  _setOutcome(detailGroup, CONSTANT.EVENT_ACTION.REVOKE);
  detailGroup.comments.push(_buildCommentObject(comment, CONSTANT.EVENT_ACTION.REVOKE));
}

/*
 * Function _resetEventDetailAttribute
 */
function _resetEventDetailAttribute(detailAttribute) {
  _setOutcome(detailAttribute, null);
}

/*
 * Function _resetEventDetail
 */
function _resetEventDetail(detailGroup, dataCollectionKey) {
  _setOutcome(detailGroup, null);

  detailGroup[dataCollectionKey].forEach(function(attr) {
    _setOutcome(attr, null);
  });
}

/*
 * Function _commentEventDetailAttribute
 */
function _commentEventDetailAttribute(detailAttribute, comment) {
  detailAttribute.comments.push(_buildCommentObject(comment, CONSTANT.EVENT_ACTION.COMMENT));
}

/*
 * Function _commentEventDetail
 */
function _commentEventDetail(detailGroup, comment) {
  detailGroup.comments.push(_buildCommentObject(comment, CONSTANT.EVENT_ACTION.COMMENT));
}

/*
 * Function _abstainEventDetailAttribute
 */
function _abstainEventDetailAttribute(detailAttribute, comment) {
  _setOutcome(detailAttribute, CONSTANT.EVENT_ACTION.ABSTAIN);
  detailAttribute.comments.push(_buildCommentObject(comment, CONSTANT.EVENT_ACTION.ABSTAIN));
}

/*
 * Function _abstaintEventDetail
 */
function _abstainEventDetail(detailGroup, comment) {
  _setOutcome(detailGroup, CONSTANT.EVENT_ACTION.ABSTAIN);
  detailGroup.comments.push(_buildCommentObject(comment, CONSTANT.EVENT_ACTION.ABSTAIN));
}

function _setOutcome(obj, outcome) {
  // if the thing is signed off, leave it alone.  Otherwise, set the outcome.
  if (!c.isSignedOff(obj)) {
    obj['outcome'] = outcome;
  }
}

function pushOutcomeDownwardsInEvent(event, outcome, acting_id, override_top_level_outcome) {
  // outcomes get pushed down in a default/underlay way.  But parent groups take precedence over others.  So if an array's parent has an outcome, it inherits THAT outcome instead of the outcome of the entire event
  // But with the following EXCEPTION: If the event outcome is CONSTANT.EVENT_ACTION.REVOKE or NULL, then we do an extend/override/overlay.
  var _res = _isUserTheCertifier(event);
  if (!(typeof _res === 'boolean' && _res)) {
    // user is not permitted to modify this event.  do nothing.
    return
  }

  // get the certifiable things that are in scope for the situation
  var cdetail_groups, entitlements, everything;
  if (event['certifierType'] === 'entitlementOwner') {
    cdetail_groups = c.getCDetailGroupsInEventForCertifierIdForUserResponsible(event, acting_id, LOGGED_IN_USER_ID);
    entitlements = c.getEntitlementsInEventForCertifierIdForUserResponsible(event, acting_id, LOGGED_IN_USER_ID);
    everything = c.getCertifiablesInEventForCertifierIdForUserResponsible(event, acting_id, LOGGED_IN_USER_ID);
  } else {
    cdetail_groups = c.getCDetailGroupsInEvent(event);
    entitlements = c.getEntitlementsInEvent(event);
    everything = c.getCertifiablesInEvent(event);
  }
  // If the outcome is CONSTANT.EVENT_ACTION.REVOKE or NULL, then we just override everything that's not signed off
  if (outcome === CONSTANT.EVENT_ACTION.REVOKE || outcome === null) {
    everything.forEach(function(thing) {
      _setOutcome(thing, outcome);
    });
  }
  // Otherwise, we filter downwards in an underlay fashion.
  else {
    // push 'parent' group outcomes down to entitlements
    cdetail_groups.forEach(function(cdetail_group) {
      // assume that if you own the detail group, you will own all the entitlements too
      var entitlements = c.getEntitlementsInDetailGroup(cdetail_group);
      entitlements.forEach(function(entitlement) {
        _setOutcome(entitlement, entitlement['outcome'] || cdetail_group['outcome'] || null);
      });
    });
    // push provided outcome down to parent groups and entitlements
    everything.forEach(function(thing) {
      _setOutcome(thing, thing['outcome'] || outcome || null);
    });
  }

  // set event outcome itself
  if (event['certifierType'] === 'entitlementOwner') {
    _setOutcome(event, c.getInheritedOutcomeOfEvent(event));
  } else if (event['outcome'] === null || override_top_level_outcome) {
    _setOutcome(event, outcome);
  }
}

/*
 * Function pushDetailGroupOutcomeToChildren
 */
function pushDetailGroupOutcomeToChildren(detailGroup, dataCollectionKey) {
  // outcomes get pushed down in an override/overlay way
  var outcome = detailGroup.outcome;
  detailGroup[dataCollectionKey].forEach(function(child) {
      if (Number(child.certifiable)) {
        _setOutcome(child, outcome);
      }
  });
}

function getEventsInStageByQueryFilter(campaign_id, stage_index, query_filter) {
  // The given query filter just filters the events, but doesn't guarantee the stage, so we add that part ourselves.
  var queryFilter = qf.and([qf.isEventInStage(campaign_id, stage_index), '('+query_filter+')']);
  try {
    return openidm.query(EVENT_REPO_PATH, {_queryFilter: queryFilter}).result;
  } catch(error) {
    __.requestError(error.message, 406);
  }
}

function processActionOnStage(campaignObject, STAGE, campaign_id, stage_index, action, acting_id, query_filter, reqBody) {
  // validate action
  validate.bulkStageAction(action);
  // sign-off specific
  if (action === CONSTANT.STAGE_ACTION.SIGN_OFF) {
    validate.signOffStageQueryFilter(query_filter);
    _signOffStage(STAGE, campaignObject, stage_index, campaign_id, acting_id);
  }
  else {
    // convert stage action to event action
    var event_action = CONSTANT.STAGE_ACTION_TO_EVENT_ACTION[action];
    // perform action on all events in stage
    var events = getEventsInStageByQueryFilter(campaign_id, stage_index, query_filter);
    if (action === CONSTANT.STAGE_ACTION.CERTIFY_REMAINING) {
      events = _.filter(events, c.isNotReviewed);
    }
    if (action !== CONSTANT.STAGE_ACTION.REASSIGN) {
      events = _.filter(events, c.isForActingId(acting_id, LOGGED_IN_USER_ID))
    }
    events.forEach(function(event) {
      processActionOnEvent(campaignObject, event, event_action, acting_id, reqBody);
    });
  }
}

function processActionOnEvent(campaignObject, event, action, acting_id, reqBody) {
  var is_comment_added = false;
  // validate action
  validate.eventAction(action);
  // if the event status is final, we are not allowed to edit it
  if (c.isFinal(event) || event.status === CONSTANT.STATUS.PENDING) {
    return is_comment_added
  }
  // update outcomes within event
  if (_.includes([CONSTANT.EVENT_ACTION.REVOKE, CONSTANT.EVENT_ACTION.ABSTAIN, CONSTANT.EVENT_ACTION.CERTIFY, CONSTANT.EVENT_ACTION.CERTIFY_REMAINING, CONSTANT.EVENT_ACTION.RESET], action)) {
    var new_outcome = CONSTANT.EVENT_ACTION_TO_OUTCOME[action];
    var override_top_level_outcome = Boolean(action !== CONSTANT.EVENT_ACTION.CERTIFY_REMAINING);
    pushOutcomeDownwardsInEvent(event, new_outcome, acting_id, override_top_level_outcome);
  }
  // add a comment
  if (_.includes([CONSTANT.EVENT_ACTION.REVOKE, CONSTANT.EVENT_ACTION.ABSTAIN, CONSTANT.EVENT_ACTION.COMMENT], action)) {
    _commentEvent(event, reqBody.comment, action);
    is_comment_added = true;
  }
  // reset-specific
  if (action === CONSTANT.EVENT_ACTION.RESET) {
    campaignObject.signOff = false;
  }
  // claim-specific
  if (action === CONSTANT.EVENT_ACTION.CLAIM) {
    _claimEvent(event, acting_id);
  }

  if(action === CONSTANT.EVENT_ACTION.REASSIGN){
    var newCertifierName = getNameOfCertifier(reqBody.newCertifierId);
    reassignCertification(event, reqBody.oldCertifierId, reqBody.newCertifierId, newCertifierName);
  }
  // update event status and other info
  _updateEventStatus(event, action);
  // return event comment added, at least for now
  return is_comment_added
}

function reassignCertification(event, oldCertifierId, newCertifierId, newCertifierName){
  if(!isAdmin()){
    __.requestError('Signed in user must be an admin, request is not valid.', 403);
  }

  if (event['certifierType'] === CONSTANT.CERTIFIER_TYPE.ENTITLEMENT_OWNER){
    if(!idmUtils.isLongUserId(newCertifierId) && !idmUtils.isLongRoleId(newCertifierId)){
      __.requestError('Certifier ID is not in the correct format "' + newCertifierId +'" request is not valid.', 400);
    }
    if(oldCertifierId){
      var idList = event["openCertifierIds"].split(",");
      if(_.includes(idList, oldCertifierId)){
        idList.splice(idList.indexOf(oldCertifierId), 1);
        if(!_.includes(idList, newCertifierId)){
          idList.push(newCertifierId);
        }
        event['openCertifierIds'] = idList.join();

        // change certifierID for all entitlements
        reassignCertifierEntitlements(event, oldCertifierId, newCertifierId);

        if(event.claimedBy){
          event['claimedBy'] = null;
        }
      }
      else{
        __.requestError('oldCertifierId not in openCertifierIds list "' + idList +'" request is not valid.', 400);
      }
    }
    else{
      __.requestError('oldCertifierId does NOT exist "' + oldCertifierId +'" request is not valid.', 400);
    }
  }
  else if
  (
      event['certifierType'] === CONSTANT.CERTIFIER_TYPE.USER ||
      event['certifierType'] === CONSTANT.CERTIFIER_TYPE.AUTH_ROLE ||
      event['certifierType'] === CONSTANT.CERTIFIER_TYPE.GROUP ||
      event['certifierType'] === CONSTANT.CERTIFIER_TYPE.PREV_MANAGER ||
      event['certifierType'] === CONSTANT.CERTIFIER_TYPE.MANAGER
  ) {
    if(event.status !== CONSTANT.STATUS.IN_PROGRESS && event.status !== CONSTANT.STATUS.PENDING && event.status !== CONSTANT.STATUS.REVIEWED){
      __.requestError('Event must be in-progress or pending to reassign, current status: "' + event.status, 400);
    }

    if(idmUtils.isLongUserId(newCertifierId)){
      event['certifierId'] = idmUtils.ensureUserIdShort(newCertifierId);
      event['certifierType'] = CONSTANT.CERTIFIER_TYPE.USER;
      event['certifierName'] = newCertifierName;
      delete event['claimedBy'];
    }
    else if(idmUtils.isLongRoleId(newCertifierId)){
      event['certifierId'] = newCertifierId;
      event['certifierType'] = CONSTANT.CERTIFIER_TYPE.GROUP;
      event['certifierName'] = newCertifierName;
      event['claimedBy'] = null;
    }
    else{
      __.requestError('Incorrect ID format, "' + newCertifierId +'" is not valid.', 400);
    }
  }
  else{
    __.requestError('Certifier type is not valid "' + event['certifierType'] +'" is not valid.', 400);
  }

  // send notification
  var campaign = openidm.read(CERT_REPO_PATH + event['campaignId']);
  var params = {
    id: event['_id'],
    toEmailAddress: newCertifierId,
    certificationName: campaign['name']
  };
  utils.sendNotification(NOTIFICATION_CREATED_TEMPLATE, params)
}

function reassignCertifierEntitlements(event, oldCertifierId, newCertifierId) {
  event.eventData.application.forEach(function(application){
    if(application.certifierId == oldCertifierId) {
      application.certifierId = newCertifierId;
      delete application['claimedBy'];

      application.attributes.forEach(function(attribute) {
        if(attribute.status !== "signed-off"){
          attribute.certifierId = newCertifierId;
          delete attribute['claimedBy'];
        }
      });
    }
  });

  //iterate through managedObject
  event.eventData.managedObject.forEach(function(object) {
    if(object.values.length >= 1){
      object.values.forEach(function(value){
        if(value.certifierId === oldCertifierId){
          value.certifierId = newCertifierId;
          delete value['claimedBy'];
        }
      });
    }
    else{
      if(object.certifierId === oldCertifierId){
        object.certifierId = newCertifierId;
        delete object['claimedBy'];
      }
    }
  });
}

// Given a list of event IDs, reassign each one from old certifier to new certifier
function reassignEvents(events, oldCertifierId, newCertifierId) {
  var shortOldId = idmUtils.ensureUserIdShort(oldCertifierId);
  var newCertifierName = getNameOfCertifier(newCertifierId);

  _.forEach(events, function(event) {
    // If event is role owned and claimed by user, unclaim but do not assign to new user
    if (event.claimedBy === shortOldId) {
      unclaimEvent(event);
    }
    else {
      reassignCertification(event, oldCertifierId, newCertifierId, newCertifierName);
    }
    utils.updateEventRepo(EVENT_REPO_PATH, event);
  })
}

function reassignSelectedEventsForCertifierId(event_ids, oldCertifierId, newCertifierId) {
  var certifierEvents = [];
  var campaignIds = [];
  _.forEach(event_ids, function(event_id) {
    var event = openidm.read(EVENT_REPO_PATH + event_id);
    certifierEvents.push(event);
    campaignIds.push(event.campaignId);
  })
  reassignEvents(certifierEvents, oldCertifierId, newCertifierId);
  getAndUpdateCampaignsById(campaignIds);
}

// Given two IDs, reassign all events belong to oldCertifierId to newCertifierId
function reassignAllEventsForCertifierId(oldCertifierId, newCertifierId) {
  var certifierEvents = openidm.query(EVENT_REPO_PATH, { _queryFilter: qf.isIdCertifierOfActive(oldCertifierId) }).result;
  var campaignIds = _.map(certifierEvents, 'campaignId');
  reassignEvents(certifierEvents, oldCertifierId, newCertifierId);
  getAndUpdateCampaignsById(campaignIds);
}

function getAndUpdateCampaignsById(campaignIds) {
  var uniqueIds = _.uniq(campaignIds);
  _.forEach(uniqueIds, function(campaignId) {
    var campaignObject = c.getCampaignAndUpdateInformation(campaignId, CERTIFICATION_TYPE);
    __updateRepoObject(campaignObject, campaignId);
  });
}

// Get all the event IDs within the given list of campaign IDs that are assigned to the given certifierId
// If list is long (> 40), query in bunches
function getEventIdsFromCampaignIds(campaignIds, certifierId) {
  var eventIds = [];
  var isIdCertifier = qf.isIdCertifier(certifierId);
  var count = 0;
  _.forEach(campaignIds, function(campaignId) {
    queryFilter = count === 0 ? '(campaignId eq "' + campaignId + '"' : queryFilter + ' or campaignId eq "' + campaignId + '"';
    if (count >= 40) {
      queryFilter += ') and ' + isIdCertifier;
      var queryResults = openidm.query(EVENT_REPO_PATH, { _queryFilter: queryFilter, _fields: [ '_id' ] }).result;
      eventIds = eventIds.concat(_.map(queryResults, '_id'));
      queryFilter = '';
      count = 0;
    }
    count += 1;
  });
  // Query for the last group of policies
  if (count > 0) {
    queryFilter += ') and ' + isIdCertifier;
    var queryResults = openidm.query(EVENT_REPO_PATH, { _queryFilter: queryFilter, _fields: [ '_id' ] }).result;
    eventIds = eventIds.concat(_.map(queryResults, '_id'));
  }
  return eventIds;
}

function unclaimEvent(event) {
  delete event['claimedBy'];
}

function getNameOfCertifier(certifierId) {
  if (idmUtils.isLongRoleId(certifierId)) {
    var role = idmUtils.getRole(certifierId);
    var roleName = role ? role.name : null;
    return roleName;
  }
  else {
    var user = idmUtils.getUser(certifierId);
    var userName = user ? user.userName : null;
    return userName
  }
}

function isAdmin() {
  var authInfo = openidm.read('info/login');
  ROLES = authInfo.authorization.roles;
  return _.includes(ROLES, idmUtils.ensureInternalRoleIdLong(CCONSTANT.ROLE.GOV_ADMIN));
}

function setCertificationPaths(certificationType) {
  if (certificationType === 'user') {
    CERT_REPO_PATH = CONSTANT.REPO_PATH.USER_CERT;
    EVENT_REPO_PATH = CONSTANT.REPO_PATH.USER_EVENT;
    NOTIFICATION_CREATED_TEMPLATE = 'governance/sendNotification/CERTIFICATION_CREATED_ADHOC';
    NOTIFICATION_COMPLETED_TEMPLATE = 'governance/sendNotification/CERTIFICATION_COMPLETED';
  }
  else {
    CERT_REPO_PATH = CONSTANT.REPO_PATH.OBJECT_CERT;
    EVENT_REPO_PATH = CONSTANT.REPO_PATH.OBJECT_EVENT;
    NOTIFICATION_CREATED_TEMPLATE = 'governance/sendNotification/OBJECT_CERTIFICATION_CREATED_ADHOC';
    NOTIFICATION_COMPLETED_TEMPLATE = 'governance/sendNotification/OBJECT_CERTIFICATION_COMPLETED';
  }
}