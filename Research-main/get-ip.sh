#!/bin/bash
# Bash script to get your local IP address
# Run this script to find your IP address for mobile setup

echo ""
echo "=== Finding Your Local IP Address ==="
echo ""

# Get IP address (works on Mac and Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    IP=$(hostname -I | awk '{print $1}')
else
    IP=$(ip route get 1.1.1.1 | awk '{print $7; exit}')
fi

if [ -n "$IP" ]; then
    echo "Your local IP address: $IP"
    echo ""
    echo "Use this IP address for your backend URL"
    echo ""
    echo "Example backend URL: http://$IP:8000"
    echo ""
    echo "To set environment variable:"
    echo "  export BACKEND_URL=http://$IP:8000"
    echo ""
else
    echo "Could not determine IP address!"
    echo "Please check your network connection."
fi





