"""FastAPI application factory, CORS, exception handlers, and router registration."""

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from driftsmith.api.routers.auth import router as auth_router
from driftsmith.api.routers.demo import router as demo_router
from driftsmith.api.routers.events import router as events_router
from driftsmith.api.routers.health import router as health_router
from driftsmith.api.routers.patterns import router as patterns_router
from driftsmith.api.routers.runs import router as runs_router
from driftsmith.api.routers.webhooks import router as webhooks_router
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
        docs_url="/docs",
        openapi_url="/openapi.json",
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

    # Standardized 422 validation error handler matching contract error shape { "detail": string }
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors = exc.errors()
        detail = "Validation error"
        if errors:
            loc = ".".join(str(x) for x in errors[0].get("loc", []))
            detail = f"{loc}: {errors[0].get('msg', 'invalid input')}"
        return JSONResponse(
            status_code=422,
            content={"detail": detail},
        )

    # Ensure HTTPException returns standard shape { "detail": string }
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        detail_msg = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": detail_msg},
            headers=getattr(exc, "headers", None),
        )

    # Register all API routers
    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(runs_router)
    app.include_router(patterns_router)
    app.include_router(events_router)
    app.include_router(demo_router)
    app.include_router(webhooks_router)

    return app


app = create_app()
