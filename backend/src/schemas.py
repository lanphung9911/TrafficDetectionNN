import re
from pydantic import BaseModel, field_validator, model_validator
from typing import Optional

# Password policy. Keep these in sync with app/src/utils/validate_password.js
PASSWORD_MIN_LENGTH = 8
_SPECIAL_CHAR_REGEX = re.compile(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?`~]")

# Email domain policy per role. Keep in sync with app/src/utils/validate_email.js
ROLE_EMAIL_DOMAIN = {
    "DataScientist": "@datascientist.com",
    "User": "@user.com",
    "Admin": "@admin.com",
}


class LoginRequest(BaseModel):
    email: str
    password: str
    role: str

    @field_validator("password")
    @classmethod
    def validate_password_policy(cls, value: str) -> str:
        if not isinstance(value, str) or len(value) == 0:
            raise ValueError("Password is required.")
        if len(value) < PASSWORD_MIN_LENGTH:
            raise ValueError(
                f"Password must be at least {PASSWORD_MIN_LENGTH} characters."
            )
        if not _SPECIAL_CHAR_REGEX.search(value):
            raise ValueError(
                "Password must contain at least 1 special character "
                "(e.g. !@#$%^&*)."
            )
        return value

    @model_validator(mode="after")
    def validate_email_domain_matches_role(self) -> "LoginRequest":
        expected_domain = ROLE_EMAIL_DOMAIN.get(self.role)
        if expected_domain is None:
            raise ValueError(
                f"Unknown role '{self.role}'. Must be one of: "
                f"{', '.join(ROLE_EMAIL_DOMAIN.keys())}."
            )
        if not isinstance(self.email, str) or not self.email.lower().endswith(
            expected_domain
        ):
            raise ValueError(
                f"Email for role '{self.role}' must end with '{expected_domain}'."
            )
        return self

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