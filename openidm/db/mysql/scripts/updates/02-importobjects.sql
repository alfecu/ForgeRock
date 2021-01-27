-- -----------------------------------------------------
-- Table `openidm`.`importobjects`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `openidm`.`importobjects` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `objecttypes_id` BIGINT UNSIGNED NOT NULL ,
  `objectid` VARCHAR(255) NOT NULL ,
  `rev` VARCHAR(38) NOT NULL ,
  `fullobject` MEDIUMTEXT NULL ,
  PRIMARY KEY (`id`) ,
  INDEX `fk_importobjects_objecttypes` (`objecttypes_id` ASC) ,
  UNIQUE INDEX `idx_importobjects_object` (`objecttypes_id` ASC, `objectid` ASC) ,
  CONSTRAINT `fk_importobjects_objecttypes`
    FOREIGN KEY (`objecttypes_id` )
    REFERENCES `openidm`.`objecttypes` (`id` )
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
  ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `openidm`.`importobjectproperties`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `openidm`.`importobjectproperties` (
  `importobjects_id` BIGINT UNSIGNED NOT NULL ,
  `propkey` VARCHAR(255) NOT NULL ,
  `proptype` VARCHAR(255) NULL ,
  `propvalue` VARCHAR(2000) NULL ,
  PRIMARY KEY (`importobjects_id`, `propkey`),
  INDEX `fk_importobjectproperties_importobjects` (`importobjects_id` ASC) ,
  INDEX `idx_importobjectproperties_propkey` (`propkey` ASC) ,
  INDEX `idx_importobjectproperties_propvalue` (`propvalue`(255) ASC) ,
  CONSTRAINT `fk_importobjectproperties_importobjects`
    FOREIGN KEY (`importobjects_id` )
    REFERENCES `openidm`.`importobjects` (`id` )
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
  ENGINE = InnoDB;
