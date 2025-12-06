#!/usr/bin/env python3
"""
Hugging Face Spaces deployment for AI Kinetic Video Agent
This runs the FastAPI backend with static frontend serving
"""

import os
import sys
import asyncio
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import the main app from backend
from main import app as backend_app

# Create a wrapper app that serves the frontend
app = FastAPI(title="AI Kinetic Video Agent")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all backend routes
app.include_router(backend_app.router)

# Mount backend static files
public_dir = Path(__file__).parent / "backend" / "public"
public_dir.mkdir(parents=True, exist_ok=True)
app.mount("/public", StaticFiles(directory=str(public_dir)), name="public")

# Serve frontend
frontend_dist = Path(__file__).parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
else:
    # Fallback if frontend not built
    @app.get("/")
    async def root():
        return {
            "message": "AI Kinetic Video Agent API",
            "docs": "/docs",
            "status": "running"
        }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
