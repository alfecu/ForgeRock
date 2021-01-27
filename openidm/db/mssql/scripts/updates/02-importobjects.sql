-- -----------------------------------------------------
-- Table `openidm`.`importobjects`
-- -----------------------------------------------------
IF NOT EXISTS (SELECT name FROM sysobjects where name='importobjects' AND xtype='U')
BEGIN
CREATE  TABLE [openidm].[importobjects]
(
  id NUMERIC(19,0) NOT NULL IDENTITY ,
  objecttypes_id NUMERIC(19,0) NOT NULL ,
  objectid NVARCHAR(255) NOT NULL ,
  rev NVARCHAR(38) NOT NULL ,
  fullobject NVARCHAR(MAX) NULL ,

  CONSTRAINT fk_importobjects_objecttypes
  	FOREIGN KEY (objecttypes_id)
  	REFERENCES [openidm].[objecttypes] (id)
  	ON DELETE CASCADE
  	ON UPDATE NO ACTION,
  PRIMARY KEY CLUSTERED (id),
);
CREATE UNIQUE INDEX idx_importobjects_object ON [openidm].[importobjects] (objecttypes_id ASC, objectid ASC);
CREATE INDEX fk_importobjects_objecttypes ON [openidm].[importobjects] (objecttypes_id ASC);
END

-- -----------------------------------------------------
-- Table `openidm`.`importobjectproperties`
-- -----------------------------------------------------
IF NOT EXISTS (SELECT name FROM sysobjects where name='importobjectproperties' AND xtype='U')
BEGIN
CREATE  TABLE [openidm].[importobjectproperties]
(
  importobjects_id NUMERIC(19,0) NOT NULL ,
  propkey NVARCHAR(255) NOT NULL ,
  proptype NVARCHAR(32) NULL ,
  propvalue NVARCHAR(195) NULL ,
  PRIMARY KEY CLUSTERED (importobjects_id, propkey),
  CONSTRAINT fk_importobjectproperties_importobjects
    FOREIGN KEY (importobjects_id)
    REFERENCES [openidm].[importobjects] (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);
CREATE INDEX fk_importobjectproperties_importobjects ON [openidm].[importobjectproperties] (importobjects_id ASC);
CREATE INDEX idx_importobjectproperties_propkey ON [openidm].[importobjectproperties] (propkey ASC);
CREATE INDEX idx_importobjectproperties_propvalue ON [openidm].[importobjectproperties] (propvalue ASC);
END
