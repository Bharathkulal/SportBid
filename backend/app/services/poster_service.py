import os
import io
import math
import zipfile
import cloudinary
import cloudinary.uploader
from PIL import Image, ImageDraw, ImageFont, ImageOps
from app.core.config import settings
from app.core.logging import logger
from app.models.tournament import SportType


def configure_cloudinary():
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY:
        try:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True,
            )
        except Exception as e:
            logger.warning(f"Cloudinary config warning: {e}")


configure_cloudinary()


def get_font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    """Helper to load system TrueType fonts on Windows or fallback gracefully."""
    font_paths = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/impact.ttf",
        "C:/Windows/Fonts/tahomabd.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    try:
        return ImageFont.load_default()
    except Exception:
        return None


class PosterEngine:
    """
    Deterministic Python Pillow Image Pipeline.
    Renders 16:9 Widescreen (1920x1080 px) professional sports auction slides
    matching the volleyball auction slide layout:
    - Dark navy / black background (#080c14)
    - Bright yellow borders (#ffd700 / #facc15) and bold yellow typography
    - Large player photograph on the left inside a rounded rectangular frame
    - Player name at the top right
    - Serial number prominently displayed (e.g. 01, 02)
    - Village / place
    - Playing role (e.g. Blocker, Setter, Attacker)
    - Phone number
    - Tournament name centered in the bottom footer
    """

    WIDTH = 1920
    HEIGHT = 1080

    @classmethod
    def generate_player_poster(
        cls,
        tournament_title: str,
        player_name: str,
        serial_str: str,
        village: str,
        role: str,
        phone: str,
        sport: str = "VOLLEYBALL",
        player_image_bytes: bytes = None,
    ) -> bytes:
        # 1. Canvas Base: Deep Dark Navy/Black (#070a12)
        base = Image.new("RGBA", (cls.WIDTH, cls.HEIGHT), color=(7, 10, 18, 255))
        draw = ImageDraw.Draw(base)

        # 2. Subtle Background Textures & Corner Accents
        YELLOW = (250, 204, 21, 255)       # #facc15 vibrant yellow
        GOLD = (234, 179, 8, 255)          # #eab308 deep gold
        WHITE = (255, 255, 255, 255)
        MUTED_YELLOW = (254, 240, 138, 255)
        DARK_CARD = (17, 24, 39, 230)      # #111827
        BORDER_GRAY = (30, 41, 59, 255)

        # Subtle dark court texture lines (abstract volleyball net/court vibes)
        for offset in range(0, cls.WIDTH, 120):
            draw.line([(offset, 0), (offset + 200, cls.HEIGHT)], fill=(12, 17, 29, 255), width=1)

        # 3. Outer Double Yellow Frame
        # Outer thick border
        draw.rounded_rectangle(
            [(30, 30), (cls.WIDTH - 30, cls.HEIGHT - 30)],
            radius=20,
            outline=YELLOW,
            width=6,
        )
        # Inner fine border
        draw.rounded_rectangle(
            [(42, 42), (cls.WIDTH - 42, cls.HEIGHT - 42)],
            radius=14,
            outline=(161, 98, 7, 180),  # subtle gold stroke
            width=2,
        )

        # Corner Tech Brackets (High-impact broadcast aesthetic)
        bracket_len = 50
        # Top-Left
        draw.line([(30, 30 + bracket_len), (30, 30), (30 + bracket_len, 30)], fill=WHITE, width=8)
        # Top-Right
        draw.line([(cls.WIDTH - 30 - bracket_len, 30), (cls.WIDTH - 30, 30), (cls.WIDTH - 30, 30 + bracket_len)], fill=WHITE, width=8)
        # Bottom-Left
        draw.line([(30, cls.HEIGHT - 30 - bracket_len), (30, cls.HEIGHT - 30), (30 + bracket_len, cls.HEIGHT - 30)], fill=WHITE, width=8)
        # Bottom-Right
        draw.line([(cls.WIDTH - 30 - bracket_len, cls.HEIGHT - 30), (cls.WIDTH - 30, cls.HEIGHT - 30), (cls.WIDTH - 30, cls.HEIGHT - 30 - bracket_len)], fill=WHITE, width=8)

        # 4. LEFT SIDE: Large Player Photograph Frame
        photo_x0, photo_y0 = 70, 70
        photo_w, photo_h = 700, 870
        photo_x1, photo_y1 = photo_x0 + photo_w, photo_y0 + photo_h

        # Photo Container Background
        draw.rounded_rectangle([(photo_x0, photo_y0), (photo_x1, photo_y1)], radius=18, fill=(15, 23, 42, 255), outline=YELLOW, width=6)

        if player_image_bytes:
            try:
                pimg = Image.open(io.BytesIO(player_image_bytes)).convert("RGBA")
                # Fit image neatly inside photo box
                fitted_w, fitted_h = photo_w - 12, photo_h - 12
                pimg_fitted = ImageOps.fit(pimg, (fitted_w, fitted_h), centering=(0.5, 0.25))

                # Create mask for rounded corners
                mask = Image.new("L", (fitted_w, fitted_h), 0)
                mask_draw = ImageDraw.Draw(mask)
                mask_draw.rounded_rectangle([(0, 0), (fitted_w, fitted_h)], radius=14, fill=255)

                base.paste(pimg_fitted, (photo_x0 + 6, photo_y0 + 6), mask)

                # Re-draw the crisp yellow photo border on top
                draw.rounded_rectangle([(photo_x0, photo_y0), (photo_x1, photo_y1)], radius=18, outline=YELLOW, width=6)
            except Exception as e:
                logger.error(f"Error rendering player image: {e}")
                # Fallback avatar
                draw.text((photo_x0 + 160, photo_y0 + 400), "PLAYER PHOTOGRAPH", fill=YELLOW, font=get_font(36))
        else:
            # Fallback stylized athlete avatar
            center_x = photo_x0 + photo_w // 2
            center_y = photo_y0 + photo_h // 2 - 40
            draw.ellipse([(center_x - 120, center_y - 120), (center_x + 120, center_y + 120)], fill=(30, 41, 59, 255), outline=YELLOW, width=4)
            draw.text((center_x - 85, center_y - 30), "ATHLETE", fill=WHITE, font=get_font(40))
            draw.text((photo_x0 + 190, photo_y0 + 620), "OFFICIAL REGISTRATION", fill=YELLOW, font=get_font(26))

        # Sport Badge Pill atop photo
        sport_text = f"{sport.upper()} PLAYER"
        draw.rounded_rectangle([(photo_x0 + 30, photo_y0 + 24), (photo_x0 + 320, photo_y0 + 68)], radius=10, fill=(7, 10, 18, 220), outline=YELLOW, width=2)
        draw.text((photo_x0 + 50, photo_y0 + 34), sport_text, fill=YELLOW, font=get_font(20))

        # 5. RIGHT SIDE: Player & Auction Specifications
        right_x = 830
        right_max_x = cls.WIDTH - 80

        font_name = get_font(68)
        font_label = get_font(24)
        font_value = get_font(46)
        font_serial_label = get_font(26)
        font_serial_num = get_font(100)

        # 5.1 PLAYER NAME
        name_clean = (player_name or "ATHLETE").strip().upper()
        # Ensure name fits nicely
        if len(name_clean) > 22:
            font_name = get_font(52)
        draw.text((right_x, 90), name_clean, fill=YELLOW, font=font_name)

        # Decorative Yellow Divider Under Name
        draw.line([(right_x, 185), (right_max_x, 185)], fill=YELLOW, width=4)

        # 5.2 SERIAL NUMBER (Prominently Displayed)
        y_cursor = 215
        draw.text((right_x, y_cursor), "SERIAL NUMBER", fill=YELLOW, font=font_label)

        # Serial Number Box / Gold Badge
        serial_display = serial_str if serial_str else "01"
        badge_w, badge_h = 240, 120
        badge_x0 = right_x
        badge_y0 = y_cursor + 38
        draw.rounded_rectangle(
            [(badge_x0, badge_y0), (badge_x0 + badge_w, badge_y0 + badge_h)],
            radius=16,
            fill=(24, 24, 27, 255),
            outline=YELLOW,
            width=5,
        )
        # Center the serial number text inside badge
        draw.text((badge_x0 + 45, badge_y0 + 5), serial_display, fill=WHITE, font=font_serial_num)

        # 5.3 VILLAGE / PLACE
        y_cursor = 405
        draw.text((right_x, y_cursor), "VILLAGE", fill=YELLOW, font=font_label)
        village_clean = (village or "NOT SPECIFIED").strip().upper()
        draw.text((right_x, y_cursor + 38), village_clean, fill=WHITE, font=font_value)

        # 5.4 PLAYING ROLE
        y_cursor = 550
        draw.text((right_x, y_cursor), "ROLE", fill=YELLOW, font=font_label)
        role_clean = (role or "ALL ROUNDER").strip().upper()
        draw.text((right_x, y_cursor + 38), role_clean, fill=WHITE, font=font_value)

        # 5.5 PHONE NUMBER
        y_cursor = 695
        draw.text((right_x, y_cursor), "PHONE", fill=YELLOW, font=font_label)
        phone_clean = (phone or "+91 XXXXXXXXXX").strip()
        draw.text((right_x, y_cursor + 38), phone_clean, fill=WHITE, font=font_value)

        # 6. BOTTOM FOOTER
        # Yellow separator line
        footer_y = 960
        draw.line([(70, footer_y), (cls.WIDTH - 70, footer_y)], fill=YELLOW, width=4)

        # Footer Text Centered
        # e.g.: "CHANDIKAMBA TROPHY 2026 • VOLLEYBALL PLAYER AUCTION"
        footer_text = f"{tournament_title.strip().upper()}   •   {sport.strip().upper()} PLAYER AUCTION"
        font_footer = get_font(32)

        # Calculate bounding box for centering
        bbox = draw.textbbox((0, 0), footer_text, font=font_footer)
        text_w = bbox[2] - bbox[0]
        footer_x = (cls.WIDTH - text_w) // 2

        # Draw centered footer text
        draw.text((footer_x, footer_y + 24), footer_text, fill=YELLOW, font=font_footer)

        # 7. Output High-Resolution PNG
        output_io = io.BytesIO()
        base.save(output_io, format="PNG", quality=95)
        return output_io.getvalue()


class UploadService:
    @staticmethod
    async def upload_image_to_storage(
        image_bytes: bytes,
        folder: str = "sportbid/posters",
        public_id: str = None,
        extension: str = "png",
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
                    format=extension,
                )
                url = upload_res.get("secure_url")
                if url:
                    return url
            except Exception as e:
                logger.error(f"Cloudinary upload error ({e}). Using local storage.")

        # Local storage fallback
        storage_dir = os.path.join(settings.POSTER_OUTPUT_DIR, folder.replace("/", "_"))
        os.makedirs(storage_dir, exist_ok=True)
        filename = f"{public_id or 'poster'}.{extension}"
        file_path = os.path.join(storage_dir, filename)
        with open(file_path, "wb") as f:
            f.write(image_bytes)

        return f"/api/v1/storage/{folder.replace('/', '_')}/{filename}"
