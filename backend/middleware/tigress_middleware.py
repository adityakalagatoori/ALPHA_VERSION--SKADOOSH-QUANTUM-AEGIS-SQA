from starlette.middleware.base import (
    BaseHTTPMiddleware
)

from fastapi.responses import JSONResponse

from services.tigress_service import (
    analyze_request
)

from core.security_event_bus import (
    emit_security_event
)

import hashlib
import json
import numpy as np


def serialize_numpy(obj):
    """Convert numpy types to Python native types for JSON serialization."""
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


class TigressSecurityMiddleware(
    BaseHTTPMiddleware
):

    async def dispatch(
        self,
        request,
        call_next
    ):

        # =============================================
        # SAFE ROUTES
        # =============================================

        safe_paths = [

            "/",

            "/docs",

            "/redoc",

            "/openapi.json",

            "/metrics",

            "/events/recent",

            "/health",

            "/ws/security-feed",

            "/agents/register"
        ]

        if request.url.path in safe_paths:

            return await call_next(
                request
            )

        # =============================================
        # READ REQUEST BODY
        # =============================================

        payload = {}

        try:

            body = await request.body()

            if body:

                payload = json.loads(
                    body.decode(
                        "utf-8",
                        errors="ignore"
                    )
                )

        except Exception:

            payload = {}

        # =============================================
        # AGENT ID
        # =============================================

        agent_id = request.headers.get(
            "x-agent-id",
            "UNKNOWN_AGENT"
        )

        # =============================================
        # SESSION ID
        # =============================================

        session_seed = (

            agent_id +

            request.url.path
        )

        session_id = hashlib.sha256(

            session_seed.encode()

        ).hexdigest()

        # =============================================
        # ANALYZE
        # =============================================

        try:

            analysis = await analyze_request(

                session_id=
                    session_id,

                agent_id=
                    agent_id,

                payload=
                    payload
            )

        except Exception as tigress_error:

            print("\n[TIGRESS FAILURE]")
            print(tigress_error)

            await emit_security_event(

                event_type=
                    "TIGRESS_FAILURE",

                severity=
                    "CRITICAL",

                title=
                    "Tigress Failure",

                agent_id=
                    agent_id,

                message=
                    str(tigress_error)
            )

            return JSONResponse(
                status_code=503,
                content={
                    "status": "BLOCKED",
                    "reason": "TIGRESS_FAIL_CLOSED",
                    "details": str(tigress_error)
                }
            )

        # =============================================
        # BLOCK REQUEST
        # =============================================

        if analysis["blocked"]:

            await emit_security_event(

                event_type=
                    "REQUEST_BLOCKED",

                severity=
                    "CRITICAL",

                title=
                    "Tigress Blocked Request",

                agent_id=
                    agent_id,

                message=
                    "Request blocked by TIGRESS",

                metadata={
                    "analysis":
                        analysis
                }
            )

            response_content = serialize_numpy({
                "status": "BLOCKED",
                "security_layer": "TIGRESS",
                "risk_score": analysis["risk_score"],
                "threats": analysis["threats"],
                "honeypot": analysis["honeypot"],
                "drift_score": analysis["drift_score"]
            })

            return JSONResponse(
                status_code=403,
                content=response_content
            )

        # =============================================
        # ATTACH STATE
        # =============================================

        request.state.tigress = analysis

        request.state.honeypot = analysis[
            "honeypot"
        ]

        # =============================================
        # ALLOWED EVENT (suppressed for development)
        # =============================================

        # Only emit if risk_score is elevated
        if analysis["risk_score"] > 50:
            await emit_security_event(

                event_type=
                    "REQUEST_ALLOWED",

                severity=
                    "LOW",

                title=
                    "Request Allowed",

                agent_id=
                    agent_id,

                message=
                    "Tigress allowed request",

                    metadata={

                        "risk_score":
                            analysis[
                                "risk_score"
                            ]
                    }
            )

        # =============================================
        # CONTINUE
        # =============================================

        response = await call_next(
            request
        )

        return response