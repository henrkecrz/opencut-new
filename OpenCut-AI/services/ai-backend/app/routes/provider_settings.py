"""External LLM provider settings routes."""

from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException

from app.services.llm_provider_settings import (
    FreeLLMModel,
    UpdateLLMProviderSettings,
    get_static_free_models,
    public_llm_provider_settings,
    save_llm_provider_settings,
)

router = APIRouter(prefix="/api/llm/providers", tags=["llm-providers"])


@router.get("/settings")
async def get_settings() -> dict:
    return public_llm_provider_settings().model_dump()


@router.post("/settings")
async def update_settings(request: UpdateLLMProviderSettings) -> dict:
    if request.provider in {"opencode", "openrouter"}:
        allowed = [model.id for model in get_static_free_models(request.provider)]
        if request.model not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Only free {request.provider} models are allowed. Available: {allowed}",
            )
    return save_llm_provider_settings(request).model_dump()


@router.get("/models")
async def list_models() -> dict:
    return {
        "providers": {
            "opencode": [model.model_dump() for model in get_static_free_models("opencode")],
            "openrouter": await _openrouter_free_models_with_fallback(),
        },
        "levels": ["low", "medium", "max"],
    }


async def _openrouter_free_models_with_fallback() -> list[dict]:
    fallback = [model.model_dump() for model in get_static_free_models("openrouter")]
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.get("https://openrouter.ai/api/v1/models")
            response.raise_for_status()
            data = response.json().get("data", [])
    except Exception:
        return fallback

    free_models: list[FreeLLMModel] = []
    for item in data:
        pricing = item.get("pricing") or {}
        if str(pricing.get("prompt")) != "0" or str(pricing.get("completion")) != "0":
            continue
        architecture = item.get("architecture") or {}
        output_modalities = architecture.get("output_modalities") or []
        if "text" not in output_modalities:
            continue
        model_id = item.get("id")
        if not isinstance(model_id, str) or not model_id.endswith(":free"):
            continue
        name = item.get("name") if isinstance(item.get("name"), str) else model_id
        free_models.append(
            FreeLLMModel(
                id=model_id,
                name=name,
                provider="openrouter",
                recommended_level="medium",
                notes="Fetched from OpenRouter public model catalog.",
            )
        )

    if not free_models:
        return fallback
    return [model.model_dump() for model in free_models]
