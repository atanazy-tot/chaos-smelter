"""Audio transcription service using Gemini via OpenRouter."""

import asyncio
import base64
import logging
import tempfile
from pathlib import Path

from ..config import get_settings
from ..errors import TranscriptionFailedError
from .llm import get_llm_client

logger = logging.getLogger("smelt.audio")

# Supported audio formats - maps extension to OpenRouter format string
AUDIO_FORMATS = {
    ".mp3": "mp3",
    ".wav": "wav",
    ".m4a": "mp3",  # Will be converted to MP3
    ".ogg": "ogg",
    ".flac": "flac",
    ".aac": "mp3",  # Will be converted to MP3
    ".aiff": "aiff",
}

# Formats that need conversion to MP3
NEEDS_CONVERSION = {".m4a", ".aac"}

TRANSCRIPTION_PROMPT = """Transcribe this audio accurately.

RULES:
1. Auto-detect the language of the audio
2. Output the transcription in the SAME language as the audio
3. Format as clean markdown transcript
4. Speaker detection:
   - If names are mentioned or identifiable, use: **John:** sentence
   - If unknown, use: **Speaker 1:** sentence, **Speaker 2:** sentence, etc.
   - Each speaker's line on a new line
5. Remove filler words (um, uh, etc.) but preserve meaning
6. Fix obvious grammar issues while preserving the speaker's voice
7. Do NOT summarize, do NOT add action points, do NOT add headers or sections
8. Just output a clean, verbatim transcript with speaker labels

Output only the transcript, no commentary."""


def get_audio_format(filename: str) -> str | None:
    """Get audio format string from filename."""
    extension = Path(filename).suffix.lower()
    return AUDIO_FORMATS.get(extension)


def is_audio_file(filename: str) -> bool:
    """Check if file is a supported audio format."""
    return get_audio_format(filename) is not None


def needs_conversion(filename: str) -> bool:
    """Check if audio file needs conversion to MP3."""
    extension = Path(filename).suffix.lower()
    return extension in NEEDS_CONVERSION


async def convert_to_mp3(audio_data: bytes, filename: str) -> bytes:
    """
    Convert audio to MP3 using ffmpeg.

    Args:
        audio_data: Raw audio bytes
        filename: Original filename (for format detection)

    Returns:
        MP3 audio bytes

    Raises:
        TranscriptionFailedError: If conversion fails
    """
    extension = Path(filename).suffix.lower()

    with tempfile.NamedTemporaryFile(suffix=extension, delete=False) as input_file:
        input_path = input_file.name
        input_file.write(audio_data)

    output_path = input_path.rsplit(".", 1)[0] + ".mp3"

    try:
        # Run ffmpeg to convert to MP3
        process = await asyncio.create_subprocess_exec(
            "ffmpeg",
            "-i", input_path,
            "-vn",  # No video
            "-acodec", "libmp3lame",
            "-q:a", "2",  # High quality
            "-y",  # Overwrite output
            output_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            logger.error(f"ffmpeg conversion failed: {stderr.decode()}")
            raise TranscriptionFailedError(details=f"Audio conversion failed: {stderr.decode()[:200]}")

        # Read converted file
        with open(output_path, "rb") as f:
            mp3_data = f.read()

        logger.info(f"Converted {filename} ({len(audio_data)} bytes) to MP3 ({len(mp3_data)} bytes)")
        return mp3_data

    finally:
        # Cleanup temp files
        import os
        try:
            os.unlink(input_path)
        except OSError:
            pass
        try:
            os.unlink(output_path)
        except OSError:
            pass


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

    # Convert M4A/AAC to MP3 for better compatibility
    if needs_conversion(filename):
        logger.info(f"Converting {filename} to MP3...")
        audio_data = await convert_to_mp3(audio_data, filename)
        audio_format = "mp3"

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
