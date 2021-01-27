/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
Tool/utility that grabs the current glossary from IDM, converts it to a CSV format, and then writes it to some CSV files.
*/
import groovyx.net.http.RESTClient
import org.apache.commons.io.FileUtils
import java.nio.charset.StandardCharsets;

// global variables and arguments
IDM_URL = args[0];
DEST_DIR_PATH = args[1];
IDM_USERNAME = 'openidm-admin'
IDM_PASSWORD = 'openidm-admin'
HEADERS = [
  "x-openidm-username": IDM_USERNAME,
  "x-openidm-password": IDM_PASSWORD,
  "Content-Type": "application/json",
]

printErr = System.err.&println

def writeFile(String filePath, String string) {
  // Write string to file located at filePath.
  def file = new File(filePath)
  def encoding = StandardCharsets.UTF_8
  FileUtils.writeStringToFile(file, string, encoding)
}

def writeCSVFile(String parentDirPath, String objectClass, String string) {
  def filePath = parentDirPath + '/' + objectClass + '.csv'
  writeFile(filePath, string)
}

def writeCSVFiles(Map csvFileMap) {
  Date todayDate = new Date();
  def dirPath = DEST_DIR_PATH + '/glossary-export-' + todayDate.format('yyyyMMdd-HH.mm.ss')
  (new File(dirPath)).mkdirs()
  csvFileMap.each{ objectClass, csvString ->
    writeCSVFile(dirPath, objectClass, csvString)
  }
}

def idmGet(String path) {
  def client = new RESTClient(IDM_URL)
  def response
  try {
    response = client.get(headers: HEADERS, path: path)
  }
  catch (Exception e) {
    if (!e.hasProperty("response")) {
      printErr("ERROR: Could not connect to provided server")
      e.printStackTrace()
    } else {
      printErr("ERROR: Could not connect to openidm with provided credentials: " + e.response.getData())
    }
    return
  }
  return response.getData().result
}

def getCSVFileMap() {
  def csv = idmGet('/openidm/commons/glossary/exportToCSV')
  return [
    all: csv,
  ]
}

def export() {
  Map csvFileMap = getCSVFileMap()
  writeCSVFiles(csvFileMap)
}

def main() {
  export()
}

main()
