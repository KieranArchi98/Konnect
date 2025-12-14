from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict, Any
from app.services.profile_service import ProfileService
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])

async def get_current_user_dependency(request: Request) -> Dict[str, Any]:
    """Dependency to get current user"""
    try:
        return await get_current_user(request)
    except Exception as e:
        print(f"[ProfileRouter] Error getting current user: {e}")
        raise HTTPException(status_code=401, detail="Authentication required")

@router.get("/")
async def get_user_profile(current_user: Dict[str, Any] = Depends(get_current_user_dependency)):
    """Get user profile data with basic user info and dummy data"""
    try:
        print(f"[ProfileRouter] Getting profile for user: {current_user.get('email', 'unknown')}")
        user_id = current_user.get("id")
        print(f"[ProfileRouter] User ID: {user_id}")
        
        if not user_id:
            print("[ProfileRouter] No user ID found in current_user")
            raise HTTPException(status_code=400, detail="No user ID found")
        
        print(f"[ProfileRouter] Initializing ProfileService...")
        profile_service = ProfileService()
        
        print(f"[ProfileRouter] Calling get_user_profile_data...")
        profile_data = await profile_service.get_user_profile_data(user_id)
        
        print(f"[ProfileRouter] Successfully returning profile data")
        return {
            "success": True,
            "data": profile_data
        }
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"[ProfileRouter] Unexpected error getting user profile: {e}")
        print(f"[ProfileRouter] Error type: {type(e)}")
        print(f"[ProfileRouter] Error message: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to get user profile: {str(e)}")

@router.post("/complete-quest/{quest_id}")
async def complete_quest(
    quest_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_dependency)
):
    """Complete a quest (basic version)"""
    try:
        print(f"[ProfileRouter] Completing quest {quest_id} for user: {current_user.get('email', 'unknown')}")
        profile_service = ProfileService()
        result = await profile_service.complete_quest(current_user["id"], quest_id)
        
        if not result["success"]:
            print(f"[ProfileRouter] Quest completion failed: {result['error']}")
            raise HTTPException(status_code=400, detail=result["error"])
        
        print(f"[ProfileRouter] Quest completed successfully")
        return {
            "success": True,
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ProfileRouter] Error completing quest: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete quest") 