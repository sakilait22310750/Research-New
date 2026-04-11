@echo off
chcp 65001 >nul
echo ========================================
echo Starting SentimentMap Backend Server
echo ========================================
echo.
cd /d "%~dp0"
python app.py
pause

