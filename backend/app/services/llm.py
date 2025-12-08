"""OpenRouter LLM client with retry decorator."""

import asyncio
import functools
import logging
from dataclasses import dataclass
from typing import Callable, Optional, TypeVar

import httpx

from ..config import get_settings
from ..errors import LLMError, LLMTimeoutError, RateLimitedError

logger = logging.getLogger("smelt.llm")

T = TypeVar("T")

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


@dataclass
class LLMResponse:
    """Response from LLM API."""

    content: str
    model: str
    tokens_used: int


def with_retries(
    max_retries: int = 3,
    retry_on: tuple[type[Exception], ...] = (httpx.TimeoutException,),
    backoff_base: int = 2,
):
    """Decorator for async functions that retries on specified exceptions with exponential backoff."""

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            last_exception: Exception | None = None

            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except retry_on as e:
                    last_exception = e
                    logger.warning(f"Attempt {attempt + 1}/{max_retries} failed: {e}")

                    if attempt < max_retries - 1:
                        wait_time = backoff_base**attempt
                        logger.info(f"Retrying in {wait_time}s...")
                        await asyncio.sleep(wait_time)

            raise last_exception

        return wrapper

    return decorator


class OpenRouterClient:
    """Async client for OpenRouter API."""

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.openrouter_api_key
        self.timeout = settings.request_timeout
        self.max_retries = settings.max_retries

    async def complete(
        self,
        messages: list[dict],
        model: str,
        temperature: float = 0.3,
        max_tokens: int = 8192,
    ) -> LLMResponse:
        """Send completion request to OpenRouter."""
        try:
            return await self._complete_with_retries(
                messages=messages,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except httpx.TimeoutException as e:
            raise LLMTimeoutError(details=str(e))
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                retry_after = int(e.response.headers.get("Retry-After", 60))
                raise RateLimitedError(retry_after=retry_after)
            raise LLMError(details=f"HTTP {e.response.status_code}: {e.response.text}")

    async def _complete_with_retries(
        self,
        messages: list[dict],
        model: str,
        temperature: float,
        max_tokens: int,
    ) -> LLMResponse:
        """Complete with retry logic."""

        @with_retries(
            max_retries=self.max_retries,
            retry_on=(httpx.TimeoutException, httpx.HTTPStatusError),
        )
        async def _request() -> LLMResponse:
            return await self._make_request(
                messages=messages,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
            )

        return await _request()

    async def _make_request(
        self,
        messages: list[dict],
        model: str,
        temperature: float,
        max_tokens: int,
    ) -> LLMResponse:
        """Make single API request."""
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://smelt.app",
                    "X-Title": "SMELT",
                },
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

            logger.debug(f"API response: {data}")

            # Check for API error in response body
            if "error" in data:
                error_msg = data["error"].get("message", str(data["error"]))
                logger.error(f"API error: {error_msg}")
                raise LLMError(details=error_msg)

            if "choices" not in data or not data["choices"]:
                logger.error(f"Unexpected response structure: {data}")
                raise LLMError(details="Missing 'choices' in response")

            content = data["choices"][0]["message"]["content"] or ""
            tokens = data.get("usage", {}).get("total_tokens", 0)
            actual_model = data.get("model", model)

            return LLMResponse(
                content=content,
                model=actual_model,
                tokens_used=tokens,
            )


# Singleton instance
_client: Optional[OpenRouterClient] = None


def get_llm_client() -> OpenRouterClient:
    """Get or create LLM client instance."""
    global _client
    if _client is None:
        _client = OpenRouterClient()
    return _client
