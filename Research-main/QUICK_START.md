# Quick Start Guide - Fix Network Error

## The Problem
You're seeing "Network Error" because the backend server is not running or not accessible.

## Quick Fix (3 Steps)

### Step 1: Start the Backend Server

Open a **new terminal/command prompt** and run:

```bash
cd backend
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

**Wait until you see:** `Uvicorn running on http://0.0.0.0:8000`

### Step 2: Verify Backend is Running

Open your browser and go to: **http://localhost:8000/docs**

You should see the API documentation page. If you see an error, the backend is not running correctly.

### Step 3: Restart the Frontend

1. **Stop the frontend** (press `Ctrl+C` in the terminal running Expo)
2. **Start it again:**
   ```bash
   cd frontend
   npm start
   # or
   expo start
   ```

3. **Refresh your browser** or scan the QR code again

## Still Not Working?

### Check Your .env File

Make sure `frontend/.env` exists and contains:

```
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

### For Mobile Phone Access

If you're trying to access from a mobile phone, you need to:

1. **Find your computer's IP address:**
   - Windows: Run `ipconfig` in Command Prompt
   - Mac/Linux: Run `ifconfig` in Terminal
   - Look for your Wi-Fi adapter's IPv4 address (e.g., `192.168.1.100`)

2. **Update `frontend/.env`:**
   ```
   EXPO_PUBLIC_BACKEND_URL=http://YOUR_IP_ADDRESS:8000
   ```
   Replace `YOUR_IP_ADDRESS` with your actual IP.

3. **Start backend with your IP:**
   ```bash
   cd backend
   $env:BACKEND_URL="http://YOUR_IP_ADDRESS:8000"  # Windows PowerShell
   # or
   export BACKEND_URL="http://YOUR_IP_ADDRESS:8000"  # Mac/Linux
   python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Restart Expo** after changing .env

## Common Issues

### "Cannot connect to backend server"
- ✅ Backend is not running → Start it (Step 1)
- ✅ Backend is running on wrong port → Check it's on port 8000
- ✅ Firewall blocking → Allow port 8000 in Windows Firewall

### "Network Error" on mobile
- ✅ Phone and computer not on same Wi-Fi → Connect both to same network
- ✅ Using localhost instead of IP → Update .env with your IP address
- ✅ Backend not accessible from network → Use `--host 0.0.0.0` when starting

### Backend won't start
- ✅ Check Python is installed: `python --version`
- ✅ Install dependencies: `pip install -r backend/requirements.txt`
- ✅ Check MongoDB connection in backend/.env

## Need More Help?

See `MOBILE_SETUP.md` for detailed mobile setup instructions.





