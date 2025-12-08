"""Text synthesis service - cleans and structures messy notes."""

import logging
from pathlib import Path

from ..config import get_settings
from ..errors import SynthesisFailedError
from .llm import get_llm_client

logger = logging.getLogger("smelt.synthesis")

# Load prompt template
PROMPT_PATH = Path(__file__).parent.parent.parent / "prompts" / "synthesize.md"


def _load_prompt() -> str:
    """Load synthesis prompt from file."""
    try:
        return PROMPT_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        logger.warning(f"Prompt file not found: {PROMPT_PATH}, using default")
        return """Clean and structure this text as markdown.
Detect the language and output in the same language.
Fix grammar, organize with headers, use bullet points for lists.
Output only the cleaned markdown."""


async def synthesize_text(raw_text: str) -> str:
    """
    Clean and structure messy text using LLM.

    Args:
        raw_text: Raw, messy text content

    Returns:
        Clean, structured markdown

    Raises:
        SynthesisFailedError: If synthesis fails
    """
    settings = get_settings()
    client = get_llm_client()

    system_prompt = _load_prompt()

    logger.info(f"Synthesizing {len(raw_text)} characters")

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": raw_text},
    ]

    try:
        response = await client.complete(
            messages=messages,
            model=settings.openrouter_model_synthesis,
            temperature=0.3,
            max_tokens=8192,
        )
        logger.info(f"Synthesis complete: {response.tokens_used} tokens")
        return response.content
    except Exception as e:
        logger.error(f"Synthesis failed: {e}")
        raise SynthesisFailedError(details=str(e))
