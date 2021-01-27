-- [openidm].[auditrecon]
-- trackingids NTEXT ,
ALTER TABLE [openidm].[auditrecon] ADD [trackingids_ntext] nvarchar(MAX);
UPDATE [openidm].[auditrecon] set trackingids_ntext=convert(nvarchar(MAX), trackingids);
ALTER TABLE [openidm].[auditrecon] DROP COLUMN [trackingids];
Exec sp_rename 'auditrecon.trackingids_ntext', 'trackingids', 'Column';
-- exceptiondetail NTEXT NULL ,
ALTER TABLE [openidm].[auditrecon] ADD [exceptiondetail_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditrecon] set exceptiondetail_ntext=convert(nvarchar(MAX), exceptiondetail);
ALTER TABLE [openidm].[auditrecon] DROP COLUMN [exceptiondetail];
Exec sp_rename 'auditrecon.exceptiondetail_ntext', 'exceptiondetail', 'Column';
-- message NTEXT NULL ,
 ALTER TABLE [openidm].[auditrecon] ADD [message_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditrecon] set message_ntext=convert(nvarchar(MAX), message);
ALTER TABLE [openidm].[auditrecon] DROP COLUMN [message];
Exec sp_rename 'auditrecon.message_ntext', 'message', 'Column';
-- messagedetail NTEXT NULL ,
ALTER TABLE [openidm].[auditrecon] ADD [messagedetail_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditrecon] set messagedetail_ntext=convert(nvarchar(MAX), messagedetail);
ALTER TABLE [openidm].[auditrecon] DROP COLUMN [messagedetail];
Exec sp_rename 'auditrecon.messagedetail_ntext', 'messagedetail', 'Column';
-- ambiguoustargetobjectids NTEXT NULL ,
ALTER TABLE [openidm].[auditrecon] ADD [ambiguoustargetobjectids_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditrecon] set ambiguoustargetobjectids_ntext=convert(nvarchar(MAX), ambiguoustargetobjectids);
ALTER TABLE [openidm].[auditrecon] DROP COLUMN [ambiguoustargetobjectids];
Exec sp_rename 'auditrecon.ambiguoustargetobjectids_ntext', 'ambiguoustargetobjectids', 'Column';

-- [openidm].[auditsync]
-- trackingids NVARCHAR(MAX) ,
ALTER TABLE [openidm].[auditsync] ADD [trackingids_ntext] nvarchar(MAX);
UPDATE [openidm].[auditsync] set trackingids_ntext=convert(nvarchar(MAX), trackingids);
ALTER TABLE [openidm].[auditsync] DROP COLUMN [trackingids];
Exec sp_rename 'auditsync.trackingids_ntext', 'trackingids', 'Column';
-- exceptiondetail NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[auditsync] ADD [exceptiondetail_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditsync] set exceptiondetail_ntext=convert(nvarchar(MAX), exceptiondetail);
ALTER TABLE [openidm].[auditsync] DROP COLUMN [exceptiondetail];
Exec sp_rename 'auditsync.exceptiondetail_ntext', 'exceptiondetail', 'Column';
-- message NVARCHAR(MAX) NULL ,
  ALTER TABLE [openidm].[auditsync] ADD [message_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditsync] set message_ntext=convert(nvarchar(MAX), message);
ALTER TABLE [openidm].[auditsync] DROP COLUMN [message];
Exec sp_rename 'auditsync.message_ntext', 'message', 'Column';
-- messagedetail NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[auditsync] ADD [messagedetail_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditsync] set messagedetail_ntext=convert(nvarchar(MAX), messagedetail);
ALTER TABLE [openidm].[auditsync] DROP COLUMN [messagedetail];
Exec sp_rename 'auditsync.messagedetail_ntext', 'messagedetail', 'Column';


-- [openidm].[auditconfig]
-- trackingids NVARCHAR(MAX),
ALTER TABLE [openidm].[auditconfig] ADD [trackingids_ntext] nvarchar(MAX);
UPDATE [openidm].[auditconfig] set trackingids_ntext=convert(nvarchar(MAX), trackingids);
ALTER TABLE [openidm].[auditconfig] DROP COLUMN [trackingids];
Exec sp_rename 'auditconfig.trackingids_ntext', 'trackingids', 'Column';
-- beforeObject NVARCHAR(MAX),
ALTER TABLE [openidm].[auditconfig] ADD [beforeObject_ntext] nvarchar(MAX);
UPDATE [openidm].[auditconfig] set beforeObject_ntext=convert(nvarchar(MAX), beforeObject);
ALTER TABLE [openidm].[auditconfig] DROP COLUMN [beforeObject];
Exec sp_rename 'auditconfig.beforeObject_ntext', 'beforeObject', 'Column';
-- afterObject NVARCHAR(MAX),
ALTER TABLE [openidm].[auditconfig] ADD [afterObject_ntext] nvarchar(MAX);
UPDATE [openidm].[auditconfig] set afterObject_ntext=convert(nvarchar(MAX), afterObject);
ALTER TABLE [openidm].[auditconfig] DROP COLUMN [afterObject];
Exec sp_rename 'auditconfig.afterObject_ntext', 'afterObject', 'Column';
-- changedfields NVARCHAR(MAX) NULL,
ALTER TABLE [openidm].[auditconfig] ADD [changedfields_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditconfig] set changedfields_ntext=convert(nvarchar(MAX), changedfields);
ALTER TABLE [openidm].[auditconfig] DROP COLUMN [changedfields];
Exec sp_rename 'auditconfig.changedfields_ntext', 'changedfields', 'Column';


-- [openidm].[auditactivity]
-- trackingids NVARCHAR(MAX),
ALTER TABLE [openidm].[auditactivity] ADD [trackingids_ntext] nvarchar(MAX);
UPDATE [openidm].[auditactivity] set trackingids_ntext=convert(nvarchar(MAX), trackingids);
ALTER TABLE [openidm].[auditactivity] DROP COLUMN [trackingids];
Exec sp_rename 'auditactivity.trackingids_ntext', 'trackingids', 'Column';
-- subjectbefore NVARCHAR(MAX),
ALTER TABLE [openidm].[auditactivity] ADD [subjectbefore_ntext] nvarchar(MAX);
UPDATE [openidm].[auditactivity] set subjectbefore_ntext=convert(nvarchar(MAX), subjectbefore);
ALTER TABLE [openidm].[auditactivity] DROP COLUMN [subjectbefore];
Exec sp_rename 'auditactivity.subjectbefore_ntext', 'subjectbefore', 'Column';
-- subjectafter NVARCHAR(MAX),
ALTER TABLE [openidm].[auditactivity] ADD [subjectafter_ntext] nvarchar(MAX);
UPDATE [openidm].[auditactivity] set subjectafter_ntext=convert(nvarchar(MAX), subjectafter);
ALTER TABLE [openidm].[auditactivity] DROP COLUMN [subjectafter];
Exec sp_rename 'auditactivity.subjectafter_ntext', 'subjectafter', 'Column';
-- changedfields NVARCHAR(MAX) NULL,
ALTER TABLE [openidm].[auditactivity] ADD [changedfields_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditactivity] set changedfields_ntext=convert(nvarchar(MAX), changedfields);
ALTER TABLE [openidm].[auditactivity] DROP COLUMN [changedfields];
Exec sp_rename 'auditactivity.changedfields_ntext', 'changedfields', 'Column';
-- message NVARCHAR(MAX),
ALTER TABLE [openidm].[auditactivity] ADD [message_ntext] nvarchar(MAX);
UPDATE [openidm].[auditactivity] set message_ntext=convert(nvarchar(MAX), message);
ALTER TABLE [openidm].[auditactivity] DROP COLUMN [message];
Exec sp_rename 'auditactivity.message_ntext', 'message', 'Column';
-- context NVARCHAR(MAX) NULL,
ALTER TABLE [openidm].[auditactivity] ADD [context_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditactivity] set context_ntext=convert(nvarchar(MAX), context);
ALTER TABLE [openidm].[auditactivity] DROP COLUMN [context];
Exec sp_rename 'auditactivity.context_ntext', 'context', 'Column';


-- [openidm].[auditaccess]
-- trackingids NVARCHAR(MAX),
ALTER TABLE [openidm].[auditaccess] ADD [trackingids_ntext] nvarchar(MAX);
UPDATE [openidm].[auditaccess] set trackingids_ntext=convert(nvarchar(MAX), trackingids);
ALTER TABLE [openidm].[auditaccess] DROP COLUMN [trackingids];
Exec sp_rename 'auditaccess.trackingids_ntext', 'trackingids', 'Column';
-- request_detail NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[auditaccess] ADD [request_detail_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditaccess] set request_detail_ntext=convert(nvarchar(MAX), request_detail);
ALTER TABLE [openidm].[auditaccess] DROP COLUMN [request_detail];
Exec sp_rename 'auditaccess.request_detail_ntext', 'request_detail', 'Column';
-- http_request_queryparameters NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[auditaccess] ADD [http_request_queryparameters_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditaccess] set http_request_queryparameters_ntext=convert(nvarchar(MAX), http_request_queryparameters);
ALTER TABLE [openidm].[auditaccess] DROP COLUMN [http_request_queryparameters];
Exec sp_rename 'auditaccess.http_request_queryparameters_ntext', 'http_request_queryparameters', 'Column';
-- http_request_headers NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[auditaccess] ADD [http_request_headers_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditaccess] set http_request_headers_ntext=convert(nvarchar(MAX), http_request_headers);
ALTER TABLE [openidm].[auditaccess] DROP COLUMN [http_request_headers];
Exec sp_rename 'auditaccess.http_request_headers_ntext', 'http_request_headers', 'Column';
-- http_request_cookies NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[auditaccess] ADD [http_request_cookies_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditaccess] set http_request_cookies_ntext=convert(nvarchar(MAX), http_request_cookies);
ALTER TABLE [openidm].[auditaccess] DROP COLUMN [http_request_cookies];
Exec sp_rename 'auditaccess.http_request_cookies_ntext', 'http_request_cookies', 'Column';
-- http_response_headers NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[auditaccess] ADD [http_response_headers_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditaccess] set http_response_headers_ntext=convert(nvarchar(MAX), http_response_headers);
ALTER TABLE [openidm].[auditaccess] DROP COLUMN [http_response_headers];
Exec sp_rename 'auditaccess.http_response_headers_ntext', 'http_response_headers', 'Column';
-- response_detail NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[auditaccess] ADD [response_detail_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditaccess] set response_detail_ntext=convert(nvarchar(MAX), response_detail);
ALTER TABLE [openidm].[auditaccess] DROP COLUMN [response_detail];
Exec sp_rename 'auditaccess.response_detail_ntext', 'response_detail', 'Column';
-- roles NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[auditaccess] ADD [roles_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditaccess] set roles_ntext=convert(nvarchar(MAX), roles);
ALTER TABLE [openidm].[auditaccess] DROP COLUMN [roles];
Exec sp_rename 'auditaccess.roles_ntext', 'roles', 'Column';


-- [openidm].[auditauthentication]
-- principals NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[auditauthentication] ADD [principals_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditauthentication] set principals_ntext=convert(nvarchar(MAX), principals);
ALTER TABLE [openidm].[auditauthentication] DROP COLUMN [principals];
Exec sp_rename 'auditauthentication.principals_ntext', 'principals', 'Column';
-- context NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[auditauthentication] ADD [context_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditauthentication] set context_ntext=convert(nvarchar(MAX), context);
ALTER TABLE [openidm].[auditauthentication] DROP COLUMN [context];
Exec sp_rename 'auditauthentication.context_ntext', 'context', 'Column';
-- entries NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[auditauthentication] ADD [entries_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[auditauthentication] set entries_ntext=convert(nvarchar(MAX), entries);
ALTER TABLE [openidm].[auditauthentication] DROP COLUMN [entries];
Exec sp_rename 'auditauthentication.entries_ntext', 'entries', 'Column';
-- trackingids NVARCHAR(MAX),
ALTER TABLE [openidm].[auditauthentication] ADD [trackingids_ntext] nvarchar(MAX);
UPDATE [openidm].[auditauthentication] set trackingids_ntext=convert(nvarchar(MAX), trackingids);
ALTER TABLE [openidm].[auditauthentication] DROP COLUMN [trackingids];
Exec sp_rename 'auditauthentication.trackingids_ntext', 'trackingids', 'Column';
