import pytest
import uuid
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.core.security import hash_password, verify_password
from app.db.mongodb import db_manager


@pytest.fixture(autouse=True)
async def setup_db():
    await db_manager.connect_to_database()
    yield
    # We do not close DB during tests so that subsequent tests retain connection


@pytest.mark.asyncio
async def test_password_hashing():
    raw = "SuperSecretPassword123!"
    hashed = hash_password(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


@pytest.mark.asyncio
async def test_player_registration_and_duplicate_handling():
    unique_id = uuid.uuid4().hex[:8]
    email = f"player_{unique_id}@sportbid.com"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Successful player registration
        resp = await ac.post(
            "/api/v1/auth/register/player",
            json={
                "full_name": "Test Striker",
                "email": email,
                "phone_number": "+919876543210",
                "password": "StrongPassword999!",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == email
        assert data["role"] == "PLAYER"
        assert "password" not in data
        assert "password_hash" not in data

        # 2. Duplicate email rejection
        dup_resp = await ac.post(
            "/api/v1/auth/register/player",
            json={
                "full_name": "Another Player",
                "email": email,
                "phone_number": "+919876543211",
                "password": "StrongPassword999!",
            },
        )
        assert dup_resp.status_code == 409
        dup_data = dup_resp.json()
        assert "already exists" in dup_data["detail"]


@pytest.mark.asyncio
async def test_organizer_registration():
    unique_id = uuid.uuid4().hex[:8]
    email = f"organizer_{unique_id}@sportbid.com"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post(
            "/api/v1/auth/register/organizer",
            json={
                "full_name": "Pro Organizer",
                "organization_name": "Apex Sports League",
                "email": email,
                "phone_number": "+919876500000",
                "password": "OrganizerPass123!",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == email
        assert data["role"] == "ORGANIZER"
        assert "password_hash" not in data


@pytest.mark.asyncio
async def test_login_success_and_session_cookie():
    unique_id = uuid.uuid4().hex[:8]
    email = f"user_{unique_id}@sportbid.com"
    password = "ValidUserPassword123!"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Register first
        await ac.post(
            "/api/v1/auth/register/player",
            json={
                "full_name": "Session Tester",
                "email": email,
                "phone_number": "+919123456780",
                "password": password,
            },
        )

        # Login with valid credentials
        login_resp = await ac.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        assert login_resp.status_code == 200
        login_data = login_resp.json()
        assert login_data["user"]["email"] == email
        assert "password_hash" not in login_data["user"]
        assert "sportbid_session" in login_resp.cookies

        # Current user endpoint (/auth/me) with session cookie
        me_resp = await ac.get("/api/v1/auth/me", cookies=login_resp.cookies)
        assert me_resp.status_code == 200
        assert me_resp.json()["email"] == email

        # Access Player Dashboard (allowed)
        dash_resp = await ac.get("/api/v1/dashboard/player", cookies=login_resp.cookies)
        assert dash_resp.status_code == 200
        assert dash_resp.json()["status"] == "success"

        # Attempt to access Organizer Dashboard (must be FORBIDDEN 403)
        org_dash_resp = await ac.get("/api/v1/dashboard/organizer", cookies=login_resp.cookies)
        assert org_dash_resp.status_code == 403

        # Attempt to access Admin Dashboard (must be FORBIDDEN 403)
        admin_resp = await ac.get("/api/v1/dashboard/admin", cookies=login_resp.cookies)
        assert admin_resp.status_code == 403

        # Logout
        logout_resp = await ac.post("/api/v1/auth/logout", cookies=login_resp.cookies)
        assert logout_resp.status_code == 200

        # Attempt /auth/me after logout (must be 401 UNAUTHORIZED)
        after_logout_resp = await ac.get("/api/v1/auth/me", cookies=login_resp.cookies)
        assert after_logout_resp.status_code == 401


@pytest.mark.asyncio
async def test_login_invalid_credentials():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post(
            "/api/v1/auth/login",
            json={"email": "nonexistent@sportbid.com", "password": "WrongPassword123!"},
        )
        assert resp.status_code == 401
        assert "Invalid email or password" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_unauthenticated_request_denial():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/auth/me")
        assert resp.status_code == 401
