from datetime import datetime

from po.po_models import (
    POVerdict,
    POStatus,
    WarriorModule
)

from core.security_event_bus import emit_security_event


# =========================================================
# GENERATE FINAL VERDICT
# =========================================================

async def generate_final_verdict(
    request_id: str,
    agent_id: str,
    pipeline_result: dict
):

    final_status = pipeline_result.get(
        "final_status",
        POStatus.KILLED
    )

    delivered = final_status == POStatus.DELIVERED

    verdict = POVerdict(
        request_id=request_id,
        agent_id=agent_id,
        verdict=final_status,
        delivered=delivered,
        failed_at=pipeline_result.get("failed_at"),
        reason=pipeline_result.get("reason"),
        overall_risk_score=pipeline_result.get(
            "overall_risk_score",
            0.0
        ),
        trust_score=pipeline_result.get(
            "trust_score",
            100.0
        ),
        honeypot_redirected=pipeline_result.get(
            "honeypot_redirected",
            False
        ),
        timestamp=datetime.utcnow()
    )

    # =====================================================
    # EMIT VERDICT EVENT
    # =====================================================

    await emit_security_event({
        "event_type": "po_verdict_generated",
        "request_id": request_id,
        "agent_id": agent_id,
        "verdict": verdict.verdict.value,
        "delivered": verdict.delivered,
        "risk_score": verdict.overall_risk_score,
        "trust_score": verdict.trust_score,
        "failed_at": (
            verdict.failed_at.value
            if verdict.failed_at
            else None
        ),
        "honeypot_redirected": verdict.honeypot_redirected,
        "timestamp": datetime.utcnow().isoformat()
    })

    return verdict


# =========================================================
# SIMPLE PASS VERDICT
# =========================================================

async def build_pass_verdict(
    request_id: str,
    agent_id: str,
    risk_score: float = 0.0,
    trust_score: float = 100.0
):

    return POVerdict(
        request_id=request_id,
        agent_id=agent_id,
        verdict=POStatus.DELIVERED,
        delivered=True,
        failed_at=None,
        reason=None,
        overall_risk_score=risk_score,
        trust_score=trust_score,
        honeypot_redirected=False,
        timestamp=datetime.utcnow()
    )


# =========================================================
# SIMPLE FAIL VERDICT
# =========================================================

async def build_fail_verdict(
    request_id: str,
    agent_id: str,
    failed_at: WarriorModule,
    reason: str,
    risk_score: float = 100.0,
    honeypot_redirected: bool = False,
    trust_score: float = 50.0
):

    return POVerdict(
        request_id=request_id,
        agent_id=agent_id,
        verdict=POStatus.KILLED,
        delivered=False,
        failed_at=failed_at,
        reason=reason,
        overall_risk_score=risk_score,
        trust_score=trust_score,
        honeypot_redirected=honeypot_redirected,
        timestamp=datetime.utcnow()
    )


# =========================================================
# HIGH RISK CHECK
# =========================================================

def is_high_risk(risk_score: float):

    return risk_score >= 70


# =========================================================
# CRITICAL RISK CHECK
# =========================================================

def is_critical_risk(risk_score: float):

    return risk_score >= 90


# =========================================================
# HONEYPOT CHECK
# =========================================================

def should_redirect_to_honeypot(
    risk_score: float,
    failed_module: WarriorModule = None
):

    if risk_score >= 90:
        return True

    if failed_module == WarriorModule.MANTIS:
        return True

    if failed_module == WarriorModule.TIGRESS:
        return True

    return False


# =========================================================
# TRUST SCORE PENALTY
# =========================================================

def calculate_trust_penalty(
    risk_score: float
):

    if risk_score >= 90:
        return 40

    if risk_score >= 70:
        return 20

    if risk_score >= 40:
        return 10

    return 2


# =========================================================
# TRUST SCORE REWARD
# =========================================================

def calculate_trust_reward():

    return 1
