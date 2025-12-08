"""Custom exceptions with neobrutalist, ironic error messages."""

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class ErrorCode(str, Enum):
    """Error codes for frontend mapping."""

    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    UNSUPPORTED_FORMAT = "UNSUPPORTED_FORMAT"
    TRANSCRIPTION_FAILED = "TRANSCRIPTION_FAILED"
    SYNTHESIS_FAILED = "SYNTHESIS_FAILED"
    RATE_LIMITED = "RATE_LIMITED"
    ENCODING_ERROR = "ENCODING_ERROR"
    LLM_TIMEOUT = "LLM_TIMEOUT"
    UNKNOWN = "UNKNOWN"


@dataclass
class SmeltError(Exception):
    """Base exception for SMELT errors."""

    code: ErrorCode
    message: str
    http_status: int = 500
    details: Optional[str] = None

    def __str__(self) -> str:
        return self.message


class FileTooLargeError(SmeltError):
    """Raised when file exceeds size limit."""

    def __init__(self, max_size_mb: int, actual_size_mb: float):
        super().__init__(
            code=ErrorCode.FILE_TOO_LARGE,
            message=f"FILE TOO CHUNKY. MAX {max_size_mb}MB.",
            http_status=413,
            details=f"Actual size: {actual_size_mb:.1f}MB",
        )


class UnsupportedFormatError(SmeltError):
    """Raised when file format is not supported."""

    def __init__(self, extension: str):
        super().__init__(
            code=ErrorCode.UNSUPPORTED_FORMAT,
            message="CAN'T READ THAT. TRY .TXT .MD .MP3 .WAV .M4A .OGG",
            http_status=415,
            details=f"Got: {extension}",
        )


class TranscriptionFailedError(SmeltError):
    """Raised when audio transcription fails."""

    def __init__(self, details: Optional[str] = None):
        super().__init__(
            code=ErrorCode.TRANSCRIPTION_FAILED,
            message="THE ROBOTS COULDN'T HEAR THAT.",
            http_status=502,
            details=details,
        )


class SynthesisFailedError(SmeltError):
    """Raised when LLM synthesis fails."""

    def __init__(self, details: Optional[str] = None):
        super().__init__(
            code=ErrorCode.SYNTHESIS_FAILED,
            message="BRAIN MALFUNCTION. TRY AGAIN.",
            http_status=502,
            details=details,
        )


class RateLimitedError(SmeltError):
    """Raised when rate limited by the API."""

    def __init__(self, retry_after: int = 60):
        super().__init__(
            code=ErrorCode.RATE_LIMITED,
            message=f"CHILL. RATE LIMITED FOR {retry_after}s.",
            http_status=429,
            details=f"Retry after: {retry_after}s",
        )
        self.retry_after = retry_after


class EncodingError(SmeltError):
    """Raised when file encoding is not UTF-8."""

    def __init__(self, details: Optional[str] = None):
        super().__init__(
            code=ErrorCode.ENCODING_ERROR,
            message="WEIRD CHARACTERS. USE UTF-8.",
            http_status=400,
            details=details,
        )


class LLMTimeoutError(SmeltError):
    """Raised when LLM request times out after retries."""

    def __init__(self, details: Optional[str] = None):
        super().__init__(
            code=ErrorCode.LLM_TIMEOUT,
            message="ROBOTS TOO SLOW. TRY AGAIN.",
            http_status=504,
            details=details,
        )


class LLMError(SmeltError):
    """Generic LLM error."""

    def __init__(self, details: Optional[str] = None):
        super().__init__(
            code=ErrorCode.UNKNOWN,
            message="SOMETHING BROKE. NOT YOUR FAULT. MAYBE.",
            http_status=500,
            details=details,
        )
