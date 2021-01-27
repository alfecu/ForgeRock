-- -------------------------------------------
-- openidm database user (for MySQL 5.7 and higher)
-- ------------------------------------------
CREATE USER IF NOT EXISTS 'openidm'@'%' IDENTIFIED BY 'Frdp-2010';
GRANT ALL PRIVILEGES on openidm.* TO openidm;
GRANT ALL PRIVILEGES on openidm.* TO openidm@'%';
CREATE USER IF NOT EXISTS 'openidm'@'localhost' IDENTIFIED BY 'Frdp-2010';
GRANT ALL PRIVILEGES on openidm.* TO openidm@localhost;
