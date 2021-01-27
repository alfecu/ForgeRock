#!/bin/bash

for var in "$@"
do
  case $var in
    --help|-h)
      echo "Access Review 3.0 Uninstaller"
      echo "To use a properties file, use the argument -p or --properties /location/of/properties/file."
      echo "Otherwise, the uninstaller will ask for needed values."
      exit
    ;;
    --properties|--props|-p)
      properties_next="true"
    ;;
    *)
      if [ "$properties_next" = "true" ]; then
        if [ ! -f $var ]; then
          (>&2 echo "ERROR: The file $var does not exist or is not valid.  Exiting.")
          exit
        fi
        properties_next="false"
        . $var
      else
        (>&2 echo "ERROR: Unrecognized argument $var. Use -h or --help for help.")
        exit
      fi
    ;;
  esac
done

if [ -z $openidm_location ]
then
  echo "Location of your IDM Installation (e.g. /opt/forgerock/openidm):"
  read openidm_location
fi

if [ -z $openidm_location ]; then
  (>&2 echo "ERROR: IDM Installation Location is required.  Exiting.")
  exit
elif [ ! -f "$openidm_location/bin/openidm.jar" ]; then
  (>&2 echo "ERROR: No valid IDM installation found at $openidm_location.  Exiting.")
  exit
fi

if [ -z $project_location ]
then
  echo "Location of your IDM project directory. If left blank, will use IDM installation directory. (e.g. /opt/forgerock/openidm):"
  read project_location
fi

if [ -z $project_location ]; then
  project_location=$openidm_location
fi
if [ ! -f "$openidm_location/conf/repo.jdbc.json" ]; then
  (>&2 echo "ERROR: No valid IDM installation found at $project_location.  Exiting.")
  exit
fi

if [ -z "$openidm_url" ]
then
  echo "IDM URL (e.g. http://localhost:8080)"
  read openidm_url
  if [ -z $openidm_url ]; then
    (>&2 echo "ERROR: IDM URL is required.  Exiting.")
    exit
  fi
fi

if [ -z "$openidm_admin" ]
then
  echo "IDM Admin User:"
  read openidm_admin
  if [ -z $openidm_admin ]; then
    (>&2 echo "ERROR: IDM Admin is required.  Exiting.")
    exit
  fi
fi

if [ -z "$openidm_admin_password" ]
then
  echo "IDM Admin Password:"
  read openidm_admin_password
  if [ -z $openidm_admin_password ]; then
    (>&2 echo "ERROR: IDM Admin Password is required.  Exiting.")
    exit
  fi
fi


if [ -z $openidm_version ]
then
  echo "x.x Version of IDM Installation (e.g. 5.0):"
  read openidm_version
fi

java -cp $openidm_location/bundle/*:$openidm_location/lib/* \
  groovy.lang.GroovyShell \
  uninstall.groovy \
  $openidm_location \
  $openidm_admin \
  $openidm_admin_password \
  $openidm_url \
  $openidm_version \
  $project_location
