@echo off

if "%~1"=="" goto skiploop
:loop

set recognized=false

if "%~1"=="--help" (
@echo Access Review 3.0 Uninstaller
@echo To use a properties file, use the argument -p or --properties /location/of/properties/file.
@echo Otherwise, the uninstaller will ask for needed values.
exit /B
)

if "%~1"=="--properties" goto :props
if "%~1"=="--props" goto :props
if "%~1"=="-p" goto :props
goto :notprops
:props
set recognized=true
shift
IF NOT EXIST "%~1" (
@echo ERROR: Could not find file "%~1"
exit /B
)
for /f "tokens=1,2 delims==" %%G in (%~1) do set %%G=%%H
:notprops

if "%recognized%"=="false" (
@echo ERROR: Unrecognized parameter "%~1"
exit /B
)

shift
if not "%~1"=="" goto loop
:skiploop

if "%openidm_location%"=="" set /P openidm_location="Location of your IDM Installation (e.g. C:\forgerock\openidm): "
if NOT EXIST "%openidm_location%\bin\openidm.jar" (
  @echo ERROR: No valid IDM installation found at %openidm_location%.  Exiting.
  exit /B
)

if "%project_location%"=="" set /P project_location="Location of your IDM project directory. If left blank, will use IDM installation directory. (e.g. C:\forgerock\openidm): "
if "%project_location%"=="" (
  set /P project_location=%openidm_location%
if NOT EXIST "%project_location%\conf\repo.jdbc.json" (
  @echo ERROR: No valid IDM project found at %project_location%.  Exiting.
  exit /B
)

if "%openidm_url%"=="" set /P openidm_url="IDM URL (e.g. http://localhost:8080): "
if "%openidm_url%"=="" (
  @echo ERROR: IDM URL is required.  Exiting.
  exit /B
)

if "%openidm_version%"=="" set /P openidm_version="IDM x.x Version (e.g. 5.0): "
if "%openidm_version%"=="" (
  @echo ERROR: IDM Version is required.  Exiting.
  exit /B
)

if "%openidm_admin%"=="" set /P openidm_admin="IDM Admin User: "
if "%openidm_admin%"=="" (
  @echo ERROR: IDM Admin is required.  Exiting.
  exit /B
)

if "%openidm_admin_password%"=="" set /P openidm_admin_password="IDM Admin Password: "
if "%openidm_admin_password%"=="" (
  @echo ERROR: IDM Admin Password is required.  Exiting.
  exit /B
)

:groovycall
java -cp %openidm_location%\bundle\*;%openidm_location%\lib\* ^
  groovy.lang.GroovyShell ^
  uninstall.groovy ^
  %openidm_location% ^
  %openidm_admin% ^
  %openidm_admin_password% ^
  %openidm_url% ^
  %openidm_version% ^
  %project_location%
