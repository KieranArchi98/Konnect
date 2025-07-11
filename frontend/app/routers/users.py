from fastapi import APIRouter

router = APIRouter(prefix='/settings', tags=['settings'])

@router.get('/')
async def get_settings():
    return {'email': 'user@example.com'}

@router.put('/')
async def update_settings(settings: dict):
    return {'status': 'Updated'}
