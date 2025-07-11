from fastapi import APIRouter
from pydantic import BaseModel
from app.services.quest_service import submit_quest, accept_quest as accept_quest_service, get_default_quests, get_active_quests

router = APIRouter(prefix="/quests", tags=["quests"])

class QuestReport(BaseModel):
    report: dict

@router.post("/submit")
async def submit_report(report: QuestReport):
    user_id = 1
    return submit_quest(report.report, user_id)

@router.post("/accept/{quest_id}")
async def accept_quest(quest_id: int):
    user_id = 1
    return accept_quest_service(quest_id, user_id)

@router.get("/default")
async def get_default():
    user_id = 1
    return get_default_quests(user_id)

@router.get("/active")
async def get_active():
    user_id = 1
    active = get_active_quests(user_id)
    if not active:
        return get_default_quests(user_id)
    return active
