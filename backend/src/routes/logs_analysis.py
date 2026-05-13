import json
from fastapi import APIRouter, Body, HTTPException
import os
from ..config import ANALYSISLOGS_DIR
from ..helper import writefile
from datetime import datetime

# create a router for logs handling routes
logs_analysis_router = APIRouter()

# replace all non-alphanumeric characters in email with underscores for safe filename
@logs_analysis_router.post("/api/analysis-logs/{system_version}")
async def save_analysis_logs(system_version: str, payload: dict = Body(...)):
    recordlogs = payload.get("recordlogs")
    if recordlogs is None:
        raise HTTPException(status_code=400, detail="Missing 'recordlogs' in body")

    try:
        fname = os.path.join(ANALYSISLOGS_DIR, system_version + ".json")
        if not os.path.exists(ANALYSISLOGS_DIR):
            os.makedirs(ANALYSISLOGS_DIR)
        if not os.path.exists(fname):
            writefile.append_to_json([], fname)
        writefile.append_to_json(recordlogs, fname)
        return {"status": "ok", "saved_to": str(fname), "ts": datetime.now().isoformat()}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save analysis logs: {e}")

@logs_analysis_router.get("/api/analysis-logs/{system_version}")
async def get_analysis_logs(system_version: str):
    fname = os.path.join(ANALYSISLOGS_DIR, system_version + ".json")
    if not os.path.exists(fname):
        raise HTTPException(status_code=404, detail="Logs not found for this system version")
    try:
        with open(fname, "r", encoding="utf-8") as f:
            logs = json.load(f)
        return {"logs": logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read analysis logs: {e}")
