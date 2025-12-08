# Project: SMELT

> **SMELT** — Raw ore in, pure metal out. Brutal transformation.

---

## What It Does

A single-page web app. User drops messy notes (audio or text), receives clean, structured Markdown. No configuration, no custom prompts exposed to user. Post and receive.

**Input:**
- Audio files (.mp3, .wav, .m4a, .ogg)
- Text files (.txt, .md, .doc)
- Raw pasted text (from Miro, Notion, anywhere)
- Multiple files at once

**Output:**
- Structured Markdown
- Download as .md file
- Copy to clipboard
- Download all as zip (for batch)

---

## Design Decisions

### Visual Style: NEOBRUTALISM

| Element | Treatment |
|---------|-----------|
| Shadows | Hard offset, no blur (8-12px, black) |
| Borders | Thick (4-6px), always black |
| Base color | Cream `#FFFEF0` |
| Accents | Lime `#E8FF8D`, Lavender `#C8B6FF`, Coral `#FF6B6B`, Cyan `#A8E6FF` |
| Typography | `Space Mono` — monospace, uppercase headers, tight tracking |
| Corners | Zero border-radius |
| Buttons | Physical press effect (translate + shadow reduction on click) |

### UI Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: "SMELT" + tagline                                      │
└─────────────────────────────────────────────────────────────────┘

STATE 1: Empty
┌─────────────────────┐       ┌─────────────────────┐
│                     │       │                     │
│    DROP FILE(S)     │  OR   │    PASTE TEXT       │
│                     │       │                     │
└─────────────────────┘       └─────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  Waiting for input                          [ SYNTHESIZE → ]    │
└─────────────────────────────────────────────────────────────────┘

STATE 2: Input ready (file selected or text pasted)
- Active zone gets colored background (lime for file, lavender for text)
- Bottom bar updates: "Ready to process" + enabled button
- File zone shows list of files with ✕ to remove each

STATE 3: Processing
- Button shows spinner + "Processing..."
- Button disabled

STATE 4: Results
┌─────────────────────────────────────────────────────────────────┐
│  ✓ 3 Outputs Ready      [ COPY ] [ ⬇ DOWNLOAD ] [ ALL ] [ NEW ]│
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│         [ ← ]         2 / 3         [ → ]                       │
│                    source_file.txt                              │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  # Synthesized Output                                           │
│                                                                 │
│  Dark terminal aesthetic, lime text on near-black               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Icons

Chromatic SVG icons with gradient fills:
- File icon: Red → Yellow → Lime gradient
- Paste icon: Cyan → Lavender gradient
- Multi-file icon: Stacked papers effect
- Arrows: Simple chevrons, solid black

---

## Architecture Decision

**FastAPI (Python) + React (TypeScript)** — two separate services.

Why:
- Existing Python audio processing script integrates directly
- Python ecosystem stronger for audio and LLM work
- Clear separation: backend handles processing, frontend handles UI
- Can deploy together via Docker Compose or separately

```
smelt/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── routers/
│   │   │   └── process.py
│   │   └── services/
│   │       ├── audio.py
│   │       ├── text.py
│   │       └── llm.py
│   │
│   ├── prompts/
│   │   ├── synthesize.md
│   │   ├── transcribe_cleanup.md
│   │   └── ...
│   │
│   ├── lib/
│   │   └── prompt_parser.py
│   │
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   └── components/
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

### Configuration

Models and API settings defined in `.env`:

```bash
# LLM
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL_SYNTHESIS=anthropic/claude-3-haiku
OPENROUTER_MODEL_TRANSCRIPTION=openai/whisper-1

# App
CORS_ORIGINS=http://localhost:5173
MAX_FILE_SIZE_MB=25
```

### Prompts

Prompts stored as separate files in `/prompts` folder. Prompt parser loads and interpolates variables at runtime. Keeps prompts version-controlled and easy to iterate on without touching code.

---

## Processing Flow

```
INPUT
  │
  ├─► Audio file ──► Transcription service ──┐
  │                                          │
  ├─► Text file ─────────────────────────────┼──► LLM Synthesis ──► MARKDOWN
  │                                          │
  └─► Pasted text ───────────────────────────┘
```

---

## Design Reference

Working React prototype with all states implemented:
`note-processor-v4.jsx`

Includes:
- Dual input zones (file drop + text paste)
- Multi-file support with removal
- Left/right navigation between results
- Download single / Download all
- Copy to clipboard
- Neobrutalist styling throughout

---

## Summary

| Aspect | Decision |
|--------|----------|
| Purpose | Messy notes → clean markdown |
| Style | Neobrutalism — bold, raw, utilitarian |
| Backend | Python + FastAPI |
| Frontend | React + TypeScript |
| LLM Provider | OpenRouter (models in .env) |
| Prompts | Separate folder + parser |
| Deployment | Docker Compose |
