from typing import Dict, List, Set
from fastapi import WebSocket
from app.core.logging import logger


class AuctionConnectionManager:
    """Manages active WebSockets for real-time live bidding rooms."""

    def __init__(self):
        # Maps auction_id -> set of active WebSockets
        self.active_rooms: Dict[str, Set[WebSocket]] = {}

    async def connect(self, auction_id: str, websocket: WebSocket):
        await websocket.accept()
        if auction_id not in self.active_rooms:
            self.active_rooms[auction_id] = set()
        self.active_rooms[auction_id].add(websocket)
        logger.info(f"WebSocket client connected to auction room: {auction_id}")

    def disconnect(self, auction_id: str, websocket: WebSocket):
        if auction_id in self.active_rooms:
            self.active_rooms[auction_id].discard(websocket)
            if not self.active_rooms[auction_id]:
                del self.active_rooms[auction_id]
        logger.info(f"WebSocket client disconnected from auction room: {auction_id}")

    async def broadcast(self, auction_id: str, message: dict):
        if auction_id in self.active_rooms:
            dead_sockets = set()
            for connection in self.active_rooms[auction_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_sockets.add(connection)
            for dead in dead_sockets:
                self.active_rooms[auction_id].discard(dead)


auction_ws_manager = AuctionConnectionManager()
