
import org.apache.http.client.HttpClient
import org.forgerock.openicf.connectors.groovy.OperationType
import org.forgerock.openicf.connectors.scriptedrest.ScriptedRESTConfiguration
import org.forgerock.openicf.connectors.scriptedrest.SimpleCRESTFilterVisitor
import org.forgerock.openicf.connectors.scriptedrest.VisitorParameter
import org.identityconnectors.common.logging.Log
import org.identityconnectors.framework.common.objects.Attribute
import org.identityconnectors.framework.common.objects.AttributeUtil
import org.identityconnectors.framework.common.objects.Name
import org.identityconnectors.framework.common.objects.ObjectClass
import org.identityconnectors.framework.common.objects.OperationOptions
import org.identityconnectors.framework.common.objects.SearchResult
import org.identityconnectors.framework.common.objects.Uid
import org.identityconnectors.framework.common.objects.filter.Filter
import org.identityconnectors.framework.common.objects.filter.EqualsFilter

import groovyx.net.http.HTTPBuilder
import static groovyx.net.http.ContentType.URLENC
import static groovyx.net.http.Method.GET
import static groovyx.net.http.ContentType.*

import groovyx.net.http.RESTClient
import org.apache.http.auth.AuthScope
import org.apache.http.auth.UsernamePasswordCredentials
import org.apache.http.client.CredentialsProvider
import org.apache.http.client.protocol.HttpClientContext
import org.apache.http.impl.client.BasicAuthCache
import org.apache.http.impl.client.BasicCredentialsProvider
import org.identityconnectors.common.logging.Log
import org.identityconnectors.common.security.GuardedString
import org.identityconnectors.common.security.SecurityUtil
import org.identityconnectors.framework.common.exceptions.ConnectorSecurityException
import org.identityconnectors.framework.common.exceptions.InvalidCredentialException
import org.identityconnectors.framework.common.objects.ObjectClass
import org.identityconnectors.framework.common.objects.OperationOptions


def operation = operation as OperationType
def configuration = configuration as ScriptedRESTConfiguration
def httpClient = connection as HttpClient
def connection = customizedConnection as RESTClient
def filter = filter as Filter
def log = log as Log
def objectClass = objectClass as ObjectClass
def options = options as OperationOptions
def resultHandler = handler
//
// all atrtibutes
def attributesToGet = options.getAttributesToGet() as String[]



log.info("[PAM - Search] Entering " + operation + " Script")

def SAFE = new ObjectClass("__SAFE__")
def USER = new ObjectClass("__USER__")


def _searchValue = 0
def client = new RESTClient(configuration.serviceAddress)
// Connection with Token
def site = new HTTPBuilder(configuration.serviceAddress)

log.info("[PAM - Search] Password" )
log.info(SecurityUtil.decrypt(configuration.password));
log.info("PAM - Search] IgnoreSSL - Client and Site Object")

client.ignoreSSLIssues();
site.ignoreSSLIssues();
log.info("PAM - Search] IgnoreSSL - Applied")
// just support: LOCAL ACCESS
def response = client.post(
    	path: "/PasswordVault/API/auth/Cyberark/Logon",
        body: [username: configuration.username, password: SecurityUtil.decrypt(configuration.password), concurrentSession: true],
	requestContentType: JSON)

log.info("[PAM - Search] POST /PasswordVault/API/auth/Cyberark/Logon")
def token = response.data;
log.info("[PAM - Search] token =>" + token)
if (filter != null) {
    log.info("[PAM - Search] Filtering...!! " );
    // get value UID, click on User Interface
    _searchValue = AttributeUtil.getStringValue(((EqualsFilter) filter).getAttribute());
    log.info("[PAM - Search] <_searchValue> => " + _searchValue)
    /*
    try {
        // when filter by Id
        //Integer.parseInt(_searchValue); 
    } catch (NumberFormatException ex) {
        log.info('[PAM - Search] Searching by userName');
        _searchValue = '0';
    }
    */
}

log.info("[PAM - Search] objectClass.type " + objectClass.type)

switch (objectClass) {
    case USER:
	    log.info("[PAM - Search] Search USER")
        def _path = '/PasswordVault/api/Users'
        //if(_searchValue instanceof Number)
        //    _searchValue = 0
        if (filter != null)
        {
            if (_searchValue == '0') return;

            if (AttributeUtil.namesEqual(Uid.NAME, "__UID__")) {
                    log.info("_id");
                } else if (AttributeUtil.namesEqual(name, Name.NAME)) {
                    log.info("NAME");
            }

            log.info("[PAM - Search] Search Value: => " + _searchValue);
            _path = '/PasswordVault/api/Users/' + _searchValue;
            // get info
        }
        log.info("[PAM Search] _path => " + _path);
        log.info("[PAM Search] _token to add to request => " + token);
        site.auth.basic "",""
        def searchResult = site.get(
            path: _path,
            contentType: JSON,
            headers: ['Authorization': "${token}"])
            {
                resp, json ->
                log.info("[PAM Search] Retrieve data from USERS")
                if (filter != null) {
                        //
                        log.info("[PAM Search] Retrieve data from UserID => " + json.id.toString())
                        def members = (GetMembers(json.id.toString(), site, token))

                        resultHandler {
                            uid json.id.toString()
                            id json.id.toString()
                            attribute 'userName', json?.username
                            attribute '__NAME__', json?.id.toString()
                            attribute 'uid', json?.id.toString()
                            attribute 'source', json?.source
                            attribute 'userType', json?.userType
                            attribute 'firstName', json['personalDetails'].firstName
                            attribute 'lastName', json['personalDetails'].lastName
                            attribute 'vaultAuthorization', json.vaultAuthorization
                            attribute 'groupMemberShip', members.split(',')
                        }
                } else {
                    log.info("[PAM Search] Retrieve data - No filter")
                    //
                    json.Users.each() { value ->

                        log.info("[PAM Search] User => " + value?.username)
                        resultHandler {
                            uid value.id.toString()
                            id value.id.toString()
                            attribute 'userName', value?.username
                            attribute '__NAME__', value?.id.toString()
                            attribute 'uid', value?.id.toString()
                            attribute 'source', value?.source
                            attribute 'userType', value?.userType
                            attribute 'firstName', value['personalDetails'].firstName
                            attribute 'lastName', value['personalDetails'].lastName
                            attribute 'vaultAuthorization', value?.vaultAuthorization
                        }
                    }
                }
                json
            }
        log.info("[PAM - Search] USER Finished")
	CloseSession(site, token)
        return new SearchResult()

    case SAFE:
        log.info("[PAM - Search] Search SAFE")
        def _path = '/PasswordVault/api/Safes'
        if (filter != null)
        {
            _path = '/PasswordVault/api/Safes/' + _searchValue
        }
        log.info("[PAM - Search] Path => " + _path)
        site.auth.basic "",""
        def searchResult = site.get(
            path: _path,
            contentType: JSON,
            //query: ["filter.folderId" : "true"],
            headers: ['Authorization': "${token}"])
            {
                resp, json ->
                
                if (filter != null) {
                        //
                        log.info("[PAM - Search] Filter SAFES!!! {0}", json)   
                        resultHandler {
                            uid json['SafeName'].toString()
                            id json['SafeName'].toString()
                            attribute 'safeName', json['SafeName'].toString()
                            attribute 'description', json['Description']
                            attribute 'location', json['Location']
                        }

                } else {
                    json.Safes.each() { value ->
                            // each Secret, I need to collect data from their name and path
                            log.info("[PAM - Search] Retrieve data from SAFES =>" + value.SafeUrlId.toString())
                            //
                            resultHandler {
                                uid value.SafeUrlId.toString()
                                //id value.id.toString()
                                attribute 'uid', value.SafeUrlId.toString() 
                                attribute 'safeUrlId', value.SafeUrlId.toString() 
                                attribute 'safeName', value.SafeName.toString()
                                attribute 'description', value.Description.toString()
                                attribute 'location', value.Location.toString()
                            }
                    }
                }
                json
            }
        log.info("[PAM - Search] SAFE Finished")
        CloseSession(site, token)
	return new SearchResult()

    case ObjectClass.ACCOUNT:
	    log.info("[PAM - Search] Search ACCOUNT")
        def _path = '/PasswordVault/api/Accounts'
        //if(_searchValue instanceof Number)
        //    _searchValue = 0
        if (filter != null)
        {
            if (_searchValue == '0') return;

            if (AttributeUtil.namesEqual(Uid.NAME, "__UID__")) {
                    log.info("_id");
                } else if (AttributeUtil.namesEqual(name, Name.NAME)) {
                    log.info("NAME");
            }

            log.info("[PAM - Search] Search Value: => " + _searchValue);
            _path = '/PasswordVault/api/Accounts/' + _searchValue;
            // get info
        }
        log.info("[PAM Search] _path => " + _path);
        site.auth.basic "",""
        def searchResult = site.get(
            path: _path,
            contentType: JSON,
            headers: ['Authorization': "${token}"])
            {
                resp, json ->
                log.info("[PAM Search] Retrieve data from ACCOUNTS")
                if (filter != null) {
                        //
                        resultHandler {
                            uid json.id.toString()
                            id json.id.toString()
                            attribute 'name', json?.name
                            attribute '__NAME__', json?.id.toString()
                            attribute 'uid', json?.id.toString()
                            attribute 'address', json?.address
                            attribute 'safeName', json?.safeName
                            attribute 'secretType', json['secretType']
                        }
                } else {
                    log.info("[PAM Search] Retrieve data - No filter")

                    //
                    json.value.each() { value ->

                        log.info("[PAM Search] User => " + value?.username)
                        resultHandler {
                            uid value.id.toString()
                            id value.id.toString()
                            attribute 'name', value?.name
                            attribute '__NAME__', value?.id.toString()
                            attribute 'uid', value?.id.toString()
                            attribute 'address', value?.address
                            attribute 'safeName', value?.safeName
                            attribute 'secretType', value['secretType']
                        }
                    }
                }
                json
            }
        log.info("[PAM - Search] ACCOUNT Finished")
        CloseSession(site, token)
	return new SearchResult()

    case ObjectClass.GROUP:
	    log.info("[PAM - Search] Search GROUPS")
        def _path = '/PasswordVault/api/UserGroups'
        log.info("[PAM Search] _path => " + _path);
        site.auth.basic "",""
        def searchResult = site.get(
            path: _path,
            contentType: JSON,
            headers: ['Authorization': "${token}"])
            {
                resp, json ->
                log.info("[PAM Search] Retrieve data from GROUPS")
                if (filter != null) {
                        //
                        resultHandler {
                            uid json.id.toString()
                            id data.id.toString()
                            attribute 'id', json?.id
                            attribute 'groupType', json?.groupType
                            attribute 'directory', json?.directory.toString() 
                            attribute 'dn', json?.dn.toString() 
                            attribute 'groupName', json?.groupName
                            attribute 'description', json?.description
                            attribute 'location', json?.location
                        }
                } else {
                    log.info("[PAM Search] Retrieve data - No filter")
                    //
                    json.value.each() { data ->

                        resultHandler {
                            uid data.id.toString()
                            id data.id.toString()
                            attribute 'id', data?.id
                            attribute 'groupType', data?.groupType
                            attribute 'directory', data?.directory.toString() 
                            attribute 'dn', data?.dn.toString() 
                            attribute 'groupName', data?.groupName
                            attribute 'description', data?.description
                            attribute 'location', data?.location
                        }
                    }
                }
                json
            }
        log.info("[PAM - Search] GROUP Finished")
        CloseSession(site, token)
	return new SearchResult()
}

def CloseSession(site, token){
    // Close sesion
    log.info("[PAM - Search] Close session....")
    site.post(
        path: '/PasswordVault/API/auth/Logoff',
        contentType: JSON,
        headers: ['Authorization': "${token}"])
    log.info("[PAM - Search] Closed")
}

def GetToken(){

    def client = new RESTClient(configuration.serviceAddress)
    //
    def response = client.post(
        path: "/PasswordVault/API/auth/Cyberark/Logon",
        body: [username: configuration.username, password: SecurityUtil.decrypt(configuration.password), concurrentSession: true],
        requestContentType: JSON)
    // token
    return response.data   
}

def GetFolderPermissions(uidFolder, token){
        //
    log.info ("[PAM] GetFolderPermissions => uidFolder =>" + uidFolder)
    // Connection with Token
    def site = new HTTPBuilder(configuration.serviceAddress)
    log.info ("[PAM] GetFolderPermissions => configuration.serviceAddress =>" + configuration.serviceAddress)
    def folderPermissions = [] 
    String strfolderPermissions =''
        def _path = '/SecretServer/api/v1/folder-permissions'
        site.auth.basic "",""
        def searchResult = site.get(
            path: _path,
            query: ["filter.folderId" : uidFolder],
            contentType: JSON,
            headers: ['Authorization': "Bearer ${token}"])
            {
                resp, json ->
                    json.records.each() { _folderPermissions ->
                        // array with permissions
                        folderPermissions << [
                            groupId : _folderPermissions.groupId.toString(),
                            groupName : _folderPermissions.groupName.toString(),
                            userId: _folderPermissions.userId.toString(),
                            userName: _folderPermissions.userName.toString(),
                            folderAccessRoleName: _folderPermissions.folderAccessRoleName.toString(),
                            secretAccessRoleName: _folderPermissions.secretAccessRoleName.toString(),
                            knowAs: _folderPermissions.knowAs.toString()
                        ]
                        if (!_folderPermissions.groupId){
                            strfolderPermissions = strfolderPermissions + "USER:" +  _folderPermissions.userId.toString() + ":" + _folderPermissions.userName.toString()
                        } else {
                            strfolderPermissions = strfolderPermissions + "GROUP:" + _folderPermissions.groupId + ":" + _folderPermissions.groupName 
                        }
                        //
                        strfolderPermissions = strfolderPermissions + ":" + _folderPermissions.folderAccessRoleName + ":" + _folderPermissions.secretAccessRoleName + ","
                        log.info(strfolderPermissions)
                json
            }
    //
        if (strfolderPermissions !='') {
            log.info ("strfolderPermissions =>" + strfolderPermissions)
            member = strfolderPermissions.substring(0, strfolderPermissions.length()-1)
            log.info ("strfolderPermissions =>" + strfolderPermissions)
        }
            }
    return strfolderPermissions
}

def GetFolderData(uidFolder, token){
    //
    log.info ("[PAM] GetFolderData => uidFolder =>" + uidFolder)
    // Connection with Token
    def site = new HTTPBuilder(configuration.serviceAddress)
    log.info ("GetFolderData => configuration.serviceAddress =>" + configuration.serviceAddress)
    def folder = [] 
    String folderData = ''
        def _path = '/SecretServer/api/v1/folders/' + uidFolder
        site.auth.basic "",""
        def searchResult = site.get(
            path: _path,
            contentType: JSON,

            headers: ['Authorization': "Bearer ${token}"])
            {
                resp, json ->
                        folder << [
                            uId : json.id.toString(),
                            folderName : json.folderName,
                            folderPath : json.folderPath
                        ]
                        //folderData = folderData + json.folderName + ":" + json.folderPath + ","
                //json
            }
    return folder //folderData  
}

def GetMembers(UidUser, site, token){
    // Get all groups that user is Member
    log.info ("[PAM] GetMembers =>" + UidUser)
    def members = [] 
    String member = ''
    def _path = '/PasswordVault/api/Users/' + UidUser
    log.info ("[PAM] GetMembers.Path =>" + _path)
        site.auth.basic "",""
        def searchResult = site.get(
            path: _path,
            contentType: JSON,
            headers: ['Authorization': "${token}"])
            {
                resp, json ->
                    log.info ("[PAM] groupsMembership")
                    json.groupsMembership.each() { group ->
                        //
                        members << [
                            uid : group.groupID.toString(),
                            groupName : group.groupName.toString(),
                            groupType: group.groupType
                        ]
                        member = member + group.groupID.toString() + ":" + group.groupName.toString() + ","
                json
            }
    // println members
    // retrieve members
    //return (members)
    if (member !='') {
        log.info ("member =>" + member)
        member = member.substring(0, member.length()-1)
        log.info ("member =>" + member)
    }
    return member
} 
}

