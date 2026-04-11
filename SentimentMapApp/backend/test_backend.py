"""Quick test to see if backend can start"""
import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

try:
    print("Testing imports...")
    from flask import Flask
    from flask_cors import CORS
    import pandas as pd
    print("[OK] All imports successful")
    
    print("\nTesting data file access...")
    BASE_DIR = Path(__file__).parent.parent
    DATA_DIR = BASE_DIR / 'data'
    print(f"Data directory: {DATA_DIR}")
    print(f"Data directory exists: {DATA_DIR.exists()}")
    
    if DATA_DIR.exists():
        files = list(DATA_DIR.glob('*.csv')) + list(DATA_DIR.glob('*.json'))
        print(f"Found {len(files)} data files:")
        for f in files:
            print(f"  - {f.name}")
    
    print("\n[OK] Ready to start server")
    print("\nTo start the server, run: python app.py")
    
except Exception as e:
    print(f"\n[ERROR] Error: {e}")
    import traceback
    traceback.print_exc()

