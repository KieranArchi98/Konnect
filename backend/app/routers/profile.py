from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict, Any
from app.services.profile_service import ProfileService
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])

async def get_current_user_dependency(request: Request) -> Dict[str, Any]:
    """Dependency to get current user"""
    return await get_current_user(request)

@router.get("/")
async def get_user_profile(current_user: Dict[str, Any] = Depends(get_current_user_dependency)):
    """Get basic user profile data"""
    try:
        print(f"[ProfileRouter] Getting profile for user: {current_user}")
        user_id = current_user.get("id")
        print(f"[ProfileRouter] User ID: {user_id}")
        
        if not user_id:
            print("[ProfileRouter] No user ID found in current_user")
            raise HTTPException(status_code=400, detail="No user ID found")
        
        profile_service = ProfileService()
        profile_data = await profile_service.get_user_profile_data(user_id)
        
        if not profile_data:
            print(f"[ProfileRouter] No profile data returned for user_id: {user_id}")
            raise HTTPException(status_code=404, detail="User profile not found")
        
        print(f"[ProfileRouter] Successfully returned profile data")
        return {
            "success": True,
            "data": profile_data
        }
    except Exception as e:
        print(f"[ProfileRouter] Error getting user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user profile")

@router.post("/complete-quest/{quest_id}")
async def complete_quest(
    quest_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_dependency)
):
    """Complete a quest (basic version)"""
    try:
        profile_service = ProfileService()
        result = await profile_service.complete_quest(current_user["id"], quest_id)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        print(f"Error completing quest: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete quest") 