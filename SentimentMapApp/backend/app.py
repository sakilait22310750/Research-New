"""
Backend API Server for SentimentMap Mobile App (Database-Powered)
Sarcasm-Aware Multimodal Location-Based Sentiment Analysis for Tourism

This backend uses SQLite database with SQLAlchemy ORM for better performance.
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer
import os
import csv
import re
from pathlib import Path
import logging
import urllib.parse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import database and models
from config import Config
from models import db, Location, LocationImage, Aspect, Review, User
from utils.db_utils import get_location_stats, search_locations, get_top_locations
from utils.image_manager import ImageManager
from utils.drive_image_service import load_drive_mapping, fetch_image as drive_fetch_image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
Config.init_app(app)
db.init_app(app)
CORS(app)  # Enable CORS for mobile app

# Initialize image manager
image_manager = ImageManager(Config)

# Ensure all tables exist (including users for auth)
with app.app_context():
    db.create_all()

# ── Google Drive image mapping + service (loaded once at startup) ─────────────
# Only used when IMAGE_STORAGE_MODE=drive. Zero overhead in local/cloud mode.
_drive_mapping = {}
_drive_semaphore = None   # limits concurrent Drive downloads

if Config.IMAGE_STORAGE_MODE == 'drive':
    import threading
    logger.info("[Drive] IMAGE_STORAGE_MODE=drive — loading Drive mapping...")
    _drive_mapping = load_drive_mapping(Config.DRIVE_MAPPING_FILE)
    if not _drive_mapping:
        logger.warning(
            "[Drive] ⚠️  Drive mapping is empty! "
            "Run: python drive_scan.py --folder-id YOUR_ID --credentials path/to/key.json"
        )
    else:
        logger.info(f"[Drive] ✅ Ready to serve images from Google Drive ({len(_drive_mapping)} locations)")
        # Pre-initialize Drive API service NOW (at startup, not lazily on first request)
        # This prevents concurrent initialization race conditions under load.
        from utils.drive_image_service import _get_drive_service
        _get_drive_service(Config.GOOGLE_APPLICATION_CREDENTIALS)
        # Limit concurrent Drive downloads to avoid overwhelming the API
        _drive_semaphore = threading.Semaphore(5)

# Auth token serializer (uses Flask SECRET_KEY)
def _auth_serializer():
    return URLSafeTimedSerializer(Config.SECRET_KEY, salt='auth-token')

def _create_auth_token(user_id):
    return _auth_serializer().dumps({'user_id': user_id})

def _verify_auth_token(token, max_age=60*60*24*7):  # 7 days
    try:
        data = _auth_serializer().loads(token, max_age=max_age)
        return data.get('user_id')
    except Exception:
        return None

# Paths configuration (for serving images)
IMAGES_DIR = Config.LOCAL_IMAGES_DIR

# Load BERT model (optional - for future real-time inference)
bert_model = None
tokenizer = None


def load_bert_model():
    """Load the trained BERT model for potential real-time inference"""
    global bert_model, tokenizer
    try:
        from transformers import BertForSequenceClassification, BertTokenizer
        import torch
        
        MODEL_DIR = Config.MODEL_DIR
        
        if os.path.exists(MODEL_DIR):
            logger.info(f"Loading BERT model from {MODEL_DIR}")
            tokenizer = BertTokenizer.from_pretrained(str(MODEL_DIR))
            bert_model = BertForSequenceClassification.from_pretrained(str(MODEL_DIR))
            bert_model.eval()
            logger.info("BERT model loaded successfully")
        else:
            logger.warning(f"Model directory not found: {MODEL_DIR}")
    except Exception as e:
        logger.warning(
            "Could not load BERT model: %s. Map, search, and locations work from the database. "
            "For real-time /api/predict, install: pip install transformers torch", e
        )


# ============== AUTH ROUTES (Sign up / Sign in - stored in DB) ==============

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user. Data is stored in the database."""
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    name = (data.get('name') or '').strip()

    if not email or not password or not name:
        return jsonify({'detail': 'Email, password, and name are required'}), 400
    if len(password) < 6:
        return jsonify({'detail': 'Password must be at least 6 characters'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'detail': 'Email already registered'}), 400

    user = User(
        email=email,
        password_hash=generate_password_hash(password),
        name=name
    )
    db.session.add(user)
    db.session.commit()

    token = _create_auth_token(user.id)
    return jsonify({
        'token': token,
        'user': {'id': user.id, 'email': user.email, 'name': user.name}
    })


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Sign in - validates credentials against database. Only registered users can sign in."""
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'detail': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'detail': 'Invalid email or password'}), 401

    token = _create_auth_token(user.id)
    return jsonify({
        'token': token,
        'user': {'id': user.id, 'email': user.email, 'name': user.name}
    })


# ============== APP ROUTES ==============

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    location_count = Location.query.count()
    aspect_count = Aspect.query.count()
    image_count = LocationImage.query.count()
    review_count = Review.query.count()
    
    return jsonify({
        'status': 'healthy',
        'database_connected': True,
        'model_loaded': bert_model is not None,
        'locations_count': location_count,
        'aspects_count': aspect_count,
        'images_count': image_count,
        'reviews_count': review_count
    })


@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        stats = get_location_stats()
        return jsonify({
            'totalLocations': stats['total_locations'],
            'avgSentiment': stats['average_sentiment'],
            'positivePercentage': stats.get('positive_percentage', 0),
            'totalReviews': stats.get('total_reviews', 0)
        })
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/locations', methods=['GET'])
def get_locations():
    """Get all locations with sentiment data"""
    try:
        locations = Location.query.all()
        base_url = request.host_url.rstrip('/')

        locations_data = []
        for loc in locations:
            # Get first image as thumbnail for the card
            first_img = loc.images.order_by(LocationImage.display_order).first()
            thumbnail = first_img.get_url(base_url) if first_img else None

            locations_data.append({
                'location': loc.name,
                'locationType': loc.category or 'Attraction',
                'overallSentiment': int(loc.overall_sentiment) if loc.overall_sentiment else 50,
                'sarcasmRate': int(loc.sarcasm_rate * 100) if loc.sarcasm_rate else 0,
                'sarcasmCount': loc.sarcasm_count or 0,
                'totalAspects': loc.total_aspects or 0,
                'totalReviews': loc.total_reviews or 0,
                'trend': loc.trend or 'stable',
                'thumbnail': thumbnail,
            })
        
        logger.info(f"Returning {len(locations_data)} locations")
        return jsonify(locations_data)
    except Exception as e:
        logger.error(f"Error getting locations: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/locations/<location_name>', methods=['GET'])
def get_location_details(location_name):
    """Get detailed information for a specific location"""
    try:
        location = Location.query.filter_by(name=location_name).first()
        
        if not location:
            return jsonify({'error': 'Location not found'}), 404
        
        # Build base URL for images
        base_url = request.host_url.rstrip('/')
        
        # Compute real sentiment breakdown from location reviews.
        pos_count = 0
        neu_count = 0
        neg_count = 0
        reviews_for_sentiment = location.reviews.all()
        for review in reviews_for_sentiment:
            label = (review.corrected_sentiment if review.was_corrected and review.corrected_sentiment else review.sentiment_label) or ''
            label = label.strip().lower()
            if ('positive' in label) or label.startswith('pos'):
                pos_count += 1
            elif ('neutral' in label) or label.startswith('neu'):
                neu_count += 1
            elif ('negative' in label) or label.startswith('neg'):
                neg_count += 1

        sentiment_total = pos_count + neu_count + neg_count

        # Fallback: if DB labels are unavailable, compute from aspect_sentiment_analysis.csv
        # using review-level average polarity for the selected location.
        if sentiment_total == 0:
            csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'aspect_sentiment_analysis.csv')

            def _norm_name(name: str) -> str:
                text = (name or '').strip().lower()
                text = re.sub(r'[^a-z0-9\s]', ' ', text)
                return ' '.join(text.split())

            target_name = _norm_name(location.name)
            review_polarities = {}

            if os.path.exists(csv_path):
                with open(csv_path, mode='r', encoding='utf-8-sig', newline='') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        row_location = _norm_name(row.get('location') or '')
                        if row_location != target_name:
                            continue

                        review_id = (row.get('review_id') or '').strip()
                        if not review_id:
                            continue

                        pol = None
                        raw_pol = row.get('polarity')
                        try:
                            pol = float(raw_pol) if raw_pol not in (None, '') else None
                        except Exception:
                            pol = None

                        # If polarity is missing, approximate from label.
                        if pol is None:
                            label = (row.get('sentiment') or '').strip().lower()
                            if 'positive' in label or label.startswith('pos'):
                                pol = 0.5
                            elif 'negative' in label or label.startswith('neg'):
                                pol = -0.5
                            else:
                                pol = 0.0

                        review_polarities.setdefault(review_id, []).append(pol)

            for _, values in review_polarities.items():
                if not values:
                    continue
                avg_pol = sum(values) / len(values)
                if avg_pol > 0.05:
                    pos_count += 1
                elif avg_pol < -0.05:
                    neg_count += 1
                else:
                    neu_count += 1

            sentiment_total = pos_count + neu_count + neg_count

        if sentiment_total > 0:
            positive_pct = round((pos_count / sentiment_total) * 100)
            neutral_pct = round((neu_count / sentiment_total) * 100)
            negative_pct = max(0, 100 - positive_pct - neutral_pct)
            computed_overall = round(((pos_count + (neu_count * 0.5)) / sentiment_total) * 100)
        else:
            positive_pct = 0
            neutral_pct = 0
            negative_pct = 0
            computed_overall = int(location.overall_sentiment) if location.overall_sentiment else 50

        # Get location data
        location_data = {
            'location': location.name,
            'overallSentiment': computed_overall,
            'sarcasmRate': int(location.sarcasm_rate * 100) if location.sarcasm_rate else 0,
            'sarcasmCount': location.sarcasm_count or 0,
            'totalAspects': location.total_aspects or 0,
            'totalReviews': location.total_reviews or 0,
            'modelConfidence': 85,  # Placeholder
            'trend': location.trend or 'stable',
            'sentimentBreakdown': {
                'positive': positive_pct,
                'neutral': neutral_pct,
                'negative': negative_pct,
                'reviewCount': sentiment_total
            }
        }
        
        # Get aspects
        aspects = [
            {
                'location': location.name,
                'aspect': aspect.aspect_name,
                'score': int(((aspect.sentiment_score + 1) / 2) * 100) if aspect.sentiment_score is not None else 50,
                'confidence': int(aspect.confidence * 100) if aspect.confidence else 0
            }
            for aspect in location.aspects.all()
        ]
        
        # Get top 3 aspects
        top_aspects = sorted(aspects, key=lambda x: x['score'], reverse=True)[:3]
        
        # Get sample reviews
        sample_reviews = [
            {
                'reviewText': review.review_text or review.review_text_clean,
                'location': location.name
            }
            for review in location.reviews.limit(5).all()
        ]
        
        # Get images
        images = [img.get_url(base_url) for img in location.images.order_by(LocationImage.display_order).all()]
        
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
        aspects = Aspect.query.all()
        
        aspects_data = [
            {
                'location': aspect.location.name if aspect.location else '',
                'aspect': aspect.aspect_name,
                'score': int(((aspect.sentiment_score + 1) / 2) * 100) if aspect.sentiment_score is not None else 50,
                'confidence': int(aspect.confidence * 100) if aspect.confidence else 0
            }
            for aspect in aspects
        ]
        
        return jsonify(aspects_data)
    except Exception as e:
        logger.error(f"Error getting aspect scores: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/locations/<location_name>/reviews', methods=['GET'])
@app.route('/api/locations/<location_name>/reviews', methods=['GET'])
def get_location_reviews(location_name):
    """Get location reviews from database including sarcasm flags"""
    try:
        limit = int(request.args.get('limit', 200))
        
        # 1. Exact match
        location = Location.query.filter_by(name=location_name).first()
        
        # 2. Search match
        if not location:
            from utils.db_utils import search_locations
            locations = search_locations(location_name)
            if locations:
                location = locations[0]
                
        if not location:
            return jsonify([])
            
        reviews_data = []
        for review in location.reviews.limit(limit).all():
            reviews_data.append({
                'reviewId': str(review.id),
                'location': location.name,
                'reviewText': review.review_text or review.review_text_clean or '',
                'reviewTextClean': review.review_text_clean or '',
                'isSarcastic': getattr(review, 'is_sarcastic', False),
                'sarcasmConfidence': getattr(review, 'sarcasm_confidence', 0),
                'sentiment': getattr(review, 'corrected_sentiment', None) or getattr(review, 'sentiment_label', '')
            })
            
        return jsonify(reviews_data)
    except Exception as e:
        logger.error(f"Error getting location reviews from DB: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/sarcasm', methods=['GET'])
def get_sarcasm_data():
    """Get sarcasm detection data"""
    try:
        reviews = Review.query.filter(Review.is_sarcastic == True).limit(100).all()
        
        sarcasm_data = [
            {
                'location': review.location.name if review.location else '',
                'reviewText': review.review_text_clean or review.review_text or '',
                'aspect': review.aspect or '',
                'isSarcastic': review.is_sarcastic,
                'sarcasmConfidence': int(review.sarcasm_confidence * 100) if review.sarcasm_confidence else 0,
                'wasCorrected': review.was_corrected,
                'originalSentiment': review.sentiment_label or '',
                'correctedSentiment': review.corrected_sentiment or ''
            }
            for review in reviews
        ]
        
        return jsonify(sarcasm_data)
    except Exception as e:
        logger.error(f"Error getting sarcasm data: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    """Get recommendations based on category"""
    try:
        category = request.args.get('category', 'all')
        base_url = request.host_url.rstrip('/')
        
        # Get top locations (optionally filtered by category)
        locations = get_top_locations(limit=10, category=category if category != 'all' else None)
        
        locations_data = []
        for loc in locations:
            location_data = {
                'location': loc.name,
                'overallSentiment': int(loc.overall_sentiment) if loc.overall_sentiment else 50,
                'sarcasmRate': int(loc.sarcasm_rate * 100) if loc.sarcasm_rate else 0,
                'sarcasmCount': loc.sarcasm_count or 0,
                'totalAspects': loc.total_aspects or 0,
                'modelConfidence': 85,  # Placeholder
                'trend': loc.trend or 'stable'
            }
            
            # Get images
            images = [img.get_url(base_url) for img in loc.images.order_by(LocationImage.display_order).all()]
            location_data['images'] = images
            
            locations_data.append(location_data)
        
        return jsonify(locations_data)
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/ai/chat', methods=['POST'])
def ai_travel_assistant():
    """
    Simple AI-style travel assistant for Sri Lankan locations.
    
    This implementation uses the existing locations database and search utilities
    to provide clear, structured answers without requiring an external LLM.
    """
    try:
        data = request.json or {}
        question = (data.get('question') or '').strip()

        if not question:
            return jsonify({'error': 'Question is required'}), 400

        logger.info(f"[AI Chat] Incoming question: {question}")

        # Use search_locations helper to find matching locations
        # based on the full question text.
        candidate_locations = search_locations(question)

        # Fallback: if nothing found, try again with simpler query tokens
        if not candidate_locations:
            # Basic keyword extraction: keep words longer than 3 characters
            keywords = [
                w for w in question.lower().split()
                if len(w) > 3
            ]

            seen_ids = set()
            results = []
            for kw in keywords:
                matches = search_locations(kw)
                for loc in matches:
                    if loc.id not in seen_ids:
                        seen_ids.add(loc.id)
                        results.append(loc)
            candidate_locations = results

        if not candidate_locations:
            answer = (
                "I couldn’t match your question to any locations in the app’s "
                "database. Try mentioning a specific place or city in Sri Lanka, "
                "for example: “What are the best beaches near Galle?” or "
                "“Tell me about Sigiriya.”"
            )
            return jsonify({
                'question': question,
                'answer': answer,
                'locations': [],
            })

        base_url = request.host_url.rstrip('/')

        locations_payload = []
        for loc in candidate_locations[:5]:
            images = [img.get_url(base_url) for img in loc.images.order_by(LocationImage.display_order).all()]

            locations_payload.append({
                'name': loc.name,
                'overallSentiment': int(loc.overall_sentiment) if loc.overall_sentiment else 50,
                'sarcasmRate': int(loc.sarcasm_rate * 100) if loc.sarcasm_rate else 0,
                'sarcasmCount': loc.sarcasm_count or 0,
                'totalAspects': loc.total_aspects or 0,
                'trend': loc.trend or 'stable',
                'images': images,
            })

        # Build a clear, human‑friendly answer string
        location_names = [loc.name for loc in candidate_locations[:5]]
        if len(location_names) == 1:
            intro = f"Based on your question, I recommend **{location_names[0]}**."
        else:
            intro = (
                "Based on your question, here are some Sri Lankan locations you "
                "might like: " + ", ".join(location_names[:-1]) +
                f" and {location_names[-1]}."
            )

        answer = (
            f"{intro} These suggestions are derived from real visitor reviews "
            "and sentiment analysis in the app. Tap a location card in the app "
            "for detailed insights, photos, and aspect‑wise ratings such as "
            "cleanliness, safety, and value for money."
        )

        return jsonify({
            'question': question,
            'answer': answer,
            'locations': locations_payload,
        })
    except Exception as e:
        logger.error(f"Error in AI travel assistant: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/search', methods=['GET'])
def search_locations_endpoint():
    """Search locations by query"""
    try:
        query = request.args.get('q', '').lower()
        
        if not query or len(query) < 2:
            return jsonify([])
        
        locations = search_locations(query)
        base_url = request.host_url.rstrip('/')

        locations_data = []
        for loc in locations:
            # Get first image as thumbnail (same as /api/locations)
            first_img = loc.images.order_by(LocationImage.display_order).first()
            thumbnail = first_img.get_url(base_url) if first_img else None

            locations_data.append({
                'location': loc.name,
                'overallSentiment': int(loc.overall_sentiment) if loc.overall_sentiment else 50,
                'sarcasmRate': int(loc.sarcasm_rate * 100) if loc.sarcasm_rate else 0,
                'sarcasmCount': loc.sarcasm_count or 0,
                'totalAspects': loc.total_aspects or 0,
                'trend': loc.trend or 'stable',
                'thumbnail': thumbnail,
            })
        
        return jsonify(locations_data)
    except Exception as e:
        logger.error(f"Error searching locations: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/images/<path:image_path>', methods=['GET'])
def serve_image(image_path):
    """
    Serve images from local disk OR Google Drive, transparently.

    The IMAGE_STORAGE_MODE env var controls the source:
      - 'local' (default): serve from IMAGES_DIR on disk
      - 'drive':           proxy from Google Drive via Drive API + in-memory cache
      - 'cloud':           redirect to cloud CDN URL
    """
    decoded_path = urllib.parse.unquote(image_path)

    # ── Google Drive mode ─────────────────────────────────────────────────────
    if Config.IMAGE_STORAGE_MODE == 'drive':
        # Expect path format: "Location Name/filename.jpg"
        parts = decoded_path.split('/', 1)
        if len(parts) != 2:
            return jsonify({'error': 'Invalid image path — expected LocationName/filename.jpg'}), 400
        location_name, filename = parts[0], parts[1]

        try:
            # Use semaphore to cap concurrent Drive downloads (prevents API overload)
            sem = _drive_semaphore
            if sem:
                sem.acquire()
            try:
                result = drive_fetch_image(
                    credentials_path=Config.GOOGLE_APPLICATION_CREDENTIALS,
                    mapping=_drive_mapping,
                    location_name=location_name,
                    filename=filename,
                    cache_ttl=Config.DRIVE_CACHE_TTL,
                    max_cache_items=Config.DRIVE_MAX_CACHE_ITEMS,
                )
            finally:
                if sem:
                    sem.release()

            if result is None:
                return jsonify({
                    'error': f'Image not found in Google Drive: {decoded_path}',
                }), 404

            from flask import Response
            image_bytes, mime_type = result
            return Response(
                image_bytes,
                mimetype=mime_type,
                headers={
                    'Cache-Control': 'public, max-age=86400',
                    'Content-Length': str(len(image_bytes)),
                    'X-Image-Source': 'google-drive',
                }
            )
        except BaseException as e:
            logger.error(f"[Drive] ❌ Unexpected error serving '{decoded_path}': {type(e).__name__}: {e}")
            return jsonify({'error': 'Image temporarily unavailable'}), 503


    # ── Local mode (original behaviour) ──────────────────────────────────────
    try:
        if not IMAGES_DIR.exists():
            return jsonify({'error': 'Images directory not found'}), 404

        image_file = IMAGES_DIR / decoded_path

        # Security: prevent path traversal
        try:
            image_file.resolve().relative_to(IMAGES_DIR.resolve())
        except ValueError:
            return jsonify({'error': 'Invalid image path'}), 403

        if image_file.exists() and image_file.is_file():
            return send_from_directory(str(IMAGES_DIR), decoded_path)
        return jsonify({'error': 'Image not found'}), 404
    except Exception as e:
        logger.error(f"Error serving image: {e}")
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
        
        from transformers import BertForSequenceClassification
        import torch
        
        inputs = tokenizer(text, return_tensors='pt', truncation=True, max_length=512)
        
        with torch.no_grad():
            outputs = bert_model(**inputs)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        
        return jsonify({
            'text': text,
            'prediction': predictions.tolist()[0],
            'sentiment': 'positive' if predictions[0][1] > predictions[0][0] else 'negative'
        })
    except Exception as e:
        logger.error(f"Error in prediction: {e}")
        return jsonify({'error': str(e)}), 500


# ============== Stub Hotel API (optional; full backend in Research-main on port 8000) ==============
# These endpoints return empty data so the app does not crash when the FastAPI hotel backend is not running.
# For full hotel recommendations, run Research-main/backend with MongoDB and point the app to port 8000.


@app.route('/api/recommendations', methods=['POST'])
def hotel_recommendations_stub():
    """Stub: return empty list when FastAPI hotel backend is not running."""
    return jsonify([])


@app.route('/api/hotels', methods=['GET'])
def hotels_list_stub():
    """Stub: return empty list when FastAPI hotel backend is not running."""
    return jsonify([])


@app.route('/api/hotels/<hotel_id>', methods=['GET'])
def hotel_detail_stub(hotel_id):
    """Stub: return 404 when FastAPI hotel backend is not running."""
    return jsonify({'detail': 'Hotel backend not configured. Run Research-main backend on port 8000 for full data.'}), 404


@app.route('/api/hotel-images/<hotel_id>/list', methods=['GET'])
def hotel_images_stub(hotel_id):
    """Stub: return empty images list when FastAPI hotel backend is not running."""
    return jsonify({'images': []})


if __name__ == '__main__':
    try:
        with app.app_context():
            # Verify database connection
            location_count = Location.query.count()
            logger.info("=" * 60)
            logger.info("SentimentMap Backend Server Starting (Database Mode)")
            logger.info("=" * 60)
            logger.info(f"Database: SQLite ({Config.DATABASE_URL})")
            logger.info(f"Locations in database: {location_count}")
            logger.info(f"Images storage mode: {Config.IMAGE_STORAGE_MODE}")
            logger.info(f"Images directory: {Config.LOCAL_IMAGES_DIR}")
            
            # Optionally load BERT model
            logger.info("Loading BERT model...")
            load_bert_model()
        
        # Run server
        logger.info("=" * 60)
        logger.info("Starting Flask server...")
        logger.info("On this PC, open in browser: http://localhost:5000/api/health")
        try:
            import socket
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.settimeout(0)
            s.connect(("8.8.8.8", 80))
            lan_ip = s.getsockname()[0]
            s.close()
            logger.info("From phone/other device use: http://%s:5000/api/health", lan_ip)
            logger.info("(If that times out, allow port 5000 in Windows Firewall)")
        except Exception:
            logger.info("From phone use your PC's IP (run: ipconfig) and port 5000")
        logger.info("")
        logger.info("NOTE: The 'development server' warning is normal for development.")
        logger.info("=" * 60)
        logger.info("")
        
        app.run(host='0.0.0.0', port=5000, debug=Config.DEBUG, use_reloader=False, threaded=True)
        
    except KeyboardInterrupt:
        logger.info("\n\nServer stopped by user")
    except Exception as e:
        logger.error(f"\n\nERROR: Failed to start server")
        logger.error(f"Error: {e}")
        import traceback
        traceback.print_exc()
        input("\nPress Enter to exit...")
