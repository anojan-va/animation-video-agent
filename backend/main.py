import os
import json
import asyncio
import subprocess
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from builder import Builder
from dotenv import load_dotenv
from project_manager import ProjectManager
from schema_validator import validate_new_schema

load_dotenv()

app = FastAPI(title="AI Kinetic Video Agent")


# Request models
class GenerateRequest(BaseModel):
    script_data: dict
    audio_file: Optional[str] = None

class ProjectRequest(BaseModel):
    project_id: str


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files
public_dir = Path(__file__).parent / "public"
public_dir.mkdir(exist_ok=True)
app.mount("/public", StaticFiles(directory=str(public_dir)), name="public")

# Global state
builder: Optional[Builder] = None
active_connections = []
project_manager = ProjectManager()


async def run_generation_with_update(project_id: str):
    """Run asset generation and update project status"""
    global builder
    try:
        await builder.generate_all()
        
        # Copy assets to Remotion
        await builder._copy_assets_to_remotion()
        
        # Update project status to completed
        project_manager.update_project_status(project_id, "completed")
        
    except Exception as e:
        project_manager.update_project_status(project_id, "failed", error=str(e))


class ConnectionManager:
    def __init__(self):
        self.active_connections = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()


@app.post("/api/upload")
async def upload_files(audio: UploadFile = File(...), script: UploadFile = File(...)):
    """Upload audio and script files"""
    try:
        audio_path = public_dir / "audio" / audio.filename
        script_path = public_dir / "scripts" / script.filename

        audio_path.parent.mkdir(parents=True, exist_ok=True)
        script_path.parent.mkdir(parents=True, exist_ok=True)

        # Save files
        with open(audio_path, "wb") as f:
            f.write(await audio.read())

        with open(script_path, "wb") as f:
            f.write(await script.read())

        # Validate script JSON with new schema
        with open(script_path, "r") as f:
            script_data = json.load(f)
            
        # Check if it's using the new schema
        if 'scenes' in script_data and 'subtitles' in script_data:
            # New schema validation
            validation_result = validate_new_schema(script_data)
            if not validation_result['valid']:
                return JSONResponse(
                    status_code=400, 
                    content={
                        "error": "Invalid JSON schema",
                        "details": validation_result['errors']
                    }
                )
        elif 'visual_track' in script_data and 'text_track' in script_data:
            return JSONResponse(
                status_code=400,
                content={
                    "error": "Old JSON schema detected. Please use the new schema with 'scenes' and 'subtitles' instead of 'visual_track' and 'text_track'",
                    "hint": "New schema requires: project_settings, scenes, subtitles, audio_path"
                }
            )
        else:
            # Check what fields are present to give better error
            present_fields = list(script_data.keys())
            required_fields = ['project_settings', 'scenes', 'subtitles', 'audio_path']
            missing_fields = [field for field in required_fields if field not in script_data]
            
            return JSONResponse(
                status_code=400,
                content={
                    "error": "Invalid JSON structure",
                    "details": f"Missing required fields: {', '.join(missing_fields)}",
                    "present_fields": present_fields,
                    "required_fields": required_fields,
                    "hint": "Please ensure your JSON has the new schema structure with project_settings, scenes, subtitles, and audio_path"
                }
            )

        return {
            "status": "success",
            "audio_path": str(audio_path),
            "script_path": str(script_path),
        }
    except json.JSONDecodeError:
        return JSONResponse(
            status_code=400, content={"error": "Invalid JSON in script file"}
        )
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/api/projects")
async def create_project(request: GenerateRequest):
    """Create a new project"""
    try:
        # Debug logging
        print(f"Received request: script_data keys={list(request.script_data.keys()) if request.script_data else 'None'}")
        print(f"Audio file present: {bool(request.audio_file)}")
        if request.audio_file:
            print(f"Audio file starts with data:audio/: {request.audio_file.startswith('data:audio/')}")
        
        # Handle base64 audio file if provided
        audio_path = None
        if request.audio_file and request.audio_file.startswith('data:audio/'):
            import base64
            import re
            
            # Extract the base64 data
            match = re.match(r'data:audio/([^;]+);base64,(.+)', request.audio_file)
            if match:
                audio_format = match.group(1)
                base64_data = match.group(2)
                
                # Create project first to get the directory
                project_id = project_manager.create_project(
                    script_data=request.script_data,
                    audio_path=None
                )
                
                # Save audio file to project directory
                project_dir = project_manager.get_project_dir(project_id)
                audio_filename = f"audio.{audio_format}"
                audio_path = project_dir / "audio" / audio_filename
                audio_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Decode and save audio
                audio_data = base64.b64decode(base64_data)
                with open(audio_path, "wb") as f:
                    f.write(audio_data)
                
                # Update project with audio path
                project_manager.update_project(project_id, {"audio_path": str(audio_path)})
            else:
                raise ValueError("Invalid audio data format")
        else:
            # Create project without audio
            project_id = project_manager.create_project(
                script_data=request.script_data,
                audio_path=request.audio_file
            )
        
        return {"project_id": project_id}
    except Exception as e:
        print(f"Error creating project: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/projects")
async def get_projects():
    """Get all projects"""
    try:
        projects = project_manager.get_all_projects()
        return {"projects": projects}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/projects/{project_id}")
async def get_project(project_id: str):
    """Get specific project details"""
    try:
        project = project_manager.get_project(project_id)
        if not project:
            return JSONResponse(status_code=404, content={"error": "Project not found"})
        return project
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    try:
        success = project_manager.delete_project(project_id)
        if not success:
            return JSONResponse(status_code=404, content={"error": "Project not found"})
        return {"status": "deleted"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/api/projects/{project_id}/generate")
async def generate_assets(project_id: str):
    """Start asset generation for a project"""
    global builder

    try:
        project = project_manager.get_project(project_id)
        if not project:
            return JSONResponse(status_code=404, content={"error": "Project not found"})
        
        # Update project status
        project_manager.update_project_status(project_id, "processing")
        
        builder = Builder(
            project_id=project_id,
            log_callback=lambda msg: asyncio.create_task(
                manager.broadcast({"type": "log", "message": msg, "project_id": project_id})
            ),
        )

        # Run generation in background
        asyncio.create_task(run_generation_with_update(project_id))
        
        return {"project_id": project_id, "status": "started"}
    except Exception as e:
        project_manager.update_project_status(project_id, "failed", error=str(e))
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/api/projects/{project_id}/retry")
async def retry_project_generation(project_id: str):
    """Retry failed asset generation for a project"""
    global builder

    try:
        project = project_manager.get_project(project_id)
        if not project:
            return JSONResponse(status_code=404, content={"error": "Project not found"})
        
        # Update project status
        project_manager.update_project_status(project_id, "processing")
        
        builder = Builder(
            project_id=project_id,
            log_callback=lambda msg: asyncio.create_task(
                manager.broadcast({"type": "log", "message": msg, "project_id": project_id})
            ),
        )

        # Run generation in background
        asyncio.create_task(run_generation_with_update(project_id))
        
        return {"project_id": project_id, "status": "retrying"}
    except Exception as e:
        project_manager.update_project_status(project_id, "failed", error=str(e))
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/api/retry")
async def retry_generation():
    """Retry failed asset generation"""
    global builder

    if not builder:
        return JSONResponse(status_code=400, content={"error": "No active builder"})

    try:
        asyncio.create_task(builder.generate_all())
        return {"status": "resumed"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/status")
async def get_status():
    """Get current generation status"""
    global builder

    if not builder:
        return {"status": "idle"}

    return {
        "status": builder.status,
        "generated_assets": len(builder.generated_assets),
        "total_assets": builder.total_assets,
        "error": builder.error,
    }


@app.get("/api/assets")
async def list_assets():
    """List all generated assets"""
    assets_dir = public_dir / "assets"
    if not assets_dir.exists():
        return {"assets": []}

    assets = []
    for file in assets_dir.glob("*.png"):
        assets.append({"name": file.name, "path": f"/public/assets/{file.name}"})

    return {"assets": assets}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time logs"""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/api/projects/{project_id}/render-config")
async def get_project_render_config(project_id: str):
    """Get configuration for Remotion renderer for a specific project"""
    try:
        project = project_manager.get_project(project_id)
        if not project:
            return JSONResponse(status_code=404, content={"error": "Project not found"})
        
        # Load final config from project directory
        config_path = project_manager.get_project_dir(project_id) / "final_render.json"
        if not config_path.exists():
            return JSONResponse(status_code=400, content={"error": "No render config available"})
        
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        return config
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/api/projects/{project_id}/render-video")
async def render_project_video(project_id: str):
    """Render video using Remotion for a specific project"""
    try:
        project = project_manager.get_project(project_id)
        if not project:
            return JSONResponse(status_code=404, content={"error": "Project not found"})
        
        # Update project status
        project_manager.update_project_status(project_id, "rendering")
        
        # Load final config from project directory
        config_path = project_manager.get_project_dir(project_id) / "final_render.json"
        if not config_path.exists():
            return JSONResponse(status_code=400, content={"error": "No render config available"})
        
        with open(config_path, 'r') as f:
            final_config = json.load(f)

        # Validate layouts before rendering
        AVAILABLE_LAYOUTS = [
            "avatar_full_center",
            "prop_full_center", 
            "text_full_center",
            "avatar_right_text_left",
            "prop_right_text_left",
            "avatar_left_text_right",
            "prop_left_text_right",
            "avatar_middle_text_sides",
            "text_top_avatar_bottom",
            "text_top_prop_bottom",
            "avatar_center_props_sides",
            "props_triple_row",
            "avatar_right_prop_left",
            "avatar_left_prop_right"
        ]
        
        # Check each scene's layout
        if "scenes" in final_config:
            for scene in final_config["scenes"]:
                if "layout" not in scene:
                    return JSONResponse(
                        status_code=400, 
                        content={
                            "error": f"Scene '{scene.get('id', 'unknown')}' has no layout specified",
                            "available_layouts": AVAILABLE_LAYOUTS
                        }
                    )
                
                layout = scene["layout"]
                if layout not in AVAILABLE_LAYOUTS:
                    return JSONResponse(
                        status_code=400,
                        content={
                            "error": f"Scene '{scene.get('id', 'unknown')}' uses invalid layout '{layout}'",
                            "available_layouts": AVAILABLE_LAYOUTS
                        }
                    )


        await manager.broadcast({"type": "log", "message": "🎬 Starting video rendering..."})

        # Create output and public audio directories
        project_root = Path(__file__).parent.parent
        output_dir = project_root / "remotion" / "out"
        output_dir.mkdir(parents=True, exist_ok=True)
        output_file = output_dir / "video.mp4"
        
        # Ensure public/audio directory exists in remotion
        remotion_audio_dir = project_root / "remotion" / "public" / "audio"
        remotion_audio_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy audio file to remotion public directory if exists
        project_dir = project_manager.get_project_dir(project_id)
        audio_dest = None
        if final_config.get("audio_path"):
            audio_src = Path(final_config["audio_path"])
            if audio_src.exists():
                import shutil
                audio_dest = remotion_audio_dir / audio_src.name
                shutil.copy2(audio_src, audio_dest)
                await manager.broadcast({"type": "log", "message": f"Copied audio file to {audio_dest}"})
                
                # Update audio_path in final_config to be relative for Remotion
                # This ensures staticFile() works correctly in Remotion
                final_config["audio_path"] = f"audio/{audio_src.name}"
            else:
                await manager.broadcast({"type": "log", "message": f"Warning: Audio file not found at {audio_src}"})
        else:
            await manager.broadcast({"type": "log", "message": "No audio file specified"})

        # Calculate audio duration and set video length accordingly
        if audio_dest and audio_dest.exists():
            try:
                import librosa
                audio_duration = librosa.get_duration(path=str(audio_dest))
                duration_frames = int(audio_duration * 30)  # 30 fps
                await manager.broadcast({"type": "log", "message": f"Audio duration: {audio_duration:.2f}s ({duration_frames} frames at 30fps)"})
            except ImportError:
                await manager.broadcast({"type": "log", "message": "Warning: librosa not installed, using default duration"})
                duration_frames = 540  # 18 seconds default
            except Exception as e:
                await manager.broadcast({"type": "log", "message": f"Error detecting audio duration: {str(e)}, using default"})
                duration_frames = 540
        else:
            await manager.broadcast({"type": "log", "message": "No audio file available, using default duration"})
            duration_frames = 540  # 18 seconds default

        # Save config to file for Remotion
        props_file = project_root / "remotion" / "props.json"
        with open(props_file, "w") as f:
            json.dump(final_config, f)

        # Run Remotion render command with calculated duration
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        cmd = [
            npm_cmd,
            "run",
            "render",
            "--",
            "--props",
            str(props_file),
            "--frames",
            f"0-{duration_frames-1}",
        ]

        process = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(project_root / "remotion"),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        # Stream output to WebSocket
        while True:
            line = await process.stdout.readline()
            if not line:
                break
            message = line.decode().strip()
            if message:
                await manager.broadcast({"type": "log", "message": f"[Remotion] {message}"})

        await process.wait()

        if process.returncode != 0:
            error = await process.stderr.read()
            error_msg = error.decode()
            await manager.broadcast(
                {"type": "log", "message": f"❌ Render failed: {error_msg}"}
            )
            return JSONResponse(status_code=500, content={"error": error_msg})

        if output_file.exists():
            await manager.broadcast(
                {"type": "log", "message": "✓ Video rendered successfully!"}
            )
            return {
                "status": "success",
                "video_path": "/api/download-video",
                "file_size": output_file.stat().st_size,
            }
        else:
            return JSONResponse(
                status_code=500, content={"error": "Video file not created"}
            )

    except Exception as e:
        await manager.broadcast({"type": "log", "message": f"❌ Error: {str(e)}"})
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/download-video")
async def download_video():
    """Download rendered video"""
    project_root = Path(__file__).parent.parent
    video_path = project_root / "remotion" / "out" / "video.mp4"
    if not video_path.exists():
        return JSONResponse(status_code=404, content={"error": "Video not found"})

    return FileResponse(
        path=video_path,
        filename="video.mp4",
        media_type="video/mp4",
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)

