from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import chat, metrics, agents, quests, files, users, auth, profile
from app.middleware.auth import auth_middleware
from datetime import datetime
import json

# Custom JSON encoder for datetime objects
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif hasattr(obj, 'isoformat'):  # Handle other datetime-like objects
            return obj.isoformat()
        elif hasattr(obj, 'strftime'):  # Handle date objects
            return obj.strftime('%Y-%m-%dT%H:%M:%S')
        return super().default(obj)

# Override FastAPI's default JSON response
class CustomJSONResponse(JSONResponse):
    def render(self, content):
        return json.dumps(content, cls=DateTimeEncoder, ensure_ascii=False).encode("utf-8")

app = FastAPI()

# CORS middleware must be the very first middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
print("CORS middleware enabled: allowing specific origins for development.")
print("Allowed origins: http://localhost:5173, http://localhost:5174, http://127.0.0.1:5173, http://127.0.0.1:5174")

# Add authentication middleware
print("Adding authentication middleware...")
app.middleware("http")(auth_middleware)
print("Authentication middleware added successfully")

# Override FastAPI's default JSON response globally
import fastapi.responses
fastapi.responses.JSONResponse = CustomJSONResponse

# Routers must be included after CORS
app.include_router(chat.router)
app.include_router(metrics.router)
app.include_router(agents.router)
app.include_router(quests.router)
app.include_router(files.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(profile.router)

@app.get("/")
async def root():
    return {"message": "Agent Dashboard API is running!"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test Supabase connection
        from app.utils.config import supabase, settings
        response = supabase.table("users").select("count", count="exact").execute()
        return {
            "status": "healthy",
            "supabase": "connected",
            "supabase_url": settings.supabase_url[:20] + "..." if settings.supabase_url else "not_set",
            "jwt_secret": "set" if settings.jwt_secret else "not_set",
            "timestamp": "2024-01-01T00:00:00Z"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": "2024-01-01T00:00:00Z"
        }

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
