@echo off
chcp 65001 >nul
title SentimentMap Backend Server
color 0A
echo.
echo ============================================================
echo   SentimentMap Backend Server
echo ============================================================
echo.
echo Starting server...
echo.
echo IMPORTANT:
echo - Keep this window open while using the app
echo - The "development server" warning is NORMAL
echo - Server will be available at http://localhost:5000
echo.
echo ============================================================
echo.

cd /d "%~dp0backend"
python app.py

echo.
echo ============================================================
echo Server stopped.
echo ============================================================
pause
