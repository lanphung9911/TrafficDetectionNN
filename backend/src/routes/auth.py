from fastapi import APIRouter
from ..schemas import LoginRequest
from .write2json import write_to_json
from ..config import AUTH_FILE_PATH

# create a router for authentication routes
login_router = APIRouter()

# create a route for user login as POST (receives from frontend)
@login_router.post("/login")

# define function to handle login requests
def login(request: LoginRequest):
    result = {
        "email": request.email,
        "password": request.password,
        "role": request.role}
    write_to_json(result, AUTH_FILE_PATH)
    return result