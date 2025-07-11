from fastapi import APIRouter, Body
from pydantic import BaseModel
from app.services.agent_service import assign_agent_task, get_task_status as get_task_status_service, query_agent, send_email_agent

router = APIRouter(prefix="/agents", tags=["agents"])

class TaskRequest(BaseModel):
    agent_id: int
    input: str

class SendEmailRequest(BaseModel):
    email: str
    preview: str
    agent_id: int
    user_input: str

@router.post("/assign")
async def assign_task(request: TaskRequest):
    task = assign_agent_task(request.dict())
    return task

@router.post("/send_email")
async def send_email(request: SendEmailRequest):
    result = send_email_agent(request.email, request.preview, request.agent_id, request.user_input)
    return result

@router.get("/status/{task_id}")
async def get_task_status(task_id: int):
    return get_task_status_service(task_id)

@router.get("/")
async def list_agents():
    # List all agents for the dropdown
    from app.utils.config import supabase
    response = supabase.table("agents").select("id, name, description, capabilities, is_active").execute()
    data = getattr(response, 'data', None)
    return data or []

@router.post("/query")
async def query_vector_store(query: str = Body(..., embed=True)):
    results = query_agent(query)
    return {"results": results}
