from app.core.config import Settings


def test_default_ollama_model_is_gemma4() -> None:
    settings = Settings()
    assert settings.ollama_model == "gemma4"


def test_default_cookie_settings_are_local_dev_friendly() -> None:
    settings = Settings()
    assert settings.session_cookie_secure is False
    assert settings.session_cookie_samesite == "lax"
