from fastapi import (
    APIRouter,
    HTTPException
)

from services.audit_service import (

    get_full_audit_chain,

    get_audit_chain_status,

    get_merkle_checkpoints,

    tamper_audit_entry,

    verify_audit_chain
)

router = APIRouter(
    prefix="/snake",
    tags=["SNAKE"]
)

# =========================================================
# S1 S2 S3: FULL AUDIT CHAIN (S7 WIRED)
# =========================================================

@router.get("/audit-chain")
async def audit_chain():
    """S7: Returns real audit chain from memory + Supabase for frontend."""
    chain = get_full_audit_chain()

    return {
        "status": "SNAKE_ACTIVE",
        "count": len(chain),
        "entries": chain[-20:] if len(chain) > 20 else chain
    }

# =========================================================
# S4: CHAIN VERIFICATION (TAMPER CHECK)
# =========================================================

@router.get("/verify-chain")
async def verify_chain():
    """S4: Returns chain integrity status."""
    result = verify_audit_chain()
    return result

# =========================================================
# S4: CHAIN STATUS + TAMPER ALERT (S7 WIRED)
# =========================================================

@router.get("/chain-status")
async def chain_status():
    """S7: Returns full chain status with tamper flag for frontend."""
    status = get_audit_chain_status()
    return {
        "snake_status": status.get("snake_status"),
        "chain_valid": status.get("chain_valid"),
        "total_entries": status.get("total_entries"),
        "tampered": not status.get("chain_valid"),
        "latest_entry": status.get("latest_entry"),
        "latest_merkle_root": status.get("latest_merkle_root"),
        "verification": status.get("verification")
    }

# Legacy alias for compatibility
@router.get("/status")
async def status_legacy():
    return get_audit_chain_status()

# =========================================================
# S6: MERKLE CHECKPOINTS (S7 WIRED)
# =========================================================

@router.get("/checkpoints")
async def checkpoints():
    """S6: Returns last 10 Merkle checkpoints for frontend timeline."""
    checkpoint_list = get_merkle_checkpoints()
    return {
        "count": len(checkpoint_list),
        "checkpoints": checkpoint_list[-10:] if len(checkpoint_list) > 10 else checkpoint_list
    }

# =========================================================
# S6: LATEST MERKLE ROOT (S7 WIRED)
# =========================================================

@router.get("/merkle-root")
async def merkle_root():
    """S6/S7: Returns latest Merkle root for frontend Sacred Peach Tree."""
    checkpoint_list = get_merkle_checkpoints()

    if not checkpoint_list:
        return {
            "status": "NO_CHECKPOINTS",
            "merkle_root": None
        }

    latest = checkpoint_list[-1]
    return {
        "status": "ACTIVE",
        "merkle_root": latest.get("merkle_root"),
        "chain_length": latest.get("total_entries"),
        "timestamp": latest.get("timestamp")
    }

# =========================================================
# S4 TAMPER DEMO
# =========================================================

@router.post("/tamper-demo/{chain_index}")
async def tamper_demo(
    chain_index: int
):

    result = tamper_audit_entry(
        chain_index
    )

    return result