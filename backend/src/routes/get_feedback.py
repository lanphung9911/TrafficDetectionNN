from datetime import datetime
import json
import os
from fastapi import APIRouter, Form, HTTPException, UploadFile, File
from ..helper import writefile
from ..config import FEEDBACK_DIR, ATTACHMENT_FEEDBACK_FILE_PATH_JSON, FEEDBACK_ATTACHMENT_DIR

get_user_feedback_router = APIRouter()

@get_user_feedback_router.post("/api/user/feedback")
def submit_feedback(
    email_name: str = Form(...),
    rating: int = Form(...),
    evaluateOption: str = Form(...),
    feedbackText: str = Form(...),
    attachFile: UploadFile = File(None)
):
    os.makedirs(FEEDBACK_DIR, exist_ok=True)
    file_path = os.path.join(FEEDBACK_DIR, f"{email_name}.json")

    now = datetime.now()
    record = {
        "email_name": email_name,
        "rating": rating,
        "evaluateOption": evaluateOption,
        "attachFile": attachFile.filename if attachFile else None,
        "feedbackText": feedbackText,
        "status": "Pending",
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M:%S"),
        "timestamp": now.isoformat(),
        "reply": None
    }

    # temporary solution: write each feedback to a separate file named by email_name, in the feedback folder
    writefile.append_to_json(record, file_path)
    writefile.append_to_json(record, ATTACHMENT_FEEDBACK_FILE_PATH_JSON)

    # save attach file to folder
    if attachFile:
        try:
            os.makedirs(FEEDBACK_ATTACHMENT_DIR, exist_ok=True)
            file_name_prefix = os.path.split(attachFile.filename)[-1].split(".")[0]
            file_extension = os.path.split(attachFile.filename)[-1].split(".")[-1]
            attach_path = os.path.join(FEEDBACK_ATTACHMENT_DIR, f"{file_name_prefix}.{file_extension}".replace("\\", "/"))
            with open(attach_path, "wb") as f:
                f.write(attachFile.file.read())
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save attachment: {str(e)}")

    return {"status": "ok", "saved_to": file_path}

@get_user_feedback_router.get("/api/user/feedback/{email_name}")
def get_user_feedback(email_name: str):
    file_path = os.path.join(FEEDBACK_DIR, f"{email_name}.json")
    if not os.path.exists(file_path):
        return []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            items = json.load(f) if os.path.getsize(file_path) > 0 else []
    except (json.JSONDecodeError, OSError):
        # skip invalid/empty files
        return []
    return items

@get_user_feedback_router.get("/api/admin/feedback")
def get_all_feedback():
    if not os.path.exists(FEEDBACK_DIR):
        return []
    all_items = []
    for fname in os.listdir(FEEDBACK_DIR):
        if not fname.endswith(".json"):
            continue
        path = os.path.join(FEEDBACK_DIR, fname)
        try:
            with open(path, "r", encoding="utf-8") as f:
                items = json.load(f) if os.path.getsize(path) > 0 else []
                if isinstance(items, list):
                    all_items.extend(items) if items else None
                else:
                    all_items.append(items) if items else None
        except (json.JSONDecodeError, OSError):
            # skip invalid/empty files
            continue
    return all_items

@get_user_feedback_router.post("/api/admin/reply")
def admin_reply(payload: dict):
    admin_email = payload.get("admin_email")
    user_email = payload.get("user_email")
    reply = payload.get("replyText")
    timestamp = payload.get("timestamp")
    status = payload.get("status")

    if not user_email or not reply:
        raise HTTPException(status_code=400, detail="Missing fields")

    user_file = os.path.join(FEEDBACK_DIR, f"{user_email}.json")
    if not os.path.exists(user_file):
        raise HTTPException(status_code=404, detail="User feedback file not found")

    try:
        with open(user_file, "r", encoding="utf-8") as f:
            records = json.load(f)
    except (json.JSONDecodeError, OSError):
        raise HTTPException(status_code=500, detail="Failed to read user feedback file")

    # locate the matching feedback record
    matched = None
    for rec in records:
        if timestamp and rec.get("timestamp") == timestamp:
            rec["reply"] = reply
            rec["admin_email"] = admin_email
            rec["reply_timestamp"] = datetime.now().isoformat()
            rec["status"] = status
            matched = rec
            break

    if matched is None:
        raise HTTPException(status_code=404, detail="Feedback record not found")

    # write back the full list to the same user file
    try:
        writefile.overwrite_to_json(records, user_file)
    except OSError:
        raise HTTPException(status_code=500, detail="Failed to write reply to file")

    return {"status": "ok", "saved_to": user_file}