from pydantic import BaseModel
from typing import Optional

class Quest(BaseModel):
    id: str
    title: str
    description: str
    elo_reward: int
    difficulty: str
    status: str
    progress: float = 0.0
    user_id: str
    category: str
    date_accepted: Optional[str] = None
    date_completed: Optional[str] = None
