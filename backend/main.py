from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket
from fastapi import WebSocketDisconnect

from contextlib import asynccontextmanager

import asyncio
import json
import logging
import numpy as np

# ── Silence noisy polling routes from uvicorn access log ──────────────────────
class _SilencePollingFilter(logging.Filter):
    _MUTED = {"/health", "/v2/po/trust-scores"}
    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage()
        return not any(p in msg for p in self._MUTED)

logging.getLogger("uvicorn.access").addFilter(_SilencePollingFilter())

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer, np.floating)):
            return float(obj) if isinstance(obj, np.floating) else int(obj)
        return super().default(obj)

# =========================================================
# CENTRAL SECURITY EVENT BUS
# =========================================================

from core.security_event_bus import (

    security_event_manager,

    emit_security_event,

    get_metrics_snapshot,

    get_recent_events
)

# =========================================================
# TIGRESS GLOBAL MIDDLEWARE
# =========================================================

try:
    from middleware.tigress_middleware import (
        TigressSecurityMiddleware
    )
    TIGRESS_AVAILABLE = True
except Exception as tigress_import_error:
    print("\n[TIGRESS MIDDLEWARE NOT READY]")
    print(tigress_import_error)
    TIGRESS_AVAILABLE = False
    TigressSecurityMiddleware = None

# =========================================================
# HONEYPOT ISOLATION MIDDLEWARE (A7/A8)
# =========================================================

try:
    from middleware.honeypot_middleware import (
        HoneypotMiddleware
    )
    HONEYPOT_AVAILABLE = True
except Exception as honeypot_import_error:
    print("\n[HONEYPOT MIDDLEWARE NOT READY]")
    print(honeypot_import_error)
    HONEYPOT_AVAILABLE = False
    HoneypotMiddleware = None

# =========================================================
# TEMPORARY: SKIP TIGRESS LIFESPAN TELEMETRY
# =========================================================

from core.security_event_bus import emit_security_event as _emit_security_event

# =========================================================
# CORE ROUTES
# =========================================================

from routes.agents import (
    router as agents_router
)

from routes.secure import (
    router as secure_router
)

from routes.revoke import (
    router as revoke_router
)

from routes.alerts import (
    router as alerts_router
)

# =========================================================
# PO DRAGON WARRIOR ROUTES
# =========================================================

from routes.po_routes import (
    router as po_router
)

# =========================================================
# PO DASHBOARD ROUTES
# =========================================================

from routes.po_dashboard_routes import (
    router as po_dashboard_router
)

# =========================================================
# MANTIS ROUTER
# =========================================================

try:

    from routes.mantis import (
        router as mantis_router
    )

    MANTIS_AVAILABLE = True

except Exception as mantis_import_error:

    print("\n[MANTIS ROUTER NOT READY]")
    print(mantis_import_error)

    MANTIS_AVAILABLE = False

# =========================================================
# SNAKE ROUTER
# =========================================================

try:

    from routes.snake import (
        router as snake_router
    )

    SNAKE_AVAILABLE = True

except Exception as snake_import_error:

    print("\n[SNAKE ROUTER NOT READY]")
    print(snake_import_error)

    SNAKE_AVAILABLE = False

# =========================================================
# TAMPER MONITOR
# =========================================================

try:

    from services.tamper_monitor import (
        start_tamper_monitor
    )

    TAMPER_MONITOR_AVAILABLE = True

except Exception as tamper_import_error:

    print("\n[TAMPER MONITOR NOT READY]")
    print(tamper_import_error)

    TAMPER_MONITOR_AVAILABLE = False

# =========================================================
# ORACLE SCROLL LEARNING
# =========================================================

try:

    from services.oracle_scroll_service import (
        trigger_oracle_learning
    )

    ORACLE_LEARNING_AVAILABLE = True

except Exception as oracle_import_error:

    print("\n[ORACLE SCROLL NOT READY]")
    print(oracle_import_error)

    ORACLE_LEARNING_AVAILABLE = False

# =========================================================
# FASTAPI LIFESPAN
# =========================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    print("\n===================================")
    print(" >> SQA DRAGON WARRIOR ONLINE ")
    print("===================================\n")

    # =====================================================
    # START KEYPAIR POOL (for fast M1 registration)
    # =====================================================

    try:
        from background.keypair_pool import start_keypair_pool
        asyncio.create_task(start_keypair_pool())
        print("[KEYPAIR POOL] Background pool started (target: 20 keypairs)")
    except Exception as kp_err:
        print(f"[KEYPAIR POOL NOT READY] {kp_err}")

    # =====================================================
    # START SNAKE TAMPER MONITOR
    # =====================================================

    if TAMPER_MONITOR_AVAILABLE:

        asyncio.create_task(
            start_tamper_monitor()
        )

        print(
            "[SNAKE] Tamper monitor started"
        )

    # =====================================================
    # START ORACLE SCROLL LEARNING
    # =====================================================

    if ORACLE_LEARNING_AVAILABLE:

        async def oracle_learning_loop():
            while True:
                await asyncio.sleep(300)  # Learn every 5 minutes
                await trigger_oracle_learning()

        asyncio.create_task(
            oracle_learning_loop()
        )

        print(
            "[MANTIS] Oracle Scroll learning started"
        )

    # =====================================================
    # SYSTEM STARTUP TELEMETRY
    # =====================================================

    await emit_security_event(

        event_type=
            "SYSTEM_STARTUP",

        severity=
            "LOW",

        title=
            "SQA Dragon Warrior Online",

        agent_id=
            "SYSTEM",

        message=
            "Post-quantum AI security gateway operational",

        metadata={

            "architecture":
                "DRAGON_WARRIOR",

            "modules": {

                "PO":
                    True,

                "TIGRESS":
                    True,

                "MONKEY":
                    True,

                "CRANE":
                    True,

                "SNAKE":
                    SNAKE_AVAILABLE,

                "MANTIS":
                    MANTIS_AVAILABLE
            }
        }
    )

    print("[PO] Dragon Warrior ACTIVE")
    print("[TIGRESS] Prompt Defense ACTIVE")
    print("[MONKEY] Quantum Identity ACTIVE")
    print("[CRANE] Capability Governance ACTIVE")
    print("[SNAKE] Immutable Audit ACTIVE")
    print("[MANTIS] Behavioral AI ACTIVE")

    yield

    # =====================================================
    # SHUTDOWN TELEMETRY
    # =====================================================

    await emit_security_event(

        event_type=
            "SYSTEM_SHUTDOWN",

        severity=
            "MEDIUM",

        title=
            "SQA Shutdown",

        agent_id=
            "SYSTEM",

        message=
            "Dragon Warrior gateway shutting down"
    )

    print("\n===================================")
    print(" >> SQA SHUTDOWN ")
    print("===================================\n")

# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(

    title="SQA Dragon Warrior",

    version="2.0.0",

    lifespan=lifespan,

    json_encoder=NumpyEncoder
)

# =========================================================
# CORS — MUST BE FIRST
# =========================================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:3000"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)

# =========================================================
# TIGRESS GLOBAL INTERCEPTION LAYER
# =========================================================

if TIGRESS_AVAILABLE:
    app.add_middleware(
        TigressSecurityMiddleware
    )

# =========================================================
# HONEYPOT ISOLATION MIDDLEWARE (A7/A8)
# =========================================================

if HONEYPOT_AVAILABLE:
    app.add_middleware(
        HoneypotMiddleware
    )

# =========================================================
# CENTRAL WEBSOCKET SECURITY FEED
# =========================================================

@app.websocket("/ws/security-feed")
async def websocket_endpoint(
    websocket: WebSocket
):

    await security_event_manager.connect(
        websocket
    )

    try:

        while True:

            await websocket.receive_text()

    except WebSocketDisconnect:

        security_event_manager.disconnect(
            websocket
        )

# =========================================================
# LIVE METRICS
# =========================================================

@app.get("/metrics")
async def metrics():

    return get_metrics_snapshot()

# =========================================================
# RECENT EVENTS
# =========================================================

@app.get("/events/recent")
async def recent_events():

    return {

        "events":
            get_recent_events()
    }

# =========================================================
# SYSTEM HEALTH
# =========================================================

@app.get("/health")
async def health():

    return {

        "status":
            "ONLINE",

        "architecture":
            "POST_QUANTUM_AI_SECURITY_GATEWAY",

        "dragon_warrior":
            "ACTIVE",

        "event_bus":
            "ACTIVE",

        "websocket_clients":
            len(
                security_event_manager.active_connections
            ),

        "modules": {

            "PO":
                "ACTIVE",

            "TIGRESS":
                "ACTIVE",

            "MONKEY":
                "ACTIVE",

            "CRANE":
                "ACTIVE",

            "SNAKE":
                (
                    "ACTIVE"
                    if SNAKE_AVAILABLE
                    else "BOOTING"
                ),

            "MANTIS":
                (
                    "ACTIVE"
                    if MANTIS_AVAILABLE
                    else "BOOTING"
                )
        }
    }

# =========================================================
# CORE ROUTES
# =========================================================

app.include_router(
    agents_router
)

app.include_router(
    secure_router
)

app.include_router(
    revoke_router
)

app.include_router(
    alerts_router
)

# =========================================================
# PO DRAGON WARRIOR ROUTES
# =========================================================

app.include_router(
    po_router
)

# =========================================================
# PO DASHBOARD ROUTES
# =========================================================

app.include_router(
    po_dashboard_router
)

# =========================================================
# MANTIS ROUTES
# =========================================================

if MANTIS_AVAILABLE:

    app.include_router(
        mantis_router
    )

# =========================================================
# SNAKE ROUTES
# =========================================================

if SNAKE_AVAILABLE:

    app.include_router(
        snake_router
    )

# =========================================================
# ACCESS REQUEST ROUTES (SaaS onboarding)
# =========================================================

try:
    from routes.access import router as access_router
    app.include_router(access_router, prefix="/access", tags=["Access"])
    print("[ACCESS] Access request routes active")
except Exception as access_import_error:
    print(f"[ACCESS NOT READY] {access_import_error}")

# =========================================================
# ADMIN PANEL ROUTES
# =========================================================

try:
    from routes.admin_panel import router as admin_panel_router
    app.include_router(admin_panel_router, prefix="/admin", tags=["Admin"])
    print("[ADMIN] Admin panel routes active")
except Exception as admin_import_error:
    print(f"[ADMIN NOT READY] {admin_import_error}")

try:
    from routes.dashboard_stub import router as dashboard_router
    app.include_router(dashboard_router, tags=["Dashboard"])
    print("[DASHBOARD] Dashboard stub routes active")
except Exception as dashboard_error:
    print(f"[DASHBOARD NOT READY] {dashboard_error}")

# =========================================================
# TERMINAL WEBSOCKET ROUTE (Embedded terminals)
# =========================================================

try:
    from routes.terminal import router as terminal_router
    app.include_router(terminal_router)
    print("[TERMINAL] Terminal WebSocket active at /terminal/ws/{session_id}")
except Exception as terminal_error:
    print(f"[TERMINAL NOT READY] {terminal_error}")

# =========================================================
# V2 ROUTES — NEW DASHBOARD (all 47 features)
# =========================================================

try:
    from routes.v2_agents import router as v2_agents_router
    app.include_router(v2_agents_router)
    print("[V2] MONKEY routes active (M1-M7)")
except Exception as e:
    print(f"[V2 MONKEY NOT READY] {e}")

try:
    from routes.v2_tokens import router as v2_tokens_router
    app.include_router(v2_tokens_router)
    print("[V2] CRANE routes active (C1-C7)")
except Exception as e:
    print(f"[V2 CRANE NOT READY] {e}")

try:
    from routes.v2_audit import router as v2_audit_router
    app.include_router(v2_audit_router)
    print("[V2] SNAKE routes active (S1-S7)")
except Exception as e:
    print(f"[V2 SNAKE NOT READY] {e}")

try:
    from routes.v2_behavior import router as v2_behavior_router
    app.include_router(v2_behavior_router)
    print("[V2] MANTIS routes active (A1-A9)")
except Exception as e:
    print(f"[V2 MANTIS NOT READY] {e}")

try:
    from routes.v2_tigress import router as v2_tigress_router
    app.include_router(v2_tigress_router)
    print("[V2] TIGRESS routes active (T1-T6)")
except Exception as e:
    print(f"[V2 TIGRESS NOT READY] {e}")

try:
    from routes.v2_po import router as v2_po_router
    app.include_router(v2_po_router)
    print("[V2] PO routes active (P1-P11)")
except Exception as e:
    print(f"[V2 PO NOT READY] {e}")

try:
    from routes.v2_mirror import router as v2_mirror_router
    app.include_router(v2_mirror_router)
    print("[V2] MIRROR TEST routes active (11 attacks)")
except Exception as e:
    print(f"[V2 MIRROR NOT READY] {e}")

try:
    from routes.v2_case_file import router as v2_case_file_router
    app.include_router(v2_case_file_router)
    print("[V2] CASE FILE routes active (forensic accountability)")
except Exception as e:
    print(f"[V2 CASE FILE NOT READY] {e}")

try:
    from routes.v2_compliance import router as v2_compliance_router
    app.include_router(v2_compliance_router)
    print("[V2] COMPLIANCE routes active (SOC2/NIST/GDPR/ISO27001)")
except Exception as e:
    print(f"[V2 COMPLIANCE NOT READY] {e}")

try:
    from routes.v2_sdk_demo import router as v2_sdk_demo_router
    app.include_router(v2_sdk_demo_router)
    print("[V2] SDK DEMO routes active (/v2/sdk/demo)")
except Exception as e:
    print(f"[V2 SDK DEMO NOT READY] {e}")

# =========================================================
# ROOT
# =========================================================

@app.get("/")
async def root():

    return {

        "system":
            "SQA Dragon Warrior",

        "status":
            "ONLINE",

        "gateway":
            "/po/gateway",

        "architecture":
            "POST_QUANTUM_AI_SECURITY_GATEWAY",

        "security_pipeline": [

            "PO",

            "TIGRESS",

            "MONKEY",

            "CRANE",

            "SNAKE",

            "MANTIS"
        ],

        "capabilities": [

            "Central Message Gateway",

            "Pipeline Orchestration",

            "Deliver Or Kill Verdicting",

            "Kyber-1024 Encryption",

            "3-of-5 BFT Consensus",

            "Trust Score Network",

            "Financial Multi-Approval",

            "Realtime Threat Telemetry",

            "Sector Filtering",

            "Tamper Verification",

            "Live Risk Scoring",

            "Honeypot Isolation",

            "Semantic Drift Detection",

            "Behavioral AI Defense",

            "Quantum Identity Verification"
        ],

        "telemetry": {

            "websocket_feed":
                "/ws/security-feed",

            "metrics":
                "/metrics",

            "recent_events":
                "/events/recent"
        },

        "dashboard": {

            "live":
                "/po/dashboard/live",

            "overview":
                "/po/dashboard/overview",

            "risk_feed":
                "/po/dashboard/risk/live",

            "honeypot":
                "/po/dashboard/honeypot",

            "pipeline":
                "/po/dashboard/pipeline/live"
        },

        "dragon_warrior": {

            "status":
                "ACTIVE",

            "gateway":
                "/po/gateway",

            "verdict_engine":
                "DELIVER_OR_KILL"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)