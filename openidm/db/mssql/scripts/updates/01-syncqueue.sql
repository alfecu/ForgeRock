-- -----------------------------------------------------
-- Drop the remainingRetries column and associated index
-- -----------------------------------------------------
DROP INDEX idx_syncqueue_mapping_retries ON [openidm].[syncqueue];
ALTER TABLE [openidm].[syncqueue] DROP COLUMN remainingRetries;
