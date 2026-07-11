"""
GovGuide AI — Document Analysis API Routes
POST /api/v1/analyze/document   — Upload PDF and get AI analysis
GET  /api/v1/analyze/{doc_id}   — Retrieve previous analysis
GET  /api/v1/search             — Government-wide semantic search
"""
import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Query
from sqlalchemy import select

from app.core.dependencies import DB, CurrentUser
from app.models.application import Document, DocumentType, DocumentStatus
from app.services.document_analyzer import analyze_document

analyze_router = APIRouter(prefix="/analyze", tags=["AI Document Analyzer"])
search_router = APIRouter(prefix="/search", tags=["Government Search"])


# ================================================================
# DOCUMENT ANALYSIS
# ================================================================

@analyze_router.post(
    "/document",
    summary="Upload a PDF and get full AI analysis",
    description="""
Upload any government PDF document. GovGuide AI will:

1. Extract text from the PDF
2. Analyze with GPT-4o
3. Return structured analysis with:
   - Summary in plain language
   - Advantages & disadvantages
   - Risks and pitfalls
   - Important dates and deadlines
   - Required documents checklist
   - Step-by-step action plan
   - Official source references
   - Key amounts (grants, subsidies)
   - Eligibility summary

**Supports:** PDF files up to 20MB (first 30 pages analyzed).
    """,
)
async def analyze_pdf_document(
    current_user: CurrentUser,
    db: DB,
    file: UploadFile = File(..., description="PDF document to analyze"),
) -> dict:
    # Validate file type
    if file.content_type not in {"application/pdf"}:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF files are supported. Please upload a .pdf file.",
        )

    # Read and validate size (20MB)
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum size is 20MB.",
        )
    if len(content) < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File appears to be empty or corrupted.",
        )

    # Save document record to DB
    doc = Document(
        user_id=current_user.id,
        doc_type=DocumentType.OTHER,
        status=DocumentStatus.PROCESSING,
        original_filename=file.filename or "document.pdf",
        s3_key=f"users/{current_user.id}/analyzed/{uuid.uuid4()}.pdf",
        s3_url=None,
        file_size_bytes=len(content),
        mime_type="application/pdf",
        ai_analysis={},
    )
    db.add(doc)
    await db.flush()

    # Run AI analysis
    try:
        analysis = await analyze_document(
            content=content,
            filename=file.filename or "document.pdf",
        )

        # Update DB record
        doc.ai_analysis = analysis
        doc.status = DocumentStatus.VERIFIED
        await db.flush()

        return {
            "success": True,
            "document_id": str(doc.id),
            "filename": file.filename,
            "analysis": analysis,
        }

    except ValueError as e:
        doc.status = DocumentStatus.REJECTED
        doc.ai_analysis = {"error": str(e)}
        await db.flush()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception as e:
        doc.status = DocumentStatus.REJECTED
        await db.flush()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis failed: {str(e)}",
        )


@analyze_router.get(
    "/{document_id}",
    summary="Retrieve a previously analyzed document",
)
async def get_analysis(
    document_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
) -> dict:
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    return {
        "success": True,
        "document_id": str(doc.id),
        "filename": doc.original_filename,
        "status": doc.status.value,
        "created_at": doc.created_at.isoformat(),
        "analysis": doc.ai_analysis or {},
    }


# ================================================================
# GOVERNMENT SEARCH ENGINE
# ================================================================

@search_router.get(
    "",
    summary="Search across all government programs and documents",
    description="""
Semantic search across the entire GovGuide AI knowledge base:
- Government programs (grants, subsidies, scholarships)
- Laws and regulations
- FAQ documents

Returns results ranked by relevance score.
    """,
)
async def government_search(
    q: str = Query(..., min_length=2, description="Search query"),
    type: str = Query(default="all", description="Filter: all | programs | laws"),
    limit: int = Query(default=10, ge=1, le=50),
    db: DB = None,
) -> dict:
    from app.services.rag_service import RAGService

    if not q.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Query cannot be empty")

    rag = RAGService()

    try:
        if type == "programs":
            from app.config import settings as cfg
            results = await rag.retrieve(q, top_k=limit, collection_name=cfg.chroma_collection_programs)
        elif type == "laws":
            from app.config import settings as cfg
            results = await rag.retrieve(q, top_k=limit, collection_name=cfg.chroma_collection_laws)
        else:
            results = await rag.retrieve(q, top_k=limit)
    except Exception:
        results = []

    # Also search PostgreSQL programs table
    from app.models.program import GovernmentProgram, ProgramStatus
    from sqlalchemy import or_, func
    pg_result = await db.execute(
        select(GovernmentProgram)
        .where(
            GovernmentProgram.status == ProgramStatus.ACTIVE,
            or_(
                GovernmentProgram.title_ru.ilike(f"%{q}%"),
                GovernmentProgram.title_kk.ilike(f"%{q}%"),
                GovernmentProgram.description_ru.ilike(f"%{q}%"),
            ),
        )
        .limit(limit)
    )
    pg_programs = pg_result.scalars().all()

    # Format PostgreSQL results
    pg_formatted = [
        {
            "id": str(p.id),
            "type": "program",
            "title": p.title_ru,
            "organization": p.organization,
            "category": p.category.value,
            "score": 0.9,
            "source": "database",
            "url": p.official_url,
            "amount": f"{p.amount_min:,.0f}–{p.amount_max:,.0f} {p.currency}" if p.amount_min else None,
            "deadline": str(p.deadline) if p.deadline else None,
        }
        for p in pg_programs
    ]

    # Format vector search results
    vector_formatted = [
        {
            "id": r.get("id", ""),
            "type": "program" if r.get("program_id") else "document",
            "title": r.get("title", "Government Document"),
            "organization": r.get("organization", ""),
            "score": round(r.get("score", 0), 3),
            "source": "vector_search",
            "url": r.get("url") or r.get("source_url"),
            "snippet": r.get("content", "")[:300],
        }
        for r in results
    ]

    # Merge and deduplicate by title, sort by score
    all_results = pg_formatted + vector_formatted
    all_results.sort(key=lambda x: x["score"], reverse=True)

    return {
        "success": True,
        "query": q,
        "total": len(all_results),
        "results": all_results[:limit],
    }
