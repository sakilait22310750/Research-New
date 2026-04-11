"""
Simple script to create TripSense app icon
Requires: pip install Pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon():
    # Create a 1024x1024 image
    size = 1024
    img = Image.new('RGB', (size, size), color='#059669')  # Green background
    draw = ImageDraw.Draw(img)
    
    # Draw a more visible compass/travel icon
    center = size // 2
    radius = int(size * 0.35)  # Larger radius for better visibility
    
    # Draw outer circle with border
    draw.ellipse(
        [center - radius, center - radius, center + radius, center + radius],
        fill='#ffffff',
        outline='#10b981',
        width=int(size * 0.03)  # Thicker border
    )
    
    # Draw inner circle
    inner_radius = int(radius * 0.5)
    draw.ellipse(
        [center - inner_radius, center - inner_radius, center + inner_radius, center + inner_radius],
        fill='#10b981'
    )
    
    # Draw compass needle (pointing North)
    needle_length = int(radius * 0.6)
    needle_width = int(size * 0.04)
    # North needle (red)
    draw.polygon(
        [(center, center - needle_length),
         (center - needle_width, center - inner_radius),
         (center + needle_width, center - inner_radius)],
        fill='#ef4444'
    )
    # South needle (white)
    draw.polygon(
        [(center, center + needle_length),
         (center - needle_width, center + inner_radius),
         (center + needle_width, center + inner_radius)],
        fill='#ffffff'
    )
    
    # Draw compass points (N, S, E, W) - larger and more visible
    point_size = int(size * 0.05)
    # North point
    draw.polygon(
        [(center, center - radius + int(size * 0.02)), 
         (center - point_size, center - radius + int(size * 0.08)),
         (center + point_size, center - radius + int(size * 0.08))],
        fill='#ef4444'
    )
    # South point
    draw.polygon(
        [(center, center + radius - int(size * 0.02)),
         (center - point_size, center + radius - int(size * 0.08)),
         (center + point_size, center + radius - int(size * 0.08))],
        fill='#059669'
    )
    # East point
    draw.polygon(
        [(center + radius - int(size * 0.02), center),
         (center + radius - int(size * 0.08), center - point_size),
         (center + radius - int(size * 0.08), center + point_size)],
        fill='#3b82f6'
    )
    # West point
    draw.polygon(
        [(center - radius + int(size * 0.02), center),
         (center - radius + int(size * 0.08), center - point_size),
         (center - radius + int(size * 0.08), center + point_size)],
        fill='#3b82f6'
    )
    
    # Add center dot
    dot_radius = int(size * 0.02)
    draw.ellipse(
        [center - dot_radius, center - dot_radius, center + dot_radius, center + dot_radius],
        fill='#ffffff'
    )
    
    # Save icon
    icon_path = os.path.join('assets', 'icon.png')
    img.save(icon_path)
    print(f"[OK] Created icon: {icon_path}")
    
    # Create adaptive icon (Android) - same design
    adaptive_path = os.path.join('assets', 'adaptive-icon.png')
    img.save(adaptive_path)
    print(f"[OK] Created adaptive icon: {adaptive_path}")
    
    # Create splash icon (simpler version)
    splash_size = 512
    splash_img = Image.new('RGB', (splash_size, splash_size), color='#ffffff')
    splash_draw = ImageDraw.Draw(splash_img)
    
    splash_center = splash_size // 2
    splash_radius = splash_size // 3
    
    # Draw icon on white background
    splash_draw.ellipse(
        [splash_center - splash_radius, splash_center - splash_radius,
         splash_center + splash_radius, splash_center + splash_radius],
        fill='#059669',
        outline='#10b981',
        width=10
    )
    
    splash_path = os.path.join('assets', 'splash-icon.png')
    splash_img.save(splash_path)
    print(f"[OK] Created splash icon: {splash_path}")
    
    # Create favicon (web)
    favicon_size = 32
    favicon = img.resize((favicon_size, favicon_size), Image.Resampling.LANCZOS)
    favicon_path = os.path.join('assets', 'favicon.png')
    favicon.save(favicon_path)
    print(f"[OK] Created favicon: {favicon_path}")
    
    print("\n[SUCCESS] All icons created successfully!")
    print("  You can now use these icons in your Expo app.")

if __name__ == '__main__':
    try:
        create_icon()
    except ImportError:
        print("Error: Pillow is not installed.")
        print("Please install it with: pip install Pillow")
    except Exception as e:
        print(f"Error creating icon: {e}")

