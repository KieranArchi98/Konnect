from pydantic_settings import BaseSettings
from supabase import create_client, Client

class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    news_api_key: str
    supabase_url: str
    supabase_key: str
    pinecone_api_key: str
    pinecone_env: str
    pinecone_index: str
    openai_api_key: str

    class Config:
        env_file = '../.env'
        env_file_encoding = 'utf-8'
        extra = 'allow'

settings = Settings()
supabase: Client = create_client(settings.supabase_url, settings.supabase_key)
