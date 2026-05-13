from fastapi import APIRouter, Body, HTTPException
import re, os
from ..config import OUTPUT_DIR
from ..helper import writefile
from datetime import datetime

# create a router for logs handling routes
logs_system_router = APIRouter()

# replace all non-alphanumeric characters in email with underscores for safe filename
def safe_filename(email: str) -> str:
    name = email.split("@")[0] if "@" in email else email
    name = re.sub(r'[^A-Za-z0-9._-]', '_', name)
    return f"{name}.json"

@logs_system_router.post("/api/logs/{email_name}")
async def save_error_logs(email_name: str, payload: dict = Body(...)):
    recordlogs = payload.get("recordlogs")
    if recordlogs is None:
        raise HTTPException(status_code=400, detail="Missing 'recordlogs' in body")

    try:
        fname = os.path.join(OUTPUT_DIR, safe_filename(email_name))
        if not os.path.exists(OUTPUT_DIR):
            os.makedirs(OUTPUT_DIR)
        if not os.path.exists(fname):
            writefile.append_to_json([], fname)
        writefile.append_to_json(recordlogs, fname)

        return {"status": "ok", "saved_to": str(fname), "ts": datetime.now().isoformat()}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Failed to save logs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save logs: {e}")

@logs_system_router.get("/api/logs/{email_name}")
async def get_error_logs(email_name: str):
    fname = os.path.join(OUTPUT_DIR, safe_filename(email_name))
    if not os.path.exists(fname):
        raise HTTPException(status_code=404, detail="Logs not found for this user")
    try:
        with open(fname, "r", encoding="utf-8") as f:
            logs = f.read()
        return {"email_name": email_name, "logs": logs}
    except Exception as e:
        print(f"Failed to read logs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to read logs: {e}")