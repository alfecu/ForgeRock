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
