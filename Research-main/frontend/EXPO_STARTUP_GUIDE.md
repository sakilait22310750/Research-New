# Expo Startup Guide

## What Happens When You Run `npx expo start --clear`

### Step 1: Metro Bundler Starts
- Expo starts the Metro JavaScript bundler
- This compiles your React Native code

### Step 2: QR Code Appears
After Metro starts, you'll see:
- A QR code in the terminal
- Options to:
  - Press `a` for Android
  - Press `i` for iOS simulator
  - Scan QR code for physical device

### Step 3: Run on iPhone (Physical Device)

**Option A: Scan QR Code**
1. Open **Expo Go** app on your iPhone
2. Tap "Scan QR Code"
3. Point camera at the QR code in terminal
4. Wait for app to load

**Option B: Use Development Build URL**
- The terminal will show a URL like: `exp://192.168.x.x:8082`
- You can manually enter this in Expo Go

### Step 4: App Loads
- The app will download and start on your iPhone
- You'll see the app interface
- Check terminal for any errors

## Package Version Warnings

The warnings about package versions are **NOT critical**. They're just suggestions for optimal compatibility.

### To Fix Later (Optional):
```bash
npx expo install --fix
```

This will update packages to recommended versions.

### Current Status:
- ✅ Expo is starting
- ✅ Metro Bundler is running
- ⏳ Waiting for QR code
- 📱 Ready to scan when QR appears

## Troubleshooting

### QR Code Not Appearing
- Wait a bit longer (first startup takes time)
- Check if there are any errors in terminal

### Can't Connect from iPhone
- Make sure iPhone and computer are on same Wi-Fi
- Check firewall settings
- Try the `exp://` URL manually in Expo Go

### App Crashes on Load
- Check terminal for error messages
- Make sure backend is running on port 8000
- Verify API URL is correct (should be `192.168.8.178:8000`)
