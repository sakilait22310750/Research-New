# Simple script to start the backend server
# Double-click this file or run: .\start-backend.ps1

Write-Host "`n=== Starting Backend Server ===" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend\server.py")) {
    Write-Host "Error: server.py not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    pause
    exit 1
}

# Navigate to backend directory
Set-Location backend

Write-Host "Starting backend server on http://localhost:8000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "Once started, you can test it at: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""

# Start the server
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload





