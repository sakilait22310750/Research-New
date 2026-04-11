# Fix: App Still Using localhost:8000

## Problem
The app is still trying to connect to `localhost:8000` instead of `192.168.8.178:8000` even though the `.env` file exists.

## Solution

### Step 1: Stop Expo Server
Press `Ctrl+C` in the terminal where Expo is running.

### Step 2: Clear All Caches
Run these commands in the `frontend` folder:

```powershell
# Clear Expo cache
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

# Clear Metro cache
Remove-Item -Recurse -Force .metro-cache -ErrorAction SilentlyContinue

# Clear node_modules cache
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
```

### Step 3: Verify .env File
Make sure `frontend/.env` contains:
```
EXPO_PUBLIC_BACKEND_URL=http://192.168.8.178:8000
```

### Step 4: Restart Expo
```bash
cd frontend
npx expo start --clear
```

### Step 5: Check Console Logs
After Expo starts, look for these logs in the terminal:
```
API Base URL: http://192.168.8.178:8000
Environment variable EXPO_PUBLIC_BACKEND_URL: http://192.168.8.178:8000
```

If you still see `localhost:8000`, the environment variable isn't being loaded.

### Alternative: Hardcode for Testing
If `.env` still doesn't work, you can temporarily hardcode the IP in `frontend/services/api.ts`:

```typescript
const API_BASE_URL = 'http://192.168.8.178:8000';
```

Then restart Expo.

### Why This Happens
Expo SDK 54 should automatically load `EXPO_PUBLIC_*` variables from `.env`, but sometimes:
- Cache needs to be cleared
- App needs to be fully reloaded
- Metro bundler needs to restart
