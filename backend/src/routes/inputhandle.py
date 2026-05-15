from fastapi import APIRouter, UploadFile, File, Form
from ..config import UPLOAD_DIR, INPUT_FILE_PATH, OUTPUT_DIR
from ..helper import writefile
import os, json
import numpy
import tkinter as tk
from tkinter import filedialog
from tkinter import *
from PIL import ImageTk, Image
import numpy as np
import torch
import torchvision.transforms as transforms
import cv2
import plotly.express as px
import matplotlib.pyplot as plt
import pandas as pd
import torchvision as tv
import gc, os, cv2, PIL, torch

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

classes = { 0:'Speed limit (20km/h)',
            1:'Speed limit (30km/h)', 
            2:'Speed limit (50km/h)', 
            3:'Speed limit (60km/h)', 
            4:'Speed limit (70km/h)', 
            5:'Speed limit (80km/h)', 
            6:'End of speed limit (80km/h)', 
            7:'Speed limit (100km/h)', 
            8:'Speed limit (120km/h)', 
            9:'No passing', 
            10:'No passing veh over 3.5 tons', 
            11:'Right-of-way at intersection', 
            12:'Priority road', 
            13:'Yield', 
            14:'Stop', 
            15:'No vehicles', 
            16:'Veh > 3.5 tons prohibited', 
            17:'No entry', 
            18:'General caution', 
            19:'Dangerous curve left', 
            20:'Dangerous curve right', 
            21:'Double curve', 
            22:'Bumpy road', 
            23:'Slippery road', 
            24:'Road narrows on the right', 
            25:'Road work', 
            26:'Traffic signals', 
            27:'Pedestrians', 
            28:'Children crossing', 
            29:'Bicycles crossing', 
            30:'Beware of ice/snow',
            31:'Wild animals crossing', 
            32:'End speed + passing limits', 
            33:'Turn right ahead', 
            34:'Turn left ahead', 
            35:'Ahead only', 
            36:'Go straight or right', 
            37:'Go straight or left', 
            38:'Keep right', 
            39:'Keep left', 
            40:'Roundabout mandatory', 
            41:'End of no passing', 
            42:'End no passing veh > 3.5 tons' }
labels_df = pd.DataFrame(list(classes.items()), columns=['ClassId', 'Name'])
# def classify(file_path):
#     try:
#         # 1. Đọc ảnh bằng PIL và chuyển sang RGB (đảm bảo luôn là 3 kênh)
#         pil_image = Image.open(file_path).convert('RGB')
        
#         # 2. Chuyển PIL Image thành Tensor (tương đương tv.transforms.ToTensor())
#         # Bước này chuyển ảnh về tensor có shape [3, H, W] và chuẩn hóa pixel về [0, 1]
#         img_tensor = transforms.ToTensor()(pil_image)
        
#         # 3. Chuyển sang NumPy, đổi trục về [H, W, 3] để resize bằng OpenCV
#         img_np = img_tensor.permute(1, 2, 0).numpy()
#         img_resized = cv2.resize(img_np, (32, 32))
        
#         # 4. Chuyển ngược lại PyTorch Tensor và đưa về dạng [3, 32, 32]
#         img_final = torch.from_numpy(img_resized).permute(2, 0, 1)
        
#         # 5. Thêm batch dimension [1, 3, 32, 32] và đẩy lên GPU/CPU
#         image_batch = img_final.unsqueeze(0).to(device)

#         # 6. Dự đoán nhãn bằng PyTorch model
#         with torch.no_grad():
#             outputs = model(image_batch)
#             pred = int(outputs.argmax(axis=1)[0])

#         # 7. Ánh xạ kết quả sang nhãn (1-indexed theo dictionary `classes` của bạn)
#         # Lưu ý: Nếu classId trong model của bạn bắt đầu từ 0, ta cộng 1 để khớp với `classes` (1-indexed)
#         class_index = pred + 1 
        
#         if class_index in classes:
#             sign = classes[class_index]
#         else:
#             sign = f"Predicted class index (raw): {pred}"
            
#         print(f"Recognized Traffic Sign: {sign}")
#         #label.configure(foreground='#011638', text=sign)
        
#     except Exception as e:
#         print(f"Classify Error: {e}")
#         #label.configure(foreground='red', text="Error classifying image")

def prediction(img_path):
    """
    Run prediction on a single image and return the result.
    Returns: dict with class_id, name, confidence
    """
    if type(img_path) == str:
        # PIL load the image as PIL object and ToTensor() convert this to a Tensor
        img = tv.transforms.ToTensor()(PIL.Image.open(img_path))
    else:
        img = img_path
    # resize image to 32X32 as model supports this
    img = cv2.resize(img.permute(1,2,0).numpy(),(32,32))
    img = torch.from_numpy(img).permute(2,0,1)
    # unsqueezed img as inside a tensor and move to device
    img_tensor = img.unsqueeze(0).to(device)
    # Predict the label
    with torch.no_grad():
        output = model(img_tensor.float())
    pred = int(output.argmax(axis=1)[0])
    # Find the traffic sign name for label from labels_df 
    # that initialize at the begining of the notebook
    filtered = labels_df[labels_df['ClassId'] == pred]
    if len(filtered) > 0:
        pred_str = filtered['Name'].values[0]
    else:
        pred_str = f"Unknown class {pred}"
    
    confidence = output.softmax(dim=1).max().item()
    
    # Print traffic sign that recognized
    print(f'\nRecognized Traffic Sign: {pred_str}')
    print(f"Max Confidence: {confidence:.4f}")
    
    return {
        "class_id": pred,
        "name": pred_str,
        "confidence": round(confidence * 100, 2)  # Convert to percentage
    }
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

  classify("C:/Users/TDA5HC/Desktop/Documents/01_CS_Master/07_MachineLearning/BTL/archive/input/traffic-signs-classification/myData/1/00000_00000.jpg")


  # Run prediction on all images in the folder
  prediction_results = []
  image_extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.gif')
  
  for filepath in filepaths:
      if filepath.lower().endswith(image_extensions):
          try:
              result = prediction(filepath)
              prediction_results.append({
                  "filepath": filepath,
                  "filename": os.path.basename(filepath),
                  "class_id": result["class_id"],
                  "name": result["name"],
                  "confidence": result["confidence"]
              })
          except Exception as e:
              print(f"Error predicting {filepath}: {e}")
              prediction_results.append({
                  "filepath": filepath,
                  "filename": os.path.basename(filepath),
                  "error": str(e)
              })
  
  # Save prediction results to JSON file
  # Use absolute path based on backend folder
  backend_dir = os.path.join(_script_dir, '..', '..')
  output_dir_abs = os.path.abspath(os.path.join(backend_dir, OUTPUT_DIR))
  os.makedirs(output_dir_abs, exist_ok=True)
  
  folder_name = os.path.basename(os.path.dirname(filepaths[0])) if filepaths else "unknown"
  output_json_path = os.path.join(output_dir_abs, f"predictions_{folder_name}.json").replace("\\", "/")
  
  with open(output_json_path, "w", encoding="utf-8") as f:
      json.dump({
          "folder": folder_name,
          "total_images": len(prediction_results),
          "predictions": prediction_results
      }, f, ensure_ascii=False, indent=2)
  
  print(f"Prediction results saved to: {output_json_path}")

  return {
      "filepaths": filepaths,
      "predictions": prediction_results,
      "output_json": output_json_path
  }
########################### api/video/upload_folder ############################