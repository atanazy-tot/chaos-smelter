"""WebSocket endpoint for file processing with progress streaming."""

import base64
import json
import logging
import sys
from dataclasses import dataclass
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..config import get_settings
from ..errors import ErrorCode, FileTooLargeError, SmeltError, UnsupportedFormatError
from ..services.audio import is_audio_file, transcribe_audio
from ..services.synthesis import synthesize_text
from ..services.text import decode_text_file, is_text_file

# Configure logging to actually show our logs
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("smelt.process")
logger.setLevel(logging.DEBUG)

router = APIRouter()


@dataclass
class FileInput:
    """File data from WebSocket message."""

    name: str
    data: str  # base64 encoded
    mime: str


@dataclass
class ProcessMessage:
    """Incoming process request."""

    type: str
    files: list[FileInput]
    text: Optional[str]


class ProgressReporter:
    """Helper to send progress updates over WebSocket."""

    def __init__(self, websocket: WebSocket, filename: str):
        self.websocket = websocket
        self.filename = filename

    async def report(self, percent: int, status: str):
        """Send progress update."""
        await self.websocket.send_json(
            {
                "type": "progress",
                "file": self.filename,
                "percent": percent,
                "status": status,
            }
        )

    async def complete(self, content: str):
        """Send completion message."""
        await self.websocket.send_json(
            {
                "type": "complete",
                "file": self.filename,
                "content": content,
            }
        )

    async def error(self, error: SmeltError):
        """Send error message."""
        await self.websocket.send_json(
            {
                "type": "error",
                "file": self.filename,
                "message": error.message,
                "code": error.code.value,
            }
        )


async def process_file(
    file: FileInput,
    reporter: ProgressReporter,
    max_size_bytes: int,
) -> None:
    """Process a single file with progress reporting."""
    try:
        # 10% - Validate format
        await reporter.report(10, "VALIDATING...")

        if not is_audio_file(file.name) and not is_text_file(file.name):
            raise UnsupportedFormatError(extension=file.name.split(".")[-1] if "." in file.name else "unknown")

        # 20% - Decode base64
        await reporter.report(20, "DECODING...")
        try:
            file_bytes = base64.b64decode(file.data)
        except Exception as e:
            raise SmeltError(
                code=ErrorCode.UNKNOWN,
                message="CORRUPTED DATA. TRY AGAIN.",
                details=str(e),
            )

        # Check file size
        actual_size = len(file_bytes)
        if actual_size > max_size_bytes:
            settings = get_settings()
            raise FileTooLargeError(
                max_size_mb=settings.max_file_size_mb,
                actual_size_mb=actual_size / (1024 * 1024),
            )

        # Process based on type
        if is_audio_file(file.name):
            # 30% - Start transcription
            await reporter.report(30, "TRANSCRIBING...")

            # Transcription (30-70%)
            transcript = await transcribe_audio(file_bytes, file.name)

            # 70% - Start synthesis
            await reporter.report(70, "SYNTHESIZING...")

            # Synthesize the transcript
            result = await synthesize_text(transcript)

        else:
            # Text file
            await reporter.report(40, "READING...")

            # Decode text
            raw_text = decode_text_file(file_bytes, file.name)

            # 60% - Start synthesis
            await reporter.report(60, "SYNTHESIZING...")

            # Synthesize
            result = await synthesize_text(raw_text)

        # 100% - Complete
        await reporter.report(100, "DONE")
        await reporter.complete(result)

    except SmeltError as e:
        logger.error(f"Error processing {file.name}: {e}")
        await reporter.error(e)
    except Exception as e:
        logger.exception(f"Unexpected error processing {file.name}")
        await reporter.error(
            SmeltError(
                code=ErrorCode.UNKNOWN,
                message="SOMETHING BROKE. NOT YOUR FAULT. MAYBE.",
                details=str(e),
            )
        )


async def process_text(
    text: str,
    websocket: WebSocket,
) -> None:
    """Process pasted text with progress reporting."""
    reporter = ProgressReporter(websocket, "pasted_text")

    try:
        # 20% - Validating
        await reporter.report(20, "READING...")

        if not text.strip():
            raise SmeltError(
                code=ErrorCode.UNKNOWN,
                message="NOTHING TO PROCESS. TYPE SOMETHING.",
            )

        # 50% - Synthesizing
        await reporter.report(50, "SYNTHESIZING...")

        result = await synthesize_text(text)

        # 100% - Complete
        await reporter.report(100, "DONE")
        await reporter.complete(result)

    except SmeltError as e:
        logger.error(f"Error processing text: {e}")
        await reporter.error(e)
    except Exception as e:
        logger.exception("Unexpected error processing text")
        await reporter.error(
            SmeltError(
                code=ErrorCode.UNKNOWN,
                message="SOMETHING BROKE. NOT YOUR FAULT. MAYBE.",
                details=str(e),
            )
        )


@router.websocket("/ws/process")
async def websocket_process(websocket: WebSocket):
    """WebSocket endpoint for processing files and text."""
    await websocket.accept()
    settings = get_settings()
    max_size_bytes = settings.max_file_size_mb * 1024 * 1024

    logger.info("WebSocket connection established")

    try:
        while True:
            # Receive message
            logger.debug("Waiting for WebSocket message...")
            try:
                raw_data = await websocket.receive_text()
                logger.info(f"Received message, length: {len(raw_data)} bytes")
            except Exception as e:
                logger.error(f"Error receiving message: {type(e).__name__}: {e}")
                raise

            try:
                data = json.loads(raw_data)
                logger.debug(f"Parsed JSON successfully, type: {data.get('type')}")
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error: {e}")
                await websocket.send_json(
                    {
                        "type": "error",
                        "file": "unknown",
                        "message": "INVALID MESSAGE. SPEAK JSON.",
                        "code": ErrorCode.UNKNOWN.value,
                    }
                )
                continue

            msg_type = data.get("type")

            if msg_type != "process":
                logger.warning(f"Unknown message type: {msg_type}")
                await websocket.send_json(
                    {
                        "type": "error",
                        "file": "unknown",
                        "message": f"UNKNOWN COMMAND: {msg_type}",
                        "code": ErrorCode.UNKNOWN.value,
                    }
                )
                continue

            # Process files
            files = data.get("files", [])
            text = data.get("text")

            logger.info(f"Processing request: {len(files)} files, text: {bool(text)}")

            if files:
                for i, file_data in enumerate(files):
                    file = FileInput(
                        name=file_data.get("name", "unknown"),
                        data=file_data.get("data", ""),
                        mime=file_data.get("mime", ""),
                    )
                    logger.info(f"Processing file {i+1}/{len(files)}: {file.name} ({len(file.data)} base64 chars)")
                    reporter = ProgressReporter(websocket, file.name)
                    await process_file(file, reporter, max_size_bytes)

            elif text:
                logger.info(f"Processing text: {len(text)} characters")
                await process_text(text, websocket)

            else:
                logger.warning("No files or text in request")
                await websocket.send_json(
                    {
                        "type": "error",
                        "file": "unknown",
                        "message": "NOTHING TO DO. SEND FILES OR TEXT.",
                        "code": ErrorCode.UNKNOWN.value,
                    }
                )
                continue

            # Signal all processing complete
            logger.info("All processing complete, sending done")
            await websocket.send_json({"type": "done"})

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected by client")
    except Exception as e:
        logger.exception(f"WebSocket error: {type(e).__name__}: {e}")
        try:
            await websocket.send_json(
                {
                    "type": "error",
                    "file": "unknown",
                    "message": "CONNECTION DIED. TRY AGAIN.",
                    "code": ErrorCode.UNKNOWN.value,
                }
            )
        except Exception:
            pass
