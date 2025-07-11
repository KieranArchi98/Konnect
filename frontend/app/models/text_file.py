from pydantic import BaseModel

class TextFile(BaseModel):
    id: str
    name: str
    content: str
