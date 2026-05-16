import os
import csv
import PIL
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, FastAPI
import asyncio
from matplotlib import image
import torch
import cv2
from pathlib import Path
from ..helper import cv_predict, writefile
from ..config import UPLOAD_DIR, OUTPUT_DIR, CNN_DIR, DATASET_LABELS_CSV, CONFIG_FILE_PATH_YAML, MODEL_FASTER_RCNN_DIR
import yaml
from PIL import Image
from torchvision import transforms
from torchvision.models.detection import fasterrcnn_resnet50_fpn
from torchvision.models.detection.faster_rcnn import AnchorGenerator, FastRCNNPredictor, FasterRCNN
from torchvision.models.detection.backbone_utils import resnet_fpn_backbone
from model.model_arch import RecognitionModel_V1, FasterRCNNDetection_V1

# create global variables for models

# define router to upload image data and send predictions to frontend
predict_img_router = APIRouter()

# define device and load model for prediction
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

'''
    Get model config from yaml file, and set default values if not exist in config
'''
def get_model_config():
    with open(CONFIG_FILE_PATH_YAML, "r") as f:
        config = yaml.safe_load(f)
    
    fasterRCNN_config = config.get("model", "").get("fasterRCNN", "")
    CNN_config = config.get("model", "").get("CNN", "")

    config["FasterRCNN"] = {
        "file": fasterRCNN_config.get("file", {}),
        "num_classes": fasterRCNN_config.get("num_classes", 2),
        "input_min_size": fasterRCNN_config.get("input_min_size", 640),
        "input_max_size": fasterRCNN_config.get("input_max_size", 1280),
        "score_detect_threshold": fasterRCNN_config.get("score_detect_threshold", 0.5),
        "iou_detect_threshold": fasterRCNN_config.get("iou_detect_threshold", 0.5)
    }

    config["CNN"] = {
        "file": CNN_config.get("file", {}),
        "input_size": CNN_config.get("input_size", 32),
        "score_classification_threshold": CNN_config.get("score_classification_threshold", 0.5)
    }

    return config

# load fasterrcnn model for object detection
cfgs = get_model_config()

# get model detect file name from config
model_detect_file = cfgs["FasterRCNN"]["file"]
model_classify_file = cfgs["CNN"]["file"]

'''
    Load FasterRCNN model for object detection
'''
if model_detect_file:
    model_detect_path = os.path.join(Path(MODEL_FASTER_RCNN_DIR), model_detect_file)

    rcnn_num_classes = cfgs["FasterRCNN"]["num_classes"]
    rcnn_min_size = cfgs["FasterRCNN"]["input_min_size"]
    rcnn_max_size = cfgs["FasterRCNN"]["input_max_size"]
    rcnn_score_detect_thrsh = cfgs["FasterRCNN"]["score_detect_threshold"]
    rcnn_iou_detect_thrsh = cfgs["FasterRCNN"]["iou_detect_threshold"]

    myFasterRCNNModel = FasterRCNNDetection_V1(
                            num_classes=2,
                            min_size=rcnn_min_size,
                            max_size=rcnn_max_size,
                            score_thresh=rcnn_score_detect_thrsh,
                            nms_thresh=rcnn_iou_detect_thrsh)

    if os.path.exists(model_detect_path):
        model_detect_chkpts = torch.load(model_detect_path, map_location=device, weights_only=False)
        myFasterRCNNModel.model.load_state_dict(model_detect_chkpts)
        myFasterRCNNModel.model.to(device)
        myFasterRCNNModel.model.eval()  # Set model to evaluation mode
    else:
        raise FileNotFoundError(f"Model file for object detection not found at {model_detect_path}")
else:
    raise ValueError("Model file name for object detection is not specified in the config.")

'''
    Load CNN model for object classification
'''
if model_classify_file:
    model_classify_path = os.path.join(Path(CNN_DIR), model_classify_file)

    myCNNmodel = RecognitionModel_V1(num_classes=43)

    if os.path.exists(model_classify_path):
        myCNNmodel = torch.load(model_classify_path, map_location=device)
        myCNNmodel.to(device)
        myCNNmodel.eval()  # Set model to evaluation mode
    else:
        raise FileNotFoundError(f"Model file for object classification not found at {model_classify_path}")
else:
    raise ValueError("Model file name for object classification is not specified in the config.")

# define class labels for traffic signs
with open(DATASET_LABELS_CSV, "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    next(reader)  # skip header
    labels_df = {int(row[0]): row[1] for row in reader}

'''
    Model CNN to classify traffic sign in the cropped ROI, return predicted class id, class name, and confidence score
'''
def roi_classification(roi):
    img = roi["roi"]

    # ensure valid
    if img is None or img.numel() == 0:
        return -1, "Empty ROI", 0.0
    
    img = img.permute(1, 2, 0).cpu().numpy()
    img = (img * 255).clip(0, 255).astype("uint8")

    img = cv2.resize(img, (32, 32))

    img = torch.from_numpy(img).permute(2, 0, 1).float() / 255.0
    img_tensor = img.unsqueeze(0).to(device)

    with torch.no_grad():
        output = myCNNmodel(img_tensor)

    pred = output.argmax(dim=1).item()
    confidence = output.softmax(dim=1).max(dim=1).values.item()

    # filtered = labels_df[labels_df["ClassId"] == pred]
    name = labels_df.get(pred, "Unknown")  # Get class name from labels_df, default to "Unknown" if not found
    return pred, name, confidence

'''
    Model FasterRCNN to detect objects in the image and crop ROIs based on predicted bounding boxes, return list of cropped ROIs with their corresponding bounding box coordinates and image path
'''
def object_detection(img_path):
    if str(img_path).lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif')):
        img_file_path = img_path

        pil_img = Image.open(img_file_path).convert("RGB")
        tensor_img = transforms.ToTensor()(pil_img).unsqueeze(0).to(device)

        with torch.no_grad():
            predictions = myFasterRCNNModel(tensor_img)
        print(f"Predictions for {img_file_path}: {predictions}")
        rois = cv_predict.crop_roi_object(
            img_path=img_file_path,
            img_tensor=tensor_img[0],
            preds=predictions[0],
            iou_thresh_filter=rcnn_iou_detect_thrsh,
            score_thresh=rcnn_score_detect_thrsh
        )
        
        return rois

'''
    Stage 2 - object classification to get class for each ROI
'''
def object_classification(img_path, rois):
    prediction_results = []
    print(f"Classifying ROIs for image: {img_path} with {len(rois)} ROIs")
    for idx, roi in enumerate(rois):
        try:
            cls_id, class_name, confidence = roi_classification(roi)

            prediction_results.append({
                "bbox": roi["bbox"],
                "org_img_path": img_path,
                "pred_img_path": None,
                "roi_id": idx,
                "class_id": cls_id,
                "name": class_name,
                "confidence": confidence,
                "error": None
            })

        except Exception as e:
            print(f"Error predicting ROI {idx}: {e}")
            print(f"ROI causing error: {roi}")

            prediction_results.append({
                "bbox": roi["bbox"],
                "org_img_path": img_path,
                "pred_img_path": None,
                "roi_id ": idx,
                "class_id": None,
                "name": None,
                "confidence": None,
                "error": str(e)
            })
    print(f"Completed classification for image: {img_path}. Total ROIs classified: {len(prediction_results)}")
    print(f"Prediction results: {prediction_results}")
    return prediction_results

'''
    Full stage of Traffic Sign Detection
    - Stage 1: object detection to get ROIs
    - Stage 2: object classification to get class for each ROI
    - Final: visualize and save evaluation image with predicted bounding boxes and class labels
'''
def prediction_img_folder(img_folder_path):
    prediction_all_of_folder = []
    evaluation_path = Path(img_folder_path) / "eva_images"

    # define image valid extensions
    valid_ext = (".png", ".jpg", ".jpeg", ".bmp")

    all_files = list(Path(img_folder_path).rglob("*"))

    for file_path in all_files:
        # skip folder
        if not file_path.is_file():
            continue

        # skip non-image
        if file_path.suffix.lower() not in valid_ext:
            continue

        # skip prediction folder
        if evaluation_path in file_path.parents:
            continue

        # get file name without extension for saving evaluation image later
        file_name = file_path.stem

        img = Image.open(file_path).convert("RGB")
        img_tensor = transforms.ToTensor()(img)

        # stage 1 - object detection to get ROIs
        img_rois = object_detection(file_path)

        # stage 2 - object classification to get class for each ROI
        img_rois_prediction = object_classification(file_path, img_rois)

        # visualize and save evaluation image with predicted bounding boxes and class labels
        # create evaluation folder if not exist
        os.makedirs(evaluation_path, exist_ok=True)

        img_rois_prediction = cv_predict.visualize_evaluate_on_img(
            image=img_tensor,
            predictions=img_rois_prediction,
            threshold=0.5,
            save_path=Path(evaluation_path) / f"{file_name}_eva.jpg"
        )

        prediction_all_of_folder += img_rois_prediction
    
    return prediction_all_of_folder