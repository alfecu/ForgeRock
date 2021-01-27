-- -----------------------------------------------------
-- Drop the remainingRetries column and associated index
-- -----------------------------------------------------
DROP INDEX idx_syncqueue_mapping_retries;
ALTER TABLE syncqueue DROP COLUMN remainingRetries;
