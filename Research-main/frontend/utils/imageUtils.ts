/**
 * Utility functions for handling hotel images from Google Drive
 * 
 * Google Drive folder: https://drive.google.com/drive/folders/1LwQm93QxqnwWTGv75xCejyu8a3iT7SGn
 * Each hotel has a folder named with its hotel_id containing images
 */

const GOOGLE_DRIVE_FOLDER_ID = '1LwQm93QxqnwWTGv75xCejyu8a3iT7SGn';

/**
 * Get hotel image URL from Google Drive
 * 
 * Google Drive folder: https://drive.google.com/drive/folders/1LwQm93QxqnwWTGv75xCejyu8a3iT7SGn
 * Each hotel has a folder named with its hotel_id containing images
 * 
 * This function supports multiple approaches:
 * 1. Backend proxy endpoint (recommended for production)
 * 2. Direct Google Drive links (if folder is public and you have file IDs)
 * 
 * @param hotelId - The hotel ID (folder name in Google Drive)
 * @param imageIndex - Image index (defaults to 1 for first image)
 * @returns Image URL
 */
// Cache for image URLs to avoid repeated API calls
const imageUrlCache: Record<string, string> = {};

export const getHotelImageUrl = async (hotelId: number | string, imageIndex: number = 1): Promise<string> => {
  const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.8.178:8000';
  const cacheKey = `${hotelId}-${imageIndex}`;
  
  // Return cached URL if available
  if (imageUrlCache[cacheKey]) {
    return imageUrlCache[cacheKey];
  }
  
  // Use proxy endpoint directly for better React Native compatibility
  const imageUrl = `${API_BASE_URL}/api/hotel-images/${hotelId}/proxy?index=${imageIndex}`;
  
  // Cache the URL
  imageUrlCache[cacheKey] = imageUrl;
  
  return imageUrl;
};

// Synchronous version for backward compatibility (returns proxy URL directly)
export const getHotelImageUrlSync = (hotelId: number | string, imageIndex: number = 1): string => {
  const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.8.178:8000';
  const cacheKey = `${hotelId}-${imageIndex}`;
  
  // Return cached URL if available
  if (imageUrlCache[cacheKey]) {
    return imageUrlCache[cacheKey];
  }
  
  // Return proxy endpoint directly - works better with React Native
  const imageUrl = `${API_BASE_URL}/api/hotel-images/${hotelId}/proxy?index=${imageIndex}`;
  imageUrlCache[cacheKey] = imageUrl;
  return imageUrl;
};

/**
 * Get multiple image URLs for a hotel gallery
 */
export const getHotelImageUrls = (hotelId: number | string, count: number = 5): string[] => {
  const urls: string[] = [];
  for (let i = 1; i <= count; i++) {
    urls.push(getHotelImageUrl(hotelId, i));
  }
  return urls;
};

/**
 * Get a fallback placeholder image
 */
export const getPlaceholderImage = (): string => {
  return 'https://via.placeholder.com/400x300/10b981/ffffff?text=Hotel+Image';
};

