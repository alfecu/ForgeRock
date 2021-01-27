/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
module.exports = [
  {
    "pattern": "managed/*",
    "roles": "governance-administrator",
    "methods": "read,query",
    "actions": "*"
  },
  {
    "pattern": "internal/role",
    "roles": "governance-administrator",
    "methods": "read,query",
    "actions": "*"
  },
  {
    "pattern": "endpoint/linkedView/managed/*",
    "roles": "governance-administrator",
    "methods": "read,query",
    "actions": "*"
  },
  {
    "pattern": "config/managed",
    "roles": "governance-administrator",
    "methods": "read",
    "actions": "*"
  },
  {
    "pattern": "workflow/processdefinition",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "read,query"
  },
  {
    "pattern": "governance/adminDashboard",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/adminDashboard/*",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/certification",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/certification/*",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },

  {
    "pattern": "governance/scheduledCertification",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/scheduledCertification/*",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/triggeredCertification",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/triggeredCertification/*",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/certification",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/certification/*",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/scheduledCertification",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/scheduledCertification/*",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/triggeredCertification",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/triggeredCertification/*",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/adminCancelCert",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/adminCancelCert/*",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  
  {
    "pattern": "governance/adminCertification/*",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/adminPolicy/*",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/adminPolicy",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/certificationList/*",
    "roles": "openidm-authorized",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/certificationList/*",
    "roles": "openidm-authorized",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/adminCertList/*",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/certificationEventDetails/*",
    "roles": "openidm-authorized",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/adminCertEventDetails/*",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/certify",
    "roles": "openidm-authorized",
    "methods": "create",
    "actions": "*"
  },
  {
    "pattern": "governance/certify/*",
    "roles": "openidm-authorized",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "managed/policy",
    "roles": "openidm-authorized",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "managed/policy/*",
    "roles": "openidm-authorized",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/violation",
    "roles": "openidm-authorized",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/violation/*",
    "roles": "openidm-authorized",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/userEventData/*",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/activePolicyScan",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/policyScan",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/policyScan/*",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/reactivePolicyScanManagement",
    "roles": "governance-administrator",
    "methods": "create,action",
    "actions": "*"
  },
  {
    "pattern": "governance/reactivePolicyScanManagement",
    "roles": "openidm-authorized",
    "methods": "read",
    "actions": "*"
  },
  {
    "pattern": "config/governance",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "config/governance/objects",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/notification",
    "roles": "openidm-authorized",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/notification/*",
    "roles": "openidm-authorized",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/sendNotification",
    "roles": "openidm-authorized",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/sendNotification/*",
    "roles": "openidm-authorized",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/systemSettings",
    "roles": "openidm-authorized",
    "methods": "read",
    "actions": "*"
  },
  {
    "pattern": "governance/systemSettings",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/expressionParser/*",
    "roles": "openidm-authorized",
    "methods": "action",
    "actions": "parse"
  },
  {
    "pattern": "governance/getRelationshipObjects",
    "roles": "governance-administrator",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "governance/dashboard/*",
    "roles": "openidm-authorized",
    "methods": "read",
    "actions": "*"
  },
  {
    "pattern": "governance/dashboard",
    "roles": "openidm-authorized",
    "methods": "read",
    "actions": "*"
  },
  {
    "pattern": "governance/managedObjectConfig",
    "roles": "openidm-authorized",
    "methods": "read",
    "actions": "*"
  },
  {
    "pattern": "config/accessReviewRepoInfo",
    "roles": "governance-administrator",
    "methods": "read",
    "actions": "*"
  }
];