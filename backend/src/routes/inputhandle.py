from fastapi import APIRouter, UploadFile, File, Form
from ..config import UPLOAD_DIR, INPUT_FILE_PATH
from ..helper import writefile
import os

# create a router for input handling routes
inputSrcHandle_router = APIRouter()

# create a route for folder upload as POST (receives from frontend)
@inputSrcHandle_router.post("/upload_folder")
async def upload_folder(
    files: list[UploadFile] = File(...),
    paths: list[str] = Form(...)
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

  return {
      "filepaths": filepaths
  }