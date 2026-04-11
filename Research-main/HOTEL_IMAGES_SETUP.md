# Hotel Images Setup Guide

## Overview
This guide explains how to add real hotel images from your Google Drive folder to the AccommoBuddy app.

## Image Folder Structure
Hotel images should be placed in: `/app/backend/hotel_images/`

## Naming Convention
Images should be named according to hotel_id:
- Format: `{hotel_id}.jpg` or `{hotel_id}.png`
- Examples: `0.jpg`, `1.jpg`, `23.png`, etc.

## Hotel ID Mapping
Here are the hotel IDs from your dataset (first 20):

| Hotel ID | Hotel Name | Location |
|----------|------------|----------|
| 0 | Aditya Resort | Hikkaduwa, Galle District |
| 1 | Amaranthe Bay Resort | Trincomalee, Eastern Province |
| 2 | Amaya Hills Kandy | Kandy, Central Province |
| 3 | Anantara Peace Haven Tangalle Resort | Tangalle, Southern Province |
| 4 | Arie Lagoon | Negombo, Western Province |
| 5 | Avani Bentota Resort & Spa | Bentota, Southern Province |
| 6 | Camelot Beach Hotel | Negombo, Western Province |
| 7 | Cinnamon Bey Beruwala | Beruwala, Western Province |
| 8 | Cinnamon Citadel Kandy | Kandy, Central Province |
| 9 | Cinnamon Grand Colombo | Colombo, Western Province |
| 10 | Cinnamon Lodge Habarana | Habarana, North Central Province |
| 11 | Cinnamon Red Colombo | Colombo, Western Province |
| 12 | Cinnamon Wild Yala | Yala, Southern Province |
| 13 | Club Hotel Dolphin | Negombo, Western Province |
| 14 | Earl's Reef | Beruwala, Western Province |
| 15 | Galadari Hotel | Colombo, Western Province |
| 16 | Galle Face Hotel | Colombo, Western Province |
| 17 | Heritance Ahungalla | Ahungalla, Southern Province |
| 18 | Heritance Kandalama | Dambulla, Central Province |
| 19 | Heritance Tea Factory | Nuwara Eliya, Central Province |

Total hotels in dataset: **104 hotels**

## Steps to Add Images

### Option 1: Manual Download (Recommended for now)
1. Download images from your Google Drive folder
2. Rename each image to match its hotel_id (e.g., `0.jpg`, `1.jpg`)
3. Copy images to `/app/backend/hotel_images/` folder
4. Restart the backend service: `sudo supervisorctl restart backend`

### Option 2: Automated Upload (For Production)
Create an upload script to batch process images from Google Drive.

## Image Requirements
- **Format**: JPG, PNG, or WebP
- **Recommended size**: 1200x800 pixels (3:2 aspect ratio)
- **Max file size**: 5MB per image
- **Quality**: High resolution for mobile displays

## API Integration
The backend now serves hotel images through:
```
GET /api/hotel-image/{hotel_id}
```

This endpoint will:
- Look for `{hotel_id}.jpg` or `{hotel_id}.png` in `/app/backend/hotel_images/`
- Return the image if found
- Return a placeholder if not found

## Testing
Once images are added, you can test by visiting:
```
http://localhost:8001/api/hotel-image/0
http://localhost:8001/api/hotel-image/1
```

## Frontend Display
The mobile app will automatically display these images in:
- Hotel cards on recommendations screen
- Hotel details page
- Booking flow screens

## Note About Google Drive
The Google Drive folder you shared requires authentication. For automated download, you would need to:
1. Enable Google Drive API
2. Get OAuth2 credentials
3. Create a script to download all images programmatically

For the MVP, manual download and upload is the fastest approach.
