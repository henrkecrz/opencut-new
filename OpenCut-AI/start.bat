@echo off
title OpenCut-AI
cd /d "%~dp0"

set LOG_DIR=%~dp0logs
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo ============================================
echo   OpenCut-AI - Start Full Stack
echo ============================================
echo.

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set DT=%%I
if "%DT%"=="" set DT=%DATE:/=-%_%TIME::=-%
set DT=%DT:.=%
set TS=%DT:~0,4%-%DT:~4,2%-%DT:~6,2%_%DT:~8,2%h%DT:~10,2%m%DT:~12,2%s

echo Timestamp: %TS%
echo Logs:      %LOG_DIR%
echo.

REM -------------------------------------------------------
REM Check prerequisites
REM -------------------------------------------------------
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker not found. Please install Docker Desktop:
    echo https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)
echo [OK] Docker found

where bun >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Bun not found. Installing via npm...
    npm install -g bun >> "%LOG_DIR%\bun_install.log" 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install Bun. Install manually: https://bun.sh
        pause
        exit /b 1
    )
)
echo [OK] Bun found
echo.

REM -------------------------------------------------------
REM Copy .env.local if missing
REM -------------------------------------------------------
if not exist "apps\web\.env.local" (
    echo [INFO] Creating apps/web/.env.local from .env.example...
    copy "apps\web\.env.example" "apps\web\.env.local" >nul
    echo [INFO] Edit apps/web/.env.local to configure your environment.
    echo.
)

REM -------------------------------------------------------
REM Start Docker services
REM -------------------------------------------------------
echo [1/4] Building Docker images...
docker compose build --parallel >> "%LOG_DIR%\docker_build.log" 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Docker build had issues. Check logs\docker_build.log
)

echo [2/4] Starting Docker services (PostgreSQL, Redis, Ollama, AI backends)...
docker compose up -d >> "%LOG_DIR%\docker_up.log" 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Docker services. Check logs\docker_up.log
    pause
    exit /b 1
)
echo [OK] Docker services started
echo.

REM -------------------------------------------------------
REM Install JS dependencies
REM -------------------------------------------------------
echo [3/4] Installing JavaScript dependencies...  Log: logs\bun_install.log
bun install >> "%LOG_DIR%\bun_install.log" 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] bun install failed. Check logs\bun_install.log
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM -------------------------------------------------------
REM Start web dev server with tee (console + log)
REM -------------------------------------------------------
echo [4/4] Starting Next.js dev server...
echo.
echo  Web:  http://localhost:3000
echo  API:  http://localhost:8420
echo  Log:  logs\web.log
echo.
echo ============================================
echo.

start http://localhost:3000

powershell -NoProfile -Command "bun dev:web 2>&1 | Tee-Object -FilePath '%LOG_DIR%\web.log'"
if %errorlevel% neq 0 pause
