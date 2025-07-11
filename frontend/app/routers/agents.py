from fastapi import APIRouter

router = APIRouter(prefix='/agents', tags=['agents'])

@router.post('/assign')
async def assign_task(task: dict):
    return {'task_id': '123', 'status': 'Assigned'}

@router.get('/status/{task_id}')
async def get_task_status(task_id: str):
    return {'task_id': task_id, 'status': 'Running'}
