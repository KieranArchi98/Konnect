from pydantic import BaseModel

class AgentTask(BaseModel):
    id: str
    details: dict
    status: str
