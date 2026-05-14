import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

hyperparameters_router = APIRouter()

# Path to hyperparameters JSON file
HYPERPARAMETERS_FILE = os.path.join(os.path.dirname(__file__), "..", "CNN", "hyperparameters.json")

class Hyperparameters(BaseModel):
    learning_rate: float
    batch_size: int
    epochs: int
    optimizer: str
    loss_function: str
    input_shape: str

class Augmentation(BaseModel):
    rotation: str
    width_shift: str
    height_shift: str
    zoom_range: str
    horizontal_flip: bool
    preprocessing: str

class Statistics(BaseModel):
    total_parameters: str
    trainable_params: str
    model_size: str
    conv_layers: int
    dense_layers: int
    training_time: str

class HyperparametersConfig(BaseModel):
    hyperparameters: Hyperparameters
    augmentation: Optional[Augmentation] = None
    statistics: Optional[Statistics] = None


def load_hyperparameters():
    """Load hyperparameters from JSON file"""
    try:
        if os.path.exists(HYPERPARAMETERS_FILE):
            with open(HYPERPARAMETERS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            # Return default values if file doesn't exist
            return {
                "hyperparameters": {
                    "learning_rate": 0.001,
                    "batch_size": 32,
                    "epochs": 50,
                    "optimizer": "Adam",
                    "loss_function": "Categorical CE",
                    "input_shape": "32×32×3"
                },
                "augmentation": {
                    "rotation": "+15°",
                    "width_shift": "10%",
                    "height_shift": "10%",
                    "zoom_range": "20%",
                    "horizontal_flip": False,
                    "preprocessing": "Normalize /255"
                },
                "statistics": {
                    "total_parameters": "2.3M",
                    "trainable_params": "2.3M",
                    "model_size": "8.9 MB",
                    "conv_layers": 4,
                    "dense_layers": 2,
                    "training_time": "~22 phút"
                }
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading hyperparameters: {str(e)}")


def save_hyperparameters(data: dict):
    """Save hyperparameters to JSON file"""
    try:
        os.makedirs(os.path.dirname(HYPERPARAMETERS_FILE), exist_ok=True)
        with open(HYPERPARAMETERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving hyperparameters: {str(e)}")


@hyperparameters_router.get("/api/hyperparameters")
async def get_hyperparameters():
    """Get current hyperparameters configuration"""
    data = load_hyperparameters()
    return {"success": True, "data": data}


@hyperparameters_router.put("/api/hyperparameters")
async def update_hyperparameters(config: HyperparametersConfig):
    """Update hyperparameters configuration"""
    # Load existing data to preserve other fields
    existing_data = load_hyperparameters()
    
    # Update hyperparameters
    existing_data["hyperparameters"] = config.hyperparameters.model_dump()
    
    # Update augmentation if provided
    if config.augmentation:
        existing_data["augmentation"] = config.augmentation.model_dump()
    
    # Update statistics if provided
    if config.statistics:
        existing_data["statistics"] = config.statistics.model_dump()
    
    save_hyperparameters(existing_data)
    
    return {"success": True, "message": "Hyperparameters saved successfully", "data": existing_data}


@hyperparameters_router.patch("/api/hyperparameters")
async def patch_hyperparameters(updates: dict):
    """Partially update hyperparameters configuration"""
    existing_data = load_hyperparameters()
    
    # Update only the provided fields
    if "hyperparameters" in updates:
        for key, value in updates["hyperparameters"].items():
            if key in existing_data["hyperparameters"]:
                existing_data["hyperparameters"][key] = value
    
    if "augmentation" in updates:
        for key, value in updates["augmentation"].items():
            if key in existing_data["augmentation"]:
                existing_data["augmentation"][key] = value
    
    if "statistics" in updates:
        for key, value in updates["statistics"].items():
            if key in existing_data["statistics"]:
                existing_data["statistics"][key] = value
    
    save_hyperparameters(existing_data)
    
    return {"success": True, "message": "Hyperparameters updated successfully", "data": existing_data}
