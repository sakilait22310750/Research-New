@echo off
echo ========================================
echo Testing Backend Connection
echo ========================================
echo.
echo Testing if backend is running...
echo.

curl http://localhost:5000/api/health 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo ERROR: Backend is NOT running!
    echo ========================================
    echo.
    echo To start the backend:
    echo 1. Run START_BACKEND.bat
    echo 2. Wait for "Running on http://0.0.0.0:5000"
    echo 3. Then test again
    echo.
) else (
    echo.
    echo ========================================
    echo SUCCESS: Backend is running!
    echo ========================================
    echo.
)

pause

