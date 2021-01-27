@echo off

setlocal

if "%openidm_location%"=="" set /P openidm_location="Location of your OpenIDM Installation (e.g. C:\forgerock\openidm): "
if NOT EXIST "%openidm_location%\conf\repo.jdbc.json" (
  @echo ERROR: No valid OpenIDM installation found at %openidm_location%. Exiting.
  exit /B
)

if "%dest_path%"=="" set /P dest_path="Enter destination directory for glossary export:"
if NOT EXIST %dest_path%\NUL (
  @echo ERROR: No valid directory found at %dest_path%. Exiting.
  exit /B
)

java -cp %openidm_location%\bundle\*;%openidm_location%\lib\* ^
	groovy.lang.GroovyShell ^
	export-glossary.groovy ^
	%openidm_location% ^
	%dest_path%
