import asyncio

from services.audit_service import (
    verify_audit_chain,
    build_merkle_root,
    AUDIT_CHAIN,
    MERKLE_CHECKPOINTS
)

# =========================================================
# S4/S6 EVENT EMITTER
# =========================================================

try:
    from core.security_event_bus import emit_security_event
    ALERTS_AVAILABLE = True
except Exception as e:
    print("[ALERTS] Not available:", e)
    ALERTS_AVAILABLE = False

# =========================================================
# TAMPER MONITOR
# =========================================================

async def start_tamper_monitor():
    print("[SNAKE] Tamper monitor active (60s cycle)")

    _reported_indices: set = set()

    while True:
        try:
            # S4: verify chain — only print/emit NEW tampered entries
            result = verify_audit_chain()
            if not result.get("valid", True):
                idx = result.get("tampered_index")
                if idx not in _reported_indices:
                    _reported_indices.add(idx)
                    print(f"[S4] TAMPER DETECTED at index {idx}")
                    if ALERTS_AVAILABLE:
                        try:
                            await emit_security_event({
                                "event_type": "TAMPER_DETECTED",
                                "severity": "HIGH",
                                "title": "Audit Chain Tampered",
                                "agent_id": "SYSTEM",
                                "message": "Blockchain integrity violation detected",
                                "metadata": {
                                    "tampered_index": idx,
                                    "entry": result.get("entry")
                                }
                            })
                        except Exception as e:
                            print(f"[S4] Event emit error: {e}")

            # S6: Merkle checkpoint — silent unless chain grew
            merkle_root = build_merkle_root()
            if merkle_root:
                last = MERKLE_CHECKPOINTS[-1] if MERKLE_CHECKPOINTS else {}
                if last.get("merkle_root") != merkle_root:
                    MERKLE_CHECKPOINTS.append({
                        "checkpoint_number": len(MERKLE_CHECKPOINTS) + 1,
                        "merkle_root": merkle_root,
                        "chain_length": len(AUDIT_CHAIN)
                    })
                    if ALERTS_AVAILABLE:
                        try:
                            await emit_security_event({
                                "event_type": "MERKLE_CHECKPOINT",
                                "severity": "LOW",
                                "title": "Merkle Checkpoint Created",
                                "agent_id": "SYSTEM",
                                "message": "Sacred Peach Tree root computed",
                                "metadata": {
                                    "merkle_root": merkle_root,
                                    "chain_length": len(AUDIT_CHAIN)
                                }
                            })
                        except Exception as e:
                            print(f"[S6] Event emit error: {e}")

            await asyncio.sleep(60)

        except Exception as error:
            print(f"[SNAKE] Monitor error: {error}")
            await asyncio.sleep(10)