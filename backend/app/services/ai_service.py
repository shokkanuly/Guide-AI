"""
GovGuide AI — AI Orchestrator Service
Routes user queries to specialized agents, assembles final response.
"""
import time
import uuid
from typing import Optional
import google.generativeai as genai

from openai import AsyncOpenAI

from app.config import settings
from app.schemas import ChatMessageCreate, ChatResponse, ProgramMatch, SourceReference
from app.services.rag_service import RAGService

def get_ai_client(task_type: str = "chat"):
    if settings.gemini_api_key and settings.gemini_api_key != "sk-placeholder" and settings.gemini_api_key != "":
        return AsyncOpenAI(
            api_key=settings.gemini_api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        ), "gemini-1.5-pro" if task_type == "analyze" else "gemini-1.5-flash"
    else:
        return AsyncOpenAI(api_key=settings.openai_api_key), settings.openai_model


rag_service = RAGService()

# ---- System prompt ----
SYSTEM_PROMPT = """You are GovGuide AI — an expert AI assistant helping citizens of Kazakhstan 
navigate government programs, grants, subsidies, scholarships, and social support.

Your role:
1. Understand the user's question and profile
2. Find relevant government programs from the provided context
3. Explain eligibility criteria in simple, friendly language
4. List required documents clearly
5. Provide step-by-step guidance
6. Always cite official sources (egov.kz, baiterek.gov.kz, etc.)

Rules:
- Respond in the same language the user writes in (Kazakh/Russian/English)
- Be concise but complete — no fluff
- If unsure, say so and direct to the official source
- Never make up programs or amounts
- Format lists clearly with bullet points

Context from government documents will be provided. Use it faithfully."""


class AIService:
    """
    Main AI orchestrator. Coordinates the RAG pipeline + OpenAI call.
    In a production multi-agent system, this delegates to specialized agents.
    """

    async def chat(
        self,
        request: ChatMessageCreate,
        user_profile: Optional[dict] = None,
        conversation_history: Optional[list] = None,
    ) -> ChatResponse:
        """
        Main entry point for the AI chat endpoint.
        1. Retrieve relevant government docs via RAG
        2. Build prompt with context + user profile
        3. Call OpenAI GPT
        4. Parse response and extract structured data
        """
        start_time = time.time()
        session_id = request.session_id or uuid.uuid4()
        message_id = uuid.uuid4()

        # ---- Step 1: RAG Retrieval ----
        retrieved_docs = await rag_service.retrieve(
            query=request.message,
            top_k=5,
            language=request.language or "ru",
        )

        # ---- Step 2: Build Context ----
        context_text = self._format_context(retrieved_docs)
        profile_text = self._format_profile(user_profile)

        # ---- Step 3: Build Messages ----
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        if profile_text:
            messages.append({
                "role": "system",
                "content": f"User Profile:\n{profile_text}",
            })

        if context_text:
            messages.append({
                "role": "system",
                "content": f"Relevant Government Documents:\n{context_text}",
            })

        # Inject conversation history (last 6 turns)
        if conversation_history:
            messages.extend(conversation_history[-12:])

        messages.append({"role": "user", "content": request.message})

        # ---- Step 4: AI Call ----
        if settings.gemini_api_key and settings.gemini_api_key != "sk-placeholder" and settings.gemini_api_key != "":
            genai.configure(api_key=settings.gemini_api_key)
            
            # Combine system instructions
            system_instruction_parts = [SYSTEM_PROMPT]
            if profile_text:
                system_instruction_parts.append(f"User Profile:\n{profile_text}")
            if context_text:
                system_instruction_parts.append(f"Relevant Government Documents:\n{context_text}")
            system_instruction = "\n\n---\n\n".join(system_instruction_parts)
            
            # Convert history to Gemini format
            gemini_history = []
            if conversation_history:
                for msg in conversation_history[-12:]:
                    role = msg.get("role")
                    if role == "assistant":
                        role = "model"
                    elif role == "system":
                        continue
                    gemini_history.append({
                        "role": role,
                        "parts": [msg.get("content")]
                    })
            
            # Append final message
            gemini_history.append({
                "role": "user",
                "parts": [request.message]
            })
            
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=system_instruction
            )
            response = await model.generate_content_async(
                gemini_history,
                generation_config={
                    "temperature": settings.openai_temperature,
                }
            )
            answer = response.text
            tokens_used = 0
        else:
            # Fallback to OpenAI
            ai_client, model_name = get_ai_client("chat")
            response = await ai_client.chat.completions.create(
                model=model_name,
                messages=messages,
                max_tokens=settings.openai_max_tokens,
                temperature=settings.openai_temperature,
            )
            answer = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if response.usage else 0

        # ---- Step 5: Extract structured data ----
        programs_found = self._extract_programs(retrieved_docs)
        required_docs = self._extract_documents(answer)
        sources = self._format_sources(retrieved_docs)

        processing_time_ms = int((time.time() - start_time) * 1000)

        return ChatResponse(
            session_id=session_id,
            message_id=message_id,
            answer=answer,
            programs_found=programs_found if programs_found else None,
            required_documents=required_docs if required_docs else None,
            action_suggestions=self._extract_suggestions(answer),
            sources=sources if sources else None,
            agent_used="ai_orchestrator",
            processing_time_ms=processing_time_ms,
        )

    def _format_context(self, docs: list) -> str:
        if not docs:
            return ""
        parts = []
        for i, doc in enumerate(docs, 1):
            parts.append(
                f"[Source {i}] {doc.get('title', 'Unknown')}\n"
                f"Score: {doc.get('score', 0):.2f}\n"
                f"{doc.get('content', '')}\n"
                f"URL: {doc.get('url', 'N/A')}"
            )
        return "\n\n---\n\n".join(parts)

    def _format_profile(self, profile: Optional[dict]) -> str:
        if not profile:
            return ""
        lines = []
        for k, v in profile.items():
            if v is not None:
                lines.append(f"- {k}: {v}")
        return "\n".join(lines)

    def _extract_programs(self, docs: list) -> list[ProgramMatch]:
        """Convert retrieved RAG docs into ProgramMatch objects."""
        programs = []
        seen = set()
        for doc in docs:
            program_id = doc.get("program_id")
            if program_id and program_id not in seen:
                seen.add(program_id)
                programs.append(ProgramMatch(
                    program_id=program_id,
                    title=doc.get("title", "Unknown Program"),
                    organization=doc.get("organization", ""),
                    match_score=round(doc.get("score", 0.5) * 100, 1),
                    amount_display=doc.get("amount_display"),
                    deadline=doc.get("deadline"),
                    slug=doc.get("slug", ""),
                ))
        return programs[:5]

    def _extract_documents(self, answer: str) -> list[str]:
        """Heuristically extract document list from AI answer."""
        docs = []
        common_docs = [
            "Passport", "ID Card", "Student Certificate", "Business Plan",
            "Tax Certificate", "Income Certificate", "Transcript",
            "Family Composition Certificate", "Medical Certificate",
        ]
        for doc in common_docs:
            if doc.lower() in answer.lower():
                docs.append(doc)
        return docs

    def _extract_suggestions(self, answer: str) -> list[str]:
        """Extract action suggestions from AI response."""
        suggestions = []
        if "apply" in answer.lower() or "submit" in answer.lower():
            suggestions.append("Start your application now")
        if "document" in answer.lower():
            suggestions.append("Check your document checklist")
        if "deadline" in answer.lower():
            suggestions.append("Set a deadline reminder")
        return suggestions[:3]

    def _format_sources(self, docs: list) -> list[SourceReference]:
        sources = []
        for doc in docs:
            sources.append(SourceReference(
                document_id=str(doc.get("id", uuid.uuid4())),
                title=doc.get("title", "Government Document"),
                snippet=doc.get("content", "")[:200] + "...",
                score=doc.get("score", 0.0),
                source_url=doc.get("url"),
            ))
        return sources
