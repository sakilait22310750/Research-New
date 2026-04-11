# SentimentMap Mobile App

AI-powered tourism sentiment analysis mobile application that visualizes research outputs from "Sarcasm-Aware Multimodal Location-Based Sentiment Analysis for Tourism".

## Architecture

This application uses a **client-server architecture**:
- **Backend**: Python Flask server that loads research data and connects to trained BERT models
- **Frontend**: React Native mobile app that communicates with the backend via REST API

## Features

- **Dashboard**: Overview of analyzed locations with sentiment metrics
- **Location List**: Search and browse all analyzed destinations
- **Location Details**: Deep dive into sentiment analysis with aspect breakdown
- **Recommendations**: Smart recommendations based on categories (Scenic, Food & Culture, Budget-friendly)
- **Sarcasm Detection**: View sarcastic reviews and their impact on sentiment
- **Aspect Analysis**: Detailed sentiment scores for food, safety, attractions, etc.

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the backend server:
```bash
# Windows
start_server.bat

# Linux/Mac
chmod +x start_server.sh
./start_server.sh

# Or directly
python app.py
```

The backend server will start on `http://localhost:5000`

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Configure API URL (if needed):
   - Edit `src/services/apiService.js`
   - For Android emulator: use `http://10.0.2.2:5000/api`
   - For iOS simulator: use `http://localhost:5000/api`
   - For physical device: use your computer's IP address (e.g., `http://192.168.1.100:5000/api`)

3. Start the development server:
```bash
npm start
```

4. Run the app:
- **iOS**: `npm run ios` (requires macOS)
- **Android**: `npm run android`
- **Web**: `npm run web` (for testing)

## Data Sources

The backend server loads research data from the `data/` folder:

- `final_multimodal_location_analysis.csv` - Primary sentiment scores
- `location_aspect_scores.csv` - Aspect-level sentiment analysis
- `absa_corrected_for_sarcasm.csv` - Sarcasm-corrected sentiment data
- `image_mapping.json` - Location image mappings

The backend also connects to trained BERT models in `../bert_gpu_optimized/` for potential real-time inference.

## Data Format Requirements

### final_multimodal_location_analysis.csv
```csv
location,pred_fused_overall,sarcasm_rate,sarcasm_count,total_aspects,...
Bentota Beach,-0.10528500413501451,0.5347533632286996,477,892,...
```

### location_aspect_scores.csv
```csv
location,aspect,avg_polarity,avg_confidence
Bentota Beach,amenities,0.331,0.338
```

### absa_corrected_for_sarcasm (2).csv
```csv
review_id,location,review_text_clean,aspect,is_sarcastic,sarcasm_confidence,...
REV_000000,Bentota Beach,beautiful beach so clean...,cleanliness,1,0.998,...
```

### image_mapping.json
```json
{
  "Bentota Beach": [
    "/path/to/image1.jpg",
    "/path/to/image2.jpg"
  ]
}
```

## Modifying Data

To update the app with new research data:

1. Replace files in the `data/` folder with your new CSV/JSON files
2. Ensure the column names match the expected format
3. Restart the app to reload the data

### Adding New Locations
Simply add new rows to your CSV files. The app will automatically detect and display new locations.

### Adding New Aspects
Add new aspect entries to `location_aspect_scores.csv`. The app will automatically include them in the analysis.

## Project Structure

```
SentimentMapApp/
├── backend/                  # Python Flask backend server
│   ├── app.py               # Main Flask application
│   ├── requirements.txt     # Python dependencies
│   └── README.md            # Backend documentation
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/             # App screens
│   └── services/
│       ├── apiService.js     # API client for backend
│       ├── dataService.js    # Legacy data service (deprecated)
│       └── searchService.js  # Search functionality
├── data/                     # Research data files (CSV/JSON)
└── App.js                    # Main app entry point
```

## Key Features

### Sentiment Visualization
- Converts research scores (-1 to 1) to percentages (0-100%)
- Color-coded sentiment indicators
- Progress bars for visual representation

### Sarcasm Detection
- Displays sarcasm rate per location
- Shows example sarcastic comments
- Explains impact on sentiment analysis

### Aspect Analysis
- Breaks down sentiment by aspects (food, safety, attractions, etc.)
- Shows top 3 aspects per location
- Visual progress bars for each aspect

### Recommendations
- Categories: Scenic, Food & Culture, Budget-friendly
- AI-powered sorting by sentiment
- Category-specific insights

## Technical Details

- **Framework**: React Native with Expo
- **UI Library**: React Native Paper
- **Navigation**: React Navigation
- **Data Processing**: CSV parsing with csv-parse
- **Icons**: Expo Vector Icons

## Troubleshooting

### Data Not Loading
1. Verify CSV files exist in the `data/` folder
2. Check column names match expected format
3. Ensure CSV files are properly formatted

### App Crashes on Start
1. Check console for error messages
2. Verify all dependencies are installed
3. Ensure data files are not corrupted

### Performance Issues
1. Large CSV files may cause slow loading
2. Consider optimizing data size for mobile
3. Use pagination for large location lists

## Research Integration

This app is specifically designed to visualize academic research outputs. The sentiment scores, sarcasm detection, and aspect analysis come directly from your AI models without any hardcoded values.

### Model Confidence
The app calculates model confidence based on:
- Text sentiment confidence
- Image sentiment confidence
- Fused multimodal confidence

### Sentiment Labels
- **Very Positive**: 80-100%
- **Positive**: 60-79%
- **Neutral**: 40-59%
- **Negative**: 20-39%
- **Very Negative**: 0-19%

## Support

For issues related to:
- **App functionality**: Check this README and console logs
- **Data format**: Verify CSV/JSON structure matches requirements
- **Research methodology**: Refer to your research documentation
