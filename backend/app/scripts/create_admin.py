import asyncio
import sys
import os
from datetime import datetime, timezone
from bson import ObjectId

# Ensure app is discoverable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.security import hash_password
from app.db.mongodb import db_manager
from app.models.user import UserRole, AccountStatus


async def provision_super_admin(email: str, password: str, full_name: str, phone: str):
    await db_manager.connect_to_database()
    db = db_manager.db
    if db is None:
        print("Error: Could not connect to MongoDB.")
        return

    normalized_email = email.strip().lower()
    existing = await db.users.find_one({"email": normalized_email})
    now = datetime.now(timezone.utc)

    if existing:
        print(f"Updating existing user '{normalized_email}' to SUPER_ADMIN...")
        await db.users.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "role": UserRole.SUPER_ADMIN.value,
                    "password_hash": hash_password(password),
                    "account_status": AccountStatus.ACTIVE.value,
                    "updated_at": now,
                }
            },
        )
        print(f"User '{normalized_email}' is now SUPER_ADMIN.")
    else:
        print(f"Creating new SUPER_ADMIN user '{normalized_email}'...")
        user_doc = {
            "full_name": full_name,
            "email": normalized_email,
            "phone_number": phone,
            "password_hash": hash_password(password),
            "role": UserRole.SUPER_ADMIN.value,
            "account_status": AccountStatus.ACTIVE.value,
            "created_at": now,
            "updated_at": now,
            "last_login_at": None,
        }
        res = await db.users.insert_one(user_doc)
        print(f"Super Admin provisioned with ID: {res.inserted_id}")

    await db_manager.close_database_connection()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Securely provision initial Super Administrator.")
    parser.add_argument("--email", required=True, help="Super admin email")
    parser.add_argument("--password", required=True, help="Super admin password")
    parser.add_argument("--name", default="System Administrator", help="Admin full name")
    parser.add_argument("--phone", default="+919999999999", help="Admin phone number")

    args = parser.parse_args()
    asyncio.run(provision_super_admin(args.email, args.password, args.name, args.phone))
