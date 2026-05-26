"""
SNAKE — Tamper-Proof Audit Chain (PO gateway shim).

Async wrapper over the synchronous chain verifier in audit_service so the
PO gateway can confirm ledger integrity as part of the pipeline.
"""

from services.audit_service import verify_audit_chain as _verify_audit_chain


# =========================================================
# S1/S3/S4 — CHAIN INTEGRITY CHECK
# =========================================================

async def verify_audit_chain() -> dict:
    """
    Returns the integrity verdict from the canonical SHA3 + Merkle chain.
    {"valid": True, ...} when intact, {"valid": False, ...} on tamper.
    """

    return _verify_audit_chain()
