-- DROP TABLE reconassoc CASCADE CONSTRAINTS;

PROMPT Creating Table reconassoc ...
CREATE TABLE reconassoc
(
    objectid VARCHAR2(255) NOT NULL,
    rev VARCHAR2(38) NOT NULL,
    mapping VARCHAR2(255) NOT NULL,
    sourceResourceCollection VARCHAR2(255) NOT NULL,
    targetResourceCollection VARCHAR2(255) NOT NULL,
    isAnalysis VARCHAR2(5) NOT NULL,
    finishTime VARCHAR2(38) NULL
);
PROMPT Creating Primary Key Contraint PRIMARY_31 on table reconassoc ...
ALTER TABLE reconassoc
  ADD CONSTRAINT PRIMARY_31 PRIMARY KEY
    (
     objectid
    )
    ENABLE
;
PROMPT Creating Index idx_reconassoc_mapping on reconassoc...
CREATE INDEX idx_reconassoc_mapping ON reconassoc
  (
   mapping
  )
;

-- DROP TABLE reconassocentry CASCADE CONSTRAINTS;

PROMPT Creating Table reconassocentry ...
CREATE TABLE reconassocentry
(
     objectid VARCHAR2(38) NOT NULL,
     rev VARCHAR2(38) NOT NULL,
     reconId VARCHAR2(255) NOT NULL,
     situation VARCHAR2(38) NULL,
     action VARCHAR2(38) NULL,
     phase VARCHAR2(38) NULL,
     linkQualifier VARCHAR2(38) NOT NULL,
     sourceObjectId VARCHAR2(255) NULL,
     targetObjectId VARCHAR2(255) NULL,
     status VARCHAR2(38) NOT NULL,
     exception CLOB NULL,
     message CLOB NULL,
     messagedetail CLOB NULL,
     ambiguousTargetObjectIds CLOB NULL
);
PROMPT Creating Primary Key Contraint PRIMARY_32 on table reconassocentry ...
ALTER TABLE reconassocentry
  ADD CONSTRAINT PRIMARY_32 PRIMARY KEY
    (
     objectid
    )
  ENABLE
;
ALTER TABLE reconassocentry
  ADD CONSTRAINT fk_rnasscntry_rnassc_id FOREIGN KEY
    (
     reconId
      )
    REFERENCES reconassoc
      (
       objectid
        )
      ON DELETE CASCADE
      ENABLE
;

PROMPT Creating Index idx_reconassocentry_situation on reconassocentry...
CREATE INDEX idx_reconassocentry_situation ON reconassocentry
  (
   situation
  )
;

-- -----------------------------------------------------
-- View openidm.reconassocentryview
-- -----------------------------------------------------

CREATE VIEW reconassocentryview AS
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
 FROM reconassocentry entry, reconassoc assoc
 WHERE assoc.objectid = entry.reconid
;
