"""
Gmail service with support for both OAuth and App Password authentication
"""

import os
import base64
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import signal
import platform
from app.utils.config import settings

def _set_timeout(seconds: int):
    """Set timeout that works on both Windows and Unix systems"""
    if platform.system() != 'Windows':
        # Unix/Linux systems can use SIGALRM
        def timeout_handler(signum, frame):
            raise TimeoutError("Request timed out")
        
        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(seconds)
        return True
    else:
        # Windows doesn't support SIGALRM, so we'll skip timeout
        return False

def _clear_timeout():
    """Clear timeout that works on both Windows and Unix systems"""
    if platform.system() != 'Windows':
        signal.alarm(0)  # Cancel the alarm

def send_gmail_oauth(to_email: str, subject: str, body: str) -> dict:
    """Send email using Gmail OAuth"""
    print(f"[GMAIL OAUTH] Preparing to send email to: {to_email}, subject: {subject}")
    try:
        # Set timeout only on Unix systems
        timeout_set = _set_timeout(30)
        
        try:
            creds = Credentials(
                token=None,
                refresh_token=settings.gmail_refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=settings.gmail_client_id,
                client_secret=settings.gmail_client_secret,
                scopes=["https://www.googleapis.com/auth/gmail.send"],
            )
            print(f"[GMAIL OAUTH] Credentials created. Building Gmail service...")
            service = build("gmail", "v1", credentials=creds)
            
            # Detect if body contains HTML
            is_html = '<html>' in body.lower() or '<!doctype html>' in body.lower()
            message = MIMEText(body, 'html' if is_html else 'plain')
            
            message["to"] = to_email
            message["from"] = settings.gmail_sender_email
            message["subject"] = subject
            raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
            print(f"[GMAIL OAUTH] Sending message via Gmail API...")
            send_message = service.users().messages().send(userId="me", body={"raw": raw}).execute()
            print(f"[GMAIL OAUTH] Gmail API response: {send_message}")
            return {"status": "sent", "id": send_message.get("id")}
        finally:
            if timeout_set:
                _clear_timeout()
    except TimeoutError:
        print(f"[GMAIL OAUTH] Request timed out")
        return {"status": "failed", "error": "Request timed out"}
    except Exception as e:
        print(f"[GMAIL OAUTH] Error sending email: {e}")
        return {"status": "failed", "error": str(e)}

def send_gmail_app_password(to_email: str, subject: str, body: str) -> dict:
    """Send email using Gmail App Password (SMTP)"""
    print(f"[GMAIL APP PASSWORD] Preparing to send email to: {to_email}, subject: {subject}")
    try:
        # Set timeout only on Unix systems
        timeout_set = _set_timeout(30)
        
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = settings.gmail_sender_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Detect if body contains HTML
            is_html = '<html>' in body.lower() or '<!doctype html>' in body.lower()
            msg.attach(MIMEText(body, 'html' if is_html else 'plain'))
            
            # Create SMTP session
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            
            # Login with app password
            server.login(settings.gmail_sender_email, settings.gmail_app_password)
            
            # Send email
            text = msg.as_string()
            server.sendmail(settings.gmail_sender_email, to_email, text)
            server.quit()
            
            print(f"[GMAIL APP PASSWORD] Email sent successfully")
            return {"status": "sent", "id": "smtp_sent"}
        finally:
            if timeout_set:
                _clear_timeout()
        
    except TimeoutError:
        print(f"[GMAIL APP PASSWORD] Request timed out")
        return {"status": "failed", "error": "Request timed out"}
    except Exception as e:
        print(f"[GMAIL APP PASSWORD] Error sending email: {e}")
        return {"status": "failed", "error": str(e)}

def send_gmail_message(to_email: str, subject: str, body: str) -> dict:
    """Send email using the preferred method (OAuth or App Password)"""
    
    # Check if app password is configured
    use_app_password = getattr(settings, 'gmail_use_app_password', False)
    
    if use_app_password and hasattr(settings, 'gmail_app_password') and settings.gmail_app_password:
        print(f"[GMAIL] Using App Password authentication")
        return send_gmail_app_password(to_email, subject, body)
    else:
        print(f"[GMAIL] Using OAuth authentication")
        return send_gmail_oauth(to_email, subject, body) 