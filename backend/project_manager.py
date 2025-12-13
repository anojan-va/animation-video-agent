import os
import json
import uuid
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

class ProjectManager:
    """Manages video projects with unique IDs and asset folders"""
    
    def __init__(self, base_dir: str = "projects"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)
        self.projects_file = self.base_dir / "projects.json"
        self._load_projects()
    
    def _load_projects(self):
        """Load existing projects from file"""
        if self.projects_file.exists():
            with open(self.projects_file, 'r') as f:
                self.projects = json.load(f)
        else:
            self.projects = {}
    
    def _save_projects(self):
        """Save projects to file"""
        with open(self.projects_file, 'w') as f:
            json.dump(self.projects, f, indent=2)
    
    def create_project(self, script_data: dict, audio_path: str = None) -> str:
        """Create a new project with unique ID"""
        project_id = str(uuid.uuid4())[:8]  # Short unique ID
        project_dir = self.base_dir / project_id
        
        # Create project directories
        project_dir.mkdir(exist_ok=True)
        (project_dir / "assets").mkdir(exist_ok=True)
        (project_dir / "audio").mkdir(exist_ok=True)
        (project_dir / "output").mkdir(exist_ok=True)
        
        # Copy audio file if provided
        if audio_path and os.path.exists(audio_path):
            audio_filename = os.path.basename(audio_path)
            shutil.copy2(audio_path, project_dir / "audio" / audio_filename)
            script_data["audio_path"] = f"audio/{audio_filename}"
        
        # Save script
        with open(project_dir / "input_script.json", 'w') as f:
            json.dump(script_data, f, indent=2)
        
        # Update asset paths in script to be relative to project
        for scene in script_data.get("visual_track", []):
            # Handle avatar asset
            if scene.get("avatar") and isinstance(scene["avatar"], dict):
                if "asset" in scene["avatar"] and scene["avatar"]["asset"]:
                    # Asset is just a filename, no path update needed
                    pass
            
            # Handle prop asset
            if scene.get("prop") and isinstance(scene["prop"], dict):
                if "asset" in scene["prop"] and scene["prop"]["asset"]:
                    # Asset is just a filename, no path update needed
                    pass
        
        # Save updated script
        with open(project_dir / "input_script.json", 'w') as f:
            json.dump(script_data, f, indent=2)
        
        # Register project
        self.projects[project_id] = {
            "id": project_id,
            "created_at": datetime.now().isoformat(),
            "status": "pending",
            "script_data": script_data,
            "video_path": None,
            "error": None
        }
        self._save_projects()
        
        return project_id
    
    def get_project(self, project_id: str) -> Optional[Dict]:
        """Get project details"""
        return self.projects.get(project_id)
    
    def get_all_projects(self) -> List[Dict]:
        """Get all projects"""
        return list(self.projects.values())
    
    def update_project(self, project_id: str, updates: dict):
        """Update project with new data"""
        if project_id in self.projects:
            self.projects[project_id].update(updates)
            self._save_projects()
    
    def update_project_status(self, project_id: str, status: str, video_path: str = None, error: str = None):
        """Update project status"""
        if project_id in self.projects:
            self.projects[project_id]["status"] = status
            if video_path:
                self.projects[project_id]["video_path"] = video_path
            if error:
                self.projects[project_id]["error"] = error
            self._save_projects()
    
    def delete_project(self, project_id: str) -> bool:
        """Delete a project and its files"""
        if project_id not in self.projects:
            return False
        
        # Delete project directory
        project_dir = self.base_dir / project_id
        if project_dir.exists():
            shutil.rmtree(project_dir)
        
        # Remove from projects list
        del self.projects[project_id]
        self._save_projects()
        
        return True
    
    def get_project_dir(self, project_id: str) -> Path:
        """Get project directory path"""
        return self.base_dir / project_id
    
    def get_asset_path(self, project_id: str, filename: str) -> str:
        """Get full path for an asset in a project"""
        return str(self.get_project_dir(project_id) / "assets" / filename)
