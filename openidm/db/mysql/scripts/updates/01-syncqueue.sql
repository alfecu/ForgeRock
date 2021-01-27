-- -----------------------------------------------------
-- Drop the remainingRetries column and associated index
-- -----------------------------------------------------
DROP INDEX `indx_syncqueue_mapping_retries` ON `openidm`.`syncqueue`;
ALTER TABLE `openidm`.`syncqueue` DROP `remainingRetries`;
