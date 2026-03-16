import json
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    """Manages WebSocket connections grouped by api_key project."""

    def __init__(self) -> None:
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, project: str) -> None:
        await websocket.accept()
        if project not in self.active_connections:
            self.active_connections[project] = []
        self.active_connections[project].append(websocket)

    def disconnect(self, websocket: WebSocket, project: str) -> None:
        if project in self.active_connections:
            self.active_connections[project].remove(websocket)
            if not self.active_connections[project]:
                del self.active_connections[project]

    async def broadcast(self, project: str, message: dict[str, Any]) -> None:
        if project in self.active_connections:
            data = json.dumps(message, default=str)
            for connection in self.active_connections[project]:
                try:
                    await connection.send_text(data)
                except Exception:
                    pass


manager = ConnectionManager()
