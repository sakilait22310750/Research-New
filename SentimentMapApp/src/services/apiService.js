
/**
 * API Service for connecting to the backend server
 * Replaces direct file reading with HTTP API calls
 */

// API Configuration
// IMPORTANT: Change this based on your setup:
// - Android Emulator: use 'http://10.0.2.2:5000/api'
// - iOS Simulator: use 'http://localhost:5000/api'
// - Physical Device (Expo Go): use your computer's IP address
//   Find your IP: Windows: ipconfig | findstr IPv4
//   Example: 'http://192.168.1.5:5000/api'

// Set your computer's IP address here for physical device testing (ipconfig Ã¢â€ â€™ IPv4)
// DO NOT use 192.168.56.1 (VirtualBox/VMware). Use your WiFi/Ethernet IP.
const COMPUTER_IP = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_COMPUTER_IP) || '172.20.10.2';

const getApiBaseUrl = () => {
  if (__DEV__) {
    const Platform = require('react-native').Platform;

    // Web: localhost is correct
    if (Platform.OS === 'web') {
      return 'http://localhost:5000/api';
    }

    // Android: use PC IP so phone/emulator can reach backend (emulator use 10.0.2.2 if needed)
    if (Platform.OS === 'android') {
      return `http://${COMPUTER_IP}:5000/api`;
    }

    // iOS (Simulator + physical): use PC IP so Expo Go / device can reach backend
    if (Platform.OS === 'ios') {
      return `http://${COMPUTER_IP}:5000/api`;
    }

    return `http://${COMPUTER_IP}:5000/api`;
  }
  // Production - replace with your actual server URL
  return 'http://your-server-ip:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Log the API URL being used for debugging
if (typeof console !== 'undefined') {
  try {
    const Platform = require('react-native').Platform;
    console.log('[API Service] Platform:', Platform.OS);
    console.log('[API Service] Using URL:', API_BASE_URL);
  } catch (e) {
    console.log('[API Service] Using URL:', API_BASE_URL);
  }
}

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`[API] Requesting: ${url}`);

    try {
      // Use AbortController for better timeout handling
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        console.error(`[API] Request timeout after 8 seconds: ${url}`);
        controller.abort();
      }, 8000);

      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        console.error(`[API] Error response: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`[API] Success: ${endpoint}`, Array.isArray(data) ? `(${data.length} items)` : 'OK');
      return data;
    } catch (error) {
      console.error(`[API] Request failed: ${endpoint}`);
      console.error(`[API] Error name:`, error.name);
      console.error(`[API] Error message:`, error.message);

      // Handle abort (timeout)
      if (error.name === 'AbortError' || error.message.includes('aborted') || error.message.includes('timeout')) {
        const ipAddress = this.baseUrl.split('/')[2].split(':')[0];
        throw new Error(`Connection timeout - backend server not responding at ${this.baseUrl}. Check: 1) Backend is running (test: http://localhost:5000/api/health), 2) IP address is correct (${ipAddress}), 3) Phone and computer are on same WiFi network, 4) Windows Firewall allows port 5000`);
      }

      // Handle network errors
      if (error.message.includes('Network request failed') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('TypeError')) {
        const baseHost = this.baseUrl.replace(/\/api\/?$/, '');
        const healthUrl = `${baseHost}/api/health`;
        throw new Error(
          `Cannot connect to backend. The app is trying: ${healthUrl}. ` +
          `Check: 1) Start backend on your PC (in backend folder run: python app.py). ` +
          `2) On your PC browser open ${healthUrl} Ã¢â‚¬â€ if it works there, the problem is network/firewall. ` +
          `3) On a physical device use your PC's IP (ipconfig), not localhost. ` +
          `4) Phone and PC on same WiFi; 5) Windows Firewall allows port 5000.`
        );
      }

      // Re-throw other errors with more context
      throw new Error(error.message || 'Unknown error occurred');
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // Locations
  async getLocationData() {
    return this.request('/locations');
  }

  async getLocationDetails(locationName) {
    return this.request(`/locations/${encodeURIComponent(locationName)}`);
  }

  async getLocationReviews(locationName, limit = 200) {
    return this.request(`/locations/${encodeURIComponent(locationName)}/reviews?limit=${limit}`);
  }

  // Aspects
  async getAspectScores() {
    return this.request('/aspects');
  }

  // Sarcasm
  async getSarcasmData() {
    return this.request('/sarcasm');
  }

  // Recommendations
  async getRecommendations(category = 'all') {
    return this.request(`/recommendations?category=${category}`);
  }

  // Search
  async searchLocations(query) {
    if (!query || query.length < 2) {
      return [];
    }
    return this.request(`/search?q=${encodeURIComponent(query)}`);
  }

  // AI Travel Assistant - chat-style Q&A
  async askTravelAssistant(question) {
    if (!question || !question.trim()) {
      throw new Error('Please enter a question about a Sri Lankan location.');
    }

    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  }

  // Prediction (optional - for real-time inference)
  async predictSentiment(text) {
    return this.request('/predict', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  // Helper methods for compatibility with existing code
  normalizeSentiment(score) {
    // Convert -1 to 1 range to 0-100 percentage
    if (score === null || score === undefined || isNaN(score)) {
      return 50; // Neutral
    }
    return Math.round(((parseFloat(score) + 1) / 2) * 100);
  }

  getSentimentLabel(score) {
    if (score >= 80) return 'Very Positive';
    if (score >= 60) return 'Positive';
    if (score >= 40) return 'Neutral';
    if (score >= 20) return 'Negative';
    return 'Very Negative';
  }
}

export default new ApiService();

