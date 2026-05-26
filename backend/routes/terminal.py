import os
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/terminal", tags=["Terminal"])
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

@router.websocket("/ws/{session_id}")
async def terminal_ws(websocket: WebSocket, session_id: str):
    await websocket.accept()
    current_proc = None
    try:
        while True:
            command = await websocket.receive_text()
            if not command.strip():
                continue

            current_proc = await asyncio.create_subprocess_exec(
                'powershell.exe',
                '-NoProfile',
                '-NonInteractive',
                '-Command',
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                cwd=BACKEND_DIR
            )

            while True:
                chunk = await current_proc.stdout.read(256)
                if not chunk:
                    break
                await websocket.send_text(chunk.decode('utf-8', errors='replace'))

            await current_proc.wait()
            await websocket.send_text("\r\n\x1b[32m[DONE]\x1b[0m\r\n")
    except WebSocketDisconnect:
        if current_proc and current_proc.returncode is None:
            current_proc.kill()
    except Exception as e:
        try:
            await websocket.send_text(f"\r\n\x1b[31m[ERROR] {str(e)}\x1b[0m\r\n")
        except:
            pass
