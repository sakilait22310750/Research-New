# Quick Guide: Start Backend Server

## Backend Port: **8000**

## Current Issue
- Port 8000 is in use by Python (Process ID: 19524)
- But backend is NOT responding to HTTP requests
- This means the server crashed or isn't fully started

## Solution: Restart Backend

### Step 1: Stop Current Backend
**Option A:** If you have the terminal window open:
- Press `Ctrl+C` to stop the server

**Option B:** Kill the process:
```powershell
Stop-Process -Id 19524 -Force
```

### Step 2: Start Backend Fresh

Open a **NEW terminal window** and run:

```powershell
# Navigate to backend folder
cd backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Start the server
python server.py
```

### Step 3: Wait for Success Message

You should see:
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Step 4: Verify Backend is Working

**On your computer:**
- Open browser: http://localhost:8000/docs
- You should see the API documentation

**On your iPhone (same Wi-Fi):**
- Open Safari: http://192.168.8.178:8000/docs
- You should see the API documentation

### Step 5: Restart Expo Frontend

After backend is running:

```powershell
# In a different terminal
cd frontend
npx expo start --clear
```

Then reload the app on your iPhone.

## Troubleshooting

### "Port 8000 already in use"
```powershell
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### "Module not found" errors
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Backend starts but can't access from iPhone
- Make sure both devices are on same Wi-Fi
- Check Windows Firewall - allow Python through firewall
- Verify backend shows: `Uvicorn running on http://0.0.0.0:8000`
