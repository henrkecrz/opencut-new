"""AI command processing route -- natural language to editor actions."""

import json
import logging

from fastapi import APIRouter, HTTPException

from app.models.command import CommandRequest
from app.services.llm_provider_settings import (
    UpdateLLMProviderSettings,
    get_static_free_models,
    public_llm_provider_settings,
    save_llm_provider_settings,
)
from app.services.model_backend import llm_backend
from app.services.stream_utils import streamed_llm_response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/llm", tags=["command"])

COMMAND_SYSTEM_PROMPT = """\
You are an AI assistant for a video editor called OpenCut AI. The user gives you \
natural-language editing commands and you respond with a JSON object containing \
the actions to perform on the timeline.

Available action types:
- cut: Split a clip at a time point. params: {time: float}
- trim: Trim a clip's start/end. params: {start?: float, end?: float}
- delete: Delete a clip. params: {}
- split: Split a clip at a point. params: {time: float}
- add_text: Add a text overlay. params: {text: str, start: float, duration: float, \
position?: str, fontSize?: int, color?: str}
- add_transition: Add a transition between clips. params: {type: str, duration: float}
- adjust_speed: Change playback speed. params: {speed: float}
- adjust_volume: Change audio volume. params: {volume: float}
- move_clip: Move a clip to a new position. params: {to_track?: str, to_time?: float}
- add_effect: Apply a visual effect. params: {effect: str, intensity?: float}
- add_filter: Apply a color filter. params: {filter: str}
- color_correct: Adjust color properties. params: {brightness?: float, contrast?: float, \
saturation?: float, temperature?: float}
- add_keyframe: Add an animation keyframe. params: {property: str, value: float, time: float}
- fade_in: Add a fade-in. params: {duration: float}
- fade_out: Add a fade-out. params: {duration: float}
- mute: Mute a clip's audio. params: {}
- duplicate: Duplicate a clip. params: {}
- ripple_delete: Delete and close the gap. params: {}

Respond with ONLY a JSON object in this format:
{
  "actions": [{"type": "...", "target": "clip_id or null", "params": {...}}],
  "explanation": "Human-readable explanation of what will happen",
  "confidence": 0.0 to 1.0
}
"""


@router.get("/providers/settings")
async def get_provider_settings() -> dict:
    """Return selected LLM provider settings without exposing stored secrets."""
    return public_llm_provider_settings().model_dump()


@router.post("/providers/settings")
async def update_provider_settings(request: UpdateLLMProviderSettings) -> dict:
    """Save local provider selection and API key for free external models."""
    if request.provider in {"opencode", "openrouter"}:
        allowed = [model.id for model in get_static_free_models(request.provider)]
        if request.model not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Only free {request.provider} models are allowed. Available: {allowed}",
            )
    return save_llm_provider_settings(request).model_dump()


@router.get("/providers/models")
async def get_provider_models() -> dict:
    """Return free model catalog and reasoning levels supported by the UI."""
    return {
        "providers": {
            "opencode": [model.model_dump() for model in get_static_free_models("opencode")],
            "openrouter": [model.model_dump() for model in get_static_free_models("openrouter")],
        },
        "levels": ["low", "medium", "max"],
    }


@router.post("/command")
async def process_command(request: CommandRequest):
    """Process a natural-language editing command.

    Takes a command string and optional timeline state, uses the LLM to
    interpret the command, and returns structured editor actions.
    Streams keepalive pings to prevent timeouts.
    """
    available = await llm_backend.check_available()
    if not available:
        raise HTTPException(
            status_code=503,
            detail="No LLM backend available. Start Ollama/TurboQuant or configure OpenCode/OpenRouter.",
        )

    prompt_parts = [f"User command: {request.command}"]
    if request.timeline_state:
        prompt_parts.append(
            f"\nCurrent timeline state:\n{json.dumps(request.timeline_state, indent=2)}"
        )
    prompt = "\n".join(prompt_parts)

    async def _work():
        data = await llm_backend.generate_json(
            prompt=prompt,
            model=request.model,
            system=COMMAND_SYSTEM_PROMPT,
        )
        actions = [
            {"type": a.get("type"), "target": a.get("target"), "params": a.get("params", {})}
            for a in data.get("actions", [])
        ]
        return {
            "actions": actions,
            "explanation": data.get("explanation", ""),
            "confidence": data.get("confidence", 0.5),
            "raw_response": json.dumps(data),
        }

    return streamed_llm_response(_work, error_detail="Command processing failed.")
