CONNECT TO DOPENIDM;
QUIESCE DATABASE IMMEDIATE FORCE CONNECTIONS;
UNQUIESCE DATABASE;
CONNECT RESET;
DEACTIVATE DATABASE DOPENIDM;
DROP DATABASE DOPENIDM;
-- DROP STOGROUP GOPENIDM;
-- COMMIT;
-- CREATE STOGROUP GOPENIDM
--       VOLUMES ('*')
--       VCAT     VSDB2T
--;
CREATE DATABASE   DOPENIDM
--       STOGROUP   GOPENIDM
--       BUFFERPOOL BP2
    -- Increase default page size for Activiti
    PAGESIZE 32 K
;
CONNECT TO DOPENIDM;

-- http://db2-vignettes.blogspot.com/2013/07/a-temporary-table-could-not-be-created.html
CREATE BUFFERPOOL BPOIDMTEMPPOOL SIZE 500 PAGESIZE 32K;

CREATE TEMPORARY TABLESPACE TEMPSPACE2 pagesize 32k
       MANAGED BY AUTOMATIC STORAGE
       BUFFERPOOL BPOIDMTEMPPOOL;

CREATE SCHEMA SOPENIDM;

-- -----------------------------------------------------
-- Table openidm.objecttypes
-- -----------------------------------------------------
CREATE TABLESPACE SOIDM00 MANAGED BY AUTOMATIC STORAGE;

CREATE TABLE SOPENIDM.OBJECTTYPES (
    ID                         INTEGER GENERATED BY DEFAULT AS IDENTITY ( CYCLE ),
    OBJECTTYPE                 VARCHAR(255)   NOT NULL,
    PRIMARY KEY (ID) )
IN DOPENIDM.SOIDM00;
COMMENT ON TABLE SOPENIDM.OBJECTTYPES IS 'OPENIDM - Dictionary table for object types';
CREATE UNIQUE INDEX SOPENIDM.IDX_OBJECTTYPES_OBJECTTYPE ON SOPENIDM.OBJECTTYPES (OBJECTTYPE ASC);


-- -----------------------------------------------------
-- Table openidm.genericobjects
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM01 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.GENERICOBJECTS (
    id                         INTEGER GENERATED BY DEFAULT AS IDENTITY ( CYCLE ),
    objecttypes_id             INTEGER        NOT NULL,
    objectid                   VARCHAR(255)   NOT NULL,
    rev                        VARCHAR(38)    NOT NULL,
    fullobject                 CLOB(2M),
    PRIMARY KEY (ID),
    CONSTRAINT FK_GENERICOBJECTS_OBJECTTYPES
        FOREIGN KEY (OBJECTTYPES_ID ) REFERENCES SOPENIDM.OBJECTTYPES (ID ) ON DELETE CASCADE) IN DOPENIDM.SOIDM01;
COMMENT ON TABLE SOPENIDM.GENERICOBJECTS IS 'OPENIDM - Generic table For Any Kind Of Objects';
CREATE INDEX SOPENIDM.FK_GENERICOBJECTS_OBJECTTYPES ON SOPENIDM.GENERICOBJECTS (OBJECTTYPES_ID ASC);
CREATE UNIQUE INDEX SOPENIDM.IDX_GENERICOBJECTS_OBJECT ON SOPENIDM.GENERICOBJECTS (OBJECTID ASC, OBJECTTYPES_ID ASC);

-- -----------------------------------------------------
-- Table openidm.genericobjectproperties
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM02 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.GENERICOBJECTPROPERTIES (
    genericobjects_id          INTEGER        NOT NULL,
    propkey                    VARCHAR(255)   NOT NULL,
    proptype                   VARCHAR(255),
    propvalue                  VARCHAR(2000),
    PRIMARY KEY (genericobjects_id, propkey),
    CONSTRAINT FK_GENERICOBJECTPROPERTIES_GENERICOBJECTS
        FOREIGN KEY (GENERICOBJECTS_ID ) REFERENCES SOPENIDM.GENERICOBJECTS (ID)
        ON DELETE CASCADE
) IN DOPENIDM.SOIDM02;
COMMENT ON TABLE SOPENIDM.GENERICOBJECTPROPERTIES IS 'OPENIDM - Properties of Generic Objects';
CREATE INDEX SOPENIDM.IDX_GENERICOBJECTPROPERTIES_GENERICOBJECTS ON SOPENIDM.GENERICOBJECTPROPERTIES (GENERICOBJECTS_ID ASC);
CREATE INDEX SOPENIDM.IDX_GENERICOBJECTPROPERTIES_PROPKEY ON SOPENIDM.GENERICOBJECTPROPERTIES (PROPKEY ASC);
CREATE INDEX SOPENIDM.IDX_GENERICOBJECTPROPERTIES_PROPVALUE ON SOPENIDM.GENERICOBJECTPROPERTIES (PROPVALUE ASC);

-- -----------------------------------------------------
-- Table openidm.managedobjects
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM03 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.MANAGEDOBJECTS (
    id                         INTEGER GENERATED BY DEFAULT AS IDENTITY ( CYCLE ),
    objecttypes_id             INTEGER        NOT NULL,
    objectid                   VARCHAR(255)   NOT NULL,
    rev                        VARCHAR(38)    NOT NULL,
    fullobject                 CLOB(2M),
    PRIMARY KEY (ID),
    CONSTRAINT FK_MANAGEDOBJECTS_OBJECTTYPES
        FOREIGN KEY (OBJECTTYPES_ID ) REFERENCES SOPENIDM.OBJECTTYPES (ID )
        ON DELETE CASCADE
) IN DOPENIDM.SOIDM03;
COMMENT ON TABLE SOPENIDM.MANAGEDOBJECTS IS 'OPENIDM - Generic Table For Managed Objects';
CREATE UNIQUE INDEX SOPENIDM.IDX_MANAGEDOBJECTS_OBJECT
    ON SOPENIDM.MANAGEDOBJECTS (objecttypes_id ASC, objectid ASC);
CREATE INDEX SOPENIDM.FK_MANAGEDOBJECTS_OBJECTTYPES ON SOPENIDM.MANAGEDOBJECTS (OBJECTTYPES_ID ASC);

-- -----------------------------------------------------
-- Table openidm.managedobjectproperties
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM04 MANAGED BY AUTOMATIC STORAGE ;
CREATE TABLE SOPENIDM.MANAGEDOBJECTPROPERTIES (
    MANAGEDOBJECTS_ID          INTEGER        NOT NULL,
    PROPKEY                    VARCHAR(255)   NOT NULL,
    PROPTYPE                   VARCHAR(255),
    PROPVALUE                  VARCHAR(2000),
    PRIMARY KEY (MANAGEDOBJECTS_ID, PROPKEY),
    CONSTRAINT FK_MANAGEDOBJECTPROPERTIES_MANAGEDOBJECTS
        FOREIGN KEY (MANAGEDOBJECTS_ID )
        REFERENCES SOPENIDM.MANAGEDOBJECTS (ID )
        ON DELETE CASCADE
) IN DOPENIDM.SOIDM04;
COMMENT ON TABLE SOPENIDM.MANAGEDOBJECTPROPERTIES IS 'OPENIDM - Properties of Managed Objects';
CREATE INDEX SOPENIDM.IDX_MANAGEDOBJECTPROPERTIES_MANAGEDOBJECTS ON SOPENIDM.MANAGEDOBJECTPROPERTIES (MANAGEDOBJECTS_ID ASC);
CREATE INDEX SOPENIDM.IDX_MANAGEDOBJECTPROPERTIES_PROPKEY ON SOPENIDM.MANAGEDOBJECTPROPERTIES (PROPKEY ASC);
CREATE INDEX SOPENIDM.IDX_MANAGEDOBJECTPROPERTIES_PROPVALUE ON SOPENIDM.MANAGEDOBJECTPROPERTIES (PROPVALUE ASC);

-- -----------------------------------------------------
-- Table openidm.configobjects
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM05 MANAGED BY AUTOMATIC STORAGE ;
CREATE TABLE SOPENIDM.CONFIGOBJECTS (
    id                         INTEGER GENERATED BY DEFAULT AS IDENTITY ( CYCLE ),
    objecttypes_id             INTEGER        NOT NULL,
    objectid                   VARCHAR(255)   NOT NULL,
    rev                        VARCHAR(38)    NOT NULL,
    fullobject                 CLOB(2M),
    PRIMARY KEY (ID),
    CONSTRAINT FK_CONFIGOBJECTS_OBJECTTYPES
        FOREIGN KEY (OBJECTTYPES_ID )
        REFERENCES SOPENIDM.OBJECTTYPES (ID )
        ON DELETE CASCADE
) IN DOPENIDM.SOIDM05;
COMMENT ON TABLE SOPENIDM.CONFIGOBJECTS IS 'OPENIDM - Generic Table For Config Objects';
CREATE INDEX SOPENIDM.FK_CONFIGOBJECTS_OBJECTTYPES ON SOPENIDM.CONFIGOBJECTS (OBJECTTYPES_ID ASC);
CREATE UNIQUE INDEX SOPENIDM.IDX_CONFIGOBJECTS_OBJECT ON SOPENIDM.CONFIGOBJECTS (OBJECTID ASC, OBJECTTYPES_ID ASC);

-- -----------------------------------------------------
-- Table openidm.configobjectproperties
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM06 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.CONFIGOBJECTPROPERTIES (
    CONFIGOBJECTS_ID           INTEGER        NOT NULL,
    PROPKEY                    VARCHAR(255)   NOT NULL,
    PROPTYPE                   VARCHAR(255),
    PROPVALUE                  VARCHAR(2000),
    PRIMARY KEY (CONFIGOBJECTS_ID, PROPKEY),
    CONSTRAINT FK_CONFIGOBJECTPROPERTIES_CONFIGOBJECTS
        FOREIGN KEY (CONFIGOBJECTS_ID )
        REFERENCES SOPENIDM.CONFIGOBJECTS (ID )
        ON DELETE CASCADE
) IN DOPENIDM.SOIDM06;
COMMENT ON TABLE SOPENIDM.CONFIGOBJECTPROPERTIES IS 'OPENIDM - Properties of Config Objects';
CREATE INDEX SOPENIDM.IDX_CONFIGOBJECTPROPERTIES_CONFIGOBJECTS ON SOPENIDM.CONFIGOBJECTPROPERTIES (CONFIGOBJECTS_ID ASC);
CREATE INDEX SOPENIDM.IDX_CONFIGOBJECTPROPERTIES_PROPKEY ON SOPENIDM.CONFIGOBJECTPROPERTIES (PROPKEY ASC);
CREATE INDEX SOPENIDM.IDX_CONFIGOBJECTPROPERTIES_PROPVALUE ON SOPENIDM.CONFIGOBJECTPROPERTIES (PROPVALUE ASC);

-- -----------------------------------------------------
-- Table openidm.notificationobjects
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM29 MANAGED BY AUTOMATIC STORAGE ;
CREATE TABLE SOPENIDM.NOTIFICATIONOBJECTS (
    id                         INTEGER GENERATED BY DEFAULT AS IDENTITY ( CYCLE ),
    objecttypes_id             INTEGER        NOT NULL,
    objectid                   VARCHAR(255)   NOT NULL,
    rev                        VARCHAR(38)    NOT NULL,
    fullobject                 CLOB(2M),
    PRIMARY KEY (ID),
    CONSTRAINT FK_NOTIFICATIONOBJECTS_OBJECTTYPES
        FOREIGN KEY (OBJECTTYPES_ID )
        REFERENCES SOPENIDM.OBJECTTYPES (ID )
        ON DELETE CASCADE
) IN DOPENIDM.SOIDM29;
COMMENT ON TABLE SOPENIDM.NOTIFICATIONOBJECTS IS 'OPENIDM - Generic Table For Notification Objects';
CREATE INDEX SOPENIDM.FK_NOTIFICATIONOBJECTS_OBJECTTYPES ON SOPENIDM.NOTIFICATIONOBJECTS (OBJECTTYPES_ID ASC);
CREATE UNIQUE INDEX SOPENIDM.IDX_NOTIFICATIONOBJECTS_OBJECT ON SOPENIDM.NOTIFICATIONOBJECTS (OBJECTID ASC, OBJECTTYPES_ID ASC);

-- -----------------------------------------------------
-- Table openidm.notificationobjectproperties
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM30 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.NOTIFICATIONOBJECTPROPERTIES (
    NOTIFICATIONOBJECTS_ID           INTEGER        NOT NULL,
    PROPKEY                    VARCHAR(255)   NOT NULL,
    PROPTYPE                   VARCHAR(255),
    PROPVALUE                  VARCHAR(2000),
    PRIMARY KEY (NOTIFICATIONOBJECTS_ID, PROPKEY),
    CONSTRAINT FK_NOTIFICATIONOBJECTPROPERTIES_NOTIFICATIONOBJECTS
        FOREIGN KEY (NOTIFICATIONOBJECTS_ID )
        REFERENCES SOPENIDM.NOTIFICATIONOBJECTS (ID )
        ON DELETE CASCADE
) IN DOPENIDM.SOIDM30;
COMMENT ON TABLE SOPENIDM.NOTIFICATIONOBJECTPROPERTIES IS 'OPENIDM - Properties of Notification Objects';
CREATE INDEX SOPENIDM.IDX_NOTIFICATIONOBJECTPROPERTIES_NOTIFICATIONOBJECTS ON SOPENIDM.NOTIFICATIONOBJECTPROPERTIES (NOTIFICATIONOBJECTS_ID ASC);
CREATE INDEX SOPENIDM.IDX_NOTIFICATIONOBJECTPROPERTIES_PROPKEY ON SOPENIDM.NOTIFICATIONOBJECTPROPERTIES (PROPKEY ASC);
CREATE INDEX SOPENIDM.IDX_NOTIFICATIONOBJECTPROPERTIES_PROPVALUE ON SOPENIDM.NOTIFICATIONOBJECTPROPERTIES (PROPVALUE ASC);

-- -----------------------------------------------------
-- Table openidm.relationships
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM22 MANAGED BY AUTOMATIC STORAGE ;
CREATE TABLE SOPENIDM.RELATIONSHIPS (
    id                         INTEGER GENERATED BY DEFAULT AS IDENTITY ( CYCLE ),
    objecttypes_id             INTEGER        NOT NULL,
    objectid                   VARCHAR(255)   NOT NULL,
    rev                        VARCHAR(38)    NOT NULL,
    fullobject                 CLOB(2M),
    firstresourcecollection   VARCHAR(255),
    firstresourceid          VARCHAR(56),
    firstpropertyname        VARCHAR(100),
    secondresourcecollection  VARCHAR(255),
    secondresourceid         VARCHAR(56),
    secondpropertyname       VARCHAR(100),
    PRIMARY KEY (id),
    CONSTRAINT fk_relationships_objecttypes
        FOREIGN KEY (objecttypes_id)
        REFERENCES SOPENIDM.OBJECTTYPES (id)
        ON DELETE CASCADE
) IN DOPENIDM.SOIDM22;
COMMENT ON TABLE SOPENIDM.RELATIONSHIPS IS 'OPENIDM - Generic Table For Relationships';
CREATE INDEX SOPENIDM.IDX_RELATIONSHIPS_FIRST_OBJECT ON SOPENIDM.RELATIONSHIPS (firstresourcecollection ASC, firstresourceid ASC, firstpropertyname ASC);
CREATE INDEX SOPENIDM.IDX_RELATIONSHIPS_SECOND_OBJECT ON SOPENIDM.RELATIONSHIPS (secondresourcecollection ASC, secondresourceid ASC, secondpropertyname ASC);
CREATE INDEX SOPENIDM.IDX_RELATIONSHIPS_ORIGINFIRST ON SOPENIDM.RELATIONSHIPS (firstresourceid ASC, firstresourcecollection ASC, firstpropertyname ASC, secondresourceid ASC, secondresourcecollection ASC);
CREATE INDEX SOPENIDM.IDX_RELATIONSHIPS_ORIGINSECOND ON SOPENIDM.RELATIONSHIPS (secondresourceid ASC, secondresourcecollection ASC, secondpropertyname ASC, firstresourceid ASC, firstresourcecollection ASC);
CREATE UNIQUE INDEX SOPENIDM.IDX_RELATIONSHIPS_OBJECT ON SOPENIDM.RELATIONSHIPS (objectid ASC);

-- -----------------------------------------------------
-- Table openidm.relationshiproperties
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM23 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.RELATIONSHIPPROPERTIES (
    relationships_id           INTEGER        NOT NULL,
    propkey                    VARCHAR(255)   NOT NULL,
    proptype                   VARCHAR(255),
    propvalue                  VARCHAR(2000),
    PRIMARY KEY (relationships_id, propkey),
    CONSTRAINT fk_relationshipproperties_relationships
        FOREIGN KEY (relationships_id)
        REFERENCES SOPENIDM.RELATIONSHIPS (id)
        ON DELETE CASCADE
) IN DOPENIDM.SOIDM23;
COMMENT ON TABLE SOPENIDM.RELATIONSHIPPROPERTIES IS 'OPENIDM - Properties of Relationships';
CREATE INDEX SOPENIDM.IDX_RELATIONSHIPPROPERTIES_RELATIONSHIPS ON SOPENIDM.RELATIONSHIPPROPERTIES (RELATIONSHIPS_ID ASC);
CREATE INDEX SOPENIDM.IDX_RELATIONSHIPPROPERTIES_PROPKEY ON SOPENIDM.RELATIONSHIPPROPERTIES (PROPKEY ASC);
CREATE INDEX SOPENIDM.IDX_RELATIONSHIPPROPERTIES_PROPVALUE ON SOPENIDM.RELATIONSHIPPROPERTIES (PROPVALUE ASC);

-- -----------------------------------------------------
-- Table openidm.links
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM07 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.LINKS (
    objectid                   VARCHAR(38)    NOT NULL,
    rev                        VARCHAR(38)    NOT NULL,
    linktype                   VARCHAR(255)    NOT NULL,
    linkqualifier              VARCHAR(50)    NOT NULL,
    firstid                    VARCHAR(255)   NOT NULL,
    secondid                   VARCHAR(255)   NOT NULL,
    PRIMARY KEY (OBJECTID)
) IN DOPENIDM.SOIDM07;
COMMENT ON TABLE SOPENIDM.LINKS IS 'OPENIDM - Object Links For Mappings And Synchronization';

CREATE UNIQUE INDEX SOPENIDM.IDX_LINKS_FIRST ON SOPENIDM.LINKS (LINKTYPE ASC, LINKQUALIFIER ASC, FIRSTID ASC);
CREATE UNIQUE INDEX SOPENIDM.IDX_LINKS_SECOND ON SOPENIDM.LINKS (LINKTYPE ASC, LINKQUALIFIER ASC, SECONDID ASC);

-- -----------------------------------------------------
-- Table openidm.internaluser
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM14 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.INTERNALUSER (
    objectid                   VARCHAR(254)    NOT NULL,
    rev                        VARCHAR(38),
    pwd                        VARCHAR(510),
    PRIMARY KEY (objectid)
) IN DOPENIDM.SOIDM14;
COMMENT ON TABLE SOPENIDM.INTERNALUSER IS 'OPENIDM - Internal User';

-- -----------------------------------------------------
-- Table openidm.internalrole
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM26 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.INTERNALROLE (
    objectid                   VARCHAR(254)    NOT NULL,
    rev                        VARCHAR(38),
    name                       VARCHAR(64),
    description                VARCHAR(1024),
    temporalConstraints        VARCHAR(1024),
    conditional                VARCHAR(1024),
    privs                      CLOB(2M),
    PRIMARY KEY (objectid)
) IN DOPENIDM.SOIDM26;
COMMENT ON TABLE SOPENIDM.INTERNALROLE IS 'OPENIDM - Internal Role';

-- -----------------------------------------------------
-- Table openidm.schedulerobjects
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM15 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.SCHEDULEROBJECTS (
    ID                         INTEGER GENERATED BY DEFAULT AS IDENTITY ( CYCLE ),
    OBJECTTYPES_ID             INTEGER        NOT NULL,
    OBJECTID                   VARCHAR(255)   NOT NULL,
    REV                        VARCHAR(38)    NOT NULL,
    FULLOBJECT                 CLOB(2M),
    PRIMARY KEY (ID),
    CONSTRAINT FK_SCHEDULEROBJECTS_OBJECTTYPES
        FOREIGN KEY (OBJECTTYPES_ID )
        REFERENCES SOPENIDM.OBJECTTYPES (ID )
        ON DELETE CASCADE
) IN DOPENIDM.SOIDM15;
COMMENT ON TABLE SOPENIDM.SCHEDULEROBJECTS IS 'OPENIDM - Generic table for scheduler objects';

CREATE INDEX SOPENIDM.FK_SCHEDULEROBJECTS_OBJECTTYPES ON SOPENIDM.SCHEDULEROBJECTS (OBJECTTYPES_ID ASC) ;
CREATE UNIQUE INDEX SOPENIDM.IDX_SCHEDULEROBJECTS_OBJECT ON SOPENIDM.SCHEDULEROBJECTS (OBJECTID ASC, OBJECTTYPES_ID ASC);

-- -----------------------------------------------------
-- Table openidm.schedulerobjectproperties
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM16 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.SCHEDULEROBJECTPROPERTIES (
    SCHEDULEROBJECTS_ID        INTEGER        NOT NULL,
    PROPKEY                    VARCHAR(255)   NOT NULL,
    PROPTYPE                   VARCHAR(255),
    PROPVALUE                  VARCHAR(2000),
    PRIMARY KEY (SCHEDULEROBJECTS_ID, PROPKEY),
    CONSTRAINT FK_SCHEDULEROBJECTPROPERTIES_SCHEDULEROBJECTS
        FOREIGN KEY (SCHEDULEROBJECTS_ID )
        REFERENCES SOPENIDM.SCHEDULEROBJECTS (ID )
        ON DELETE CASCADE
) IN DOPENIDM.SOIDM16;
COMMENT ON TABLE SOPENIDM.SCHEDULEROBJECTPROPERTIES IS 'OPENIDM - Properties of Generic Objects';
CREATE INDEX SOPENIDM.IDX_SCHEDULEROBJECTPROPERTIES_SCHEDULEROBJECTS ON SOPENIDM.SCHEDULEROBJECTPROPERTIES (SCHEDULEROBJECTS_ID ASC) ;
CREATE INDEX SOPENIDM.IDX_SCHEDULEROBJECTPROPERTIES_PROPKEY ON SOPENIDM.SCHEDULEROBJECTPROPERTIES (PROPKEY ASC) ;
CREATE INDEX SOPENIDM.IDX_SCHEDULEROBJECTPROPERTIES_PROPVALUE ON SOPENIDM.SCHEDULEROBJECTPROPERTIES (PROPVALUE ASC) ;

-- -----------------------------------------------------
-- Table openidm.uinotification
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM19 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.UINOTIFICATION (
    OBJECTID                   VARCHAR(38)    NOT NULL,
    REV                        VARCHAR(38)    NOT NULL,
    NOTIFICATIONTYPE           VARCHAR(255)   NOT NULL,
    CREATEDATE                 VARCHAR(38)   NOT NULL,
    MESSAGE                    CLOB(2M)       NOT NULL,
    REQUESTER                  VARCHAR(255)       NULL,
    RECEIVERID                 VARCHAR(255)    NOT NULL,
    REQUESTERID                VARCHAR(255)        NULL,
    NOTIFICATIONSUBTYPE        VARCHAR(255)       NULL,
    PRIMARY KEY (OBJECTID)
) IN DOPENIDM.SOIDM19;
COMMENT ON TABLE SOPENIDM.UINOTIFICATION IS 'OPENIDM - Generic table for ui notifications';
CREATE INDEX SOPENIDM.IDX_UINOTIFICATION_RECEIVERID ON SOPENIDM.UINOTIFICATION (RECEIVERID ASC);

-- -----------------------------------------------------
-- Table openidm.clusterobjects
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM17 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.CLUSTEROBJECTS (
    ID                         INTEGER GENERATED BY DEFAULT AS IDENTITY ( CYCLE ),
    OBJECTTYPES_ID             INTEGER        NOT NULL,
    OBJECTID                   VARCHAR(255)   NOT NULL,
    REV                        VARCHAR(38)    NOT NULL,
    FULLOBJECT                 CLOB(2M),
    PRIMARY KEY (ID),
    CONSTRAINT FK_CLUSTEROBJECTS_OBJECTTYPES
        FOREIGN KEY (OBJECTTYPES_ID )
        REFERENCES SOPENIDM.OBJECTTYPES (ID )
        ON DELETE CASCADE
) IN DOPENIDM.SOIDM17;
COMMENT ON TABLE SOPENIDM.CLUSTEROBJECTS IS 'OPENIDM - Generic table for cluster objects';
CREATE INDEX SOPENIDM.FK_CLUSTEROBJECTS_OBJECTTYPES ON SOPENIDM.CLUSTEROBJECTS (OBJECTTYPES_ID ASC);
CREATE UNIQUE INDEX SOPENIDM.IDX_CLUSTEROBJECTS_OBJECT ON SOPENIDM.CLUSTEROBJECTS (OBJECTID ASC, OBJECTTYPES_ID ASC);

-- -----------------------------------------------------
-- Table openidm.clusterobjectproperties
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM18 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.CLUSTEROBJECTPROPERTIES (
    CLUSTEROBJECTS_ID          INTEGER        NOT NULL,
    PROPKEY                    VARCHAR(255)   NOT NULL,
    PROPTYPE                   VARCHAR(255),
    PROPVALUE                  VARCHAR(2000),
    PRIMARY KEY (CLUSTEROBJECTS_ID, PROPKEY),
    CONSTRAINT FK_CLUSTEROBJECTPROPERTIES_CLUSTEROBJECTS
        FOREIGN KEY (CLUSTEROBJECTS_ID )
        REFERENCES SOPENIDM.CLUSTEROBJECTS (ID )
        ON DELETE CASCADE
) IN DOPENIDM.SOIDM18;
COMMENT ON TABLE SOPENIDM.CLUSTEROBJECTPROPERTIES IS 'OPENIDM - Properties of Generic Objects';
CREATE INDEX SOPENIDM.IDX_CLUSTEROBJECTPROPERTIES_CLUSTEROBJECTS ON SOPENIDM.CLUSTEROBJECTPROPERTIES (CLUSTEROBJECTS_ID ASC);
CREATE INDEX SOPENIDM.IDX_CLUSTEROBJECTPROPERTIES_PROPKEY ON SOPENIDM.CLUSTEROBJECTPROPERTIES (PROPKEY ASC);
CREATE INDEX SOPENIDM.IDX_CLUSTEROBJECTPROPERTIES_PROPVALUE ON SOPENIDM.CLUSTEROBJECTPROPERTIES (PROPVALUE ASC);

-- -----------------------------------------------------
-- Table openidm.clusteredrecontargetids
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM27 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.CLUSTEREDRECONTARGETIDS (
    objectid                   VARCHAR(38)    NOT NULL,
    rev                        VARCHAR(38)    NOT NULL,
    reconid                    VARCHAR(255)   NOT NULL,
    targetids                  CLOB(2G)   NOT NULL,
    PRIMARY KEY (OBJECTID)
) IN DOPENIDM.SOIDM27;
COMMENT ON TABLE SOPENIDM.CLUSTEREDRECONTARGETIDS IS 'OPENIDM - target ids reconciled during source recon';

CREATE INDEX SOPENIDM.IDX_CLUSTEREDRECONTARGETIDS_RECONID ON SOPENIDM.CLUSTEREDRECONTARGETIDS (RECONID ASC);

-- -----------------------------------------------------
-- Table openidm.updateobjects
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM24 MANAGED BY AUTOMATIC STORAGE;
CREATE  TABLE SOPENIDM.UPDATEOBJECTS (
    ID                        INTEGER GENERATED BY DEFAULT AS IDENTITY ( CYCLE ),
  OBJECTTYPES_ID             INTEGER        NOT NULL,
  OBJECTID                   VARCHAR(255)   NOT NULL,
  REV                        VARCHAR(38)    NOT NULL,
  FULLOBJECT                 CLOB(2M),
  PRIMARY KEY (ID),
  CONSTRAINT FK_UPDATEOBJECTS_OBJECTTYPES
  FOREIGN KEY (OBJECTTYPES_ID )
  REFERENCES SOPENIDM.OBJECTTYPES (ID )
  ON DELETE CASCADE
) IN DOPENIDM.SOIDM24;

-- -----------------------------------------------------
-- Table openidm.updateobjectproperties
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM25 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.UPDATEOBJECTPROPERTIES (
  UPDATEOBJECTS_ID           INTEGER        NOT NULL,
  PROPKEY                    VARCHAR(255)   NOT NULL,
  PROPTYPE                   VARCHAR(255),
  PROPVALUE                  VARCHAR(2000),
  PRIMARY KEY (UPDATEOBJECTS_ID, PROPKEY),
  CONSTRAINT FK_UPDATEOBJECTPROPERTIES_UPDATEOBJECTS
  FOREIGN KEY (UPDATEOBJECTS_ID )
  REFERENCES SOPENIDM.UPDATEOBJECTS (ID )
  ON DELETE CASCADE
) IN DOPENIDM.SOIDM25;
COMMENT ON TABLE SOPENIDM.UPDATEOBJECTPROPERTIES IS 'OPENIDM - Properties of Update Objects';
CREATE INDEX SOPENIDM.IDX_UPDATEOBJECTPROPERTIES_UPDATEOBJECTS ON SOPENIDM.UPDATEOBJECTPROPERTIES (UPDATEOBJECTS_ID ASC);
CREATE INDEX SOPENIDM.IDX_UPDATEOBJECTPROPERTIES_PROPKEY ON SOPENIDM.UPDATEOBJECTPROPERTIES (PROPKEY ASC);
CREATE INDEX SOPENIDM.IDX_UPDATEOBJECTPROPERTIES_PROPVALUE ON SOPENIDM.UPDATEOBJECTPROPERTIES (PROPVALUE ASC);

-- -----------------------------------------------------
-- Table openidm.syncqueue
-- -----------------------------------------------------
CREATE TABLESPACE SOIDM31 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.SYNCQUEUE (
    objectid                   VARCHAR(38)    NOT NULL,
    rev                        VARCHAR(38)    NOT NULL,
    syncAction                 VARCHAR(38)    NOT NULL,
    resourceCollection         VARCHAR(38)    NOT NULL,
    resourceId                 VARCHAR(255)   NOT NULL,
    mapping                    VARCHAR(255)   NOT NULL,
    objectRev                  VARCHAR(38)    NULL,
    oldObject                  CLOB(2M)       NULL,
    newObject                  CLOB(2M)       NULL,
    context                    CLOB(2M)       NOT NULL,
    state                      VARCHAR(38)    NOT NULL,
    nodeId                     VARCHAR(255)   NULL,
    createDate                 VARCHAR(255)   NOT NULL,
    PRIMARY KEY (objectid)
) IN DOPENIDM.SOIDM31;
COMMENT ON TABLE SOPENIDM.SYNCQUEUE IS 'OPENIDM - Explicit Table For Queued Synchronization Events';
CREATE INDEX SOPENIDM.IDX_SYNCQUEUE_MAPPING_STATE_CREATEDATE ON SOPENIDM.SYNCQUEUE (mapping ASC, state ASC, createDate ASC);

-- -----------------------------------------------------
-- Table openidm.locks
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM32 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.LOCKS (
    objectid                   VARCHAR(255)    NOT NULL,
    rev                        VARCHAR(38)    NOT NULL,
    nodeid                    VARCHAR(255),
    PRIMARY KEY (OBJECTID)
) IN DOPENIDM.SOIDM32;
COMMENT ON TABLE SOPENIDM.LOCKS IS 'OPENIDM - locks';

CREATE INDEX SOPENIDM.IDX_LOCKS_NODEID ON SOPENIDM.LOCKS (NODEID ASC);

-- -----------------------------------------------------
-- Table openidm.files
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM33 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.FILES (
    objectid                   VARCHAR(38)    NOT NULL,
    rev                        VARCHAR(38)    NOT NULL,
    content                    CLOB(2G)       NULL,
    PRIMARY KEY (OBJECTID)
) IN DOPENIDM.SOIDM33;
COMMENT ON TABLE SOPENIDM.FILES IS 'OPENIDM - files';

-- -----------------------------------------------------
-- Table openidm.metaobjects
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM34 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.METAOBJECTS (
    id                         INTEGER GENERATED BY DEFAULT AS IDENTITY ( CYCLE ),
    objecttypes_id             INTEGER        NOT NULL,
    objectid                   VARCHAR(255)   NOT NULL,
    rev                        VARCHAR(38)    NOT NULL,
    fullobject                 CLOB(2M),
    PRIMARY KEY (ID),
    CONSTRAINT FK_METAOBJECTS_OBJECTTYPES
        FOREIGN KEY (OBJECTTYPES_ID ) REFERENCES SOPENIDM.OBJECTTYPES (ID ) ON DELETE CASCADE) IN DOPENIDM.SOIDM34;
COMMENT ON TABLE SOPENIDM.METAOBJECTS IS 'OPENIDM - Generic table For Meta Objects';
CREATE INDEX SOPENIDM.FK_METAOBJECTS_OBJECTTYPES ON SOPENIDM.METAOBJECTS (OBJECTTYPES_ID ASC);
CREATE UNIQUE INDEX SOPENIDM.IDX_METAOBJECTS_OBJECT ON SOPENIDM.METAOBJECTS (OBJECTID ASC, OBJECTTYPES_ID ASC);

-- -----------------------------------------------------
-- Table openidm.metaobjectproperties
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM35 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.METAOBJECTPROPERTIES (
    metaobjects_id          INTEGER        NOT NULL,
    propkey                    VARCHAR(255)   NOT NULL,
    proptype                   VARCHAR(255),
    propvalue                  VARCHAR(2000),
    PRIMARY KEY (metaobjects_id, propkey),
    CONSTRAINT FK_METAOBJECTPROPERTIES_METAOBJECTS
        FOREIGN KEY (METAOBJECTS_ID ) REFERENCES SOPENIDM.METAOBJECTS (ID)
        ON DELETE CASCADE
) IN DOPENIDM.SOIDM35;
COMMENT ON TABLE SOPENIDM.METAOBJECTPROPERTIES IS 'OPENIDM - Properties of Meta Objects';
CREATE INDEX SOPENIDM.IDX_METAOBJECTPROPERTIES_METAOBJECTS ON SOPENIDM.METAOBJECTPROPERTIES (METAOBJECTS_ID ASC);
CREATE INDEX SOPENIDM.IDX_METAOBJECTPROPERTIES_PROPKEY ON SOPENIDM.METAOBJECTPROPERTIES (PROPKEY ASC);
CREATE INDEX SOPENIDM.IDX_METAOBJECTPROPERTIES_PROPVALUE ON SOPENIDM.METAOBJECTPROPERTIES (PROPVALUE ASC);

-- -----------------------------------------------------
-- Table openidm.reconassoc
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM36 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.RECONASSOC (
    objectid VARCHAR(255) NOT NULL,
    rev VARCHAR(38) NOT NULL,
    mapping VARCHAR(255) NOT NULL,
    sourceResourceCollection VARCHAR(255) NOT NULL,
    targetResourceCollection VARCHAR(255) NOT NULL,
    isAnalysis VARCHAR(5) NOT NULL,
    finishTime VARCHAR(38) NULL,
    PRIMARY KEY (objectid)
) IN DOPENIDM.SOIDM36;
COMMENT ON TABLE SOPENIDM.RECONASSOC IS 'OPENIDM - Table for reconciliation association header data';
CREATE INDEX SOPENIDM.IDX_RECONASSOC_MAPPING ON SOPENIDM.RECONASSOC (mapping ASC);
--no index on objectid because it is created automatically by db2 and thus complains upon initialization

-- -----------------------------------------------------
-- Table openidm.reconassocentry
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM37 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.RECONASSOCENTRY (
     objectid VARCHAR(38) NOT NULL,
     rev VARCHAR(38) NOT NULL,
     reconId VARCHAR(255) NOT NULL,
     situation VARCHAR(38) NULL,
     action VARCHAR(38) NULL,
     phase VARCHAR(38) NULL,
     linkQualifier VARCHAR(38) NOT NULL,
     sourceObjectId VARCHAR(255) NULL,
     targetObjectId VARCHAR(255) NULL,
     status VARCHAR(38) NOT NULL,
     exception CLOB(2M) NULL,
     message CLOB(2M) NULL,
     messagedetail CLOB(2M) NULL,
     ambiguousTargetObjectIds CLOB(2M) NULL,
     PRIMARY KEY (objectid),
     CONSTRAINT FK_RECONASSOCENTRY_RECONASSOC_ID
       FOREIGN KEY (reconId) REFERENCES SOPENIDM.RECONASSOC (objectid) ON DELETE CASCADE
) IN DOPENIDM.SOIDM37;
COMMENT ON TABLE SOPENIDM.RECONASSOCENTRY IS 'OPENIDM - Table for reconciliation association entry data';
CREATE INDEX SOPENIDM.IDX_RECONASSOCENTRY_SITUATION ON SOPENIDM.RECONASSOCENTRY (situation ASC);

-- -----------------------------------------------------
-- View openidm.reconassocentryview
-- -----------------------------------------------------
CREATE VIEW SOPENIDM.RECONASSOCENTRYVIEW AS
  SELECT
    assoc.objectid as reconId,
    assoc.mapping as mapping,
    assoc.sourceResourceCollection as sourceResourceCollection,
    assoc.targetResourceCollection as targetResourceCollection,
    entry.objectid AS objectid,
    entry.rev AS rev,
    entry.action AS action,
    entry.situation AS situation,
    entry.linkQualifier as linkQualifier,
    entry.sourceObjectId as sourceObjectId,
    entry.targetObjectId as targetObjectId,
    entry.status as status,
    entry.exception as exception,
    entry.message as message,
    entry.messagedetail as messagedetail,
    entry.ambiguousTargetObjectIds as ambiguousTargetObjectIds
  FROM SOPENIDM.RECONASSOCENTRY entry, SOPENIDM.RECONASSOC assoc
  WHERE assoc.objectid = entry.reconid;

CREATE TABLESPACE SOIDM38 MANAGED BY AUTOMATIC STORAGE ;

CREATE TABLE SOPENIDM.relationshipresources (
     id VARCHAR(255) NOT NULL,
     originresourcecollection VARCHAR(255) NOT NULL,
     originproperty VARCHAR(100) NOT NULL,
     refresourcecollection VARCHAR(255) NOT NULL,
     originfirst SMALLINT NOT NULL,
     reverseproperty VARCHAR(100),
     PRIMARY KEY (originresourcecollection, originproperty, refresourcecollection, originfirst)
) IN DOPENIDM.SOIDM38;

-- -----------------------------------------------------
-- Table openidm.importobjects
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM39 MANAGED BY AUTOMATIC STORAGE;
CREATE  TABLE SOPENIDM.IMPORTOBJECTS (
    ID                        INTEGER GENERATED BY DEFAULT AS IDENTITY ( CYCLE ),
  OBJECTTYPES_ID             INTEGER        NOT NULL,
  OBJECTID                   VARCHAR(255)   NOT NULL,
  REV                        VARCHAR(38)    NOT NULL,
  FULLOBJECT                 CLOB(2M),
  PRIMARY KEY (ID),
  CONSTRAINT FK_IMPORTOBJECTS_OBJECTTYPES
  FOREIGN KEY (OBJECTTYPES_ID )
  REFERENCES SOPENIDM.OBJECTTYPES (ID )
  ON DELETE CASCADE
) IN DOPENIDM.SOIDM39;

-- -----------------------------------------------------
-- Table openidm.importobjectproperties
-- -----------------------------------------------------

CREATE TABLESPACE SOIDM40 MANAGED BY AUTOMATIC STORAGE;
CREATE TABLE SOPENIDM.IMPORTOBJECTPROPERTIES (
  IMPORTOBJECTS_ID           INTEGER        NOT NULL,
  PROPKEY                    VARCHAR(255)   NOT NULL,
  PROPTYPE                   VARCHAR(255),
  PROPVALUE                  VARCHAR(2000),
  PRIMARY KEY (IMPORTOBJECTS_ID, PROPKEY),
  CONSTRAINT FK_IMPORTOBJECTPROPERTIES_IMPORTOBJECTS
  FOREIGN KEY (IMPORTOBJECTS_ID )
  REFERENCES SOPENIDM.IMPORTOBJECTS (ID )
  ON DELETE CASCADE
) IN DOPENIDM.SOIDM40;
COMMENT ON TABLE SOPENIDM.IMPORTOBJECTPROPERTIES IS 'OPENIDM - Properties of Import Objects';
CREATE INDEX SOPENIDM.IDX_IMPORTOBJECTPROPERTIES_IMPORTOBJECTS ON SOPENIDM.IMPORTOBJECTPROPERTIES (IMPORTOBJECTS_ID ASC);
CREATE INDEX SOPENIDM.IDX_IMPORTOBJECTPROPERTIES_PROPKEY ON SOPENIDM.IMPORTOBJECTPROPERTIES (PROPKEY ASC);
CREATE INDEX SOPENIDM.IDX_IMPORTOBJECTPROPERTIES_PROPVALUE ON SOPENIDM.IMPORTOBJECTPROPERTIES (PROPVALUE ASC);
