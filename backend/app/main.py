"""
GovGuide AI — FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging

from app.config import settings
from app.database import init_db

# ---- Import all routers ----
from app.api.v1.auth import router as auth_router
from app.api.v1.chat import router as chat_router
from app.api.v1.programs import router as programs_router
from app.api.v1.analyze import analyze_router, search_router
from app.api.v1.routes import (
    users_router,
    eligibility_router,
    documents_router,
    applications_router,
    notifications_router,
)

# ---- Logging ----
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ---- Rate Limiter ----
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit_default])


# ---- Lifespan (startup/shutdown) ----
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🚀 Starting {settings.app_name} v{settings.app_version}")

    # Create tables in development (use Alembic in production)
    if settings.is_development:
        await init_db()
        logger.info("✅ Database tables initialized")
        
        # Auto-seed if empty
        from app.database import AsyncSessionLocal
        from app.utils.seed_data import auto_seed_if_empty
        async with AsyncSessionLocal() as db:
            await auto_seed_if_empty(db)

    yield

    logger.info("👋 Shutting down GovGuide AI")


# ---- FastAPI App ----
app = FastAPI(
    title=settings.app_name,
    description="""
## GovGuide AI — Government Navigator API

Your personal AI assistant for navigating Kazakhstani government programs, grants,
subsidies, scholarships, and social support.

### Features
- 🤖 **AI Chat** — Ask anything about government programs in plain language
- 🎯 **Eligibility Checker** — Instantly see which programs you qualify for
- 📋 **Document Manager** — AI validates your uploaded documents
- 🗺️ **Application Roadmap** — Step-by-step guide for every application
- 🔔 **Smart Notifications** — Proactive alerts for new grants and deadlines

### Authentication
All protected endpoints require a Bearer JWT token obtained from `/api/v1/auth/login`.

```
Authorization: Bearer <your_access_token>
```
    """,
    version=settings.app_version,
    docs_url="/api/docs" if not settings.is_production else None,
    redoc_url="/api/redoc" if not settings.is_production else None,
    openapi_url="/api/openapi.json" if not settings.is_production else None,
    lifespan=lifespan,
)

# ---- Rate limiting ----
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---- CORS ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Global Exception Handlers ----
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [
        {"field": ".".join(str(loc) for loc in err["loc"]), "message": err["msg"]}
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"success": False, "message": "Validation error", "errors": errors},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.method} {request.url}: {exc}")
    if settings.is_production:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Internal server error"},
        )
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": str(exc)},
    )


# ---- Register Routers ----
API_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(users_router, prefix=API_PREFIX)
app.include_router(chat_router, prefix=API_PREFIX)
app.include_router(programs_router, prefix=API_PREFIX)
app.include_router(analyze_router, prefix=API_PREFIX)
app.include_router(search_router, prefix=API_PREFIX)
app.include_router(eligibility_router, prefix=API_PREFIX)
app.include_router(documents_router, prefix=API_PREFIX)
app.include_router(applications_router, prefix=API_PREFIX)
app.include_router(notifications_router, prefix=API_PREFIX)


# ---- Health Check ----
@app.get("/health", tags=["Health"], summary="API health check")
async def health_check() -> dict:
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.app_env,
    }


@app.get("/", tags=["Root"])
async def root() -> dict:
    return {
        "message": f"Welcome to {settings.app_name} API",
        "docs": "/api/docs",
        "version": settings.app_version,
    }
