import json
import os
from fastapi import APIRouter, HTTPException
from ..schemas import LoginRequest
from ..helper import writefile
from ..config import AUTH_FILE_PATH, FEEDBACK_DIR, OUTPUT_DIR
from pathlib import Path

authpath = Path(AUTH_FILE_PATH)
feedbackpath = Path(FEEDBACK_DIR)
outputpath = Path(OUTPUT_DIR)

# create a router for authentication routes
login_router = APIRouter()

# create a route for user login as POST (receives from frontend)
@login_router.post("/login")
def login(request: LoginRequest):

    if request.role != "Admin":
        set_permission = "read-only"
    else:
        set_permission = "full-access"

    result = {
        "email": request.email,
        "password": request.password,
        "role": request.role,
        "permission": set_permission}
    
    # auto create user package in backend
    feedback_user_file = feedbackpath / (request.email.split("@")[0] + ".json")
    with open(feedback_user_file, "a", encoding="utf-8") as f:
        pass
    output_user_file = outputpath / (request.email.split("@")[0] + ".json")
    with open(output_user_file, "a", encoding="utf-8") as f:
        pass

    try:
        writefile.append_to_json(result, AUTH_FILE_PATH)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to write auth file")
    
    return result

# create a route for fetch user info to admin as GET
@login_router.get("/userinfo")
def get_user_info():
    if not authpath.exists():
        return False
    try:
        with authpath.open("r", encoding="utf-8") as f:
            data = f.read()
            if not data:
                return {"email": "", "password": "", "role": "", "permision": ""}
            return json.loads(data)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read auth file")

def delete_user_from_auth_file(email: str) -> bool:
    if not authpath.exists():
        return False
    try:
        with authpath.open("r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                if not isinstance(data, list):
                    data = []
            except json.JSONDecodeError:
                data = []
        new_data = [u for u in data if u.get("email").split("@")[0] != email]
        if len(new_data) == len(data):
            return False
        with authpath.open("w", encoding="utf-8") as f:
            json.dump(new_data, f, ensure_ascii=False, indent=2)
        return True
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to modify auth file")

@login_router.delete("/userinfo/{email}")
def delete_user(email: str):
    ok = delete_user_from_auth_file(email.split("@")[0])
    if not ok:
        raise HTTPException(status_code=404, detail="User not found")
    else:
        feedback_user_file = feedbackpath / (email.split("@")[0] + ".json")
        if feedback_user_file.exists():
            os.remove(feedback_user_file)
        output_user_file = outputpath / (email.split("@")[0] + ".json")
        if output_user_file.exists():
            os.remove(output_user_file)

    return {"detail": "deleted"}