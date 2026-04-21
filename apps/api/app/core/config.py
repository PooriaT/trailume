from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_env: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    web_app_url: str = "http://localhost:3000"

    strava_client_id: str = ""
    strava_client_secret: str = ""
    strava_redirect_uri: str = "http://localhost:8000/api/v1/auth/strava/callback"

    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "gemma4"
    ollama_timeout_seconds: int = 45
    ollama_temperature: float = 0.2
    ollama_top_p: float = 0.9
    ollama_num_predict: int = 320

    session_cookie_secure: bool = False
    session_cookie_samesite: Literal["lax", "none", "strict"] = "lax"


settings = Settings()
