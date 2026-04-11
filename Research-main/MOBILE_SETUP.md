# Running the App on Your Mobile Phone

This guide will help you run the AccommoBuddy app on your mobile phone.

## Prerequisites

1. **Install Expo Go** on your mobile phone:
   - **Android**: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Ensure both devices are on the same Wi-Fi network** (your computer and phone must be on the same network)

## Step 1: Find Your Computer's IP Address

### Windows:
1. Open Command Prompt (Press `Win + R`, type `cmd`, press Enter)
2. Type: `ipconfig`
3. Look for **IPv4 Address** under your active network adapter (usually starts with `192.168.x.x` or `10.0.x.x`)
4. Copy this IP address (e.g., `192.168.1.100`)

### Mac/Linux:
1. Open Terminal
2. Type: `ifconfig` or `ip addr show`
3. Look for your Wi-Fi adapter (usually `en0` or `wlan0`)
4. Find the `inet` address (e.g., `192.168.1.100`)

## Step 2: Configure Backend Server

1. **Start the backend server** with your local IP address:

```bash
cd backend

# On Windows (PowerShell)
$env:BACKEND_URL="http://YOUR_IP_ADDRESS:8000"
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload

# On Mac/Linux
export BACKEND_URL="http://YOUR_IP_ADDRESS:8000"
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

**Replace `YOUR_IP_ADDRESS` with your actual IP** (e.g., `http://192.168.1.100:8000`)

**Important**: Use `--host 0.0.0.0` to allow connections from other devices on your network.

## Step 3: Configure Frontend

1. **Create or update `.env` file** in the `frontend` folder:

```bash
cd frontend
```

Create a file named `.env` with:
```
EXPO_PUBLIC_BACKEND_URL=http://YOUR_IP_ADDRESS:8000
```

**Replace `YOUR_IP_ADDRESS` with the same IP address from Step 1**

## Step 4: Start the Expo Development Server

1. **Navigate to the frontend folder** (if not already there):
```bash
cd frontend
```

2. **Install dependencies** (if not already done):
```bash
npm install
# or
yarn install
```

3. **Start Expo**:
```bash
npm start
# or
yarn start
# or
expo start
```

4. **You'll see a QR code** in the terminal. Keep this terminal open!

## Step 5: Connect from Your Phone

### Option A: Using Expo Go App (Recommended)

1. **Open Expo Go** on your phone
2. **Scan the QR code** from the terminal:
   - **Android**: Use the "Scan QR code" option in Expo Go
   - **iOS**: Use the Camera app to scan the QR code, then tap the notification
3. The app will load on your phone!

### Option B: Using Tunnel (If same network doesn't work)

If you can't connect on the same network, use tunnel mode:

1. In the Expo terminal, press `s` to switch to tunnel mode
2. Wait for the tunnel to establish
3. Scan the new QR code with Expo Go

**Note**: Tunnel mode is slower but works across different networks.

## Troubleshooting

### Can't connect to backend from phone?

1. **Check firewall**: Make sure Windows Firewall allows connections on port 8000
   - Go to Windows Defender Firewall → Allow an app through firewall
   - Allow Python or add port 8000

2. **Verify IP address**: Make sure you're using the correct IP address
   - The IP should be from your Wi-Fi adapter, not Ethernet
   - Both devices must be on the same Wi-Fi network

3. **Test backend connection**:
   - On your phone's browser, try: `http://YOUR_IP_ADDRESS:8000/docs`
   - You should see the API documentation page

### App shows connection errors?

1. **Check `.env` file**: Make sure `EXPO_PUBLIC_BACKEND_URL` is set correctly
2. **Restart Expo**: Stop Expo (Ctrl+C) and start again after changing `.env`
3. **Clear cache**: Run `expo start -c` to clear the cache

### Images not loading?

1. Make sure the backend is running and accessible
2. Check that Google Drive API is configured (for hotel images)
3. Verify the backend URL in the app matches your server

## Quick Start Commands

```bash
# Terminal 1: Start Backend
cd backend
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Start Frontend
cd frontend
expo start
```

Then scan the QR code with Expo Go on your phone!

## Alternative: Using ngrok for External Access

If you want to access from anywhere (not just same network):

1. **Install ngrok**: https://ngrok.com/download
2. **Start backend** on localhost:8000
3. **Create tunnel**:
   ```bash
   ngrok http 8000
   ```
4. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)
5. **Update frontend `.env`**:
   ```
   EXPO_PUBLIC_BACKEND_URL=https://abc123.ngrok.io
   ```
6. **Restart Expo**

**Note**: Free ngrok URLs change each time you restart. For production, use a fixed domain.





