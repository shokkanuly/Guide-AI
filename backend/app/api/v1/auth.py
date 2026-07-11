"""
GovGuide AI — Auth API Routes
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/password-reset
"""
from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from sqlalchemy import select

from app.core.dependencies import DB, CurrentUser
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.user import User
from app.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    PasswordResetRequest,
    BaseResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(request: RegisterRequest, db: DB) -> TokenResponse:
    """
    Create a new user account.

    - Checks for duplicate email
    - Hashes password with bcrypt
    - Returns JWT access + refresh tokens immediately
    """
    # Check for existing email
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create user
    user = User(
        email=request.email,
        hashed_password=hash_password(request.password),
        full_name=request.full_name,
        language=request.language or "ru",
    )
    db.add(user)
    await db.flush()  # Get the ID without committing

    access_token = create_access_token(str(user.id), extra_claims={"email": user.email})
    refresh_token = create_refresh_token(str(user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=3600,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login with email and password",
)
async def login(request: LoginRequest, db: DB) -> TokenResponse:
    """
    Authenticate with email + password.
    Returns JWT access + refresh tokens.
    """
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    access_token = create_access_token(str(user.id), extra_claims={"email": user.email})
    refresh_token = create_refresh_token(str(user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=3600,
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
)
async def refresh_token(request: RefreshRequest, db: DB) -> TokenResponse:
    """
    Exchange a valid refresh token for a new access token.
    """
    try:
        payload = decode_token(request.refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("Not a refresh token")
        user_id = payload["sub"]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    import uuid
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access_token = create_access_token(str(user.id), extra_claims={"email": user.email})
    new_refresh_token = create_refresh_token(str(user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=3600,
    )


@router.post(
    "/logout",
    response_model=BaseResponse,
    summary="Logout (invalidate session)",
)
async def logout(current_user: CurrentUser) -> BaseResponse:
    """
    Logout endpoint. In production, add the token to a Redis blocklist.
    For now, the client simply discards the token.
    """
    # TODO: Add JWT ID (jti) to Redis blocklist with TTL = token expiry
    return BaseResponse(success=True, message="Logged out successfully")


@router.post(
    "/password-reset",
    response_model=BaseResponse,
    summary="Request password reset email",
)
async def request_password_reset(
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: DB,
) -> BaseResponse:
    """
    Send a password reset email to the provided address.
    Always returns success to prevent email enumeration.
    """
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if user:
        reset_token = create_access_token(
            str(user.id),
            extra_claims={"type": "password_reset"},
        )
        # TODO: background_tasks.add_task(send_reset_email, user.email, reset_token)

    return BaseResponse(
        success=True,
        message="If that email exists, a reset link has been sent",
    )
