"""
CSV to SQLite Migration Script
Migrates data from CSV files to SQLite database
"""

import os
import sys
import pandas as pd
import json
from pathlib import Path
import logging

# Add parent directory to path to import modules
sys.path.insert(0, str(Path(__file__).parent))

from flask import Flask
from config import Config
from models import db, Location, LocationImage, Aspect, Review, init_db
from utils.image_manager import ImageManager, create_image_records_from_mapping
from utils.db_utils import normalize_sentiment, calculate_trend, bulk_insert

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DataMigrator:
    """Handles migration from CSV files to SQLite database"""
    
    def __init__(self, app):
        self.app = app
        self.data_dir = Config.DATA_DIR
        self.images_dir = Config.LOCAL_IMAGES_DIR
        self.image_manager = ImageManager(Config)
        
    def load_csv_data(self):
        """Load all CSV files"""
        logger.info("Loading CSV files...")
        
        data = {}
        
        # Load location analysis
        location_file = self.data_dir / 'final_multimodal_location_analysis.csv'
        if location_file.exists():
            try:
                data['locations'] = pd.read_csv(location_file, on_bad_lines='skip', engine='python')
                logger.info(f"Loaded {len(data['locations'])} location records")
            except Exception as e:
                logger.error(f"Error loading location analysis: {e}")
                data['locations'] = pd.DataFrame()
        
        # Load aspect scores
        aspect_file = self.data_dir / 'location_aspect_scores.csv'
        if aspect_file.exists():
            try:
                data['aspects'] = pd.read_csv(aspect_file, on_bad_lines='skip', engine='python')
                logger.info(f"Loaded {len(data['aspects'])} aspect records")
            except Exception as e:
                logger.error(f"Error loading aspect scores: {e}")
                data['aspects'] = pd.DataFrame()
        
        # Load sarcasm data
        sarcasm_file = self.data_dir / 'absa_corrected_for_sarcasm.csv'
        if sarcasm_file.exists():
            try:
                data['sarcasm'] = pd.read_csv(sarcasm_file, on_bad_lines='skip', engine='python')
                logger.info(f"Loaded {len(data['sarcasm'])} sarcasm records")
            except Exception as e:
                logger.error(f"Error loading sarcasm data: {e}")
                data['sarcasm'] = pd.DataFrame()
        
        # Load preprocessed reviews
        reviews_file = self.data_dir / 'preprocessed_reviews.csv'
        if reviews_file.exists():
            try:
                data['reviews'] = pd.read_csv(reviews_file, on_bad_lines='skip', engine='python')
                logger.info(f"Loaded {len(data['reviews'])} review records")
            except Exception as e:
                logger.error(f"Error loading reviews: {e}")
                data['reviews'] = pd.DataFrame()
        
        # Load image mapping
        image_file = self.data_dir / 'image_mapping.json'
        if image_file.exists():
            try:
                with open(image_file, 'r') as f:
                    data['image_mapping'] = json.load(f)
                logger.info(f"Loaded image mapping for {len(data['image_mapping'])} locations")
            except Exception as e:
                logger.error(f"Error loading image mapping: {e}")
                data['image_mapping'] = {}
        else:
            # Scan images directory if no mapping file
            logger.info("No image_mapping.json found, scanning images directory...")
            data['image_mapping'] = self.image_manager.scan_all_location_images()
        
        return data
    
    def migrate_locations(self, locations_df):
        """Migrate location data"""
        logger.info("=== Migrating Locations ===")
        
        if locations_df.empty:
            logger.warning("No location data to migrate")
            return {}
        
        location_records = []
        location_id_map = {}  # Map location name to ID
        
        # Group by location name to handle duplicates
        for location_name, group in locations_df.groupby('location'):
            # Use first row for this location (or aggregate if multiple)
            row = group.iloc[0]
            
            # Extract sentiment scores
            pred_fused = row.get('pred_fused_overall', 0)
            pred_text = row.get('pred_text_overall', 0)
            pred_image = row.get('pred_image_overall', 0)
            
            # Calculate overall sentiment (0-100)
            overall_sentiment = normalize_sentiment(pred_fused)
            
            # Calculate trend
            text_image_gap = float(pred_text - pred_image) if pd.notna(pred_text) and pd.notna(pred_image) else 0
            trend = calculate_trend(pred_text, pred_image)
            
            location_data = {
                'name': str(location_name).strip(),
                'overall_sentiment': overall_sentiment,
                'text_sentiment': normalize_sentiment(pred_text),
                'image_sentiment': normalize_sentiment(pred_image),
                'fused_sentiment': normalize_sentiment(pred_fused),
                'sarcasm_rate': float(row.get('sarcasm_rate', 0)) if pd.notna(row.get('sarcasm_rate')) else 0.0,
                'sarcasm_count': int(row.get('sarcasm_count', 0)) if pd.notna(row.get('sarcasm_count')) else 0,
                'total_aspects': int(row.get('total_aspects', 0)) if pd.notna(row.get('total_aspects')) else 0,
                'text_image_gap': text_image_gap,
                'trend': trend
            }
            
            location_records.append(location_data)
        
        # Bulk insert locations
        logger.info(f"Inserting {len(location_records)} unique locations...")
        for loc_data in location_records:
            location = Location(**loc_data)
            db.session.add(location)
        
        db.session.commit()
        
        # Create location ID map
        all_locations = Location.query.all()
        for loc in all_locations:
            location_id_map[loc.name] = loc.id
        
        logger.info(f"✓ Migrated {len(location_records)} locations")
        return location_id_map
    
    def migrate_aspects(self, aspects_df, location_id_map):
        """Migrate aspect data"""
        logger.info("=== Migrating Aspects ===")
        
        if aspects_df.empty:
            logger.warning("No aspect data to migrate")
            return
        
        aspect_records = []
        
        for _, row in aspects_df.iterrows():
            location_name = row.get('location')
            location_id = location_id_map.get(location_name)
            
            if not location_id:
                continue
            
            aspect_data = {
                'location_id': location_id,
                'aspect_name': row.get('aspect', 'unknown'),
                'sentiment_score': float(row.get('avg_polarity', 0)) if pd.notna(row.get('avg_polarity')) else 0.0,
                'confidence': float(row.get('avg_confidence', 0)) if pd.notna(row.get('avg_confidence')) else 0.0,
                'review_count': int(row.get('count', 0)) if pd.notna(row.get('count')) else 0
            }
            
            aspect_records.append(aspect_data)
        
        # Bulk insert
        logger.info(f"Inserting {len(aspect_records)} aspect records...")
        for aspect_data in aspect_records:
            aspect = Aspect(**aspect_data)
            db.session.add(aspect)
        
        db.session.commit()
        logger.info(f"✓ Migrated {len(aspect_records)} aspects")
    
    def migrate_reviews(self, reviews_df, sarcasm_df, location_id_map):
        """Migrate review and sarcasm data"""
        logger.info("=== Migrating Reviews ===")
        
        review_records = []
        
        # Use sarcasm_df if available, otherwise use reviews_df
        source_df = sarcasm_df if not sarcasm_df.empty else reviews_df
        
        if source_df.empty:
            logger.warning("No review data to migrate")
            return
        
        for _, row in source_df.iterrows():
            location_name = row.get('location')
            location_id = location_id_map.get(location_name)
            
            if not location_id:
                continue
            
            review_data = {
                'location_id': location_id,
                'review_text': row.get('review_text', ''),
                'review_text_clean': row.get('review_text_clean', row.get('review_text', '')),
                'sentiment_score': float(row.get('sentiment_score', 0)) if pd.notna(row.get('sentiment_score')) else 0.0,
                'is_sarcastic': bool(int(row.get('is_sarcastic', 0))) if pd.notna(row.get('is_sarcastic')) else False,
                'sarcasm_confidence': float(row.get('sarcasm_confidence', 0)) if pd.notna(row.get('sarcasm_confidence')) else 0.0,
                'was_corrected': bool(row.get('was_corrected', False)),
                'aspect': row.get('aspect', '')
            }
            
            review_records.append(review_data)
        
        # Sample reviews if too many (for performance)
        if len(review_records) > 10000:
            logger.info(f"Sampling 10000 reviews from {len(review_records)} total reviews")
            import random
            review_records = random.sample(review_records, 10000)
        
        # Bulk insert
        logger.info(f"Inserting {len(review_records)} review records...")
        for review_data in review_records:
            review = Review(**review_data)
            db.session.add(review)
        
        db.session.commit()
        logger.info(f"✓ Migrated {len(review_records)} reviews")
        
        # Update location review counts
        logger.info("Updating location review counts...")
        for location_id in location_id_map.values():
            review_count = Review.query.filter_by(location_id=location_id).count()
            location = Location.query.get(location_id)
            if location:
                location.total_reviews = review_count
        
        db.session.commit()
    
    def migrate_images(self, image_mapping, location_id_map):
        """Migrate image data"""
        logger.info("=== Migrating Images ===")
        
        if not image_mapping:
            logger.warning("No image mapping data to migrate")
            return
        
        image_records = []
        
        for location_name, image_paths in image_mapping.items():
            location_id = location_id_map.get(location_name)
            
            if not location_id:
                logger.warning(f"Location ID not found for: {location_name}")
                continue
            
            for idx, image_path in enumerate(image_paths):
                # Convert Google Drive path to relative local path
                # From: "/content/drive/My Drive/Tourism_Sentiment_Research/images/Bentota Beach/1.jpg"
                # To: "Bentota Beach/1.jpg"
                local_path = self.image_manager.convert_google_drive_path(image_path)
                
                if not local_path:
                    logger.warning(f"Could not convert image path: {image_path}")
                    continue
                
                image_data = {
                    'location_id': location_id,
                    'storage_mode': 'local',
                    'local_path': local_path,  # Now using relative path
                    'file_name': Path(local_path).name,
                    'display_order': idx
                }
                
                image_records.append(image_data)
        
        logger.info(f"Inserting {len(image_records)} image records...")
        for img_data in image_records:
            image = LocationImage(**img_data)
            db.session.add(image)
        
        db.session.commit()
        logger.info(f"✓ Migrated {len(image_records)} images")
    
    def run_migration(self):
        """Run complete migration"""
        logger.info("=" * 60)
        logger.info("STARTING DATABASE MIGRATION")
        logger.info("=" * 60)
        
        with self.app.app_context():
            # Drop existing tables and create new ones
            logger.info("Creating database tables...")
            db.drop_all()
            db.create_all()
            logger.info("✓ Database tables created")
            
            # Load CSV data
            data = self.load_csv_data()
            
            # Migrate in order (due to foreign keys)
            location_id_map = self.migrate_locations(data.get('locations', pd.DataFrame()))
            
            if location_id_map:
                self.migrate_aspects(data.get('aspects', pd.DataFrame()), location_id_map)
                self.migrate_reviews(
                    data.get('reviews', pd.DataFrame()),
                    data.get('sarcasm', pd.DataFrame()),
                    location_id_map
                )
                self.migrate_images(data.get('image_mapping', {}), location_id_map)
            
            # Print summary
            logger.info("=" * 60)
            logger.info("MIGRATION COMPLETE")
            logger.info("=" * 60)
            logger.info(f"Locations: {Location.query.count()}")
            logger.info(f"Images: {LocationImage.query.count()}")
            logger.info(f"Aspects: {Aspect.query.count()}")
            logger.info(f"Reviews: {Review.query.count()}")
            logger.info("=" * 60)
            logger.info(f"Database file: {Config.BACKEND_DIR}/sentiment_data.db")
            logger.info("=" * 60)


def main():
    """Main migration function"""
    # Create Flask app
    app = Flask(__name__)
    Config.init_app(app)
    db.init_app(app)
    
    # Run migration
    migrator = DataMigrator(app)
    migrator.run_migration()
    
    print("\n✓ Migration successful!")
    print(f"Database created at: {Config.BACKEND_DIR}/sentiment_data.db")
    print("\nNext steps:")
    print("1. Update app.py to use database instead of CSV")
    print("2. Test API endpoints")
    print("3. Test on mobile app")


if __name__ == '__main__':
    main()
