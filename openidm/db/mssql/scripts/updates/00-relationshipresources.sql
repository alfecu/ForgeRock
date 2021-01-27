-- Can be ran while 6.x software is running, or not, prior to software upgrade so that the `relationshipresources` table
-- can be created and monitor inserts into the relationship table.

-- -----------------------------------------------------
-- Table `openidm`.`relationshipresources`
-- -----------------------------------------------------
IF NOT EXISTS (SELECT name FROM sysobjects where name='relationshipresources' AND xtype='U')
BEGIN
CREATE TABLE [openidm].[relationshipresources] (
     id NVARCHAR(255) NOT NULL,
     originresourcecollection NVARCHAR(120) NOT NULL,
     originproperty NVARCHAR(90) NOT NULL,
     refresourcecollection NVARCHAR(120) NOT NULL,
     originfirst TINYINT NOT NULL,
     reverseproperty NVARCHAR(90),
     PRIMARY KEY CLUSTERED (originresourcecollection, originproperty, refresourcecollection, originfirst)
);
END
GO

CREATE INDEX idx_relationships_originFirst ON [openidm].[relationships] (firstresourceid ASC, firstresourcecollection ASC, firstpropertyname ASC, secondresourceid ASC, secondresourcecollection ASC);
CREATE INDEX idx_relationships_originSecond ON [openidm].[relationships] (secondresourceid ASC, secondresourcecollection ASC, secondpropertyname ASC, firstresourceid ASC, firstresourcecollection ASC);
GO

-- -----------------------------------------------------
-- Temporary SEQUENCE `relationshipresources_id_seq` for incrementing the id column value
-- -----------------------------------------------------
CREATE SEQUENCE relationshipresources_id_seq START WITH 1 INCREMENT BY 1 ;
GO

-- -----------------------------------------------------
-- Temporary TRIGGER `openidm`.`trig_relationshipresources` for populating the id column value
-- -----------------------------------------------------
CREATE TRIGGER [openidm].[trig_relationshipresources]
ON [openidm].[relationshipresources]
INSTEAD OF INSERT
AS
BEGIN
SET NOCOUNT ON;
INSERT INTO openidm.relationshipresources (
        id,
        originresourcecollection,
        originproperty,
        refresourcecollection,
        originfirst,
        reverseproperty)
SELECT
        CAST(NEXT VALUE FOR relationshipresources_id_seq as VARCHAR(255)),
        i.originresourcecollection,
        i.originproperty,
        i.refresourcecollection,
        i.originfirst,
        i.reverseproperty
FROM INSERTED as i
END
GO

-- -----------------------------------------------------
-- Populate `openidm`.`relationshipresources` using data from `openidm`.`relationships`
-- -----------------------------------------------------
INSERT
INTO
	openidm.relationshipresources (
	    originresourcecollection,
	    originproperty,
	    refresourcecollection,
	    originfirst,
	    reverseproperty
	)
SELECT
	DISTINCT
	firstresourcecollection,
	firstpropertyname,
	secondresourcecollection,
	1,
	secondpropertyname
FROM
	openidm.relationships r
WHERE
	r.firstpropertyname IS NOT NULL
	AND NOT EXISTS (
	SELECT
		1
	FROM
		openidm.relationshipresources rr
	WHERE
		rr.originresourcecollection = r.firstresourcecollection AND
		rr.originproperty = r.firstpropertyname AND
		rr.refresourcecollection = r.secondresourcecollection AND
		rr.originfirst = 1)
UNION ALL
SELECT
	DISTINCT
	secondresourcecollection,
	secondpropertyname,
	firstresourcecollection,
	0,
	firstpropertyname
FROM
	openidm.relationships r
WHERE
	r.secondpropertyname IS NOT NULL
	AND NOT EXISTS (
	SELECT
		1
	FROM
		openidm.relationshipresources rr
	WHERE
		rr.originresourcecollection = r.secondresourcecollection AND
		rr.originproperty = r.secondpropertyname AND
		rr.refresourcecollection = r.firstresourcecollection AND
		rr.originfirst = 0);
GO

-- -----------------------------------------------------
-- Drop temporary SEQUENCE and TRIGGER
-- -----------------------------------------------------
DROP SEQUENCE relationshipresources_id_seq;
DROP TRIGGER [openidm].[trig_relationshipresources];
GO