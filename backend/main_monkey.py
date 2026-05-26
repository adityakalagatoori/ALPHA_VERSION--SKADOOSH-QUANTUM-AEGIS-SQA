from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect
from contextlib import asynccontextmanager

# =========================================================
# MINIMAL SECURITY EVENT BUS
# =========================================================

class SimpleEventManager:
    def __init__(self):
        self.active_connections = []

    async def connect(self, websocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

security_event_manager = SimpleEventManager()

# =========================================================
# LIFESPAN
# =========================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n===================================")
    print(" 🐒 MONKEY TEST SERVER ONLINE ")
    print("===================================")
    print("[M1] Kyber-1024 Keypair Generation")
    print("[M2] Quantum Entropy CSPRNG")
    print("[M3] Signature Verification Gate")
    print("[M4] Key Blacklisting")
    print("[M5] Replay-Sealed Payloads")
    print("[M6] Secure Enclave Shield")
    print("[M7] Oogway's Signal (WebSocket Alerts)")
    print("===================================\n")
    yield
    print("\n===================================")
    print(" 🐒 MONKEY SERVER SHUTDOWN ")
    print("===================================\n")

# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="SQA MONKEY Test Server",
    version="1.0.0",
    lifespan=lifespan
)

# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# WEBSOCKET ALERT FEED
# =========================================================

@app.websocket("/ws/security-feed")
async def websocket_endpoint(websocket: WebSocket):
    await security_event_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        security_event_manager.disconnect(websocket)

# =========================================================
# CORE MONKEY ROUTES
# =========================================================

from routes.agents import router as agents_router
from routes.revoke import router as revoke_router
from routes.secure import router as secure_router
from routes.alerts import router as alerts_router

app.include_router(agents_router)
app.include_router(revoke_router)
app.include_router(secure_router)
app.include_router(alerts_router)

# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
async def health():
    return {
        "status": "ONLINE",
        "server": "MONKEY_TEST",
        "features": ["M1", "M2", "M3", "M4", "M5", "M6", "M7"],
        "websocket_clients": len(security_event_manager.active_connections)
    }

@app.get("/")
async def root():
    return {
        "system": "SQA MONKEY",
        "status": "ONLINE",
        "features": {
            "M1": "Kyber-1024 Keypair Generation",
            "M2": "Quantum Entropy CSPRNG",
            "M3": "Dilithium Signature Verification",
            "M4": "Key Blacklisting",
            "M5": "Replay Attack Detection",
            "M6": "Secure Enclave Shield",
            "M7": "Real-time Alert Broadcasting"
        }
    }
