import os
import cv2
import torch
from matplotlib import pyplot as plt
from torchvision.ops import box_iou
import os
import matplotlib.pyplot as plt

'''
    Helper functions for computer vision visualization on image then save to backend folder
'''
def visualize_evaluate_on_img(
    image,
    predictions,
    threshold=0.1,
    save_path=None,
):
    img = image.permute(1, 2, 0).cpu().numpy()
    img = (img * 255).astype("uint8").copy()
    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    
    for pred in predictions:
        if pred["confidence"] is None:
            continue

        score = pred["confidence"]   # FIX

        if score < threshold:
            continue

        x1, y1, x2, y2 = map(int, pred["bbox"])  # FIX

        label = f'{pred["name"]} ({score:.2f})'

        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(img, label, (x1, y1 - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        pred["pred_img_path"] = save_path

    if save_path:
        cv2.imwrite(str(save_path), img)
    
    return predictions
        

'''
    Helper functions for cropping ROI from image based on predicted bounding boxes, then return list of cropped ROIs with their corresponding bounding box coordinates and image path
'''
def filter_overlapping_boxes(boxes, scores, iou_thresh=0.7):
    '''
    Filter overlapping boxes based on IoU threshold.
    - boxes: tensor of shape [num_boxes, 4] with bounding box coordinates (x1, y1, x2, y2)
    - scores: tensor of shape [num_boxes] with confidence scores
    - iou_thresh: float, IoU threshold for filtering
    Returns:
    - filtered_boxes: tensor of shape [num_filtered_boxes, 4] with filtered bounding box coordinates
    - filtered_scores: tensor of shape [num_filtered_boxes] with filtered confidence scores
    '''

    # if no boxes, return empty tensors
    if len(boxes) == 0:
        return boxes, scores

    # move boxes and scores to CPU for processing
    boxes = boxes.cpu()
    scores = scores.cpu()

    # sort boxes by scores in descending order
    order = torch.argsort(scores, descending=True)

    keep = []

    while len(order) > 0:
        i = order[0]
        keep.append(i.item())

        if len(order) == 1:
            break

        ious = box_iou(
            boxes[i].unsqueeze(0),
            boxes[order[1:]]
        ).squeeze(0)

        rest = order[1:][ious < iou_thresh]

        order = rest

    return boxes[keep], scores[keep]

'''
    Helper functions for cropping ROI from image based on predicted bounding boxes, then return list of cropped ROIs with their corresponding bounding box coordinates and image path
'''
def crop_roi_object(
    img_path,
    img_tensor,
    preds,
    iou_thresh_filter=0.7,
    score_thresh=0.7
):

    # from prediction, get bboxes, scores, and labels
    boxes = preds["boxes"].detach().cpu()
    scores = preds["scores"].detach().cpu()

    # filter overlapping boxes based on IoU threshold
    boxes, scores = filter_overlapping_boxes(
        boxes,
        scores,
        iou_thresh=iou_thresh_filter
    )

    rois = []

    H, W = img_tensor.shape[1:]

    for j, (box, score) in enumerate(zip(boxes, scores)):
        
        # do nothing if score is less than threshold, skip this detection
        if score < score_thresh:
            continue

        # get bbox coordinates
        x1, y1, x2, y2 = map(int, box.tolist())

        # ensure bbox coordinates are within image boundaries
        x1 = max(0, min(x1, W - 1))
        y1 = max(0, min(y1, H - 1))
        x2 = max(0, min(x2, W - 1))
        y2 = max(0, min(y2, H - 1))

        # crop ROI
        roi = img_tensor[:, y1:y2, x1:x2]
        rois.append({
            "img_path": img_path,
            "roi": roi,
            "bbox": [x1, y1, x2, y2]
        })

    return rois