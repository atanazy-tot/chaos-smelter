"""Audio transcription service using Gemini via OpenRouter."""

import base64
import logging
from pathlib import Path

from ..config import get_settings
from ..errors import TranscriptionFailedError
from .llm import get_llm_client

logger = logging.getLogger("smelt.audio")

# Supported audio formats
AUDIO_FORMATS = {
    ".mp3": "mp3",
    ".wav": "wav",
    ".m4a": "m4a",
    ".ogg": "ogg",
    ".flac": "flac",
    ".aac": "aac",
    ".aiff": "aiff",
}

TRANSCRIPTION_PROMPT = """Transcribe this audio accurately.

RULES:
1. Auto-detect the language of the audio
2. Output the transcription in the SAME language as the audio
3. Format the output as clean markdown
4. Use ## headers to divide into logical sections by topic
5. If multiple speakers, indicate speaker changes with bold text
6. Remove filler words (um, uh, etc.) but preserve meaning
7. Fix obvious grammar issues while preserving the speaker's voice

Output only the transcription, no commentary."""


def get_audio_format(filename: str) -> str | None:
    """Get audio format string from filename."""
    extension = Path(filename).suffix.lower()
    return AUDIO_FORMATS.get(extension)


def is_audio_file(filename: str) -> bool:
    """Check if file is a supported audio format."""
    return get_audio_format(filename) is not None


async def transcribe_audio(audio_data: bytes, filename: str) -> str:
    """
    Transcribe audio using Gemini via OpenRouter.

    Args:
        audio_data: Raw audio bytes
        filename: Original filename (for format detection)

    Returns:
        Transcribed text as markdown

    Raises:
        TranscriptionFailedError: If transcription fails
    """
    settings = get_settings()
    client = get_llm_client()

    audio_format = get_audio_format(filename)
    if not audio_format:
        raise TranscriptionFailedError(details=f"Unknown audio format: {filename}")

    # Encode audio to base64
    audio_base64 = base64.standard_b64encode(audio_data).decode("utf-8")

    logger.info(f"Transcribing {filename} ({audio_format}, {len(audio_data)} bytes)")

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": TRANSCRIPTION_PROMPT},
                {
                    "type": "input_audio",
                    "input_audio": {
                        "data": audio_base64,
                        "format": audio_format,
                    },
                },
            ],
        }
    ]

    try:
        response = await client.complete(
            messages=messages,
            model=settings.openrouter_model_transcription,
            temperature=0.1,  # Low temperature for accurate transcription
            max_tokens=16384,  # Audio can produce long transcripts
        )
        logger.info(f"Transcription complete: {response.tokens_used} tokens")
        return response.content
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise TranscriptionFailedError(details=str(e))
