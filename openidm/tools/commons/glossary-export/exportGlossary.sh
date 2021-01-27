#!/bin/bash

if [ -z $openidm_url ]
then
  echo "URL of your OpenIDM Installation (e.g. http://10.0.51.106:9080):"
  read openidm_url
fi

if [ -z $openidm_location ]
then
  echo "Location of your OpenIDM Installation (e.g. /opt/forgerock/openidm):"
  read openidm_location
fi

if [ ! -f "$openidm_location/conf/repo.jdbc.json" ]; then
  (>&2 echo "ERROR: No valid OpenIDM installation found at $openidm_location.  Exiting.")
  exit
elif [ -z $openidm_location ]; then
  (>&2 echo "ERROR: OpenIDM Installation Location is required.  Exiting.")
  exit
fi

if [ -z $dest_path ]
then
  printf "\nEnter destination directory for glossary export:\n"
  read dest_path
elif [ -z $dest_path ]; then
  (>&2 echo "Error: destination path is required")
  exit
fi

if [ ! -d "$dest_path" ]; then
  (>&2 echo "Error: destination is not a valid directory")
  exit
fi

java -cp $openidm_location/bundle/*:$openidm_location/lib/*:$openidm_location/lib/http-builder-0.7.1.jar:$openidm_location/bundle/mybatis-3.2.5.jar:$openidm_location/bundle/mysql-connector-java-5.1.39-bin.jar:$openidm_location/bundle/groovy-all-2.2.2.jar \
  groovy.lang.GroovyShell \
  exportGlossary.groovy \
  $openidm_url \
  $dest_path
