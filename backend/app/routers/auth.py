from fastapi import APIRouter, Depends, HTTPException, Request
from app.models.user import UserCreate, UserLogin, OAuthLogin, TokenResponse, UserUpdate, EmailVerificationRequest, EmailVerificationResponse, ResendVerificationRequest, ResendVerificationResponse
from app.services.auth_service import auth_service
from app.services.email_verification_service import email_verification_service
from app.middleware.auth import get_current_user
from typing import Dict, Any

router = APIRouter(prefix="/auth", tags=["authentication"])

async def get_current_user_dependency(request: Request) -> Dict[str, Any]:
    """Dependency to get current user"""
    return await get_current_user(request)

@router.post("/register", response_model=Dict[str, Any])
async def register(user_data: UserCreate):
    """Register new user"""
    print(f"[API] Registration attempt for email: {user_data.email}")
    try:
        print(f"[API] Calling auth_service.register_user...")
        result = await auth_service.register_user(
            email=user_data.email,
            password=user_data.password,
            display_name=user_data.display_name
        )
        print(f"[API] Registration successful for: {user_data.email}")
        print(f"[API] Returning result: {result}")
        return result
    except Exception as e:
        print(f"[API] Registration error for {user_data.email}: {str(e)}")
        print(f"[API] Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    """Login user with email/password"""
    print(f"[API] Login attempt for email: {user_data.email}")
    try:
        result = await auth_service.login_user(
            email=user_data.email,
            password=user_data.password
        )
        print(f"[API] Login successful for: {user_data.email}")
        return result
    except Exception as e:
        print(f"[API] Login error for {user_data.email}: {str(e)}")
        raise

@router.post("/oauth/login", response_model=TokenResponse)
async def oauth_login(oauth_data: OAuthLogin):
    """Login with OAuth provider"""
    return await auth_service.oauth_login(
        provider=oauth_data.provider,
        code=oauth_data.code,
        redirect_uri=oauth_data.redirect_uri
    )

@router.post("/refresh", response_model=Dict[str, str])
async def refresh_token(refresh_token: str):
    """Refresh access token"""
    return await auth_service.refresh_token(refresh_token)

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user_dependency), refresh_token: str = None):
    """Logout user"""
    await auth_service.logout(current_user["id"], refresh_token)
    return {"message": "Logged out successfully"}

@router.get("/me")
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user_dependency)):
    """Get current user information"""
    print(f"[API] Getting current user info for: {current_user.get('email', 'unknown')}")
    return current_user

@router.put("/me", response_model=Dict[str, Any])
async def update_user_info(
    user_data: UserUpdate,
    current_user: dict = Depends(get_current_user_dependency)
):
    """Update current user information"""
    # Implementation for updating user profile
    # This would update the user's display_name, avatar_url, or preferences
    pass

@router.post("/verify-email", response_model=EmailVerificationResponse)
async def verify_email(request: EmailVerificationRequest):
    """Verify user email with verification code"""
    try:
        result = email_verification_service.verify_code(request.email, request.verification_code)
        return EmailVerificationResponse(
            success=True,
            message="Email verified successfully! You can now log in.",
            user_id=result["user_id"]
        )
    except HTTPException as e:
        return EmailVerificationResponse(
            success=False,
            message=e.detail
        )

@router.post("/resend-verification", response_model=ResendVerificationResponse)
async def resend_verification(request: ResendVerificationRequest):
    """Resend verification email"""
    try:
        success = email_verification_service.resend_verification_code(request.email)
        if success:
            return ResendVerificationResponse(
                success=True,
                message="Verification email sent successfully. Please check your inbox."
            )
        else:
            return ResendVerificationResponse(
                success=False,
                message="Failed to send verification email. Please try again."
            )
    except HTTPException as e:
        return ResendVerificationResponse(
            success=False,
            message=e.detail
        )

@router.get("/ping")
async def ping():
    """Simple ping endpoint to test connectivity"""
    return {
        "message": "pong",
        "timestamp": "2024-01-01T00:00:00Z",
        "status": "ok"
    }

@router.get("/test")
async def test_auth():
    """Test endpoint to check if auth is working"""
    return {
        "message": "Auth router is working",
        "timestamp": "2024-01-01T00:00:00Z",
        "status": "ok"
    } 