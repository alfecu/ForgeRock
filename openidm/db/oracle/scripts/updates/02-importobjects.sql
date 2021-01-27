-- DROP TABLE importobjectproperties CASCADE CONSTRAINTS;


PROMPT Creating Table importobjectproperties ...
CREATE TABLE importobjectproperties (
  importobjects_id NUMBER(24,0) NOT NULL,
  propkey VARCHAR2(255 CHAR) NOT NULL,
  proptype VARCHAR2(32 CHAR),
  propvalue VARCHAR2(2000 CHAR)
);


PROMPT Creating Index fk_importobjectproperties_gen on importobjectproperties ...
CREATE INDEX fk_importobjectproperties_gen ON importobjectproperties
(
  importobjects_id
)
;
PROMPT Creating Index idx_importobjectproper_1 on importobjectproperties ...
CREATE INDEX idx_importobjectproper_1 ON importobjectproperties
(
  propkey
)
;
PROMPT Creating Index idx_importobjectproper_2 on importobjectproperties ...
CREATE INDEX idx_importobjectproper_2 ON importobjectproperties
(
  propvalue
)
;

PROMPT Creating Primary Key Constraint PRIMARY_33 on table importobjectproperties ...
ALTER TABLE importobjectproperties
ADD CONSTRAINT PRIMARY_33 PRIMARY KEY
(
  importobjects_id,
  propkey
)
;


-- DROP TABLE importobjects CASCADE CONSTRAINTS;


PROMPT Creating Table importobjects ...
CREATE TABLE importobjects (
  id NUMBER(24,0) NOT NULL,
  objecttypes_id NUMBER(24,0) NOT NULL,
  objectid VARCHAR2(255 CHAR) NOT NULL,
  rev VARCHAR2(38 CHAR) NOT NULL,
  fullobject CLOB
);


PROMPT Creating Primary Key Constraint PRIMARY_34 on table importobjects ...
ALTER TABLE importobjects
ADD CONSTRAINT PRIMARY_34 PRIMARY KEY
(
  id
)
ENABLE
;
PROMPT Creating Unique Index idx_importobjects_object on importobjects...
CREATE UNIQUE INDEX idx_importobjects_object ON importobjects
(
  objecttypes_id,
  objectid
)
;
PROMPT Creating Index fk_importobjects_objecttypes on importobjects ...
CREATE INDEX fk_importobjects_objecttypes ON importobjects
(
  objecttypes_id
)
;