from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.websocket import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/board")
async def websocket_board(websocket: WebSocket, project: str = "default"):
    await manager.connect(websocket, project)
    try:
        while True:
            # Keep connection alive, handle client messages if needed
            data = await websocket.receive_text()
            # Echo back as acknowledgment
            await websocket.send_text(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket, project)
