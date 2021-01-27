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

if [ -z $import_path ]
then
  printf "\nEnter path for glossary file to import:\n"
  read import_path
elif [ -z $import_path ]; then
  (>&2 echo "Error: import path to glossary file is required.")
  exit
fi

if [ ! -f $import_path ]; then
  (>&2 echo "Error: import path is not a valid file.")
  exit
fi

if ! [[ $import_path == *.csv || $import_path == *.CSV ]] ; then
  (>&2 echo "Error: path is not a CSV file.")
  exit
fi

if [ -z $username ]
then
  printf "\nEnter admin username:\n"
  read username
elif [ -z $username ]; then
  (>&2 echo "Error: admin username required.")
  exit
fi


if [ -z $password ]
then
  printf "\nEnter admin password:\n"
  read password
elif [ -z $password ]; then
  (>&2 echo "Error: admin password is required.")
  exit
fi

java -cp $openidm_location/bundle/*:$openidm_location/lib/*:./commons-csv-1.7.jar \
  groovy.lang.GroovyShell \
  import_glossary.groovy \
  $openidm_location \
  $import_path \
  $username \
  $password
