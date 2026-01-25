import uuid
from jose import jwt
import os
import httpx
from datetime import datetime, timedelta, date
from typing import Dict, Any, Optional
from fastapi import HTTPException
import bcrypt
from supabase import create_client, Client
from app.utils.config import settings
from app.services.email_verification_service import email_verification_service

# Handle JWT errors
class JWTError(Exception):
    pass

def serialize_user_data(user_data):
    """Helper function to serialize user data for JSON response"""
    if not user_data:
        return None
    
    # Ensure all required fields are present with defaults
    required_fields = {
        'id': '',
        'email': '',
        'display_name': None,
        'avatar_url': None,
        'auth_provider': 'email',
        'email_verified': False,
        'elo': 0,
        'level': 1,
        'experience': 0,
        'experience_to_next_level': 100,
        'current_streak': 0,
        'longest_streak': 0,
        'total_days_active': 0,
        'last_active_date': None,
        'is_active': True,
        'preferences': {},
        'last_login': None,
        'created_at': None
    }
    
    serialized = required_fields.copy()
    
    for key, value in user_data.items():
        try:
            if isinstance(value, datetime):
                serialized[key] = value.isoformat()
            elif isinstance(value, date):
                serialized[key] = value.isoformat()
            elif hasattr(value, 'isoformat'):  # Handle other datetime-like objects
                serialized[key] = value.isoformat()
            elif hasattr(value, 'strftime'):  # Handle date objects
                serialized[key] = value.strftime('%Y-%m-%dT%H:%M:%S')
            elif isinstance(value, (dict, list)):
                # Recursively serialize nested objects
                serialized[key] = serialize_nested_data(value)
            else:
                serialized[key] = value
        except Exception as e:
            print(f"Error serializing field {key} with value {value} (type: {type(value)}): {e}")
            # Skip problematic fields
            continue
    
    return serialized

def serialize_nested_data(data):
    """Recursively serialize nested data structures"""
    if isinstance(data, dict):
        return {k: serialize_nested_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [serialize_nested_data(item) for item in data]
    elif isinstance(data, datetime):
        return data.isoformat()
    elif isinstance(data, date):
        return data.isoformat()
    elif hasattr(data, 'isoformat'):
        return data.isoformat()
    elif hasattr(data, 'strftime'):
        return data.strftime('%Y-%m-%dT%H:%M:%S')
    else:
        return data

class AuthService:
    def __init__(self):
        self.supabase: Client = create_client(settings.supabase_url, settings.supabase_key)
        self.jwt_secret = settings.jwt_secret
        self.jwt_algorithm = "HS256"
        self.access_token_expire_minutes = 30
    
    def _hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')
    
    def _verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash using bcrypt"""
        try:
            if not hashed or not password:
                print("Missing password or hash")
                return False
            password_bytes = password.encode('utf-8')
            hashed_bytes = hashed.encode('utf-8')
            result = bcrypt.checkpw(password_bytes, hashed_bytes)
            return result
        except Exception as e:
            print(f"Error in _verify_password: {e}")
            import traceback
            traceback.print_exc()
            return False
        
    async def register_user(self, email: str, password: str, display_name: str = None) -> Dict[str, Any]:
        """Register new user with email/password"""
        try:
            print(f"Starting registration for: {email}")
            
            # Check if user already exists
            print("Checking if user exists...")
            existing_user = self.supabase.table("users").select("id").eq("email", email).execute()
            if existing_user.data:
                print(f"User already exists: {email}")
                raise HTTPException(status_code=400, detail="User already exists")
            
            print("User doesn't exist, proceeding with registration...")
            
            # Validate password length (bcrypt limit is 72 bytes)
            if len(password.encode('utf-8')) > 72:
                raise HTTPException(
                    status_code=400, 
                    detail="Password is too long. Maximum length is 72 bytes. Please use a shorter password."
                )
            
            # Hash password
            hashed_password = self._hash_password(password)
            
            # Create user with only the columns that exist in the database
            user_data = {
                "id": str(uuid.uuid4()),
                "email": email,
                "password_hash": hashed_password,
                "display_name": display_name or email.split('@')[0],
                "auth_provider": "email",
                "email_verified": False,
                "level": 1,  # Set level to 1 for new users
                "elo": 0,
                "is_active": True,
                "preferences": {}
            }
            
            print(f"Inserting user data: {user_data['id']}")
            
            # Insert user and get the inserted data
            response = self.supabase.table("users").insert(user_data).execute()
            
            # Get the inserted user
            if response.data:
                user = response.data[0]
                
                print(f"User inserted successfully: {user['id']}")
                print(f"Debug: Raw user data from database: {user}")
                
                # Create verification code and send email
                print("Creating verification code and sending email...")
                
                # Try email verification
                try:
                    if settings.enable_email_verification:
                        print("Email verification is enabled - creating verification code...")
                        try:
                            verification_code = email_verification_service.create_verification_code(user["id"], user["email"])
                            
                            # Try to send email but don't block registration if it fails
                            try:
                                email_sent = email_verification_service.send_verification_email(user["email"], verification_code, user.get("display_name"))
                                if email_sent:
                                    print("Verification email sent successfully")
                                    message = "User registered successfully. Please check your email for verification."
                                else:
                                    print("Warning: Failed to send verification email")
                                    message = "User registered successfully. Please check your email for verification (email may be delayed)."
                            except Exception as email_error:
                                print(f"Email sending failed: {email_error}")
                                message = "User registered successfully. Please check your email for verification (email may be delayed)."
                            
                            # Serialize user data to handle datetime objects
                            serialized_user = serialize_user_data(user)
                            
                            result = {
                                "message": message,
                                "user": serialized_user,
                                "requires_verification": True
                            }
                        except Exception as verification_error:
                            print(f"Verification code creation failed: {verification_error}")
                            # Set email_verified to true since verification failed
                            self.supabase.table("users").update({"email_verified": True}).eq("id", user["id"]).execute()
                            print("Email verification bypassed due to error")
                            serialized_user = serialize_user_data(user)
                            result = {
                                "message": "User registered successfully! (Email verification bypassed)",
                                "user": serialized_user,
                                "requires_verification": False
                            }
                    else:
                        print("Email verification disabled")
                        
                        # Set email_verified to true since we're bypassing verification
                        self.supabase.table("users").update({"email_verified": True}).eq("id", user["id"]).execute()
                        print("Email verification set to true")
                        
                        serialized_user = serialize_user_data(user)
                        result = {
                            "message": "User registered successfully! (Email verification disabled)",
                            "user": serialized_user,
                            "requires_verification": False
                        }
                except Exception as verification_error:
                    print(f"Verification code creation failed: {verification_error}")
                    # Set email_verified to true since verification failed
                    try:
                        self.supabase.table("users").update({"email_verified": True}).eq("id", user["id"]).execute()
                        print("Email verification bypassed due to error")
                        serialized_user = serialize_user_data(user)
                        result = {
                            "message": "User registered successfully! (Email verification bypassed)",
                            "user": serialized_user,
                            "requires_verification": False
                        }
                    except Exception as bypass_error:
                        print(f"Failed to bypass email verification: {bypass_error}")
                        # Still return success but with a different message
                        serialized_user = serialize_user_data(user)
                        result = {
                            "message": "User registered successfully. Please contact support to verify your email.",
                            "user": serialized_user,
                            "requires_verification": True,
                            "verification_error": True
                        }
                
                print("Registration completed successfully")
                return result
            else:
                print("No response data from user insertion")
                raise HTTPException(status_code=400, detail="Registration failed")
                
        except Exception as e:
            print(f"Registration error: {str(e)}")
            print(f"Error type: {type(e)}")
            raise HTTPException(status_code=400, detail=str(e))
    
    async def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """Login user with email/password"""
        try:
            print(f"Starting login for: {email}")
            
            # Validate password length (bcrypt limit is 72 bytes)
            if len(password.encode('utf-8')) > 72:
                raise HTTPException(
                    status_code=400, 
                    detail="Password is too long. Maximum length is 72 bytes."
                )
            
            # Get user by email
            print("Fetching user from database...")
            user_response = self.supabase.table("users").select("*").eq("email", email).single().execute()
            
            if not user_response.data:
                print(f"User not found: {email}")
                raise HTTPException(status_code=401, detail="Invalid credentials")
            
            user = user_response.data
            print(f"User found: {user.get('id')}")
            
            # Verify password
            print("Verifying password...")
            try:
                password_valid = self._verify_password(password, user["password_hash"])
                print(f"Password verification result: {password_valid}")
            except Exception as e:
                print(f"Error verifying password: {e}")
                raise HTTPException(status_code=401, detail="Invalid credentials")
            
            if not password_valid:
                print("Password verification failed")
                raise HTTPException(status_code=401, detail="Invalid credentials")
            
            print("Password verified successfully")
            
            # Check if email is verified (skip for test users)
            if user.get("email_verified") is False:
                print("Email not verified")
                raise HTTPException(status_code=401, detail="Email not verified. Please check your inbox.")

            # Update last login - handle potential database schema issues
            try:
                self.supabase.table("users").update({
                    "last_login": datetime.now().isoformat()
                }).eq("id", user["id"]).execute()
            except Exception as e:
                print(f"Warning: Could not update last_login: {e}")
                # Continue without updating last_login
            
            # Create session
            session_tokens = await self._create_user_session(user["id"])
            
            # Serialize user data to handle datetime objects
            serialized_user = serialize_user_data(user)
            
            return {
                "access_token": session_tokens["access_token"],
                "refresh_token": session_tokens["refresh_token"],
                "token_type": "bearer",
                "expires_in": self.access_token_expire_minutes * 60,
                "user": serialized_user
            }
                
        except HTTPException:
            # Re-raise HTTP exceptions (they already have proper status codes)
            raise
        except Exception as e:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    async def oauth_login(self, provider: str, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Handle OAuth login flow"""
        try:
            # Exchange code for tokens
            tokens = await self._exchange_oauth_code(provider, code, redirect_uri)
            
            # Get user info from provider
            user_info = await self._get_oauth_user_info(provider, tokens["access_token"])
            
            # Find or create user
            user = await self._find_or_create_oauth_user(provider, user_info, tokens)
            
            # Create session
            session_tokens = await self._create_user_session(user["id"])
            
            # Serialize user data to handle datetime objects
            serialized_user = serialize_user_data(user)
            
            return {
                "access_token": session_tokens["access_token"],
                "refresh_token": session_tokens["refresh_token"],
                "token_type": "bearer",
                "expires_in": self.access_token_expire_minutes * 60,
                "user": serialized_user
            }
            
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    async def _exchange_oauth_code(self, provider: str, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange OAuth authorization code for tokens"""
        oauth_configs = {
            "google": {
                "token_url": "https://oauth2.googleapis.com/token",
                "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                "client_secret": os.getenv("GOOGLE_CLIENT_SECRET")
            },
            "github": {
                "token_url": "https://github.com/login/oauth/access_token",
                "client_id": os.getenv("GITHUB_CLIENT_ID"),
                "client_secret": os.getenv("GITHUB_CLIENT_SECRET")
            }
        }
        
        config = oauth_configs.get(provider)
        if not config:
            raise HTTPException(status_code=400, detail="Unsupported OAuth provider")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                config["token_url"],
                data={
                    "client_id": config["client_id"],
                    "client_secret": config["client_secret"],
                    "code": code,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code"
                },
                headers={"Accept": "application/json"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="OAuth token exchange failed")
            
            return response.json()
    
    async def _get_oauth_user_info(self, provider: str, access_token: str) -> Dict[str, Any]:
        """Get user information from OAuth provider"""
        user_info_urls = {
            "google": "https://www.googleapis.com/oauth2/v2/userinfo",
            "github": "https://api.github.com/user"
        }
        
        url = user_info_urls.get(provider)
        if not url:
            raise HTTPException(status_code=400, detail="Unsupported OAuth provider")
        
        headers = {"Authorization": f"Bearer {access_token}"}
        if provider == "github":
            headers["Accept"] = "application/vnd.github.v3+json"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to get user info")
            
            return response.json()
    
    async def _find_or_create_oauth_user(self, provider: str, user_info: Dict[str, Any], tokens: Dict[str, Any]) -> Dict[str, Any]:
        """Find existing user or create new one from OAuth data"""
        provider_user_id = str(user_info.get("id") or user_info.get("sub"))
        email = user_info.get("email")
        
        # Check if user exists
        existing_user = self.supabase.table("users").select("*").eq("email", email).single().execute()
        
        if existing_user.data:
            user = existing_user.data
            # Update OAuth connection
            now = datetime.now()
            self.supabase.table("oauth_connections").upsert({
                "user_id": user["id"],
                "provider": provider,
                "provider_user_id": provider_user_id,
                "access_token": tokens.get("access_token"),
                "refresh_token": tokens.get("refresh_token"),
                "expires_at": (now + timedelta(seconds=tokens.get("expires_in", 3600))).isoformat()
            }).execute()
        else:
            # Create new user with only the columns that exist in the database
            user_data = {
                "id": str(uuid.uuid4()),
                "email": email,
                "display_name": user_info.get("name") or user_info.get("login") or email.split('@')[0],
                "avatar_url": user_info.get("picture") or user_info.get("avatar_url"),
                "auth_provider": provider,
                "provider_user_id": provider_user_id,
                "email_verified": True,
                "level": 1,  # Set level to 1 for new OAuth users
                "elo": 0,
                "is_active": True,
                "preferences": {}
            }
            
            user_response = self.supabase.table("users").insert(user_data).execute()
            user = user_response.data[0]
            
            # Create OAuth connection
            now = datetime.now()
            self.supabase.table("oauth_connections").insert({
                "user_id": user["id"],
                "provider": provider,
                "provider_user_id": provider_user_id,
                "access_token": tokens.get("access_token"),
                "refresh_token": tokens.get("refresh_token"),
                "expires_at": (now + timedelta(seconds=tokens.get("expires_in", 3600))).isoformat()
            }).execute()
        
        return serialize_user_data(user)
    
    async def _create_user_session(self, user_id: str) -> Dict[str, str]:
        """Create user session and return tokens"""
        now = datetime.now()
        access_exp = now + timedelta(minutes=self.access_token_expire_minutes)
        refresh_exp = now + timedelta(days=7)
        
        # Convert datetime objects to timestamps for JWT
        access_exp_timestamp = int(access_exp.timestamp())
        refresh_exp_timestamp = int(refresh_exp.timestamp())
        
        access_token = jwt.encode(
            {"sub": user_id, "exp": access_exp_timestamp},
            self.jwt_secret,
            algorithm=self.jwt_algorithm
        )
        
        refresh_token = jwt.encode(
            {"sub": user_id, "type": "refresh", "exp": refresh_exp_timestamp},
            self.jwt_secret,
            algorithm=self.jwt_algorithm
        )
        
        # Store session in database - handle potential database schema issues
        try:
            self.supabase.table("user_sessions").insert({
                "user_id": user_id,
                "session_token": access_token,
                "refresh_token": refresh_token,
                "expires_at": access_exp.isoformat()
            }).execute()
        except Exception as e:
            print(f"Warning: Could not store session in database: {e}")
            # Continue without storing session in database
            # The tokens are still valid for the current request
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token
        }
    
    async def refresh_token(self, refresh_token: str) -> Dict[str, str]:
        """Refresh access token using refresh token"""
        try:
            payload = jwt.decode(refresh_token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            user_id = payload.get("sub")
            
            if not user_id or payload.get("type") != "refresh":
                raise HTTPException(status_code=401, detail="Invalid refresh token")
            
            # Verify refresh token exists in database
            session = self.supabase.table("user_sessions").select("*").eq("refresh_token", refresh_token).single().execute()
            
            if not session.data:
                raise HTTPException(status_code=401, detail="Invalid refresh token")
            
            # Create new tokens
            new_tokens = await self._create_user_session(user_id)
            
            # Invalidate old session
            self.supabase.table("user_sessions").delete().eq("refresh_token", refresh_token).execute()
            
            return new_tokens
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Refresh token has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        except Exception as e:
            print(f"Error refreshing token: {e}")
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    async def logout(self, user_id: str, refresh_token: str = None):
        """Logout user and invalidate sessions"""
        if refresh_token:
            self.supabase.table("user_sessions").delete().eq("refresh_token", refresh_token).execute()
        else:
            self.supabase.table("user_sessions").delete().eq("user_id", user_id).execute()
    
    async def get_current_user(self, token: str) -> Dict[str, Any]:
        """Get current user from JWT token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            user_id = payload.get("sub")
            
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token")
            
            # Get user from database
            user_response = self.supabase.table("users").select("*").eq("id", user_id).single().execute()
            
            if not user_response.data:
                raise HTTPException(status_code=401, detail="User not found")
            
            # Serialize user data to handle datetime objects
            return serialize_user_data(user_response.data)
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
        except Exception as e:
            print(f"Error getting current user: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")

# Global auth service instance
auth_service = AuthService() 