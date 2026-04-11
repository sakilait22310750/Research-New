"""
Database Models for SentimentMap
SQLAlchemy ORM models for locations, images, aspects, reviews, and users (auth)
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Index

db = SQLAlchemy()


class User(db.Model):
    """User model for sign up / sign in - stored in database"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.email}>'


class Location(db.Model):
    """Location model - represents tourist locations"""
    __tablename__ = 'locations'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False, index=True)
    
    # Sentiment scores
    overall_sentiment = db.Column(db.Float)  # Normalized 0-100
    text_sentiment = db.Column(db.Float)     # pred_text_overall
    image_sentiment = db.Column(db.Float)    # pred_image_overall
    fused_sentiment = db.Column(db.Float)    # pred_fused_overall
    
    # Sarcasm data
    sarcasm_rate = db.Column(db.Float)       # 0.0 to 1.0
    sarcasm_count = db.Column(db.Integer, default=0)
    
    # Statistics
    total_aspects = db.Column(db.Integer, default=0)
    total_reviews = db.Column(db.Integer, default=0)
    
    # Metadata
    trend = db.Column(db.String(20))         # 'up', 'down', 'stable'
    category = db.Column(db.String(50))      # 'beach', 'temple', 'park', etc.
    text_image_gap = db.Column(db.Float)     # Gap between text and image sentiment
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    images = db.relationship('LocationImage', back_populates='location', 
                           cascade='all, delete-orphan', lazy='dynamic')
    aspects = db.relationship('Aspect', back_populates='location', 
                            cascade='all, delete-orphan', lazy='dynamic')
    reviews = db.relationship('Review', back_populates='location', 
                            cascade='all, delete-orphan', lazy='dynamic')
    
    def to_dict(self, include_images=False, include_aspects=False, base_url=''):
        """Convert location to dictionary for API responses"""
        data = {
            'id': self.id,
            'location': self.name,
            'overallSentiment': int(self.overall_sentiment) if self.overall_sentiment else 50,
            'sarcasmRate': int(self.sarcasm_rate * 100) if self.sarcasm_rate else 0,
            'sarcasmCount': self.sarcasm_count or 0,
            'totalAspects': self.total_aspects or 0,
            'totalReviews': self.total_reviews or 0,
            'trend': self.trend or 'stable',
            'category': self.category
        }
        
        if include_images:
            data['images'] = [img.get_url(base_url) for img in self.images.order_by(LocationImage.display_order).all()]
        
        if include_aspects:
            data['aspects'] = [aspect.to_dict() for aspect in self.aspects.all()]
        
        return data
    
    def __repr__(self):
        return f'<Location {self.name}>'


class LocationImage(db.Model):
    """Location images - stores image paths/URLs"""
    __tablename__ = 'location_images'
    
    id = db.Column(db.Integer, primary_key=True)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False, index=True)
    
    # Storage mode configuration
    storage_mode = db.Column(db.String(20), default='local')  # 'local' or 'cloud'
    
    # Local storage (development)
    local_path = db.Column(db.String(500))  # e.g., 'Bentota Beach/1.jpg'
    
    # Cloud storage (production)
    cloud_url = db.Column(db.String(500))   # Full URL to cloud-hosted image
    thumbnail_url = db.Column(db.String(500))  # Optimized thumbnail URL
    
    # Metadata
    file_name = db.Column(db.String(255))
    file_size = db.Column(db.Integer)       # Size in bytes
    width = db.Column(db.Integer)
    height = db.Column(db.Integer)
    format = db.Column(db.String(10))       # jpg, png, webp
    
    # Display configuration
    display_order = db.Column(db.Integer, default=0)
    is_featured = db.Column(db.Boolean, default=False)
    
    # Timestamp
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    location = db.relationship('Location', back_populates='images')
    
    def get_url(self, base_url=''):
        """Get appropriate URL based on storage mode"""
        if self.storage_mode == 'cloud':
            return self.cloud_url or self.thumbnail_url
        else:
            # Local mode - construct URL
            if self.local_path:
                import urllib.parse
                encoded_path = urllib.parse.quote(self.local_path, safe='/')
                return f"{base_url}/api/images/{encoded_path}"
        return None
    
    def __repr__(self):
        return f'<LocationImage {self.file_name}>'


class Aspect(db.Model):
    """Aspect-based sentiment for locations"""
    __tablename__ = 'aspects'
    
    id = db.Column(db.Integer, primary_key=True)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False, index=True)
    
    aspect_name = db.Column(db.String(100), nullable=False)  # 'food', 'service', 'view', etc.
    sentiment_score = db.Column(db.Float)     # -1.0 to 1.0
    confidence = db.Column(db.Float)           # 0.0 to 1.0
    review_count = db.Column(db.Integer, default=0)
    
    # Relationship
    location = db.relationship('Location', back_populates='aspects')
    
    # Index for faster queries
    __table_args__ = (
        Index('idx_location_aspect', 'location_id', 'aspect_name'),
    )
    
    def to_dict(self):
        """Convert aspect to dictionary"""
        return {
            'aspect': self.aspect_name,
            'score': int(((self.sentiment_score + 1) / 2) * 100) if self.sentiment_score is not None else 50,
            'confidence': int(self.confidence * 100) if self.confidence else 0,
            'reviewCount': self.review_count or 0
        }
    
    def __repr__(self):
        return f'<Aspect {self.aspect_name} for {self.location.name}>'


class Review(db.Model):
    """Reviews with sentiment and sarcasm data"""
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False, index=True)
    
    review_text = db.Column(db.Text)
    review_text_clean = db.Column(db.Text)    # Preprocessed text
    
    # Sentiment
    sentiment_score = db.Column(db.Float)     # -1.0 to 1.0
    sentiment_label = db.Column(db.String(20)) # 'positive', 'negative', 'neutral'
    
    # Sarcasm detection
    is_sarcastic = db.Column(db.Boolean, default=False)
    sarcasm_confidence = db.Column(db.Float)  # 0.0 to 1.0
    was_corrected = db.Column(db.Boolean, default=False)
    corrected_sentiment = db.Column(db.String(20))
    
    # Aspect mentioned
    aspect = db.Column(db.String(100))
    
    # Timestamp
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    location = db.relationship('Location', back_populates='reviews')
    
    def to_dict(self):
        """Convert review to dictionary"""
        return {
            'reviewText': self.review_text or self.review_text_clean,
            'sentimentScore': int(((self.sentiment_score + 1) / 2) * 100) if self.sentiment_score is not None else 50,
            'isSarcastic': self.is_sarcastic,
            'sarcasmConfidence': int(self.sarcasm_confidence * 100) if self.sarcasm_confidence else 0,
            'aspect': self.aspect,
            'location': self.location.name if self.location else None
        }
    
    def __repr__(self):
        return f'<Review {self.id} for {self.location.name}>'


def init_db(app):
    """Initialize database with app context"""
    db.init_app(app)
    
    with app.app_context():
        # Create all tables
        db.create_all()
        print("Database tables created successfully!")


def drop_all(app):
    """Drop all database tables (use with caution!)"""
    with app.app_context():
        db.drop_all()
        print("All database tables dropped!")
