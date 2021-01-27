/*
 * Copyright 2016-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
import groovy.json.*
import groovyx.net.http.RESTClient
import groovyx.net.http.ContentType
import static groovyx.net.http.ContentType.JSON
import org.apache.ibatis.jdbc.ScriptRunner
import java.sql.DriverManager
import java.io.BufferedReader
import java.io.FileReader
import java.nio.file.Paths
import java.nio.file.Files
import org.apache.commons.io.FileUtils
import org.apache.commons.io.filefilter.TrueFileFilter
import org.apache.commons.csv.*

String openidmLoc = args[0];
String importFilePath = args[1];
String username = args[2];
String password = args[3];

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  Get Http port from boot.properties file
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
String bootPropsPath = openidmLoc.endsWith('/') ? openidmLoc + '' : openidmLoc + '/';

if (Files.exists(Paths.get(bootPropsPath, "resolver/"))) {
  bootPropsPath += "resolver/boot.properties";
} else {
  bootPropsPath += "conf/boot/boot.properties";
}

def bootProperties = new FileReader(bootPropsPath);
def bootPropsReader = new BufferedReader(bootProperties);
String httpPortLine = bootPropsReader.readLine();
String httpPort = httpPortLine - 'openidm.port.http=';

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Check if it's valid glossary file
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
try {
  inputFile = new FileReader(importFilePath);
  bufferReader = new BufferedReader(inputFile);
} catch(all) {
  println('Error reading file. Make sure path is a valid CSV file.');
  return;
}

String validHeaders = 'Type,Key,Key Value,Metadata Key,Metadata Value';
String firstLine = bufferReader.readLine();

if (firstLine != validHeaders) {
  println('File is not a valid glossary. Headers do not match.');
  return;
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  Check if OpenIDM is running, if not, display error and exit.
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
OpenIDM= new RESTClient('http://127.0.0.1:' + httpPort +'/openidm/');
OpenIDM.headers = ['x-openidm-username':username, 'x-openidm-password':password];

try {
  OpenIDM.get(path: 'info/login');
} catch(Exception e) {
  println('OpenIDM is not running or invalid credentials provided. Exiting.');
  return;
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  Check if glossary already exists.
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
def liveGlossary = null;
try {
  def res = OpenIDM.get(path: 'config/glossary/1');
  liveGlossary = res.data;
} catch(all) { /* glossary does not exist. */ }

boolean liveGlossaryExists = false;
if (liveGlossary instanceof Map) {
  liveGlossaryExists = true;
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  Read rows and set metadata values into new glossary.
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
Map newGlossary = [:];

String[] headers = validHeaders.split(',');
def input = new FileReader(importFilePath);

def parsedRows = CSVFormat.DEFAULT
  .withHeader(headers)
  .withFirstRecordAsHeader()
  .parse(input);

def prevFilter = null;
def prevResult = null;

println('\nProcessing...\n');

for (CSVRecord row in parsedRows) {
  String path = row.get('Type');
  List pathSections = path.tokenize('.');
  int pathSectionsSize = pathSections.size();

  String metaKey = row.get('Metadata Key');
  Map metaObj = metaKey != 'riskLevel' ? 
    [ (metaKey): row.get('Metadata Value') ] :
    [ (metaKey): Integer.parseInt(row.get('Metadata Value')) ] ;
  def _path = path.replace('.', '~%^~');
  String targetPath = _path + '~%^~' + row.get('Key Value');

  if (path.contains('identity')) {
    if (pathSectionsSize != 2) {
      PARSE_ERROR(row, 'Type column does not have valid format.');
      return;
    }
    _key = row.get('Key');
    if (_key == null || (_key instanceof String && _key == ' ')) {
      _set('~%^~', newGlossary, targetPath, metaObj, true);
    } else {
      // Setting certifiable to true for this attribute
      targetPath = _path + '~%^~' + row.get('Key');
      _set('~%^~', newGlossary, targetPath, true, true);
    }
  }
  else if (path.contains('managed')) {
    if (pathSectionsSize != 2) {
      PARSE_ERROR(row, 'Type column does not have valid format.');
      return;
    }

    // NOTE: make sure "Key" and "Key Value" have the same amount of delimiters or EXIT.
    def _key = row.get('Key');
    def _keyValue = row.get('Key Value');
    int keyDelims = _key.findAll({ it -> it == '|'}).size();
    int keyValueDelims = _keyValue.findAll({ it -> it == '|'}).size();

    if (keyDelims != keyValueDelims) {
      PARSE_ERROR(row, 'Key and Key Value columns do not have same amount of delimiters.');
      return;
    }

    // NOTE: if glossary exists make sure "exportKey" value matches import file "Key" col
    if (liveGlossaryExists) {
      def liveExportKey = _get(liveGlossary, path + '.exportKey');
      if (liveExportKey instanceof String && liveExportKey.size() > 1) {
        if (_key != liveExportKey) {
          PARSE_ERROR(row, 'current exportKey does not match import file exportKey.');
          return;
        }
      }
    }

    def _keyTokens = _key.tokenize('|');
    def _keyValueTokens = _keyValue.tokenize('|');

    // NOTE: build queryFilter.
    def filter = _buildQuery(_keyTokens, _keyValueTokens);

    // NOTE: check if queryFilter is same as prev queryFilter, if so, use prevResult.
    if (filter == prevFilter) {
      def targetPathWithId = targetPath + '~%^~' + prevResult.result[0]['_id'];
      _set('~%^~', newGlossary, targetPathWithId, metaObj, true);
    }
    else {
      def queryPath = path.replace('.', '/');
      def result = null;

      // NOTE: Fetch data for managed object with queryFilter
      try {
        def res = OpenIDM.get(path: queryPath, query: [_queryFilter: filter]);
        result = res.data;
      } catch(Exception e) {
        println(e.toString());
        PARSE_ERROR(row, 'could not fetch data for managed object.');
        return;
      }

      // NOTE: if more than 1 record returned, EXIT.
      int recordsFound = result.containsKey('result') &&
                         result.result instanceof List ? result.result.size() : 0;
      if (recordsFound > 1) {
        PARSE_ERROR(row, 'ambiguous data in database for row.');
        return;
      }

      if (recordsFound == 0) {
        continue;
      }

      // NOTE: store META for ID of record in result fetched.
      def targetPathWithId = targetPath + '~%^~' + result.result[0]['_id'];
      _set('~%^~', newGlossary, targetPathWithId, metaObj, true);

      // NOTE: set exportKey
      if (_get(newGlossary, path + '.exportKey') == null) {
        _set('~%^~', newGlossary, _path + '~%^~exportKey', _key, true);
      }

      // NOTE: update previous filter and result
      prevFilter = filter;
      prevResult = result;
    }
  }
  else if (path.contains('system')) {
    if (pathSectionsSize == 4) {
      _key = row.get('Key');
      if (_key == null || (_key instanceof String && _key == ' ')) {
        _set('~%^~', newGlossary, targetPath, metaObj, true);
      } else {  
        // Set non-metadata attributes (type, order)
        targetPath = _path + '~%^~' + row.get('Key');
        _set('~%^~', newGlossary, targetPath, row.get('Key Value'), true);
      }
    } else if (pathSectionsSize == 2) {
      _key = row.get('Key');
      targetPath = _path + '~%^~' + _key;
      def _keyValue = _key != 'riskLevel' ? row.get('Key Value') : Integer.parseInt(row.get('Key Value'));
      _set('~%^~', newGlossary, targetPath, _keyValue, true);
    } else {
      PARSE_ERROR(row, 'Type column does not have valid format.');
      return;
    }
  }
}

// NOTE: save glossary to config file (if glossary exists, merge new with old).
if (liveGlossaryExists) {
  newGlossary = mergeMaps(newGlossary, liveGlossary)
}

try {
  OpenIDM.put(path: 'config/glossary/1', body: newGlossary, contentType: JSON);
  println('SUCCESS.');
} catch(Exception e) {
  println('ERROR: could not complete importing new glossary data');
  throw e;
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`
 * HELPER FUNCTIONS
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
String _buildQuery(List keyTokens, List keyValueTokens) {
  def filter = "";
  def lastKey = keyTokens.size() - 1;

  keyTokens.eachWithIndex { key, i ->
    def val = (keyValueTokens[i] instanceof String && keyValueTokens[i].size() > 0) ? keyValueTokens[i] : "";
    if (i == lastKey) {
      filter += key + ' eq "' + val  + '"';
    } else {
      filter += key + ' eq "' + val + '" and ';
    }
  }
  return filter;
}

void PARSE_ERROR(CSVRecord row, msg) {
  println('\nError: ' + msg);
  println('Failed at row ' + (row.recordNumber + 1) + ': ' + row.values.toString());
  println('Exiting.\n');
}

/**
 * @param object: Map of objects
 * @param property: dotted path to target
 */
def _get(object, String path) {
  path.tokenize('.').inject object, { obj, prop ->
    if (obj != null) {
      obj[prop]
    }
  }
}

/**
 * @param String: delimiter to split path at
 * @param object: Map of objects
 * @param path: dotted string path to Id for metadata
 * @param data: key,value Map to be added to path
 * @param create: true|false defines whether if path should be created if not present
 */
void _set(String delimiter, Map object, String path, data, boolean create) {
  def _tokens = path.tokenize(delimiter);
  String lastProp = _tokens[_tokens.size() - 1];

  _tokens.inject object, { obj, prop ->
    if (obj[prop] instanceof Map) {
      return obj[prop]
    }
    else if (obj[prop] instanceof List) {
      return obj[prop].add(data);
    }
    if (create == true) {
      if (lastProp == prop) {
        return obj[prop] = data instanceof Map ? [ data ] : data;
      }
      return obj[prop] = [:];
    }
    return obj;
  }
}


/**
 * Deeply merges the contents of each Map in sources, merging from
 * "right to left" and returning the merged Map.
 *
 * Mimics 'extend()' functions often seen in JavaScript libraries.
 * Any specific Map implementations (e.g. TreeMap, LinkedHashMap)
 * are not guaranteed to be retained. The ordering of the keys in
 * the result Map is not guaranteed. Only nested maps will be
 * merged; primitives, objects, and other collection types will be
 * overwritten.
 * The source maps will not be modified.
 * gist.github.com/robhruska/4612278
 */
Map mergeMaps(Map[] sources) {
  if (sources.length == 0) return [:]
  if (sources.length == 1) return sources[0]

  sources.inject([:]) { result, source ->
    source.each { k, v ->
        result[k] = result[k] instanceof Map ? mergeMaps(result[k], v) : v
    }
    result
  }
}

/*
 * For debugging purposes only
 */
void showJson(map) {
  def json = new groovy.json.JsonBuilder();
  json map;
  println groovy.json.JsonOutput.prettyPrint(json.toString());
}
