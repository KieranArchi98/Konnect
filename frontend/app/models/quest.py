from pydantic import BaseModel

class Quest(BaseModel):
    id: str
    description: str
    status: str
    elo_reward: int
