# Fix Backend Connection on Physical Device

## Problem
When running the app on a physical iPhone via Expo Go, `localhost:8000` doesn't work because `localhost` refers to the phone itself, not your development machine.

## Solution

### Step 1: Find Your Computer's Local IP Address

**On Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x)

**On Mac/Linux:**
```bash
ifconfig | grep "inet "
```
or
```bash
ip addr show | grep "inet "
```

### Step 2: Create `.env` File

Create a file named `.env` in the `frontend` directory with:

```
EXPO_PUBLIC_BACKEND_URL=http://YOUR_IP_ADDRESS:8000
```

Replace `YOUR_IP_ADDRESS` with your computer's local IP (e.g., `192.168.8.178`)

### Step 3: Make Sure Backend is Running

```bash
cd backend
# Activate virtual environment
.\venv\Scripts\Activate.ps1  # Windows
# or
source venv/bin/activate     # Mac/Linux

# Start the server
python server.py
```

The server should be accessible at `http://YOUR_IP_ADDRESS:8000`

### Step 4: Restart Expo

```bash
cd frontend
# Stop current Expo server (Ctrl+C)
npx expo start --clear
```

### Step 5: Make Sure Both Devices Are on Same Network

- Your computer and iPhone must be on the same Wi-Fi network
- Check firewall settings - port 8000 might be blocked

### Step 6: Test Backend Connection

Open a browser on your iPhone and go to:
```
http://YOUR_IP_ADDRESS:8000/docs
```

If you can see the API documentation, the backend is accessible.

### Troubleshooting

**If still can't connect:**

1. **Check Windows Firewall:**
   - Allow Python through Windows Firewall
   - Or temporarily disable firewall to test

2. **Check Backend Server:**
   - Make sure it's listening on `0.0.0.0` not just `127.0.0.1`
   - Check `backend/server.py` - should have:
     ```python
     uvicorn.run(app, host="0.0.0.0", port=8000)
     ```

3. **Verify IP Address:**
   - Make sure you're using the correct IP
   - If you disconnect/reconnect to Wi-Fi, the IP might change

4. **Alternative: Use ngrok (for testing):**
   ```bash
   npx @expo/ngrok@latest http 8000
   ```
   This creates a public URL you can use instead of local IP.
