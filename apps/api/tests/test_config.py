from app.core.config import Settings


def test_default_ollama_model_is_gemma4() -> None:
    settings = Settings()
    assert settings.ollama_model == "gemma4"
