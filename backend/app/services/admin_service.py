from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import db_manager
from app.core.logging import logger
from app.models.user import UserRole, AccountStatus
from app.models.tournament import TournamentStatus, RegistrationStatus
from app.models.auction import AuctionStatus


class AdminService:
    @staticmethod
    async def log_activity(
        admin_id: str,
        admin_email: str,
        action: str,
        target_type: str,
        target_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        """Record an immutable admin action in the activity log."""
        db = db_manager.db
        if db is None:
            return
        doc = {
            "admin_id": ObjectId(admin_id) if ObjectId.is_valid(admin_id) else admin_id,
            "admin_email": admin_email,
            "action": action,
            "target_type": target_type,
            "target_id": str(target_id) if target_id else None,
            "details": details or {},
            "timestamp": datetime.now(timezone.utc),
        }
        await db.admin_activity_logs.insert_one(doc)

    @staticmethod
    async def get_overview_stats() -> Dict[str, Any]:
        """Aggregate real metrics from all collections in MongoDB."""
        db = db_manager.db
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")

        # Counts
        total_tournaments = await db.tournaments.count_documents({})
        published_tournaments = await db.tournaments.count_documents({"status": TournamentStatus.PUBLISHED.value})
        total_organizers = await db.users.count_documents({"role": UserRole.ORGANIZER.value})
        pending_organizers = await db.users.count_documents({
            "role": UserRole.ORGANIZER.value,
            "account_status": AccountStatus.PENDING_VERIFICATION.value,
        })
        total_players = await db.users.count_documents({"role": UserRole.PLAYER.value})
        total_registrations = await db.tournament_registrations.count_documents({})
        approved_registrations = await db.tournament_registrations.count_documents({"status": RegistrationStatus.APPROVED.value})
        total_teams = await db.teams.count_documents({})
        live_auctions = await db.auctions.count_documents({"status": AuctionStatus.LIVE.value})
        total_auctions = await db.auctions.count_documents({})

        # Calculate total tournament entry fee volume
        pipeline = [
            {"$group": {"_id": None, "total_fees": {"$sum": "$entry_fee"}}}
        ]
        fee_result = await db.tournaments.aggregate(pipeline).to_list(1)
        total_fee_volume = fee_result[0]["total_fees"] if fee_result else 0.0

        # Recent Tournaments
        recent_tournaments_cursor = db.tournaments.find({}).sort("created_at", -1).limit(5)
        raw_tournaments = await recent_tournaments_cursor.to_list(5)
        recent_tournaments = []
        for t in raw_tournaments:
            regs_count = await db.tournament_registrations.count_documents({"tournament_id": t["_id"]})
            recent_tournaments.append({
                "id": str(t["_id"]),
                "title": t.get("title", ""),
                "sport": t.get("sport", ""),
                "status": t.get("status", "DRAFT"),
                "venue": t.get("venue", ""),
                "city": t.get("city", ""),
                "created_at": t.get("created_at", datetime.now(timezone.utc)).isoformat() if isinstance(t.get("created_at"), datetime) else str(t.get("created_at")),
                "total_registrations": regs_count,
            })

        # Recent Live/Scheduled Auctions
        recent_auctions_cursor = db.auctions.find({}).sort("created_at", -1).limit(4)
        raw_auctions = await recent_auctions_cursor.to_list(4)
        recent_auctions = []
        for a in raw_auctions:
            t_doc = await db.tournaments.find_one({"_id": a.get("tournament_id")})
            recent_auctions.append({
                "id": str(a["_id"]),
                "name": a.get("name", "Tournament Auction"),
                "tournament_title": t_doc.get("title") if t_doc else "Unknown Tournament",
                "status": a.get("status", "DRAFT"),
                "total_lots": len(a.get("lots", [])),
                "current_lot_index": a.get("current_lot_index", -1),
                "created_at": a.get("created_at", datetime.now(timezone.utc)).isoformat() if isinstance(a.get("created_at"), datetime) else str(a.get("created_at")),
            })

        # Recent Activity Feed
        recent_logs_cursor = db.admin_activity_logs.find({}).sort("timestamp", -1).limit(6)
        raw_logs = await recent_logs_cursor.to_list(6)
        activity_feed = []
        for log in raw_logs:
            activity_feed.append({
                "id": str(log["_id"]),
                "admin_email": log.get("admin_email", "system"),
                "action": log.get("action", ""),
                "target_type": log.get("target_type", ""),
                "target_id": log.get("target_id", ""),
                "timestamp": log.get("timestamp", datetime.now(timezone.utc)).isoformat() if isinstance(log.get("timestamp"), datetime) else str(log.get("timestamp")),
                "details": log.get("details", {}),
            })

        return {
            "stats": {
                "total_tournaments": total_tournaments,
                "published_tournaments": published_tournaments,
                "total_organizers": total_organizers,
                "pending_organizers": pending_organizers,
                "total_players": total_players,
                "total_registrations": total_registrations,
                "approved_registrations": approved_registrations,
                "total_teams": total_teams,
                "live_auctions": live_auctions,
                "total_auctions": total_auctions,
                "total_fee_volume": float(total_fee_volume),
            },
            "recent_tournaments": recent_tournaments,
            "recent_auctions": recent_auctions,
            "activity_feed": activity_feed,
        }

    @staticmethod
    async def get_all_tournaments(
        status_filter: Optional[str] = None,
        sport_filter: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        db = db_manager.db
        if db is None:
            return []

        query: Dict[str, Any] = {}
        if status_filter and status_filter.upper() != "ALL":
            query["status"] = status_filter.upper()
        if sport_filter and sport_filter.upper() != "ALL":
            query["sport"] = sport_filter.upper()
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"city": {"$regex": search, "$options": "i"}},
                {"venue": {"$regex": search, "$options": "i"}},
            ]

        cursor = db.tournaments.find(query).sort("created_at", -1)
        tournaments = await cursor.to_list(100)

        results = []
        for t in tournaments:
            tid = t["_id"]
            org = await db.users.find_one({"_id": t.get("organizer_id")})
            total_regs = await db.tournament_registrations.count_documents({"tournament_id": tid})
            approved_regs = await db.tournament_registrations.count_documents({
                "tournament_id": tid,
                "status": RegistrationStatus.APPROVED.value,
            })
            teams_count = await db.teams.count_documents({"tournament_id": tid})
            auction = await db.auctions.find_one({"tournament_id": tid})

            results.append({
                "id": str(tid),
                "title": t.get("title", ""),
                "slug": t.get("slug", ""),
                "sport": t.get("sport", ""),
                "description": t.get("description", ""),
                "venue": t.get("venue", ""),
                "city": t.get("city", ""),
                "state": t.get("state", ""),
                "start_date": t.get("start_date").isoformat() if isinstance(t.get("start_date"), datetime) else str(t.get("start_date")),
                "end_date": t.get("end_date").isoformat() if isinstance(t.get("end_date"), datetime) else str(t.get("end_date")),
                "registration_deadline": t.get("registration_deadline").isoformat() if isinstance(t.get("registration_deadline"), datetime) else str(t.get("registration_deadline")),
                "entry_fee": float(t.get("entry_fee", 0.0)),
                "status": t.get("status", "DRAFT"),
                "organizer": {
                    "id": str(org["_id"]) if org else str(t.get("organizer_id")),
                    "name": org.get("full_name", "Unknown Organizer") if org else "Unknown",
                    "email": org.get("email", "") if org else "",
                },
                "total_registrations": total_regs,
                "approved_registrations": approved_regs,
                "teams_count": teams_count,
                "auction_status": auction.get("status") if auction else "NONE",
                "created_at": t.get("created_at").isoformat() if isinstance(t.get("created_at"), datetime) else str(t.get("created_at")),
            })
        return results

    @staticmethod
    async def update_tournament_status(tournament_id: str, new_status: str, admin_user: Any) -> Dict[str, Any]:
        db = db_manager.db
        if not ObjectId.is_valid(tournament_id):
            raise HTTPException(status_code=400, detail="Invalid tournament ID")

        valid_statuses = [s.value for s in TournamentStatus]
        if new_status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

        res = await db.tournaments.update_one(
            {"_id": ObjectId(tournament_id)},
            {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}},
        )
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Tournament not found")

        await AdminService.log_activity(
            admin_id=admin_user.id,
            admin_email=admin_user.email,
            action="UPDATE_TOURNAMENT_STATUS",
            target_type="TOURNAMENT",
            target_id=tournament_id,
            details={"new_status": new_status},
        )
        return {"status": "success", "tournament_id": tournament_id, "new_status": new_status}

    @staticmethod
    async def delete_tournament(tournament_id: str, admin_user: Any) -> Dict[str, Any]:
        db = db_manager.db
        if not ObjectId.is_valid(tournament_id):
            raise HTTPException(status_code=400, detail="Invalid tournament ID")

        tid = ObjectId(tournament_id)
        doc = await db.tournaments.find_one({"_id": tid})
        if not doc:
            raise HTTPException(status_code=404, detail="Tournament not found")

        # Delete associated registrations, teams, auctions
        await db.tournament_registrations.delete_many({"tournament_id": tid})
        await db.teams.delete_many({"tournament_id": tid})
        await db.auctions.delete_many({"tournament_id": tid})
        await db.tournaments.delete_one({"_id": tid})

        await AdminService.log_activity(
            admin_id=admin_user.id,
            admin_email=admin_user.email,
            action="DELETE_TOURNAMENT",
            target_type="TOURNAMENT",
            target_id=tournament_id,
            details={"title": doc.get("title")},
        )
        return {"status": "success", "message": f"Tournament '{doc.get('title')}' and related data deleted."}

    @staticmethod
    async def get_all_organizers() -> List[Dict[str, Any]]:
        db = db_manager.db
        if db is None:
            return []

        cursor = db.users.find({"role": {"$in": [UserRole.ORGANIZER.value, UserRole.SUPER_ADMIN.value]}}).sort("created_at", -1)
        users = await cursor.to_list(100)

        results = []
        for u in users:
            uid = u["_id"]
            tournaments_count = await db.tournaments.count_documents({"organizer_id": uid})
            total_players_handled = 0
            tourneys = await db.tournaments.find({"organizer_id": uid}, {"_id": 1}).to_list(100)
            if tourneys:
                tids = [t["_id"] for t in tourneys]
                total_players_handled = await db.tournament_registrations.count_documents({"tournament_id": {"$in": tids}})

            results.append({
                "id": str(uid),
                "full_name": u.get("full_name", ""),
                "email": u.get("email", ""),
                "phone_number": u.get("phone_number", ""),
                "role": u.get("role", "ORGANIZER"),
                "account_status": u.get("account_status", "ACTIVE"),
                "tournaments_count": tournaments_count,
                "players_handled": total_players_handled,
                "created_at": u.get("created_at").isoformat() if isinstance(u.get("created_at"), datetime) else str(u.get("created_at")),
                "last_login_at": u.get("last_login_at").isoformat() if isinstance(u.get("last_login_at"), datetime) else (str(u.get("last_login_at")) if u.get("last_login_at") else None),
            })
        return results

    @staticmethod
    async def update_user_status(user_id: str, new_status: str, admin_user: Any) -> Dict[str, Any]:
        db = db_manager.db
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID")

        valid_statuses = [s.value for s in AccountStatus]
        if new_status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

        res = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"account_status": new_status, "updated_at": datetime.now(timezone.utc)}},
        )
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")

        await AdminService.log_activity(
            admin_id=admin_user.id,
            admin_email=admin_user.email,
            action="UPDATE_USER_STATUS",
            target_type="USER",
            target_id=user_id,
            details={"new_status": new_status},
        )
        return {"status": "success", "user_id": user_id, "new_status": new_status}

    @staticmethod
    async def get_all_players() -> List[Dict[str, Any]]:
        db = db_manager.db
        if db is None:
            return []

        cursor = db.users.find({"role": UserRole.PLAYER.value}).sort("created_at", -1)
        players = await cursor.to_list(100)

        results = []
        for p in players:
            pid = p["_id"]
            regs = await db.tournament_registrations.find({"player_id": pid}).to_list(100)
            approved_posters = sum(1 for r in regs if r.get("status") == RegistrationStatus.APPROVED.value and r.get("poster_url"))
            
            tourneys_entered = []
            for r in regs:
                t = await db.tournaments.find_one({"_id": r.get("tournament_id")})
                if t:
                    tourneys_entered.append({
                        "tournament_id": str(t["_id"]),
                        "title": t.get("title", ""),
                        "sport": t.get("sport", ""),
                        "status": r.get("status", "PENDING"),
                        "poster_url": r.get("poster_url"),
                    })

            results.append({
                "id": str(pid),
                "full_name": p.get("full_name", ""),
                "email": p.get("email", ""),
                "phone_number": p.get("phone_number", ""),
                "account_status": p.get("account_status", "ACTIVE"),
                "total_registrations": len(regs),
                "approved_posters": approved_posters,
                "tournaments": tourneys_entered,
                "created_at": p.get("created_at").isoformat() if isinstance(p.get("created_at"), datetime) else str(p.get("created_at")),
                "last_login_at": p.get("last_login_at").isoformat() if isinstance(p.get("last_login_at"), datetime) else (str(p.get("last_login_at")) if p.get("last_login_at") else None),
            })
        return results

    @staticmethod
    async def get_all_teams() -> List[Dict[str, Any]]:
        db = db_manager.db
        if db is None:
            return []

        cursor = db.teams.find({}).sort("created_at", -1)
        teams = await cursor.to_list(100)

        results = []
        for team in teams:
            t_doc = await db.tournaments.find_one({"_id": team.get("tournament_id")})
            results.append({
                "id": str(team["_id"]),
                "tournament_id": str(team.get("tournament_id")),
                "tournament_title": t_doc.get("title", "Unknown") if t_doc else "Unknown",
                "name": team.get("name", ""),
                "logo_url": team.get("logo_url"),
                "owner_name": team.get("owner_name", ""),
                "owner_phone": team.get("owner_phone", ""),
                "initial_budget": float(team.get("initial_budget", 0.0)),
                "remaining_budget": float(team.get("remaining_budget", 0.0)),
                "roster_limit": int(team.get("roster_limit", 15)),
                "purchased_players_count": int(team.get("purchased_players_count", 0)),
                "created_at": team.get("created_at").isoformat() if isinstance(team.get("created_at"), datetime) else str(team.get("created_at")),
            })
        return results

    @staticmethod
    async def update_team_budget(team_id: str, new_budget: float, admin_user: Any) -> Dict[str, Any]:
        db = db_manager.db
        if not ObjectId.is_valid(team_id):
            raise HTTPException(status_code=400, detail="Invalid team ID")

        res = await db.teams.update_one(
            {"_id": ObjectId(team_id)},
            {"$set": {"remaining_budget": float(new_budget), "updated_at": datetime.now(timezone.utc)}},
        )
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Team not found")

        await AdminService.log_activity(
            admin_id=admin_user.id,
            admin_email=admin_user.email,
            action="UPDATE_TEAM_BUDGET",
            target_type="TEAM",
            target_id=team_id,
            details={"new_budget": new_budget},
        )
        return {"status": "success", "team_id": team_id, "new_budget": new_budget}

    @staticmethod
    async def get_all_auctions() -> List[Dict[str, Any]]:
        db = db_manager.db
        if db is None:
            return []

        cursor = db.auctions.find({}).sort("created_at", -1)
        auctions = await cursor.to_list(50)

        results = []
        for a in auctions:
            t_doc = await db.tournaments.find_one({"_id": a.get("tournament_id")})
            bids_count = await db.bids.count_documents({"auction_id": a["_id"]})
            teams_count = await db.teams.count_documents({"tournament_id": a.get("tournament_id")})
            lots = a.get("lots", [])
            sold_count = sum(1 for lot in lots if lot.get("status") == "SOLD")
            unsold_count = sum(1 for lot in lots if lot.get("status") == "UNSOLD")

            results.append({
                "id": str(a["_id"]),
                "tournament_id": str(a.get("tournament_id")),
                "tournament_title": t_doc.get("title", "Tournament") if t_doc else "Unknown",
                "name": a.get("name", ""),
                "status": a.get("status", "DRAFT"),
                "total_lots": len(lots),
                "sold_count": sold_count,
                "unsold_count": unsold_count,
                "teams_count": teams_count,
                "total_bids": bids_count,
                "current_lot_index": a.get("current_lot_index", -1),
                "timer_seconds": a.get("timer_seconds", 30),
                "start_time": a.get("start_time").isoformat() if isinstance(a.get("start_time"), datetime) else str(a.get("start_time")),
                "created_at": a.get("created_at").isoformat() if isinstance(a.get("created_at"), datetime) else str(a.get("created_at")),
            })
        return results

    @staticmethod
    async def update_auction_status(auction_id: str, new_status: str, admin_user: Any) -> Dict[str, Any]:
        db = db_manager.db
        if not ObjectId.is_valid(auction_id):
            raise HTTPException(status_code=400, detail="Invalid auction ID")

        valid_statuses = [s.value for s in AuctionStatus]
        if new_status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid auction status: {valid_statuses}")

        res = await db.auctions.update_one(
            {"_id": ObjectId(auction_id)},
            {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}},
        )
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Auction not found")

        await AdminService.log_activity(
            admin_id=admin_user.id,
            admin_email=admin_user.email,
            action="UPDATE_AUCTION_STATUS",
            target_type="AUCTION",
            target_id=auction_id,
            details={"new_status": new_status},
        )
        return {"status": "success", "auction_id": auction_id, "new_status": new_status}

    @staticmethod
    async def get_auction_results() -> Dict[str, Any]:
        db = db_manager.db
        if db is None:
            return {"tournaments": [], "total_spent": 0.0, "total_sold_players": 0}

        cursor = db.auctions.find({"lots": {"$exists": True}}).sort("created_at", -1)
        auctions = await cursor.to_list(50)

        auction_results = []
        global_spent = 0.0
        global_sold = 0

        for a in auctions:
            t_doc = await db.tournaments.find_one({"_id": a.get("tournament_id")})
            lots = a.get("lots", [])
            sold_lots = [lot for lot in lots if lot.get("status") == "SOLD"]
            unsold_lots = [lot for lot in lots if lot.get("status") == "UNSOLD"]
            
            tourney_spent = sum(lot.get("sold_price", 0.0) or 0.0 for lot in sold_lots)
            global_spent += tourney_spent
            global_sold += len(sold_lots)

            auction_results.append({
                "auction_id": str(a["_id"]),
                "tournament_id": str(a.get("tournament_id")),
                "tournament_title": t_doc.get("title", "Tournament") if t_doc else "Unknown",
                "auction_name": a.get("name", ""),
                "status": a.get("status", "DRAFT"),
                "total_spent": tourney_spent,
                "sold_count": len(sold_lots),
                "unsold_count": len(unsold_lots),
                "sold_players": [
                    {
                        "player_name": lot.get("player_name"),
                        "role_or_pos": lot.get("role_or_pos"),
                        "base_price": lot.get("base_price"),
                        "sold_price": lot.get("sold_price"),
                        "team_name": lot.get("sold_to_team_name") or lot.get("highest_bidder_team_name") or "Allocated",
                        "poster_url": lot.get("poster_url"),
                    }
                    for lot in sold_lots
                ],
                "unsold_players": [
                    {
                        "player_name": lot.get("player_name"),
                        "role_or_pos": lot.get("role_or_pos"),
                        "base_price": lot.get("base_price"),
                    }
                    for lot in unsold_lots
                ],
            })

        return {
            "tournaments": auction_results,
            "total_spent": global_spent,
            "total_sold_players": global_sold,
        }

    @staticmethod
    async def get_platform_analytics() -> Dict[str, Any]:
        db = db_manager.db
        if db is None:
            return {}

        # Sport distribution
        sport_pipeline = [
            {"$group": {"_id": "$sport", "count": {"$sum": 1}}}
        ]
        sport_counts = await db.tournaments.aggregate(sport_pipeline).to_list(20)

        # Tournament status distribution
        status_pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        status_counts = await db.tournaments.aggregate(status_pipeline).to_list(20)

        # Registration status distribution
        reg_status_pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        reg_status_counts = await db.tournament_registrations.aggregate(reg_status_pipeline).to_list(20)

        # User role distribution
        role_pipeline = [
            {"$group": {"_id": "$role", "count": {"$sum": 1}}}
        ]
        role_counts = await db.users.aggregate(role_pipeline).to_list(20)

        return {
            "by_sport": {item["_id"]: item["count"] for item in sport_counts if item["_id"]},
            "tournament_statuses": {item["_id"]: item["count"] for item in status_counts if item["_id"]},
            "registration_statuses": {item["_id"]: item["count"] for item in reg_status_counts if item["_id"]},
            "user_roles": {item["_id"]: item["count"] for item in role_counts if item["_id"]},
        }

    @staticmethod
    async def get_activity_logs(limit: int = 50) -> List[Dict[str, Any]]:
        db = db_manager.db
        if db is None:
            return []

        cursor = db.admin_activity_logs.find({}).sort("timestamp", -1).limit(limit)
        logs = await cursor.to_list(limit)

        results = []
        for log in logs:
            results.append({
                "id": str(log["_id"]),
                "admin_id": str(log.get("admin_id")),
                "admin_email": log.get("admin_email", "system"),
                "action": log.get("action", ""),
                "target_type": log.get("target_type", ""),
                "target_id": log.get("target_id", ""),
                "details": log.get("details", {}),
                "timestamp": log.get("timestamp").isoformat() if isinstance(log.get("timestamp"), datetime) else str(log.get("timestamp")),
            })
        return results

    @staticmethod
    async def get_system_settings() -> Dict[str, Any]:
        db = db_manager.db
        if db is None:
            return {}

        settings_doc = await db.system_settings.find_one({"_id": "global_config"})
        if not settings_doc:
            # Seed default system settings
            default_settings = {
                "_id": "global_config",
                "platform_name": "SportBid Enterprise Arena",
                "support_email": "admin@sportbid.com",
                "maintenance_mode": False,
                "allow_new_registrations": True,
                "default_currency": "INR",
                "max_poster_upload_mb": 8,
                "auto_approval_enabled": False,
                "banner_announcement": "Welcome to the SportBid Live Tournament Management Platform.",
                "updated_at": datetime.now(timezone.utc),
            }
            await db.system_settings.insert_one(default_settings)
            settings_doc = default_settings

        return {
            "platform_name": settings_doc.get("platform_name", "SportBid Enterprise Arena"),
            "support_email": settings_doc.get("support_email", "admin@sportbid.com"),
            "maintenance_mode": bool(settings_doc.get("maintenance_mode", False)),
            "allow_new_registrations": bool(settings_doc.get("allow_new_registrations", True)),
            "default_currency": settings_doc.get("default_currency", "INR"),
            "max_poster_upload_mb": int(settings_doc.get("max_poster_upload_mb", 8)),
            "auto_approval_enabled": bool(settings_doc.get("auto_approval_enabled", False)),
            "banner_announcement": settings_doc.get("banner_announcement", ""),
        }

    @staticmethod
    async def update_system_settings(payload: Dict[str, Any], admin_user: Any) -> Dict[str, Any]:
        db = db_manager.db
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")

        updates = {
            "platform_name": payload.get("platform_name", "SportBid Enterprise Arena"),
            "support_email": payload.get("support_email", "admin@sportbid.com"),
            "maintenance_mode": bool(payload.get("maintenance_mode", False)),
            "allow_new_registrations": bool(payload.get("allow_new_registrations", True)),
            "default_currency": payload.get("default_currency", "INR"),
            "max_poster_upload_mb": int(payload.get("max_poster_upload_mb", 8)),
            "auto_approval_enabled": bool(payload.get("auto_approval_enabled", False)),
            "banner_announcement": payload.get("banner_announcement", ""),
            "updated_at": datetime.now(timezone.utc),
            "updated_by": admin_user.email,
        }

        await db.system_settings.update_one(
            {"_id": "global_config"},
            {"$set": updates},
            upsert=True,
        )

        await AdminService.log_activity(
            admin_id=admin_user.id,
            admin_email=admin_user.email,
            action="UPDATE_SYSTEM_SETTINGS",
            target_type="CONFIG",
            target_id="global_config",
            details=payload,
        )
        return {"status": "success", "message": "Platform settings updated successfully."}

    @staticmethod
    async def export_data(data_type: str) -> List[Dict[str, Any]]:
        db = db_manager.db
        if db is None:
            return []

        if data_type == "tournaments":
            cursor = db.tournaments.find({}).sort("created_at", -1)
            docs = await cursor.to_list(500)
            return [
                {
                    "id": str(d["_id"]),
                    "title": d.get("title"),
                    "sport": d.get("sport"),
                    "status": d.get("status"),
                    "venue": d.get("venue"),
                    "city": d.get("city"),
                    "entry_fee": d.get("entry_fee", 0.0),
                    "created_at": d.get("created_at").isoformat() if isinstance(d.get("created_at"), datetime) else str(d.get("created_at")),
                }
                for d in docs
            ]
        elif data_type == "organizers":
            cursor = db.users.find({"role": UserRole.ORGANIZER.value}).sort("created_at", -1)
            docs = await cursor.to_list(500)
            return [
                {
                    "id": str(d["_id"]),
                    "full_name": d.get("full_name"),
                    "email": d.get("email"),
                    "phone_number": d.get("phone_number"),
                    "status": d.get("account_status"),
                    "created_at": d.get("created_at").isoformat() if isinstance(d.get("created_at"), datetime) else str(d.get("created_at")),
                }
                for d in docs
            ]
        elif data_type == "players":
            cursor = db.users.find({"role": UserRole.PLAYER.value}).sort("created_at", -1)
            docs = await cursor.to_list(500)
            return [
                {
                    "id": str(d["_id"]),
                    "full_name": d.get("full_name"),
                    "email": d.get("email"),
                    "phone_number": d.get("phone_number"),
                    "status": d.get("account_status"),
                    "created_at": d.get("created_at").isoformat() if isinstance(d.get("created_at"), datetime) else str(d.get("created_at")),
                }
                for d in docs
            ]
        elif data_type == "teams":
            cursor = db.teams.find({}).sort("created_at", -1)
            docs = await cursor.to_list(500)
            return [
                {
                    "id": str(d["_id"]),
                    "name": d.get("name"),
                    "owner_name": d.get("owner_name"),
                    "owner_phone": d.get("owner_phone"),
                    "initial_budget": d.get("initial_budget"),
                    "remaining_budget": d.get("remaining_budget"),
                    "purchased_players": d.get("purchased_players_count"),
                }
                for d in docs
            ]
        return []
