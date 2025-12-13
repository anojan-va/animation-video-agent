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
from project_manager import ProjectManager
from google import genai
from google.genai import types


class Builder:
    """Asset generation and management engine"""

    def __init__(
        self,
        project_id: str,
        log_callback: Optional[Callable[[str], None]] = None,
    ):
        self.project_id = project_id
        self.project_manager = ProjectManager()
        self.project_dir = self.project_manager.get_project_dir(project_id)
        self.log_callback = log_callback or (lambda x: print(x))

        self.status = "idle"
        self.error = None
        self.generated_assets = []
        self.total_assets = 0
        self.final_config = None

        # Load script from project directory
        script_path = self.project_dir / "input_script.json"
        with open(script_path, "r") as f:
            self.script = json.load(f)

        # Extract audio path from script if available
        audio_path_str = self.script.get("audio_path")
        self.audio_path = Path(audio_path_str) if audio_path_str else None

        # Count total assets
        self._count_assets()
        
        # Initialize Google Gemini client for avatar generation
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        if self.google_api_key:
            self.genai_client = genai.Client(api_key=self.google_api_key)
            # Base avatar path for consistency
            self.base_avatar_path = Path(__file__).parent / "public" / "assets" / "image" / "avatars" / "avatar.png"
        else:
            self.genai_client = None
            print("Warning: GOOGLE_API_KEY not set, will use Together.ai for all images")

    def _count_assets(self):
        """Count total assets to generate (NEW SCHEMA ONLY)"""
        count = 0
        
        # New schema: count elements with type 'image'
        if 'scenes' in self.script:
            for scene in self.script.get("scenes", []):
                for element in scene.get("elements", []):
                    if element.get("type") == "image":
                        count += 1
        else:
            # No valid schema found
            raise ValueError("Invalid script format: Missing 'scenes' array. Please use new JSON schema with 'scenes' and 'subtitles'.")
        
        self.total_assets = count

    async def _log(self, message: str):
        """Log message and notify via callback"""
        timestamp = time.strftime("%H:%M:%S")
        full_message = f"[{timestamp}] {message}"
        print(full_message)
        self.log_callback(full_message)

    async def _check_file_exists(self, asset_id: str) -> bool:
        """Check if asset already exists (idempotency)"""
        asset_path = self.project_dir / "assets" / f"{asset_id}.png"
        return asset_path.exists()

    async def _generate_avatar_google(self, prompt: str, asset_id: str, max_retries: int = 3) -> Optional[bytes]:
        """Generate avatar using Google Gemini 2.5 Flash Image with base avatar for consistency"""
        for attempt in range(max_retries):
            try:
                # Check if already exists
                if await self._check_file_exists(asset_id):
                    await self._log(f"Avatar {asset_id} already exists, skipping generation")
                    return None

                await self._log(f"Generating avatar for {asset_id} using Google Gemini (attempt {attempt + 1}/{max_retries})...")

                if not self.genai_client or not self.base_avatar_path.exists():
                    await self._log(f"Google Gemini not available or base avatar missing - cannot generate avatar {asset_id}")
                    return None

                # Load base avatar image
                base_avatar = Image.open(self.base_avatar_path)
                
                # Enhanced prompt for avatar consistency
                enhanced_prompt = f"Create avatar based on this person with transparent background: {prompt}. Maintain facial features and appearance consistency with the base image. 2D flat vector art style, clean design.avatar should cover full body(no half avatar image)"

                # Generate using Google Gemini
                response = self.genai_client.models.generate_content(
                    model="gemini-2.5-flash-image",
                    contents=[enhanced_prompt, base_avatar],
                )

                # Extract generated image from response
                for part in response.parts:
                    if part.inline_data is not None:
                        # Get the image data directly from inline_data
                        image_data = part.inline_data.data
                        
                        # If it's already bytes, use it directly
                        if isinstance(image_data, bytes):
                            return image_data
                        
                        # If it's a PIL Image, convert it properly
                        elif hasattr(part, 'as_image'):
                            generated_image = part.as_image()
                            img_bytes = BytesIO()
                            generated_image.save(img_bytes, 'PNG')
                            img_bytes.seek(0)
                            return img_bytes.getvalue()

                await self._log(f"No image generated in Google Gemini response for {asset_id}")
                return None

            except Exception as e:
                await self._log(f"Error generating avatar with Google Gemini for {asset_id} (attempt {attempt + 1}/{max_retries}): {str(e)}")
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    await self._log(f"Retrying in {wait_time} seconds...")
                    await asyncio.sleep(wait_time)
                
        # All retries failed
        await self._log(f"Failed to generate avatar {asset_id} after {max_retries} attempts")
        return None

    async def _generate_image(self, prompt: str, asset_id: str, role: str = "avatar") -> Optional[bytes]:
        """Route image generation based on role: avatar -> Google Gemini, prop -> Together.ai"""
        if role == "avatar":
            return await self._generate_avatar_google(prompt, asset_id)
        elif role == "prop":
            return await self._generate_image_together(prompt, asset_id)
        else:
            # Default to Together.ai for unknown roles
            return await self._generate_image_together(prompt, asset_id)

    async def _generate_image_together(self, prompt: str, asset_id: str) -> Optional[bytes]:
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

                try:
                    data = response.json()
                    
                    # Validate API response structure
                    if not isinstance(data, dict):
                        raise ValueError(f"Expected dictionary response, got {type(data).__name__}")
                        
                    if "data" not in data or not isinstance(data["data"], list) or not data["data"]:
                        error_msg = data.get("error", {}).get("message", "No error details provided")
                        await self._log(f"Invalid or empty data in API response for {asset_id}: {error_msg}")
                        await self._log(f"Full response: {data}")
                        return None

                    # Safely get the first result
                    first_result = data["data"][0]
                    if not isinstance(first_result, dict) or "url" not in first_result:
                        await self._log(f"Invalid image data format in API response for {asset_id}")
                        return None

                    image_url = first_result["url"]
                    if not image_url or not isinstance(image_url, str):
                        await self._log(f"Invalid image URL received for {asset_id}")
                        return None

                    await self._log(f"Generated image URL: {image_url}")

                    # Download the image
                    img_response = await client.get(image_url, timeout=30.0)
                    if img_response.status_code != 200:
                        await self._log(f"Failed to download image for {asset_id}. Status: {img_response.status_code}")
                        return None
                        
                except (ValueError, KeyError, IndexError, AttributeError) as e:
                    await self._log(f"Error parsing API response for {asset_id}: {str(e)}")
                    if 'data' in locals():
                        await self._log(f"Response data: {data}")
                    return None

                return img_response.content

        except Exception as e:
            await self._log(f"Error generating image for {asset_id}: {str(e)}")
            return None

    async def _remove_background(self, image_bytes: bytes, asset_id: str) -> bool:
        """
        Remove background from image using rembg library
        
        Args:
            image_bytes: Raw image data as bytes
            asset_id: Unique identifier for the asset (used for logging)
            
        Returns:
            bool: True if background was successfully removed or fallback was used, False on critical error
        """
        if not image_bytes:
            await self._log(f"Error: Empty image data received for {asset_id}")
            return False
            
        try:
            # Import rembg here to handle cases where it's not installed
            try:
                from rembg import remove, new_session
            except ImportError as import_err:
                await self._log("Error: rembg library not installed. Please install it with 'pip install rembg'")
                return False

            await self._log(f"[DEBUG] Starting background removal for {asset_id}...")
            
            # Process the image with rembg
            try:
                # Use a session for better performance with multiple images
                session = new_session()
                output_bytes = remove(image_bytes, session=session)
                
                if not output_bytes:
                    await self._log(f"Warning: Empty output from rembg for {asset_id}")
                    raise ValueError("Empty output from rembg")
                
                # Save the output image
                asset_path = self.project_dir / "assets" / f"{asset_id}.png"
                try:
                    with open(asset_path, "wb") as f:
                        f.write(output_bytes)
                    
                    # Verify the file was written
                    if not asset_path.exists() or asset_path.stat().st_size == 0:
                        raise IOError("Failed to write output file")
                        
                    self.generated_assets.append(asset_id)
                    await self._log(f"✓ Successfully processed and saved {asset_id} with transparent background")
                    return True
                    
                except IOError as io_err:
                    await self._log(f"Error saving {asset_id}: {str(io_err)}")
                    raise
                
            except Exception as process_err:
                await self._log(f"Error during background removal for {asset_id}: {str(process_err)}")
                # Fallback: save original image if rembg fails
                try:
                    asset_path = self.project_dir / "assets" / f"{asset_id}.png"
                    with open(asset_path, "wb") as f:
                        f.write(image_bytes)
                    
                    self.generated_assets.append(asset_id)
                    await self._log(f"✓ Saved original image for {asset_id} (background removal failed)")
                    return True
                except Exception as fallback_err:
                    await self._log(f"Critical error saving fallback image for {asset_id}: {str(fallback_err)}")
                    return False
                
        except Exception as e:
            await self._log(f"Unexpected error in _remove_background for {asset_id}: {str(e)}")
            return False

    async def _generate_with_retry(
        self, prompt: str, asset_id: str, role: str = "avatar", max_retries: int = 3
    ) -> bool:
        """Generate asset with exponential backoff retry logic"""
        for attempt in range(max_retries):
            try:
                image_bytes = await self._generate_image(prompt, asset_id, role)
                if image_bytes is None:
                    if role == "avatar":
                        # Avatar generation failed - don't retry
                        return False
                    else:
                        # Prop already exists or cached
                        return True

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
        """Generate all assets from script (NEW SCHEMA ONLY)"""
        try:
            self.status = "processing"
            self.error = None
            self.generated_assets = []

            await self._log("Starting asset generation...")

            # Validate that we have the new schema
            if 'scenes' not in self.script:
                raise ValueError("Invalid script format: Missing 'scenes' array. Please use the new JSON schema with 'scenes' and 'subtitles'.")
            
            if 'subtitles' not in self.script:
                raise ValueError("Invalid script format: Missing 'subtitles' array. Please use the new JSON schema with 'scenes' and 'subtitles'.")

            # Process scenes and elements
            for scene_idx, scene in enumerate(self.script.get("scenes", [])):
                try:
                    if not isinstance(scene, dict):
                        await self._log(f"Warning: Scene {scene_idx + 1} is not a valid dictionary, skipping")
                        continue
                        
                    await self._log(f"Processing scene {scene_idx + 1}...")
                    
                    # Ensure scene has elements array
                    if "elements" not in scene or not isinstance(scene["elements"], list):
                        await self._log(f"Warning: Scene {scene_idx + 1} has no valid elements, skipping")
                        continue

                    for element in scene["elements"]:
                        if not isinstance(element, dict):
                            await self._log(f"Warning: Element in scene {scene_idx + 1} is not a valid dictionary, skipping")
                            continue
                            

                        # Only process image elements
                        if element.get("type") != "image":
                            continue
                            

                        asset_id = element.get("id", f"element_{scene_idx}")
                        prompt = element.get("prompt", "")
                        role = element.get("role", "avatar")  # Get role from element

                        if not prompt:
                            await self._log(f"Warning: No prompt provided for {asset_id} in scene {scene_idx + 1}, skipping")
                            continue

                        await self._log(f"Generating image asset: {asset_id} (role: {role})")
                        success = await self._generate_with_retry(prompt, asset_id, role)
                        if not success:
                            self.status = "error"
                            self.error = f"Failed to generate {asset_id}"
                            return
                            

                        # Update the element with the local path
                        element["local_path"] = f"assets/{asset_id}.png"
                        await self._log(f"Updated {asset_id} local_path: assets/{asset_id}.png")

                except Exception as scene_error:
                    self.status = "error"
                    self.error = f"Error processing scene {scene_idx + 1}: {str(scene_error)}"
                    return

            await self._log("All assets generated successfully!")
            self.status = "ready"

            # Build final config for renderer
            await self._build_final_config()
            
            # Copy assets to Remotion public directory
            await self._copy_assets_to_remotion()

        except Exception as e:
            self.status = "error"
            self.error = str(e)
            await self._log(f"Error: {str(e)}")

    async def _build_final_config(self):
        """Build final configuration with local paths for renderer (NEW SCHEMA ONLY)"""
        try:
            if not hasattr(self, 'script') or self.script is None:
                raise ValueError("Script data is missing or invalid")
                
            if not isinstance(self.script, dict):
                raise ValueError(f"Expected script to be a dictionary, got {type(self.script).__name__}")

            await self._log("Building final configuration...")
            
            # Validate that we have new schema
            if 'scenes' not in self.script:
                raise ValueError("Invalid script format: Missing 'scenes' array. Please use new JSON schema with 'scenes' and 'subtitles'.")
            
            if 'subtitles' not in self.script:
                raise ValueError("Invalid script format: Missing 'subtitles' array. Please use new JSON schema with 'scenes' and 'subtitles'.")

            # New schema - use it directly
            final_config = {
                "project_settings": self.script.get("project_settings", {"fps": 30, "width": 1920, "height": 1080}),
                "scenes": self.script["scenes"],
                "audio_path": f"audio/{self.audio_path.name}" if self.audio_path else None,
                "subtitles": self.script["subtitles"],
            }
            await self._log("Using new schema format")
            
            self.final_config = final_config

            # Save to file
            try:
                config_path = self.project_dir / "final_render.json"
                with open(config_path, "w") as f:
                    json.dump(final_config, f, indent=2)
                await self._log(f"✓ Final config saved to {config_path}")
            except Exception as e:
                await self._log(f"Error saving final config: {str(e)}")
                raise

        except Exception as e:
            error_msg = f"Error building final config: {str(e)}"
            await self._log(error_msg)
            raise ValueError(error_msg)

    async def _copy_assets_to_remotion(self):
        """Copy generated assets to Remotion public directory"""
        try:
            await self._log("Copying assets to Remotion public directory...")
            
            # Get paths
            project_root = Path(__file__).parent.parent
            source_dir = self.project_dir / "assets"
            target_dir = project_root / "remotion" / "public" / "assets"
            
            # Create target directory if it doesn't exist
            target_dir.mkdir(parents=True, exist_ok=True)
            
            # Copy all PNG files
            assets_copied = 0
            for asset_file in source_dir.glob("*.png"):
                target_file = target_dir / asset_file.name
                import shutil
                shutil.copy2(asset_file, target_file)
                assets_copied += 1
                await self._log(f"Copied {asset_file.name} to Remotion public directory")
            
            await self._log(f"✓ Copied {assets_copied} assets to Remotion public directory")

            # Copy audio file if it exists
            if self.audio_path:
                await self._log(f"Debug: self.project_dir: {self.project_dir}")
                await self._log(f"Debug: self.audio_path: {self.audio_path}")
                audio_src = self.project_dir / self.audio_path
                await self._log(f"Debug: constructed audio_src path: {audio_src}")
                await self._log(f"Debug: audio_src exists: {audio_src.exists()}")
                
                if audio_src.exists():
                    remotion_audio_dir = project_root / "remotion" / "public" / "audio"
                    remotion_audio_dir.mkdir(parents=True, exist_ok=True)
                    audio_dest = remotion_audio_dir / audio_src.name
                    import shutil
                    shutil.copy2(audio_src, audio_dest)
                    await self._log(f"✓ Copied audio to {audio_dest}")
                    
                    # Ensure final_config has the correct path for Remotion (relative to public)
                    if self.final_config:
                        self.final_config["audio_path"] = f"audio/{audio_src.name}"
                else:
                    await self._log(f"Warning: Audio file not found at {audio_src}")
            
            # Also copy final_render.json to remotion/props.json for preview
            if self.final_config:
                props_file = project_root / "remotion" / "props.json"
                with open(props_file, "w") as f:
                    json.dump(self.final_config, f, indent=2)
                await self._log(f"✓ Updated remotion/props.json for preview")
            
        except Exception as e:
            await self._log(f"Error copying assets to Remotion: {str(e)}")
            # Don't raise error - video can still render with existing assets