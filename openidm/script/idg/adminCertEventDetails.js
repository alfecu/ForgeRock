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
var c = require('idg/utils/campaign.js');

var queryParams = null;



run();
function run() {
  queryParams = request.additionalParameters;

  /*
   * GET /governance/certificationEventDetails/type/<campaign id>/<stage index>/<event index>
   */
  if (
    utils.methodIs('READ') &&
    utils.urlParamsCount(request.resourcePath, 4)
  ) {
    // NOTE: get campaign id, stage index, and event index from request
    var url = request.resourcePath;
    var urlSegments = url.split('/');

    var CERTIFICATION_TYPE = urlSegments[0];
    var CAMPAIGN_ID = urlSegments[1]
    var STAGE_INDEX = Number(urlSegments[2]);
    var EVENT_INDEX = Number(urlSegments[3]);
    var CERT_REPO_PATH = CERTIFICATION_TYPE === 'user' ? CONSTANT.REPO_PATH.USER_CERT : CONSTANT.REPO_PATH.OBJECT_CERT;
    var EVENT_REPO_PATH = CERTIFICATION_TYPE === 'user' ? CONSTANT.REPO_PATH.USER_EVENT : CONSTANT.REPO_PATH.OBJECT_EVENT;

    // NOTE: get repo object with certId provided
    var campaignObject = openidm.read(CERT_REPO_PATH + CAMPAIGN_ID);

    // NOTE: check if stage index exists in campaignObject
    if (!__.indexExists(campaignObject.stages, STAGE_INDEX)) {
      __.requestError('Stage index does not exist in campaign.', 400);
    }

    var EVENT = c.getEvent(CAMPAIGN_ID, STAGE_INDEX, EVENT_INDEX, CERTIFICATION_TYPE);
    var idMap = {};
    EVENT = displayUtils.addDisplayNamesToEvent(EVENT, null, idMap, CERTIFICATION_TYPE);

    // NOTE: get same event index for other stages and build "stages" array
    // including the target EVENT
    var _stages = [];
    campaignObject.stages.forEach(function(stg) {
      if (stg.stageIndex === STAGE_INDEX) {
        EVENT.stageName = stg.name;
        utils.addDataToEntitlements(EVENT);
        _stages.push(EVENT);
        return;
      }
      var _event = c.getEvent(CAMPAIGN_ID, stg.stageIndex, EVENT_INDEX, CERTIFICATION_TYPE);
      _event = displayUtils.addDisplayNamesToEvent(_event, null, idMap, CERTIFICATION_TYPE);  
      _event.stageName = stg.name;
      _stages.push(_event);
    }); 

    // NOTE: add extra data to each event (yes _stages is an array of EVENTS, not stages)
    processEvents(_stages);

    /*
     * NOTE: add target user info (firstName, lastName, email)
     */
    var targetInfo = {}
    if (CERTIFICATION_TYPE === 'user') {
      targetInfo = {
        userName: EVENT.userName,
        firstName: EVENT.firstName,
        lastName: EVENT.lastName,
        email: EVENT.email
      }
    }
    else {
      targetInfo = {
        name: EVENT.name,
        description: EVENT.description,
      }
    };

    return {
      campaignInfo: _.omit(campaignObject, 'stages'),
      currentStage: STAGE_INDEX,
      targetInfo: targetInfo,
      stages: _stages
    };
  }//end:GET

  /*
   * Request not supported. Respond with bad request
   */
  __.requestError('Request not supported.', 400);

}//end:run


/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * HELPER FUNCTIONS
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

/*
 * Function processEvents
 */
function processEvents(events) {

  events.forEach(addCertifierDisplayNameToEvent);

  // NOTE: get glossary
  var glossary = {};

  events.forEach(function(_event) {
    utils.addDataToEntitlements(_event);

    var totals = {
      _complete: 0,
      _incomplete: 0,
      _certified: 0,
      _revoked: 0,
      _abstained: 0,
    }

    _event.eventData.managedObject.forEach(function(mo) {
      processEntitlement(mo, totals);
      mo.values.forEach(function(val) {
        processEntitlement(val, totals);
      });
    });

    _event.eventData.metadata.forEach(function(mo) {
      mo.values.forEach(function(val) {
        processEntitlement(val, totals);
      });
    });

    _event.eventData.application.forEach(function(app) {
      processEntitlement(app, totals);
      app.attributes.forEach(function(attr) {
        processEntitlement(attr, totals);
      });
    });


    // NOTE: set event complete and incomplete properties
    _event.complete = totals._complete;
    _event.incomplete = totals._incomplete;
    _event.total = totals._complete + totals._incomplete;
    _event.totalCertified = totals._certified;
    _event.totalRevoked = totals._revoked;
    _event.totalAbstained = totals._abstained;

    //utils.addMetadataToEvent(_event, glossary);

  });//end:events.forEach
}//end:processEvents

function processEntitlement(entitlement, totals) {
  var outcomeIsEmpty = false;

  if (entitlement.certifiable === 1) {
    if (_.isEmpty(entitlement.outcome)) {
      // NOTE: count incomplete
      totals._incomplete += 1;
      outcomeIsEmpty = true;
    } else {
      // NOTE: count complete
      totals._complete += 1;
    }
  }
}

function addCertifierDisplayNameToEvent(event) {
  // add the certifier display name to each event
  event.certifierDisplayName = utils.getCertifierDisplayNameFromEvent(event);
  // add the certifier display name to each certifiable
  if (event['certifierType'] === CONSTANT.CERTIFIER_TYPE.ENTITLEMENT_OWNER) {
    var certifiables = c.getCertifiablesInEvent(event);
    certifiables.forEach(function(certifiable) {
      certifiable.certifierDisplayName = utils.getCertifierDisplayNameFromId(certifiable['certifierId']);
    });
  }
}

