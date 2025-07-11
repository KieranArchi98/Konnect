from fastapi import APIRouter

router = APIRouter(prefix='/metrics', tags=['metrics'])

@router.get('/')
async def get_metrics():
    return {
        'deadlines': '3 days',
        'todo': '3 tasks',
        'habits': '2/5',
        'news': 'Sample news'
    }
