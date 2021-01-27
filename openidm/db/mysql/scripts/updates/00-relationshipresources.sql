-- Can be ran while 6.x software is running, or not, prior to software upgrade so that the `relationshipresources` table
-- can be created and monitor inserts into the relationship table.

USE `openidm` ;

-- -----------------------------------------------------
-- Table `openidm`.`relationshipresources`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `openidm`.`relationshipresources` (
  `id` VARCHAR(255) NOT NULL ,
  `originresourcecollection` VARCHAR(255) NOT NULL ,
  `originproperty` VARCHAR(100) NOT NULL ,
  `refresourcecollection` VARCHAR(255) NOT NULL ,
  `originfirst` tinyint(1) NOT NULL ,
  `reverseproperty` VARCHAR(100) ,
  PRIMARY KEY ( `originproperty`, `originresourcecollection`, `refresourcecollection`, `originfirst`))
  ENGINE = InnoDB;

CREATE INDEX `idx_relationships_originFirst` ON openidm.relationships (`firstresourceid` ASC, `firstresourcecollection` ASC, `firstpropertyname` ASC, `secondresourceid` ASC, `secondresourcecollection` ASC);
CREATE INDEX `idx_relationships_originSecond` ON openidm.relationships (`secondresourceid` ASC, `secondresourcecollection` ASC, `secondpropertyname` ASC, `firstresourceid` ASC, `firstresourcecollection` ASC);

SET @idValue := 0;
DELIMITER $$
-- -----------------------------------------------------
-- Temporary FUNCTION `fn_increment_id` for incrementing and casting the id column value
-- -----------------------------------------------------
CREATE FUNCTION fn_increment_id() RETURNS VARCHAR(255)
DETERMINISTIC
BEGIN
  DECLARE newId VARCHAR(255);
  SET newId = CAST((@idValue := @idValue + 1) as CHAR(50));
  RETURN newId;
END;
-- -----------------------------------------------------
-- Temporary TRIGGER `openidm`.`trig_relationshipresources` for populating the id column value
-- -----------------------------------------------------
CREATE TRIGGER `openidm`.`trig_relationshipresources`
BEFORE INSERT
ON `openidm`.`relationshipresources`
FOR EACH ROW
BEGIN
IF (NEW.id IS NULL)
    THEN
    SET NEW.id = fn_increment_id();
END IF;
END;
$$
DELIMITER ;

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

-- -----------------------------------------------------
-- Drop temporary FUNCTION and TRIGGER
-- -----------------------------------------------------
DROP FUNCTION fn_increment_id;
DROP TRIGGER `openidm`.`trig_relationshipresources`;