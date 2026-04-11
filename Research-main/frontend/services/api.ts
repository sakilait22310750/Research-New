import axios from 'axios';

// For physical device testing, use your computer's IP address
// Change this to your computer's local IP (find it with: ipconfig on Windows)
const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.8.178:8000';

// Log the API base URL on initialization
console.log('API Base URL:', API_BASE_URL);
console.log('Environment variable EXPO_PUBLIC_BACKEND_URL:', process.env.EXPO_PUBLIC_BACKEND_URL || 'not set (using default)');

export interface Hotel {
  id: string;
  hotel_id: number | string;
  name: string;
  location: string;
  rating: number;
  total_reviews?: number;
  avg_sentiment_score?: number;
  image_url?: string;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor to log requests
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || !error.response) {
      // Network error - backend is not reachable
      const backendUrl = API_BASE_URL;
      console.error(`Network Error: Cannot connect to backend at ${backendUrl}`);
      console.error('Make sure the backend server is running on port 8000');
      error.networkError = true;
      error.userMessage = `Cannot connect to backend server. Please make sure the backend is running at ${backendUrl}`;
    } else if (error.response) {
      // Server responded with error status
      console.error(`API Error ${error.response.status}:`, error.response.data);
    }
    return Promise.reject(error);
  }
);

export const api = {
  searchHotels: async (query: string, token?: string): Promise<Hotel[]> => {
    try {
      const config: any = {
        params: { q: query, limit: 20 },
      };

      if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
      }

      const response = await apiClient.get('/api/search', config);
      return response.data;
    } catch (error: any) {
      console.error('Error searching hotels:', error);
      const errorMessage = error.networkError 
        ? error.userMessage 
        : (error.response?.data?.detail || 'Failed to search hotels');
      throw new Error(errorMessage);
    }
  },

  getSearchSuggestions: async (query: string, limit: number = 10): Promise<Array<{type: string; text: string; location?: string; hotel_id?: number}>> => {
    try {
      const response = await apiClient.get('/api/search/suggestions', {
        params: { q: query, limit: limit },
      });
      return response.data || [];
    } catch (error: any) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  },

  getRecommendations: async (
    userId: string,
    token: string,
    location?: string,
    limit: number = 1000,  // Increased to get all hotels (was 20)
    amenities?: string[],
    minRating?: number
  ): Promise<Hotel[]> => {
    try {
      const requestBody: any = {
        user_id: userId,
        limit: limit,
      };
      
      if (location && location.trim() !== '') {
        requestBody.location = location;
      }
      
      if (amenities && amenities.length > 0) {
        requestBody.amenities = amenities;
      }
      
      if (minRating !== undefined && minRating !== null) {
        requestBody.min_rating = minRating;
      }

      const response = await apiClient.post(
        '/api/recommendations',
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log('Recommendations response:', response.data?.length || 0, 'hotels');
      return response.data || [];
    } catch (error: any) {
      console.error('Error getting recommendations:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.networkError 
        ? error.userMessage 
        : (error.response?.data?.detail || error.message || 'Failed to get recommendations');
      throw new Error(errorMessage);
    }
  },

  getHotels: async (
    location?: string,
    minRating?: number,
    token?: string
  ): Promise<Hotel[]> => {
    try {
      const config: any = {
        params: {
          limit: 50,
        },
      };

      if (location) {
        config.params.location = location;
      }

      if (minRating) {
        config.params.min_rating = minRating;
      }

      if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
      }

      const response = await apiClient.get('/api/hotels', config);
      return response.data;
    } catch (error: any) {
      console.error('Error getting hotels:', error);
      const errorMessage = error.networkError 
        ? error.userMessage 
        : (error.response?.data?.detail || 'Failed to get hotels');
      throw new Error(errorMessage);
    }
  },

  getHotelDetails: async (hotelId: number | string, token?: string): Promise<any> => {
    try {
      const config: any = {};

      if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
      }

      const response = await apiClient.get(`/api/hotels/${hotelId}`, config);
      return response.data;
    } catch (error: any) {
      console.error('Error getting hotel details:', error);
      throw new Error(error.response?.data?.detail || 'Failed to get hotel details');
    }
  },

  getHotelImages: async (hotelId: number | string): Promise<Array<{url: string; index: number; file_id: string; name: string}>> => {
    try {
      console.log('Fetching images for hotel:', hotelId);
      const response = await apiClient.get(`/api/hotel-images/${hotelId}/list`);
      console.log('Images API response:', response.data);
      const images = response.data?.images || [];
      console.log('Parsed images count:', images.length);
      return images;
    } catch (error: any) {
      console.error('Error getting hotel images:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      // Return empty array on error instead of throwing
      return [];
    }
  },
};

