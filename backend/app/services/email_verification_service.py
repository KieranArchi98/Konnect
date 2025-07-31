"""
Email verification service for user registration
"""

import random
import string
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException
from app.services.gmail_service import send_gmail_message
from app.utils.config import supabase, settings

class EmailVerificationService:
    def __init__(self):
        self.code_length = 6
        self.code_expiry_minutes = 15
        self.max_resend_attempts = 3
        self.resend_cooldown_minutes = 5
        
        # Create a service role client for bypassing RLS
        self.supabase_service = supabase
    
    def generate_verification_code(self) -> str:
        """Generate a random 6-digit verification code"""
        return ''.join(random.choices(string.digits, k=self.code_length))
    
    def create_verification_code(self, user_id: str, email: str) -> str:
        """Create and store a new verification code"""
        # Invalidate any existing codes for this user
        self._invalidate_existing_codes(user_id)
        
        # Generate new code
        verification_code = self.generate_verification_code()
        expires_at = datetime.now() + timedelta(minutes=self.code_expiry_minutes)
        
        # Store in database using service role to bypass RLS
        try:
            response = self.supabase_service.table("email_verification_codes").insert({
                "user_id": user_id,
                "email": email,
                "verification_code": verification_code,
                "expires_at": expires_at.isoformat(),
                "used": False
            }).execute()
            
            if not response.data:
                raise HTTPException(status_code=500, detail="Failed to create verification code")
                
            return verification_code
        except Exception as e:
            print(f"Error creating verification code: {e}")
            raise HTTPException(status_code=500, detail="Failed to create verification code")
    
    def send_verification_email(self, email: str, verification_code: str, display_name: str = None) -> bool:
        """Send verification email with the code"""
        try:
            subject = "Verify Your Email - Agent Dashboard"
            
            # Create HTML email template
            html_body = self._create_email_template(verification_code, display_name)
            
            # Send email
            result = send_gmail_message(email, subject, html_body)
            
            if result.get("status") == "sent":
                print(f"Verification email sent successfully to {email}")
                return True
            else:
                print(f"Failed to send verification email: {result.get('error')}")
                return False
                
        except Exception as e:
            print(f"Error sending verification email: {e}")
            return False
    
    def verify_code(self, email: str, verification_code: str) -> Dict[str, Any]:
        """Verify the provided code and update user status"""
        try:
            # Find the verification code
            response = self.supabase_service.table("email_verification_codes").select("*").eq("email", email).eq("verification_code", verification_code).eq("used", False).single().execute()
            
            if not response.data:
                raise HTTPException(status_code=400, detail="Invalid or expired verification code")
            
            code_data = response.data
            
            # Check if code is expired
            expires_at = datetime.fromisoformat(code_data["expires_at"].replace('Z', '+00:00'))
            if datetime.now(expires_at.tzinfo) > expires_at:
                raise HTTPException(status_code=400, detail="Verification code has expired")
            
            # Mark code as used
            self.supabase_service.table("email_verification_codes").update({"used": True}).eq("id", code_data["id"]).execute()
            
            # Update user's email_verified status
            user_response = self.supabase_service.table("users").update({"email_verified": True}).eq("id", code_data["user_id"]).execute()
            
            if not user_response.data:
                raise HTTPException(status_code=500, detail="Failed to update user verification status")
            
            return {
                "success": True,
                "user_id": code_data["user_id"],
                "email": email
            }
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error verifying code: {e}")
            raise HTTPException(status_code=500, detail="Failed to verify code")
    
    def can_resend_code(self, email: str) -> bool:
        """Check if user can request a new verification code"""
        try:
            # Check for recent codes
            cutoff_time = datetime.now() - timedelta(minutes=self.resend_cooldown_minutes)
            
            response = self.supabase_service.table("email_verification_codes").select("created_at").eq("email", email).gte("created_at", cutoff_time.isoformat()).execute()
            
            # Allow resend if no recent codes or less than max attempts
            return len(response.data) < self.max_resend_attempts
            
        except Exception as e:
            print(f"Error checking resend eligibility: {e}")
            return False
    
    def resend_verification_code(self, email: str) -> bool:
        """Resend verification code for existing user"""
        try:
            # Get user by email
            user_response = self.supabase_service.table("users").select("id, display_name").eq("email", email).single().execute()
            
            if not user_response.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_data = user_response.data
            
            # Check if email is already verified
            if user_data.get("email_verified", False):
                raise HTTPException(status_code=400, detail="Email is already verified")
            
            # Check if can resend
            if not self.can_resend_code(email):
                raise HTTPException(status_code=429, detail="Too many resend attempts. Please wait before trying again.")
            
            # Create new verification code
            verification_code = self.create_verification_code(user_data["id"], email)
            
            # Send email
            return self.send_verification_email(email, verification_code, user_data.get("display_name"))
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error resending verification code: {e}")
            raise HTTPException(status_code=500, detail="Failed to resend verification code")
    
    def _invalidate_existing_codes(self, user_id: str):
        """Mark all existing codes for a user as used"""
        try:
            self.supabase_service.table("email_verification_codes").update({"used": True}).eq("user_id", user_id).eq("used", False).execute()
        except Exception as e:
            print(f"Error invalidating existing codes: {e}")
    
    def _create_email_template(self, verification_code: str, display_name: str = None) -> str:
        """Create HTML email template for verification"""
        name = display_name or "there"
        
        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
            <style>
                body {{
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f5f3ef;
                }}
                .container {{
                    background-color: #ffffff;
                    border-radius: 12px;
                    padding: 40px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .logo {{
                    font-size: 24px;
                    font-weight: 700;
                    color: #5A6570;
                    margin-bottom: 10px;
                }}
                .title {{
                    font-size: 28px;
                    font-weight: 700;
                    color: #111827;
                    margin-bottom: 20px;
                }}
                .verification-code {{
                    background: linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%);
                    color: #111827;
                    font-size: 36px;
                    font-weight: 800;
                    text-align: center;
                    padding: 24px;
                    border-radius: 12px;
                    margin: 30px 0;
                    letter-spacing: 6px;
                    border: 3px solid #5A6570;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    font-family: 'Courier New', monospace;
                }}
                .message {{
                    font-size: 16px;
                    color: #374151;
                    margin-bottom: 20px;
                    line-height: 1.7;
                }}
                .warning {{
                    background-color: #FEF3C7;
                    border: 1px solid #F59E0B;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 20px 0;
                    font-size: 14px;
                    color: #92400E;
                }}
                .footer {{
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #E5E7EB;
                    text-align: center;
                    font-size: 14px;
                    color: #9CA3AF;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">Agent Dashboard</div>
                    <div class="title">Verify Your Email</div>
                </div>
                
                <div class="message">
                    Hi {name},<br><br>
                    Thanks for signing up! To complete your registration, please enter the verification code below:
                </div>
                
                <div class="verification-code">
                    <strong>{verification_code}</strong>
                </div>
                
                <div class="message">
                    This code will expire in 15 minutes for security reasons.
                </div>
                
                <div class="warning">
                    <strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for your verification code.
                </div>
                
                <div class="footer">
                    <p>If you didn't create an account, you can safely ignore this email.</p>
                    <p>© 2024 Agent Dashboard. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html_template

# Create global instance
email_verification_service = EmailVerificationService() 