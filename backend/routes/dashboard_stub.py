"""
Stub endpoints for dashboard - provides mock data for frontend
"""

from fastapi import APIRouter

router = APIRouter()

# =========================================================
# DASHBOARD STUBS
# =========================================================

@router.get("/po/dashboard/live")
async def dashboard_live():
    return {
        "metrics": {
            "total_requests": 1247,
            "blocked_requests": 12,
            "mantis_high_risk": 3,
            "bft_approvals": 45
        },
        "status": "online",
        "agents_active": 12,
        "threats_detected": 3,
        "risk_level": "MEDIUM"
    }

@router.get("/po/dashboard/overview")
async def dashboard_overview():
    return {
        "total_agents": 15,
        "online_agents": 12,
        "alerts_today": 8,
        "avg_response_time_ms": 145
    }

@router.get("/po/dashboard/risk/live")
async def dashboard_risk_live():
    return {
        "high_risk": 2,
        "medium_risk": 5,
        "low_risk": 8,
        "trend": "stable"
    }

@router.get("/po/dashboard/honeypot")
async def dashboard_honeypot():
    return {
        "active_traps": 5,
        "triggered_24h": 3,
        "captured_agents": 2,
        "success_rate": 87.5
    }

@router.get("/po/dashboard/audit-chain")
async def dashboard_audit_chain():
    return {
        "chain_length": 1024,
        "last_checkpoint": "2026-05-25T17:30:00Z",
        "integrity_verified": True,
        "merkle_root": "sha3:abc123..."
    }

@router.get("/po/dashboard/pipeline/live")
async def dashboard_pipeline_live():
    return {
        "pipeline_status": "ACTIVE",
        "throughput": 450,
        "latency_ms": 125,
        "success_rate": 99.8
    }

# =========================================================
# PO GATEWAY ENDPOINTS
# =========================================================

@router.get("/po/bft/all")
async def po_bft_all():
    return {
        "bft_consensus": "3-of-5",
        "nodes": 5,
        "synced": 5,
        "status": "ACTIVE"
    }

@router.get("/po/finance/all")
async def po_finance_all():
    return {
        "transactions_pending": 0,
        "transactions_approved": 145,
        "total_volume": 125000.50,
        "status": "OPERATIONAL"
    }

@router.get("/po/trust/all")
async def po_trust_all():
    return {
        "agents": [
            {"id": "agent_1", "trust_score": 95},
            {"id": "agent_2", "trust_score": 87},
            {"id": "agent_3", "trust_score": 72}
        ],
        "avg_trust": 84.7
    }

@router.get("/po/hft/all")
async def po_hft_all():
    return {
        "hft_enabled": True,
        "active_strategies": 3,
        "latency_threshold_ms": 50,
        "status": "OPERATIONAL"
    }

# =========================================================
# SNAKE AUDIT ENDPOINTS
# =========================================================

@router.get("/snake/chain-status")
async def snake_chain_status():
    return {
        "chain_integrity": "VERIFIED",
        "chain_length": 2048,
        "last_block_hash": "sha3:block_2048",
        "tamper_detected": False
    }

@router.get("/snake/checkpoints")
async def snake_checkpoints():
    return {
        "checkpoints": [
            {
                "index": 2000,
                "merkle_root": "sha3:checkpoint_2000",
                "timestamp": "2026-05-25T17:00:00Z"
            },
            {
                "index": 1500,
                "merkle_root": "sha3:checkpoint_1500",
                "timestamp": "2026-05-25T16:00:00Z"
            }
        ],
        "total_checkpoints": 127
    }

@router.get("/snake/merkle-root")
async def snake_merkle_root():
    return {
        "merkle_root": "sha3:abc123def456",
        "chain_length": 2048,
        "verified": True
    }
