from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import chat, metrics, agents, quests, files, users

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
print("CORS middleware enabled: allowing all origins for development.")
app.include_router(chat.router)
app.include_router(metrics.router)
app.include_router(agents.router)
app.include_router(quests.router)
app.include_router(files.router)
app.include_router(users.router)

@app.get("/")
async def root():
    return {"message": "Productivity App API"}

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
