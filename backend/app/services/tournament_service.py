import re
import uuid
import base64
from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import db_manager
from app.core.logging import logger
from app.models.tournament import (
    SportType,
    TournamentStatus,
    RegistrationStatus,
    PosterStatus,
)
from app.schemas.tournament import (
    TournamentCreateRequest,
    TournamentUpdateRequest,
    TournamentResponse,
    RegistrationCreateRequest,
    RegistrationResponse,
    RegistrationReviewRequest,
    default_fields_for_sport,
)
from app.services.poster_service import PosterEngine, UploadService


def slugify(text: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    return re.sub(r"[-\s]+", "-", cleaned)


def doc_to_tournament_response(doc: dict, total_regs: int = 0, approved_regs: int = 0) -> TournamentResponse:
    return TournamentResponse(
        id=str(doc["_id"]),
        organizer_id=str(doc["organizer_id"]),
        title=doc["title"],
        slug=doc["slug"],
        sport=doc["sport"],
        description=doc["description"],
        venue=doc["venue"],
        city=doc["city"],
        state=doc["state"],
        start_date=doc["start_date"],
        end_date=doc["end_date"],
        registration_deadline=doc["registration_deadline"],
        entry_fee=doc.get("entry_fee", 0.0),
        rules=doc.get("rules", []),
        status=doc["status"],
        custom_fields=doc.get("custom_fields", []),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
        total_registrations=total_regs,
        approved_registrations=approved_regs,
    )


def doc_to_registration_response(doc: dict) -> RegistrationResponse:
    village = (
        doc.get("village")
        or doc.get("custom_field_values", {}).get("village")
        or doc.get("custom_field_values", {}).get("place")
        or ""
    )
    role = (
        doc.get("role")
        or doc.get("custom_field_values", {}).get("role")
        or doc.get("custom_field_values", {}).get("position")
        or "All Rounder"
    )
    serial_num = doc.get("serial_number", 1)
    serial_str = doc.get("serial_str") or f"{serial_num:02d}"

    return RegistrationResponse(
        id=str(doc["_id"]),
        tournament_id=str(doc["tournament_id"]),
        player_id=str(doc["player_id"]),
        registration_number=doc["registration_number"],
        serial_number=serial_num,
        serial_str=serial_str,
        village=village,
        role=role,
        player_name=doc["player_name"],
        player_phone=doc["player_phone"],
        player_photo_url=doc.get("player_photo_url", ""),
        custom_field_values=doc.get("custom_field_values", {}),
        status=doc["status"],
        rejection_reason=doc.get("rejection_reason"),
        poster_url=doc.get("poster_url"),
        poster_status=doc.get("poster_status", PosterStatus.RENDERING.value),
        reviewed_at=doc.get("reviewed_at"),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )



class TournamentService:
    @staticmethod
    async def create_tournament(
        organizer_id: str,
        payload: TournamentCreateRequest,
    ) -> TournamentResponse:
        db = db_manager.db
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")

        # Validate date chronologies
        if payload.end_date < payload.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date cannot be earlier than start date.",
            )
        if payload.registration_deadline > payload.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration deadline cannot be after tournament end date.",
            )

        base_slug = slugify(payload.title)
        unique_slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"

        custom_fields = (
            payload.custom_fields
            if payload.custom_fields is not None
            else default_fields_for_sport(payload.sport)
        )

        now = datetime.now(timezone.utc)
        doc = {
            "organizer_id": ObjectId(organizer_id),
            "title": payload.title,
            "slug": unique_slug,
            "sport": payload.sport.value,
            "description": payload.description,
            "venue": payload.venue,
            "city": payload.city,
            "state": payload.state,
            "start_date": payload.start_date,
            "end_date": payload.end_date,
            "registration_deadline": payload.registration_deadline,
            "entry_fee": payload.entry_fee,
            "rules": payload.rules,
            "status": payload.status.value if payload.status else TournamentStatus.PUBLISHED.value,
            "custom_fields": [f.model_dump() for f in custom_fields],
            "created_at": now,
            "updated_at": now,
        }

        res = await db.tournaments.insert_one(doc)
        doc["_id"] = res.inserted_id
        logger.info(f"Tournament created: {payload.title} (ID: {res.inserted_id})")
        return doc_to_tournament_response(doc)

    @staticmethod
    async def get_tournament_by_id_or_slug(identifier: str) -> dict:
        db = db_manager.db
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")

        query = {}
        if ObjectId.is_valid(identifier):
            query = {"_id": ObjectId(identifier)}
        else:
            query = {"slug": identifier}

        doc = await db.tournaments.find_one(query)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tournament not found.",
            )
        return doc

    @staticmethod
    async def get_organizer_tournaments(organizer_id: str) -> List[TournamentResponse]:
        db = db_manager.db
        if db is None:
            return []

        cursor = db.tournaments.find({"organizer_id": ObjectId(organizer_id)}).sort("created_at", -1)
        tournaments = await cursor.to_list(length=100)

        results = []
        for t in tournaments:
            tid = t["_id"]
            total = await db.tournament_registrations.count_documents({"tournament_id": tid})
            approved = await db.tournament_registrations.count_documents(
                {"tournament_id": tid, "status": RegistrationStatus.APPROVED.value}
            )
            results.append(doc_to_tournament_response(t, total, approved))
        return results

    @staticmethod
    async def update_tournament(
        tournament_id: str,
        organizer_id: str,
        is_super_admin: bool,
        payload: TournamentUpdateRequest,
    ) -> TournamentResponse:
        db = db_manager.db
        doc = await TournamentService.get_tournament_by_id_or_slug(tournament_id)

        # Enforce Ownership Check
        if str(doc["organizer_id"]) != organizer_id and not is_super_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not have permission to modify this tournament.",
            )

        updates = {}
        for k, v in payload.model_dump(exclude_unset=True).items():
            if v is not None:
                if k == "sport":
                    updates[k] = v.value if hasattr(v, "value") else v
                elif k == "status":
                    updates[k] = v.value if hasattr(v, "value") else v
                elif k == "custom_fields":
                    updates[k] = [f if isinstance(f, dict) else f.model_dump() for f in v]
                else:
                    updates[k] = v

        updates["updated_at"] = datetime.now(timezone.utc)
        await db.tournaments.update_one({"_id": doc["_id"]}, {"$set": updates})
        updated_doc = await db.tournaments.find_one({"_id": doc["_id"]})
        return doc_to_tournament_response(updated_doc)

    @staticmethod
    async def register_player(
        tournament_id: str,
        player_user_id: str,
        payload: RegistrationCreateRequest,
        photo_bytes: Optional[bytes] = None,
    ) -> RegistrationResponse:
        db = db_manager.db
        tourney = await TournamentService.get_tournament_by_id_or_slug(tournament_id)

        # 1. Verify tournament is PUBLISHED
        if tourney.get("status") != TournamentStatus.PUBLISHED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration is not available. Tournament is not published.",
            )

        # 2. Check registration deadline
        now = datetime.now(timezone.utc)
        deadline = tourney["registration_deadline"]
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)

        if now > deadline:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration for this tournament has closed.",
            )

        # 3. Prevent duplicate registration
        existing = await db.tournament_registrations.find_one({
            "tournament_id": tourney["_id"],
            "player_id": ObjectId(player_user_id),
        })
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You are already registered for this tournament.",
            )

        # 4. Generate unique serial number sequence per tournament (01, 02, 03...)
        count = await db.tournament_registrations.count_documents({"tournament_id": tourney["_id"]})
        serial_number = count + 1
        serial_str = f"{serial_number:02d}"

        sport_name = tourney.get("sport", "VOLLEYBALL")
        sport_code = str(sport_name)[:2].upper()
        reg_number = f"{sport_code}-{now.year}-{serial_number:04d}"

        # Extract village and role from payload or custom field values
        village = (
            payload.village
            or payload.custom_field_values.get("village")
            or payload.custom_field_values.get("place")
            or "KOKARNE"
        )
        role = (
            payload.role
            or payload.custom_field_values.get("role")
            or payload.custom_field_values.get("position")
            or "BLOCKER"
        )

        # 5. Handle Player Photo (base64 or direct bytes)
        photo_raw = photo_bytes
        if not photo_raw and payload.player_photo_base64:
            try:
                base64_data = payload.player_photo_base64.split(",")[-1]
                photo_raw = base64.b64decode(base64_data)
            except Exception:
                photo_raw = None

        photo_url = ""
        if photo_raw:
            clean_name = re.sub(r"[^a-zA-Z0-9_-]", "_", payload.player_name)
            photo_url = await UploadService.upload_image_to_storage(
                photo_raw,
                folder=f"sportbid/players/{tourney['slug']}",
                public_id=f"player_{tourney['slug']}_{serial_str}_{clean_name}",
            )

        # 6. Save Initial Registration Record
        reg_doc = {
            "tournament_id": tourney["_id"],
            "player_id": ObjectId(player_user_id),
            "registration_number": reg_number,
            "serial_number": serial_number,
            "serial_str": serial_str,
            "village": village,
            "role": role,
            "player_name": payload.player_name,
            "player_phone": payload.player_phone,
            "player_photo_url": photo_url,
            "custom_field_values": payload.custom_field_values,
            "status": RegistrationStatus.PENDING.value,
            "rejection_reason": None,
            "poster_url": None,
            "poster_status": PosterStatus.RENDERING.value,
            "reviewed_by": None,
            "reviewed_at": None,
            "created_at": now,
            "updated_at": now,
        }
        res = await db.tournament_registrations.insert_one(reg_doc)
        reg_doc["_id"] = res.inserted_id

        # 7. Render Poster with Deterministic Python Pillow Engine
        try:
            poster_bytes = PosterEngine.generate_player_poster(
                tournament_title=tourney.get("title", "SPORTBID TOURNAMENT"),
                player_name=payload.player_name,
                serial_str=serial_str,
                village=village,
                role=role,
                phone=payload.player_phone,
                sport=str(sport_name),
                player_image_bytes=photo_raw,
            )

            clean_pname = re.sub(r"[^a-zA-Z0-9_-]", "_", payload.player_name)
            poster_url = await UploadService.upload_image_to_storage(
                poster_bytes,
                folder=f"sportbid/posters/{tourney['slug']}",
                public_id=f"poster_{tourney['slug']}_{serial_str}_{clean_pname}",
                extension="png",
            )

            await db.tournament_registrations.update_one(
                {"_id": res.inserted_id},
                {
                    "$set": {
                        "poster_url": poster_url,
                        "poster_status": PosterStatus.COMPLETED.value,
                        "updated_at": datetime.now(timezone.utc),
                    }
                },
            )
            reg_doc["poster_url"] = poster_url
            reg_doc["poster_status"] = PosterStatus.COMPLETED.value
            logger.info(f"Rendered poster successfully for {payload.player_name}: {poster_url}")
        except Exception as e:
            logger.error(f"Error rendering poster: {e}", exc_info=True)
            await db.tournament_registrations.update_one(
                {"_id": res.inserted_id},
                {"$set": {"poster_status": PosterStatus.FAILED.value}},
            )
            reg_doc["poster_status"] = PosterStatus.FAILED.value

        return doc_to_registration_response(reg_doc)

    @staticmethod
    async def review_registration(
        tournament_id: str,
        registration_id: str,
        organizer_id: str,
        is_super_admin: bool,
        payload: RegistrationReviewRequest,
    ) -> RegistrationResponse:
        db = db_manager.db
        tourney = await TournamentService.get_tournament_by_id_or_slug(tournament_id)

        # Enforce Ownership Check
        if str(tourney["organizer_id"]) != organizer_id and not is_super_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not own this tournament.",
            )

        reg_doc = await db.tournament_registrations.find_one({"_id": ObjectId(registration_id)})
        if not reg_doc:
            raise HTTPException(status_code=404, detail="Registration not found.")

        now = datetime.now(timezone.utc)
        updates = {
            "status": payload.status.value,
            "rejection_reason": payload.rejection_reason if payload.status == RegistrationStatus.REJECTED else None,
            "reviewed_by": organizer_id,
            "reviewed_at": now,
            "updated_at": now,
        }

        await db.tournament_registrations.update_one({"_id": ObjectId(registration_id)}, {"$set": updates})
        updated = await db.tournament_registrations.find_one({"_id": ObjectId(registration_id)})
        return doc_to_registration_response(updated)

    @staticmethod
    async def get_tournament_posters_zip(tournament_id: str) -> io.BytesIO:
        db = db_manager.db
        tourney = await TournamentService.get_tournament_by_id_or_slug(tournament_id)
        cursor = db.tournament_registrations.find({"tournament_id": tourney["_id"]}).sort("serial_number", 1)
        regs = await cursor.to_list(length=500)

        import zipfile
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for r in regs:
                serial_s = r.get("serial_str") or f"{r.get('serial_number', 1):02d}"
                p_name = r.get("player_name", "player").strip()
                clean_name = re.sub(r"[^a-zA-Z0-9_-]", "_", p_name)
                filename = f"{serial_s}_{clean_name}_poster.png"

                # Check if poster_url exists or generate directly on the fly
                p_bytes = None
                p_url = r.get("poster_url")
                if p_url and "/api/v1/storage/" in p_url:
                    local_path = p_url.replace("/api/v1/storage/", f"{settings.POSTER_OUTPUT_DIR}/")
                    if os.path.exists(local_path):
                        try:
                            with open(local_path, "rb") as f:
                                p_bytes = f.read()
                        except Exception:
                            pass

                if not p_bytes:
                    p_bytes = PosterEngine.generate_player_poster(
                        tournament_title=tourney.get("title", "SPORTBID TOURNAMENT"),
                        player_name=r["player_name"],
                        serial_str=serial_s,
                        village=r.get("village", ""),
                        role=r.get("role", "Athlete"),
                        phone=r.get("player_phone", ""),
                        sport=str(tourney.get("sport", "VOLLEYBALL")),
                    )

                zip_file.writestr(filename, p_bytes)

        zip_buffer.seek(0)
        return zip_buffer

