"""
GovGuide AI — Government Program ORM Model
"""
import uuid
from enum import Enum as PyEnum
from typing import Optional, List
from datetime import date
from sqlalchemy import String, Boolean, Enum, Text, ARRAY, Float, Integer, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ProgramCategory(str, PyEnum):
    GRANT = "grant"
    SCHOLARSHIP = "scholarship"
    SUBSIDY = "subsidy"
    LOAN = "loan"
    INCUBATOR = "incubator"
    COMPETITION = "competition"
    HOUSING = "housing"
    SOCIAL = "social"
    BUSINESS = "business"
    EDUCATION = "education"
    INNOVATION = "innovation"


class ProgramStatus(str, PyEnum):
    ACTIVE = "active"
    CLOSED = "closed"
    UPCOMING = "upcoming"
    PAUSED = "paused"


class GovernmentProgram(Base):
    __tablename__ = "government_programs"

    # ---- Identity ----
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    status: Mapped[ProgramStatus] = mapped_column(
        Enum(ProgramStatus), default=ProgramStatus.ACTIVE, index=True
    )

    # ---- Content ----
    title_kz: Mapped[str] = mapped_column(String(500))        # Kazakh
    title_ru: Mapped[str] = mapped_column(String(500))        # Russian
    title_en: Mapped[Optional[str]] = mapped_column(String(500))  # English
    description_kz: Mapped[Optional[str]] = mapped_column(Text)
    description_ru: Mapped[str] = mapped_column(Text)
    description_en: Mapped[Optional[str]] = mapped_column(Text)

    # ---- Classification ----
    category: Mapped[ProgramCategory] = mapped_column(
        Enum(ProgramCategory), index=True
    )
    tags: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String))
    ministry: Mapped[Optional[str]] = mapped_column(String(255))
    organization: Mapped[str] = mapped_column(String(255))

    # ---- Funding ----
    amount_min: Mapped[Optional[float]] = mapped_column(Float)
    amount_max: Mapped[Optional[float]] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(10), default="KZT")
    is_grant: Mapped[bool] = mapped_column(Boolean, default=True)  # True=grant, False=loan

    # ---- Eligibility Criteria ----
    age_min: Mapped[Optional[int]] = mapped_column(Integer)
    age_max: Mapped[Optional[int]] = mapped_column(Integer)
    regions: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String))  # [] = all regions
    requires_student: Mapped[Optional[bool]] = mapped_column(Boolean)
    requires_employment: Mapped[Optional[bool]] = mapped_column(Boolean)
    requires_kz_citizen: Mapped[bool] = mapped_column(Boolean, default=True)
    income_max: Mapped[Optional[float]] = mapped_column(Float)
    requirements: Mapped[Optional[dict]] = mapped_column(JSONB)  # Flexible criteria

    # ---- Documents Required ----
    required_documents: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String))

    # ---- Dates ----
    deadline: Mapped[Optional[date]] = mapped_column(Date, index=True)
    open_date: Mapped[Optional[date]] = mapped_column(Date)
    next_round_date: Mapped[Optional[date]] = mapped_column(Date)

    # ---- Links ----
    official_url: Mapped[Optional[str]] = mapped_column(String(1000))
    application_url: Mapped[Optional[str]] = mapped_column(String(1000))
    contact_email: Mapped[Optional[str]] = mapped_column(String(255))
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50))

    # ---- RAG / Embeddings ----
    embedding_id: Mapped[Optional[str]] = mapped_column(String(100))  # ChromaDB doc ID
    source_pdf_url: Mapped[Optional[str]] = mapped_column(String(1000))

    # ---- Metrics ----
    views_count: Mapped[int] = mapped_column(Integer, default=0)
    applications_count: Mapped[int] = mapped_column(Integer, default=0)

    # ---- Relationships ----
    applications: Mapped[List["Application"]] = relationship(  # noqa: F821
        back_populates="program"
    )
    saved_by: Mapped[List["SavedProgram"]] = relationship(  # noqa: F821
        back_populates="program"
    )

    def get_title(self, lang: str = "ru") -> str:
        return getattr(self, f"title_{lang}") or self.title_ru

    def get_description(self, lang: str = "ru") -> str:
        return getattr(self, f"description_{lang}") or self.description_ru

    def __repr__(self) -> str:
        return f"<Program id={self.id} title={self.title_ru[:40]}>"


class SavedProgram(Base):
    """User bookmarked programs."""
    __tablename__ = "saved_programs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False
    )
    program_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("government_programs.id"), index=True, nullable=False
    )
    notes: Mapped[Optional[str]] = mapped_column(Text)

    user: Mapped["User"] = relationship(back_populates="saved_programs")  # noqa: F821
    program: Mapped["GovernmentProgram"] = relationship(back_populates="saved_by")
