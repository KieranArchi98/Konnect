from fastapi import APIRouter

router = APIRouter(prefix='/quests', tags=['quests'])

@router.post('/submit')
async def submit_report(report: dict):
    return {'quest_id': '456', 'status': 'New quest assigned'}

@router.post('/accept/{quest_id}')
async def accept_quest(quest_id: str):
    return {'quest_id': quest_id, 'status': 'Accepted'}
