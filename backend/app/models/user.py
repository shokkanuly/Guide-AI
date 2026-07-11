"""
GovGuide AI — User ORM Model
"""
import uuid
from enum import Enum as PyEnum
from typing import Optional, List
from sqlalchemy import String, Boolean, Enum, Text, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, PyEnum):
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"


class EmploymentStatus(str, PyEnum):
    STUDENT = "student"
    EMPLOYED = "employed"
    UNEMPLOYED = "unemployed"
    SELF_EMPLOYED = "self_employed"
    BUSINESS_OWNER = "business_owner"


class Language(str, PyEnum):
    KAZAKH = "kz"
    RUSSIAN = "ru"
    ENGLISH = "en"


class User(Base):
    __tablename__ = "users"

    # ---- Identity ----
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.USER)

    # ---- Profile ----
    full_name: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))

    # ---- Demographics (for eligibility) ----
    age: Mapped[Optional[int]] = mapped_column()
    region: Mapped[Optional[str]] = mapped_column(String(100))
    city: Mapped[Optional[str]] = mapped_column(String(100))
    employment_status: Mapped[Optional[EmploymentStatus]] = mapped_column(
        Enum(EmploymentStatus)
    )
    monthly_income: Mapped[Optional[float]] = mapped_column()
    has_family: Mapped[bool] = mapped_column(Boolean, default=False)
    family_size: Mapped[Optional[int]] = mapped_column()
    is_student: Mapped[bool] = mapped_column(Boolean, default=False)
    university: Mapped[Optional[str]] = mapped_column(String(255))
    is_business_owner: Mapped[bool] = mapped_column(Boolean, default=False)

    # ---- Preferences ----
    language: Mapped[Language] = mapped_column(Enum(Language), default=Language.RUSSIAN)
    interests: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String))

    # ---- Notifications ----
    telegram_chat_id: Mapped[Optional[str]] = mapped_column(String(50))
    notify_new_programs: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_deadlines: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_weekly_digest: Mapped[bool] = mapped_column(Boolean, default=False)

    # ---- Premium ----
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False)
    premium_expires_at: Mapped[Optional[str]] = mapped_column(String(50))

    # ---- Relationships ----
    chat_sessions: Mapped[List["ChatSession"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )
    applications: Mapped[List["Application"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )
    documents: Mapped[List["Document"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )
    notifications: Mapped[List["Notification"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )
    saved_programs: Mapped[List["SavedProgram"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"
