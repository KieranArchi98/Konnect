from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.auth_service import auth_service
from typing import Optional, Dict, Any
import os
import jwt
from app.utils.config import settings, supabase
from app.services.auth_service import serialize_user_data

class JWTBearer(HTTPBearer):
    async def __call__(self, request: Request):
        credentials: HTTPAuthorizationCredentials = await super().__call__(request)
        if credentials:
            try:
                user = await auth_service.get_current_user(credentials.credentials)
                request.state.user = user
                return user
            except HTTPException:
                raise HTTPException(status_code=401, detail="Invalid token")
        raise HTTPException(status_code=401, detail="Invalid authorization")

async def get_current_user(request: Request) -> Dict[str, Any]:
    """Get current user from request state or JWT token"""
    try:
        # Check if user is already in request state (from middleware)
        if hasattr(request.state, 'user') and request.state.user:
            return request.state.user
        
        # Extract token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        
        token = auth_header.split(' ')[1]
        
        # Decode and verify token
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
            user_id = payload.get("sub")
            
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token payload")
            
            # Get user from database
            user_response = supabase.table("users").select("*").eq("id", user_id).single().execute()
            
            if not user_response.data:
                raise HTTPException(status_code=401, detail="User not found")
            
            # Serialize user data to handle datetime objects
            return serialize_user_data(user_response.data)
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError as e:
            print(f"JWT decode error: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_current_user: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

async def auth_middleware(request: Request, call_next):
    """Middleware to handle authentication for protected routes"""
    # Public routes that don't require authentication
    public_routes = [
        "/",
        "/docs",
        "/openapi.json",
        "/auth/login",
        "/auth/register",
        "/auth/verify-email",
        "/auth/resend-verification",
        "/auth/oauth/callback",
        "/auth/me",
        "/auth/ping",
        "/auth/test"
    ]
    
    # Check if route is public
    if any(request.url.path.startswith(route) for route in public_routes):
        response = await call_next(request)
        return response
    
    # For all protected routes, require proper authentication
    try:
        await JWTBearer()(request)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    response = await call_next(request)
    return response
