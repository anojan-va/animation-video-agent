import json
import os
import requests
from pathlib import Path

# Configuration
ASSET_DIR = "public/assets"
INPUT_FILE = "input_script.json"
OUTPUT_FILE = "src/final_render.json"

def ensure_dir(path):
    """Ensure directory exists, create if it doesn't"""
    os.makedirs(path, exist_ok=True)

def process_assets():
    """Process all assets in the input script"""
    try:
        # Read input script
        with open(INPUT_FILE, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
        
        # Ensure asset directory exists
        ensure_dir(ASSET_DIR)
        
        print(f"🚀 Processing {len(data.get('visual_track', []))} scenes...")
        
        # Process each scene and asset
        for scene in data.get('visual_track', []):
            print(f"\n📽️  Processing scene: {scene.get('id', 'unknown')}")
            
            for asset in scene.get('assets', []):
                asset_id = asset.get('id')
                if not asset_id:
                    continue
                    
                filename = f"{asset_id}.png"
                local_path = os.path.join(ASSET_DIR, filename)
                
                # Check if asset already exists (CACHING)
                if os.path.exists(local_path):
                    print(f"⏩ Using cached asset: {filename}")
                    asset['local_path'] = f"assets/{filename}"
                    continue
                
                # Here you would normally call your AI image generation API
                print(f"🎨 Generating asset: {asset_id}")
                print(f"   Prompt: {asset.get('prompt', 'No prompt provided')}")
                
                # For now, we'll copy existing assets as placeholders
                # In a real implementation, you would:
                # 1. Call your AI image generation API
                # 2. Download the generated image
                # 3. Save it to local_path
                
                # Placeholder: Copy existing asset if available
                existing_assets = {
                    'gym_guy_crossed_arms': 'avatar_stoic_standing.png',
                    'warning_icon': 'avatar_stoic_pointing.png'
                }
                
                if asset_id in existing_assets:
                    source_path = os.path.join('public', existing_assets[asset_id])
                    if os.path.exists(source_path):
                        import shutil
                        shutil.copy2(source_path, local_path)
                        print(f"✅ Copied existing asset: {filename}")
                    else:
                        print(f"⚠️  Source asset not found: {source_path}")
                        # Create empty placeholder
                        with open(local_path, 'wb') as f:
                            f.write(b'')
                else:
                    # Create empty placeholder
                    with open(local_path, 'wb') as f:
                        f.write(b'')
                    print(f"✅ Created placeholder: {filename}")
                
                asset['local_path'] = f"assets/{filename}"
        
        # Save the final render data
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        
        print(f"\n🎉 Success! Processed {len(data.get('visual_track', []))} scenes")
        print(f"📁 Assets saved to: {os.path.abspath(ASSET_DIR)}")
        print(f"📄 Output saved to: {os.path.abspath(OUTPUT_FILE)}")
        
    except FileNotFoundError as e:
        print(f"❌ Error: {INPUT_FILE} not found. Please create it first.")
        print(f"   Example content: {json.dumps({'project_name': 'example', 'visual_track': [], 'text_track': []}, indent=2)}")
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON in {INPUT_FILE}: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    print("🚀 Starting asset processing...")
    process_assets()
