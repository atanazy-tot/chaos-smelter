"""WebSocket endpoint for file processing with progress streaming."""

import asyncio
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

# Configure logging
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


class ProgressReporter:
    """Helper to send progress updates over WebSocket."""

    def __init__(self, websocket: WebSocket, filename: str):
        self.websocket = websocket
        self.filename = filename
        self._lock = asyncio.Lock()

    async def report(self, percent: int, status: str):
        """Send progress update."""
        async with self._lock:
            try:
                await self.websocket.send_json(
                    {
                        "type": "progress",
                        "file": self.filename,
                        "percent": percent,
                        "status": status,
                    }
                )
            except Exception as e:
                logger.error(f"Failed to send progress: {e}")

    async def complete(self, content: str):
        """Send completion message."""
        async with self._lock:
            try:
                await self.websocket.send_json(
                    {
                        "type": "complete",
                        "file": self.filename,
                        "content": content,
                    }
                )
            except Exception as e:
                logger.error(f"Failed to send complete: {e}")

    async def error(self, error: SmeltError):
        """Send error message."""
        async with self._lock:
            try:
                await self.websocket.send_json(
                    {
                        "type": "error",
                        "file": self.filename,
                        "message": error.message,
                        "code": error.code.value,
                    }
                )
            except Exception as e:
                logger.error(f"Failed to send error: {e}")


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
            raise UnsupportedFormatError(
                extension=file.name.split(".")[-1] if "." in file.name else "unknown"
            )

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
            await reporter.report(30, "TRANSCRIBING...")
            transcript = await transcribe_audio(file_bytes, file.name)

            await reporter.report(70, "SYNTHESIZING...")
            result = await synthesize_text(transcript)
        else:
            await reporter.report(40, "READING...")
            raw_text = decode_text_file(file_bytes, file.name)

            await reporter.report(60, "SYNTHESIZING...")
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


async def process_text(text: str, websocket: WebSocket) -> None:
    """Process pasted text with progress reporting."""
    reporter = ProgressReporter(websocket, "pasted_text")

    try:
        await reporter.report(20, "READING...")

        if not text.strip():
            raise SmeltError(
                code=ErrorCode.UNKNOWN,
                message="NOTHING TO PROCESS. TYPE SOMETHING.",
            )

        await reporter.report(50, "SYNTHESIZING...")
        result = await synthesize_text(text)

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


class ProcessingSession:
    """Manages parallel file processing for a WebSocket session."""

    def __init__(self, websocket: WebSocket, max_size_bytes: int):
        self.websocket = websocket
        self.max_size_bytes = max_size_bytes
        self.tasks: list[asyncio.Task] = []
        self.expected_count: int = 0
        self.completed_count: int = 0
        self._lock = asyncio.Lock()
        self._done_event = asyncio.Event()

    async def add_file(self, file: FileInput):
        """Add a file to be processed in parallel."""
        reporter = ProgressReporter(self.websocket, file.name)
        task = asyncio.create_task(self._process_and_track(file, reporter))
        self.tasks.append(task)
        logger.info(f"Started task for {file.name}, total tasks: {len(self.tasks)}")

    async def add_text(self, text: str):
        """Add text to be processed."""
        task = asyncio.create_task(self._process_text_and_track(text))
        self.tasks.append(task)

    async def _process_and_track(self, file: FileInput, reporter: ProgressReporter):
        """Process file and track completion."""
        try:
            await process_file(file, reporter, self.max_size_bytes)
        finally:
            async with self._lock:
                self.completed_count += 1
                logger.info(f"Completed {file.name}: {self.completed_count}/{self.expected_count}")
                if self.completed_count >= self.expected_count:
                    self._done_event.set()

    async def _process_text_and_track(self, text: str):
        """Process text and track completion."""
        try:
            await process_text(text, self.websocket)
        finally:
            async with self._lock:
                self.completed_count += 1
                if self.completed_count >= self.expected_count:
                    self._done_event.set()

    async def wait_for_all(self, timeout: float = 600):
        """Wait for all tasks to complete."""
        try:
            await asyncio.wait_for(self._done_event.wait(), timeout=timeout)
        except asyncio.TimeoutError:
            logger.error("Processing timed out")
            # Cancel remaining tasks
            for task in self.tasks:
                if not task.done():
                    task.cancel()

    def is_done(self) -> bool:
        """Check if all expected files have been processed."""
        return self.completed_count >= self.expected_count and self.expected_count > 0


@router.websocket("/ws/process")
async def websocket_process(websocket: WebSocket):
    """WebSocket endpoint for processing files and text."""
    await websocket.accept()
    settings = get_settings()
    max_size_bytes = settings.max_file_size_mb * 1024 * 1024

    logger.info("WebSocket connection established")

    session: Optional[ProcessingSession] = None

    try:
        while True:
            logger.debug("Waiting for message...")
            try:
                raw_data = await websocket.receive_text()
                logger.info(f"Received message: {len(raw_data)} bytes")
            except Exception as e:
                logger.error(f"Error receiving: {type(e).__name__}: {e}")
                raise

            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError as e:
                logger.error(f"JSON error: {e}")
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

            if msg_type == "start":
                # Client signals how many files to expect
                expected = data.get("count", 0)
                session = ProcessingSession(websocket, max_size_bytes)
                session.expected_count = expected
                logger.info(f"Started session expecting {expected} files")
                continue

            if msg_type == "process":
                # Create session if not exists (single file mode or text)
                if session is None:
                    session = ProcessingSession(websocket, max_size_bytes)

                files = data.get("files", [])
                text = data.get("text")

                if files:
                    for file_data in files:
                        file = FileInput(
                            name=file_data.get("name", "unknown"),
                            data=file_data.get("data", ""),
                            mime=file_data.get("mime", ""),
                        )
                        logger.info(f"Queuing file: {file.name}")
                        await session.add_file(file)

                elif text:
                    logger.info(f"Processing text: {len(text)} chars")
                    await session.add_text(text)

                # Check if this was a single-batch request (no "start" message)
                # or if we've received all expected files
                if session.expected_count == 0:
                    # Single batch mode - wait for this batch
                    session.expected_count = len(files) if files else 1

                continue

            if msg_type == "end":
                # Client signals all files sent, wait for completion
                if session:
                    logger.info("Received end signal, waiting for tasks...")
                    await session.wait_for_all()
                    logger.info("All tasks complete, sending done")
                    await websocket.send_json({"type": "done"})
                    session = None
                continue

            logger.warning(f"Unknown message type: {msg_type}")

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
        if session:
            for task in session.tasks:
                task.cancel()
    except Exception as e:
        logger.exception(f"WebSocket error: {e}")
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
