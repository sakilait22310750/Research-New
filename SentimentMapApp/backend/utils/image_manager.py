"""
Image management utilities
Handles image URL generation, scanning, and metadata
"""

import os
from pathlib import Path
import urllib.parse
import logging

logger = logging.getLogger(__name__)


class ImageManager:
    """Manages image paths and URL generation"""
    
    def __init__(self, config):
        """
        Initialize ImageManager with configuration
        
        Args:
            config: Application configuration object
        """
        self.config = config
        self.storage_mode = config.IMAGE_STORAGE_MODE
        self.local_images_dir = config.LOCAL_IMAGES_DIR
        self.cloud_cdn_url = config.CLOUD_CDN_URL
    
    def get_image_url(self, local_path=None, cloud_url=None, base_url=''):
        """
        Generate appropriate image URL based on storage mode
        
        Args:
            local_path: Relative path from images directory
            cloud_url: Full cloud URL
            base_url: Base URL for API (e.g., 'http://localhost:5000')
        
        Returns:
            str: Full URL to the image
        """
        if self.storage_mode == 'cloud':
            if cloud_url:
                return cloud_url
            elif local_path and self.cloud_cdn_url:
                # Convert local path to cloud URL
                encoded_path = urllib.parse.quote(local_path, safe='/')
                return f"{self.cloud_cdn_url}/{encoded_path}"
        else:
            # Local mode
            if local_path:
                encoded_path = urllib.parse.quote(local_path, safe='/')
                return f"{base_url}/api/images/{encoded_path}"
        
        return None
    
    def scan_location_images(self, location_name):
        """
        Scan images directory for a specific location
        
        Args:
            location_name: Name of the location
        
        Returns:
            list: List of image file paths relative to images directory
        """
        images = []
        location_dir = self.local_images_dir / location_name
        
        if not location_dir.exists():
            logger.warning(f"Images directory not found for location: {location_name}")
            return images
        
        # Common image extensions
        image_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
        
        for file_path in location_dir.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in image_extensions:
                # Store relative path from images directory
                relative_path = f"{location_name}/{file_path.name}"
                images.append(relative_path)
        
        # Sort by filename (numerical if possible)
        try:
            images.sort(key=lambda x: int(Path(x).stem))
        except ValueError:
            images.sort()
        
        logger.info(f"Found {len(images)} images for location: {location_name}")
        return images
    
    def scan_all_location_images(self):
        """
        Scan all location directories for images
        
        Returns:
            dict: Dictionary mapping location names to list of image paths
        """
        image_mapping = {}
        
        if not self.local_images_dir.exists():
            logger.error(f"Images directory not found: {self.local_images_dir}")
            return image_mapping
        
        # Iterate through location directories
        for location_dir in self.local_images_dir.iterdir():
            if location_dir.is_dir():
                location_name = location_dir.name
                images = self.scan_location_images(location_name)
                if images:
                    image_mapping[location_name] = images
        
        logger.info(f"Scanned {len(image_mapping)} locations with images")
        return image_mapping
    
    def get_image_metadata(self, local_path):
        """
        Get image metadata (size, dimensions, format)
        
        Args:
            local_path: Relative path from images directory
        
        Returns:
            dict: Image metadata or None if file not found
        """
        full_path = self.local_images_dir / local_path
        
        if not full_path.exists():
            return None
        
        try:
            from PIL import Image
            
            with Image.open(full_path) as img:
                return {
                    'file_name': full_path.name,
                    'file_size': full_path.stat().st_size,
                    'width': img.width,
                    'height': img.height,
                    'format': img.format.lower() if img.format else Path(full_path).suffix[1:]
                }
        except ImportError:
            # PIL not available, return basic info
            return {
                'file_name': full_path.name,
                'file_size': full_path.stat().st_size,
                'width': None,
                'height': None,
                'format': Path(full_path).suffix[1:]
            }
        except Exception as e:
            logger.error(f"Error reading image metadata for {local_path}: {e}")
            return None
    
    def convert_google_drive_path(self, drive_path):
        """
        Convert Google Drive path to relative local path
        
        Args:
            drive_path: Google Drive path (e.g., '/content/drive/My Drive/Tourism.../images/Location/1.jpg')
        
        Returns:
            str: Relative path (e.g., 'Location/1.jpg') or None
        """
        if not drive_path or '/images/' not in drive_path:
            return None
        
        # Extract location and filename from Google Drive path
        parts = drive_path.split('/images/')
        if len(parts) > 1:
            return parts[1]  # Returns 'Location Name/filename.jpg'
        
        return None


def create_image_records_from_mapping(image_mapping, location_id_map):
    """
    Create LocationImage records from image mapping dictionary
    
    Args:
        image_mapping: Dict mapping location names to list of image paths
        location_id_map: Dict mapping location names to location IDs
    
    Returns:
        list: List of dictionaries for LocationImage records
    """
    image_records = []
    
    for location_name, image_paths in image_mapping.items():
        location_id = location_id_map.get(location_name)
        
        if not location_id:
            logger.warning(f"Location ID not found for: {location_name}")
            continue
        
        for idx, image_path in enumerate(image_paths):
            image_records.append({
                'location_id': location_id,
                'storage_mode': 'local',
                'local_path': image_path,
                'file_name': Path(image_path).name,
                'display_order': idx
            })
    
    return image_records
