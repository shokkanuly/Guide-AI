"""
GovGuide AI — RAG (Retrieval-Augmented Generation) Service
Handles document ingestion, embedding, and semantic retrieval via ChromaDB.
"""
import uuid
import hashlib
from typing import Optional, Any
import chromadb
from openai import AsyncOpenAI

from app.config import settings

class RAGService:
    """
    Manages the ChromaDB vector store for government documents.
    Provides semantic search over ingested PDFs and program descriptions.
    """

    def __init__(self):
        self._chroma: Optional[Any] = None

    async def _get_client(self) -> Any:
        if self._chroma is None:
            self._chroma = await chromadb.AsyncHttpClient(
                host=settings.chroma_host,
                port=settings.chroma_port,
            )
        return self._chroma

    async def _get_collection(self, name: str):
        chroma = await self._get_client()
        return await chroma.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"},
        )

    # ---- Embedding ----
    async def embed_text(self, text: str) -> list[float]:
        """Generate an embedding vector for a text string."""
        import google.generativeai as genai
        from fastapi.concurrency import run_in_threadpool

        api_key = settings.gemini_api_key
        if not api_key or api_key == "sk-placeholder" or api_key == "":
            raise ValueError("GEMINI_API_KEY is not configured in the environment settings")

        genai.configure(api_key=api_key)

        def _embed():
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']

        return await run_in_threadpool(_embed)

    # ---- Ingestion ----
    async def ingest_program(
        self,
        program_id: str,
        title: str,
        description: str,
        organization: str,
        tags: list[str],
        url: Optional[str] = None,
        amount_display: Optional[str] = None,
        deadline: Optional[str] = None,
        slug: str = "",
    ) -> str:
        """
        Embed and store a government program in ChromaDB.
        Returns the ChromaDB document ID.
        """
        collection = await self._get_collection(settings.chroma_collection_programs)

        # Combine fields into a rich text for embedding
        text = f"{title}\n{organization}\n{description}\nTags: {', '.join(tags or [])}"
        embedding = await self.embed_text(text)

        doc_id = hashlib.md5(program_id.encode()).hexdigest()
        metadata = {
            "program_id": program_id,
            "title": title,
            "organization": organization,
            "url": url or "",
            "amount_display": amount_display or "",
            "deadline": deadline or "",
            "slug": slug,
        }

        await collection.upsert(
            ids=[doc_id],
            embeddings=[embedding],
            documents=[text],
            metadatas=[metadata],
        )
        return doc_id

    async def ingest_document_chunk(
        self,
        source_url: str,
        chunk_index: int,
        content: str,
        title: str,
        doc_type: str = "regulation",
    ) -> str:
        """
        Embed and store a PDF chunk (law, regulation, FAQ) in ChromaDB.
        """
        collection = await self._get_collection(settings.chroma_collection_laws)

        embedding = await self.embed_text(content)
        doc_id = hashlib.md5(f"{source_url}-{chunk_index}".encode()).hexdigest()
        metadata = {
            "source_url": source_url,
            "title": title,
            "chunk_index": chunk_index,
            "doc_type": doc_type,
        }

        await collection.upsert(
            ids=[doc_id],
            embeddings=[embedding],
            documents=[content],
            metadatas=[metadata],
        )
        return doc_id

    # ---- Retrieval ----
    async def retrieve(
        self,
        query: str,
        top_k: int = 5,
        language: str = "ru",
        collection_name: Optional[str] = None,
    ) -> list[dict]:
        """
        Semantic search: embed the query and return top_k relevant documents.
        Searches both programs and laws collections.
        """
        query_embedding = await self.embed_text(query)

        collections_to_search = [
            collection_name or settings.chroma_collection_programs,
            settings.chroma_collection_laws,
        ]

        all_results = []

        for col_name in collections_to_search:
            try:
                collection = await self._get_collection(col_name)
                results = await collection.query(
                    query_embeddings=[query_embedding],
                    n_results=min(top_k, 10),
                    include=["documents", "metadatas", "distances"],
                )

                docs = results.get("documents", [[]])[0]
                metas = results.get("metadatas", [[]])[0]
                distances = results.get("distances", [[]])[0]

                for doc, meta, dist in zip(docs, metas, distances):
                    # Convert cosine distance to similarity score (0-1)
                    score = max(0.0, 1.0 - dist)
                    all_results.append({
                        "id": meta.get("program_id") or meta.get("source_url", ""),
                        "content": doc,
                        "score": score,
                        **meta,
                    })
            except Exception:
                # Collection might not exist yet — skip
                pass

        # Sort by score descending and deduplicate
        all_results.sort(key=lambda x: x["score"], reverse=True)
        return all_results[:top_k]

    async def similarity_search(
        self,
        query: str,
        top_k: int = 10,
        min_score: float = 0.5,
    ) -> list[dict]:
        """Higher-level search with score filtering."""
        results = await self.retrieve(query, top_k=top_k * 2)
        return [r for r in results if r["score"] >= min_score][:top_k]

    async def delete_program(self, program_id: str) -> None:
        """Remove a program's embedding from ChromaDB."""
        collection = await self._get_collection(settings.chroma_collection_programs)
        doc_id = hashlib.md5(program_id.encode()).hexdigest()
        await collection.delete(ids=[doc_id])
