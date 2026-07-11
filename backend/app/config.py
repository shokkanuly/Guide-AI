"""
GovGuide AI — Application Settings
Uses Pydantic BaseSettings for type-safe env var loading.
"""
from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- App ----
    app_name: str = "GovGuide AI"
    app_env: str = "development"
    app_version: str = "1.0.0"
    debug: bool = True
    secret_key: str

    # ---- Server ----
    host: str = "0.0.0.0"
    port: int = 8000
    allowed_origins: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    # ---- Database ----
    database_url: str
    database_url_sync: str
    db_pool_size: int = 10
    db_max_overflow: int = 20

    # ---- Redis ----
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl_seconds: int = 3600

    # ---- JWT ----
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    # ---- OpenAI ----
    openai_api_key: str = "sk-placeholder"  # Replace with real key for AI features
    openai_model: str = "gpt-4o"
    openai_embedding_model: str = "text-embedding-3-small"
    openai_max_tokens: int = 2048
    openai_temperature: float = 0.3

    # ---- Gemini ----
    gemini_api_key: Optional[str] = None

    # ---- ChromaDB ----
    chroma_host: str = "localhost"
    chroma_port: int = 8001
    chroma_collection_programs: str = "gov_programs"
    chroma_collection_laws: str = "gov_laws"
    chroma_collection_docs: str = "gov_docs"

    # ---- AWS S3 ----
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "ap-southeast-1"
    s3_bucket_name: str = "govguide-documents"
    s3_bucket_url: Optional[str] = None

    # ---- Telegram ----
    telegram_bot_token: Optional[str] = None

    # ---- Email ----
    mail_username: Optional[str] = None
    mail_password: Optional[str] = None
    mail_from: str = "noreply@govguide.kz"
    mail_port: int = 587
    mail_server: str = "smtp.gmail.com"
    mail_tls: bool = True

    # ---- Rate Limiting ----
    rate_limit_chat: str = "30/minute"
    rate_limit_default: str = "100/minute"

    # ---- Feature Flags ----
    enable_ocr: bool = False
    enable_telegram_notifications: bool = True
    enable_email_notifications: bool = True
    enable_proactive_matching: bool = True

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance — call this everywhere."""
    return Settings()


settings = get_settings()
