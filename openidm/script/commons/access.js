/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
module.exports = [
  {
    "pattern": "commons/workflow",
    "roles": "openidm-admin,access-request-admin",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "config/commons",
    "roles": "openidm-admin",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "commons/config",
    "roles": "openidm-admin",
    "methods": "CREATE",
    "actions": "*"
  },
  {
    "pattern": "commons/config",
    "roles": "openidm-authorized",
    "methods": "READ",
    "actions": "*"
  },
  {
    "pattern": "commons/managed",
    "roles": "glossary-admin",
    "methods": "READ, QUERY",
    "actions": "*"
  },
  {
    "pattern": "commons/managed/*",
    "roles": "glossary-admin",
    "methods": "READ, QUERY",
    "actions": "*"
  },
  {
    "pattern": "commons/glossary",
    "roles": "glossary-admin",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "commons/glossary/*",
    "roles": "glossary-admin",
    "methods": "*",
    "actions": "*"
  },
  {
    "pattern": "commons/glossary",
    "roles": "governance-administrator",
    "methods": "READ, QUERY",
    "actions": "*"
  },
  {
    "pattern": "commons/glossary/*",
    "roles": "governance-administrator",
    "methods": "READ, QUERY",
    "actions": "*"
  },
  {
    "pattern": "commons/glossary/managed",
    "roles": "openidm-authorized",
    "methods": "READ, QUERY",
    "actions": "*"
  },
];