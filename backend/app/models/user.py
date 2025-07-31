from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime

class User(BaseModel):
    id: str
    email: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    auth_provider: str = "email"
    email_verified: bool = False
    elo: int = 1000
    level: int = 1  # Changed from str to int to match database
    experience: int = 0
    experience_to_next_level: int = 100
    current_streak: int = 0
    longest_streak: int = 0
    total_days_active: int = 0
    last_active_date: Optional[str] = None
    is_active: bool = True
    preferences: Dict[str, Any] = {}
    last_login: Optional[str] = None
    created_at: Optional[str] = None  # Made optional and string to handle serialization

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class OAuthLogin(BaseModel):
    provider: str
    code: str
    redirect_uri: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: User

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class EmailVerificationRequest(BaseModel):
    email: EmailStr
    verification_code: str

class EmailVerificationResponse(BaseModel):
    success: bool
    message: str
    user_id: Optional[str] = None

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class ResendVerificationResponse(BaseModel):
    success: bool
    message: str
