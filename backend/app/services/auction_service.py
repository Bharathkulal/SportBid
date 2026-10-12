from datetime import datetime, timezone, timedelta
from typing import List, Optional
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from fastapi import HTTPException, status

from app.db.mongodb import db_manager
from app.core.logging import logger
from app.models.auction import (
    AuctionStatus,
    PlayerLotStatus,
    AuctionPlayerLot,
)
from app.models.tournament import RegistrationStatus
from app.schemas.auction import (
    TeamCreateRequest,
    TeamUpdateRequest,
    TeamResponse,
    PurchasedPlayerSummary,
    AuctionCreateRequest,
    AuctionUpdateRequest,
    AuctionStateResponse,
    BidPlacementRequest,
    BidResponse,
)
from app.services.tournament_service import TournamentService
from app.services.auction_ws import auction_ws_manager


class TeamService:
    @staticmethod
    async def create_team(
        tournament_id: str,
        organizer_id: str,
        is_super_admin: bool,
        payload: TeamCreateRequest,
    ) -> TeamResponse:
        db = db_manager.db
        tourney = await TournamentService.get_tournament_by_id_or_slug(tournament_id)

        if str(tourney["organizer_id"]) != organizer_id and not is_super_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not own this tournament.",
            )

        now = datetime.now(timezone.utc)
        rep_user_id = None
        if payload.representative_email:
            rep_user = await db.users.find_one({"email": payload.representative_email.strip().lower()})
            if rep_user:
                rep_user_id = str(rep_user["_id"])

        team_doc = {
            "tournament_id": tourney["_id"],
            "name": payload.name.strip(),
            "logo_url": payload.logo_url,
            "owner_name": payload.owner_name,
            "owner_phone": payload.owner_phone,
            "representative_user_id": rep_user_id,
            "initial_budget": payload.initial_budget,
            "remaining_budget": payload.initial_budget,
            "roster_limit": payload.roster_limit,
            "purchased_players_count": 0,
            "created_at": now,
            "updated_at": now,
        }

        try:
            res = await db.teams.insert_one(team_doc)
            team_doc["_id"] = res.inserted_id
            return TeamService._doc_to_response(team_doc, [])
        except DuplicateKeyError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A team with name '{payload.name}' already exists in this tournament.",
            )

    @staticmethod
    async def get_tournament_teams(tournament_id: str) -> List[TeamResponse]:
        db = db_manager.db
        tourney = await TournamentService.get_tournament_by_id_or_slug(tournament_id)
        cursor = db.teams.find({"tournament_id": tourney["_id"]}).sort("name", 1)
        teams = await cursor.to_list(length=100)

        results = []
        for t in teams:
            # Fetch purchased players
            lots = await db.auction_lots.find({
                "tournament_id": tourney["_id"],
                "sold_to_team_id": str(t["_id"]),
                "status": PlayerLotStatus.SOLD.value,
            }).to_list(length=100)
            purchased = [
                PurchasedPlayerSummary(
                    registration_id=l["registration_id"],
                    player_name=l["player_name"],
                    role_or_pos=l["role_or_pos"],
                    sold_price=l["sold_price"] or 0.0,
                    poster_url=l.get("poster_url"),
                )
                for l in lots
            ]
            results.append(TeamService._doc_to_response(t, purchased))
        return results

    @staticmethod
    def _doc_to_response(doc: dict, purchased: List[PurchasedPlayerSummary]) -> TeamResponse:
        return TeamResponse(
            id=str(doc["_id"]),
            tournament_id=str(doc["tournament_id"]),
            name=doc["name"],
            logo_url=doc.get("logo_url"),
            owner_name=doc["owner_name"],
            owner_phone=doc["owner_phone"],
            representative_user_id=doc.get("representative_user_id"),
            initial_budget=doc["initial_budget"],
            remaining_budget=doc["remaining_budget"],
            roster_limit=doc.get("roster_limit", 15),
            purchased_players_count=len(purchased),
            purchased_players=purchased,
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )


class AuctionService:
    @staticmethod
    async def get_or_create_auction(
        tournament_id: str,
        organizer_id: str,
        is_super_admin: bool,
        payload: AuctionCreateRequest,
    ) -> dict:
        db = db_manager.db
        tourney = await TournamentService.get_tournament_by_id_or_slug(tournament_id)

        if str(tourney["organizer_id"]) != organizer_id and not is_super_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not own this tournament.",
            )

        existing = await db.auctions.find_one({"tournament_id": tourney["_id"]})
        now = datetime.now(timezone.utc)
        if existing:
            return existing

        auction_doc = {
            "tournament_id": tourney["_id"],
            "name": payload.name,
            "start_time": payload.start_time,
            "base_price_default": payload.base_price_default,
            "min_bid_increment": payload.min_bid_increment,
            "status": AuctionStatus.DRAFT.value,
            "current_lot_index": -1,
            "timer_seconds": payload.timer_seconds,
            "timer_deadline": None,
            "created_at": now,
            "updated_at": now,
        }
        res = await db.auctions.insert_one(auction_doc)
        auction_doc["_id"] = res.inserted_id

        # Sync approved player registrations into auction lots
        await AuctionService.sync_approved_player_lots(str(res.inserted_id), tourney)
        return auction_doc

    @staticmethod
    async def sync_approved_player_lots(auction_id: str, tourney: dict) -> int:
        db = db_manager.db
        cursor = db.tournament_registrations.find({
            "tournament_id": tourney["_id"],
            "status": RegistrationStatus.APPROVED.value,
        })
        approved_regs = await cursor.to_list(length=500)

        auction_obj = await db.auctions.find_one({"_id": ObjectId(auction_id)})
        base_price = auction_obj.get("base_price_default", 1000.0) if auction_obj else 1000.0

        count_added = 0
        for reg in approved_regs:
            reg_id = str(reg["_id"])
            existing_lot = await db.auction_lots.find_one({"registration_id": reg_id})
            if not existing_lot:
                role_pos = (
                    reg.get("custom_field_values", {}).get("position")
                    or reg.get("custom_field_values", {}).get("role")
                    or "Athlete"
                )
                jersey = str(reg.get("custom_field_values", {}).get("jersey_number") or "")

                lot_doc = {
                    "auction_id": ObjectId(auction_id),
                    "tournament_id": tourney["_id"],
                    "registration_id": reg_id,
                    "player_id": str(reg["player_id"]),
                    "player_name": reg["player_name"],
                    "sport": tourney["sport"],
                    "role_or_pos": role_pos,
                    "jersey_number": jersey,
                    "poster_url": reg.get("poster_url"),
                    "base_price": base_price,
                    "current_bid": 0.0,
                    "highest_bidder_team_id": None,
                    "highest_bidder_team_name": None,
                    "status": PlayerLotStatus.AVAILABLE.value,
                    "sold_price": None,
                    "sold_to_team_id": None,
                    "sold_to_team_name": None,
                    "created_at": datetime.now(timezone.utc),
                }
                await db.auction_lots.insert_one(lot_doc)
                count_added += 1
        return count_added

    @staticmethod
    async def get_auction_state(tournament_id: str) -> AuctionStateResponse:
        db = db_manager.db
        tourney = await TournamentService.get_tournament_by_id_or_slug(tournament_id)
        auction = await db.auctions.find_one({"tournament_id": tourney["_id"]})
        if not auction:
            raise HTTPException(status_code=404, detail="No auction configured for this tournament.")

        aid = auction["_id"]
        # Fetch current lot
        lots = await db.auction_lots.find({"auction_id": aid}).sort("created_at", 1).to_list(length=500)
        total_lots = len(lots)
        sold_count = sum(1 for l in lots if l["status"] == PlayerLotStatus.SOLD.value)
        unsold_count = sum(1 for l in lots if l["status"] == PlayerLotStatus.UNSOLD.value)

        current_idx = auction.get("current_lot_index", -1)
        current_lot = None
        if 0 <= current_idx < len(lots):
            current_lot = AuctionPlayerLot(**lots[current_idx])

        # Fetch recent bid history
        recent_bids_docs = await db.bids.find({"auction_id": str(aid)}).sort("timestamp", -1).limit(20).to_list(length=20)
        recent_bids = [
            BidResponse(
                id=str(b["_id"]),
                auction_id=b["auction_id"],
                lot_registration_id=b["lot_registration_id"],
                team_id=b["team_id"],
                team_name=b["team_name"],
                amount=b["amount"],
                timestamp=b["timestamp"],
            )
            for b in recent_bids_docs
        ]

        # Fetch teams
        teams = await TeamService.get_tournament_teams(str(tourney["_id"]))

        return AuctionStateResponse(
            id=str(aid),
            tournament_id=str(tourney["_id"]),
            name=auction["name"],
            status=auction["status"],
            base_price_default=auction.get("base_price_default", 1000.0),
            min_bid_increment=auction.get("min_bid_increment", 100.0),
            timer_seconds=auction.get("timer_seconds", 30),
            timer_deadline=auction.get("timer_deadline"),
            current_lot_index=current_idx,
            current_lot=current_lot,
            total_lots_count=total_lots,
            sold_lots_count=sold_count,
            unsold_lots_count=unsold_count,
            bids_history=recent_bids,
            teams=teams,
        )

    @staticmethod
    async def place_bid(
        tournament_id: str,
        user_id: str,
        user_role: str,
        payload: BidPlacementRequest,
    ) -> BidResponse:
        db = db_manager.db
        tourney = await TournamentService.get_tournament_by_id_or_slug(tournament_id)
        auction = await db.auctions.find_one({"tournament_id": tourney["_id"]})
        if not auction:
            raise HTTPException(status_code=404, detail="Auction not found.")

        # 1. State check: Must be LIVE
        if auction.get("status") != AuctionStatus.LIVE.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bidding is not open. Auction is not LIVE.",
            )

        # 2. Lot check: Must have an active player lot IN_AUCTION
        aid = auction["_id"]
        lots = await db.auction_lots.find({"auction_id": aid}).sort("created_at", 1).to_list(length=500)
        curr_idx = auction.get("current_lot_index", -1)
        if not (0 <= curr_idx < len(lots)):
            raise HTTPException(status_code=400, detail="No active player lot in auction.")

        lot = lots[curr_idx]
        if lot.get("status") not in [PlayerLotStatus.IN_AUCTION.value, PlayerLotStatus.AVAILABLE.value]:
            raise HTTPException(status_code=400, detail="Current player lot is not open for bidding.")

        # 3. Team check & Authorization
        team = await db.teams.find_one({"_id": ObjectId(payload.team_id)})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found.")

        # Authorization: Must be organizer, super admin, or assigned representative
        is_owner = str(tourney["organizer_id"]) == user_id
        is_rep = team.get("representative_user_id") == user_id
        is_admin = user_role == "SUPER_ADMIN"
        if not (is_owner or is_rep or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You are not authorized to place bids for this team.",
            )

        # 4. Roster limit check
        sold_to_team = await db.auction_lots.count_documents({
            "auction_id": aid,
            "sold_to_team_id": str(team["_id"]),
            "status": PlayerLotStatus.SOLD.value,
        })
        if sold_to_team >= team.get("roster_limit", 15):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Team '{team['name']}' has reached its maximum roster limit of {team.get('roster_limit')}.",
            )

        # 5. Bid Increment validation
        current_highest = lot.get("current_bid", 0.0)
        base_price = lot.get("base_price", 1000.0)
        increment = auction.get("min_bid_increment", 100.0)

        min_valid = (current_highest + increment) if current_highest > 0 else base_price
        if payload.amount < min_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid bid amount: Minimum valid bid is {min_valid}.",
            )

        # 6. Budget check
        if payload.amount > team["remaining_budget"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient budget: Team only has {team['remaining_budget']} remaining.",
            )

        # 7. Atomic update on lot
        now = datetime.now(timezone.utc)
        timer_seconds = auction.get("timer_seconds", 30)
        timer_deadline = now + timedelta(seconds=timer_seconds)

        await db.auction_lots.update_one(
            {"_id": lot["_id"]},
            {
                "$set": {
                    "current_bid": payload.amount,
                    "highest_bidder_team_id": str(team["_id"]),
                    "highest_bidder_team_name": team["name"],
                    "status": PlayerLotStatus.IN_AUCTION.value,
                }
            },
        )

        # Extend/Reset timer deadline in auction
        await db.auctions.update_one(
            {"_id": aid},
            {"$set": {"timer_deadline": timer_deadline, "updated_at": now}},
        )

        # Record Bid in persistent history
        bid_doc = {
            "auction_id": str(aid),
            "lot_registration_id": lot["registration_id"],
            "team_id": str(team["_id"]),
            "team_name": team["name"],
            "bidder_user_id": user_id,
            "amount": payload.amount,
            "timestamp": now,
        }
        res = await db.bids.insert_one(bid_doc)

        bid_response = BidResponse(
            id=str(res.inserted_id),
            auction_id=str(aid),
            lot_registration_id=lot["registration_id"],
            team_id=str(team["_id"]),
            team_name=team["name"],
            amount=payload.amount,
            timestamp=now,
        )

        # Real-time WebSocket Broadcast
        await auction_ws_manager.broadcast(
            str(aid),
            {
                "type": "NEW_BID",
                "bid": bid_response.model_dump(mode="json"),
                "lot_id": lot["registration_id"],
                "timer_deadline": timer_deadline.isoformat(),
            },
        )

        return bid_response

    @staticmethod
    async def auctioneer_action(
        tournament_id: str,
        user_id: str,
        is_super_admin: bool,
        action: str,  # "START", "PAUSE", "NEXT_LOT", "SOLD", "UNSOLD", "COMPLETE"
    ) -> dict:
        db = db_manager.db
        tourney = await TournamentService.get_tournament_by_id_or_slug(tournament_id)
        if str(tourney["organizer_id"]) != user_id and not is_super_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Only the tournament organizer or super admin can run the auction.",
            )

        auction = await db.auctions.find_one({"tournament_id": tourney["_id"]})
        if not auction:
            raise HTTPException(status_code=404, detail="Auction not configured.")

        aid = auction["_id"]
        lots = await db.auction_lots.find({"auction_id": aid}).sort("created_at", 1).to_list(length=500)
        curr_idx = auction.get("current_lot_index", -1)
        now = datetime.now(timezone.utc)

        if action == "START":
            new_idx = curr_idx if (0 <= curr_idx < len(lots)) else 0
            deadline = now + timedelta(seconds=auction.get("timer_seconds", 30))
            await db.auctions.update_one(
                {"_id": aid},
                {
                    "$set": {
                        "status": AuctionStatus.LIVE.value,
                        "current_lot_index": new_idx,
                        "timer_deadline": deadline,
                        "updated_at": now,
                    }
                },
            )
            if 0 <= new_idx < len(lots):
                await db.auction_lots.update_one(
                    {"_id": lots[new_idx]["_id"]},
                    {"$set": {"status": PlayerLotStatus.IN_AUCTION.value}},
                )

        elif action == "PAUSE":
            await db.auctions.update_one(
                {"_id": aid},
                {"$set": {"status": AuctionStatus.PAUSED.value, "updated_at": now}},
            )

        elif action == "SOLD":
            if not (0 <= curr_idx < len(lots)):
                raise HTTPException(status_code=400, detail="No active lot to sell.")
            curr_lot = lots[curr_idx]
            winning_team_id = curr_lot.get("highest_bidder_team_id")
            winning_amount = curr_lot.get("current_bid", 0.0)

            if not winning_team_id or winning_amount <= 0:
                raise HTTPException(status_code=400, detail="Cannot mark SOLD without any bids.")

            # Deduct team budget atomically
            await db.teams.update_one(
                {"_id": ObjectId(winning_team_id)},
                {"$inc": {"remaining_budget": -winning_amount, "purchased_players_count": 1}},
            )

            # Mark lot SOLD
            await db.auction_lots.update_one(
                {"_id": curr_lot["_id"]},
                {
                    "$set": {
                        "status": PlayerLotStatus.SOLD.value,
                        "sold_price": winning_amount,
                        "sold_to_team_id": winning_team_id,
                        "sold_to_team_name": curr_lot.get("highest_bidder_team_name"),
                    }
                },
            )

            # Auto advance to next lot or complete
            next_idx = curr_idx + 1
            if next_idx < len(lots):
                deadline = now + timedelta(seconds=auction.get("timer_seconds", 30))
                await db.auctions.update_one(
                    {"_id": aid},
                    {"$set": {"current_lot_index": next_idx, "timer_deadline": deadline}},
                )
                await db.auction_lots.update_one(
                    {"_id": lots[next_idx]["_id"]},
                    {"$set": {"status": PlayerLotStatus.IN_AUCTION.value}},
                )
            else:
                await db.auctions.update_one(
                    {"_id": aid},
                    {"$set": {"status": AuctionStatus.COMPLETED.value}},
                )

        elif action == "UNSOLD":
            if not (0 <= curr_idx < len(lots)):
                raise HTTPException(status_code=400, detail="No active lot.")
            curr_lot = lots[curr_idx]
            await db.auction_lots.update_one(
                {"_id": curr_lot["_id"]},
                {"$set": {"status": PlayerLotStatus.UNSOLD.value}},
            )
            next_idx = curr_idx + 1
            if next_idx < len(lots):
                deadline = now + timedelta(seconds=auction.get("timer_seconds", 30))
                await db.auctions.update_one(
                    {"_id": aid},
                    {"$set": {"current_lot_index": next_idx, "timer_deadline": deadline}},
                )
                await db.auction_lots.update_one(
                    {"_id": lots[next_idx]["_id"]},
                    {"$set": {"status": PlayerLotStatus.IN_AUCTION.value}},
                )
            else:
                await db.auctions.update_one(
                    {"_id": aid},
                    {"$set": {"status": AuctionStatus.COMPLETED.value}},
                )

        elif action == "COMPLETE":
            await db.auctions.update_one(
                {"_id": aid},
                {"$set": {"status": AuctionStatus.COMPLETED.value, "updated_at": now}},
            )

        # Notify active clients
        await auction_ws_manager.broadcast(str(aid), {"type": "STATE_CHANGE", "action": action})
        return {"status": "success", "action": action}
