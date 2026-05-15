from fastapi import APIRouter, UploadFile, File, Request, Form
from ..config import UPLOAD_DIR, INPUT_FILE_PATH
from ..helper import writefile
import os
import numpy
import tkinter as tk
from tkinter import filedialog
from tkinter import *
from PIL import ImageTk, Image
import numpy as np
import torch
import torchvision.transforms as transforms
import cv2

# create a router for input handling routes
inputSrcHandle_router = APIRouter()
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# `compile=False` is best for inference-only GUI usage.
# try:
# Use absolute path based on script location
_script_dir = os.path.dirname(os.path.abspath(__file__))
_model_path = os.path.join(_script_dir, '..', '..', 'model', 'CNN_V2', 'traffic_sign_recognition.pt')
model = torch.load(_model_path, map_location=device, weights_only=False)
model.eval()
# except Exception as e:
#     print(f"Lỗi load model: {e}")
#     print("Mẹo: Đảm bảo class của model đã được định nghĩa hoặc import trước khi torch.load nếu bạn lưu bằng state_dict.")

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
    try:
        # 1. Đọc ảnh bằng PIL và chuyển sang RGB (đảm bảo luôn là 3 kênh)
        pil_image = Image.open(file_path).convert('RGB')
        
        # 2. Chuyển PIL Image thành Tensor (tương đương tv.transforms.ToTensor())
        # Bước này chuyển ảnh về tensor có shape [3, H, W] và chuẩn hóa pixel về [0, 1]
        img_tensor = transforms.ToTensor()(pil_image)
        
        # 3. Chuyển sang NumPy, đổi trục về [H, W, 3] để resize bằng OpenCV
        img_np = img_tensor.permute(1, 2, 0).numpy()
        img_resized = cv2.resize(img_np, (32, 32))
        
        # 4. Chuyển ngược lại PyTorch Tensor và đưa về dạng [3, 32, 32]
        img_final = torch.from_numpy(img_resized).permute(2, 0, 1)
        
        # 5. Thêm batch dimension [1, 3, 32, 32] và đẩy lên GPU/CPU
        image_batch = img_final.unsqueeze(0).to(device)

        # 6. Dự đoán nhãn bằng PyTorch model
        with torch.no_grad():
            outputs = model(image_batch)
            pred = int(outputs.argmax(axis=1)[0])

        # 7. Ánh xạ kết quả sang nhãn (1-indexed theo dictionary `classes` của bạn)
        # Lưu ý: Nếu classId trong model của bạn bắt đầu từ 0, ta cộng 1 để khớp với `classes` (1-indexed)
        class_index = pred + 1 
        
        if class_index in classes:
            sign = classes[class_index]
        else:
            sign = f"Predicted class index (raw): {pred}"
            
        print(f"Recognized Traffic Sign: {sign}")
        #label.configure(foreground='#011638', text=sign)
        
    except Exception as e:
        print(f"Lỗi khi classify: {e}")
        #label.configure(foreground='red', text="Error classifying image")
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

    writefile.append_to_json({"video_filepath": file_path}, INPUT_FILE_PATH)

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

    writefile.append_to_json(data_ret, INPUT_FILE_PATH)

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

  writefile.append_to_json({"folder_filepath": filepaths}, INPUT_FILE_PATH)

  classify("C:/Users/TDA5HC/Desktop/Documents/01_CS_Master/07_MachineLearning/BTL/archive/input/traffic-signs-classification/myData/1/00000_00000.jpg")


  return {
      "filepaths": filepaths
  }
########################### api/video/upload_folder ############################