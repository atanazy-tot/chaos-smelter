# SMELT

> Raw ore in, pure metal out. Brutal transformation.

A web app that transforms messy notes (audio or text) into clean, structured Markdown. Drop your chaos, get organized output.

## Features

- **Audio transcription**  Upload .mp3, .wav, .m4a, .ogg files
- **Text processing**  Drop .txt, .md files or paste raw text
- **Batch processing**  Handle multiple files at once
- **Export options**  Copy to clipboard, download as .md, or download all as .zip

## Tech Stack

- **Backend:** Python, FastAPI, WebSocket
- **Frontend:** React, TypeScript
- **LLM:** OpenRouter (Gemini for transcription and synthesis)
- **Design:** Neobrutalism aesthetic

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- [uv](https://github.com/astral-sh/uv) (Python package manager)
- OpenRouter API key

### Backend

```bash
cd backend
cp .env.example .env  # Add your OPENROUTER_API_KEY
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Environment Variables

Create `backend/.env`:

```bash
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL_TRANSCRIPTION=google/gemini-2.5-pro-preview
OPENROUTER_MODEL_SYNTHESIS=google/gemini-2.5-pro-preview
MAX_FILE_SIZE_MB=25
CORS_ORIGINS=["http://localhost:5173"]
```

## License

MIT
