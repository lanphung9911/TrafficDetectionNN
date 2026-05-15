const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const LIST_FOLDER_DIR = "/list-files";
const PREDICT_IMAGE = "/api/input/predict_image";
const CLEANUP = "/api/input/cleanup";

export { API_BASE_URL, LIST_FOLDER_DIR, PREDICT_IMAGE, CLEANUP };
export default LIST_FOLDER_DIR;