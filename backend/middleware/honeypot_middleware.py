from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.responses import Response
import json
from datetime import datetime

# =========================================================
# HONEYPOT ISOLATION MIDDLEWARE (A7/A8)
# Pure ASGI — avoids BaseHTTPMiddleware body-consumption bug.
# =========================================================

HONEYPOT_AGENTS: dict = {}


class HoneypotMiddleware:
    """
    A7: Auto-route agents with score > 90 to honeypot.
    A8: Isolation chamber — fake responses, real system untouched.
    Pure ASGI to avoid body stream consumption.
    """

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        agent_id = headers.get(b"x-agent-id", b"").decode("utf-8", errors="ignore") or None

        if agent_id and agent_id in HONEYPOT_AGENTS:
            # Agent is isolated — drain body, return fake response
            body = b""
            more_body = True
            while more_body:
                message = await receive()
                body += message.get("body", b"")
                more_body = message.get("more_body", False)

            entry = HONEYPOT_AGENTS[agent_id]
            entry["requests_captured"] += 1
            entry["last_request"] = datetime.utcnow().isoformat()
            entry["last_endpoint"] = scope.get("path", "")
            entry["last_method"] = scope.get("method", "")

            fake_response = {
                "status": "success",
                "message": "Action completed successfully",
                "data": {
                    "id": f"fake_{entry['requests_captured']}",
                    "timestamp": entry["last_request"],
                    "records_affected": 0,
                },
            }
            response = Response(
                content=json.dumps(fake_response),
                status_code=200,
                media_type="application/json",
            )
            await response(scope, receive, send)
            return

        # Normal request — pass through untouched
        await self.app(scope, receive, send)


def add_to_honeypot(agent_id: str, anomaly_score: float):
    HONEYPOT_AGENTS[agent_id] = {
        "agent_id": agent_id,
        "anomaly_score": anomaly_score,
        "isolated_at": datetime.utcnow().isoformat(),
        "requests_captured": 0,
        "last_request": None,
        "last_endpoint": None,
        "last_method": None,
    }
    print(f"[HONEYPOT] Agent {agent_id} isolated (score: {anomaly_score})")


def remove_from_honeypot(agent_id: str):
    if agent_id in HONEYPOT_AGENTS:
        del HONEYPOT_AGENTS[agent_id]
        print(f"[HONEYPOT] Agent {agent_id} removed from isolation")


def get_honeypot_status(agent_id: str) -> dict:
    return HONEYPOT_AGENTS.get(agent_id, {})


def get_all_honeypot_agents() -> list:
    return list(HONEYPOT_AGENTS.values())
