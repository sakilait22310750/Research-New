# Google Drive Images Setup Guide

## Overview
Hotel images are stored in a Google Drive folder: https://drive.google.com/drive/folders/1LwQm93QxqnwWTGv75xCejyu8a3iT7SGn

Each hotel has a folder named with its hotel_id containing images.

## Option 1: Direct Google Drive Links (Simplest)

If your Google Drive folder is public, you can use direct links:

1. Make the Google Drive folder public (Share → Anyone with the link)
2. For each hotel folder, get the file ID of the first image
3. Use the format: `https://drive.google.com/uc?export=view&id=FILE_ID`

## Option 2: Google Drive API (Recommended for Production)

1. Set up Google Drive API credentials
2. Enable Google Drive API in Google Cloud Console
3. Create a service account or OAuth credentials
4. Implement the backend endpoint to fetch images using the API

## Option 3: Backend Proxy (Current Implementation)

The current implementation uses a backend endpoint `/api/hotel-images/{hotel_id}` that should:
1. Authenticate with Google Drive API
2. List files in the hotel folder
3. Return the image URL or redirect to the image

## Quick Setup for Testing

For now, you can manually update the `getHotelImageUrl` function in `frontend/utils/imageUtils.ts` to use direct Google Drive links if you have the file IDs.

Example:
```typescript
export const getHotelImageUrl = (hotelId: number | string, imageIndex: number = 1): string => {
  // Replace FILE_ID with actual Google Drive file ID
  return `https://drive.google.com/uc?export=view&id=FILE_ID`;
};
```







