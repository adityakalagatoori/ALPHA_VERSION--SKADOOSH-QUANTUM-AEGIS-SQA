from fastapi import APIRouter
from datetime import datetime

from services.trust_score_service import (
    get_all_trust_scores,
    get_high_risk_agents
)

from services.finance_signature_service import (
    get_all_financial_requests
)

from po.po_bft import (
    get_all_bft_requests
)

from core.security_event_bus import (
    get_recent_events,
    get_metrics_snapshot
)

from services.audit_chain_service import (

    verify_chain_entry,

    verify_full_chain,

    get_full_chain,

    tamper_log
)


router = APIRouter(
    prefix="/po/dashboard",
    tags=["PO Dashboard"]
)


# =========================================================
# P8 - LIVE COMMAND DASHBOARD
# =========================================================

@router.get("/live")

async def live_dashboard():

    trust_scores = await get_all_trust_scores()

    high_risk_agents = await get_high_risk_agents()

    financial_requests = (
        await get_all_financial_requests()
    )

    bft_requests = (
        await get_all_bft_requests()
    )

    metrics = get_metrics_snapshot()

    recent_events = get_recent_events()

    return {

        "dragon_warrior":
            "ACTIVE",

        "timestamp":
            datetime.utcnow().isoformat(),

        "metrics":
            metrics,

        "agents": {

            "total_agents":
                len(trust_scores),

            "high_risk_agents":
                len(high_risk_agents),

            "agents":
                [
                    agent if isinstance(agent, dict) else agent.model_dump()
                    for agent in trust_scores
                ]
        },

        "finance": {

            "total_requests":
                len(financial_requests),

            "transactions":
                financial_requests
        },

        "bft": {

            "active_consensus":
                len(bft_requests),

            "requests":
                bft_requests
        },

        "events":
            recent_events[-25:]
    }


# =========================================================
# P9 - SECTOR FILTERING
# =========================================================

@router.get("/sector/{sector}")

async def sector_dashboard(
    sector: str
):

    trust_scores = await get_all_trust_scores()

    sector_agents = []

    for agent in trust_scores:

        agent_sector = agent.get('sector') if isinstance(agent, dict) else agent.sector.value

        if (
            str(agent_sector).lower()
            ==
            sector.lower()
        ):

            sector_agents.append(
                agent if isinstance(agent, dict) else agent.model_dump()
            )

    return {

        "sector":
            sector,

        "total_agents":
            len(sector_agents),

        "agents":
            sector_agents,

        "timestamp":
            datetime.utcnow().isoformat()
    }


# =========================================================
# P10 - VERIFY SINGLE AUDIT LOG
# =========================================================

@router.get("/verify-chain/{log_id}")

async def verify_chain(
    log_id: str
):

    return await verify_chain_entry(
        log_id
    )


# =========================================================
# P10 - VERIFY ENTIRE AUDIT CHAIN
# =========================================================

@router.get("/verify-full-chain")

async def verify_full_audit_chain():

    return await verify_full_chain()


# =========================================================
# P10 - VIEW FULL AUDIT CHAIN
# =========================================================

@router.get("/audit-chain")

async def audit_chain():

    return await get_full_chain()


# =========================================================
# P10 - FORCE TAMPER DEMO
# =========================================================

@router.post("/tamper/{log_id}")

async def tamper_demo(
    log_id: str
):

    return await tamper_log(
        log_id
    )


# =========================================================
# P11 - LIVE RISK GRAPH
# =========================================================

@router.get("/risk/live")

async def live_risk_scores():

    trust_scores = await get_all_trust_scores()

    risk_feed = []

    for agent in trust_scores:

        if isinstance(agent, dict):
            risk_feed.append({
                "agent_id": agent.get('agent_id'),
                "risk_score": agent.get('risk_score'),
                "trust_score": agent.get('trust_score'),
                "timestamp": agent.get('last_updated', datetime.utcnow().isoformat())
            })
        else:
            risk_feed.append({
                "agent_id": agent.agent_id,
                "risk_score": agent.risk_score,
                "trust_score": agent.trust_score,
                "timestamp": agent.last_updated.isoformat()
            })

    return {

        "risk_feed":
            risk_feed,

        "updated_at":
            datetime.utcnow().isoformat()
    }


# =========================================================
# HONEYPOT PANEL
# =========================================================

@router.get("/honeypot")

async def honeypot_panel():

    recent_events = get_recent_events()

    honeypot_events = []

    for event in recent_events:

        event_type = event.get(
            "event_type",
            ""
        ).lower()

        if (
            "honeypot" in event_type
            or
            "redirect" in event_type
        ):

            honeypot_events.append(event)

    return {

        "honeypot_status":
            "ACTIVE",

        "events":
            honeypot_events[-25:]
    }


# =========================================================
# LIVE PIPELINE VISUALIZATION
# =========================================================

@router.get("/pipeline/live")

async def pipeline_visualization():

    recent_events = get_recent_events()

    pipeline_events = []

    for event in recent_events:

        if (
            event.get("event_type")
            ==
            "po_pipeline_step"
        ):

            pipeline_events.append(event)

    return {

        "pipeline":
            pipeline_events[-50:]
    }


# =========================================================
# LIVE ALERT FEED
# =========================================================

@router.get("/alerts/live")

async def live_alert_feed():

    recent_events = get_recent_events()

    alerts = []

    for event in recent_events:

        severity = str(
            event.get(
                "severity",
                ""
            )
        ).upper()

        if severity in [

            "HIGH",
            "CRITICAL"
        ]:

            alerts.append(event)

    return {

        "alerts":
            alerts[-50:]
    }


# =========================================================
# SECURITY OVERVIEW
# =========================================================

@router.get("/overview")

async def security_overview():

    metrics = get_metrics_snapshot()

    trust_scores = await get_all_trust_scores()

    high_risk_agents = await get_high_risk_agents()

    return {

        "system":
            "SQA Dragon Warrior",

        "status":
            "OPERATIONAL",

        "total_agents":
            len(trust_scores),

        "high_risk_agents":
            len(high_risk_agents),

        "security_metrics":
            metrics,

        "features": {

            "P1":
                "ACTIVE",

            "P2":
                "ACTIVE",

            "P3":
                "ACTIVE",

            "P4":
                "ACTIVE",

            "P5":
                "ACTIVE",

            "P6":
                "ACTIVE",

            "P7":
                "ACTIVE",

            "P8":
                "ACTIVE",

            "P9":
                "ACTIVE",

            "P10":
                "ACTIVE",

            "P11":
                "ACTIVE"
        }
    }