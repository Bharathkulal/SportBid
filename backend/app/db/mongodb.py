from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
from app.core.logging import logger


class MongoDBManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

    async def connect_to_database(self) -> None:
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI.split('@')[-1]}...")
        try:
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
                maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
                serverSelectionTimeoutMS=3000,
            )
            self.db = self.client[settings.MONGODB_DB_NAME]
            # Verify connectivity (non-blocking attempt)
            await self.client.admin.command("ping")
            logger.info(f"Successfully connected to MongoDB database: {settings.MONGODB_DB_NAME}")
        except Exception as e:
            logger.warning(
                f"Could not connect to MongoDB server ({e}). Running in offline/disconnected database mode."
            )

    async def close_database_connection(self) -> None:
        if self.client:
            logger.info("Closing MongoDB connection...")
            self.client.close()
            logger.info("MongoDB connection closed.")

    async def ping(self) -> bool:
        if not self.client:
            return False
        try:
            await self.client.admin.command("ping")
            return True
        except Exception:
            return False


db_manager = MongoDBManager()


def get_database() -> Optional[AsyncIOMotorDatabase]:
    return db_manager.db
