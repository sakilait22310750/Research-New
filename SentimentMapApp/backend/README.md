# SentimentMap Backend API Server

Backend server for the SentimentMap mobile application. This server provides REST API endpoints to access the research data and connects to trained BERT models.

## Features

- RESTful API endpoints for all mobile app functions
- Loads research data from CSV/JSON files
- Connects to trained BERT models for potential real-time inference
- CORS enabled for mobile app access
- Efficient data caching

## Installation

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

## Running the Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Locations
- `GET /api/locations` - Get all locations
- `GET /api/locations/<location_name>` - Get location details

### Aspects
- `GET /api/aspects` - Get all aspect scores

### Sarcasm
- `GET /api/sarcasm` - Get sarcasm detection data

### Recommendations
- `GET /api/recommendations?category=<category>` - Get recommendations
  - Categories: `all`, `scenic`, `food`, `budget`

### Search
- `GET /api/search?q=<query>` - Search locations

### Prediction (Optional)
- `POST /api/predict` - Real-time sentiment prediction using BERT model

## Configuration

The server automatically loads data from:
- `../data/final_multimodal_location_analysis.csv`
- `../data/location_aspect_scores.csv`
- `../data/absa_corrected_for_sarcasm.csv`
- `../data/image_mapping.json`

The BERT model is loaded from:
- `../../bert_gpu_optimized/`

## Notes

- The server loads all data into memory on startup for fast access
- BERT model loading is optional - the server will continue without it if the model cannot be loaded
- All endpoints return JSON responses
- Error responses include error messages in JSON format

