"""
GovGuide AI — Programs API Routes
GET  /api/v1/programs                 — List/search programs
GET  /api/v1/programs/{slug}          — Program detail
POST /api/v1/programs/{id}/save       — Save/unsave a program
GET  /api/v1/programs/saved           — User's saved programs
GET  /api/v1/programs/categories      — Available categories
"""
import uuid
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status
from sqlalchemy import select, desc, func, or_
from sqlalchemy.sql import text

from app.core.dependencies import DB, CurrentUser, OptionalUser
from app.models.program import GovernmentProgram, ProgramStatus, ProgramCategory, SavedProgram
from app.schemas import (
    ProgramsListResponse,
    ProgramDetail,
    ProgramSummary,
    PaginationMeta,
    BaseResponse,
)

router = APIRouter(prefix="/programs", tags=["Government Programs"])


@router.get(
    "",
    response_model=ProgramsListResponse,
    summary="List all government programs",
    description="""
    Returns a paginated list of government programs.
    Supports filtering by category, region, status, and keyword search.
    When authenticated, includes the user's match scores.
    """,
)
async def list_programs(
    db: DB,
    current_user: OptionalUser,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    category: Optional[str] = Query(default=None),
    region: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default="active"),
    language: str = Query(default="ru"),
    search: Optional[str] = Query(default=None, min_length=2),
) -> ProgramsListResponse:
    query = select(GovernmentProgram)

    # ---- Filters ----
    if status:
        try:
            status_enum = ProgramStatus(status)
            query = query.where(GovernmentProgram.status == status_enum)
        except ValueError:
            pass

    if category:
        try:
            cat_enum = ProgramCategory(category)
            query = query.where(GovernmentProgram.category == cat_enum)
        except ValueError:
            pass

    if region:
        query = query.where(
            or_(
                GovernmentProgram.regions.is_(None),
                GovernmentProgram.regions.contains([region]),
            )
        )

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                GovernmentProgram.title_ru.ilike(search_term),
                GovernmentProgram.title_en.ilike(search_term),
                GovernmentProgram.description_ru.ilike(search_term),
                GovernmentProgram.organization.ilike(search_term),
            )
        )

    # ---- Count total ----
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # ---- Paginate ----
    query = query.order_by(desc(GovernmentProgram.created_at))
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    programs = result.scalars().all()

    # ---- Build summaries ----
    summaries = [
        ProgramSummary(
            id=p.id,
            slug=p.slug,
            title=p.get_title(language),
            organization=p.organization,
            category=p.category.value,
            amount_min=p.amount_min,
            amount_max=p.amount_max,
            currency=p.currency,
            deadline=p.deadline,
            status=p.status.value,
            tags=p.tags,
            official_url=p.official_url,
        )
        for p in programs
    ]

    pages = (total + per_page - 1) // per_page

    return ProgramsListResponse(
        success=True,
        data=summaries,
        meta=PaginationMeta(total=total, page=page, per_page=per_page, pages=pages),
    )


@router.get(
    "/categories",
    summary="Get list of available program categories",
)
async def get_categories() -> dict:
    return {
        "categories": [c.value for c in ProgramCategory],
        "labels": {
            "grant": "Grants",
            "scholarship": "Scholarships",
            "subsidy": "Subsidies",
            "loan": "Loans",
            "incubator": "Incubators",
            "competition": "Competitions",
            "housing": "Housing",
            "social": "Social Support",
            "business": "Business",
            "education": "Education",
            "innovation": "Innovation",
        }
    }


@router.get(
    "/saved",
    response_model=list[ProgramSummary],
    summary="Get user's saved programs",
)
async def get_saved_programs(
    current_user: CurrentUser,
    db: DB,
    language: str = Query(default="ru"),
) -> list[ProgramSummary]:
    result = await db.execute(
        select(GovernmentProgram)
        .join(SavedProgram, SavedProgram.program_id == GovernmentProgram.id)
        .where(SavedProgram.user_id == current_user.id)
        .order_by(desc(SavedProgram.created_at))
    )
    programs = result.scalars().all()

    return [
        ProgramSummary(
            id=p.id,
            slug=p.slug,
            title=p.get_title(language),
            organization=p.organization,
            category=p.category.value,
            amount_min=p.amount_min,
            amount_max=p.amount_max,
            currency=p.currency,
            deadline=p.deadline,
            status=p.status.value,
            tags=p.tags,
            official_url=p.official_url,
        )
        for p in programs
    ]


@router.get(
    "/{slug}",
    response_model=ProgramDetail,
    summary="Get full program details by slug",
)
async def get_program(
    slug: str,
    db: DB,
    language: str = Query(default="ru"),
) -> ProgramDetail:
    result = await db.execute(
        select(GovernmentProgram).where(GovernmentProgram.slug == slug)
    )
    program = result.scalar_one_or_none()

    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Program '{slug}' not found",
        )

    # Increment view count
    program.views_count += 1

    return ProgramDetail(
        id=program.id,
        slug=program.slug,
        title_kz=program.title_kz,
        title_ru=program.title_ru,
        title_en=program.title_en,
        description_ru=program.description_ru,
        description_en=program.description_en,
        category=program.category.value,
        tags=program.tags,
        ministry=program.ministry,
        organization=program.organization,
        amount_min=program.amount_min,
        amount_max=program.amount_max,
        currency=program.currency,
        is_grant=program.is_grant,
        age_min=program.age_min,
        age_max=program.age_max,
        regions=program.regions,
        requires_student=program.requires_student,
        requires_kz_citizen=program.requires_kz_citizen,
        income_max=program.income_max,
        required_documents=program.required_documents,
        deadline=program.deadline,
        open_date=program.open_date,
        official_url=program.official_url,
        application_url=program.application_url,
        contact_email=program.contact_email,
        contact_phone=program.contact_phone,
        status=program.status.value,
        views_count=program.views_count,
        requirements=program.requirements,
    )


@router.post(
    "/{program_id}/save",
    response_model=BaseResponse,
    summary="Save or unsave a program",
)
async def toggle_save_program(
    program_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
) -> BaseResponse:
    # Check if already saved
    result = await db.execute(
        select(SavedProgram).where(
            SavedProgram.user_id == current_user.id,
            SavedProgram.program_id == program_id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        return BaseResponse(success=True, message="Program removed from saved")
    else:
        saved = SavedProgram(user_id=current_user.id, program_id=program_id)
        db.add(saved)
        return BaseResponse(success=True, message="Program saved")
