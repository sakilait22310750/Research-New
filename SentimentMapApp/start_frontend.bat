@echo off
chcp 65001 >nul
title SentimentMap Frontend (Expo)
color 0B
echo.
echo ============================================================
echo   SentimentMap Frontend (Expo)
echo ============================================================
echo.
echo IMPORTANT:
echo - Make sure the BACKEND is running first!
echo - Scan the QR code with Expo Go app
echo - Keep this window open
echo.
echo ============================================================
echo.

cd /d "%~dp0"
npm start

pause
