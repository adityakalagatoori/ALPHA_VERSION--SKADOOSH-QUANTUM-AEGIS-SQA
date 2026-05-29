from fastapi.responses import JSONResponse
from fastapi import Request
from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.responses import Response

from services.tigress_service import analyze_request
from core.security_event_bus import emit_security_event

import hashlib
import json
import numpy as np


def serialize_numpy(obj):
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: serialize_numpy(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [serialize_numpy(item) for item in obj]
    return obj


SAFE_PATHS = {
    "/",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/metrics",
    "/events/recent",
    "/health",
    "/ws/security-feed",
    "/agents/register",
    "/v2/agents/register",
    "/v2/agents/keypairs/generate",
    "/access/request",
    "/access/approve",
}

SAFE_PREFIXES = (
    "/terminal/",
    "/ws/",
    "/docs",
    "/redoc",
    "/admin",
)


class TigressSecurityMiddleware:
    """
    Pure ASGI middleware — avoids BaseHTTPMiddleware body-consumption bug.
    Reads body once, passes it downstream untouched via a rebuilt receive callable.
    """

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        method = scope.get("method", "GET")

        if method in ("GET", "HEAD", "OPTIONS"):
            await self.app(scope, receive, send)
            return

        # Always read + buffer the body so downstream always gets receive_with_body.
        # This is necessary because an outer BaseHTTPMiddleware (if present) wraps
        # the receive callable in a way that breaks pass-through for safe paths.
        body = b""
        more_body = True
        while more_body:
            message = await receive()
            body += message.get("body", b"")
            more_body = message.get("more_body", False)

        # Skip TIGRESS analysis for safe paths — just replay body
        if path in SAFE_PATHS or any(path.startswith(p) for p in SAFE_PREFIXES):
            body_sent = False

            async def receive_safe():
                nonlocal body_sent
                if not body_sent:
                    body_sent = True
                    return {"type": "http.request", "body": body, "more_body": False}
                return {"type": "http.disconnect"}

            await self.app(scope, receive_safe, send)
            return

        # Parse payload for TIGRESS analysis
        payload = {}
        try:
            if body:
                payload = json.loads(body.decode("utf-8", errors="ignore"))
        except Exception:
            payload = {}

        # Rebuild receive so downstream handler gets the body
        body_sent = False

        async def receive_with_body():
            nonlocal body_sent
            if not body_sent:
                body_sent = True
                return {"type": "http.request", "body": body, "more_body": False}
            # After body is consumed, block (standard ASGI behaviour)
            return {"type": "http.disconnect"}

        # Agent + session IDs for TIGRESS
        headers = dict(scope.get("headers", []))
        agent_id = headers.get(b"x-agent-id", b"UNKNOWN_AGENT").decode("utf-8", errors="ignore")
        session_id = hashlib.sha256((agent_id + path).encode()).hexdigest()

        # Run TIGRESS analysis
        try:
            analysis = await analyze_request(
                session_id=session_id,
                agent_id=agent_id,
                payload=payload,
            )
        except Exception as tigress_error:
            print(f"\n[TIGRESS FAILURE] {tigress_error}")
            # Fail open — let request through rather than blocking everything
            await self.app(scope, receive_with_body, send)
            return

        # Block if TIGRESS flagged it
        if analysis.get("blocked"):
            try:
                await emit_security_event(
                    event_type="REQUEST_BLOCKED",
                    severity="CRITICAL",
                    title="Tigress Blocked Request",
                    agent_id=agent_id,
                    message="Request blocked by TIGRESS",
                    metadata={"analysis": analysis},
                )
            except Exception:
                pass

            response_content = serialize_numpy({
                "status": "BLOCKED",
                "security_layer": "TIGRESS",
                "risk_score": analysis.get("risk_score", 0),
                "threats": analysis.get("threats", []),
                "honeypot": analysis.get("honeypot", False),
                "drift_score": analysis.get("drift_score", 0),
            })
            response = Response(
                content=json.dumps(response_content),
                status_code=403,
                media_type="application/json",
            )
            await response(scope, receive_with_body, send)
            return

        # Attach tigress state to scope for route handlers
        scope["tigress"] = analysis
        scope["honeypot"] = analysis.get("honeypot", False)

        await self.app(scope, receive_with_body, send)
