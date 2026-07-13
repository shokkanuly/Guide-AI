"""
GovGuide AI — API Tests
Tests for auth, chat, programs, and eligibility endpoints.
"""
import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.database import Base, get_db
from app.config import settings

# ---- Test Database ----
import os
from sqlalchemy.pool import NullPool

TEST_DB_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://govguide:password@postgres:5432/govguide_test"
    if os.path.exists("/.dockerenv")
    else "postgresql+asyncpg://govguide:password@localhost:5432/govguide_test"
)
test_engine = create_async_engine(TEST_DB_URL, poolclass=NullPool, echo=False)
TestSessionLocal = async_sessionmaker(bind=test_engine, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client(setup_db):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture
async def auth_headers(client):
    """Register a test user and return auth headers."""
    response = await client.post("/api/v1/auth/register", json={
        "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
        "password": "TestPass123",
        "full_name": "Test User",
        "language": "ru",
    })
    assert response.status_code == 201
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ================================================================
# AUTH TESTS
# ================================================================
class TestAuth:

    @pytest.mark.asyncio
    async def test_register_success(self, client):
        response = await client.post("/api/v1/auth/register", json={
            "email": "newuser@test.kz",
            "password": "Password123",
            "full_name": "Новый Пользователь",
        })
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client):
        payload = {"email": "dup@test.kz", "password": "Password123", "full_name": "User"}
        await client.post("/api/v1/auth/register", json=payload)
        response = await client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_register_weak_password(self, client):
        response = await client.post("/api/v1/auth/register", json={
            "email": "weak@test.kz",
            "password": "short",
            "full_name": "User",
        })
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_login_success(self, client):
        email = f"login_{uuid.uuid4().hex[:6]}@test.kz"
        await client.post("/api/v1/auth/register", json={
            "email": email, "password": "Password123", "full_name": "User"
        })
        response = await client.post("/api/v1/auth/login", json={
            "email": email, "password": "Password123"
        })
        assert response.status_code == 200
        assert "access_token" in response.json()

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client):
        response = await client.post("/api/v1/auth/login", json={
            "email": "nobody@test.kz", "password": "WrongPass123"
        })
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_protected_route_without_token(self, client):
        response = await client.get("/api/v1/users/me")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_token(self, client):
        reg = await client.post("/api/v1/auth/register", json={
            "email": f"refresh_{uuid.uuid4().hex[:6]}@test.kz",
            "password": "Password123", "full_name": "User"
        })
        refresh_token = reg.json()["refresh_token"]
        response = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        assert response.status_code == 200
        assert "access_token" in response.json()


# ================================================================
# USER TESTS
# ================================================================
class TestUsers:

    @pytest.mark.asyncio
    async def test_get_profile(self, client, auth_headers):
        response = await client.get("/api/v1/users/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "id" in data

    @pytest.mark.asyncio
    async def test_update_profile(self, client, auth_headers):
        response = await client.put("/api/v1/users/me", headers=auth_headers, json={
            "age": 22,
            "region": "Almaty",
            "is_student": True,
            "language": "ru",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["age"] == 22
        assert data["region"] == "Almaty"


# ================================================================
# PROGRAMS TESTS
# ================================================================
class TestPrograms:

    @pytest.mark.asyncio
    async def test_list_programs(self, client):
        response = await client.get("/api/v1/programs")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "meta" in data

    @pytest.mark.asyncio
    async def test_list_programs_with_filters(self, client):
        response = await client.get("/api/v1/programs?category=grant&status=active")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_get_categories(self, client):
        response = await client.get("/api/v1/programs/categories")
        assert response.status_code == 200
        assert "categories" in response.json()

    @pytest.mark.asyncio
    async def test_get_program_not_found(self, client):
        response = await client.get("/api/v1/programs/nonexistent-slug")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_save_program_requires_auth(self, client):
        response = await client.post(f"/api/v1/programs/{uuid.uuid4()}/save")
        assert response.status_code == 401


# ================================================================
# ELIGIBILITY TESTS
# ================================================================
class TestEligibility:

    @pytest.mark.asyncio
    async def test_eligibility_check(self, client):
        response = await client.post("/api/v1/eligibility/check", json={
            "age": 22,
            "region": "Almaty",
            "employment_status": "student",
            "is_student": True,
            "monthly_income": 80000,
            "interests": ["tech", "startup"],
        })
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert "total_eligible" in data
        assert "profile_completeness" in data

    @pytest.mark.asyncio
    async def test_eligibility_invalid_age(self, client):
        response = await client.post("/api/v1/eligibility/check", json={
            "age": 5,  # Too young
            "region": "Almaty",
            "employment_status": "student",
        })
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_quick_eligibility_requires_profile(self, client, auth_headers):
        # User has no age/region set yet
        response = await client.get("/api/v1/eligibility/quick", headers=auth_headers)
        assert response.status_code == 400  # Profile incomplete


# ================================================================
# CHAT TESTS
# ================================================================
class TestChat:

    @pytest.mark.asyncio
    async def test_chat_requires_auth(self, client):
        response = await client.post("/api/v1/chat", json={"message": "Hello"})
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_list_sessions(self, client, auth_headers):
        response = await client.get("/api/v1/chat/sessions", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_rate_message_invalid(self, client, auth_headers):
        response = await client.post(
            f"/api/v1/chat/messages/{uuid.uuid4()}/rate",
            headers=auth_headers,
            json={"message_id": str(uuid.uuid4()), "rating": 10, "was_helpful": True},
        )
        assert response.status_code == 422  # rating > 5


# ================================================================
# HEALTH CHECK
# ================================================================
class TestHealth:

    @pytest.mark.asyncio
    async def test_health_check(self, client):
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == settings.app_name

    @pytest.mark.asyncio
    async def test_root(self, client):
        response = await client.get("/")
        assert response.status_code == 200


# ================================================================
# DEMO PROFILES AND DETAILED ROADMAPS
# ================================================================
class TestDemoAndRoadmaps:

    @pytest.mark.asyncio
    async def test_get_demo_profiles(self, client):
        response = await client.get("/api/v1/eligibility/demo-profiles")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 5
        assert data[0]["name"] == "Aruzhan"

    @pytest.mark.asyncio
    async def test_application_lifecycle_and_steps(self, client, auth_headers):
        # 1. Create seed program
        from app.models.program import GovernmentProgram, ProgramCategory, ProgramStatus
        
        program_id = uuid.uuid4()
        async with TestSessionLocal() as session:
            prog = GovernmentProgram(
                id=program_id,
                slug="test-life-prog",
                status=ProgramStatus.ACTIVE,
                category=ProgramCategory.GRANT,
                title_ru="Тестовый грант",
                title_kz="Тест грант",
                title_en="Test Grant",
                description_ru="Описание",
                organization="Тест",
                required_documents=["passport", "tax_certificate"]
            )
            session.add(prog)
            await session.commit()

        # 2. Create Application
        create_res = await client.post(
            "/api/v1/applications",
            headers=auth_headers,
            json={"program_id": str(program_id), "notes": "Life test"}
        )
        assert create_res.status_code == 201
        app_id = create_res.json()["id"]

        # 3. Retrieve single application details
        get_res = await client.get(f"/api/v1/applications/{app_id}", headers=auth_headers)
        assert get_res.status_code == 200
        app_data = get_res.json()
        assert app_data["program_title"] == "Тестовый грант"
        assert len(app_data["roadmap"]) == 4
        assert app_data["roadmap"][0]["title"] == "Document Checklist"

        # 4. Update step status
        put_res = await client.put(
            f"/api/v1/applications/{app_id}/step",
            headers=auth_headers,
            json={"step": 1, "status": "done"}
        )
        assert put_res.status_code == 200
        updated_data = put_res.json()
        assert updated_data["roadmap"][0]["status"] == "done"
        assert updated_data["completion_pct"] == 25.0
