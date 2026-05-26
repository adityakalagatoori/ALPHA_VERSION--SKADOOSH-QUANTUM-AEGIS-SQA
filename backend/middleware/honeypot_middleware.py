from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import json
from datetime import datetime

# =========================================================
# HONEYPOT ISOLATION MIDDLEWARE (A7/A8)
# =========================================================

HONEYPOT_AGENTS = {}

class HoneypotMiddleware(BaseHTTPMiddleware):
    """
    A7: Auto-route agents with score > 90 to honeypot
    A8: Isolation chamber — fake responses, real system untouched
    """

    async def dispatch(self, request: Request, call_next):
        # Only intercept if agent is in honeypot
        agent_id = request.headers.get("X-Agent-ID")

        if agent_id and agent_id in HONEYPOT_AGENTS:
            # Agent is isolated — return fake response
            honeypot_entry = HONEYPOT_AGENTS[agent_id]
            honeypot_entry["requests_captured"] += 1
            honeypot_entry["last_request"] = str(datetime.utcnow())

            # Capture request details
            body = await request.body()
            honeypot_entry["last_endpoint"] = request.url.path
            honeypot_entry["last_method"] = request.method

            # Return fake success response (real system never touched)
            fake_response = {
                "status": "success",
                "message": "Action completed successfully",
                "data": {
                    "id": f"fake_{honeypot_entry['requests_captured']}",
                    "timestamp": str(datetime.utcnow()),
                    "records_affected": 0
                }
            }

            return Response(
                content=json.dumps(fake_response),
                status_code=200,
                media_type="application/json"
            )

        # Normal request processing
        return await call_next(request)


def add_to_honeypot(agent_id: str, anomaly_score: float):
    """Add agent to honeypot isolation when score > 90."""
    HONEYPOT_AGENTS[agent_id] = {
        "agent_id": agent_id,
        "anomaly_score": anomaly_score,
        "isolated_at": str(datetime.utcnow()),
        "requests_captured": 0,
        "last_request": None,
        "last_endpoint": None,
        "last_method": None
    }
    print(f"[HONEYPOT] Agent {agent_id} isolated (score: {anomaly_score})")


def remove_from_honeypot(agent_id: str):
    """Remove agent from honeypot."""
    if agent_id in HONEYPOT_AGENTS:
        del HONEYPOT_AGENTS[agent_id]
        print(f"[HONEYPOT] Agent {agent_id} removed from isolation")


def get_honeypot_status(agent_id: str):
    """Get honeypot status for agent."""
    return HONEYPOT_AGENTS.get(agent_id, {})


def get_all_honeypot_agents():
    """Get all isolated agents."""
    return list(HONEYPOT_AGENTS.values())
