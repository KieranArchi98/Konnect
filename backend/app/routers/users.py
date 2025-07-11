from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/users", tags=["users"])

class UserUpdate(BaseModel):
    email: str

@router.put("/settings")
async def update_settings(settings: UserUpdate):
    return update_user(settings.email)
