from fastapi import APIRouter, UploadFile, File, Request, Form
from ..config import UPLOAD_DIR, INPUT_FILE_PATH
from .write2json import write_to_json
import os
import numpy
import tkinter as tk
from tkinter import filedialog
from tkinter import *
from PIL import ImageTk, Image
import keras
from keras.models import load_model

# create a router for input handling routes
inputSrcHandle_router = APIRouter()
def DenseCompat(*args, **kwargs):
    kwargs.pop('quantization_config', None)
    return keras.layers.Dense(*args, **kwargs)

# `compile=False` is best for inference-only GUI usage.
model = load_model('C:/Users/TDA5HC/Desktop/Documents/01_CS_Master/07_MachineLearning/BTL/git/TrafficDetectionNN/backend/model/CNN_V1/best_parkinson_model.h5', custom_objects={'Dense': DenseCompat}, compile=False)
classes = { 1:'Speed limit (20km/h)',
            2:'Speed limit (30km/h)', 
            3:'Speed limit (50km/h)', 
            4:'Speed limit (60km/h)', 
            5:'Speed limit (70km/h)', 
            6:'Speed limit (80km/h)', 
            7:'End of speed limit (80km/h)', 
            8:'Speed limit (100km/h)', 
            9:'Speed limit (120km/h)', 
            10:'No passing', 
            11:'No passing veh over 3.5 tons', 
            12:'Right-of-way at intersection', 
            13:'Priority road', 
            14:'Yield', 
            15:'Stop', 
            16:'No vehicles', 
            17:'Veh > 3.5 tons prohibited', 
            18:'No entry', 
            19:'General caution', 
            20:'Dangerous curve left', 
            21:'Dangerous curve right', 
            22:'Double curve', 
            23:'Bumpy road', 
            24:'Slippery road', 
            25:'Road narrows on the right', 
            26:'Road work', 
            27:'Traffic signals', 
            28:'Pedestrians', 
            29:'Children crossing', 
            30:'Bicycles crossing', 
            31:'Beware of ice/snow',
            32:'Wild animals crossing', 
            33:'End speed + passing limits', 
            34:'Turn right ahead', 
            35:'Turn left ahead', 
            36:'Ahead only', 
            37:'Go straight or right', 
            38:'Go straight or left', 
            39:'Keep right', 
            40:'Keep left', 
            41:'Roundabout mandatory', 
            42:'End of no passing', 
            43:'End no passing veh > 3.5 tons' }
def classify(file_path):
    global label_packed
    input_shape = model.input_shape
    if isinstance(input_shape, list):
        input_shape = input_shape[0]

    target_h, target_w, target_c = 30, 30, 3
    channels_last = True
    if isinstance(input_shape, tuple) and len(input_shape) == 4:
        if input_shape[-1] in (1, 3):
            target_h, target_w, target_c = input_shape[1], input_shape[2], input_shape[3]
            channels_last = True
        elif input_shape[1] in (1, 3):
            target_c, target_h, target_w = input_shape[1], input_shape[2], input_shape[3]
            channels_last = False

    if target_h is None or target_w is None:
        target_h, target_w = 30, 30
    if target_c is None:
        target_c = 3

    pil_image = Image.open(file_path)
    pil_image = pil_image.convert('L' if int(target_c) == 1 else 'RGB')
    pil_image = pil_image.resize((int(target_w), int(target_h)))

    image = numpy.asarray(pil_image, dtype=numpy.float32)
    if int(target_c) == 1 and image.ndim == 2:
        image = numpy.expand_dims(image, axis=-1)
    if image.max() > 1.0:
        image = image / 255.0
    if not channels_last:
        image = numpy.transpose(image, (2, 0, 1))

    image_batch = numpy.expand_dims(image, axis=0)
    probs = model.predict(image_batch, verbose=0)
    if probs.ndim == 2:
        pred = int(numpy.argmax(probs, axis=-1)[0])
    else:
        pred = int((probs.reshape(-1)[0]) >= 0.5)

    if probs.ndim == 2 and probs.shape[-1] == len(classes):
        sign = classes[pred + 1]
    else:
        sign = f"Predicted class index: {pred}"
    print("Predictation",pred)
    print(sign)
############################### api/video/upload ###############################
# create a route for video upload as POST (receives from frontend)
@inputSrcHandle_router.post("/upload_video")
async def upload_video(request: Request, file: UploadFile = File(...)):

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
@inputSrcHandle_router.post("/set_option")
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

  write_to_json({"folder_filepath": filepaths}, INPUT_FILE_PATH)


  classify("./upload/0/"+"/00000_00000.jpg")


  return {
      "filepaths": filepaths
  }
########################### api/video/upload_folder ############################