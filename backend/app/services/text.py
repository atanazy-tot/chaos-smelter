"""Text file processing service."""

import logging
from pathlib import Path

from ..errors import EncodingError, UnsupportedFormatError

logger = logging.getLogger("smelt.text")

# Supported text formats
TEXT_FORMATS = {".txt", ".md"}


def is_text_file(filename: str) -> bool:
    """Check if file is a supported text format."""
    extension = Path(filename).suffix.lower()
    return extension in TEXT_FORMATS


def decode_text_file(data: bytes, filename: str) -> str:
    """
    Decode text file content from bytes to string.

    Args:
        data: Raw file bytes
        filename: Original filename (for error messages)

    Returns:
        Decoded text content

    Raises:
        EncodingError: If file is not valid UTF-8
        UnsupportedFormatError: If file format is not supported
    """
    extension = Path(filename).suffix.lower()

    if extension not in TEXT_FORMATS:
        raise UnsupportedFormatError(extension=extension)

    try:
        content = data.decode("utf-8")
        logger.info(f"Decoded {filename}: {len(content)} characters")
        return content
    except UnicodeDecodeError as e:
        logger.error(f"Encoding error in {filename}: {e}")
        raise EncodingError(details=f"Position {e.start}: {e.reason}")
