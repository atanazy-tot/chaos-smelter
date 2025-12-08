# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SMELT** (chaos-smelter) — A web app that transforms messy notes (audio or text) into clean, structured Markdown. Neobrutalist design aesthetic.

## Architecture

FastAPI (Python) backend + React (TypeScript) frontend.

```
chaos-smelter/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app with CORS
│   │   ├── config.py            # Settings via pydantic-settings
│   │   ├── errors.py            # Custom exceptions with ironic messages
│   │   ├── routers/process.py   # WebSocket endpoint
│   │   └── services/
│   │       ├── audio.py         # Transcription via Gemini
│   │       ├── text.py          # UTF-8 text file handling
│   │       ├── synthesis.py     # LLM note cleanup
│   │       └── llm.py           # OpenRouter client with retry decorator
│   └── prompts/synthesize.md    # Synthesis prompt template
├── frontend/
│   └── src/
│       ├── App.tsx              # Main app component
│       ├── components/          # DropZone, TextZone, ProgressBar, ResultsView
│       ├── hooks/useWebSocket.ts
│       └── types.ts
└── reference/transcribe.py      # Standalone transcription script
```

## Development Commands

```bash
# Backend (from project root)
cd backend && uv sync
cd backend && uv run uvicorn app.main:app --reload --port 8000

# Frontend (from project root)
cd frontend && npm install
cd frontend && npm run dev

# Reference transcription script
uv run python reference/transcribe.py <audio_path> [-o output_dir]
```

## Environment Variables

Create `backend/.env`:
```bash
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL_TRANSCRIPTION=google/gemini-2.5-pro-preview
OPENROUTER_MODEL_SYNTHESIS=google/gemini-2.5-pro-preview
MAX_FILE_SIZE_MB=25
CORS_ORIGINS=["http://localhost:5173"]
```

## WebSocket Protocol

Connect to `/ws/process`. Send:
```json
{"type": "process", "files": [{"name": "...", "data": "base64...", "mime": "..."}], "text": null}
```

Receive progress updates:
```json
{"type": "progress", "file": "...", "percent": 30, "status": "TRANSCRIBING..."}
{"type": "complete", "file": "...", "content": "# Markdown..."}
{"type": "error", "file": "...", "message": "IRONIC ERROR MSG", "code": "ERROR_CODE"}
{"type": "done"}
```

## Design System (Neobrutalism)

- Hard offset shadows (8-12px, no blur)
- Thick black borders (4-6px)
- Colors: Cream `#FFFEF0`, Lime `#E8FF8D`, Lavender `#C8B6FF`, Coral `#FF6B6B`, Cyan `#A8E6FF`
- Typography: Space Mono, uppercase headers
- Zero border-radius
- Physical button press effects (translate on active)

## Error Messages

Errors use ironic, neobrutalist tone:
- `FILE TOO CHUNKY. MAX 25MB.`
- `CAN'T READ THAT. TRY .TXT .MD .MP3 .WAV .M4A .OGG`
- `THE ROBOTS COULDN'T HEAR THAT.`
- `BRAIN MALFUNCTION. TRY AGAIN.`
- `CHILL. RATE LIMITED FOR {n}s.`
