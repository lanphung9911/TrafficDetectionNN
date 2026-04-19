from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str

class VideoUploadRequest(BaseModel):
    videoFile: bytes

class ReferenceDataSend(BaseModel):
    img: bytes
    title: str
    description: str

class FeedbackRequest(BaseModel):
    email_name: str
    rating: int
    evaluateOption: Optional[str] = None
    attachFile: Optional[str] = None
    feedbackText: Optional[str] = None