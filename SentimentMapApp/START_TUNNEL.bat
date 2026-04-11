@echo off
chcp 65001 >nul
title SentimentMap - Tunnel Mode (For Mobile)
color 0A
echo.
echo ============================================================
echo   SentimentMap - TUNNEL MODE (Best for Mobile!)
echo ============================================================
echo.
echo TUNNEL MODE:
echo - Works over the internet (not just WiFi)
echo - Bypasses firewall issues
echo - More reliable for phone connections
echo.
echo IMPORTANT:
echo - Make sure the BACKEND is running first!
echo - Wait for "Tunnel ready" message
echo - Scan the NEW QR code (will be different)
echo - Keep this window open
echo.
echo ============================================================
echo.

cd /d "%~dp0"
call npx expo start --tunnel --clear

pause

