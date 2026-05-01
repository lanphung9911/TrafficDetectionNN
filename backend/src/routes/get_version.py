from ..config import SYSTEM_VERSION
from fastapi import APIRouter

get_version_router = APIRouter()

@get_version_router.get("/version")
def version():
    return {"system_version": SYSTEM_VERSION}