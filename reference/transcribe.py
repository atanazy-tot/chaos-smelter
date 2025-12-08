#!/usr/bin/env python3
"""
Audio transcription script using Gemini 2.5 Pro via OpenRouter.
"""

import argparse
import base64
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


def get_api_key() -> str:
    """Get OpenRouter API key from environment variable."""
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        print("Error: OPENROUTER_API_KEY environment variable is not set.")
        sys.exit(1)
    return api_key


def encode_audio_to_base64(audio_path: Path) -> str:
    """Read and encode audio file to base64."""
    with open(audio_path, "rb") as f:
        return base64.standard_b64encode(f.read()).decode("utf-8")


def get_audio_format(audio_path: Path) -> str:
    """Get audio format string for OpenRouter API."""
    extension = audio_path.suffix.lower()
    formats = {
        ".mp3": "mp3",
        ".wav": "wav",
        ".m4a": "m4a",
        ".ogg": "ogg",
        ".flac": "flac",
        ".aac": "aac",
        ".aiff": "aiff",
    }
    return formats.get(extension, "mp3")


def transcribe_audio(audio_path: Path, api_key: str) -> str:
    """Send audio to Gemini via OpenRouter and get transcript."""
    audio_base64 = encode_audio_to_base64(audio_path)
    audio_format = get_audio_format(audio_path)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "google/gemini-2.5-pro-preview",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Proszę dokładnie transkrybować poniższy plik audio. "
                        "Rozmowa jest w języku polskim. "
                        "Sformatuj wynik w markdown z wyraźnymi sekcjami. "
                        "Podziel transkrypcję na logiczne sekcje według omawianych tematów. "
                        "Użyj nagłówków markdown (##) dla każdej sekcji z opisowymi tytułami. "
                        "Jeśli w nagraniu występuje wielu mówców, oznacz zmiany mówców pogrubionym tekstem. "
                        "Dostarcz dobrze ustrukturyzowany, czytelny dokument.",
                    },
                    {
                        "type": "input_audio",
                        "input_audio": {
                            "data": audio_base64,
                            "format": audio_format,
                        },
                    },
                ],
            }
        ],
    }

    response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=300)

    if response.status_code != 200:
        print(f"Error: API request failed with status {response.status_code}")
        print(response.text)
        sys.exit(1)

    result = response.json()
    return result["choices"][0]["message"]["content"]


def save_transcript(transcript: str, audio_path: Path, output_dir: Path) -> Path:
    """Save transcript to markdown file."""
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / f"{audio_path.stem}.md"

    content = f"# Transkrypcja: {audio_path.name}\n\n{transcript}\n"

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(content)

    return output_file


def main():
    load_dotenv()

    parser = argparse.ArgumentParser(description="Transcribe audio files using Gemini via OpenRouter")
    parser.add_argument("audio_path", type=str, help="Path to the audio file to transcribe")
    parser.add_argument(
        "-o",
        "--output-dir",
        type=str,
        default=None,
        help="Output directory for transcripts (default: transcripts/ in same directory as script)",
    )

    args = parser.parse_args()

    audio_path = Path(args.audio_path).resolve()
    if not audio_path.exists():
        print(f"Error: Audio file not found: {audio_path}")
        sys.exit(1)

    script_dir = Path(__file__).parent
    output_dir = Path(args.output_dir) if args.output_dir else script_dir / "transcripts"

    api_key = get_api_key()

    print(f"Transcribing: {audio_path.name}")
    transcript = transcribe_audio(audio_path, api_key)

    output_file = save_transcript(transcript, audio_path, output_dir)
    print(f"Transcript saved to: {output_file}")


if __name__ == "__main__":
    main()
