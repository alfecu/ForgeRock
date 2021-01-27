-- -------------------------------------------
-- openidm database user (for MySQL 5.6 and lower)
-- ------------------------------------------
GRANT ALL PRIVILEGES on openidm.* TO openidm IDENTIFIED BY 'openidm';
GRANT ALL PRIVILEGES on openidm.* TO openidm@'%' IDENTIFIED BY 'openidm';
GRANT ALL PRIVILEGES on openidm.* TO openidm@localhost IDENTIFIED BY 'openidm';
