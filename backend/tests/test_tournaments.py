import pytest
import uuid
from datetime import datetime, timezone, timedelta
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.db.mongodb import db_manager


@pytest.fixture(autouse=True)
async def setup_db():
    await db_manager.connect_to_database()
    yield


@pytest.mark.asyncio
async def test_tournament_creation_and_ownership():
    unique = uuid.uuid4().hex[:8]
    org_email = f"org_{unique}@sportbid.com"
    other_org_email = f"other_{unique}@sportbid.com"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Register Organizer 1
        await ac.post(
            "/api/v1/auth/register/organizer",
            json={
                "full_name": "League Director",
                "organization_name": "Pro Sports Org",
                "email": org_email,
                "phone_number": "+919876543210",
                "password": "Password123!",
            },
        )
        login1 = await ac.post("/api/v1/auth/login", json={"email": org_email, "password": "Password123!"})
        cookies1 = login1.cookies

        # Register Organizer 2
        await ac.post(
            "/api/v1/auth/register/organizer",
            json={
                "full_name": "Other Director",
                "organization_name": "Other Org",
                "email": other_org_email,
                "phone_number": "+919876543211",
                "password": "Password123!",
            },
        )
        login2 = await ac.post("/api/v1/auth/login", json={"email": other_org_email, "password": "Password123!"})
        cookies2 = login2.cookies

        # 1. Organizer 1 creates a Volleyball tournament
        now = datetime.now(timezone.utc)
        start = now + timedelta(days=10)
        end = now + timedelta(days=12)
        deadline = now + timedelta(days=7)

        create_res = await ac.post(
            "/api/v1/tournaments",
            cookies=cookies1,
            json={
                "title": f"Championship Spike {unique}",
                "sport": "VOLLEYBALL",
                "description": "Annual state championship open to top clubs.",
                "venue": "National Indoor Arena",
                "city": "Bengaluru",
                "state": "Karnataka",
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
                "registration_deadline": deadline.isoformat(),
                "entry_fee": 1500.0,
                "rules": ["Standard FIVB rules apply", "Maximum 12 players per squad"],
            },
        )
        assert create_res.status_code == 201
        t_data = create_res.json()
        tournament_id = t_data["id"]
        assert t_data["status"] in ["DRAFT", "PUBLISHED"]
        assert len(t_data["custom_fields"]) > 0  # Sport-specific custom fields auto-populated

        # 2. Organizer 2 attempts to edit Organizer 1's tournament (MUST BE FORBIDDEN 403)
        unauth_patch = await ac.patch(
            f"/api/v1/tournaments/{tournament_id}",
            cookies=cookies2,
            json={"title": "Hacked Title"},
        )
        assert unauth_patch.status_code == 403

        # 3. Organizer 1 publishes the tournament
        pub_patch = await ac.patch(
            f"/api/v1/tournaments/{tournament_id}",
            cookies=cookies1,
            json={"status": "PUBLISHED"},
        )
        assert pub_patch.status_code == 200
        assert pub_patch.json()["status"] == "PUBLISHED"

        # 4. Verify tournament appears in public list
        pub_list = await ac.get("/api/v1/tournaments/public")
        assert pub_list.status_code == 200
        found = any(t["id"] == tournament_id for t in pub_list.json())
        assert found is True


@pytest.mark.asyncio
async def test_player_registration_and_poster_generation():
    unique = uuid.uuid4().hex[:8]
    org_email = f"org_poster_{unique}@sportbid.com"
    player_email = f"player_{unique}@sportbid.com"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create Organizer & published tournament
        await ac.post(
            "/api/v1/auth/register/organizer",
            json={
                "full_name": "Cricket Board",
                "email": org_email,
                "phone_number": "+919876540001",
                "password": "Password123!",
            },
        )
        org_login = await ac.post("/api/v1/auth/login", json={"email": org_email, "password": "Password123!"})
        org_cookies = org_login.cookies

        now = datetime.now(timezone.utc)
        tourney_res = await ac.post(
            "/api/v1/tournaments",
            cookies=org_cookies,
            json={
                "title": f"T20 Premier Cup {unique}",
                "sport": "CRICKET",
                "description": "High octane cricket tournament.",
                "venue": "Chinnaswamy Stadium",
                "city": "Bengaluru",
                "state": "Karnataka",
                "start_date": (now + timedelta(days=15)).isoformat(),
                "end_date": (now + timedelta(days=20)).isoformat(),
                "registration_deadline": (now + timedelta(days=10)).isoformat(),
                "entry_fee": 500.0,
            },
        )
        tourney_id = tourney_res.json()["id"]

        # Publish tournament
        await ac.patch(
            f"/api/v1/tournaments/{tourney_id}",
            cookies=org_cookies,
            json={"status": "PUBLISHED"},
        )

        # Register Player
        await ac.post(
            "/api/v1/auth/register/player",
            json={
                "full_name": "Star Allrounder",
                "email": player_email,
                "phone_number": "+919123456789",
                "password": "PlayerPass123!",
            },
        )
        player_login = await ac.post("/api/v1/auth/login", json={"email": player_email, "password": "PlayerPass123!"})
        player_cookies = player_login.cookies

        # 1. Player submits registration
        reg_res = await ac.post(
            f"/api/v1/tournaments/{tourney_id}/register",
            cookies=player_cookies,
            json={
                "player_name": "Star Allrounder",
                "player_phone": "+919123456789",
                "custom_field_values": {
                    "role": "All-rounder (Batting)",
                    "batting_hand": "Right Hand",
                    "jersey_number": 7,
                },
            },
        )
        assert reg_res.status_code == 201
        reg_data = reg_res.json()
        reg_id = reg_data["id"]
        assert reg_data["status"] == "PENDING"
        assert reg_data["poster_status"] == "COMPLETED"
        assert reg_data["poster_url"] is not None  # Poster generated deterministically

        # 2. Prevent duplicate registration (MUST BE 409 CONFLICT)
        dup_res = await ac.post(
            f"/api/v1/tournaments/{tourney_id}/register",
            cookies=player_cookies,
            json={
                "player_name": "Star Allrounder",
                "player_phone": "+919123456789",
                "custom_field_values": {"role": "All-rounder (Batting)"},
            },
        )
        assert dup_res.status_code == 409
        assert "already registered" in dup_res.json()["detail"]

        # 3. Before organizer approval, poster MUST NOT appear in public gallery
        gallery_before = await ac.get(f"/api/v1/tournaments/{tourney_id}/approved-posters")
        assert gallery_before.status_code == 200
        assert len(gallery_before.json()) == 0

        # 4. Organizer reviews and approves the registration
        review_res = await ac.post(
            f"/api/v1/tournaments/{tourney_id}/registrations/{reg_id}/review",
            cookies=org_cookies,
            json={"status": "APPROVED"},
        )
        assert review_res.status_code == 200
        assert review_res.json()["status"] == "APPROVED"

        # 5. After approval, poster appears in public gallery
        gallery_after = await ac.get(f"/api/v1/tournaments/{tourney_id}/approved-posters")
        assert gallery_after.status_code == 200
        assert len(gallery_after.json()) == 1
        assert gallery_after.json()[0]["id"] == reg_id
