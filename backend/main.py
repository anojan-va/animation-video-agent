import os
import json
import asyncio
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
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


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
