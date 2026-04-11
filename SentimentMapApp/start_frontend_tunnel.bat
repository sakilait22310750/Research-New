@echo off
echo ========================================
echo Starting Frontend with TUNNEL MODE
echo ========================================
echo.
echo Tunnel mode works over the internet,
echo so it bypasses WiFi/firewall issues.
echo.
echo This is the BEST option for mobile testing!
echo.
echo ========================================
echo.

cd /d "%~dp0"
call npx expo start --tunnel --clear

pause

