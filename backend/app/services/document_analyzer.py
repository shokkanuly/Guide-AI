"""
GovGuide AI — AI Document Analyzer Service
Extracts text from PDFs using Docling and runs Gemini structured analysis.
"""
import json
import time
import tempfile
import os
from typing import Optional
import google.generativeai as genai
from fastapi.concurrency import run_in_threadpool
from docling.document_converter import DocumentConverter

from app.config import settings
from app.services.ai_service import get_ai_client

ANALYSIS_SYSTEM_PROMPT = """You are GovGuide AI — an expert AI assistant specializing in analyzing
Kazakhstani government documents, laws, regulations, grants, and official PDFs.

Your task is to analyze the provided document and return a structured JSON analysis.
Respond ONLY with valid JSON, no markdown, no extra text.

The JSON must follow this exact schema:
{
  "summary": "Plain language summary of what this document is about (2-4 sentences)",
  "document_type": "One of: grant | law | regulation | tender | contract | announcement | form | other",
  "language": "detected language: kk | ru | en",
  "advantages": ["List of benefits for the user/applicant"],
  "disadvantages": ["List of limitations, restrictions, or downsides"],
  "risks": ["Potential risks, pitfalls, or things to watch out for"],
  "important_dates": [
    {"label": "Application deadline", "date": "YYYY-MM-DD or descriptive text", "note": "optional context"}
  ],
  "required_documents": [
    {"name": "Document name", "description": "Why it is needed", "where_to_get": "How/where to obtain it"}
  ],
  "action_plan": [
    {"step": 1, "title": "Step title", "description": "What to do", "action_url": null}
  ],
  "sources": [
    {"title": "Source name", "url": "URL if mentioned in the document", "organization": "Ministry/agency name"}
  ],
  "key_amounts": [
    {"label": "Grant amount", "value": "500,000 ₸", "note": "optional context"}
  ],
  "eligibility_summary": "Plain language: who qualifies for this (1-2 sentences)",
  "confidence_score": 0.95
}

Rules:
- Respond in the SAME language as the document (Kazakh/Russian/English)
- Extract real data — do not invent amounts, dates, or URLs not in the document
- If a field has no data, use an empty array [] or null
- Keep summary under 200 words
- Action plan should have 3-7 concrete steps"""

def _convert_pdf_sync(file_path: str) -> str:
    """Run Docling converter synchronously."""
    converter = DocumentConverter()
    result = converter.convert(file_path)
    return result.document.export_to_markdown()

async def extract_text_from_pdf(content: bytes) -> str:
    """Extract text from PDF bytes using Docling."""
    try:
        def run():
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(content)
                tmp_path = tmp.name
            try:
                return _convert_pdf_sync(tmp_path)
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
                    
        return await run_in_threadpool(run)
    except Exception as e:
        raise ValueError(f"Docling failed to parse PDF document: {e}")

async def analyze_document(
    content: bytes,
    filename: str,
    language: Optional[str] = None,
) -> dict:
    """
    Main analysis pipeline:
    1. Extract text/markdown from PDF using Docling
    2. Send to Gemini 1.5 Pro with structured prompt
    3. Parse and return JSON result
    """
    start = time.time()

    # Step 1: Extract text using Docling
    text = await extract_text_from_pdf(content)
    if not text or len(text.strip()) < 50:
        raise ValueError("Document appears to be empty or unreadable (scanned image PDF requires OCR)")

    # Limit text to ~200k characters (Gemini can handle 1M+ tokens easily, so 200k is very safe)
    truncated = text[:200000]
    was_truncated = len(text) > 200000

    # Step 2: Build prompt
    user_content = f"""Document filename: {filename}
Total characters extracted: {len(text)}
{"[NOTE: Document was truncated to first ~200,000 characters for analysis]" if was_truncated else ""}

--- DOCUMENT CONTENT ---
{truncated}
--- END OF DOCUMENT ---

Please analyze this document and return the structured JSON analysis."""

    # Configure Gemini SDK
    api_key = settings.gemini_api_key or settings.openai_api_key
    # Check if we should use Google Gen AI SDK
    if settings.gemini_api_key and settings.gemini_api_key != "sk-placeholder" and settings.gemini_api_key != "":
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(
            model_name="gemini-1.5-pro",
            system_instruction=ANALYSIS_SYSTEM_PROMPT
        )
        response = await model.generate_content_async(
            user_content,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.1,
            }
        )
        raw = response.text
        model_name = "gemini-1.5-pro"
        tokens_used = 0  # Gemini SDK doesn't expose usage directly on the async response text call easily, default to 0
    else:
        # Fallback to OpenAI
        from openai import AsyncOpenAI
        ai_client = AsyncOpenAI(api_key=settings.openai_api_key)
        messages = [
            {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ]
        response = await ai_client.chat.completions.create(
            model=settings.openai_model,
            messages=messages,
            max_tokens=3000,
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content
        model_name = settings.openai_model
        tokens_used = response.usage.total_tokens if response.usage else 0

    processing_ms = int((time.time() - start) * 1000)

    # Step 4: Parse JSON
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        # Fallback: extract JSON from response if wrapped in markdown
        import re
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            result = json.loads(match.group())
        else:
            raise ValueError("AI returned invalid JSON response")

    # Enrich with metadata
    result["_meta"] = {
        "filename": filename,
        "chars_extracted": len(text),
        "was_truncated": was_truncated,
        "tokens_used": tokens_used,
        "processing_ms": processing_ms,
        "model": model_name,
    }

    return result
