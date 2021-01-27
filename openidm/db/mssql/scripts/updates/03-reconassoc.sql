-- -----------------------------------------------------
-- Table `openidm`.`reconassoc`
-- -----------------------------------------------------
IF NOT EXISTS (SELECT name FROM sysobjects where name='reconassoc' AND xtype='U')
BEGIN
  CREATE TABLE [openidm].[reconassoc]
(
  objectid NVARCHAR(255) NOT NULL,
  rev NVARCHAR(38)  NOT NULL,
  mapping NVARCHAR(255) NOT NULL,
  sourceResourceCollection NVARCHAR(255) NOT NULL,
  targetResourceCollection NVARCHAR(255) NOT NULL,
  isAnalysis NVARCHAR(5) NOT NULL,
  finishTime NVARCHAR(38) NULL,
  PRIMARY KEY CLUSTERED (objectid)
);
  CREATE INDEX idx_reconassoc_mapping ON [openidm].[reconassoc] (mapping ASC);
END

-- -----------------------------------------------------
-- Table `openidm`.`reconassocentry`
-- -----------------------------------------------------
IF NOT EXISTS (SELECT name FROM sysobjects where name='reconassocentry' AND xtype='U')
BEGIN
  CREATE TABLE [openidm].[reconassocentry] (
     objectid NVARCHAR(38) NOT NULL ,
     rev NVARCHAR(38) NOT NULL ,
     reconId NVARCHAR(255) NOT NULL ,
     situation NVARCHAR(38) NULL ,
     action NVARCHAR(38) NULL ,
     phase NVARCHAR(38) NULL ,
     linkQualifier NVARCHAR(38) NOT NULL ,
     sourceObjectId NVARCHAR(255) NULL ,
     targetObjectId NVARCHAR(255) NULL ,
     status NVARCHAR(38) NOT NULL ,
     exception NVARCHAR(MAX) NULL ,
     message NVARCHAR(MAX) NULL ,
     messagedetail NVARCHAR(MAX) NULL ,
     ambiguousTargetObjectIds NVARCHAR(MAX) NULL ,
     PRIMARY KEY CLUSTERED (objectid) ,
     CONSTRAINT fk_reconassocentry_reconassoc_id
       FOREIGN KEY (reconId)
       REFERENCES [openidm].[reconassoc] (objectid)
       ON DELETE CASCADE
       ON UPDATE NO ACTION
);
  CREATE INDEX idx_reconassocentry_situation ON [openidm].[reconassocentry] (situation ASC);
END
GO

-- -----------------------------------------------------
-- View `openidm`.`reconassocentryview`
-- GO will dispatch all of the previous table creation commands - view creation must be in its own batch, so
-- GO precedes view creation. And also, view creation cannot exist in a procedure - i.e. bracketed by
-- BEGIN and END as in table creation - so the view must be dropped if it exists, which is a slightly different
-- semantic than for table creation.
-- -----------------------------------------------------
IF EXISTS (SELECT name FROM sysobjects where name='reconassocentryview' AND xtype='V')
DROP VIEW [openidm].[reconassocentryview]
  GO

CREATE VIEW [openidm].[reconassocentryview] AS
SELECT
  assoc.objectid AS reconId,
  assoc.mapping AS mapping,
  assoc.sourceResourceCollection AS sourceResourceCollection,
  assoc.targetResourceCollection AS targetResourceCollection,
  entry.objectid AS objectid,
  entry.rev AS rev,
  entry.action AS action,
  entry.situation AS situation,
  entry.linkQualifier AS linkQualifier,
  entry.sourceObjectId AS sourceObjectId,
  entry.targetObjectId AS targetObjectId,
  entry.status AS status,
  entry.exception AS exception,
  entry.message AS message,
  entry.messagedetail AS messagedetail,
  entry.ambiguousTargetObjectIds AS ambiguousTargetObjectIds
FROM [openidm].[reconassocentry] entry, [openidm].[reconassoc] assoc
WHERE assoc.objectid = entry.reconId ;
GO
