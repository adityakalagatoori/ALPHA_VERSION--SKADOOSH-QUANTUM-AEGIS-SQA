from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime

from services.mantis_service import (
    register_agent_baseline,
    process_agent_action,
    get_agent_baseline,
    get_honeypot_events,
    get_oracle_predictions
)

try:
    from middleware.honeypot_middleware import (
        get_honeypot_status,
        get_all_honeypot_agents,
        remove_from_honeypot
    )
    HONEYPOT_AVAILABLE = True
except Exception as e:
    print(f"[MANTIS ROUTES] Honeypot not available: {e}")
    HONEYPOT_AVAILABLE = False

router = APIRouter(
    prefix="/mantis",
    tags=["MANTIS"]
)

# =========================================================
# REQUEST MODELS
# =========================================================

class AgentRegistrationRequest(BaseModel):

    agent_id: str
    sector: str
    role: str = "agent"
    capabilities: list[str]


class AgentActionRequest(BaseModel):

    agent_id: str
    action: str
    endpoint: str
    payload_size: int
    response_time: float
    metadata: Dict[str, Any] = {}

# =========================================================
# A1 + A2
# REGISTER AGENT BASELINE
# =========================================================

@router.post("/register-agent")
async def register_agent(
    request: AgentRegistrationRequest
):

    result = await register_agent_baseline(
        agent_id=request.agent_id,
        sector=request.sector,
        role=request.role,
        capabilities=request.capabilities
    )

    return result

# =========================================================
# A3
# REALTIME ACTION SCORING
# =========================================================

@router.post("/action")
async def score_action(
    request: AgentActionRequest
):

    result = await process_agent_action(
        agent_id=request.agent_id,
        action=request.action,
        endpoint=request.endpoint,
        payload_size=request.payload_size,
        response_time=request.response_time,
        metadata=request.metadata
    )

    return result

# =========================================================
# BASELINE VIEW
# =========================================================

@router.get("/baseline/{agent_id}")
async def baseline(
    agent_id: str
):

    return await get_agent_baseline(
        agent_id
    )

# =========================================================
# A8
# HONEYPOT EVENTS
# =========================================================

@router.get("/honeypot")
async def honeypot():

    return await get_honeypot_events()

# =========================================================
# A9
# ORACLE SCROLL
# =========================================================

@router.get("/oracle")
async def oracle():

    return await get_oracle_predictions()

# =========================================================
# A7/A8: HONEYPOT MANAGEMENT
# =========================================================

@router.get("/honeypot/agents")
async def honeypot_agents():
    """Get all isolated agents in honeypot."""
    if not HONEYPOT_AVAILABLE:
        return {"error": "Honeypot not available"}
    return {
        "isolated_agents": get_all_honeypot_agents(),
        "count": len(get_all_honeypot_agents())
    }

@router.get("/honeypot/status/{agent_id}")
async def honeypot_status(agent_id: str):
    """Get honeypot status for specific agent."""
    if not HONEYPOT_AVAILABLE:
        return {"error": "Honeypot not available"}
    return get_honeypot_status(agent_id)

@router.delete("/honeypot/release/{agent_id}")
async def release_from_honeypot(agent_id: str):
    """Release agent from honeypot isolation."""
    if not HONEYPOT_AVAILABLE:
        return {"error": "Honeypot not available"}

    status = get_honeypot_status(agent_id)
    if not status:
        return {"error": "Agent not in honeypot"}

    remove_from_honeypot(agent_id)
    return {
        "status": "released",
        "agent_id": agent_id,
        "was_isolated": status
    }