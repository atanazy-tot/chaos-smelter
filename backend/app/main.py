"""SMELT - Raw notes in, clean markdown out."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import process


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    settings = get_settings()
    print(f"SMELT starting up...")
    print(f"  Max file size: {settings.max_file_size_mb}MB")
    print(f"  CORS origins: {settings.cors_origins}")
    yield
    # Shutdown
    print("SMELT shutting down...")


app = FastAPI(
    title="SMELT",
    description="Raw notes in, clean markdown out.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(process.router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "smelt"}
