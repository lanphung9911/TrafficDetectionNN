@echo off
setlocal EnableDelayedExpansion

cd /d "%~dp0.."

if not exist "scripts\client_env.yaml" (
  echo [ERROR] client_env.yaml not found.
  pause
  exit /b 1
)

set "SERVER_HOST="
set "SERVER_PORT="

for /f "tokens=1,* delims=:" %%A in ('findstr /B /C:"backend_host:" "scripts\client_env.yaml"') do set "SERVER_HOST=%%B"
for /f "tokens=1,* delims=:" %%A in ('findstr /B /C:"backend_port:" "scripts\client_env.yaml"') do set "SERVER_PORT=%%B"

for /f "tokens=* delims= " %%A in ("!SERVER_HOST!") do set "SERVER_HOST=%%A"
for /f "tokens=* delims= " %%A in ("!SERVER_PORT!") do set "SERVER_PORT=%%A"

if "!SERVER_HOST!"=="" (
  echo [ERROR] backend_host is missing in client_env.yaml
  pause
  exit /b 1
)

if "!SERVER_PORT!"=="" (
  echo [ERROR] backend_port is missing in client_env.yaml
  pause
  exit /b 1
)

> "app\.env.local" (
  echo VITE_API_URL=http://!SERVER_HOST!:!SERVER_PORT!
)

echo app\.env.local has been created:
type "app\.env.local"
pause
endlocal