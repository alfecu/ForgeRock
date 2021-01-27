-- -----------------------------------------------------
-- Drop the remainingRetries column and associated index
-- -----------------------------------------------------
DROP INDEX SOPENIDM.IDX_SYNCQUEUE_MAPPING_RETRIES;
ALTER TABLE SOPENIDM.SYNCQUEUE DROP COLUMN REMAININGRETRIES;
CALL SYSPROC.ADMIN_CMD('REORG TABLE SOPENIDM.SYNCQUEUE');
