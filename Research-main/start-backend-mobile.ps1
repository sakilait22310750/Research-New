# PowerShell script to start backend server for mobile access
# This script finds your IP and starts the server with the correct configuration

Write-Host "`n=== Starting Backend Server for Mobile Access ===" -ForegroundColor Green
Write-Host ""

# Get local IP address
$adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*"
}

if (-not $adapters) {
    Write-Host "Error: Could not find network adapter!" -ForegroundColor Red
    exit 1
}

$IP = $adapters[0].IPAddress
$BACKEND_URL = "http://$IP:8000"

Write-Host "Detected IP Address: $IP" -ForegroundColor Cyan
Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor Yellow
Write-Host ""

# Check if we're in the backend directory
if (-not (Test-Path "server.py")) {
    Write-Host "Error: server.py not found!" -ForegroundColor Red
    Write-Host "Please run this script from the backend directory." -ForegroundColor Yellow
    exit 1
}

# Set environment variable and start server
Write-Host "Starting server..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

$env:BACKEND_URL = $BACKEND_URL
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload





