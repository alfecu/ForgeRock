-- -----------------------------------------------------
-- Drop the remainingRetries column and associated index
-- -----------------------------------------------------
DROP INDEX indx_syncqueue_mapping_retries;
ALTER TABLE openidm.syncqueue DROP COLUMN remainingRetries;