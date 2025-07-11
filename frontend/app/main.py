from fastapi import FastAPI
from .routers import chat, metrics, agents, quests, files, users

app = FastAPI()

app.include_router(chat.router)
app.include_router(metrics.router)
app.include_router(agents.router)
app.include_router(quests.router)
app.include_router(files.router)
app.include_router(users.router)

@app.get('/')
async def root():
    return {'message': 'Productivity App API'}
