"""
GovGuide AI — Application, Document, Notification ORM Models
"""
import uuid
from enum import Enum as PyEnum
from typing import Optional, List
from sqlalchemy import String, Boolean, Enum, Text, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# ============================================================
# APPLICATION MODEL
# ============================================================
class ApplicationStatus(str, PyEnum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class Application(Base):
    """User's application to a government program."""
    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False
    )
    program_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("government_programs.id"), index=True, nullable=False
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus), default=ApplicationStatus.DRAFT, index=True
    )

    # ---- Roadmap Steps ----
    roadmap: Mapped[Optional[List]] = mapped_column(JSONB)
    # [{"step": 1, "title": "Collect Passport", "status": "done", "due_date": "..."}]

    current_step: Mapped[int] = mapped_column(Integer, default=0)
    completion_pct: Mapped[float] = mapped_column(Float, default=0.0)

    # ---- Documents ----
    attached_documents: Mapped[Optional[List]] = mapped_column(JSONB)
    # [{"doc_id": "...", "type": "passport", "status": "verified"}]

    # ---- Notes ----
    notes: Mapped[Optional[str]] = mapped_column(Text)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="applications")  # noqa: F821
    program: Mapped["GovernmentProgram"] = relationship(back_populates="applications")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Application id={self.id} status={self.status}>"


# ============================================================
# DOCUMENT MODEL
# ============================================================
class DocumentType(str, PyEnum):
    PASSPORT = "passport"
    ID_CARD = "id_card"
    STUDENT_CERTIFICATE = "student_certificate"
    INCOME_CERTIFICATE = "income_certificate"
    TRANSCRIPT = "transcript"
    BUSINESS_PLAN = "business_plan"
    TAX_CERTIFICATE = "tax_certificate"
    MEDICAL_CERTIFICATE = "medical_certificate"
    FAMILY_COMPOSITION = "family_composition"
    MARRIAGE_CERTIFICATE = "marriage_certificate"
    RECOMMENDATION_LETTER = "recommendation_letter"
    OTHER = "other"


class DocumentStatus(str, PyEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    VERIFIED = "verified"
    REJECTED = "rejected"
    EXPIRED = "expired"


class Document(Base):
    """User-uploaded document with AI validation."""
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False
    )
    doc_type: Mapped[DocumentType] = mapped_column(
        Enum(DocumentType), default=DocumentType.OTHER, index=True
    )
    status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus), default=DocumentStatus.PENDING
    )

    # ---- File ----
    original_filename: Mapped[str] = mapped_column(String(255))
    s3_key: Mapped[str] = mapped_column(String(500))
    s3_url: Mapped[str] = mapped_column(String(1000))
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100))

    # ---- AI Analysis ----
    ai_extracted_text: Mapped[Optional[str]] = mapped_column(Text)
    ai_analysis: Mapped[Optional[dict]] = mapped_column(JSONB)
    # {"valid": true, "expires_at": "2028-01-01", "name_matches": true, "issues": []}

    ai_issues: Mapped[Optional[List[str]]] = mapped_column(JSONB)
    ai_suggestions: Mapped[Optional[List[str]]] = mapped_column(JSONB)

    # ---- Metadata ----
    expires_at: Mapped[Optional[str]] = mapped_column(String(30))
    issued_at: Mapped[Optional[str]] = mapped_column(String(30))
    issuer: Mapped[Optional[str]] = mapped_column(String(255))

    # Relationships
    user: Mapped["User"] = relationship(back_populates="documents")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Document id={self.id} type={self.doc_type} status={self.status}>"


# ============================================================
# NOTIFICATION MODEL
# ============================================================
class NotificationType(str, PyEnum):
    NEW_PROGRAM = "new_program"
    DEADLINE_REMINDER = "deadline_reminder"
    APPLICATION_UPDATE = "application_update"
    DOCUMENT_EXPIRY = "document_expiry"
    WEEKLY_DIGEST = "weekly_digest"
    SYSTEM = "system"


class NotificationChannel(str, PyEnum):
    IN_APP = "in_app"
    EMAIL = "email"
    TELEGRAM = "telegram"
    PUSH = "push"


class Notification(Base):
    """User notification — in-app, email, Telegram."""
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False
    )
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType), index=True
    )
    channel: Mapped[NotificationChannel] = mapped_column(
        Enum(NotificationChannel), default=NotificationChannel.IN_APP
    )

    # ---- Content ----
    title: Mapped[str] = mapped_column(String(500))
    body: Mapped[str] = mapped_column(Text)
    action_url: Mapped[Optional[str]] = mapped_column(String(1000))

    # ---- State ----
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    is_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    sent_at: Mapped[Optional[str]] = mapped_column(String(50))

    # ---- Related ----
    related_program_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True))
    related_application_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True))

    # Relationships
    user: Mapped["User"] = relationship(back_populates="notifications")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Notification id={self.id} type={self.type} user={self.user_id}>"
