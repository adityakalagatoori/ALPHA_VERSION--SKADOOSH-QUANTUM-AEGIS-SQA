from datetime import datetime
from typing import Dict, Any
import numpy as np

from po.po_models import (
    AgentTrustScore,
    RiskLevel
)

from core.security_event_bus import emit_security_event

# =========================================================
# NUMPY TYPE CONVERTER
# =========================================================

def convert_numpy_types(obj: Any, _depth: int = 0) -> Any:
    """Convert numpy types to Python native types (no infinite recursion)."""
    if _depth > 10:  # Prevent infinite recursion
        return obj

    if isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, dict):
        return {k: convert_numpy_types(v, _depth+1) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [convert_numpy_types(item, _depth+1) for item in obj]
    elif hasattr(obj, 'dict') and callable(obj.dict):  # Pydantic model
        return convert_numpy_types(obj.dict(), _depth+1)
    return obj


# =========================================================
# IN-MEMORY TRUST STORE
# =========================================================
# Replace with TimescaleDB later
# Current structure is production-safe for transition
# =========================================================

TRUST_SCORE_STORE: Dict[str, AgentTrustScore] = {}


# =========================================================
# GET OR CREATE AGENT SCORE
# =========================================================

async def get_agent_trust_score(
    agent_id: str
):

    if agent_id not in TRUST_SCORE_STORE:

        TRUST_SCORE_STORE[agent_id] = AgentTrustScore(
            agent_id=agent_id,
            trust_score=100.0,
            risk_score=0.0,
            anomaly_count=0,
            blocked_requests=0,
            successful_requests=0,
            honeypot_redirects=0
        )

    score = TRUST_SCORE_STORE[agent_id]
    return convert_numpy_types(score.dict() if hasattr(score, 'dict') else score)


# =========================================================
# UPDATE TRUST SCORE
# =========================================================

async def update_trust_score(
    agent_id: str,
    risk_score: float,
    success: bool,
    honeypot: bool = False,
    anomaly: bool = False
):

    if agent_id not in TRUST_SCORE_STORE:
        TRUST_SCORE_STORE[agent_id] = AgentTrustScore(
            agent_id=agent_id,
            trust_score=100.0,
            risk_score=0.0,
            anomaly_count=0,
            blocked_requests=0,
            successful_requests=0,
            honeypot_redirects=0
        )

    agent = TRUST_SCORE_STORE[agent_id]

    # =====================================================
    # SUCCESSFUL REQUEST
    # =====================================================

    if success:

        agent.successful_requests += 1

        reward = calculate_reward(risk_score)

        agent.trust_score = min(
            100.0,
            agent.trust_score + reward
        )

    # =====================================================
    # FAILED REQUEST
    # =====================================================

    else:

        agent.blocked_requests += 1

        penalty = calculate_penalty(risk_score)

        agent.trust_score = max(
            0.0,
            agent.trust_score - penalty
        )

    # =====================================================
    # ANOMALY PENALTY
    # =====================================================

    if anomaly:

        agent.anomaly_count += 1

        agent.trust_score = max(
            0.0,
            agent.trust_score - 5
        )

    # =====================================================
    # HONEYPOT PENALTY
    # =====================================================

    if honeypot:

        agent.honeypot_redirects += 1

        agent.trust_score = max(
            0.0,
            agent.trust_score - 20
        )

    # =====================================================
    # UPDATE RISK SCORE
    # =====================================================

    agent.risk_score = risk_score

    agent.last_updated = datetime.utcnow()

    # =====================================================
    # STORE UPDATED OBJECT
    # =====================================================

    TRUST_SCORE_STORE[agent_id] = agent

    # =====================================================
    # EMIT TELEMETRY
    # =====================================================

    await emit_security_event({
        "event_type": "po_trust_score_updated",
        "agent_id": agent_id,
        "trust_score": agent.trust_score,
        "risk_score": risk_score,
        "successful_requests": agent.successful_requests,
        "blocked_requests": agent.blocked_requests,
        "anomaly_count": agent.anomaly_count,
        "honeypot_redirects": agent.honeypot_redirects,
        "timestamp": datetime.utcnow().isoformat()
    })

    return agent


# =========================================================
# TRUST SCORE REWARD
# =========================================================

def calculate_reward(
    risk_score: float
):

    if risk_score <= 5:
        return 2

    if risk_score <= 20:
        return 1

    return 0.5


# =========================================================
# TRUST SCORE PENALTY
# =========================================================

def calculate_penalty(
    risk_score: float
):

    if risk_score >= 95:
        return 40

    if risk_score >= 85:
        return 30

    if risk_score >= 70:
        return 20

    if risk_score >= 50:
        return 10

    return 5


# =========================================================
# GET ALL TRUST SCORES
# =========================================================

async def get_all_trust_scores():

    scores = list(TRUST_SCORE_STORE.values())
    return [convert_numpy_types(score.dict() if hasattr(score, 'dict') else score) for score in scores]


# =========================================================
# GET TOP TRUSTED AGENTS
# =========================================================

async def get_top_trusted_agents(
    limit: int = 10
):

    agents = list(TRUST_SCORE_STORE.values())

    agents.sort(
        key=lambda x: x.trust_score,
        reverse=True
    )

    return [convert_numpy_types(a.dict() if hasattr(a, 'dict') else a) for a in agents[:limit]]


# =========================================================
# GET HIGH RISK AGENTS
# =========================================================

async def get_high_risk_agents():

    agents = list(TRUST_SCORE_STORE.values())

    high_risk = [agent for agent in agents if agent.risk_score >= 70]
    return [convert_numpy_types(a.dict() if hasattr(a, 'dict') else a) for a in high_risk]


# =========================================================
# RESET AGENT TRUST SCORE
# =========================================================

async def reset_agent_trust_score(
    agent_id: str
):

    TRUST_SCORE_STORE[agent_id] = AgentTrustScore(
        agent_id=agent_id
    )

    await emit_security_event({
        "event_type": "po_trust_score_reset",
        "agent_id": agent_id,
        "timestamp": datetime.utcnow().isoformat()
    })

    return TRUST_SCORE_STORE[agent_id]


# =========================================================
# FORCE TRUST PENALTY
# =========================================================

async def force_penalty(
    agent_id: str,
    amount: float,
    reason: str
):

    if agent_id not in TRUST_SCORE_STORE:
        TRUST_SCORE_STORE[agent_id] = AgentTrustScore(
            agent_id=agent_id,
            trust_score=100.0,
            risk_score=0.0,
            anomaly_count=0,
            blocked_requests=0,
            successful_requests=0,
            honeypot_redirects=0
        )

    agent = TRUST_SCORE_STORE[agent_id]

    agent.trust_score = max(
        0.0,
        agent.trust_score - amount
    )

    agent.last_updated = datetime.utcnow()

    await emit_security_event({
        "event_type": "po_manual_penalty",
        "agent_id": agent_id,
        "penalty": amount,
        "reason": reason,
        "new_trust_score": agent.trust_score,
        "timestamp": datetime.utcnow().isoformat()
    })

    return agent


# =========================================================
# FORCE TRUST REWARD
# =========================================================

async def force_reward(
    agent_id: str,
    amount: float,
    reason: str
):

    if agent_id not in TRUST_SCORE_STORE:
        TRUST_SCORE_STORE[agent_id] = AgentTrustScore(
            agent_id=agent_id,
            trust_score=100.0,
            risk_score=0.0,
            anomaly_count=0,
            blocked_requests=0,
            successful_requests=0,
            honeypot_redirects=0
        )

    agent = TRUST_SCORE_STORE[agent_id]

    agent.trust_score = min(
        100.0,
        agent.trust_score + amount
    )

    agent.last_updated = datetime.utcnow()

    await emit_security_event({
        "event_type": "po_manual_reward",
        "agent_id": agent_id,
        "reward": amount,
        "reason": reason,
        "new_trust_score": agent.trust_score,
        "timestamp": datetime.utcnow().isoformat()
    })

    return agent


# =========================================================
# TRUST LEVEL
# =========================================================

def get_trust_level(
    trust_score: float
):

    if trust_score >= 90:
        return "TRUSTED"

    if trust_score >= 70:
        return "STABLE"

    if trust_score >= 50:
        return "WATCHLIST"

    if trust_score >= 25:
        return "DANGEROUS"

    return "CRITICAL"


# =========================================================
# RISK LEVEL
# =========================================================

def get_risk_level(
    risk_score: float
):

    if risk_score >= 90:
        return RiskLevel.CRITICAL

    if risk_score >= 70:
        return RiskLevel.HIGH

    if risk_score >= 40:
        return RiskLevel.MEDIUM

    return RiskLevel.LOW