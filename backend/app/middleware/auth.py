cd from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from app.utils.config import settings

class JWTBearer(HTTPBearer):
    async def __call__(self, request: Request):
        credentials: HTTPAuthorizationCredentials = await super().__call__(request)
        if credentials:
            try:
                payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=["HS256"])
                return payload
            except jwt.JWTError:
                raise HTTPException(status_code=401, detail="Invalid token")
        raise HTTPException(status_code=401, detail="Invalid authorization")

async def auth_middleware(request: Request, call_next):
    if request.url.path not in ["/users/login", "/users/register"]:
        await JWTBearer()(request)
    response = await call_next(request)
    return response
