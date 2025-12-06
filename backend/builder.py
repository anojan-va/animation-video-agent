import os
import json
import asyncio
import time
from pathlib import Path
from typing import Callable, Optional, Dict, List
import httpx
from PIL import Image
from io import BytesIO
import base64


class Builder:
    """Asset generation and management engine"""

    def __init__(
        self,
        script_path: str,
        audio_path: str,
        output_dir: str,
        log_callback: Optional[Callable[[str], None]] = None,
    ):
        self.script_path = script_path
        self.audio_path = audio_path
        self.output_dir = output_dir
        self.log_callback = log_callback or (lambda x: print(x))

        self.status = "idle"
        self.error = None
        self.generated_assets = []
        self.total_assets = 0
        self.final_config = None

        # Create output directory
        Path(output_dir).mkdir(parents=True, exist_ok=True)

        # Load script
        with open(script_path, "r") as f:
            self.script = json.load(f)

        # Count total assets
        self._count_assets()

    def _count_assets(self):
        """Count total assets to generate"""
        count = 0
        for scene in self.script.get("visual_track", []):
            for asset_type in ["avatar", "prop"]:
                if asset_type in scene.get("assets", {}):
                    count += 1
        self.total_assets = count

    async def _log(self, message: str):
        """Log message and notify via callback"""
        timestamp = time.strftime("%H:%M:%S")
        full_message = f"[{timestamp}] {message}"
        print(full_message)
        self.log_callback(full_message)

    async def _check_file_exists(self, asset_id: str) -> bool:
        """Check if asset already exists (idempotency)"""
        asset_path = Path(self.output_dir) / f"{asset_id}.png"
        return asset_path.exists()

    async def _generate_image(self, prompt: str, asset_id: str) -> Optional[bytes]:
        """Generate image using Together.ai FLUX API"""
        try:
            # Check if already exists
            if await self._check_file_exists(asset_id):
                await self._log(f"Asset {asset_id} already exists, skipping generation")
                return None

            await self._log(f"Generating image for {asset_id}...")

            together_bearer_token = os.getenv("TOGETHER_BEARER_TOKEN")
            if not together_bearer_token:
                await self._log(f"Warning: TOGETHER_BEARER_TOKEN not set, using placeholder image")
                img = Image.new("RGBA", (1024, 768), color=(73, 109, 137, 255))
                img_bytes = BytesIO()
                img.save(img_bytes, format="PNG")
                return img_bytes.getvalue()

            # Call Together.ai FLUX API
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://api.together.xyz/v1/images/generations",
                    headers={
                        "Authorization": f"Bearer {together_bearer_token}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "black-forest-labs/FLUX.1-schnell-Free",
                        "prompt": prompt,
                        "width": 1024,
                        "height": 768,
                        "steps": 4,
                        "n": 1,
                        "response_format": "url",
                    },
                )

                if response.status_code != 200:
                    await self._log(f"API error for {asset_id}: {response.status_code} - {response.text}")
                    return None

                data = response.json()
                
                # Extract image URL from response
                if "data" not in data or len(data["data"]) == 0:
                    await self._log(f"No image data in response for {asset_id}")
                    return None

                image_url = data["data"][0]["url"]
                await self._log(f"Generated image URL: {image_url}")

                # Download the image
                img_response = await client.get(image_url, timeout=30.0)
                if img_response.status_code != 200:
                    await self._log(f"Failed to download image for {asset_id}")
                    return None

                return img_response.content

        except Exception as e:
            await self._log(f"Error generating image for {asset_id}: {str(e)}")
            return None

    async def _remove_background(self, image_bytes: bytes, asset_id: str) -> bool:
        """Remove background from image using Hugging Face RMBG-1.4 API"""
        try:
            await self._log(f"Removing background for {asset_id}...")

            hf_token = os.getenv("HUGGINGFACE_TOKEN")
            if not hf_token:
                await self._log(f"Warning: HUGGINGFACE_TOKEN not set, saving image as-is")
                asset_path = Path(self.output_dir) / f"{asset_id}.png"
                with open(asset_path, "wb") as f:
                    f.write(image_bytes)
                self.generated_assets.append(asset_id)
                await self._log(f"✓ Asset {asset_id} saved (no background removal)")
                return True

            # Call Hugging Face RMBG-1.4 API with retry logic
            api_url = "https://api-inference.huggingface.co/models/briaai/RMBG-1.4"
            headers = {"Authorization": f"Bearer {hf_token}"}
            
            max_retries = 5
            for attempt in range(max_retries):
                try:
                    await self._log(f"Sending to Hugging Face RMBG-1.4 (Attempt {attempt + 1}/{max_retries})...")
                    
                    async with httpx.AsyncClient(timeout=60.0) as client:
                        response = await client.post(
                            api_url,
                            headers=headers,
                            content=image_bytes,
                        )

                        # Model is loading (cold start)
                        if response.status_code == 503:
                            try:
                                error_data = response.json()
                                estimated_time = error_data.get("estimated_time", 10)
                            except:
                                estimated_time = 10
                            
                            await self._log(f"⏳ Model loading... waiting {estimated_time}s")
                            await asyncio.sleep(estimated_time)
                            continue

                        if response.status_code == 200:
                            # Save transparent PNG
                            asset_path = Path(self.output_dir) / f"{asset_id}.png"
                            with open(asset_path, "wb") as f:
                                f.write(response.content)
                            
                            self.generated_assets.append(asset_id)
                            await self._log(f"✓ Asset {asset_id} saved with transparent background")
                            return True

                        # Other errors
                        await self._log(f"API error: {response.status_code} - {response.text[:100]}")
                        if attempt < max_retries - 1:
                            await asyncio.sleep(2)
                            continue
                        break

                except Exception as e:
                    await self._log(f"Connection error (Attempt {attempt + 1}): {str(e)}")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(2)
                        continue
                    break

            await self._log(f"Failed to remove background for {asset_id} after {max_retries} attempts")
            return False

        except Exception as e:
            await self._log(f"Error removing background for {asset_id}: {str(e)}")
            return False

    async def _generate_with_retry(
        self, prompt: str, asset_id: str, max_retries: int = 3
    ) -> bool:
        """Generate asset with exponential backoff retry logic"""
        for attempt in range(max_retries):
            try:
                image_bytes = await self._generate_image(prompt, asset_id)
                if image_bytes is None:
                    return True  # Already exists

                success = await self._remove_background(image_bytes, asset_id)
                if success:
                    return True

            except Exception as e:
                await self._log(
                    f"Attempt {attempt + 1}/{max_retries} failed for {asset_id}: {str(e)}"
                )
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    await self._log(f"Retrying in {wait_time} seconds...")
                    await asyncio.sleep(wait_time)

        self.error = f"Failed to generate {asset_id} after {max_retries} attempts"
        return False

    async def generate_all(self):
        """Generate all assets from script"""
        try:
            self.status = "processing"
            self.error = None
            self.generated_assets = []

            await self._log("Starting asset generation...")

            # Process visual track
            for scene_idx, scene in enumerate(self.script.get("visual_track", [])):
                await self._log(f"Processing scene {scene_idx + 1}...")

                for asset_type in ["avatar", "prop"]:
                    if asset_type not in scene.get("assets", {}):
                        continue

                    asset = scene["assets"][asset_type]
                    asset_id = asset.get("id", f"{asset_type}_{scene_idx}")
                    prompt = asset.get("prompt", "")

                    success = await self._generate_with_retry(prompt, asset_id)
                    if not success:
                        self.status = "error"
                        return

            await self._log("All assets generated successfully!")
            self.status = "ready"

            # Build final config for renderer
            await self._build_final_config()

        except Exception as e:
            self.status = "error"
            self.error = str(e)
            await self._log(f"Error: {str(e)}")

    async def _build_final_config(self):
        """Build final configuration with local paths for renderer"""
        final_config = {
            "project_settings": self.script.get("project_settings", {"fps": 30}),
            "visual_track": [],
            "text_track": self.script.get("text_track", []),
            "audio_path": self.audio_path,
        }

        # Add local paths to visual track
        for scene in self.script.get("visual_track", []):
            final_scene = {
                "id": scene.get("id"),
                "layout": scene.get("layout"),
                "assets": {},
            }

            for asset_type in ["avatar", "prop"]:
                if asset_type in scene.get("assets", {}):
                    asset = scene["assets"][asset_type]
                    asset_id = asset.get("id", f"{asset_type}_{scene.get('id')}")
                    final_scene["assets"][asset_type] = {
                        "id": asset_id,
                        "prompt": asset.get("prompt"),
                        "local_path": f"/public/assets/{asset_id}.png",
                    }

            final_config["visual_track"].append(final_scene)

        self.final_config = final_config

        # Save to file
        config_path = Path(self.output_dir).parent / "final_render.json"
        with open(config_path, "w") as f:
            json.dump(final_config, f, indent=2)

        await self._log(f"Final config saved to {config_path}")
