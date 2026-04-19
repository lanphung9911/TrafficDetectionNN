from fastapi import APIRouter, UploadFile, File, Request, Form
from ..config import OUTPUT_DIR, UPLOAD_DIR, INPUT_FILE_PATH
from .write2json import write_to_json
import os

# create a router for video handling routes
vdHandle_router = APIRouter()

############################### api/video/upload ###############################
# create a route for video upload as POST (receives from frontend)
@vdHandle_router.post("/upload_video")

# define function to handle video upload requests
async def upload_video(request: Request, file: UploadFile = File(...)):
    # create output file to store log
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # create upload folder to store uploaded video files from frontend
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # create empty file in upload folder with the same name as the uploaded file
    filename = file.filename
    file_path = os.path.join(UPLOAD_DIR, filename).replace("\\", "/")

    # save the uploaded file to the upload folder
    with open(file_path, "wb") as f:
        f.write(await file.read())

    write_to_json({"video_filepath": file_path}, INPUT_FILE_PATH)

    return {
        "videoUrl": str(request.url_for("upload", path=filename))
    }
############################### api/video/upload ###############################


############################# api/video/set_option #############################
# create a route for video upload as POST (receives from frontend)
@vdHandle_router.post("/set_option")

# define function to handle video upload requests
async def set_option_video(requestOption: Request):
    data = await requestOption.json()

    data_ret = {
        "FPS": data["value"]["FPS"],
        "Speed": data["value"]["Speed"]
    }

    write_to_json(data_ret, INPUT_FILE_PATH)

    return data_ret
############################# api/video/set_option #############################

########################### api/video/upload_folder ############################
# create a route for video upload as POST (receives from frontend)
@vdHandle_router.post("/upload_folder")

# define function to handle video upload requests
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

  write_to_json({"folder_filepath": filepaths}, INPUT_FILE_PATH)

  return {
      "filepaths": filepaths
  }
########################### api/video/upload_folder ############################