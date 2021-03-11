
import static groovyx.net.http.ContentType.JSON

import org.apache.http.auth.AuthScope
import org.apache.http.auth.UsernamePasswordCredentials
import org.apache.http.client.CredentialsProvider
import org.apache.http.client.protocol.HttpClientContext

import groovy.json.JsonBuilder
import groovyx.net.http.HTTPBuilder
import static groovyx.net.http.ContentType.URLENC
import static groovyx.net.http.Method.POST
import static groovyx.net.http.ContentType.*

import groovyx.net.http.RESTClient
import org.apache.http.client.HttpClient
import org.forgerock.openicf.connectors.groovy.OperationType
import org.forgerock.openicf.connectors.scriptedrest.ScriptedRESTConfiguration
import org.identityconnectors.common.logging.Log
import org.identityconnectors.framework.common.objects.Attribute
import org.identityconnectors.framework.common.objects.AttributesAccessor
import org.identityconnectors.framework.common.objects.ObjectClass
import org.identityconnectors.framework.common.objects.OperationOptions
import org.identityconnectors.common.security.GuardedString
import org.identityconnectors.common.security.SecurityUtil

def operation = operation as OperationType
def createAttributes = new AttributesAccessor(attributes as Set<Attribute>)
def configuration = configuration as ScriptedRESTConfiguration
def httpClient = connection as HttpClient
def connection = customizedConnection as RESTClient
//
def name = id as String

def log = log as Log
def objectClass = objectClass as ObjectClass
def options = options as OperationOptions

log.info("Entering " + operation + " Script");

def client = new RESTClient(configuration.serviceAddress)
// Connection with Token
def site = new HTTPBuilder(configuration.serviceAddress)
client.ignoreSSLIssues();
site.ignoreSSLIssues();
// just support: LOCAL ACCESS
def response = client.post(
    path: "/PasswordVault/API/auth/Cyberark/Logon",
    body: [username: configuration.username, password: SecurityUtil.decrypt(configuration.password), concurrentSession: true],
    requestContentType: JSON)

def token = response.data;

def USER = new ObjectClass("__USER__")

log.info("[PAM - CreateScript] objectClass.type " + objectClass.type)


switch (objectClass) {
    case USER:
        log.info("[PAM Create] Creating an USER to PAM");
        log.info("[PAM Create] userName:" + name)
        def builder = new JsonBuilder()
        builder{
            username name
            initialPassword "Frdp-2010*"
            personalDetails {
                firstName (createAttributes.hasAttribute("firstName") ? createAttributes.findString("firstName") : '')
                lastName (createAttributes.hasAttribute("lastName") ? createAttributes.findString("lastName") : '')
            }            
enableUser (createAttributes.hasAttribute("enableUser") ? createAttributes.findString("enableUser") : true)
            changePasswordOnTheNextLogon (createAttributes.hasAttribute("changePasswordOnTheNextLogon") ? createAttributes.findString("changePasswordOnTheNextLogon") : false)    

        }
        log.info("[PAM Create] payload")
        log.info("[PAM Create] payload {0}", builder.toString());           
	def _path = '/PasswordVault/api/Users'
        site.auth.basic "",""

        def user = site.post(
            path: _path,
            contentType: JSON,
            requestContentType: JSON,
            headers: ['Authorization': "${token}"],
            body: builder.toString() );
        
        // get ID from CyberArk   
        log.info("[PAM] User.Id =>" + user.id.toString());
	CloseSession(site, token)
        return user.id.toString();

        break;
}
//return name
return "41"

def CloseSession(site, token){
    // Close sesion
    log.info("[PAM - Search] Close session....")
    site.post(
        path: '/PasswordVault/API/auth/Logoff',
        contentType: JSON,
        headers: ['Authorization': "${token}"])
    log.info("[PAM - Search] Closed")
}
