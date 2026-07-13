"""
GovGuide AI — All Pydantic Schemas
Request/Response models for every API endpoint.
"""
from __future__ import annotations
import uuid
from datetime import date, datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field, field_validator


# ============================================================
# SHARED / BASE SCHEMAS
# ============================================================
class BaseResponse(BaseModel):
    """Standard API response wrapper."""
    success: bool = True
    message: Optional[str] = None


class PaginationMeta(BaseModel):
    total: int
    page: int
    per_page: int
    pages: int


# ============================================================
# AUTH SCHEMAS
# ============================================================
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    full_name: str = Field(min_length=2, max_length=255)
    language: Optional[str] = "ru"

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class RefreshRequest(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


# ============================================================
# USER SCHEMAS
# ============================================================
class UserProfile(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str]
    phone: Optional[str]
    avatar_url: Optional[str]
    age: Optional[int]
    region: Optional[str]
    city: Optional[str]
    employment_status: Optional[str]
    monthly_income: Optional[float]
    has_family: bool
    family_size: Optional[int]
    is_student: bool
    university: Optional[str]
    language: str
    interests: Optional[List[str]]
    is_premium: bool
    notify_new_programs: bool
    notify_deadlines: bool
    notify_weekly_digest: bool

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    age: Optional[int] = Field(None, ge=14, le=100)
    region: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    employment_status: Optional[str] = None
    monthly_income: Optional[float] = Field(None, ge=0)
    has_family: Optional[bool] = None
    family_size: Optional[int] = Field(None, ge=0, le=20)
    is_student: Optional[bool] = None
    university: Optional[str] = Field(None, max_length=255)
    language: Optional[str] = Field(None, pattern="^(kz|ru|en)$")
    interests: Optional[List[str]] = None
    notify_new_programs: Optional[bool] = None
    notify_deadlines: Optional[bool] = None
    notify_weekly_digest: Optional[bool] = None


# ============================================================
# PROGRAM SCHEMAS
# ============================================================
class ProgramSummary(BaseModel):
    """Lightweight program card for lists."""
    id: uuid.UUID
    slug: str
    title: str
    organization: str
    category: str
    amount_min: Optional[float]
    amount_max: Optional[float]
    currency: str
    deadline: Optional[date]
    status: str
    tags: Optional[List[str]]
    official_url: Optional[str]
    match_score: Optional[float] = None  # Added by eligibility service

    model_config = {"from_attributes": True}


class ProgramDetail(BaseModel):
    """Full program detail page."""
    id: uuid.UUID
    slug: str
    title_kz: Optional[str]
    title_ru: str
    title_en: Optional[str]
    description_ru: str
    description_en: Optional[str]
    category: str
    tags: Optional[List[str]]
    ministry: Optional[str]
    organization: str
    amount_min: Optional[float]
    amount_max: Optional[float]
    currency: str
    is_grant: bool
    age_min: Optional[int]
    age_max: Optional[int]
    regions: Optional[List[str]]
    requires_student: Optional[bool]
    requires_kz_citizen: bool
    income_max: Optional[float]
    required_documents: Optional[List[str]]
    deadline: Optional[date]
    open_date: Optional[date]
    official_url: Optional[str]
    application_url: Optional[str]
    contact_email: Optional[str]
    contact_phone: Optional[str]
    status: str
    views_count: int
    requirements: Optional[Dict[str, Any]]

    model_config = {"from_attributes": True}


class ProgramsListResponse(BaseResponse):
    data: List[ProgramSummary]
    meta: PaginationMeta


# ============================================================
# CHAT SCHEMAS
# ============================================================
class ChatMessageCreate(BaseModel):
    session_id: Optional[uuid.UUID] = None  # None = start new session
    message: str = Field(min_length=1, max_length=4000)
    language: Optional[str] = Field("ru", pattern="^(kz|ru|en)$")


class SourceReference(BaseModel):
    document_id: str
    title: str
    snippet: str
    score: float
    source_url: Optional[str]


class ProgramMatch(BaseModel):
    program_id: uuid.UUID
    title: str
    organization: str
    match_score: float
    amount_display: Optional[str]
    deadline: Optional[date]
    slug: str


class ChatResponse(BaseModel):
    session_id: uuid.UUID
    message_id: uuid.UUID
    answer: str
    programs_found: Optional[List[ProgramMatch]] = None
    required_documents: Optional[List[str]] = None
    action_suggestions: Optional[List[str]] = None
    sources: Optional[List[SourceReference]] = None
    agent_used: Optional[str] = None
    processing_time_ms: int


class ChatSessionInfo(BaseModel):
    id: uuid.UUID
    title: Optional[str]
    created_at: datetime
    message_count: int

    model_config = {"from_attributes": True}


class MessageRatingRequest(BaseModel):
    message_id: uuid.UUID
    rating: int = Field(ge=1, le=5)
    was_helpful: bool


# ============================================================
# ELIGIBILITY SCHEMAS
# ============================================================
class EligibilityCheckRequest(BaseModel):
    age: int = Field(ge=14, le=100)
    region: str = Field(min_length=2, max_length=100)
    employment_status: str
    monthly_income: Optional[float] = Field(None, ge=0)
    is_student: bool = False
    has_family: bool = False
    family_size: Optional[int] = Field(None, ge=0)
    is_business_owner: bool = False
    interests: Optional[List[str]] = None
    language: str = "ru"


class EligibleProgram(BaseModel):
    program: ProgramSummary
    match_score: float = Field(ge=0, le=100)
    match_reasons: List[str]
    missing_criteria: List[str]
    required_documents: List[str]
    next_steps: List[str] = []


class EligibilityResponse(BaseResponse):
    total_eligible: int
    results: List[EligibleProgram]
    profile_completeness: float  # % of profile fields filled


# ============================================================
# DOCUMENT SCHEMAS
# ============================================================
class DocumentUploadResponse(BaseModel):
    document_id: uuid.UUID
    doc_type: str
    status: str
    s3_url: str
    ai_analysis: Optional[Dict[str, Any]]
    ai_issues: Optional[List[str]]
    ai_suggestions: Optional[List[str]]


class DocumentListItem(BaseModel):
    id: uuid.UUID
    doc_type: str
    original_filename: str
    status: str
    expires_at: Optional[str]
    issuer: Optional[str]
    ai_issues: Optional[List[str]]
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentsListResponse(BaseResponse):
    data: List[DocumentListItem]
    missing_for_program: Optional[List[str]] = None


# ============================================================
# APPLICATION SCHEMAS
# ============================================================
class CreateApplicationRequest(BaseModel):
    program_id: uuid.UUID
    notes: Optional[str] = None


class RoadmapStep(BaseModel):
    step: int
    title: str
    description: str
    status: str  # "pending" | "in_progress" | "done"
    due_date: Optional[str]
    action_url: Optional[str]


class UpdateStepRequest(BaseModel):
    step: int
    status: str  # "pending" | "current" | "done"


class ApplicationResponse(BaseModel):
    id: uuid.UUID
    program_id: uuid.UUID
    program_title: str
    status: str
    roadmap: Optional[List[RoadmapStep]]
    current_step: int
    completion_pct: float
    attached_documents: Optional[List[Dict]]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ApplicationsListResponse(BaseResponse):
    data: List[ApplicationResponse]
    meta: PaginationMeta


# ============================================================
# NOTIFICATION SCHEMAS
# ============================================================
class NotificationItem(BaseModel):
    id: uuid.UUID
    type: str
    title: str
    body: str
    action_url: Optional[str]
    is_read: bool
    created_at: datetime
    related_program_id: Optional[uuid.UUID]

    model_config = {"from_attributes": True}


class NotificationsListResponse(BaseResponse):
    data: List[NotificationItem]
    unread_count: int


# ============================================================
# SEARCH SCHEMAS
# ============================================================
class SearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=500)
    category: Optional[str] = None
    region: Optional[str] = None
    language: str = "ru"
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)


class SearchResponse(BaseResponse):
    query: str
    data: List[ProgramSummary]
    meta: PaginationMeta
    ai_summary: Optional[str] = None  # Optional RAG-generated summary
