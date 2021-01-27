-- Can be ran while 6.x software is running, or not, prior to software upgrade so that the `relationshipresources` table
-- can be created and monitor inserts into the relationship table.

CREATE TABLE relationshipresources (
     id VARCHAR2(255 CHAR) NOT NULL,
     originresourcecollection VARCHAR(255) NOT NULL,
     originproperty VARCHAR(100) NOT NULL,
     refresourcecollection VARCHAR(255) NOT NULL,
     originfirst NUMBER NOT NULL,
     reverseproperty VARCHAR(100)
);

ALTER TABLE relationshipresources
ADD CONSTRAINT pk_relationshipresources PRIMARY KEY
(
  originresourcecollection, originproperty, refresourcecollection, originfirst
)
ENABLE
;

CREATE INDEX idx_relationships_originFirst ON relationships
(
  firstresourceid,
  firstresourcecollection,
  firstpropertyname,
  secondresourceid,
  secondresourcecollection
);

CREATE INDEX idx_relationships_originSecond ON relationships
(
  secondresourceid,
  secondresourcecollection,
  secondpropertyname,
  firstresourceid,
  firstresourcecollection
);

-- -----------------------------------------------------
-- Temporary SEQUENCE `relationshipresources_id_seq` for incrementing the id column value
-- -----------------------------------------------------
CREATE SEQUENCE relationshipresources_id_seq
    START WITH 1 INCREMENT BY 1 ;

-- -----------------------------------------------------
-- Temporary TRIGGER `trig_relationshipresources` for populating the id column value of openidm.relationshipresources
-- -----------------------------------------------------
CREATE OR REPLACE TRIGGER trig_relationshipresources BEFORE INSERT ON relationshipresources
FOR EACH ROW
BEGIN
  IF INSERTING AND :new.id IS NULL THEN
  	SELECT CAST(relationshipresources_id_seq.NEXTVAL AS VARCHAR2(255)) INTO :new.id FROM DUAL;
  END IF;
END;
/

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

-- -----------------------------------------------------
-- Drop temporary TRIGGER and SEQUENCE
-- -----------------------------------------------------
DROP TRIGGER trig_relationshipresources;
DROP SEQUENCE relationshipresources_id_seq;
