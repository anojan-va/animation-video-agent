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

load_dotenv()

app = FastAPI(title="AI Kinetic Video Agent")


# Request models
class GenerateRequest(BaseModel):
    script_path: str
    audio_path: str


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

        # Validate script JSON
        with open(script_path, "r") as f:
            json.load(f)

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


@app.post("/api/generate")
async def generate_assets(request: GenerateRequest):
    """Start asset generation process"""
    global builder

    try:
        builder = Builder(
            script_path=request.script_path,
            audio_path=request.audio_path,
            output_dir=str(public_dir / "assets"),
            log_callback=lambda msg: asyncio.create_task(
                manager.broadcast({"type": "log", "message": msg})
            ),
        )

        # Run generation in background
        asyncio.create_task(builder.generate_all())

        return {"status": "started"}
    except Exception as e:
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


@app.get("/api/render-config")
async def get_render_config():
    """Get configuration for Remotion renderer"""
    global builder

    if not builder or not builder.final_config:
        return JSONResponse(status_code=400, content={"error": "No config available"})

    return builder.final_config


@app.post("/api/render-video")
async def render_video():
    """Render video using Remotion"""
    global builder

    if not builder or not builder.final_config:
        return JSONResponse(status_code=400, content={"error": "No assets generated yet"})

    try:
        await manager.broadcast({"type": "log", "message": "🎬 Starting video rendering..."})

        # Create output and public audio directories
        output_dir = Path("/app/remotion/out")
        output_dir.mkdir(parents=True, exist_ok=True)
        output_file = output_dir / "video.mp4"
        
        # Ensure public/audio directory exists in remotion
        remotion_audio_dir = Path("/app/remotion/public/audio")
        remotion_audio_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy audio file to remotion public directory
        audio_src = Path(builder.audio_path)
        if audio_src.exists():
            import shutil
            audio_dest = remotion_audio_dir / audio_src.name
            shutil.copy2(audio_src, audio_dest)
            await manager.broadcast({"type": "log", "message": f"Copied audio file to {audio_dest}"})
        else:
            await manager.broadcast({"type": "log", "message": f"Warning: Audio file not found at {audio_src}"})

        # Run Remotion render command
        cmd = [
            "npm",
            "run",
            "render",
            "--",
            "--props",
            json.dumps(builder.final_config),
        ]

        process = await asyncio.create_subprocess_exec(
            *cmd,
            cwd="/app/remotion",
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
                "video_path": f"/public/video.mp4",
                "file_size": output_file.stat().st_size,
            }
        else:
            return JSONResponse(
                status_code=500, content={"error": "Video file not created"}
            )

    except Exception as e:
        await manager.broadcast({"type": "log", "message": f"❌ Error: {str(e)}"})
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/public/video.mp4")
async def download_video():
    """Download rendered video"""
    video_path = Path("/app/remotion/out/video.mp4")
    if not video_path.exists():
        return JSONResponse(status_code=404, content={"error": "Video not found"})

    return FileResponse(
        path=video_path,
        filename="video.mp4",
        media_type="video/mp4",
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
