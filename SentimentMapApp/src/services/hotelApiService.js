// API service for hotel recommendations
// Uses FastAPI backend (Research-main/backend/server.py) on port 8000.
// On a physical device, set COMPUTER_IP to your PC's LAN IP (same WiFi as the phone).

// const COMPUTER_IP = '192.168.1.4'; // Change to your PC's IP (e.g. ipconfig â†’ IPv4 Address)
const COMPUTER_IP = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_COMPUTER_IP) || '192.168.1.2';
const getHotelApiBaseUrl = () => {
  if (__DEV__) {
    const Platform = require('react-native').Platform;

    if (Platform.OS === 'web') {
      return 'http://localhost:8000/api';
    }

    // On device/emulator, use your computer's IP so the app can reach the backend
    if (Platform.OS === 'android') {
      return `http://${COMPUTER_IP}:8000/api`;
    }

    if (Platform.OS === 'ios') {
      // Simulator can use localhost; physical device must use COMPUTER_IP
      return `http://${COMPUTER_IP}:8000/api`;
    }

    return `http://${COMPUTER_IP}:8000/api`;
  }

  return 'http://your-server-ip:8000/api';
};

const HOTEL_API_BASE_URL = getHotelApiBaseUrl();

if (typeof console !== 'undefined') {
  try {
    const Platform = require('react-native').Platform;
    console.log('[Hotel API] Platform:', Platform.OS);
    console.log('[Hotel API] Using URL:', HOTEL_API_BASE_URL);
  } catch (e) {
    console.log('[Hotel API] Using URL:', HOTEL_API_BASE_URL);
  }
}

class HotelApiService {
  constructor() {
    this.baseUrl = HOTEL_API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`[Hotel API] Requesting: ${url}`);

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg =
          errorData.detail ||
          errorData.error ||
          `HTTP error! status: ${response.status}`;
        console.error('[Hotel API] Error response:', msg);
        throw new Error(msg);
      }

      const data = await response.json();
      console.log(
        `[Hotel API] Success: ${endpoint}`,
        Array.isArray(data) ? `(${data.length} items)` : 'OK'
      );
      return data;
    } catch (error) {
      console.error('[Hotel API] Request failed:', endpoint);
      console.error('[Hotel API] Error:', error.message);

      if (
        error.message.includes('Network request failed') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('TypeError')
      ) {
        const ipAddress = this.baseUrl.split('/')[2].split(':')[0];
        throw new Error(
          `Cannot reach hotel backend. Make sure FastAPI is running on port 8000 (e.g. python server.py in backend folder) and that ${ipAddress} is reachable from your device (same WiFi; check firewall).`
        );
      }

      throw error;
    }
  }

  /**
   * Get hotel recommendations for a given location.
   * Uses anonymous mode of the backend (no JWT required).
   */
  /**
   * Returns a stable user ID for recommendation requests.
   * Uses the real user ID when logged in; otherwise creates a stable
   * anonymous ID that persists for the session so cold-start shuffle
   * is consistent within a single session.
   */
  _getEffectiveUserId() {
    // Prefer real logged-in user ID â€” always cast to string because the
    // Flask SQLite auth backend returns an integer primary key, but the
    // FastAPI hotel backend (Pydantic) requires user_id to be a string.
    if (global.userId) {
      return String(global.userId);
    }
    // Create a stable anonymous ID for this session (consistent cold-start shuffle)
    if (!global._anonUserId) {
      global._anonUserId = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
    return global._anonUserId;
  }

  async getHotelRecommendations({
    location,
    limit = 30,
    minRating = 3.5,
    amenities = [],
  }) {
    const userId = this._getEffectiveUserId();
    console.log(`[Hotel API] Recommendation user_id: ${userId}`);

    const body = {
      user_id: userId,
      location,
      limit,
      amenities,
      min_rating: minRating,
      // Pass stored travel preferences so the backend engine personalises cold-start results
      preferences: Array.isArray(global.userPreferences) ? global.userPreferences : [],
    };

    return this.request('/recommendations', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Get a general list of hotels (optionally filtered).
   */
  async getAllHotels({ location, limit = 50, minRating } = {}) {
    const params = new URLSearchParams();
    if (location) {
      params.append('location', location);
    }
    if (typeof minRating === 'number') {
      params.append('min_rating', String(minRating));
    }
    if (typeof limit === 'number') {
      params.append('limit', String(limit));
    }

    const query = params.toString();
    const endpoint = query ? `/hotels?${query}` : '/hotels';
    return this.request(endpoint);
  }

  /**
   * Get full details (including reviews) for a single hotel.
   */
  async getHotelDetails(hotelId) {
    return this.request(`/hotels/${encodeURIComponent(hotelId)}`);
  }

  /**
   * Get list of image URLs for a hotel.
   */
  async getHotelImages(hotelId) {
    const data = await this.request(
      `/hotel-images/${encodeURIComponent(hotelId)}/list`
    );
    // Backend returns { images: [ { url, index, ... } ], ... }
    return Array.isArray(data?.images) ? data.images : [];
  }

  /**
   * Search hotels by name or location keyword.
   * Uses the /search endpoint on the backend.
   */
  async searchHotels(query, limit = 20) {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    return this.request(`/search?${params.toString()}`);
  }

  /** Live suggestion search: matches hotel name OR location. */
  async searchHotelsLive(q, limit = 8) {
    const params = new URLSearchParams({ q, limit: String(limit) });
    return this.request(`/hotels/search?${params.toString()}`);
  }

  /** Real aggregate stats from DB: { total, avg_rating } */
  async getHotelStats() {
    return this.request('/hotels/stats');
  }

  /**
   * Get hotels ranked by CNN (VGG) + rating/sentiment/price for a category.
   * category: 'beach' | 'luxury' | 'budget'
   */
  async getHotelsByCategory(category, limit = 12) {
    const params = new URLSearchParams({
      type: category,
      limit: String(limit),
    });
    return this.request(`/hotel-category?${params.toString()}`);
  }

  /**
   * Get AI-powered insights for a hotel using Gemini.
   * Results are cached on the backend for 7 days.
   */
  async getAiInsights(hotelId) {
    return this.request(`/ai-insights/${encodeURIComponent(hotelId)}`);
  }

  /**
   * Submit a favourite/rating for a hotel.
   * rating: 5.0 = liked, 1.0 = un-liked
   */
  async submitFavourite(hotelId, rating) {
    const userId = this._getEffectiveUserId();
    return this.request('/feedback', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        hotel_id: hotelId,
        rating,
      }),
    });
  }
}

export default new HotelApiService();


