/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

export default {
  // usage examples
  'welcome': 'welcome, the date is {{date, MM/DD/YYYY}}',
  'key2': 'uppercase text: {{text, uppercase}} :done.',
  'introduction': 'I am {{person.name}} and I am {{person.age}} year old.',
  'nest': 'nest $t(welcome) end',
  // dialog messages
  'confirm-deletion': 'Are you sure you want to delete?',
  'confirm-glossary-object-deletion': 'Are you sure you want to delete this glossary object?',
  // other messages
  'changes-not-saved': 'You have unsaved changes.',
  'changes-saved': 'Changes saved.',
  'refresh results': 'Refresh',
  // buttons
  'yes': 'Yes',
  'no': 'No',
  'okay': 'Okay',
  'new': 'New',
  'reload': 'Reload',
  'edit': 'Edit',
  'save': 'Save',
  'delete': 'Delete',
  'cancel': 'Cancel',
  // types
  'string': 'string',
  'boolean': 'boolean',
  'integer': 'integer',
  'id': 'id',
  'managed object id': 'managed object',
  'object': 'object',
  'array': 'array',
  'date string': 'date',
  // glossary specific things
  'glossary object class': 'glossary object class',
  'glossary object class search description': 'The type of glossary object you want to search for or create.',
  'glossary editor': 'glossary editor',
  'glossary.description.class': 'The type of glossary object.',
  'new glossary object': 'New glossary object',
  'edit glossary object': 'Edit {{displayName}}',
  'glossary object results': 'glossary search results',
  'glossary-class-info.object': 'A managed object in IDM, specified by objectId, e.g. a managed role or assignment.',
  'glossary-class-info.identity': 'A managed user property in IDM, e.g. \'jobCode\'.',
  'glossary-class-info.identity-value': 'A value corresponding to a glossary identity object, e.g. a \'jobCode\' value of B435T.',
  'glossary-class-info.system': 'A system connected to IDM (via a Connector), e.g. \'LDAP\'.',
  'glossary-class-info.system-attribute': 'An attribute within an object (such as account or group) in a system, e.g. \'cn\' or \'memberOf\'.',
  'glossary-class-info.system-value': 'A value corresponding to a glossary system attribute, e.g. an \'employeeType\' of \'contractor\'.',
  // accessibility strings
  'confirm-delete-glossary-object-dialog-aria-labelledby': 'confirm-delete-dialog',
  'confirm-delete-glossary-object-dialog-aria-describedby': 'confirm glossary object deletion dialog',
  'glossary-new-key': 'New key',
  'glossary-new-key-aria-label': 'Add new key to glossary object'
};
