-- Can be ran while 6.x software is running, or not, prior to software upgrade so that the `relationshipresources` table
-- can be created and monitor inserts into the relationship table.

-- -----------------------------------------------------
-- Table openidm.relationshipresources
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS openidm.relationshipresources (
  id VARCHAR(255) NOT NULL,
  originresourcecollection VARCHAR(255) NOT NULL,
  originproperty VARCHAR(100) NOT NULL,
  refresourcecollection VARCHAR(255) NOT NULL,
  originfirst BOOL NOT NULL,
  reverseproperty VARCHAR(100),
  PRIMARY KEY ( originresourcecollection, originproperty, refresourcecollection, originfirst ));

CREATE INDEX idx_relationships_originfirst ON openidm.relationships (firstresourceid , firstresourcecollection , firstpropertyname , secondresourceid , secondresourcecollection );
CREATE INDEX idx_relationships_originsecond ON openidm.relationships (secondresourceid , secondresourcecollection , secondpropertyname , firstresourceid , firstresourcecollection );

-- -----------------------------------------------------
-- Temporary SEQUENCE `relationshipresources_id_seq` for incrementing the id column value
-- -----------------------------------------------------
CREATE SEQUENCE relationshipresources_id_seq INCREMENT BY 1 START WITH 1;

-- -----------------------------------------------------
-- Temporary FUNCTION `fn_populatedId` for the TRIGGER `trig_relationshipresources`
-- -----------------------------------------------------
CREATE FUNCTION fn_populate_id() RETURNS TRIGGER AS
$sql$
BEGIN
IF (NEW.id IS NULL)
    THEN
    NEW.id = NEXTVAL('relationshipresources_id_seq')::VARCHAR(255);
END IF;
RETURN NEW;
END;
$sql$ LANGUAGE plpgsql VOLATILE;

-- -----------------------------------------------------
-- Temporary TRIGGER `trig_relationshipresources` for populating the id column value of openidm.relationshipresources
-- -----------------------------------------------------
CREATE TRIGGER trig_relationshipresources BEFORE INSERT
ON openidm.relationshipresources
FOR EACH ROW
EXECUTE PROCEDURE fn_populate_id();

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
	true,
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
		rr.originfirst = true)
UNION ALL
SELECT
	DISTINCT
	secondresourcecollection,
	secondpropertyname,
	firstresourcecollection,
	false,
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
		rr.originfirst = false);

-- -----------------------------------------------------
-- Drop temporary TRIGGER, TRIGGER FUNCTION and SEQUENCE
-- -----------------------------------------------------
DROP TRIGGER trig_relationshipresources ON openidm.relationshipresources;
DROP FUNCTION fn_populate_id();
DROP SEQUENCE relationshipresources_id_seq;