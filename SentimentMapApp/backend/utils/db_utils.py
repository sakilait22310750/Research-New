"""
Database utilities and helper functions
"""

from models import db, Location, LocationImage, Aspect, Review
from sqlalchemy import func
import pandas as pd
import logging

logger = logging.getLogger(__name__)


def get_or_create(session, model, **kwargs):
    """
    Get an existing instance or create a new one
    
    Args:
        session: SQLAlchemy session
        model: Model class
        **kwargs: Field values
    
    Returns:
        tuple: (instance, created) where created is True if new instance was created
    """
    instance = session.query(model).filter_by(**kwargs).first()
    if instance:
        return instance, False
    else:
        instance = model(**kwargs)
        session.add(instance)
        return instance, True


def normalize_sentiment(score):
    """
    Convert sentiment score from -1 to 1 range to 0-100 percentage
    
    Args:
        score: Sentiment score (-1 to 1)
    
    Returns:
        int: Normalized score (0-100)
    """
    if score is None or pd.isna(score):
        return 50  # Neutral
    return int(((float(score) + 1) / 2) * 100)


def calculate_trend(text_sentiment, image_sentiment):
    """
    Calculate trend based on text-image sentiment gap
    
    Args:
        text_sentiment: Text sentiment score
        image_sentiment: Image sentiment score
    
    Returns:
        str: 'up', 'down', or 'stable'
    """
    if text_sentiment is None or image_sentiment is None:
        return 'stable'
    
    gap = text_sentiment - image_sentiment
    if gap > 0.1:
        return 'up'
    elif gap < -0.1:
        return 'down'
    return 'stable'


def get_location_stats():
    """
    Get overall statistics about locations
    
    Returns:
        dict: Statistics including total locations, average sentiment, etc.
    """
    total_locations = Location.query.count()
    
    if total_locations == 0:
        return {
            'total_locations': 0,
            'average_sentiment': 50,
            'positive_count': 0,
            'total_reviews': 0
        }
    
    avg_sentiment = db.session.query(func.avg(Location.overall_sentiment)).scalar()
    positive_count = Location.query.filter(Location.overall_sentiment >= 60).count()
    total_reviews = db.session.query(func.sum(Location.total_reviews)).scalar() or 0
    
    return {
        'total_locations': total_locations,
        'average_sentiment': int(avg_sentiment) if avg_sentiment else 50,
        'positive_count': positive_count,
        'positive_percentage': int((positive_count / total_locations) * 100) if total_locations > 0 else 0,
        'total_reviews': total_reviews
    }


def search_locations(query):
    """
    Search locations by name
    
    Args:
        query: Search query string
    
    Returns:
        list: List of matching locations
    """
    if not query or len(query) < 2:
        return []
    
    return Location.query.filter(
        Location.name.ilike(f'%{query}%')
    ).all()


def get_top_locations(limit=10, category=None):
    """
    Get top locations by sentiment score
    
    Args:
        limit: Number of locations to return
        category: Optional category filter
    
    Returns:
        list: Top locations
    """
    query = Location.query
    
    if category and category != 'all':
        query = query.filter(Location.category == category)
    
    return query.order_by(Location.overall_sentiment.desc()).limit(limit).all()


def get_sarcasm_stats():
    """
    Get statistics about sarcasm detection
    
    Returns:
        dict: Sarcasm statistics
    """
    total_reviews = Review.query.count()
    sarcastic_reviews = Review.query.filter(Review.is_sarcastic == True).count()
    corrected_reviews = Review.query.filter(Review.was_corrected == True).count()
    
    return {
        'total_reviews': total_reviews,
        'sarcastic_count': sarcastic_reviews,
        'sarcastic_rate': (sarcastic_reviews / total_reviews * 100) if total_reviews > 0 else 0,
        'corrected_count': corrected_reviews
    }


def bulk_insert(model, data_list, batch_size=1000):
    """
    Bulk insert data in batches for better performance
    
    Args:
        model: Model class
        data_list: List of dictionaries with field values
        batch_size: Number of records per batch
    
    Returns:
        int: Number of records inserted
    """
    total_inserted = 0
    
    for i in range(0, len(data_list), batch_size):
        batch = data_list[i:i + batch_size]
        objects = [model(**data) for data in batch]
        db.session.bulk_save_objects(objects)
        db.session.commit()
        total_inserted += len(batch)
        logger.info(f"Inserted {total_inserted}/{len(data_list)} {model.__name__} records")
    
    return total_inserted


def verify_database_integrity():
    """
    Verify database integrity and relationships
    
    Returns:
        dict: Verification results
    """
    results = {
        'locations': Location.query.count(),
        'images': LocationImage.query.count(),
        'aspects': Aspect.query.count(),
        'reviews': Review.query.count(),
        'orphaned_images': 0,
        'orphaned_aspects': 0,
        'orphaned_reviews': 0
    }
    
    # Check for orphaned records (shouldn't happen with proper foreign keys)
    results['orphaned_images'] = LocationImage.query.filter(
        ~LocationImage.location_id.in_(db.session.query(Location.id))
    ).count()
    
    results['orphaned_aspects'] = Aspect.query.filter(
        ~Aspect.location_id.in_(db.session.query(Location.id))
    ).count()
    
    results['orphaned_reviews'] = Review.query.filter(
        ~Review.location_id.in_(db.session.query(Location.id))
    ).count()
    
    return results
