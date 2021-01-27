#!/bin/bash

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

java -cp $openidm_location/bundle/*:$openidm_location/lib/* \
  groovy.lang.GroovyShell \
  export-glossary.groovy \
  $openidm_location \
  $dest_path
