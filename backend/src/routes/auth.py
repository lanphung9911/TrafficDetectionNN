import json
import os
from typing import Optional
from fastapi import APIRouter, HTTPException
from ..schemas import LoginRequest
from ..security import hash_password, verify_password, is_hashed
from ..helper import writefile
from ..config import AUTH_FILE_PATH, FEEDBACK_DIR, OUTPUT_DIR
from pathlib import Path

authpath = Path(AUTH_FILE_PATH)
feedbackpath = Path(FEEDBACK_DIR)
outputpath = Path(OUTPUT_DIR)

# create a router for authentication routes
login_router = APIRouter()

def _load_auth_records() -> list:
    """Load all auth records from auth_login/data.json. Return [] if missing/corrupt."""
    if not authpath.exists():
        return []
    try:
        with authpath.open("r", encoding="utf-8") as f:
            content = f.read().strip()
            if not content:
                return []
            data = json.loads(content)
            if not isinstance(data, list):
                return []
            return data
    except (json.JSONDecodeError, OSError):
        return []


def _find_first_by_email(records: list, email: str) -> Optional[dict]:
    """Find the OLDEST record (first registration) for this email. None if not found."""
    for rec in records:
        if isinstance(rec, dict) and rec.get("email") == email:
            return rec
    return None


def _save_auth_records(records: list) -> None:
    """Overwrite auth_login/data.json with the given list."""
    authpath.parent.mkdir(parents=True, exist_ok=True)
    with authpath.open("w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=4)


def _upgrade_legacy_password(email: str, new_hash: str) -> None:
    """Rewrite the FIRST record for `email` to use the bcrypt hash.

    Used to transparently migrate plain-text passwords stored before
    hashing was introduced. No-op if file/record not found.
    """
    records = _load_auth_records()
    for rec in records:
        if isinstance(rec, dict) and rec.get("email") == email:
            rec["password"] = new_hash
            break
    else:
        return
    _save_auth_records(records)


# create a route for user login as POST (receives from frontend)
@login_router.post("/login")
def login(request: LoginRequest):

    if request.role != "Admin":
        set_permission = "read-only"
    else:
        set_permission = "full-access"

    # check if this email was previously registered.
    # If yes, password must match the first registration; do NOT create a new record.
    # If no, treat this login as the first-time registration and persist it.
    existing = _find_first_by_email(_load_auth_records(), request.email)
    is_new_account = existing is None

    if existing is not None:
        stored = existing.get("password", "")
        if not verify_password(request.password, stored):
            raise HTTPException(
                status_code=401,
                detail="Incorrect password for this email.",
            )
        # Transparent migration: legacy plain-text record verified successfully.
        # Re-hash and persist so subsequent logins use bcrypt.
        if not is_hashed(stored):
            try:
                _upgrade_legacy_password(request.email, hash_password(request.password))
            except Exception:
                # Migration is best-effort; do not fail the login if rewrite fails.
                pass

    # auto create user package in backend
    feedbackpath.mkdir(parents=True, exist_ok=True)
    outputpath.mkdir(parents=True, exist_ok=True)
    feedback_user_file = feedbackpath / (request.email.split("@")[0] + ".json")
    with open(feedback_user_file, "a", encoding="utf-8") as f:
        pass
    output_user_file = outputpath / (request.email.split("@")[0] + ".json")
    with open(output_user_file, "a", encoding="utf-8") as f:
        pass

    if is_new_account:
        new_record = {
            "email": request.email,
            "password": hash_password(request.password),
            "role": request.role,
            "permission": set_permission,
        }
        try:
            writefile.append_to_json(new_record, AUTH_FILE_PATH)
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to write auth file")

    # Never return password (hash or plain) to the client.
    return {
        "email": request.email,
        "role": request.role,
        "permission": set_permission,
    }

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
            records = json.loads(data)
        # Strip password from response so hashes never leak to the client.
        if isinstance(records, list):
            return [
                {k: v for k, v in r.items() if k != "password"}
                for r in records
                if isinstance(r, dict)
            ]
        return records
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