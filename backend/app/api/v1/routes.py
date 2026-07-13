"""
GovGuide AI — Eligibility, Documents, Notifications, Users API Routes
"""
import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Query
from sqlalchemy import select, desc, func
from sqlalchemy.sql.expression import update

from app.core.dependencies import DB, CurrentUser
from app.models.user import User
from app.models.application import Document, DocumentType, DocumentStatus, Notification
from app.schemas import (
    EligibilityCheckRequest,
    EligibilityResponse,
    DocumentUploadResponse,
    DocumentListItem,
    DocumentsListResponse,
    NotificationsListResponse,
    NotificationItem,
    UserProfile,
    UpdateProfileRequest,
    BaseResponse,
    CreateApplicationRequest,
    ApplicationResponse,
    ApplicationsListResponse,
    PaginationMeta,
    RoadmapStep,
    UpdateStepRequest,
)
from app.services.eligibility_service import EligibilityService

eligibility_service = EligibilityService()


# ================================================================
# USERS ROUTER
# ================================================================
users_router = APIRouter(prefix="/users", tags=["Users"])


@users_router.get(
    "/me",
    response_model=UserProfile,
    summary="Get current user profile",
)
async def get_profile(current_user: CurrentUser) -> UserProfile:
    return UserProfile.model_validate(current_user)


@users_router.put(
    "/me",
    response_model=UserProfile,
    summary="Update user profile",
    description="Update any profile fields. Partial updates supported.",
)
async def update_profile(
    request: UpdateProfileRequest,
    current_user: CurrentUser,
    db: DB,
) -> UserProfile:
    update_data = request.model_dump(exclude_none=True)

    for field, value in update_data.items():
        if hasattr(current_user, field):
            setattr(current_user, field, value)

    await db.flush()
    return UserProfile.model_validate(current_user)


@users_router.delete(
    "/me",
    response_model=BaseResponse,
    summary="Delete user account",
)
async def delete_account(current_user: CurrentUser, db: DB) -> BaseResponse:
    current_user.is_active = False
    return BaseResponse(success=True, message="Account deactivated successfully")


@users_router.get(
    "/me/dashboard",
    summary="Get dashboard summary for current user",
)
async def get_dashboard(current_user: CurrentUser, db: DB) -> dict:
    """Returns aggregated data for the user dashboard."""
    from app.models.application import Application, ApplicationStatus
    from app.models.program import SavedProgram

    # Count applications
    apps_result = await db.execute(
        select(func.count()).where(Application.user_id == current_user.id)
    )
    apps_count = apps_result.scalar_one()

    # Count saved programs
    saved_result = await db.execute(
        select(func.count()).where(SavedProgram.user_id == current_user.id)
    )
    saved_count = saved_result.scalar_one()

    # Count unread notifications
    notif_result = await db.execute(
        select(func.count()).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
    )
    unread_count = notif_result.scalar_one()

    # Profile completeness
    profile_fields = [
        current_user.age, current_user.region, current_user.employment_status,
        current_user.monthly_income, current_user.interests,
    ]
    completeness = sum(1 for f in profile_fields if f is not None) / len(profile_fields) * 100

    return {
        "user": {
            "name": current_user.full_name,
            "email": current_user.email,
            "is_premium": current_user.is_premium,
            "profile_completeness": round(completeness, 1),
        },
        "stats": {
            "applications_count": apps_count,
            "saved_programs": saved_count,
            "unread_notifications": unread_count,
        },
    }


# ================================================================
# ELIGIBILITY ROUTER
# ================================================================
eligibility_router = APIRouter(prefix="/eligibility", tags=["Eligibility"])


@eligibility_router.get(
    "/demo-profiles",
    summary="Get predefined mock profiles for demo",
)
async def get_demo_profiles() -> list:
    from app.utils.seed_data import DEMO_PROFILES
    return DEMO_PROFILES


@eligibility_router.post(
    "/check",
    response_model=EligibilityResponse,
    summary="Check which programs you qualify for",
    description="""
    Runs the eligibility engine against all active government programs.

    **Scoring criteria:**
    - Age match (20 pts)
    - Student/employment status (20 pts)
    - Region eligibility (15 pts)
    - Income requirements (15 pts)
    - Interest alignment (30 pts)

    Returns programs sorted by match score (0-100%).
    """,
)
async def check_eligibility(
    request: EligibilityCheckRequest,
    db: DB,
) -> EligibilityResponse:
    return await eligibility_service.check(request, db)


@eligibility_router.get(
    "/quick",
    response_model=EligibilityResponse,
    summary="Quick eligibility check using saved profile",
    description="Uses the authenticated user's stored profile for eligibility check.",
)
async def quick_eligibility_check(
    current_user: CurrentUser,
    db: DB,
    language: str = Query(default="ru"),
) -> EligibilityResponse:
    if not current_user.age or not current_user.region:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your profile (age and region required)",
        )

    request = EligibilityCheckRequest(
        age=current_user.age,
        region=current_user.region or "",
        employment_status=current_user.employment_status.value if current_user.employment_status else "unemployed",
        monthly_income=current_user.monthly_income,
        is_student=current_user.is_student,
        has_family=current_user.has_family,
        family_size=current_user.family_size,
        is_business_owner=current_user.is_business_owner,
        interests=current_user.interests,
        language=language,
    )
    return await eligibility_service.check(request, db)


# ================================================================
# DOCUMENTS ROUTER
# ================================================================
documents_router = APIRouter(prefix="/documents", tags=["Documents"])


@documents_router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a document for AI analysis",
    description="""
    Upload any government document (PDF, JPG, PNG).

    AI will:
    1. Extract text via OCR (if enabled)
    2. Identify the document type
    3. Validate required fields
    4. Check expiry dates
    5. Flag any issues
    """,
)
async def upload_document(
    current_user: CurrentUser,
    db: DB,
    file: UploadFile = File(...),
    doc_type: Optional[str] = None,
) -> DocumentUploadResponse:
    # Validate file type
    allowed_types = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type {file.content_type} not supported. Use PDF, JPG, or PNG.",
        )

    # File size check (10MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum size is 10MB.",
        )

    # TODO: Upload to S3
    s3_key = f"users/{current_user.id}/documents/{uuid.uuid4()}/{file.filename}"
    s3_url = f"https://{settings_placeholder_bucket}.s3.amazonaws.com/{s3_key}"

    # TODO: Trigger AI analysis (async via Celery)
    ai_analysis = {
        "valid": True,
        "expires_at": None,
        "detected_type": doc_type or "unknown",
    }

    # Determine doc type enum
    doc_type_enum = DocumentType.OTHER
    if doc_type:
        try:
            doc_type_enum = DocumentType(doc_type)
        except ValueError:
            pass

    # Save document record
    doc = Document(
        user_id=current_user.id,
        doc_type=doc_type_enum,
        status=DocumentStatus.PROCESSING,
        original_filename=file.filename or "document",
        s3_key=s3_key,
        s3_url=s3_url,
        file_size_bytes=len(content),
        mime_type=file.content_type,
        ai_analysis=ai_analysis,
    )
    db.add(doc)
    await db.flush()

    return DocumentUploadResponse(
        document_id=doc.id,
        doc_type=doc.doc_type.value,
        status=doc.status.value,
        s3_url=doc.s3_url,
        ai_analysis=ai_analysis,
        ai_issues=[],
        ai_suggestions=["Document received. AI analysis in progress..."],
    )


@documents_router.get(
    "",
    response_model=DocumentsListResponse,
    summary="List all user documents",
)
async def list_documents(
    current_user: CurrentUser,
    db: DB,
    program_id: Optional[uuid.UUID] = Query(default=None),
) -> DocumentsListResponse:
    result = await db.execute(
        select(Document)
        .where(Document.user_id == current_user.id)
        .order_by(desc(Document.created_at))
    )
    docs = result.scalars().all()

    # Find missing documents for a specific program
    missing_for_program = None
    if program_id:
        from app.models.program import GovernmentProgram
        prog_result = await db.execute(
            select(GovernmentProgram).where(GovernmentProgram.id == program_id)
        )
        program = prog_result.scalar_one_or_none()
        if program and program.required_documents:
            uploaded_types = {d.doc_type.value for d in docs if d.status == DocumentStatus.VERIFIED}
            missing_for_program = [
                req for req in (program.required_documents or [])
                if req not in uploaded_types
            ]

    return DocumentsListResponse(
        success=True,
        data=[DocumentListItem.model_validate(d) for d in docs],
        missing_for_program=missing_for_program,
    )


@documents_router.delete(
    "/{document_id}",
    response_model=BaseResponse,
    summary="Delete a document",
)
async def delete_document(
    document_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
) -> BaseResponse:
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # TODO: Delete from S3
    await db.delete(doc)
    return BaseResponse(success=True, message="Document deleted")


# ================================================================
# APPLICATIONS ROUTER
# ================================================================
applications_router = APIRouter(prefix="/applications", tags=["Applications"])


@applications_router.post(
    "",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new program application",
)
async def create_application(
    request: CreateApplicationRequest,
    current_user: CurrentUser,
    db: DB,
) -> ApplicationResponse:
    from app.models.application import Application, ApplicationStatus
    from app.models.program import GovernmentProgram

    # Check if program exists
    prog_result = await db.execute(
        select(GovernmentProgram).where(GovernmentProgram.id == request.program_id)
    )
    program = prog_result.scalar_one_or_none()
    if not program:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program not found")

    # Check for duplicate application
    existing = await db.execute(
        select(Application).where(
            Application.user_id == current_user.id,
            Application.program_id == request.program_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Application for this program already exists",
        )

    # Generate AI roadmap
    roadmap = _generate_roadmap(program.required_documents or [])

    app = Application(
        user_id=current_user.id,
        program_id=request.program_id,
        status=ApplicationStatus.DRAFT,
        roadmap=[step.model_dump() for step in roadmap],
        notes=request.notes,
        current_step=0,
        completion_pct=0.0,
    )
    db.add(app)
    await db.flush()

    return ApplicationResponse(
        id=app.id,
        program_id=app.program_id,
        program_title=program.title_ru,
        status=app.status.value,
        roadmap=roadmap,
        current_step=app.current_step,
        completion_pct=app.completion_pct,
        attached_documents=[],
        notes=app.notes,
        created_at=app.created_at,
    )


@applications_router.get(
    "",
    response_model=ApplicationsListResponse,
    summary="List all user applications",
)
async def list_applications(
    current_user: CurrentUser,
    db: DB,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=10, ge=1, le=50),
) -> ApplicationsListResponse:
    from app.models.application import Application
    from app.models.program import GovernmentProgram

    result = await db.execute(
        select(Application, GovernmentProgram.title_ru)
        .join(GovernmentProgram, Application.program_id == GovernmentProgram.id)
        .where(Application.user_id == current_user.id)
        .order_by(desc(Application.created_at))
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    rows = result.all()

    total_result = await db.execute(
        select(func.count()).where(Application.user_id == current_user.id)
    )
    total = total_result.scalar_one()

    apps = [
        ApplicationResponse(
            id=row[0].id,
            program_id=row[0].program_id,
            program_title=row[1],
            status=row[0].status.value,
            roadmap=[RoadmapStep(**s) for s in (row[0].roadmap or [])],
            current_step=row[0].current_step,
            completion_pct=row[0].completion_pct,
            attached_documents=row[0].attached_documents or [],
            notes=row[0].notes,
            created_at=row[0].created_at,
        )
        for row in rows
    ]

    pages = (total + per_page - 1) // per_page
    return ApplicationsListResponse(
        success=True,
        data=apps,
        meta=PaginationMeta(total=total, page=page, per_page=per_page, pages=pages),
    )


@applications_router.get(
    "/{application_id}",
    response_model=ApplicationResponse,
    summary="Get detailed application roadmap by ID",
)
async def get_application_details(
    application_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
) -> ApplicationResponse:
    from app.models.application import Application
    from app.models.program import GovernmentProgram

    result = await db.execute(
        select(Application, GovernmentProgram.title_ru)
        .join(GovernmentProgram, Application.program_id == GovernmentProgram.id)
        .where(
            Application.id == application_id,
            Application.user_id == current_user.id
        )
    )
    row = result.first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application roadmap not found"
        )

    app, program_title = row

    return ApplicationResponse(
        id=app.id,
        program_id=app.program_id,
        program_title=program_title,
        status=app.status.value,
        roadmap=[RoadmapStep(**s) for s in (app.roadmap or [])],
        current_step=app.current_step,
        completion_pct=app.completion_pct,
        attached_documents=app.attached_documents or [],
        notes=app.notes,
        created_at=app.created_at,
    )


@applications_router.put(
    "/{application_id}/step",
    response_model=ApplicationResponse,
    summary="Update step status in application roadmap",
)
async def update_application_step(
    application_id: uuid.UUID,
    request: UpdateStepRequest,
    current_user: CurrentUser,
    db: DB,
) -> ApplicationResponse:
    from app.models.application import Application, ApplicationStatus
    from app.models.program import GovernmentProgram

    result = await db.execute(
        select(Application, GovernmentProgram.title_ru)
        .join(GovernmentProgram, Application.program_id == GovernmentProgram.id)
        .where(
            Application.id == application_id,
            Application.user_id == current_user.id
        )
    )
    row = result.first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application roadmap not found"
        )

    app, program_title = row
    
    # Update roadmap step status
    roadmap = list(app.roadmap or [])
    step_found = False
    
    for step_data in roadmap:
        if step_data.get("step") == request.step:
            step_data["status"] = request.status
            step_found = True
            break
            
    if not step_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Step {request.step} not found in this roadmap"
        )

    # Recalculate progress metrics
    done_steps = sum(1 for s in roadmap if s.get("status") == "done")
    total_steps = len(roadmap)
    completion_pct = round((done_steps / total_steps) * 100, 1) if total_steps > 0 else 0.0
    
    # Calculate current step (first step that is not done)
    current_step = 0
    for s in roadmap:
        if s.get("status") != "done":
            current_step = s.get("step") - 1
            break
    if all(s.get("status") == "done" for s in roadmap):
        current_step = total_steps
        app.status = ApplicationStatus.SUBMITTED

    # Write changes back
    app.roadmap = roadmap
    app.completion_pct = completion_pct
    app.current_step = current_step
    
    await db.flush()

    return ApplicationResponse(
        id=app.id,
        program_id=app.program_id,
        program_title=program_title,
        status=app.status.value,
        roadmap=[RoadmapStep(**s) for s in (app.roadmap or [])],
        current_step=app.current_step,
        completion_pct=app.completion_pct,
        attached_documents=app.attached_documents or [],
        notes=app.notes,
        created_at=app.created_at,
    )


def _generate_roadmap(required_docs: list[str]) -> list[RoadmapStep]:
    """Generate a step-by-step application roadmap with exactly 4 phases."""
    steps = []

    # Step 1: Document Checklist
    doc_str = ", ".join(d.replace("_", " ").title() for d in required_docs) if required_docs else "relevant criteria"
    steps.append(RoadmapStep(
        step=1, title="Document Checklist",
        description=f"Collect and verify all required documents: {doc_str}.",
        status="current", due_date=None, action_url="/documents",
    ))

    # Step 2: Application form
    steps.append(RoadmapStep(
        step=2, title="Fill Application Form",
        description="Prepare your business plan/application form details for formal review.",
        status="pending", due_date=None, action_url=None,
    ))

    # Step 3: Submission & Deadline
    steps.append(RoadmapStep(
        step=3, title="Track Deadline & Submission",
        description="Formally submit the application package on the official portal before the deadline.",
        status="pending", due_date=None, action_url=None,
    ))

    # Step 4: Follow-up
    steps.append(RoadmapStep(
        step=4, title="Follow-up & Monitoring",
        description="Monitor status notifications, attend interviews or phone verification calls if requested.",
        status="pending", due_date=None, action_url=None,
    ))

    return steps


# ================================================================
# NOTIFICATIONS ROUTER
# ================================================================
notifications_router = APIRouter(prefix="/notifications", tags=["Notifications"])


@notifications_router.get(
    "",
    response_model=NotificationsListResponse,
    summary="List all notifications for current user",
)
async def list_notifications(
    current_user: CurrentUser,
    db: DB,
    unread_only: bool = Query(default=False),
    limit: int = Query(default=50, le=100),
) -> NotificationsListResponse:
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.is_read == False)
    query = query.order_by(desc(Notification.created_at)).limit(limit)

    result = await db.execute(query)
    notifications = result.scalars().all()

    # Unread count
    unread_result = await db.execute(
        select(func.count()).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
    )
    unread_count = unread_result.scalar_one()

    return NotificationsListResponse(
        success=True,
        data=[NotificationItem.model_validate(n) for n in notifications],
        unread_count=unread_count,
    )


@notifications_router.post(
    "/{notification_id}/read",
    response_model=BaseResponse,
    summary="Mark a notification as read",
)
async def mark_as_read(
    notification_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
) -> BaseResponse:
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notif.is_read = True
    return BaseResponse(success=True, message="Marked as read")


@notifications_router.post(
    "/read-all",
    response_model=BaseResponse,
    summary="Mark all notifications as read",
)
async def mark_all_read(current_user: CurrentUser, db: DB) -> BaseResponse:
    from sqlalchemy import update as sql_update
    await db.execute(
        sql_update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    return BaseResponse(success=True, message="All notifications marked as read")


# Placeholder to avoid NameError in upload_document
settings_placeholder_bucket = "govguide-documents"
