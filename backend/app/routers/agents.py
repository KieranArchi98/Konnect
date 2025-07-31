from fastapi import APIRouter, Body, Request
from pydantic import BaseModel
from app.services.agent_service import (
    assign_agent_task, 
    send_email_agent, 
    regenerate_email_with_tone,
    generate_inspirational_quote,
    generate_ideas,
    get_task_status as get_task_status_service,
    query_agent_with_mode
)
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/agents", tags=["agents"])

class TaskRequest(BaseModel):
    agent_id: int
    input: str

class SendEmailRequest(BaseModel):
    email: str
    preview: str
    agent_id: int
    user_input: str
    task_id: int | None = None
    tone_level: int = 3

class RegenerateEmailRequest(BaseModel):
    user_input: str
    tone_level: int

class QueryRequest(BaseModel):
    query: str
    mode: str = "basic"  # Default to basic

class QuoteRequest(BaseModel):
    quote_type: str = "motivation"

class IdeasRequest(BaseModel):
    command: str

@router.post("/assign")
async def assign_task(request: TaskRequest, request_obj: Request):
    # Get current user
    current_user = await get_current_user(request_obj)
    user_id = current_user.get('id')
    
    if not user_id:
        print('[API] No user ID found for task assignment')
        return {"status": "failed", "error": "Authentication required"}
    
    print(f'[API] Assigning task for user_id: {user_id}')
    task = await assign_agent_task(request.dict(), user_id)
    return task

@router.post("/send_email")
async def send_email(request: SendEmailRequest, request_obj: Request):
    # Get current user
    current_user = await get_current_user(request_obj)
    user_id = current_user.get('id')
    
    if not user_id:
        print('[API] No user ID found for send_email')
        return {"status": "failed", "error": "Authentication required"}
    
    result = send_email_agent(request.email, request.preview, request.agent_id, request.user_input, request.task_id, user_id)
    return result

@router.post("/regenerate_email")
async def regenerate_email(request: RegenerateEmailRequest):
    result = await regenerate_email_with_tone(request.user_input, request.tone_level)
    return result

@router.post("/generate_quote")
async def generate_quote(request: QuoteRequest):
    result = await generate_inspirational_quote(request.quote_type)
    return result

@router.post("/generate_ideas")
async def generate_ideas_endpoint(request: IdeasRequest):
    result = await generate_ideas(request.command)
    return result

@router.get("/status/{task_id}")
async def get_task_status(task_id: int):
    return get_task_status_service(task_id)

@router.get("/")
async def list_agents():
    # List all agents for the dropdown
    from app.utils.config import supabase
    print('[API] /agents/ endpoint called')
    response = supabase.table("agents").select("id, name, description, capabilities, is_active, user_selectable").execute()
    data = getattr(response, 'data', None)
    # Ensure user_selectable is always a boolean
    if data:
        for agent in data:
            if not isinstance(agent.get('user_selectable'), bool):
                agent['user_selectable'] = bool(agent.get('user_selectable') in [True, 'true', 'True', 1, '1'])
        filtered = [a for a in data if a['user_selectable']]
        print('[API] /agents/ filtered user_selectable:', filtered)
    print('[API] /agents/ response:', data)
    return data or []

@router.get("/tasks")
async def get_agent_tasks(request: Request):
    # Get all agent tasks for the current user
    from app.utils.config import supabase
    
    print('[API] /agents/tasks endpoint called')
    try:
        # Get current user
        current_user = await get_current_user(request)
        user_id = current_user.get('id')
        
        if not user_id:
            print('[API] No user ID found, returning empty list')
            return []
        
        print(f'[API] Filtering tasks for user_id: {user_id}')
        response = supabase.table("agent_tasks").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        data = getattr(response, 'data', None)
        print(f'[API] /agents/tasks response for user {user_id}:', data)
        return data or []
    except Exception as e:
        print(f'[API] Error in /agents/tasks: {e}')
        return []

@router.post("/query")
async def query_vector_store(request: QueryRequest):
    print(f"[API] /query endpoint called with mode: {request.mode}")
    
    try:
        results = await query_agent_with_mode(request.query, request.mode)
        return results
    except Exception as e:
        print(f"[API] Error in query endpoint: {e}")
        # Return error response
        return {
            "mode": request.mode,
            "error": str(e),
            "results": [] if request.mode == "basic" else {"summary": "Error occurred while processing query."}
        }
