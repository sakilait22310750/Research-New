"""Wrapper script to run the Flask server with better error handling"""
import sys
import os
from pathlib import Path

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Change to backend directory
os.chdir(Path(__file__).parent)

print("=" * 50)
print("Starting SentimentMap Backend Server")
print("=" * 50)
print()

try:
    # Import and run the app
    from app import app, load_data_files, load_bert_model
    import logging
    
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    # Load data
    logger.info("Loading data files...")
    load_data_files()
    
    # Optionally load BERT model
    logger.info("Loading BERT model...")
    load_bert_model()
    
    # Run server
    logger.info("Starting Flask server...")
    logger.info("Server will be available at:")
    logger.info("  - http://localhost:5000")
    logger.info("  - http://0.0.0.0:5000")
    logger.info("")
    logger.info("API Health Check: http://localhost:5000/api/health")
    logger.info("")
    logger.info("Press Ctrl+C to stop the server")
    logger.info("=" * 50)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
    
except KeyboardInterrupt:
    print("\n\nServer stopped by user")
except Exception as e:
    print(f"\n\nERROR: Failed to start server")
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    input("\nPress Enter to exit...")

