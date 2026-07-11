"""
GovGuide AI — Chat API Routes
POST /api/v1/chat              — Send a message, get AI response
GET  /api/v1/chat/sessions     — List user's chat sessions
GET  /api/v1/chat/sessions/{id}/messages — Get session history
DELETE /api/v1/chat/sessions/{id}        — Delete a session
POST /api/v1/chat/messages/{id}/rate     — Rate an AI response
"""
import uuid
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, desc

from app.core.dependencies import DB, CurrentUser
from app.models.chat import ChatSession, ChatMessage, MessageRole
from app.schemas import (
    ChatMessageCreate,
    ChatResponse,
    ChatSessionInfo,
    MessageRatingRequest,
    BaseResponse,
)
from app.services.ai_service import AIService

router = APIRouter(prefix="/chat", tags=["AI Chat"])
ai_service = AIService()


@router.post(
    "",
    response_model=ChatResponse,
    summary="Send a message to GovGuide AI",
    description="""
    Main chat endpoint. Accepts a user message and returns an AI-generated response
    with relevant government programs, required documents, and source citations.

    - If `session_id` is null, a new session is created
    - Conversation history is automatically included for context
    - Response includes matched programs and document requirements
    """,
)
async def send_message(
    request: ChatMessageCreate,
    current_user: CurrentUser,
    db: DB,
) -> ChatResponse:
    # ---- Get or create chat session ----
    if request.session_id:
        result = await db.execute(
            select(ChatSession).where(
                ChatSession.id == request.session_id,
                ChatSession.user_id == current_user.id,
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found",
            )
    else:
        session = ChatSession(
            user_id=current_user.id,
            title=request.message[:60],  # Use first 60 chars as title
            language=request.language or current_user.language.value,
        )
        db.add(session)
        await db.flush()

    # ---- Load conversation history ----
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(12)
    )
    history_messages = history_result.scalars().all()
    conversation_history = [
        {"role": msg.role.value, "content": msg.content}
        for msg in history_messages
    ]

    # ---- Build user profile for context ----
    user_profile = {
        "age": current_user.age,
        "region": current_user.region,
        "employment": current_user.employment_status.value if current_user.employment_status else None,
        "is_student": current_user.is_student,
        "interests": current_user.interests,
        "monthly_income": current_user.monthly_income,
    }

    # ---- Call AI Service ----
    ai_response = await ai_service.chat(
        request=request,
        user_profile=user_profile,
        conversation_history=conversation_history,
    )
    ai_response.session_id = session.id

    # ---- Save messages to DB ----
    user_msg = ChatMessage(
        session_id=session.id,
        role=MessageRole.USER,
        content=request.message,
    )
    ai_msg = ChatMessage(
        session_id=session.id,
        role=MessageRole.ASSISTANT,
        content=ai_response.answer,
        model_used=f"openai/{ai_response.agent_used}",
        processing_time_ms=ai_response.processing_time_ms,
        retrieved_sources=[s.model_dump() for s in (ai_response.sources or [])],
        referenced_programs=[p.model_dump() for p in (ai_response.programs_found or [])],
        agent_type=ai_response.agent_used,
    )
    db.add(user_msg)
    db.add(ai_msg)
    await db.flush()

    ai_response.message_id = ai_msg.id
    return ai_response


@router.get(
    "/sessions",
    response_model=list[ChatSessionInfo],
    summary="List all chat sessions for the current user",
)
async def list_sessions(
    current_user: CurrentUser,
    db: DB,
    limit: int = 20,
) -> list[ChatSessionInfo]:
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id, ChatSession.is_active == True)
        .order_by(desc(ChatSession.created_at))
        .limit(limit)
    )
    sessions = result.scalars().all()

    # Build response with message counts
    session_infos = []
    for s in sessions:
        count_result = await db.execute(
            select(ChatMessage).where(ChatMessage.session_id == s.id)
        )
        count = len(count_result.scalars().all())
        session_infos.append(ChatSessionInfo(
            id=s.id,
            title=s.title,
            created_at=s.created_at,
            message_count=count,
        ))
    return session_infos


@router.get(
    "/sessions/{session_id}/messages",
    summary="Get all messages in a chat session",
)
async def get_session_messages(
    session_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
) -> list[dict]:
    # Verify ownership
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    msgs_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = msgs_result.scalars().all()

    return [
        {
            "id": str(m.id),
            "role": m.role.value,
            "content": m.content,
            "created_at": m.created_at.isoformat(),
            "programs": m.referenced_programs,
            "sources": m.retrieved_sources,
        }
        for m in messages
    ]


@router.delete(
    "/sessions/{session_id}",
    response_model=BaseResponse,
    summary="Delete a chat session",
)
async def delete_session(
    session_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
) -> BaseResponse:
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    session.is_active = False
    return BaseResponse(success=True, message="Session deleted")


@router.post(
    "/messages/{message_id}/rate",
    response_model=BaseResponse,
    summary="Rate an AI response (1-5 stars)",
)
async def rate_message(
    message_id: uuid.UUID,
    request: MessageRatingRequest,
    current_user: CurrentUser,
    db: DB,
) -> BaseResponse:
    result = await db.execute(
        select(ChatMessage)
        .join(ChatSession, ChatMessage.session_id == ChatSession.id)
        .where(
            ChatMessage.id == message_id,
            ChatSession.user_id == current_user.id,
        )
    )
    message = result.scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    message.user_rating = request.rating
    message.was_helpful = request.was_helpful
    return BaseResponse(success=True, message="Rating saved. Thank you!")
