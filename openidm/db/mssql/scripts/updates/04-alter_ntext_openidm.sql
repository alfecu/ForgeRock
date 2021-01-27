--[openidm].[genericobjects]
--fullobject NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[genericobjects] ADD [fullobject_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[genericobjects] set fullobject_ntext=convert(nvarchar(MAX), fullobject);
ALTER TABLE [openidm].[genericobjects] DROP COLUMN [fullobject];
Exec sp_rename 'genericobjects.fullobject_ntext', 'fullobject', 'Column';

--
--[openidm].[managedobjects]
--fullobject NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[managedobjects] ADD [fullobject_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[managedobjects] set fullobject_ntext=convert(nvarchar(MAX), fullobject);
ALTER TABLE [openidm].[managedobjects] DROP COLUMN [fullobject];
Exec sp_rename 'managedobjects.fullobject_ntext', 'fullobject', 'Column';


--[openidm].[configobjects]
--fullobject NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[configobjects] ADD [fullobject_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[configobjects] set fullobject_ntext=convert(nvarchar(MAX), fullobject);
ALTER TABLE [openidm].[configobjects] DROP COLUMN [fullobject];
Exec sp_rename 'configobjects.fullobject_ntext', 'fullobject', 'Column';


--[openidm].[notificationobjects]
--fullobject NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[notificationobjects] ADD [fullobject_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[notificationobjects] set fullobject_ntext=convert(nvarchar(MAX), fullobject);
ALTER TABLE [openidm].[notificationobjects] DROP COLUMN [fullobject];
Exec sp_rename 'notificationobjects.fullobject_ntext', 'fullobject', 'Column';


--[openidm].[relationships]
--fullobject NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[relationships] ADD [fullobject_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[relationships] set fullobject_ntext=convert(nvarchar(MAX), fullobject);
ALTER TABLE [openidm].[relationships] DROP COLUMN [fullobject];
Exec sp_rename 'relationships.fullobject_ntext', 'fullobject', 'Column';


--[openidm].[internalrole]
--privs NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[internalrole] ADD [privs_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[internalrole] set privs_ntext=convert(nvarchar(MAX), privs);
ALTER TABLE [openidm].[internalrole] DROP COLUMN [privs];
Exec sp_rename 'internalrole.privs_ntext', 'privs', 'Column';


--[openidm].[schedulerobjects]
--fullobject NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[schedulerobjects] ADD [fullobject_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[schedulerobjects] set fullobject_ntext=convert(nvarchar(MAX), fullobject);
ALTER TABLE [openidm].[schedulerobjects] DROP COLUMN [fullobject];
Exec sp_rename 'schedulerobjects.fullobject_ntext', 'fullobject', 'Column';


--
--[openidm].[clusterobjects]
--fullobject NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[clusterobjects] ADD [fullobject_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[clusterobjects] set fullobject_ntext=convert(nvarchar(MAX), fullobject);
ALTER TABLE [openidm].[clusterobjects] DROP COLUMN [fullobject];
Exec sp_rename 'clusterobjects.fullobject_ntext', 'fullobject', 'Column';

--[openidm].[clusteredrecontargetids]
--targetids NVARCHAR(MAX) NOT NULL ,
ALTER TABLE [openidm].[clusteredrecontargetids] ADD [targetids_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[clusteredrecontargetids] set targetids_ntext=convert(nvarchar(MAX), targetids);
ALTER TABLE [openidm].[clusteredrecontargetids] DROP COLUMN [targetids];
Exec sp_rename 'clusteredrecontargetids.targetids_ntext', 'targetids', 'Column';


--[openidm].[uinotification]
-- message NVARCHAR(MAX) NOT NULL ,
ALTER TABLE [openidm].[uinotification] ADD [message_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[uinotification] set message_ntext=convert(nvarchar(MAX), message);
ALTER TABLE [openidm].[uinotification] DROP COLUMN [message];
Exec sp_rename 'uinotification.message_ntext', 'message', 'Column';


--
--[openidm].[updateobjects]
--  fullobject NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[updateobjects] ADD [fullobject_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[updateobjects] set fullobject_ntext=convert(nvarchar(MAX), fullobject);
ALTER TABLE [openidm].[updateobjects] DROP COLUMN [fullobject];
Exec sp_rename 'updateobjects.fullobject_ntext', 'fullobject', 'Column';

--[openidm].[syncqueue]
--  oldObject NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[syncqueue] ADD [oldObject_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[syncqueue] set oldObject_ntext=convert(nvarchar(MAX), oldObject);
ALTER TABLE [openidm].[syncqueue] DROP COLUMN [oldObject];
Exec sp_rename 'syncqueue.oldObject_ntext', 'oldObject', 'Column';
--  newObject NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[syncqueue] ADD [newObject_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[syncqueue] set newObject_ntext=convert(nvarchar(MAX), newObject);
ALTER TABLE [openidm].[syncqueue] DROP COLUMN [newObject];
Exec sp_rename 'syncqueue.newObject_ntext', 'newObject', 'Column';
--  context NVARCHAR(MAX) NOT NULL ,
ALTER TABLE [openidm].[syncqueue] ADD [context_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[syncqueue] set context_ntext=convert(nvarchar(MAX), context);
ALTER TABLE [openidm].[syncqueue] DROP COLUMN [context];
Exec sp_rename 'syncqueue.context_ntext', 'context', 'Column';


--[openidm].[files]
--  content NVARCHAR(MAX) NULL,
ALTER TABLE [openidm].[files] ADD [content_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[files] set content_ntext=convert(nvarchar(MAX), content);
ALTER TABLE [openidm].[files] DROP COLUMN [content];
Exec sp_rename 'files.content_ntext', 'content', 'Column';


--[openidm].[metaobjects]
--  fullobject NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[metaobjects] ADD [fullobject_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[metaobjects] set fullobject_ntext=convert(nvarchar(MAX), fullobject);
ALTER TABLE [openidm].[metaobjects] DROP COLUMN [fullobject];
Exec sp_rename 'metaobjects.fullobject_ntext', 'fullobject', 'Column';


--[openidm].[reconassoc]
--   exception NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[reconassoc] ADD [exception_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[reconassoc] set exception_ntext=convert(nvarchar(MAX), exception);
ALTER TABLE [openidm].[reconassoc] DROP COLUMN [exception];
Exec sp_rename 'reconassoc.exception_ntext', 'exception', 'Column';
--  message NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[reconassoc] ADD [message_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[reconassoc] set message_ntext=convert(nvarchar(MAX), message);
ALTER TABLE [openidm].[reconassoc] DROP COLUMN [message];
Exec sp_rename 'reconassoc.message_ntext', 'message', 'Column';
--  messagedetail NVARCHAR(MAX) NULL ,
ALTER TABLE [openidm].[reconassoc] ADD [messagedetail_ntext] nvarchar(MAX) NULL;
UPDATE [openidm].[reconassoc] set messagedetail_ntext=convert(nvarchar(MAX), messagedetail);
ALTER TABLE [openidm].[reconassoc] DROP COLUMN [messagedetail];
Exec sp_rename 'reconassoc.messagedetail_ntext', 'messagedetail', 'Column';




