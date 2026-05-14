import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

dataset_config_router = APIRouter()

# Path to dataset configuration JSON file
DATASET_CONFIG_FILE = os.path.join(os.path.dirname(__file__), "..", "CNN", "dataset_config.json")

# Default dataset path (relative to notebook location in CNN folder)
DEFAULT_DATASET_PATH = "../../dataset/Data"


class DatasetConfig(BaseModel):
    data_dir: str
    is_default: bool = False
    folder_name: str = ""


def load_dataset_config():
    """Load dataset configuration from JSON file"""
    try:
        if os.path.exists(DATASET_CONFIG_FILE):
            with open(DATASET_CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            # Return default values if file doesn't exist
            return {
                "data_dir": DEFAULT_DATASET_PATH,
                "is_default": True,
                "folder_name": "Data"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading dataset config: {str(e)}")


def save_dataset_config(data: dict):
    """Save dataset configuration to JSON file"""
    try:
        os.makedirs(os.path.dirname(DATASET_CONFIG_FILE), exist_ok=True)
        with open(DATASET_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving dataset config: {str(e)}")


@dataset_config_router.get("/api/dataset-config")
async def get_dataset_config():
    """Get current dataset configuration"""
    data = load_dataset_config()
    # Calculate and include absolute path
    cnn_folder = os.path.dirname(DATASET_CONFIG_FILE)
    absolute_path = os.path.normpath(os.path.join(cnn_folder, data.get("data_dir", DEFAULT_DATASET_PATH)))
    data["absolute_path"] = absolute_path
    return {"success": True, "data": data}


@dataset_config_router.put("/api/dataset-config")
async def update_dataset_config(config: DatasetConfig):
    """Update dataset configuration"""
    try:
        folder_name = config.folder_name if config.folder_name else config.data_dir.split('/')[-1]
        data = {
            "data_dir": config.data_dir,
            "is_default": config.is_default,
            "folder_name": folder_name
        }
        save_dataset_config(data)
        # Calculate absolute path for response
        cnn_folder = os.path.dirname(DATASET_CONFIG_FILE)
        absolute_path = os.path.normpath(os.path.join(cnn_folder, config.data_dir))
        data["absolute_path"] = absolute_path
        return {"success": True, "message": "Dataset configuration updated successfully", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating dataset config: {str(e)}")


@dataset_config_router.post("/api/dataset-config/reset")
async def reset_dataset_config():
    """Reset dataset configuration to default"""
    try:
        data = {
            "data_dir": DEFAULT_DATASET_PATH,
            "is_default": True,
            "folder_name": "Data"
        }
        save_dataset_config(data)
        # Calculate absolute path for response
        cnn_folder = os.path.dirname(DATASET_CONFIG_FILE)
        absolute_path = os.path.normpath(os.path.join(cnn_folder, DEFAULT_DATASET_PATH))
        data["absolute_path"] = absolute_path
        return {"success": True, "message": "Dataset configuration reset to default", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting dataset config: {str(e)}")


@dataset_config_router.post("/api/dataset-config/validate")
async def validate_dataset_path(config: DatasetConfig):
    """Validate if the dataset path exists and has valid structure"""
    try:
        # Construct absolute path from CNN folder
        cnn_folder = os.path.dirname(DATASET_CONFIG_FILE)
        absolute_path = os.path.normpath(os.path.join(cnn_folder, config.data_dir))
        
        if not os.path.exists(absolute_path):
            return {
                "success": False, 
                "valid": False, 
                "message": f"Path does not exist: {absolute_path}"
            }
        
        if not os.path.isdir(absolute_path):
            return {
                "success": False, 
                "valid": False, 
                "message": "Path is not a directory"
            }
        
        # Check if directory has subdirectories (expected structure for GTSRB)
        subdirs = [d for d in os.listdir(absolute_path) if os.path.isdir(os.path.join(absolute_path, d))]
        
        return {
            "success": True,
            "valid": True,
            "message": f"Valid dataset directory with {len(subdirs)} class folders",
            "num_classes": len(subdirs),
            "absolute_path": absolute_path
        }
    except Exception as e:
        return {"success": False, "valid": False, "message": str(e)}
