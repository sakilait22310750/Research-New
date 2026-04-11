@echo off
REM Test the new database-powered backend
REM Stops old server and starts new one

echo.
echo ====================================================
echo Testing Database-Powered Backend
echo ====================================================
echo.

cd /d "%~dp0"

echo Step 1: Starting backend server...
echo.
python app.py

pause
