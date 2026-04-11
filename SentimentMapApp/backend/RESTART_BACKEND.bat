@echo off
REM Quick script to restart the backend server
echo.
echo ====================================================
echo Restarting Backend Server
echo ====================================================
echo.
echo Press Ctrl+C in the terminal running "python app.py"
echo Then run this script to restart with the updated database.
echo.
echo OR just run: python app.py
echo.
pause

cd /d d:\Research_2025\SentimentMapApp\backend
python app.py
