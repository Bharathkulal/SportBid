import os
import io
import cloudinary
import cloudinary.uploader
from PIL import Image, ImageDraw, ImageFont, ImageOps
from app.core.config import settings
from app.core.logging import logger
from app.models.tournament import SportType


def configure_cloudinary():
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )


configure_cloudinary()


class PosterEngine:
    """
    Deterministic Python Pillow Image Pipeline.
    Renders 1080x1350 px (Instagram / Social Portrait Standard) matchday player posters.
    """

    WIDTH = 1080
    HEIGHT = 1350

    @classmethod
    def generate_player_poster(
        cls,
        sport: SportType,
        tournament_title: str,
        player_name: str,
        registration_no: str,
        role_or_pos: str,
        jersey_no: str = "",
        player_image_bytes: bytes = None,
    ) -> bytes:
        # Create canvas with rich sports dark gradient
        base = Image.new("RGBA", (cls.WIDTH, cls.HEIGHT), color="#090a0f")
        draw = ImageDraw.Draw(base)

        # Draw sporty dynamic angular background geometry
        accent_color = "#f97316" if sport == SportType.VOLLEYBALL else "#22c55e"
        accent_rgba = (249, 115, 22, 255) if sport == SportType.VOLLEYBALL else (34, 197, 94, 255)

        # Background sports mesh & slashes
        draw.polygon([(0, 0), (cls.WIDTH, 0), (cls.WIDTH, 380), (0, 260)], fill="#11141c")
        draw.polygon([(0, 260), (cls.WIDTH, 380), (cls.WIDTH, 420), (0, 300)], fill=accent_color)
        draw.polygon([(0, 1020), (cls.WIDTH, 960), (cls.WIDTH, cls.HEIGHT), (0, cls.HEIGHT)], fill="#11141c")
        draw.polygon([(0, 990), (cls.WIDTH, 930), (cls.WIDTH, 960), (0, 1020)], fill=accent_color)

        # Tournament Header Banner
        try:
            font_title = ImageFont.load_default()
        except Exception:
            font_title = None

        # Add Tournament Branding Bar
        draw.rectangle([(60, 50), (cls.WIDTH - 60, 180)], fill=(23, 27, 38, 240), outline=accent_color, width=3)
        draw.text((100, 75), f"OFFICIAL TOURNAMENT ROSTER", fill=accent_color)
        draw.text((100, 110), tournament_title.upper()[:42], fill="#ffffff")

        # Player Portrait Box (Center / Upper Half)
        box_x0, box_y0, box_x1, box_y1 = 180, 250, cls.WIDTH - 180, 850
        box_w, box_h = box_x1 - box_x0, box_y1 - box_y0

        if player_image_bytes:
            try:
                pimg = Image.open(io.BytesIO(player_image_bytes)).convert("RGBA")
                # Fit and crop player image to bounding box
                pimg_fitted = ImageOps.fit(pimg, (box_w, box_h), centering=(0.5, 0.3))
                base.paste(pimg_fitted, (box_x0, box_y0), pimg_fitted)
                # Outer frame for player photo
                draw.rectangle([(box_x0, box_y0), (box_x1, box_y1)], outline=accent_color, width=4)
            except Exception as e:
                logger.error(f"Error rendering player image: {e}")
                # Fallback box
                draw.rectangle([(box_x0, box_y0), (box_x1, box_y1)], fill="#1e2430", outline=accent_color, width=4)
                draw.text((box_x0 + 80, box_y0 + 260), "PLAYER PHOTO ATTACHED", fill="#94a3b8")
        else:
            # Placeholder box
            draw.rectangle([(box_x0, box_y0), (box_x1, box_y1)], fill="#1e2430", outline=accent_color, width=4)
            draw.text((box_x0 + 120, box_y0 + 260), "NO PHOTO PROVIDED", fill="#94a3b8")

        # Jersey Badge if provided
        if jersey_no:
            badge_r = 70
            bx, by = box_x1 - 40, box_y0 + 40
            draw.ellipse([(bx - badge_r, by - badge_r), (bx + badge_r, by + badge_r)], fill="#090a0f", outline=accent_color, width=4)
            draw.text((bx - 25, by - 20), f"#{jersey_no}", fill="#ffffff")

        # Registration Badge Pill
        draw.rounded_rectangle([(80, 880), (450, 940)], radius=12, fill="#1e2430", outline=accent_color, width=2)
        draw.text((105, 898), f"ID: {registration_no.upper()}", fill=accent_color)

        # Player Name Banner (Bottom Area)
        draw.text((80, 980), player_name.upper()[:28], fill="#ffffff")

        # Sport Category & Role Badge
        draw.rectangle([(80, 1060), (cls.WIDTH - 80, 1140)], fill="#171b26", outline="#334155", width=2)
        draw.text((110, 1085), f"SPORT: {sport.value}  |  ROLE: {role_or_pos.upper()[:30]}", fill="#e2e8f0")

        # Footer Watermark & Verification
        draw.text((80, 1260), "SPORTBID VERIFIED REGISTRATION", fill="#64748b")
        draw.text((cls.WIDTH - 420, 1260), "CONFIRMED & RENDERED BY SYSTEM", fill=accent_color)

        output_io = io.BytesIO()
        base.convert("RGB").save(output_io, format="JPEG", quality=92)
        return output_io.getvalue()


class UploadService:
    @staticmethod
    async def upload_image_to_storage(
        image_bytes: bytes,
        folder: str = "sportbid/posters",
        public_id: str = None,
    ) -> str:
        """Uploads image bytes to Cloudinary or falls back to local disk storage if Cloudinary not configured."""
        if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY:
            try:
                upload_res = cloudinary.uploader.upload(
                    image_bytes,
                    folder=folder,
                    public_id=public_id,
                    overwrite=True,
                    resource_type="image",
                )
                return upload_res.get("secure_url")
            except Exception as e:
                logger.error(f"Cloudinary upload failed ({e}). Falling back to local storage.")

        # Local storage fallback
        storage_dir = os.path.join(settings.POSTER_OUTPUT_DIR, folder.replace("/", "_"))
        os.makedirs(storage_dir, exist_ok=True)
        filename = f"{public_id or 'poster'}.jpg"
        file_path = os.path.join(storage_dir, filename)
        with open(file_path, "wb") as f:
            f.write(image_bytes)
        return f"/api/v1/storage/{folder.replace('/', '_')}/{filename}"
