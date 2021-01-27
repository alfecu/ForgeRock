@echo off

setlocal

if "%openidm_location%"=="" set /P openidm_location="Location of your OpenIDM Installation (e.g. C:\forgerock\openidm): "
if NOT EXIST "%openidm_location%\conf\repo.jdbc.json" (
  @echo Error: No valid OpenIDM installation found at %openidm_location%. Exiting.
  exit /B
)

if "%import_path%"=="" set /P import_path="Enter path for glossary file to import:"
if NOT EXIST %import_path% (
  @echo Error: import path is not a valid file. Exiting.
  exit /B
)

if "%user_name%"=="" set /P user_name="Enter admin username:"
if "%user_name%"=="" (
  @echo Error: admin username is required. Exiting.
  exit /B
)

if "%password%"=="" set /P password="Enter admin password:"
if "%password%"=="" (
  @echo Error: admin password is required. Exiting.
  exit /B
)

java -cp %openidm_location%\bundle\*;%openidm_location%\lib\*;./commons-csv-1.7.jar ^
	groovy.lang.GroovyShell ^
	import_glossary.groovy ^
	%openidm_location% ^
	%import_path% ^
	%user_name% ^
	%password%
