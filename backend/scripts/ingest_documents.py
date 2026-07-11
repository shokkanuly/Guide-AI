"""
GovGuide AI — Document Ingestion Script
Run this to populate ChromaDB with government program data.

Usage:
    python scripts/ingest_documents.py

This script:
1. Reads government programs from the DB
2. Generates OpenAI embeddings for each
3. Stores them in ChromaDB for semantic search

For PDF ingestion:
1. Extracts text using pypdf
2. Chunks text into 500-token segments
3. Embeds and stores each chunk
"""
import asyncio
import uuid
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from pypdf import PdfReader
from pathlib import Path


async def ingest_programs_from_db():
    """Embed all active programs from PostgreSQL into ChromaDB."""
    from app.database import AsyncSessionLocal
    from app.models.program import GovernmentProgram, ProgramStatus
    from app.services.rag_service import RAGService
    from sqlalchemy import select

    rag = RAGService()

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(GovernmentProgram).where(GovernmentProgram.status == ProgramStatus.ACTIVE)
        )
        programs = result.scalars().all()
        print(f"Found {len(programs)} active programs to ingest...")

        for i, program in enumerate(programs):
            try:
                doc_id = await rag.ingest_program(
                    program_id=str(program.id),
                    title=program.title_ru,
                    description=program.description_ru or "",
                    organization=program.organization,
                    tags=program.tags or [],
                    url=program.official_url,
                    amount_display=f"{program.amount_min or 0:,.0f} – {program.amount_max or 0:,.0f} ₸",
                    deadline=program.deadline.isoformat() if program.deadline else None,
                    slug=program.slug,
                )
                # Save embedding ID back to program
                program.embedding_id = doc_id
                print(f"  [{i+1}/{len(programs)}] ✓ {program.title_ru[:50]}")
            except Exception as e:
                print(f"  [{i+1}/{len(programs)}] ✗ Error: {e}")

        await db.commit()
    print("✅ Program ingestion complete!")


async def ingest_pdf(pdf_path: str, title: str, doc_type: str = "regulation"):
    """
    Ingest a PDF document into ChromaDB.
    Splits text into ~500-token chunks with overlap.
    """
    from app.services.rag_service import RAGService

    rag = RAGService()
    reader = PdfReader(pdf_path)

    full_text = ""
    for page in reader.pages:
        full_text += page.extract_text() + "\n"

    # Simple chunking: split into ~1500-char chunks with 200-char overlap
    chunk_size = 1500
    overlap = 200
    chunks = []
    start = 0

    while start < len(full_text):
        end = start + chunk_size
        chunk = full_text[start:end]
        chunks.append(chunk)
        start = end - overlap

    print(f"Ingesting '{title}' ({len(chunks)} chunks)...")

    for i, chunk in enumerate(chunks):
        if chunk.strip():
            await rag.ingest_document_chunk(
                source_url=pdf_path,
                chunk_index=i,
                content=chunk,
                title=f"{title} (chunk {i+1})",
                doc_type=doc_type,
            )

    print(f"✅ Ingested {len(chunks)} chunks from {Path(pdf_path).name}")


async def seed_sample_programs():
    """Seed the database with sample Kazakhstan government programs."""
    from app.database import AsyncSessionLocal
    from app.models.program import GovernmentProgram, ProgramCategory, ProgramStatus

    SAMPLE_PROGRAMS = [
        {
            "slug": "youth-innovation-grant-2026",
            "title_ru": "Грант на молодёжные инновации 2026",
            "title_en": "Youth Innovation Grant 2026",
            "title_kz": "Жастардың инновациялары гранты 2026",
            "description_ru": "Государственный грант для молодых инноваторов в возрасте 18-35 лет. Поддерживает технологические стартапы и инновационные проекты.",
            "description_en": "Government grant for young innovators aged 18-35. Supports tech startups and innovative projects.",
            "category": ProgramCategory.GRANT,
            "organization": "Ministry of Digital Development",
            "ministry": "MCRIAP",
            "amount_min": 3_000_000,
            "amount_max": 5_000_000,
            "currency": "KZT",
            "age_min": 18,
            "age_max": 35,
            "requires_student": False,
            "requires_kz_citizen": True,
            "status": ProgramStatus.ACTIVE,
            "tags": ["innovation", "tech", "startup", "youth"],
            "required_documents": ["passport", "business_plan", "tax_certificate"],
            "official_url": "https://egov.kz/grants/youth-innovation",
        },
        {
            "slug": "astana-hub-incubation-2026",
            "title_ru": "Инкубационная программа Astana Hub",
            "title_en": "Astana Hub Incubation Program",
            "title_kz": "Astana Hub инкубациялық бағдарламасы",
            "description_ru": "Программа инкубации для технологических стартапов с поддержкой менторинга, офисного пространства и финансирования.",
            "description_en": "Incubation program for tech startups with mentoring, office space, and funding support.",
            "category": ProgramCategory.INCUBATOR,
            "organization": "Astana Hub",
            "ministry": None,
            "amount_min": 5_000_000,
            "amount_max": 10_000_000,
            "currency": "KZT",
            "age_min": 18,
            "age_max": 45,
            "requires_kz_citizen": False,
            "status": ProgramStatus.ACTIVE,
            "tags": ["startup", "tech", "incubator", "mentoring"],
            "required_documents": ["passport", "business_plan"],
            "official_url": "https://astana-hub.kz/incubation",
        },
        {
            "slug": "baiterek-startup-fund-2026",
            "title_ru": "Стартап-фонд Baiterek",
            "title_en": "Baiterek Startup Fund",
            "title_kz": "Baiterek стартап қоры",
            "description_ru": "Финансирование малого и среднего бизнеса через Байтерек Холдинг. Поддержка предпринимателей Казахстана.",
            "description_en": "SME financing through Baiterek Holding. Support for Kazakhstan entrepreneurs.",
            "category": ProgramCategory.GRANT,
            "organization": "Baiterek Holding",
            "ministry": None,
            "amount_min": 10_000_000,
            "amount_max": 25_000_000,
            "currency": "KZT",
            "age_min": 18,
            "age_max": 60,
            "requires_kz_citizen": True,
            "status": ProgramStatus.ACTIVE,
            "tags": ["business", "SME", "entrepreneurship"],
            "required_documents": ["passport", "business_plan", "tax_certificate", "income_certificate"],
            "official_url": "https://baiterek.gov.kz/startup-fund",
        },
    ]

    async with AsyncSessionLocal() as db:
        for data in SAMPLE_PROGRAMS:
            program = GovernmentProgram(**data)
            db.add(program)
        await db.commit()
        print(f"✅ Seeded {len(SAMPLE_PROGRAMS)} sample programs")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="GovGuide AI Data Ingestion")
    parser.add_argument("--action", choices=["programs", "pdf", "seed"], default="programs")
    parser.add_argument("--pdf", help="Path to PDF file (for --action=pdf)")
    parser.add_argument("--title", help="Document title (for --action=pdf)")
    args = parser.parse_args()

    if args.action == "programs":
        asyncio.run(ingest_programs_from_db())
    elif args.action == "seed":
        asyncio.run(seed_sample_programs())
    elif args.action == "pdf":
        if not args.pdf or not args.title:
            print("Error: --pdf and --title required for PDF ingestion")
            sys.exit(1)
        asyncio.run(ingest_pdf(args.pdf, args.title))
