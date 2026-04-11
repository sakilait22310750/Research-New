/**
 * API base URL for auth (sign up / sign in). Should match the same backend as apiService (port 5000).
 * Set EXPO_PUBLIC_BACKEND_URL in .env for your backend base URL (no /api suffix).
 * - Android emulator: http://10.0.2.2:5000
 * - iOS simulator: http://localhost:5000
 * - Physical device: http://YOUR_COMPUTER_IP:5000
 */
const getApiUrl = () => {
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL;
  }
  // Use same backend as apiService (SentimentMapApp Flask backend on port 5000)
  return 'http://10.0.2.2:5000';
};

export const API_BASE_URL = getApiUrl();
