-- -----------------------------------------------------
-- Table `openidm`.`reconassoc`
-- -----------------------------------------------------

CREATE TABLE `openidm`.`reconassoc` (
  `objectid` VARCHAR(255) NOT NULL ,
  `rev` VARCHAR(38) NOT NULL ,
  `mapping` VARCHAR(255) NOT NULL ,
  `sourceResourceCollection` VARCHAR(255) NOT NULL ,
  `targetResourceCollection` VARCHAR(255) NOT NULL ,
  `isAnalysis` VARCHAR(5) NOT NULL ,
  `finishTime` VARCHAR(38) NULL ,
  PRIMARY KEY (`objectid`) ,
  INDEX `idx_reconassoc_mapping` (`mapping` ASC) ,
  INDEX `idx_reconassoc_reconId` (`objectid` ASC) )
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table openidm.reconassocentry
-- -----------------------------------------------------

CREATE TABLE `openidm`.`reconassocentry` (
  `objectid` VARCHAR(38) NOT NULL ,
  `rev` VARCHAR(38) NOT NULL ,
  `reconId` VARCHAR(255) NOT NULL ,
  `situation` VARCHAR(38) NULL ,
  `action` VARCHAR(38) NULL ,
  `phase` VARCHAR(38) NULL ,
  `linkQualifier` VARCHAR(38) NOT NULL ,
  `sourceObjectId` VARCHAR(255) NULL ,
  `targetObjectId` VARCHAR(255) NULL ,
  `status` VARCHAR(38) NOT NULL ,
  `exception` TEXT NULL ,
  `message` TEXT NULL ,
  `messagedetail` TEXT NULL ,
  `ambiguousTargetObjectIds` MEDIUMTEXT NULL ,
  PRIMARY KEY (`objectid`) ,
  INDEX `idx_reconassocentry_situation` (`situation` ASC) ,
  CONSTRAINT `fk_reconassocentry_reconassoc_id`
    FOREIGN KEY (`reconId`)
    REFERENCES `openidm`.`reconassoc` (`objectid`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- View openidm.reconassocentryview
-- -----------------------------------------------------
CREATE VIEW `openidm`.`reconassocentryview` AS
 SELECT
  `assoc`.`objectid` AS `reconId`,
  `assoc`.`mapping` AS `mapping`,
  `assoc`.`sourceResourceCollection` AS `sourceResourceCollection`,
  `assoc`.`targetResourceCollection` AS `targetResourceCollection`,
  `entry`.`objectid` AS `objectid`,
  `entry`.`rev` AS `rev`,
  `entry`.`action` AS `action`,
  `entry`.`situation` AS `situation`,
  `entry`.`linkQualifier` AS `linkQualifier`,
  `entry`.`sourceObjectId` AS `sourceObjectId`,
  `entry`.`targetObjectId` AS `targetObjectId`,
  `entry`.`status` AS `status`,
  `entry`.`exception` AS `exception`,
  `entry`.`message` AS `message`,
  `entry`.`messagedetail` AS `messagedetail`,
  `entry`.`ambiguousTargetObjectIds` AS `ambiguousTargetObjectIds`
 FROM `openidm`.`reconassocentry` `entry`, `openidm`.`reconassoc` `assoc`
 WHERE `assoc`.`objectid` = `entry`.`reconid`;
