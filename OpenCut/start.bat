@echo off
title OpenCut
cd /d "%~dp0"

set LOG_DIR=%~dp0logs
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo ============================================
echo   OpenCut - Start Full Stack
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
REM Install dependencies
REM -------------------------------------------------------
echo [1/3] Installing dependencies...  Log: logs\bun_install.log

echo Installing API deps... >> "%LOG_DIR%\bun_install.log"
bun install --cwd apps\api >> "%LOG_DIR%\bun_install.log" 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] API deps failed. Check logs\bun_install.log
    pause
    exit /b 1
)

echo Installing Web deps... >> "%LOG_DIR%\bun_install.log"
bun install --cwd apps\web >> "%LOG_DIR%\bun_install.log" 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Web deps failed. Check logs\bun_install.log
    pause
    exit /b 1
)

echo [OK] Dependencies installed
echo.

REM -------------------------------------------------------
REM Start dev servers (each logs independently + shows console output)
REM -------------------------------------------------------
echo [2/3] Starting API dev server (Elysia + Cloudflare Worker)...
echo [3/3] Starting Web dev server (TanStack Start + Vite)...
echo.
echo  Web:  http://localhost:5173
echo  API:  http://localhost:8787
echo  Logs: logs\api.log / logs\web.log
echo.
echo ============================================
echo.

start "OpenCut API" cmd /c "powershell -NoProfile -Command \"cd '%~dp0'; bun run --cwd apps\api dev 2>&1 | Tee-Object -FilePath '%LOG_DIR%\api.log'\""
start "OpenCut Web" cmd /c "powershell -NoProfile -Command \"cd '%~dp0'; bun run --cwd apps\web dev 2>&1 | Tee-Object -FilePath '%LOG_DIR%\web.log'\""

timeout /t 5 /nobreak >nul
start http://localhost:5173

echo Both servers started in separate windows.
echo Close each server window individually to stop.
echo.
pause
