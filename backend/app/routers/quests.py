from fastapi import APIRouter, Body, Depends, HTTPException, Request
from pydantic import BaseModel
from app.services.quest_service import (
    get_available_quests, accept_quest, complete_quest, submit_report, get_in_progress_quests, get_completed_quests, abandon_quest, reset_daily_quests, can_submit_report
)
from app.middleware.auth import get_current_user
from typing import Dict, Any
import uuid

router = APIRouter(prefix="/quests", tags=["quests"])

class QuestReport(BaseModel):
    report: dict

async def get_current_user_dependency(request: Request) -> Dict[str, Any]:
    """Dependency to get current user"""
    return await get_current_user(request)

@router.get("/available")
def available_quests(current_user: Dict[str, Any] = Depends(get_current_user_dependency)):
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    return get_available_quests(user_id)

@router.post("/accept/{quest_id}")
def accept(quest_id: str, current_user: Dict[str, Any] = Depends(get_current_user_dependency)):
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    return accept_quest(quest_id, user_id)

@router.post("/complete/{quest_id}")
def complete(quest_id: str, current_user: Dict[str, Any] = Depends(get_current_user_dependency)):
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    return complete_quest(quest_id, user_id)

@router.post("/report")
def report(report: QuestReport, current_user: Dict[str, Any] = Depends(get_current_user_dependency)):
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    return submit_report(report.report, user_id)

@router.post("/abandon/{quest_id}")
def abandon(quest_id: str, current_user: Dict[str, Any] = Depends(get_current_user_dependency)):
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    return abandon_quest(quest_id, user_id)

@router.post("/reset")
def reset_quests(current_user: Dict[str, Any] = Depends(get_current_user_dependency)):
    """Reset daily quests for the user"""
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    return reset_daily_quests(user_id)

@router.get("/report_status")
def report_status(current_user: Dict[str, Any] = Depends(get_current_user_dependency)):
    # Check if user can submit a report today
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    can_submit = can_submit_report(user_id)
    return {"locked": not can_submit}

@router.get("/in_progress")
def in_progress_quests(current_user: Dict[str, Any] = Depends(get_current_user_dependency)):
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    return get_in_progress_quests(user_id)

@router.get("/completed")
def completed_quests(current_user: Dict[str, Any] = Depends(get_current_user_dependency)):
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    return get_completed_quests(user_id)

@router.get("/all")
def all_quests(current_user: Dict[str, Any] = Depends(get_current_user_dependency)):
    """Fetch all quest data (available, in-progress, completed) in a single request"""
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User not authenticated")
        
        # Fetch all quest data in parallel or single query
        available = get_available_quests(user_id)
        in_progress = get_in_progress_quests(user_id)
        completed = get_completed_quests(user_id)
        
        return {
            "available": available,
            "in_progress": in_progress,
            "completed": completed
        }
    except Exception as e:
        print(f"Error fetching all quests: {e}")
        return {
            "available": [],
            "in_progress": [],
            "completed": []
        }
