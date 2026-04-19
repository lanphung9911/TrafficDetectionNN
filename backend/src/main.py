import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from . import config
from .routes import auth, inputhandle, predict_data_vid, predict_data_img, ref_data, get_feedback
from fastapi.responses import JSONResponse

# create a backend server using FastAPI
app = FastAPI(title="TrafficDetect Backend (demo)")

# configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.FRONTEND_URLS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# register routes

## auth routes with prefix from config
app.include_router(auth.login_router, prefix=config.PRE_FIX_AUTH)
app.include_router(inputhandle.vdHandle_router, prefix=config.PRE_FIX_VIDEO)
app.include_router(predict_data_vid.predict_vid_router)
app.include_router(predict_data_img.predict_img_router)
app.include_router(ref_data.ref_data_router)
app.include_router(get_feedback.get_user_feedback_router)

# create upload folder to store uploaded video files from frontend
os.makedirs(config.UPLOAD_DIR, exist_ok=True)
os.makedirs(config.OUTPUT_DIR, exist_ok=True)
os.makedirs(config.REFDATA_DIR, exist_ok=True)
app.mount(f"{config.UPLOAD_DIR}".replace(".", ""), StaticFiles(directory=config.UPLOAD_DIR), name="upload")
app.mount(f"{config.OUTPUT_DIR}".replace(".", ""), StaticFiles(directory=config.OUTPUT_DIR), name="output")
app.mount("/reference", StaticFiles(directory=config.REFDATA_DIR), name="reference")

# define a route for the home page
@app.get("/")
def home():
    print("LAN")
    return {"message": "Hello LAN"}

@app.get(f"{config.LIST_FOLDER_DIR}/{{folder_path:path}}")
async def list_files(folder_path: str):
    folder = os.path.join(config.UPLOAD_DIR, folder_path)

    if not os.path.isdir(folder):
        return JSONResponse(content={"error": "Folder not found"}, status_code=404)

    files = [
        f for f in os.listdir(folder)
        if os.path.isfile(os.path.join(folder, f))
    ]

    urls = [f"/upload/{folder_path}/{f}" for f in files]

    return JSONResponse(content=urls)