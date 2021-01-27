/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */


// This file is for all constants that are global to idg.
// To demonstrate their global constantness, we put them in UPPER_SNAKE_CASE.
// Constants scattered about IDG should make their way into this file over time assuming they are truly global and constant.

var _ = require('commons/lib/lodash4.js');
var __ = require('commons/utils/jsUtils.js');
var CONSTANT = require('commons/utils/globalConstants.js');

// statuses
STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  IN_PROGRESS: 'in-progress',
  NO_CERTIFIER: 'no-certifier',
  CREATING: 'creating',
  SIGNED_OFF: 'signed-off',
  TERMINATED: 'terminated',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  EMPTY: 'empty',
  EXPIRED: 'expired',
  OPEN: 'open',
  CLOSED: 'closed',
  EXCEPTION: 'exception',
  REMEDIATED: 'remediated',
  EXCEPTION_EXPIRED: 'exception-expired',
};
STATUSES = _.values(STATUS);
FINAL_STATUSES = [STATUS.SIGNED_OFF, STATUS.TERMINATED, STATUS.NO_CERTIFIER, STATUS.EXPIRED, STATUS.CANCELLED, STATUS.EMPTY];
OPEN_STATUSES = [STATUS.IN_PROGRESS, STATUS.PENDING, STATUS.REVIEWED];
CLOSED_STATUSES = [STATUS.SIGNED_OFF, STATUS.TERMINATED, STATUS.EXPIRED, STATUS.CANCELLED];

// outcomes
OUTCOME = {
	REVOKED: 'revoke',
	ABSTAINED: 'abstain',
	CERTIFIED: 'certify',
};
OUTCOMES = _.values(OUTCOME);

// actions
EVENT_ACTION = {
	CLAIM: 'claim',
	CERTIFY_REMAINING: 'certify-remaining',
	CERTIFY: 'certify',
	ABSTAIN: 'abstain',
	REVOKE: 'revoke',
	RESET: 'reset',
	COMMENT: 'comment',
	SIGN_OFF: 'sign-off',
	REASSIGN: 'reassign',
};
EVENT_ACTIONS = _.values(EVENT_ACTION);

STAGE_ACTION = {
	CLAIM: 'claim',
	CERTIFY_REMAINING: 'certify-remaining',
	RESET: 'reset',
	SIGN_OFF: 'sign-off',
	REASSIGN: 'reassign',
};
STAGE_ACTIONS = _.values(STAGE_ACTION);

USER_EVENT_ACTIONS = ['certify', 'revoke', 'reset', 'comment', 'abstain'];
EVENT_DETAIL_ACTIONS = ['certify', 'revoke', 'reset', 'comment', 'abstain'];
EVENT_DETAIL_ATTR_ACTIONS = ['certify', 'revoke', 'reset', 'comment', 'abstain', 'quick view'];
GROUP_EVENT_ACTIONS = ['claim', 'comment'];

// stage action -> event action conversion
STAGE_ACTION_TO_EVENT_ACTION = {};
STAGE_ACTION_TO_EVENT_ACTION[STAGE_ACTION.RESET] = EVENT_ACTION.RESET;
STAGE_ACTION_TO_EVENT_ACTION[STAGE_ACTION.CERTIFY_REMAINING] = EVENT_ACTION.CERTIFY_REMAINING;
STAGE_ACTION_TO_EVENT_ACTION[STAGE_ACTION.CLAIM] = EVENT_ACTION.CLAIM;
STAGE_ACTION_TO_EVENT_ACTION[STAGE_ACTION.SIGN_OFF] = EVENT_ACTION.SIGN_OFF;
STAGE_ACTION_TO_EVENT_ACTION[STAGE_ACTION.REASSIGN] = EVENT_ACTION.REASSIGN;

// action -> outcome conversion
EVENT_ACTION_TO_OUTCOME = {};
EVENT_ACTION_TO_OUTCOME[EVENT_ACTION.REVOKE] = OUTCOME.REVOKED;
EVENT_ACTION_TO_OUTCOME[EVENT_ACTION.ABSTAIN] = OUTCOME.ABSTAINED;
EVENT_ACTION_TO_OUTCOME[EVENT_ACTION.CERTIFY] = OUTCOME.CERTIFIED;
EVENT_ACTION_TO_OUTCOME[EVENT_ACTION.CERTIFY_REMAINING] = OUTCOME.CERTIFIED;
EVENT_ACTION_TO_OUTCOME[EVENT_ACTION.RESET] = null;

// For a detail group, the possible keys of that group object which would obtain the corresponding values that are the details themselves.
// The keys are IN THE ORDER that we check them when searching for the details group values
DETAIL_GROUP_KEYS = ['attributes', 'values'];

// The keys in event.eventData whose corresponding values contain detail groups
EVENT_DATA_KEYS_TO_FIND_DETAIL_GROUPS = ['application', 'managedObject', 'metadata'];

EVENT_TYPE = {
	OPEN: 'open',
	CLOSED: 'closed'
};
EVENT_TYPES = _.values(EVENT_TYPE);

// escalation types
ESCALATION_TYPE = {
	USER: 'user',
  AUTH_ROLE: 'authzRoles',
  GROUP: 'authzGroup',
	MANAGER: 'manager',
};
ESCALATION_TYPES = _.values(ESCALATION_TYPE);

// certifier types
CERTIFIER_TYPE = {
	USER: 'user',
	AUTH_ROLE: 'authzRoles',
	GROUP: 'authzGroup',
	MANAGER: 'manager',
	PREV_MANAGER: 'prevManager',
	ENTITLEMENT_OWNER: 'entitlementOwner',
	GLOSSARY_KEY: 'glossaryKey',
};
CERTIFIER_TYPES = _.values(CERTIFIER_TYPE);

// repo path constants
REPO_PATH = {
	USER_EVENT: 'repo/governance/userEvent/',
	USER_CERT: 'repo/governance/userCertification/',
	OBJECT_EVENT: 'repo/governance/objectEvent/',
	OBJECT_CERT: 'repo/governance/objectCert/',
	VIOLATION: 'repo/governance/violation/',
	SCHEDULED_USER_CERT: 'repo/governance/scheduledUserCertification/',
	SCHEDULED_OBJECT_CERT: 'repo/governance/scheduledObjectCertification/',
	TRIGGERED_USER_CERT: 'repo/governance/triggeredUserCertification/',
	TRIGGERED_OBJECT_CERT: 'repo/governance/triggeredObjectCertification/',
	POLICY_SCAN: 'repo/governance/policyScan',
	SCHEDULED_POLICY_SCAN: 'repo/governance/scheduledPolicyScan/',
	GLOSSARY: 'repo/glossary',
	ENTITLEMENT_HISTORY: 'repo/governance/admin/entitlementHistory',
	ADMIN_DASHBOARD: 'repo/governance/dashboard/admin',
	ADMIN_DASHBOARD_BACKUP: 'repo/governance/dashboard/adminBackup',
	SCHEDULER_JOB: 'scheduler/job/',
};

CHART_TYPE = {
	STAT_CARD: 'statCard',
	TABLE: 'table',
	PIE: 'pie',
}

// the maximum number of query results to get
MAX_CAMPAIGN_IDS_FOR_QUERY = 50;

module.exports = __.extendedStrict(CONSTANT, {
	STATUS: STATUS,
	STATUSES: STATUSES,
	FINAL_STATUSES: FINAL_STATUSES,
	OPEN_STATUSES: OPEN_STATUSES,
	CLOSED_STATUSES: CLOSED_STATUSES,
	OUTCOME: OUTCOME,
	OUTCOMES: OUTCOMES,
	EVENT_ACTION: EVENT_ACTION,
	EVENT_ACTIONS: EVENT_ACTIONS,
	STAGE_ACTION: STAGE_ACTION,
  STAGE_ACTIONS: STAGE_ACTIONS,
  USER_EVENT_ACTIONS: USER_EVENT_ACTIONS,
  EVENT_DETAIL_ACTIONS: EVENT_DETAIL_ACTIONS,
  EVENT_DETAIL_ATTR_ACTIONS: EVENT_DETAIL_ATTR_ACTIONS,
  GROUP_EVENT_ACTIONS: GROUP_EVENT_ACTIONS,
	STAGE_ACTION_TO_EVENT_ACTION: STAGE_ACTION_TO_EVENT_ACTION,
	EVENT_ACTION_TO_OUTCOME: EVENT_ACTION_TO_OUTCOME,
	DETAIL_GROUP_KEYS: DETAIL_GROUP_KEYS,
	EVENT_DATA_KEYS_TO_FIND_DETAIL_GROUPS: EVENT_DATA_KEYS_TO_FIND_DETAIL_GROUPS,
	EVENT_TYPE: EVENT_TYPE,
	EVENT_TYPES: EVENT_TYPES,
	ESCALATION_TYPE: ESCALATION_TYPE,
	ESCALATION_TYPES: ESCALATION_TYPES,
	CERTIFIER_TYPE: CERTIFIER_TYPE,
	CERTIFIER_TYPES: CERTIFIER_TYPES,
	REPO_PATH: REPO_PATH,
	CHART_TYPE: CHART_TYPE,
	MAX_CAMPAIGN_IDS_FOR_QUERY: MAX_CAMPAIGN_IDS_FOR_QUERY,
});
