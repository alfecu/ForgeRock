-- -----------------------------------------------------
-- Table openidm.reconassoc
-- -----------------------------------------------------

CREATE TABLE openidm.reconassoc (
  objectid VARCHAR(255) NOT NULL,
  rev VARCHAR(38) NOT NULL,
  mapping VARCHAR(255) NOT NULL,
  sourceResourceCollection VARCHAR(255) NOT NULL,
  targetResourceCollection VARCHAR(255) NOT NULL,
  isAnalysis VARCHAR(5) NOT NULL,
  finishTime VARCHAR(38) NULL,
  PRIMARY KEY (objectid)
);
CREATE INDEX idx_reconassoc_mapping ON openidm.reconassoc (mapping);
CREATE INDEX idx_reconassoc_reconId ON openidm.reconassoc (objectid);

-- -----------------------------------------------------
-- Table openidm.reconassocentry
-- -----------------------------------------------------

CREATE TABLE openidm.reconassocentry (
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
   exception TEXT NULL,
   message TEXT NULL,
   messagedetail TEXT NULL,
   ambiguousTargetObjectIds TEXT NULL,
   PRIMARY KEY (objectid),
   CONSTRAINT fk_reconassocentry_reconassoc_id FOREIGN KEY (reconId) REFERENCES openidm.reconassoc (objectid) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE INDEX idx_reconassocentry_situation ON openidm.reconassocentry (situation);

-- -----------------------------------------------------
-- View openidm.reconassocentryview
-- -----------------------------------------------------
CREATE VIEW openidm.reconassocentryview AS
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
  FROM openidm.reconassocentry entry, openidm.reconassoc assoc
  WHERE assoc.objectid = entry.reconid;
