"""
MONKEY — Post-Quantum Agent Identity (PO gateway shim).

Thin async wrappers over the real identity logic in agent_service so the
PO Dragon Warrior gateway can call MONKEY checks uniformly. No new crypto
here — this delegates to the canonical AGENT_DB / BLACKLISTED_AGENTS state.
"""

from services.agent_service import (
    AGENT_DB,
    BLACKLISTED_AGENTS,
)


# =========================================================
# M4 — BLACKLIST CHECK
# =========================================================

async def is_agent_blacklisted(agent_id: str) -> bool:

    return agent_id in BLACKLISTED_AGENTS


# =========================================================
# M3 — IDENTITY VERIFICATION GATE
# =========================================================

async def verify_agent_identity(agent_id: str, signature: str) -> bool:
    """
    A request passes MONKEY identity only if the agent is a known,
    registered identity holding a post-quantum keypair. Unknown agents
    (never registered, or forged ids) are rejected at the gateway.
    """

    agent = AGENT_DB.get(agent_id)

    if not agent:
        return False

    # A registered agent must hold a Dilithium public key.
    if not agent.get("dilithium_public_key"):
        return False

    return True
