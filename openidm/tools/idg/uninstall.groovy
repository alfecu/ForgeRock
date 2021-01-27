/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
import org.apache.http.client.methods.HttpEntityEnclosingRequestBase
import groovyx.net.http.HTTPBuilder.RequestConfigDelegate
import groovy.json.JsonSlurper
import groovy.json.JsonBuilder
import groovyx.net.http.RESTClient
import groovyx.net.http.ContentType
import org.apache.ibatis.jdbc.ScriptRunner
import java.sql.DriverManager
import java.io.BufferedReader
import java.io.FileReader
import org.apache.commons.io.FileUtils
import org.apache.commons.io.filefilter.TrueFileFilter

openidm_path = args[0]
openidm_username = args[1]
openidm_password = args[2]
openidm_url = args[3]
openidm_version = Float.parseFloat(args[4])
project_path = args[5]

def printErr = System.err.&println

def dateString = new Date().format('yyyyMMddhhmm')

//Test openidm connection
println("Testing connection to IDM ...")
def client = new RESTClient(openidm_url + "/openidm/info/login")
client.ignoreSSLIssues()
try{
  def resp = client.get(headers : ["x-openidm-username":openidm_username, "x-openidm-password":openidm_password])
} catch (Exception e){
  if (!e.hasProperty("response")){
    printErr("ERROR: Could not connect to provided server")
    e.printStackTrace()
  } else {
    printErr("ERROR: Could not connect to openidm with provided credentials: " + e.response.getData())
  }
  return
}
println("Successfully connected to IDM.")

//Delete scheduled IDG jobs
println "Deleting IDG scheduled jobs"
client = new RESTClient(openidm_url + "/openidm/scheduler/job?_queryFilter=true")
client.ignoreSSLIssues()
try{
  def resp = client.get(headers : ["x-openidm-username":openidm_username, "x-openidm-password":openidm_password])
  def jsonMap = resp.getData().result
  for ( Object job : jsonMap){
    if(job.invokeContext.script && job.invokeContext.script.file && job.invokeContext.script.file.startsWith("script/idg/")){
      def delClient = new RESTClient(openidm_url + "/openidm/scheduler/job/" + job._id)
      delClient.ignoreSSLIssues()
      def delResp = delClient.delete(headers : ["x-openidm-username":openidm_username, "x-openidm-password":openidm_password])
    }
  }
} catch (Exception e){
  if (!e.hasProperty("response")){
    printErr("ERROR: Could not connect to provided server")
    e.printStackTrace()
  } else {
    printErr("ERROR: Could not connect to openidm with provided credentials: " + e.response.getData())
  }
  return
}
println "Done deleting scheduled jobs"

//Delete licenses
println "Deleting legal-notices from IDM ..."
FileUtils.deleteQuietly(new File(openidm_path + '/legal-notices/third-parth-licenses/ThirdPartyCopyright.txt'))

//Delete select conf files
println "Deleting IDG conf files from IDM ..."
FileUtils.deleteQuietly(new File(project_path + '/conf/displayableMetadata.json'))
FileUtils.deleteQuietly(new File(project_path + '/conf/governanceTemplates.json'))
FileUtils.deleteQuietly(new File(project_path + '/conf/reactivePolicyScan.json'))
FileUtils.deleteQuietly(new File(project_path + '/conf/schedule-script_adminDashboard.json'))
FileUtils.deleteQuietly(new File(project_path + '/conf/schedule-script_escalateObjectCert.json'))
FileUtils.deleteQuietly(new File(project_path + '/conf/schedule-script_escalateUserCert.json'))
FileUtils.deleteQuietly(new File(project_path + '/conf/schedule-script_escalationPolicyViolations.json'))
FileUtils.deleteQuietly(new File(project_path + '/conf/schedule-script_expirationObjectCert.json'))
FileUtils.deleteQuietly(new File(project_path + '/conf/schedule-script_expirationPolicyExceptions.json'))
FileUtils.deleteQuietly(new File(project_path + '/conf/schedule-script_expirationPolicyViolations.json'))
FileUtils.deleteQuietly(new File(project_path + '/conf/schedule-script_expirationUserCert.json'))
FileUtils.deleteQuietly(new File(project_path + '/conf/systemSettings.json'))
FileUtils.deleteQuietly(new File(project_path + '/conf/ui.context-governance.json'))
def confFiles = FileUtils.listFiles(new File(project_path + '/conf'),TrueFileFilter.INSTANCE,TrueFileFilter.INSTANCE)
for (File tempFile : confFiles){
  if(tempFile.getName().startsWith('endpoint-idg-')){
    FileUtils.deleteQuietly(tempFile)
  }
}

//Delete IDG script files
println "Deleting IDG script files from IDM ..."
FileUtils.deleteQuietly(new File(project_path + '/script/idg'))
println "Done deleting script files from IDM"

//Delete select workflow files
println "Deleting IDG workflow files into IDM ..."
FileUtils.deleteQuietly(new File(project_path + '/workflow/entitlement-remediation.bpmn20'))
println "Done deleting workflow files from IDM"

//Delete UI files
println "Deleting /governance from IDM ..."
FileUtils.deleteQuietly(new File(openidm_path + '/governance'))
println "Done deleting /governance from IDM"

def jsonSlurper = new JsonSlurper()

println "Backing up policy.json"
try {
  FileUtils.copyFile(new File(project_path + '/conf/policy.json'), new File(project_path + '/backup/conf/policy.json.pre_IDG_uninstall-'+dateString), true)
  println "Done backing up policy.json file"
} catch (IOException) {
  println("Copy failed")
}
println "Removing custom policies"
File policyFile = new File(project_path + "/conf/policy.json")
def polObj = jsonSlurper.parse(policyFile)
polObj.get("additionalFiles").remove("script/idg/certPolicy.js")
polObj.get("additionalFiles").remove("script/idg/policyValidation.js")
policyFile.write(new JsonBuilder(polObj).toPrettyString())
println "Done removing custom policies"

//Delete glossary import/export tool
println "Deleting Glossary Import/Export Scripts ..."
FileUtils.deleteQuietly(new File(openidm_path + '/tools/idg/glossary-import-tool'))
FileUtils.deleteQuietly(new File(openidm_path + '/tools/idg/glossary-export-tool'))
println "Glossary Import/Export scripts deleted from tools directory"

FileUtils.forceDeleteOnExit(new File(openidm_path + '/tools/idg'))
println "IDG successfully uninstalled. Uninstall scripts will be removed."
