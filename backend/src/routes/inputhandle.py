from fastapi import APIRouter, UploadFile, File, Request, Form
from ..config import UPLOAD_DIR, INPUT_FILE_PATH, OUTPUT_DIR
from ..helper import writefile
import os, json
from tkinter import *
import torch
import os, cv2, torch
from ..helper.cv_predict import visualize_evaluate_on_img, filter_overlapping_boxes
from ..helper.writefile import overwrite_to_csv, init_csv_file
from pathlib import Path
from .predict_data_img import prediction_img_folder

# create a router for input handling routes
inputSrcHandle_router = APIRouter()

# create a route for folder upload as POST (receives from frontend)
@inputSrcHandle_router.post("/upload_folder")
async def upload_folder(
    files: list[UploadFile] = File(...),
    paths: list[str] = Form(...),
    root_path: str = Form(...)
):
  os.makedirs(UPLOAD_DIR, exist_ok=True)

  filepaths = []

  for file, path in zip(files, paths):

      full_path = os.path.join(UPLOAD_DIR, path).replace("\\", "/")
      os.makedirs(os.path.dirname(full_path), exist_ok=True)

      with open(full_path, "wb") as f:
          f.write(await file.read())

      url = f"/upload/{path}".replace("\\", "/")

      filepaths.append(full_path)

  writefile.append_to_json({"folder_filepath": filepaths}, INPUT_FILE_PATH)

  # Run prediction on all images in the folder
  prediction_img_folder_results = prediction_img_folder(Path(filepaths[0]).parent)  # Assuming all files are in the same folder, get the parent directory
  user_img_predict_log = os.path.join(os.path.join(UPLOAD_DIR, root_path), "predictions_log.csv")
  
  if prediction_img_folder_results is not None and len(prediction_img_folder_results) > 0:
    header_csv = prediction_img_folder_results[0].keys() if prediction_img_folder_results else []

    # Save prediction results to JSON file
    init_csv_file(user_img_predict_log, headers=header_csv)
    overwrite_to_csv(prediction_img_folder_results, user_img_predict_log, header_csv)
  else:
    init_csv_file(user_img_predict_log, headers=["No prediction found"])

  return {
      "filepaths": filepaths,
      "predictions": prediction_img_folder_results,
      "predictions_log": user_img_predict_log
  }

# create a route to predict single image (for next/previous image buttons)
@inputSrcHandle_router.post("/predict_image")
async def predict_image(request: Request):
    data = await request.json()
    image_path = data.get("image_path")
    
    if not image_path:
        return {"error": "No image path provided"}
    
    try:
        result = prediction(image_path)
        return {
            "status": "success",
            "filepath": image_path,
            "class_id": result["class_id"],
            "name": result["name"],
            "confidence": result["confidence"]
        }
    except Exception as e:
        return {"error": str(e)}

# create a route to cleanup upload folder and prediction json files
import shutil
import glob

@inputSrcHandle_router.post("/cleanup")
async def cleanup_uploads():
    """
    Delete all files in upload folder and prediction_*.json files
    Called when user clicks Reset or refreshes the page
    """
    deleted_files = []
    errors = []
    
    # Delete contents of upload folder
    if os.path.exists(UPLOAD_DIR):
        for item in os.listdir(UPLOAD_DIR):
            item_path = os.path.join(UPLOAD_DIR, item)
            try:
                if os.path.isfile(item_path):
                    os.remove(item_path)
                    deleted_files.append(item_path)
                elif os.path.isdir(item_path):
                    shutil.rmtree(item_path)
                    deleted_files.append(item_path)
            except Exception as e:
                errors.append(f"Error deleting {item_path}: {str(e)}")
    
    return {
        "status": "success",
        "deleted_count": len(deleted_files),
        "deleted_files": deleted_files,
        "errors": errors
    }