from fastapi import WebSocket
from datetime import datetime

from typing import List
from typing import Dict
from typing import Any

import json

# =========================================================
# GLOBAL SECURITY METRICS
# =========================================================

SECURITY_METRICS = {

    "total_requests": 0,

    "blocked_requests": 0,

    "allowed_requests": 0,

    "signature_failures": 0,

    "replay_attacks": 0,

    "blacklist_blocks": 0,

    "prompt_injections": 0,

    "base64_injections": 0,

    "json_injections": 0,

    "semantic_drift_alerts": 0,

    "honeypot_routes": 0,

    "tamper_alerts": 0,

    "mantis_high_risk": 0,

    "po_verdicts": 0,

    "bft_approvals": 0,

    "finance_signatures": 0,

    "trust_updates": 0,

    "active_agents": set(),

    "live_risk_scores": {}
}

# =========================================================
# EVENT HISTORY
# =========================================================

EVENT_HISTORY: List[Dict[str, Any]] = []

MAX_HISTORY = 500

# =========================================================
# WEBSOCKET MANAGER
# =========================================================

class SecurityEventManager:

    def __init__(self):

        self.active_connections: List[
            WebSocket
        ] = []

    async def connect(
        self,
        websocket: WebSocket
    ):

        await websocket.accept()

        self.active_connections.append(
            websocket
        )

        print(
            "[SECURITY BUS] CLIENT CONNECTED"
        )

    def disconnect(
        self,
        websocket: WebSocket
    ):

        try:

            self.active_connections.remove(
                websocket
            )

            print(
                "[SECURITY BUS] CLIENT DISCONNECTED"
            )

        except Exception:

            pass

    async def broadcast(
        self,
        event: dict
    ):

        dead_connections = []

        for connection in self.active_connections:

            try:

                await connection.send_text(
                    json.dumps(
                        event,
                        default=lambda o: float(o) if hasattr(o, '__float__') else str(o)
                    )
                )

            except Exception as ws_error:

                print(
                    "[SECURITY BUS ERROR]"
                )

                print(ws_error)

                dead_connections.append(
                    connection
                )

        for dead in dead_connections:

            self.disconnect(dead)

# =========================================================
# GLOBAL WEBSOCKET MANAGER
# =========================================================

security_event_manager = SecurityEventManager()

# =========================================================
# METRIC UPDATE ENGINE
# =========================================================

def update_metrics(
    event_type: str,
    severity: str,
    metadata: dict
):

    SECURITY_METRICS[
        "total_requests"
    ] += 1

    # =====================================================
    # BLOCKED VS ALLOWED
    # =====================================================

    if severity.upper() in [
        "HIGH",
        "CRITICAL"
    ]:

        SECURITY_METRICS[
            "blocked_requests"
        ] += 1

    else:

        SECURITY_METRICS[
            "allowed_requests"
        ] += 1

    # =====================================================
    # EVENT METRICS
    # =====================================================

    metric_map = {

        "SIGNATURE_FAILURE":
            "signature_failures",

        "REPLAY_ATTACK":
            "replay_attacks",

        "BLACKLIST_TRIGGERED":
            "blacklist_blocks",

        "PROMPT_INJECTION":
            "prompt_injections",

        "BASE64_INJECTION":
            "base64_injections",

        "JSON_INJECTION":
            "json_injections",

        "SEMANTIC_DRIFT":
            "semantic_drift_alerts",

        "HONEYPOT_ROUTE":
            "honeypot_routes",

        "AUDIT_TAMPER_DETECTED":
            "tamper_alerts",

        "MANTIS_HIGH_RISK":
            "mantis_high_risk",

        "po_final_verdict":
            "po_verdicts",

        "po_validator_signed":
            "bft_approvals",

        "po_financial_approval":
            "finance_signatures",

        "po_trust_score_updated":
            "trust_updates"
    }

    metric_key = metric_map.get(
        event_type
    )

    if metric_key:

        SECURITY_METRICS[
            metric_key
        ] += 1

    # =====================================================
    # ACTIVE AGENTS
    # =====================================================

    agent_id = metadata.get(
        "agent_id"
    )

    if agent_id:

        SECURITY_METRICS[
            "active_agents"
        ].add(agent_id)

    # =====================================================
    # LIVE RISK SCORE
    # =====================================================

    if "risk_score" in metadata:

        raw = metadata["risk_score"]

        SECURITY_METRICS[
            "live_risk_scores"
        ][agent_id] = float(raw) if raw is not None else 0.0

# =========================================================
# MAIN EVENT EMITTER
# =========================================================
# SUPPORTS:
# 1. OLD STYLE
# 2. NEW PO STYLE
# =========================================================

async def emit_security_event(
    *args,
    **kwargs
):

    # =====================================================
    # NEW STYLE
    # emit_security_event({...})
    # =====================================================

    if len(args) == 1 and isinstance(args[0], dict):

        event = args[0]

        event.setdefault(
            "event_id",
            f"evt_{datetime.utcnow().timestamp()}"
        )

        event.setdefault(
            "timestamp",
            datetime.utcnow().isoformat()
        )

        event.setdefault(
            "severity",
            "LOW"
        )

        event.setdefault(
            "metadata",
            {}
        )

    # =====================================================
    # OLD STYLE
    # =====================================================

    else:

        event = {

            "event_id":
                f"{kwargs.get('event_type')}_{datetime.utcnow().timestamp()}",

            "event_type":
                kwargs.get("event_type"),

            "severity":
                kwargs.get("severity"),

            "title":
                kwargs.get("title"),

            "agent_id":
                kwargs.get("agent_id"),

            "message":
                kwargs.get("message"),

            "timestamp":
                datetime.utcnow().isoformat(),

            "metadata":
                kwargs.get("metadata", {})
        }

    # =====================================================
    # STORE EVENT
    # =====================================================

    EVENT_HISTORY.append(event)

    if len(EVENT_HISTORY) > MAX_HISTORY:

        EVENT_HISTORY.pop(0)

    # =====================================================
    # UPDATE METRICS
    # =====================================================

    update_metrics(

        event_type=
            event.get(
                "event_type",
                "UNKNOWN"
            ),

        severity=
            event.get(
                "severity",
                "LOW"
            ),

        metadata={

            **event.get(
                "metadata",
                {}
            ),

            "agent_id":
                event.get("agent_id"),

            "risk_score":
                event.get("risk_score")
        }
    )

    # =====================================================
    # CONSOLE LOG (suppress for non-critical demo events)
    # =====================================================

    # Only log CRITICAL and MEDIUM events, suppress LOW severity demo attacks
    should_log = event.get("severity") in ["CRITICAL", "MEDIUM", "HIGH"] or event.get("event_type") not in [
        "JSON_INJECTION", "PROMPT_INJECTION", "BASE64_INJECTION",
        "SEMANTIC_DRIFT", "HONEYPOT_ROUTE", "DEMO_ATTACK"
    ]

    if should_log:
        # Build a console-safe copy — strip long binary fields from nested metadata
        def _truncate(obj, depth=0):
            if depth > 3:
                return "..."
            if isinstance(obj, dict):
                return {
                    k: ("...truncated" if isinstance(v, str) and len(v) > 120 else _truncate(v, depth + 1))
                    for k, v in obj.items()
                }
            if isinstance(obj, list):
                return [_truncate(i, depth + 1) for i in obj[:5]]
            return obj

        console_event = _truncate(dict(event))
        sev = event.get("severity", "")
        etype = event.get("event_type", "")
        title = event.get("title", "")
        print(f"\n[{sev}] {etype} — {title}")
        # Only print full JSON for SYSTEM events; others just the one-liner
        if etype in ("SYSTEM_STARTUP", "SYSTEM_SHUTDOWN"):
            print(json.dumps(console_event, indent=2, default=str))

    # =====================================================
    # WEBSOCKET BROADCAST
    # =====================================================

    await security_event_manager.broadcast(
        event
    )

# =========================================================
# METRICS SNAPSHOT
# =========================================================

def get_metrics_snapshot():

    return {

        **SECURITY_METRICS,

        "active_agents":
            list(
                SECURITY_METRICS[
                    "active_agents"
                ]
            ),

        "live_risk_scores":
            {k: float(v) for k, v in SECURITY_METRICS["live_risk_scores"].items()},

        "event_history_size":
            len(EVENT_HISTORY)
    }

# =========================================================
# RECENT EVENTS
# =========================================================

def get_recent_events():

    return EVENT_HISTORY[-50:]