/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
(function () {

/* global request, context, openidm */
 /* eslint consistent-return: off */
var _ = require('commons/lib/lodash4.js');
var __ = require('commons/utils/jsUtils.js');
var moment = require('commons/lib/moment.js')
var CONSTANT = require('idg/utils/globalConstants.js');
var utils = require('idg/utils/generalUtilities.js');
var qf = require('idg/utils/queryFilter.js');

var TERMINATE = 'terminate';
var CERTIFICATION_TYPE = 'user'; // TODO get from request

exports.terminateCertEvents = function(oldObject) {



if (oldObject) {
  var TARGET_USER_ID = oldObject._id;

  // NOTE: get all campaigns where "status: in-progress" and event targetId is TARGET_USER_ID
  // 1. fetch all events where targetId = TARGET_USER_ID, _fields: ['campaignId']
  var _campaignsInProgress = openidm.query(CONSTANT.REPO_PATH.USER_CERT, { _queryFilter: qf.isStatusInProgress(), _fields: ['_id'] }).result;
  var totalCampaignsInProgress = _campaignsInProgress.length;

  var queryResult = [];
  // NOTE: the numbers of campaign ids is more than 50. we want to create a
  // queryFilter for 50 campaign ids at a time.
  for (var z = 0; z <= totalCampaignsInProgress; z += CONSTANT.MAX_CAMPAIGN_IDS_FOR_QUERY) {
    var campaigns_slice = _campaignsInProgress.slice(z, z + CONSTANT.MAX_CAMPAIGN_IDS_FOR_QUERY);
    var _params = {
      _queryFilter: qf.queryEventsInCampaignsByTargetId(campaigns_slice, TARGET_USER_ID),
      _fields: ['campaignId'],
    };
    _results = openidm.query(CONSTANT.REPO_PATH.USER_EVENT, _params).result;
    queryResult.concat(_results);
  }

  // fetch full campaign objects for all unique campaignId(s) with status = in-progress
  var uniqEventsByCampaignId = _.uniq(queryResult, 'campaignId');
  var campaign_ids = _.map(uniqEventsByCampaignId, 'campaignId');
  var campaigns = campaign_ids.map(c.getCampaign, 'user');

  // NOTE: loop through all campaigns and terminate events where
  // targetId matches USER_ID
  campaigns.forEach(function(campaignObject) {
    var CAMPAIGN_ID = campaignObject._id;
    var totalStages = campaignObject.stages.length;

    // NOTE: find index of event and stage where event targetId matches
    // terminated user id
    var eventIndex = null;
    var stageIndex = null;
    var stages = campaignObject.stages;
    var found = false;

    // NOTE: fetch all events for all stages in campaignObject
    campaignObject.stages.forEach(function(stg) {
      var _events = c.getEventsInStage(CAMPAIGN_ID, stg.stageIndex, CERTIFICATION_TYPE, ['_id', 'targetId', 'status', 'eventIndex']);
      if (!_events.length) {
        __.requestError('userCertificationOnDelete.js :: Query did not return any events for stageIndex: ' + stg.stageIndex + ' with campaignId: ' + CAMPAIGN_ID, 500);
      }
      stg.events = _events;
    });

    // NOTE: find stage index and eventIndex of the first event where deleted user
    // is the target
    for (var i in stages) {
      var _events = stages[i].events;
      for (var j in _events) {
        var _event = _events[j];

        if (_event.targetId === TARGET_USER_ID && !c.isFinal(_event)) {
          stageIndex = i;
          eventIndex = _event.eventIndex;
          found = true;
          break;
        }
      }
      if (found) { break; }
    }

    if (stageIndex && eventIndex) {
      // NOTE: terminate event on all stages beginning at "stageIndex" found
      for (j = stageIndex; j < totalStages; ++j) {
        var isLastStage = totalStages === (j + 1);
        var stg = campaignObject.stages[j];

        // NOTE: find event with eventIndex in stg.events
        var _eventId = _.find(stg.events, { eventIndex: eventIndex })._id;
        // NOTE: fetch full event object with _id from event found above
        var _evt = openidm.read(CONSTANT.REPO_PATH.USER_EVENT + _eventId);

        if (!_evt) {
          __.requestError('userCertificationOnDelete.js :: L135: Event with id: ' + _eventId + ' was not found.', 500);
        }

        // NOTE: terminate event
        terminateEvent(_evt);

        // NOTE: update event repo
        utils.updateEventRepo(_evt);

        // NOTE: set stage completion date if terminating event completes
        // the stage.
        var allEventsForStageComplete = true;

        stg.events.forEach(function(_event) {
          if (!c.isFinal(_event)) {
            allEventsForStageComplete = false;
          }
        });

        if (allEventsForStageComplete) {
          stg.completionDate = moment().format();
        }

        // NOTE: if it's last stage and all events are "complete"
        // set campaign status to "complete"
        if (isLastStage && allEventsForStageComplete) {
          campaignObject.status = 'complete';
        }
      }

      // NOTE: delete events from stages before updating campaign
      campaignObject.stages.forEach(function(stg) {
        delete stg.events;
      });

      // NOTE: update repo object
      openidm.update(CONSTANT.REPO_PATH.USER_CERT + CAMPAIGN_ID, null, campaignObject);
    }//end:if

  });//end:campaigns.forEach

  logger.warn('Script: userCertificationOnDelete. Success.');

} else {
  logger.warn('Script: userCertificationOnDelete. Error: oldObject is undefined.');
}
}//end:terminateCertEvents;

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * HELPER FUNCTIONS
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

/*
 * Function terminateEvent
 * @returns nothing
 */
function terminateEvent(EVENT) {
  EVENT.status = 'terminated';
  EVENT.outcome = TERMINATE;
  EVENT.completionDate = moment().format();

  EVENT.eventData.identity.forEach(function(idObj) {
    idObj.outcome = TERMINATE;
  });

  EVENT.eventData.managedObject.forEach(function(mo) {
    mo.values.forEach(function(val) {
      val.outcome = TERMINATE;
    });
  });

  EVENT.eventData.application.forEach(function(app) {
    app.outcome = TERMINATE;
    app.attributes.forEach(function(attr) {
      attr.outcome = TERMINATE;
    });
  });
}

}());
