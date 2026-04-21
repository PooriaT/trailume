from app.core.config import Settings


def test_default_ollama_model_is_gemma4() -> None:
    settings = Settings()
    assert settings.ollama_model == "gemma4"


def test_default_ollama_generation_settings_are_safe_for_grounded_output() -> None:
    settings = Settings()
    assert settings.ollama_temperature == 0.2
    assert settings.ollama_top_p == 0.9
    assert settings.ollama_num_predict == 320


def test_default_cookie_settings_are_local_dev_friendly() -> None:
    settings = Settings()
    assert settings.session_cookie_secure is False
    assert settings.session_cookie_samesite == "lax"
