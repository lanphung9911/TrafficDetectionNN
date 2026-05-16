import os
from dotenv import load_dotenv
load_dotenv(".ven")

# host and port for the backend server
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

SYSTEM_VERSION = os.getenv("SYSTEM_VERSION", "0_0")
JWT_SECRET = os.getenv("MY_SECRET", "dev-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
FRONTEND_URL = os.getenv("REACT_APP_API_URL", "http://localhost:5173")
PRE_FIX_AUTH = os.getenv("PRE_FIX_AUTH", "/api/auth")
PRE_FIX_INPUT = os.getenv("PRE_FIX_INPUT", "/api/input")
PRE_FIX_USER = os.getenv("PRE_FIX_USER", "/api/user")
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "output_logs")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "upload")
LIST_FOLDER_DIR = os.getenv("LIST_FOLDER_DIR","list-files")
REFDATA_DIR = os.getenv("REFDATA_DIR", "reference")
FEEDBACK_DIR = os.getenv("FEEDBACK_DIR", "feedback")
AUTH_USER_DIR = os.getenv("AUTH_USER_DIR", "auth_login")
INPUT_USER_DIR = os.getenv("INPUT_USER_DIR", "input_users")
ANALYSISLOGS_DIR = os.getenv("ANALYSISLOGS_DIR", "analysis_logs")
DATASET_DIR = os.getenv("DATASET_DIR", "dataset")
MODEL_DIR = os.getenv("MODEL_DIR", "model")
CONFIG_DIR = os.getenv("CONFIG_DIR", "configs")
FRONTEND_URLS = [u.strip() for u in os.getenv("FRONTEND_URLS", "http://localhost:5173").split(",") if u.strip()]

# define sub-folders
FEEDBACK_ATTACHMENT_DIR = os.path.join(FEEDBACK_DIR, "attachments")
MODEL_FASTER_RCNN_DIR = os.path.join(MODEL_DIR, "FasterRCNN")
CNN_DIR = os.path.join(MODEL_DIR, "CNN_V2")

# define file paths
VERSION_FILE_PATH = os.path.join(ANALYSISLOGS_DIR, f"{SYSTEM_VERSION}.json")
AUTH_FILE_PATH = os.path.join(AUTH_USER_DIR, "data.json")
INPUT_FILE_PATH = os.path.join(INPUT_USER_DIR, "input.json")
DATAREF_FILE_PATH_CSV = os.path.join(REFDATA_DIR, "ref_data.csv")
DATAREF_FILE_PATH_JSON = os.path.join(REFDATA_DIR, "ref_data.json")
DATASET_LABELS_CSV = os.path.join(DATASET_DIR, "labels.csv")
ATTACHMENT_FEEDBACK_FILE_PATH_JSON = os.path.join(FEEDBACK_ATTACHMENT_DIR, "attachment_feedback.json")
CONFIG_FILE_PATH_YAML = os.path.join(CONFIG_DIR, "config.yaml")