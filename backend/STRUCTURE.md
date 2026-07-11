govguide-ai/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app entry point
│   │   ├── config.py                  # Settings (Pydantic BaseSettings)
│   │   ├── database.py                # SQLAlchemy engine + session
│   │   │
│   │   ├── models/                    # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── program.py
│   │   │   ├── chat.py
│   │   │   ├── application.py
│   │   │   ├── document.py
│   │   │   └── notification.py
│   │   │
│   │   ├── schemas/                   # Pydantic request/response schemas
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── program.py
│   │   │   ├── chat.py
│   │   │   ├── eligibility.py
│   │   │   ├── document.py
│   │   │   └── notification.py
│   │   │
│   │   ├── api/                       # Route handlers
│   │   │   ├── __init__.py
│   │   │   ├── v1/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py            # POST /login, /register, /refresh
│   │   │   │   ├── users.py           # GET/PUT /profile
│   │   │   │   ├── chat.py            # POST /chat
│   │   │   │   ├── programs.py        # GET /programs, /programs/{id}
│   │   │   │   ├── eligibility.py     # POST /eligibility/check
│   │   │   │   ├── documents.py       # POST/GET /documents
│   │   │   │   ├── notifications.py   # GET /notifications
│   │   │   │   ├── applications.py    # POST/GET /applications
│   │   │   │   └── search.py          # GET /search
│   │   │
│   │   ├── services/                  # Business logic layer
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py        # JWT, hashing, token validation
│   │   │   ├── ai_service.py          # OpenAI + LangChain orchestrator
│   │   │   ├── rag_service.py         # ChromaDB retrieval pipeline
│   │   │   ├── eligibility_service.py # Rule engine + AI scoring
│   │   │   ├── document_service.py    # S3 upload, OCR, AI validation
│   │   │   └── notification_service.py# Email, Telegram, push
│   │   │
│   │   ├── agents/                    # Multi-agent AI system
│   │   │   ├── __init__.py
│   │   │   ├── orchestrator.py        # Routes queries to agents
│   │   │   ├── grant_agent.py         # Finds relevant programs
│   │   │   ├── legal_agent.py         # Explains laws/regulations
│   │   │   ├── document_agent.py      # Checks document requirements
│   │   │   └── recommendation_agent.py# Ranks + personalizes results
│   │   │
│   │   ├── core/                      # Shared utilities
│   │   │   ├── __init__.py
│   │   │   ├── security.py            # JWT creation/verification
│   │   │   ├── dependencies.py        # FastAPI Depends() helpers
│   │   │   ├── exceptions.py          # Custom HTTP exceptions
│   │   │   ├── middleware.py          # CORS, rate limiting, logging
│   │   │   └── cache.py               # Redis cache wrapper
│   │   │
│   │   └── migrations/
│   │       └── alembic.ini
│   │
│   ├── scripts/
│   │   ├── ingest_documents.py        # Gov PDF → ChromaDB pipeline
│   │   └── seed_programs.py           # Seed grant data
│   │
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_chat.py
│   │   ├── test_eligibility.py
│   │   └── test_programs.py
│   │
│   ├── .env.example
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml
│
└── frontend/
    ├── index.html
    ├── styles.css
    └── app.js
