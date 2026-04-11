# SentimentMap App Architecture

## Overview

The SentimentMap mobile application uses a **client-server architecture** where:
- The **backend** (Python Flask) serves research data and connects to trained AI models
- The **frontend** (React Native) provides the user interface and communicates with the backend via REST API

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Frontend)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │Dashboard │  │ Locations│  │  Search  │  ...       │
│  └────┬─────┘  └────┬──────┘  └────┬──────┘            │
│       │             │               │                    │
│       └─────────────┴───────────────┘                    │
│                      │                                    │
│              ┌───────▼────────┐                          │
│              │  API Service   │                          │
│              │  (apiService)  │                          │
│              └───────┬────────┘                          │
└──────────────────────┼───────────────────────────────────┘
                       │ HTTP/REST API
                       │
┌──────────────────────▼───────────────────────────────────┐
│              Backend Server (Flask)                       │
│  ┌──────────────────────────────────────────┐            │
│  │         API Endpoints                     │            │
│  │  - /api/locations                         │            │
│  │  - /api/dashboard/stats                   │            │
│  │  - /api/recommendations                   │            │
│  │  - /api/search                           │            │
│  └──────────────────────────────────────────┘            │
│                       │                                    │
│  ┌────────────────────┼────────────────────┐              │
│  │                    │                    │              │
│  ┌──────────▼────────┐  ┌─────────▼────────┐              │
│  │   Data Loader     │  │  BERT Model     │              │
│  │  (CSV/JSON)       │  │  (Optional)     │              │
│  └──────────────────┘  └─────────────────┘              │
│         │                      │                          │
└─────────┼──────────────────────┼──────────────────────────┘
          │                      │
┌─────────▼──────────┐  ┌────────▼──────────────┐
│   Research Data    │  │   Trained Models      │
│   - CSV files      │  │   - bert_gpu_optimized│
│   - JSON files     │  │   - Model weights     │
└────────────────────┘  └───────────────────────┘
```

## Data Flow

1. **User Interaction**: User interacts with the mobile app (e.g., views dashboard, searches locations)

2. **API Request**: The app's API service makes an HTTP request to the backend server

3. **Backend Processing**: 
   - Backend receives the request
   - Loads data from CSV/JSON files (cached in memory)
   - Optionally uses BERT model for real-time predictions
   - Processes and formats the data

4. **API Response**: Backend returns JSON response with the requested data

5. **UI Update**: Mobile app receives the response and updates the UI

## Key Components

### Frontend (React Native)

- **Screens**: User interface screens (Dashboard, LocationList, LocationDetail, etc.)
- **API Service**: Handles all HTTP requests to the backend
- **Components**: Reusable UI components

### Backend (Python Flask)

- **Flask App**: Main server application
- **Data Loader**: Loads and caches CSV/JSON files
- **BERT Model**: Optional model for real-time inference
- **API Endpoints**: RESTful endpoints for all app functions

## Benefits of This Architecture

1. **Separation of Concerns**: Business logic in backend, UI in frontend
2. **Scalability**: Backend can be deployed separately and scaled
3. **Model Access**: Backend can access large AI models that can't run on mobile
4. **Data Security**: Research data stays on the server
5. **Flexibility**: Easy to update backend without changing mobile app
6. **Real-time Processing**: Can perform real-time inference using trained models

## API Communication

All communication between frontend and backend uses:
- **Protocol**: HTTP/HTTPS
- **Format**: JSON
- **Method**: RESTful API
- **CORS**: Enabled for cross-origin requests

## Data Sources

### Backend Data Files
- `data/final_multimodal_location_analysis.csv` - Location sentiment scores
- `data/location_aspect_scores.csv` - Aspect-level analysis
- `data/absa_corrected_for_sarcasm.csv` - Sarcasm-corrected data
- `data/image_mapping.json` - Location images

### Trained Models
- `bert_gpu_optimized/` - BERT model for sentiment analysis and sarcasm detection

## Development vs Production

### Development
- Backend runs on `localhost:5000`
- Mobile app connects via localhost (simulator) or local IP (physical device)
- Debug mode enabled

### Production
- Backend deployed on a server with public IP/domain
- Mobile app configured with production API URL
- HTTPS enabled
- Production WSGI server (e.g., Gunicorn)

