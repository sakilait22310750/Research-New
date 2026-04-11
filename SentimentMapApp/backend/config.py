"""
Configuration for SentimentMap Backend
Environment-based configuration for database, image storage, and caching
"""

import os
from pathlib import Path

class Config:
    """Application configuration"""
    
    # Base directories
    BASE_DIR = Path(__file__).parent.parent
    BACKEND_DIR = Path(__file__).parent
    
    # Database Configuration
    DATABASE_URL = os.getenv('DATABASE_URL', f'sqlite:///{BACKEND_DIR}/sentiment_data.db')
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv('SQL_DEBUG', 'False').lower() == 'true'
    
    # Image Storage Configuration
    IMAGE_STORAGE_MODE = os.getenv('IMAGE_STORAGE_MODE', 'local')  # 'local' or 'cloud'
    
    # Local image storage (development)
    IMAGES_PATH = os.getenv('IMAGES_PATH', str(BASE_DIR / 'images'))
    LOCAL_IMAGES_DIR = Path(IMAGES_PATH)
    
    # Cloud storage configuration (production)
    CLOUD_BUCKET_NAME = os.getenv('CLOUD_BUCKET_NAME', '')
    CLOUD_CDN_URL = os.getenv('CLOUD_CDN_URL', '')
    CLOUD_REGION = os.getenv('CLOUD_REGION', 'us-east-1')
    
    # Image optimization
    IMAGE_QUALITY = int(os.getenv('IMAGE_QUALITY', '85'))
    THUMBNAIL_SIZE = (300, 300)
    MEDIUM_SIZE = (800, 800)
    
    # Performance & Caching
    ENABLE_CACHING = os.getenv('ENABLE_CACHING', 'False').lower() == 'true'
    CACHE_TYPE = os.getenv('CACHE_TYPE', 'simple')
    CACHE_DEFAULT_TIMEOUT = int(os.getenv('CACHE_TTL', '3600'))  # 1 hour
    
    # Data directories (CSV backup files)
    DATA_DIR = BASE_DIR / 'data'
    MODEL_DIR = BASE_DIR.parent / 'bert_gpu_optimized'
    
    # Flask configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*')
    
    # API Configuration
    API_PREFIX = '/api'
    
    @classmethod
    def get_image_url(cls, local_path=None, cloud_url=None, base_url=''):
        """
        Generate appropriate image URL based on storage mode
        
        Args:
            local_path: Relative path from images directory (e.g., 'Bentota Beach/1.jpg')
            cloud_url: Full cloud URL (e.g., 'https://cdn.example.com/bentota/1.jpg')
            base_url: Base URL for local mode (e.g., 'http://localhost:5000')
        
        Returns:
            Full URL to the image
        """
        if cls.IMAGE_STORAGE_MODE == 'cloud':
            if cloud_url:
                return cloud_url
            elif local_path and cls.CLOUD_CDN_URL:
                # Convert local path to cloud URL
                import urllib.parse
                encoded_path = urllib.parse.quote(local_path, safe='/')
                return f"{cls.CLOUD_CDN_URL}/{encoded_path}"
        else:
            # Local mode
            if local_path:
                import urllib.parse
                encoded_path = urllib.parse.quote(local_path, safe='/')
                return f"{base_url}/api/images/{encoded_path}"
        
        return None
    
    @classmethod
    def init_app(cls, app):
        """Initialize Flask app with configuration"""
        app.config.from_object(cls)
        
        # Create necessary directories
        cls.LOCAL_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        cls.DATA_DIR.mkdir(parents=True, exist_ok=True)


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_ECHO = True


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_ECHO = False
    IMAGE_STORAGE_MODE = 'cloud'
    ENABLE_CACHING = True


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DATABASE_URL = 'sqlite:///:memory:'
    IMAGE_STORAGE_MODE = 'local'


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
