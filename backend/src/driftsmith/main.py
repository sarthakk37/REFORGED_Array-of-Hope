"""FastAPI application factory and middleware configuration."""

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from driftsmith.api.routers.health import router as health_router
from driftsmith.config import settings

logger = logging.getLogger("driftsmith")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup and shutdown lifecycle handler."""
    logger.info("Initializing DriftSmith backend in %s mode", settings.llm_mode)
    if settings.llm_mode == "live" and not settings.gemini_api_key:
        logger.warning(
            "LLM_MODE is live but GEMINI_API_KEY is not configured! LLM calls will fail."
        )
    yield
    logger.info("DriftSmith backend shutting down")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    app = FastAPI(
        title="DriftSmith API",
        description="Autonomous self-healing remediation engine for third-party API drift",
        version="0.1.0",
        lifespan=lifespan,
    )

    # Configure CORS for frontend access
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Standardized 422 validation error handler matching contract error shape
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error("Unhandled error: %s", exc, exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error occurred"},
        )

    # Register routers
    app.include_router(health_router)

    return app


app = create_app()
