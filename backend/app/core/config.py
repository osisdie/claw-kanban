from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "claw-kanban"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/clawkanban"
    REDIS_URL: str = ""
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    FERNET_KEY: str = ""  # generated on first run if empty
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:5178"]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
