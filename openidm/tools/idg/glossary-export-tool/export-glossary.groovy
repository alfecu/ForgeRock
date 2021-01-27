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
import org.apache.ibatis.jdbc.ScriptRunner
import java.sql.DriverManager
import java.io.BufferedReader
import java.io.FileReader
import org.apache.commons.io.FileUtils
import org.apache.commons.io.filefilter.TrueFileFilter

String openidmLoc = args[0];
String destDir = args[1];

def jsonSlurper = new JsonSlurper()
             
try {
  reader = new BufferedReader(
                 new InputStreamReader(
                   new FileInputStream(openidmLoc + '/conf/glossary-1.json'),
                   'UTF-8'
                 )
               );
} catch(all) {
  println('Nothing to export. Exiting.');
  return;
}

Map glossary = jsonSlurper.parse(reader);

String csvHeaders = 'Type,Key,Key Value,Metadata Key,Metadata Value';
rows = [];
rows.add(csvHeaders);

glossary.each { type, val ->
  val.each { category, _map -> 
    String basePath = type + '.' + category;

    switch (type) {
      case 'managed':
        String exportKey = _map.exportKey;

        _map.each { objTypeVal, submap -> 
          if (objTypeVal == 'exportKey') {
            return;
          }
          String partialRow = basePath + ',' + exportKey + ',' + _escape(objTypeVal) + ',';

          submap.each { managedObjID, metaArray ->
            _createRowForEachArrayElem(partialRow, metaArray);
          }
        }
      break;
      case 'identity':
        _map.each { userAttr, metaArray -> 
          if (userAttr == 'certifiable' && metaArray == true) {
            rows.push(basePath + ',certifiable,true, ,')
            return;
          }
          String partialRow = basePath + ', ,' + _escape(userAttr) + ',';

          _createRowForEachArrayElem(partialRow, metaArray);
        }
      break;
      case 'system':
        _map.each { propName, submap ->
          if (propName == 'riskLevel') {
            rows.push(basePath + ',riskLevel,' + submap + ', ,')
            return;
          }
          if (propName == 'certifiable' && submap == true) {
            rows.push(basePath + ',certifiable,true, ,')
            return;
          }
          if (propName == 'entitlementOwner' && submap != '') {
            rows.push(basePath + ',entitlementOwner,' + submap + ', ,')
            return;
          }
          submap.each { attrName, submap1 ->
            String type1 = basePath + '.' + propName + '.' + attrName;
            submap1.each { metaKey, metaArray -> 
              if (metaKey == 'type') {
                rows.push(type1 + ',type,' + metaArray + ', ,')
                return;
              }
              if (metaKey == 'order') {
                rows.push(type1 + ',order,' + metaArray + ', ,')
                return;
              }
              String partialRow = type1 + ', ,' +  _escape(metaKey) + ',';

              _createRowForEachArrayElem(partialRow, metaArray);
            }
          }
        }
      break;
      default:
        println('No handler for type ' + type);
    }
  }//val.each
}

Date todayDate = new Date();


if (rows.size() > 0) {
  new File(destDir + '/glossary-export-' + todayDate.format('yyyyMMdd-HH.mm.ss')  +'.csv').withWriter('utf-8') { writer ->
    rows.each { row ->
      writer.writeLine row;
    }
  }
  println('\nGlossary successfully exported to: ' + destDir);
} else {
  println('No data in glossary. Nothing to export.');
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * HELPER FUNCTIONS
 * ~~~~~~~~~~~~~~~~~~~~~~~~~ */
void _createRowForEachArrayElem(String partialRow, List metaArray) {
  metaArray.each { elem -> 
    def _keys = elem.keySet();
    rows.push(partialRow + _escape(_keys[0]) + ',' + _escape(elem[_keys[0]]));
  }
}

String _escape(Object obj) {
  String s = obj.toString();
  s = s.replace('"', '""');
  return '"' + s + '"';
}
