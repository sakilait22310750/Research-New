@echo off
REM ============================================
REM Windows Firewall Setup for Backend Server
REM ============================================
REM Run this script as Administrator!
REM Right-click -> "Run as administrator"

echo.
echo ====================================================
echo Setting up Windows Firewall for Backend Server
echo ====================================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo.
    echo Please:
    echo 1. Right-click this file
    echo 2. Select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo Adding firewall rule for port 5000...
netsh advfirewall firewall delete rule name="Python Backend Port 5000" >nul 2>&1
netsh advfirewall firewall add rule name="Python Backend Port 5000" dir=in action=allow protocol=TCP localport=5000

if %errorLevel% equ 0 (
    echo.
    echo ✓ SUCCESS! Firewall rule added successfully.
    echo.
    echo Port 5000 is now allowed through Windows Firewall.
    echo Your phone should now be able to connect to the backend!
) else (
    echo.
    echo ✗ ERROR: Failed to add firewall rule.
    echo Please check your Windows Firewall settings manually.
)

echo.
echo ====================================================
echo Next Steps:
echo ====================================================
echo 1. Keep the backend running (python app.py)
echo 2. Restart Expo: Press Ctrl+C, then run: npx expo start --clear
echo 3. Scan the QR code with Expo Go app
echo 4. Wait for the app to reload with the new IP address
echo ====================================================
echo.
pause
