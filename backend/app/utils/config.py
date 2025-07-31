from pydantic_settings import BaseSettings
from supabase import create_client, Client

class Settings(BaseSettings):
    jwt_secret: str
    news_api_key: str
    supabase_url: str
    supabase_key: str
    pinecone_api_key: str
    pinecone_env: str
    pinecone_index: str
    openai_api_key: str
    gmail_client_id: str = ''
    gmail_client_secret: str = ''
    gmail_refresh_token: str = ''
    gmail_sender_email: str = ''
    gmail_use_app_password: bool = False
    gmail_app_password: str = ''
    # Email verification configuration
    enable_email_verification: bool = True  # Set to True to enable email verification
    email_verification_timeout: int = 60  # Timeout in seconds for email sending

    class Config:
        env_file = '../.env'
        env_file_encoding = 'utf-8'
        extra = 'allow'

settings = Settings()
supabase: Client = create_client(settings.supabase_url, settings.supabase_key)
