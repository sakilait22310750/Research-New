@echo off
cd /d "%~dp0"
echo Starting SentimentMap Backend Server...
echo.
echo If you get ModuleNotFoundError, run first: pip install -r requirements.txt
echo.
echo After server starts:
echo   1. On this PC open: http://localhost:5000/api/health
echo   2. On phone use the IP shown in the server log (e.g. http://192.168.1.4:5000/api/health)
echo   3. If phone times out, allow port 5000 in Windows Firewall
echo.
python app.py
pause

