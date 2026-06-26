"""Provider selection and safe local persistence for external free LLMs."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

from app.config import settings

LLMProvider = Literal["ollama", "turboquant", "opencode", "openrouter"]
LLMLevel = Literal["low", "medium", "max"]


class FreeLLMModel(BaseModel):
    id: str
    name: str
    provider: str
    free: bool = True
    recommended_level: LLMLevel = "medium"
    notes: str = ""


class LLMLevelOptions(BaseModel):
    temperature: float
    max_tokens: int
    reasoning_effort: str


class LLMProviderSettings(BaseModel):
    provider: LLMProvider = "ollama"
    model: str = "llama3.2:1b"
    level: LLMLevel = "medium"
    opencode_api_key: str = ""
    openrouter_api_key: str = ""


class PublicLLMProviderSettings(BaseModel):
    provider: LLMProvider
    model: str
    level: LLMLevel
    opencode_key_configured: bool
    openrouter_key_configured: bool


class UpdateLLMProviderSettings(BaseModel):
    provider: LLMProvider
    model: str
    level: LLMLevel = "medium"
    opencode_api_key: str | None = Field(default=None)
    openrouter_api_key: str | None = Field(default=None)


LEVEL_OPTIONS: dict[LLMLevel, LLMLevelOptions] = {
    "low": LLMLevelOptions(temperature=0.2, max_tokens=1024, reasoning_effort="low"),
    "medium": LLMLevelOptions(temperature=0.5, max_tokens=2048, reasoning_effort="medium"),
    "max": LLMLevelOptions(temperature=0.7, max_tokens=4096, reasoning_effort="max"),
}

STATIC_FREE_MODELS: dict[str, list[FreeLLMModel]] = {
    "opencode": [
        FreeLLMModel(id="opencode/deepseek-v4-flash-free", name="DeepSeek V4 Flash Free", provider="opencode", recommended_level="medium"),
        FreeLLMModel(id="opencode/mimo-v2.5-free", name="MiMo-V2.5 Free", provider="opencode", recommended_level="medium"),
        FreeLLMModel(id="opencode/north-mini-code-free", name="North Mini Code Free", provider="opencode", recommended_level="low"),
        FreeLLMModel(id="opencode/nemotron-3-ultra-free", name="Nemotron 3 Ultra Free", provider="opencode", recommended_level="max"),
        FreeLLMModel(id="opencode/big-pickle", name="Big Pickle", provider="opencode", recommended_level="medium"),
    ],
    "openrouter": [
        FreeLLMModel(id="cohere/north-mini-code:free", name="Cohere: North Mini Code (free)", provider="openrouter", recommended_level="low"),
        FreeLLMModel(id="nvidia/nemotron-3-ultra-550b-a55b:free", name="NVIDIA: Nemotron 3 Ultra (free)", provider="openrouter", recommended_level="max"),
    ],
}


def _settings_path() -> Path:
    return Path(settings.GENERATED_DIR) / "llm_provider_settings.json"


def _from_env() -> LLMProviderSettings:
    provider = os.getenv("OPENCUTAI_LLM_PROVIDER", "ollama")
    if provider not in {"ollama", "turboquant", "opencode", "openrouter"}:
        provider = "ollama"

    return LLMProviderSettings(
        provider=provider,  # type: ignore[arg-type]
        model=os.getenv("OPENCUTAI_LLM_MODEL", "llama3.2:1b"),
        level=os.getenv("OPENCUTAI_LLM_LEVEL", "medium") if os.getenv("OPENCUTAI_LLM_LEVEL", "medium") in LEVEL_OPTIONS else "medium",  # type: ignore[arg-type]
        opencode_api_key=os.getenv("OPENCUTAI_OPENCODE_API_KEY", ""),
        openrouter_api_key=os.getenv("OPENCUTAI_OPENROUTER_API_KEY", ""),
    )


def get_llm_provider_settings() -> LLMProviderSettings:
    path = _settings_path()
    if path.exists():
        try:
            return LLMProviderSettings.model_validate_json(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return _from_env()


def save_llm_provider_settings(update: UpdateLLMProviderSettings) -> PublicLLMProviderSettings:
    current = get_llm_provider_settings()
    next_settings = LLMProviderSettings(
        provider=update.provider,
        model=update.model,
        level=update.level,
        opencode_api_key=current.opencode_api_key,
        openrouter_api_key=current.openrouter_api_key,
    )

    if update.opencode_api_key is not None:
        next_settings.opencode_api_key = update.opencode_api_key.strip()
    if update.openrouter_api_key is not None:
        next_settings.openrouter_api_key = update.openrouter_api_key.strip()

    path = _settings_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(next_settings.model_dump_json(indent=2), encoding="utf-8")
    return public_llm_provider_settings(next_settings)


def public_llm_provider_settings(settings_value: LLMProviderSettings | None = None) -> PublicLLMProviderSettings:
    current = settings_value or get_llm_provider_settings()
    return PublicLLMProviderSettings(
        provider=current.provider,
        model=current.model,
        level=current.level,
        opencode_key_configured=bool(current.opencode_api_key),
        openrouter_key_configured=bool(current.openrouter_api_key),
    )


def get_level_options(level: LLMLevel | str) -> LLMLevelOptions:
    if level not in LEVEL_OPTIONS:
        return LEVEL_OPTIONS["medium"]
    return LEVEL_OPTIONS[level]  # type: ignore[index]


def get_static_free_models(provider: str) -> list[FreeLLMModel]:
    return STATIC_FREE_MODELS.get(provider, [])


def resolve_external_model_id(provider: str, model: str) -> str:
    if provider == "opencode" and model.startswith("opencode/"):
        return model.removeprefix("opencode/")
    return model
