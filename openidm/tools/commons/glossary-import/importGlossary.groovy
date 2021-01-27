/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
Tool/utility that grabs the current Commons glossary from IDM, converts it to a CSV format, and then writes it to some CSV files.
*/
import groovyx.net.http.RESTClient
import groovyx.net.http.ContentType
import org.apache.commons.io.FileUtils
import java.nio.charset.StandardCharsets

// variables and arguments
IDM_URL = args[0];
SRC_FILE_PATH = args[1];
IDM_USERNAME = 'openidm-admin'
IDM_PASSWORD = 'openidm-admin'
HEADERS = [
  "x-openidm-username": IDM_USERNAME,
  "x-openidm-password": IDM_PASSWORD,
]

String readFile(String filePath) {
  // Read string from file located at filePath.
  def file = new File(filePath)
  def encoding = StandardCharsets.UTF_8
  def string = FileUtils.readFileToString(file, encoding)
  return string
}

def idmPost(String path, Map body) {
  def client = new RESTClient(IDM_URL)
  def response
  try {
    response = client.post(headers: HEADERS, path: path, body: body, requestContentType: ContentType.JSON)
  }
  catch (Exception e) {
    if (!e.hasProperty("response")) {
      // ironically, printErr was throwing an error, so I had to use println alone...
      println("ERROR: Could not connect to provided server")
      e.printStackTrace()
    } else {
      println("ERROR IN RESPONSE: " + e.response.getData())
    }
    return
  }
  return response.getData().result
}

def importCSVString(String csvString) {
  Map body = [csvString: csvString];
  idmPost('/openidm/commons/glossary/importFromCSV', body);
}

// `import` is a groovy token and cannot be used as a variable name
def _import() {
  String csvString = readFile(SRC_FILE_PATH)
  importCSVString(csvString)
}

def main() {
  _import()
}

main()
