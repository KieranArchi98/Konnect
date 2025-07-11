from pydantic import BaseSettings

class Settings(BaseSettings):
    database_url: str = 'postgresql://user:password@localhost:5432/dbname'
    jwt_secret: str = 'your_secret'

    class Config:
        env_file = '../../.env'

settings = Settings()
