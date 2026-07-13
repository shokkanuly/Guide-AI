# GovGuide AI — Government Program Navigator for Kazakhstan

[![CI Backend & Frontend Checks](https://github.com/shokkanuly/Guide-AI/actions/workflows/ci.yml/badge.svg)](https://github.com/shokkanuly/Guide-AI/actions)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.10-000000.svg?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Gemini](https://img.shields.io/badge/Google_Gemini-1.5_Pro_%2F_Flash-4285F4.svg?style=flat&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com)

GovGuide AI is an intelligent, clean-architecture assistant designed to help residents of Kazakhstan discover and navigate government grants, subsidies, scholarships, and social support programs. 

Through automated eligibility matching, AI-driven document validation, and interactive application roadmaps, GovGuide AI eliminates fragmentation and makes government aid accessible to everyone.

---

## 1. Problem Statement & Target Audience

### The Problem
Finding and applying for government support in Kazakhstan is currently highly fragmented. Program requirements, application portals, and document checklists are scattered across various sites (`egov.kz`, `baiterek.gov.kz`, `damu.kz`, regional ministry platforms). Citizens, particularly in rural regions, struggle to interpret complex criteria, leading to missed opportunities or rejected applications due to minor document mistakes.

### Target Audience
1. **Students**: Seeking Bolashak, Serpin-2050, or general academic scholarships and housing support.
2. **Young Entrepreneurs**: Aspiring founders seeking seed grants (e.g., Zhas Project, Damu Start, Innovation Grants).
3. **Unemployed Applicants**: Looking for state-sponsored vocational retraining and employment placement subsidies (e.g., Jastar Praktikasy).
4. **Rural Workers**: Seeking agricultural development subsidies and regional housing programs.
5. **Families/Parents**: Low-income or large families looking for Otbasy Bank subsidized home loans and targeted social assistance (ASPR).

---

## 2. System Architecture

GovGuide AI is built with a modern, decoupled service architecture, featuring an Nginx reverse proxy gateway, a Next.js frontend, a FastAPI backend, relational and vector databases, and the Gemini API for intelligence:

```mermaid
graph TD
    Client[Browser Next.js App] -->|Port 80/443| Gateway[Nginx Reverse Proxy]
    Gateway -->|Port 3000| Frontend[Next.js App Server]
    Gateway -->|Port 8000| Backend[FastAPI Server]
    
    Backend -->|Async Engine| Postgres[(PostgreSQL DB)]
    Backend -->|Cache Key/Val| Redis[(Redis Cache)]
    Backend -->|Vector Search| ChromaDB[(ChromaDB Vector Store)]
    Backend -->|Generative SDK| Gemini[Google Gemini API]
    
    subgraph Storage & External Services
        Postgres
        Redis
        ChromaDB
        Gemini
    end
```

- **Frontend**: Single Page Application built with Next.js 16 (App Router), Tailwind CSS, Framer Motion, and Lucide React.
- **Backend API**: High-performance FastAPI server running on Python 3.12, using asynchronous SQLAlchemy, Pydantic data validation, and SlowAPI rate limiting.
- **Relational Database**: PostgreSQL for users, applications, saved grants, notifications, and metadata.
- **Vector Database**: ChromaDB for similarity searching and semantic retrieval over crawled government regulations and documents.
- **Caching**: Redis for caching expensive external API responses and managing short-term query loads.
- **AI Stack**: Google Gemini SDK for conversational chat (Gemini 1.5 Flash), PDF text analysis (Gemini 1.5 Pro via Docling markdown dumps), and text embedding (text-embedding-004).

---

## 3. Backend Route Map

The API is fully documented and structured under `/api/v1`. The documentation can be accessed interactively at `http://localhost:8000/api/docs`.

| Module | Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- | :---: |
| **Auth** | `POST` | `/api/v1/auth/register` | Register a new user account | No |
| | `POST` | `/api/v1/auth/login` | Authenticate credentials and return JWT tokens | No |
| | `POST` | `/api/v1/auth/refresh` | Obtain a new access token using a refresh token | No |
| **Users** | `GET` | `/api/v1/users/me` | Retrieve authenticated user profile info | **Yes** |
| | `PUT` | `/api/v1/users/me` | Partially update user profile settings | **Yes** |
| | `GET` | `/api/v1/users/me/dashboard` | Retrieve aggregated dashboard counts and metrics | **Yes** |
| **Programs**| `GET` | `/api/v1/programs` | List, search, and category-filter government programs | No |
| | `GET` | `/api/v1/programs/categories` | Retrieve available program categories and labels | No |
| | `GET` | `/api/v1/programs/saved` | List authenticated user's bookmarked programs | **Yes** |
| | `GET` | `/api/v1/programs/{slug}` | Retrieve full program requirements by slug | No |
| | `POST`| `/api/v1/programs/{id}/save` | Toggle saved status for a program | **Yes** |
| **Eligibility**| `POST` | `/api/v1/eligibility/check` | Calculate match score based on request parameters | No |
| | `GET` | `/api/v1/eligibility/quick` | Run eligibility calculation using stored user profile | **Yes** |
| | `GET` | `/api/v1/eligibility/demo-profiles` | Retrieve the 5 predefined mock user profiles | No |
| **Documents**| `POST` | `/api/v1/documents/upload` | Upload a PDF/Image for OCR and Gemini structure check | **Yes** |
| | `GET` | `/api/v1/documents` | List uploaded user documents and verification status | **Yes** |
| **Applications**| `POST`| `/api/v1/applications` | Initialize a tracker roadmap for a program | **Yes** |
| | `GET` | `/api/v1/applications` | List active applications and roadmap statuses | **Yes** |
| | `GET` | `/api/v1/applications/{id}`| Fetch details & steps of a single tracker roadmap | **Yes** |
| | `PUT` | `/api/v1/applications/{id}/step`| Toggle step status and recalculate roadmap completion | **Yes** |
| **Chat** | `POST` | `/api/v1/chat` | Send a query to the Gemini RAG chat orchestrator | **Yes** |
| | `GET` | `/api/v1/chat/sessions` | List authenticated user's recent chat threads | **Yes** |

---

## 4. AI & Document Ingest Pipeline

```
  [ Government Program Data ] ----> [ PostgreSQL DB ]
                                           |
                                           v
  [ Official Regulation PDF ] ----> [ Docling Parser ] ----> [ Markdown Text ]
                                                                 |
                                                                 v
  [ Gemini text-embedding-004 ] <---------------------- [ Chunker (500 words) ]
               |
               v
     [ ChromaDB Vector Store ] <=== (Semantic Query) === [ RAG Service / Chat ]
```

1. **Semantic Search / RAG**: Government program guidelines are chunked, embedded via Gemini's `text-embedding-004`, and stored in ChromaDB. When users query the chatbot, the RAG service extracts the top 5 matching snippets, which are formatted as context for Gemini 1.5 Flash to generate grounded responses.
2. **PDF Parsing (Docling)**: Document analysis uses the high-fidelity `Docling` document converter to parse structure (tables, headings) from government laws.
3. **Structured Extraction**: Extracted markdown is sent to Gemini 1.5 Pro to return a highly structured JSON object listing key financial amounts, deadlines, eligibility summaries, advantages, warnings, required documents, and a 4-step action plan.

---

## 5. Running Tests & Linting

### Local Tests (FastAPI Pytest)
To run backend unit and API integration tests locally:
```bash
# Set your local test database URL or let docker-compose handle it
cd backend
export TEST_DATABASE_URL="postgresql+asyncpg://govguide:password@localhost:5432/govguide_test"
pytest -v
```

### Running Tests in Docker Compose
Ensure your compose stack is running, then invoke:
```bash
docker compose exec backend pytest -v
```

### Linting & Formatting Checks
Verify code style adherence:
- **Backend (Ruff / Black)**:
  ```bash
  cd backend
  ruff check .
  black --check .
  ```
- **Frontend (ESLint / TypeScript)**:
  ```bash
  cd frontend
  npm run lint
  ```

---

## 6. Local Development & Deployment

The easiest way to spin up the local development environment is with Docker Compose. This starts all databases, frontend, backend, and Nginx gateway.

### Setup Steps
1. Clone the repository.
2. Configure your environmental secrets inside `backend/.env` (specifically `GEMINI_API_KEY`).
3. Build and launch the container services:
   ```bash
   docker compose up -d --build
   ```
4. Access the services:
   - **Frontend App**: `http://localhost` (port 80 proxy)
   - **FastAPI Core**: `http://localhost:8000`
   - **FastAPI Docs**: `http://localhost:8000/api/docs`
   - **ChromaDB Web**: `http://localhost:8001`
5. Seed the database with sample programs and demo users:
   ```bash
   docker compose exec backend python scripts/seed_programs.py
   ```

---

## 7. My Contributions (Clean Architecture Refactoring)

As part of this clean architecture upgrade, the following designs and fixes were implemented:
1. **Gemini SDK Migration**: Replaced obsolete OpenAI wrapper scripts with clean, native async Gemini calls (`google-generativeai` SDK) for conversational chat (`gemini-1.5-flash`), document extraction (`gemini-1.5-pro` with response mime-type JSON), and semantic embeddings (`text-embedding-004`).
2. **Predefined Mock Data & Seeding**: Authored `seed_data.py` containing 30+ Kazakhstani programs and 5 targeted demo user profiles, enabling a fully functional offline mode. Added automatic seeding on startup in dev environments.
3. **Roadmap Step Trackers**: Designed and coded API endpoints (`GET /applications/{id}` and `PUT /applications/{id}/step`) allowing dynamic completion percentage calculations and custom user roadmaps.
4. **Localization Alignment**: Refactored the UI translation hooks in the frontend, enabling full translation toggles across Russian (`ru`), Kazakh (`kz`), and English (`en`) for eligibility metrics, chatbots, and catalogs.
5. **Robust CI Pipeline**: Configured a full GitHub Actions runner executing PostgreSQL services, database creations, python tests, and Next.js production builds on pushes and merge requests.
