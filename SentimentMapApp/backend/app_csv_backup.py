"""
Backend API Server for SentimentMap Mobile App
Sarcasm-Aware Multimodal Location-Based Sentiment Analysis for Tourism

This backend serves the research data and connects to trained BERT models.
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import pandas as pd
import json
import os
from pathlib import Path
import numpy as np
from typing import Dict, List, Optional
import logging
import urllib.parse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for mobile app

# Paths configuration
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / 'data'
MODEL_DIR = BASE_DIR.parent / 'bert_gpu_optimized'
IMAGES_DIR = BASE_DIR / 'images'  # Directory for location images

# Global data cache
data_cache = {
    'location_analysis': None,
    'aspect_scores': None,
    'sarcasm_data': None,
    'image_mapping': None,
    'preprocessed_reviews': None
}

# Load BERT model (optional - for future real-time inference)
bert_model = None
tokenizer = None

def load_bert_model():
    """Load the trained BERT model for potential real-time inference"""
    global bert_model, tokenizer
    try:
        from transformers import BertForSequenceClassification, BertTokenizer
        import torch
        
        if os.path.exists(MODEL_DIR):
            logger.info(f"Loading BERT model from {MODEL_DIR}")
            # Load tokenizer
            tokenizer = BertTokenizer.from_pretrained(str(MODEL_DIR))
            # Load model
            bert_model = BertForSequenceClassification.from_pretrained(str(MODEL_DIR))
            bert_model.eval()  # Set to evaluation mode
            logger.info("BERT model loaded successfully")
        else:
            logger.warning(f"Model directory not found: {MODEL_DIR}")
    except Exception as e:
        logger.warning(f"Could not load BERT model: {e}. Continuing without model.")


def load_data_files():
    """Load all data files into memory"""
    try:
        # Load location analysis
        location_file = DATA_DIR / 'final_multimodal_location_analysis.csv'
        if location_file.exists():
            # Use error_bad_lines=False and on_bad_lines='skip' for pandas 2.0+
            # This handles CSV files with inconsistent column counts
            try:
                data_cache['location_analysis'] = pd.read_csv(location_file, on_bad_lines='skip', engine='python')
            except TypeError:
                # For older pandas versions
                data_cache['location_analysis'] = pd.read_csv(location_file, error_bad_lines=False, warn_bad_lines=True, engine='python')
            logger.info(f"Loaded location analysis: {len(data_cache['location_analysis'])} locations")
        
        # Load aspect scores
        aspect_file = DATA_DIR / 'location_aspect_scores.csv'
        if aspect_file.exists():
            try:
                data_cache['aspect_scores'] = pd.read_csv(aspect_file, on_bad_lines='skip', engine='python')
            except TypeError:
                data_cache['aspect_scores'] = pd.read_csv(aspect_file, error_bad_lines=False, warn_bad_lines=True, engine='python')
            logger.info(f"Loaded aspect scores: {len(data_cache['aspect_scores'])} records")
        
        # Load sarcasm data
        sarcasm_file = DATA_DIR / 'absa_corrected_for_sarcasm.csv'
        if sarcasm_file.exists():
            try:
                data_cache['sarcasm_data'] = pd.read_csv(sarcasm_file, on_bad_lines='skip', engine='python')
            except TypeError:
                data_cache['sarcasm_data'] = pd.read_csv(sarcasm_file, error_bad_lines=False, warn_bad_lines=True, engine='python')
            logger.info(f"Loaded sarcasm data: {len(data_cache['sarcasm_data'])} records")
        
        # Load image mapping
        image_file = DATA_DIR / 'image_mapping.json'
        if image_file.exists():
            with open(image_file, 'r') as f:
                data_cache['image_mapping'] = json.load(f)
            logger.info(f"Loaded image mapping: {len(data_cache['image_mapping'])} locations")
        
        # Load preprocessed reviews
        preprocessed_file = DATA_DIR / 'preprocessed_reviews.csv'
        if preprocessed_file.exists():
            try:
                data_cache['preprocessed_reviews'] = pd.read_csv(preprocessed_file, on_bad_lines='skip', engine='python')
            except TypeError:
                data_cache['preprocessed_reviews'] = pd.read_csv(preprocessed_file, error_bad_lines=False, warn_bad_lines=True, engine='python')
            logger.info(f"Loaded preprocessed reviews: {len(data_cache['preprocessed_reviews'])} reviews")
        
    except Exception as e:
        logger.error(f"Error loading data files: {e}")
        raise


def normalize_sentiment(score):
    """Convert -1 to 1 range to 0-100 percentage"""
    if pd.isna(score) or score is None:
        return 50  # Neutral
    return int(((float(score) + 1) / 2) * 100)


def calculate_confidence(row):
    """Calculate model confidence based on various factors"""
    try:
        text_conf = abs(float(row.get('pred_text_overall', 0) or 0))
        image_conf = abs(float(row.get('pred_image_overall', 0) or 0))
        fused_conf = abs(float(row.get('pred_fused_overall', 0) or 0))
        return int(((text_conf + image_conf + fused_conf) / 3) * 100)
    except:
        return 50


def calculate_trend(row):
    """Calculate trend based on text-image gap"""
    try:
        gap = float(row.get('text_image_gap', 0) or 0)
        if gap > 0.1:
            return 'up'
        elif gap < -0.1:
            return 'down'
        return 'stable'
    except:
        return 'stable'


def convert_image_path_to_url(image_path):
    """Convert image path to backend URL"""
    if not image_path:
        return None
    
    # If it's already a URL, return as is
    if image_path.startswith('http://') or image_path.startswith('https://'):
        return image_path
    
    # Extract filename from Google Drive path
    # Example: "/content/drive/My Drive/Tourism_Sentiment_Research/images/Bentota Beach/9.jpg" 
    # -> "Bentota Beach/9.jpg"
    if '/images/' in image_path:
        # Extract location name and filename
        parts = image_path.split('/images/')
        if len(parts) > 1:
            location_and_file = parts[1]
            # URL encode the path
            encoded_path = urllib.parse.quote(location_and_file, safe='/')
            # Return backend URL
            return f'/api/images/{encoded_path}'
    
    # If it's a relative path, try to serve it
    if image_path.startswith('/'):
        filename = os.path.basename(image_path)
        location_name = os.path.basename(os.path.dirname(image_path))
        return f'/api/images/{urllib.parse.quote(location_name)}/{urllib.parse.quote(filename)}'
    
    return None


@app.route('/api/images/<path:image_path>', methods=['GET'])
def serve_image(image_path):
    """Serve images from the images directory"""
    try:
        # Decode the path
        decoded_path = urllib.parse.unquote(image_path)
        
        # Check if images directory exists
        if not IMAGES_DIR.exists():
            return jsonify({'error': 'Images directory not found'}), 404
        
        # Try to find the image file
        image_file = IMAGES_DIR / decoded_path
        
        # Security check: ensure the path is within images directory
        try:
            image_file.resolve().relative_to(IMAGES_DIR.resolve())
        except ValueError:
            return jsonify({'error': 'Invalid image path'}), 403
        
        if image_file.exists() and image_file.is_file():
            return send_from_directory(str(IMAGES_DIR), decoded_path)
        else:
            # Return a placeholder or 404
            return jsonify({'error': 'Image not found'}), 404
    except Exception as e:
        logger.error(f"Error serving image: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    # Check if data is loaded (DataFrames are not None)
    data_loaded = (
        data_cache['location_analysis'] is not None and
        data_cache['aspect_scores'] is not None and
        data_cache['sarcasm_data'] is not None and
        data_cache['image_mapping'] is not None
    )
    
    return jsonify({
        'status': 'healthy',
        'data_loaded': data_loaded,
        'model_loaded': bert_model is not None,
        'locations_count': len(data_cache['location_analysis']) if data_cache['location_analysis'] is not None else 0,
        'aspects_count': len(data_cache['aspect_scores']) if data_cache['aspect_scores'] is not None else 0,
        'sarcasm_count': len(data_cache['sarcasm_data']) if data_cache['sarcasm_data'] is not None else 0
    })


@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        if data_cache['location_analysis'] is None:
            return jsonify({'error': 'Data not loaded'}), 500
        
        df = data_cache['location_analysis']
        total_locations = len(df)
        
        # Calculate average sentiment
        sentiments = df['pred_fused_overall'].apply(normalize_sentiment)
        avg_sentiment = int(sentiments.mean())
        
        # Calculate positive percentage
        positive_count = len(sentiments[sentiments >= 60])
        positive_percentage = int((positive_count / total_locations) * 100) if total_locations > 0 else 0
        
        # Total reviews from aspect scores
        total_reviews = len(data_cache['aspect_scores']) if data_cache['aspect_scores'] is not None else 0
        
        return jsonify({
            'totalLocations': total_locations,
            'avgSentiment': avg_sentiment,
            'positivePercentage': positive_percentage,
            'totalReviews': total_reviews
        })
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/locations', methods=['GET'])
def get_locations():
    """Get all locations with sentiment data - returns unique locations only"""
    try:
        if data_cache['location_analysis'] is None:
            return jsonify({'error': 'Data not loaded'}), 500
        
        df = data_cache['location_analysis']
        
        # Group by location name to get unique locations with aggregated data
        # This ensures we get all locations even if CSV has multiple rows per location
        location_dict = {}
        
        for _, row in df.iterrows():
            loc_name = str(row['location']).strip()
            
            if loc_name not in location_dict:
                # First time seeing this location
                location_dict[loc_name] = {
                    'location': loc_name,
                    'overallSentiment': normalize_sentiment(row.get('pred_fused_overall', 0)),
                    'sarcasmRate': int(float(row.get('sarcasm_rate', 0)) * 100) if pd.notna(row.get('sarcasm_rate')) else 0,
                    'sarcasmCount': int(row.get('sarcasm_count', 0)) if pd.notna(row.get('sarcasm_count')) else 0,
                    'totalAspects': int(row.get('total_aspects', 0)) if pd.notna(row.get('total_aspects')) else 0,
                    'trend': calculate_trend(row),
                    'row_count': 1
                }
            else:
                # Location already exists - aggregate data if needed
                # Use the highest sentiment or average (depending on your preference)
                existing_sentiment = location_dict[loc_name]['overallSentiment']
                new_sentiment = normalize_sentiment(row.get('pred_fused_overall', 0))
                # Keep the higher sentiment (more positive)
                if new_sentiment > existing_sentiment:
                    location_dict[loc_name]['overallSentiment'] = new_sentiment
                
                location_dict[loc_name]['row_count'] += 1
        
        locations = list(location_dict.values())
        logger.info(f"Returning {len(locations)} unique locations")
        
        return jsonify(locations)
    except Exception as e:
        logger.error(f"Error getting locations: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/locations/<location_name>', methods=['GET'])
def get_location_details(location_name):
    """Get detailed information for a specific location"""
    try:
        # Get location data
        if data_cache['location_analysis'] is None:
            return jsonify({'error': 'Data not loaded'}), 500
        
        location_df = data_cache['location_analysis']
        location_row = location_df[location_df['location'] == location_name]
        
        if location_row.empty:
            return jsonify({'error': 'Location not found'}), 404
        
        row = location_row.iloc[0]
        location_data = {
            'location': row['location'],
            'overallSentiment': normalize_sentiment(row.get('pred_fused_overall', 0)),
            'sarcasmRate': int(float(row.get('sarcasm_rate', 0)) * 100) if pd.notna(row.get('sarcasm_rate')) else 0,
            'sarcasmCount': int(row.get('sarcasm_count', 0)) if pd.notna(row.get('sarcasm_count')) else 0,
            'totalAspects': int(row.get('total_aspects', 0)) if pd.notna(row.get('total_aspects')) else 0,
            'modelConfidence': calculate_confidence(row),
            'trend': calculate_trend(row)
        }
        
        # Get aspect scores
        aspects = []
        if data_cache['aspect_scores'] is not None:
            aspect_df = data_cache['aspect_scores']
            location_aspects = aspect_df[aspect_df['location'] == location_name]
            
            for _, aspect_row in location_aspects.iterrows():
                aspects.append({
                    'location': aspect_row['location'],
                    'aspect': aspect_row['aspect'],
                    'score': normalize_sentiment(aspect_row.get('avg_polarity', 0)),
                    'confidence': int(float(aspect_row.get('avg_confidence', 0)) * 100) if pd.notna(aspect_row.get('avg_confidence')) else 0
                })
        
        # Get top 3 aspects
        top_aspects = sorted(aspects, key=lambda x: x['score'], reverse=True)[:3]
        
        # Get sample reviews from preprocessed dataset
        sample_reviews = []
        if data_cache['preprocessed_reviews'] is not None:
            reviews_df = data_cache['preprocessed_reviews']
            location_reviews = reviews_df[reviews_df['location'] == location_name]
            
            if not location_reviews.empty:
                # Get 5 random sample reviews (or all if less than 5)
                sample_count = min(5, len(location_reviews))
                sample_reviews_df = location_reviews.sample(n=sample_count) if len(location_reviews) > sample_count else location_reviews
                
                for _, review_row in sample_reviews_df.iterrows():
                    review_text = review_row.get('review_text', '')
                    if pd.notna(review_text) and str(review_text).strip():
                        sample_reviews.append({
                            'reviewText': str(review_text).strip(),
                            'location': location_name
                        })
        
        # Get images
        images = []
        if data_cache['image_mapping'] is not None:
            images = data_cache['image_mapping'].get(location_name, [])
        
        location_data.update({
            'aspects': aspects,
            'topAspects': top_aspects,
            'sampleReviews': sample_reviews,
            'images': images
        })
        
        return jsonify(location_data)
    except Exception as e:
        logger.error(f"Error getting location details: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/aspects', methods=['GET'])
def get_aspect_scores():
    """Get all aspect scores"""
    try:
        if data_cache['aspect_scores'] is None:
            return jsonify({'error': 'Data not loaded'}), 500
        
        df = data_cache['aspect_scores']
        aspects = []
        
        for _, row in df.iterrows():
            aspects.append({
                'location': row['location'],
                'aspect': row['aspect'],
                'score': normalize_sentiment(row.get('avg_polarity', 0)),
                'confidence': int(float(row.get('avg_confidence', 0)) * 100) if pd.notna(row.get('avg_confidence')) else 0
            })
        
        return jsonify(aspects)
    except Exception as e:
        logger.error(f"Error getting aspect scores: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/sarcasm', methods=['GET'])
def get_sarcasm_data():
    """Get sarcasm detection data"""
    try:
        if data_cache['sarcasm_data'] is None:
            return jsonify({'error': 'Data not loaded'}), 500
        
        df = data_cache['sarcasm_data']
        sarcasm_data = []
        
        for _, row in df.iterrows():
            sarcasm_data.append({
                'location': row['location'],
                'reviewText': row.get('review_text_clean', ''),
                'aspect': row.get('aspect', ''),
                'isSarcastic': int(row.get('is_sarcastic', 0)) == 1,
                'sarcasmConfidence': int(float(row.get('sarcasm_confidence', 0)) * 100) if pd.notna(row.get('sarcasm_confidence')) else 0,
                'wasCorrected': row.get('was_corrected', False) == True or row.get('was_corrected', False) == 'True',
                'originalSentiment': row.get('sentiment', ''),
                'correctedSentiment': row.get('sentiment_corrected', '')
            })
        
        return jsonify(sarcasm_data)
    except Exception as e:
        logger.error(f"Error getting sarcasm data: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    """Get recommendations based on category"""
    try:
        category = request.args.get('category', 'all')
        
        if data_cache['location_analysis'] is None:
            return jsonify({'error': 'Data not loaded'}), 500
        
        df = data_cache['location_analysis']
        aspect_df = data_cache['aspect_scores'] if data_cache['aspect_scores'] is not None else pd.DataFrame()
        
        # Filter by category
        if category == 'scenic':
            # Filter by attractions and view aspects
            scenic_aspects = aspect_df[aspect_df['aspect'].isin(['attractions', 'view'])]
            scenic_locations = scenic_aspects['location'].unique()
            df = df[df['location'].isin(scenic_locations)]
        elif category == 'food':
            # Filter by food aspect
            food_aspects = aspect_df[aspect_df['aspect'] == 'food']
            food_locations = food_aspects['location'].unique()
            df = df[df['location'].isin(food_locations)]
        elif category == 'budget':
            # Filter by value aspect
            value_aspects = aspect_df[aspect_df['aspect'] == 'value']
            budget_locations = value_aspects['location'].unique()
            df = df[df['location'].isin(budget_locations)]
        
        # Convert to location data format
        locations = []
        for _, row in df.iterrows():
            location_name = row['location']
            location_data = {
                'location': location_name,
                'overallSentiment': normalize_sentiment(row.get('pred_fused_overall', 0)),
                'sarcasmRate': int(float(row.get('sarcasm_rate', 0)) * 100) if pd.notna(row.get('sarcasm_rate')) else 0,
                'sarcasmCount': int(row.get('sarcasm_count', 0)) if pd.notna(row.get('sarcasm_count')) else 0,
                'totalAspects': int(row.get('total_aspects', 0)) if pd.notna(row.get('total_aspects')) else 0,
                'modelConfidence': calculate_confidence(row),
                'trend': calculate_trend(row)
            }
            
            # Get images for this location and convert paths to URLs
            images = []
            if data_cache['image_mapping'] is not None:
                raw_images = data_cache['image_mapping'].get(location_name, [])
                # Convert image paths to backend URLs
                images = [convert_image_path_to_url(img) for img in raw_images if convert_image_path_to_url(img)]
            location_data['images'] = images
            
            locations.append(location_data)
        
        # Sort by sentiment and return top 10
        locations.sort(key=lambda x: x['overallSentiment'], reverse=True)
        
        return jsonify(locations[:10])
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/search', methods=['GET'])
def search_locations():
    """Search locations by query"""
    try:
        query = request.args.get('q', '').lower()
        
        if not query:
            return jsonify([])
        
        if data_cache['location_analysis'] is None:
            return jsonify({'error': 'Data not loaded'}), 500
        
        df = data_cache['location_analysis']
        
        # Filter locations matching query - get unique locations
        matching_locations = df[df['location'].str.lower().str.contains(query, na=False)]
        
        # Group by location to get unique results
        location_dict = {}
        for _, row in matching_locations.iterrows():
            loc_name = str(row['location']).strip()
            if loc_name not in location_dict:
                location_dict[loc_name] = {
                    'location': loc_name,
                    'overallSentiment': normalize_sentiment(row.get('pred_fused_overall', 0)),
                    'sarcasmRate': int(float(row.get('sarcasm_rate', 0)) * 100) if pd.notna(row.get('sarcasm_rate')) else 0,
                    'sarcasmCount': int(row.get('sarcasm_count', 0)) if pd.notna(row.get('sarcasm_count')) else 0,
                    'totalAspects': int(row.get('total_aspects', 0)) if pd.notna(row.get('total_aspects')) else 0,
                    'trend': calculate_trend(row)
                }
        
        locations = list(location_dict.values())
        
        return jsonify(locations)
    except Exception as e:
        logger.error(f"Error searching locations: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/predict', methods=['POST'])
def predict_sentiment():
    """Real-time sentiment prediction using BERT model (optional)"""
    try:
        if bert_model is None or tokenizer is None:
            return jsonify({'error': 'Model not loaded'}), 503
        
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Tokenize and predict
        from transformers import BertForSequenceClassification
        import torch
        
        inputs = tokenizer(text, return_tensors='pt', truncation=True, max_length=512)
        
        with torch.no_grad():
            outputs = bert_model(**inputs)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        
        # Return prediction (adjust based on your model's output format)
        return jsonify({
            'text': text,
            'prediction': predictions.tolist()[0],
            'sentiment': 'positive' if predictions[0][1] > predictions[0][0] else 'negative'
        })
    except Exception as e:
        logger.error(f"Error in prediction: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    try:
        # Load data on startup
        logger.info("=" * 60)
        logger.info("SentimentMap Backend Server Starting...")
        logger.info("=" * 60)
        logger.info("Loading data files...")
        load_data_files()
        
        # Optionally load BERT model
        logger.info("Loading BERT model...")
        load_bert_model()
        
        # Verify data loaded
        if data_cache['location_analysis'] is None:
            logger.warning("WARNING: Location analysis data not loaded!")
        else:
            logger.info("Data loaded successfully")
            logger.info(f"  - Locations: {len(data_cache['location_analysis'])}")
            if data_cache['aspect_scores'] is not None:
                logger.info(f"  - Aspect scores: {len(data_cache['aspect_scores'])}")
            if data_cache['sarcasm_data'] is not None:
                logger.info(f"  - Sarcasm records: {len(data_cache['sarcasm_data'])}")
            if data_cache['preprocessed_reviews'] is not None:
                logger.info(f"  - Preprocessed reviews: {len(data_cache['preprocessed_reviews'])}")
        
        # Run server
        logger.info("=" * 60)
        logger.info("Starting Flask server...")
        logger.info("Server URL: http://0.0.0.0:5000")
        logger.info("Local access: http://localhost:5000")
        logger.info("API Health: http://localhost:5000/api/health")
        logger.info("")
        logger.info("NOTE: The 'development server' warning is normal for development.")
        logger.info("      The server IS running correctly!")
        logger.info("=" * 60)
        logger.info("")
        
        app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
        
    except KeyboardInterrupt:
        logger.info("\n\nServer stopped by user")
    except Exception as e:
        logger.error(f"\n\nERROR: Failed to start server")
        logger.error(f"Error: {e}")
        import traceback
        traceback.print_exc()
        input("\nPress Enter to exit...")

