#!/bin/bash
# Bash script to start backend server for mobile access
# This script finds your IP and starts the server with the correct configuration

echo ""
echo "=== Starting Backend Server for Mobile Access ==="
echo ""

# Get IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    IP=$(hostname -I | awk '{print $1}')
else
    IP=$(ip route get 1.1.1.1 | awk '{print $7; exit}')
fi

if [ -z "$IP" ]; then
    echo "Error: Could not find network adapter!"
    exit 1
fi

BACKEND_URL="http://$IP:8000"

echo "Detected IP Address: $IP"
echo "Backend URL: $BACKEND_URL"
echo ""

# Check if we're in the backend directory
if [ ! -f "server.py" ]; then
    echo "Error: server.py not found!"
    echo "Please run this script from the backend directory."
    exit 1
fi

# Set environment variable and start server
echo "Starting server..."
echo "Press Ctrl+C to stop the server"
echo ""

export BACKEND_URL=$BACKEND_URL
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload





