"""
drive_scan.py -- One-Time Setup Script

Run this ONCE locally before deploying or switching to Drive mode.
It scans your Google Drive images folder and generates drive_mapping.json,
which maps location names -> { filename -> Drive file ID }.

Usage:
    python drive_scan.py --folder-id FOLDER_ID --credentials path/to/key.json

Example:
    python drive_scan.py `
        --folder-id 1fhinbbuPQ4ai-cqUF5SveTr1mXrp8Cbq `
        --credentials "D:\\RP\\Research-New\\Research-main\\research-483110-8d25167de532.json"
"""

import argparse
import json
import sys
from pathlib import Path


def scan_drive_images(folder_id: str, credentials_path: str = None, api_key: str = None) -> dict:
    """
    Scan the Google Drive images folder and return a mapping dict.

    Expected Drive structure:
        images/ (root folder - this is FOLDER_ID)
        ├── Bentota Beach/
        │   ├── 0.jpg
        │   ├── 1.jpg
        │   └── ...
        ├── Galle Fort/
        │   └── ...
        └── ...

    Returns:
        { "LocationName": { "0.jpg": "FILE_ID", "1.jpg": "FILE_ID", ... }, ... }
    """
    print(f"\n[INFO] Initializing Google Drive API...")
    try:
        from googleapiclient.discovery import build
    except ImportError:
        print("❌ Google API packages not installed.")
        print("   Run: pip install google-api-python-client google-auth google-auth-httplib2")
        sys.exit(1)

    service = None

    # ── Option A: API Key (for public folders) ────────────────────────────────
    if api_key:
        print(f"   Mode        : API Key (public folder)")
        try:
            service = build('drive', 'v3', developerKey=api_key, cache_discovery=False)
            print(f"[OK] Drive API connected via API Key\n")
        except Exception as e:
            print(f"❌ Failed to connect using API Key: {e}")
            sys.exit(1)

    # ── Option B: Service Account ─────────────────────────────────────────────
    elif credentials_path:
        if not Path(credentials_path).exists():
            print(f"❌ Credentials file not found: {credentials_path}")
            sys.exit(1)
        print(f"   Credentials : {credentials_path}")
        print(f"   Folder ID   : {folder_id}")
        try:
            from google.oauth2 import service_account
            creds = service_account.Credentials.from_service_account_file(
                credentials_path,
                scopes=['https://www.googleapis.com/auth/drive.readonly']
            )
            service = build('drive', 'v3', credentials=creds, cache_discovery=False)
            print(f"[OK] Drive API connected via Service Account\n")
        except Exception as e:
            print(f"❌ Failed to connect using Service Account: {e}")
            sys.exit(1)
    else:
        print("❌ You must provide either --api-key or --credentials")
        sys.exit(1)

    print("")

    # -- Step 1: List location subfolders in root folder ----------------------
    print(f"[INFO] Scanning subfolders inside: {folder_id}")
    q = (
        f"'{folder_id}' in parents "
        f"and mimeType='application/vnd.google-apps.folder' "
        f"and trashed=false"
    )
    response = service.files().list(
        q=q,
        fields="files(id, name)",
        orderBy="name",
        pageSize=100
    ).execute()
    location_folders = response.get('files', [])

    if not location_folders:
        print(f"[WARN] No subfolders found in Drive folder: {folder_id}")
        print("   Make sure:")
        print("   1. The folder ID is correct")
        print("   2. The service account has 'Viewer' access to the folder")
        print("   3. Location images are inside subfolders (e.g. 'Bentota Beach/')")
        sys.exit(1)

    print(f"   Found {len(location_folders)} location folders")
    print("")

    # -- Step 2: List images inside each location folder ----------------------
    mapping = {}
    image_mime = (
        "mimeType='image/jpeg' or "
        "mimeType='image/jpg' or "
        "mimeType='image/png' or "
        "mimeType='image/webp'"
    )

    for i, loc in enumerate(location_folders, 1):
        loc_name = loc['name']
        loc_id = loc['id']

        img_q = (
            f"'{loc_id}' in parents "
            f"and ({image_mime}) "
            f"and trashed=false"
        )
        img_response = service.files().list(
            q=img_q,
            fields="files(id, name)",
            orderBy="name",
            pageSize=200
        ).execute()
        files = img_response.get('files', [])

        mapping[loc_name] = {f['name']: f['id'] for f in files}
        tag = "[OK]  " if files else "[WARN]"
        print(f"  [{i:2d}/{len(location_folders)}] {tag} {loc_name}: {len(files)} images")

    return mapping


def main():
    parser = argparse.ArgumentParser(
        description='Scan Google Drive images folder and generate drive_mapping.json'
    )
    parser.add_argument(
        '--folder-id',
        required=True,
        help='Google Drive folder ID (from the Drive URL after /folders/)'
    )
    # Auth: one of these two is required
    auth_group = parser.add_mutually_exclusive_group(required=True)
    auth_group.add_argument(
        '--credentials',
        help='Path to service account JSON key file (private folder)'
    )
    auth_group.add_argument(
        '--api-key',
        help='Google API Key (for publicly shared Drive folders)'
    )
    parser.add_argument(
        '--output',
        default='drive_mapping.json',
        help='Output JSON file path (default: drive_mapping.json)'
    )
    args = parser.parse_args()

    # Run scan
    mapping = scan_drive_images(
        folder_id=args.folder_id,
        credentials_path=args.credentials,
        api_key=args.api_key,
    )

    if not mapping:
        print("[ERROR] No locations found. Check folder ID and permissions.")
        sys.exit(1)

    # Write output
    out_path = Path(args.output)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)

    total_images = sum(len(v) for v in mapping.values())
    empty_locations = [k for k, v in mapping.items() if len(v) == 0]

    print("")
    print("=" * 60)
    print("[OK] drive_mapping.json generated successfully!")
    print(f"   Locations    : {len(mapping)}")
    print(f"   Total images : {total_images}")
    if empty_locations:
        print(f"   [WARN] Empty : {empty_locations}")
    print(f"   Output file  : {out_path.resolve()}")
    print("=" * 60)
    print("")
    print("Next steps:")
    print(f"  1. Open backend/.env")
    print(f"  2. Set IMAGE_STORAGE_MODE=drive")
    if args.credentials:
        print(f"  3. Set GOOGLE_APPLICATION_CREDENTIALS={args.credentials}")
    else:
        print(f"  3. Set GOOGLE_API_KEY={args.api_key}")
    print(f"  4. Set GOOGLE_DRIVE_FOLDER_ID={args.folder_id}")
    print(f"  5. Restart backend: python app.py")
    print(f"  6. Test in browser: http://localhost:5000/api/images/Bentota Beach/1.jpg")
    print("")


if __name__ == '__main__':
    main()
