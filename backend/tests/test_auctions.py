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
async def test_team_creation_and_auction_lifecycle():
    unique = uuid.uuid4().hex[:8]
    org_email = f"org_auc_{unique}@sportbid.com"
    player_email = f"player_auc_{unique}@sportbid.com"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Register Organizer & Create Tournament
        await ac.post(
            "/api/v1/auth/register/organizer",
            json={
                "full_name": "Premier League Org",
                "email": org_email,
                "phone_number": "+919876543300",
                "password": "Password123!",
            },
        )
        login = await ac.post("/api/v1/auth/login", json={"email": org_email, "password": "Password123!"})
        org_cookies = login.cookies

        now = datetime.now(timezone.utc)
        t_res = await ac.post(
            "/api/v1/tournaments",
            cookies=org_cookies,
            json={
                "title": f"Auction Invitational {unique}",
                "sport": "CRICKET",
                "description": "High stakes cricket auction tournament.",
                "venue": "Chinnaswamy Stadium",
                "city": "Bengaluru",
                "state": "Karnataka",
                "start_date": (now + timedelta(days=5)).isoformat(),
                "end_date": (now + timedelta(days=10)).isoformat(),
                "registration_deadline": (now + timedelta(days=2)).isoformat(),
                "entry_fee": 1000.0,
            },
        )
        assert t_res.status_code == 201
        tourney_id = t_res.json()["id"]

        # Publish tournament
        await ac.patch(
            f"/api/v1/tournaments/{tourney_id}",
            cookies=org_cookies,
            json={"status": "PUBLISHED"},
        )

        # 2. Create Teams with Budgets
        team1_res = await ac.post(
            f"/api/v1/tournaments/{tourney_id}/teams",
            cookies=org_cookies,
            json={
                "name": f"Royal Challengers {unique}",
                "owner_name": "Bangalore Franchise",
                "owner_phone": "+919999900001",
                "initial_budget": 50000.0,
                "roster_limit": 5,
            },
        )
        assert team1_res.status_code == 201
        team1 = team1_res.json()
        team1_id = team1["id"]
        assert team1["remaining_budget"] == 50000.0

        # Duplicate team name in same tournament must be rejected (409)
        dup_team = await ac.post(
            f"/api/v1/tournaments/{tourney_id}/teams",
            cookies=org_cookies,
            json={
                "name": f"Royal Challengers {unique}",
                "owner_name": "Fake Franchise",
                "owner_phone": "+919999900002",
                "initial_budget": 10000.0,
                "roster_limit": 5,
            },
        )
        assert dup_team.status_code == 409

        # Create Team 2
        team2_res = await ac.post(
            f"/api/v1/tournaments/{tourney_id}/teams",
            cookies=org_cookies,
            json={
                "name": f"Super Kings {unique}",
                "owner_name": "Chennai Franchise",
                "owner_phone": "+919999900003",
                "initial_budget": 2000.0,  # Small budget to test overrun
                "roster_limit": 5,
            },
        )
        assert team2_res.status_code == 201
        team2_id = team2_res.json()["id"]

        # 3. Register Player & Approve (to enter auction pool)
        await ac.post(
            "/api/v1/auth/register/player",
            json={
                "full_name": "Elite Batsman",
                "email": player_email,
                "phone_number": "+919888800001",
                "password": "Password123!",
            },
        )
        p_login = await ac.post("/api/v1/auth/login", json={"email": player_email, "password": "Password123!"})
        p_cookies = p_login.cookies

        reg_res = await ac.post(
            f"/api/v1/tournaments/{tourney_id}/register",
            cookies=p_cookies,
            json={
                "player_name": "Elite Batsman",
                "player_phone": "+919888800001",
                "custom_field_values": {"role": "Top-order Batsman", "batting_hand": "Right Hand"},
            },
        )
        assert reg_res.status_code == 201
        reg_id = reg_res.json()["id"]

        # Approve player registration
        await ac.post(
            f"/api/v1/tournaments/{tourney_id}/registrations/{reg_id}/review",
            cookies=org_cookies,
            json={"status": "APPROVED"},
        )

        # 4. Configure Auction
        auc_config = await ac.post(
            f"/api/v1/tournaments/{tourney_id}/auction/config",
            cookies=org_cookies,
            json={
                "name": "2026 Grand Auction",
                "start_time": now.isoformat(),
                "base_price_default": 1000.0,
                "min_bid_increment": 500.0,
                "timer_seconds": 30,
            },
        )
        assert auc_config.status_code == 200

        # Verify Auction State
        state_res = await ac.get(f"/api/v1/tournaments/{tourney_id}/auction/state")
        assert state_res.status_code == 200
        state = state_res.json()
        assert state["status"] == "DRAFT"
        assert state["total_lots_count"] >= 1

        # 5. Start Auction (Auctioneer START)
        start_res = await ac.post(
            f"/api/v1/tournaments/{tourney_id}/auction/control/START",
            cookies=org_cookies,
        )
        assert start_res.status_code == 200

        state_after_start = await ac.get(f"/api/v1/tournaments/{tourney_id}/auction/state")
        assert state_after_start.json()["status"] == "LIVE"
        assert state_after_start.json()["current_lot"] is not None

        # 6. Place Valid Bid (Team 1 bids 1000)
        bid1_res = await ac.post(
            f"/api/v1/tournaments/{tourney_id}/auction/bid",
            cookies=org_cookies,
            json={"team_id": team1_id, "amount": 1000.0},
        )
        assert bid1_res.status_code == 200
        assert bid1_res.json()["amount"] == 1000.0

        # Bid below increment must be rejected (< 1500)
        low_bid = await ac.post(
            f"/api/v1/tournaments/{tourney_id}/auction/bid",
            cookies=org_cookies,
            json={"team_id": team2_id, "amount": 1200.0},
        )
        assert low_bid.status_code == 400
        assert "Minimum valid bid" in low_bid.json()["detail"]

        # Valid bid from Team 2 (1500)
        bid2_res = await ac.post(
            f"/api/v1/tournaments/{tourney_id}/auction/bid",
            cookies=org_cookies,
            json={"team_id": team2_id, "amount": 1500.0},
        )
        assert bid2_res.status_code == 200

        # Team 2 overrunning budget (> 2000 initial budget)
        over_bid = await ac.post(
            f"/api/v1/tournaments/{tourney_id}/auction/bid",
            cookies=org_cookies,
            json={"team_id": team2_id, "amount": 2500.0},
        )
        assert over_bid.status_code == 400
        assert "Insufficient budget" in over_bid.json()["detail"]

        # Team 1 places final winning bid (2000)
        bid3_res = await ac.post(
            f"/api/v1/tournaments/{tourney_id}/auction/bid",
            cookies=org_cookies,
            json={"team_id": team1_id, "amount": 2000.0},
        )
        assert bid3_res.status_code == 200

        # 7. Auctioneer marks player SOLD
        sold_res = await ac.post(
            f"/api/v1/tournaments/{tourney_id}/auction/control/SOLD",
            cookies=org_cookies,
        )
        assert sold_res.status_code == 200

        # Verify budget deduction on Team 1 (50000 - 2000 = 48000)
        teams_list = await ac.get(f"/api/v1/tournaments/{tourney_id}/teams")
        t1_updated = next(t for t in teams_list.json() if t["id"] == team1_id)
        assert t1_updated["remaining_budget"] == 48000.0
        assert t1_updated["purchased_players_count"] == 1
        assert t1_updated["purchased_players"][0]["sold_price"] == 2000.0
