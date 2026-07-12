from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    mongodb_uri: str
    openai_api_key: str
    openai_extraction_model: str = "gpt-4.1"
    openai_search_model: str = "gpt-4.1-mini"

    app_env: str = "development"
    cors_origins: str = "http://localhost:5173"

    max_upload_size_bytes: int = 10 * 1024 * 1024  # 10 MB

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
