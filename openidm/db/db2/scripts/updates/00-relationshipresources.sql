-- To be ran while 6.x software is running, prior to software upgrade so that the `relationshipresources` table
-- can be created and monitor inserts into the relationship table.

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

CREATE INDEX SOPENIDM.IDX_RELATIONSHIPS_ORIGINFIRST ON SOPENIDM.RELATIONSHIPS (firstresourceid ASC, firstresourcecollection ASC, firstpropertyname ASC, secondresourceid ASC, secondresourcecollection ASC);
CREATE INDEX SOPENIDM.IDX_RELATIONSHIPS_ORIGINSECOND ON SOPENIDM.RELATIONSHIPS (secondresourceid ASC, secondresourcecollection ASC, secondpropertyname ASC, firstresourceid ASC, firstresourcecollection ASC);

-- -----------------------------------------------------
-- Temporary SEQUENCE `relationshipresources_id_seq` for incrementing the id column value
-- -----------------------------------------------------
CREATE SEQUENCE relationshipresources_id_seq AS INT START WITH 1 INCREMENT BY 1;

-- -----------------------------------------------------
-- Temporary TRIGGER `sopenidm`.`trig_relationshipresources` for populating the id column value
-- -----------------------------------------------------
CREATE TRIGGER sopenidm.trig_relationshipresources
BEFORE INSERT
ON sopenidm.relationshipresources
REFERENCING NEW AS N
FOR EACH ROW MODE DB2SQL
WHEN (N.id IS NULL)
BEGIN ATOMIC
    SET N.id = CAST(CAST(NEXT VALUE FOR relationshipresources_id_seq AS CHAR(50)) AS VARCHAR(255));
END;

-- -----------------------------------------------------
-- Populate `sopenidm`.`relationshipresources` using data from `sopenidm`.`relationships`
-- -----------------------------------------------------
INSERT
INTO
	sopenidm.relationshipresources (
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
	sopenidm.relationships r
WHERE
	r.firstpropertyname IS NOT NULL
	AND NOT EXISTS (
	SELECT
		*
	FROM
		sopenidm.relationshipresources rr
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
	sopenidm.relationships r
WHERE
	r.secondpropertyname IS NOT NULL
	AND NOT EXISTS (
	SELECT
		*
	FROM
		sopenidm.relationshipresources rr
	WHERE
		rr.originresourcecollection = r.secondresourcecollection AND
		rr.originproperty = r.secondpropertyname AND
		rr.refresourcecollection = r.firstresourcecollection AND
		rr.originfirst = 0);

-- -----------------------------------------------------
-- Drop temporary SEQUENCE and TRIGGER
-- -----------------------------------------------------
DROP SEQUENCE relationshipresources_id_seq;
DROP TRIGGER sopenidm.trig_relationshipresources;