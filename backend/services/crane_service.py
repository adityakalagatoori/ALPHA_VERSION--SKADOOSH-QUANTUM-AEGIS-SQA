"""
CRANE — Scoped Capability Enforcement (PO gateway shim).

Wraps the canonical JWT capability logic in agent_service so the PO
gateway can ask "is this action in scope for this agent's token?" without
duplicating token verification.
"""

from services.agent_service import verify_agent_token


# =========================================================
# C2 — SCOPE VALIDATION
# =========================================================

async def validate_agent_scope(
    agent_id: str,
    action: str,
    jwt_token: str,
) -> dict:
    """
    Returns {"allowed": bool, "reason": str}. The token is verified
    (signature + blacklist) first; an invalid/expired/blacklisted token
    fails closed. Then the requested action must be inside the token's
    allowed_actions scope.
    """

    try:
        payload = verify_agent_token(jwt_token)

    except Exception as e:
        # verify_agent_token raises HTTPException for missing / invalid /
        # expired / blacklisted tokens. Treat all as scope failure.
        detail = getattr(e, "detail", str(e))
        return {"allowed": False, "reason": f"TOKEN_REJECTED: {detail}"}

    allowed_actions = payload.get("allowed_actions", [])

    if action not in allowed_actions:
        return {"allowed": False, "reason": "OUT_OF_SCOPE_ACTION"}

    return {"allowed": True, "reason": "Scope validated"}
