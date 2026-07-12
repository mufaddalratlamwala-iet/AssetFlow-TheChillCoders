from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Loaded from environment variables / .env file.
    Backend team: copy .env.example -> .env and fill in OPENAI_API_KEY.
    """
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str
    openai_model: str = "gpt-4.1"

    app_env: str = "development"
    cors_origins: str = "http://localhost:5173"

    max_upload_size_bytes: int = 10 * 1024 * 1024  # 10 MB

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
