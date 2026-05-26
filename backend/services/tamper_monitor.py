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

    print("\n===================================")
    print(" SNAKE TAMPER MONITOR ACTIVE ")
    print("===================================\n")

    while True:

        try:

            # =====================================================
            # S4: VERIFY CHAIN + EMIT TAMPER ALERT
            # =====================================================

            result = verify_audit_chain()

            if not result.get(
                "valid",
                True
            ):

                print("\n===================================")
                print(" TAMPER DETECTED ")
                print("===================================")

                print(result)

                print("===================================\n")

                # S4: Emit to WebSocket
                if ALERTS_AVAILABLE:
                    try:
                        await emit_security_event({
                            "event_type": "TAMPER_DETECTED",
                            "severity": "HIGH",
                            "title": "Audit Chain Tampered",
                            "agent_id": "SYSTEM",
                            "message": "Blockchain integrity violation detected",
                            "metadata": {
                                "tampered_index": result.get("tampered_index"),
                                "entry": result.get("entry")
                            }
                        })
                    except Exception as e:
                        print(f"[S4] Event emit error: {e}")

            # =====================================================
            # S6: PERIODIC MERKLE CHECKPOINT (60-sec)
            # =====================================================

            merkle_root = build_merkle_root()
            if merkle_root:
                MERKLE_CHECKPOINTS.append({
                    "checkpoint_number": len(MERKLE_CHECKPOINTS) + 1,
                    "merkle_root": merkle_root,
                    "chain_length": len(AUDIT_CHAIN)
                })
                print(f"[S6] Merkle checkpoint #{len(MERKLE_CHECKPOINTS)} stored: {merkle_root[:24]}...")

                # Emit to WebSocket
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

            print("\n===================================")
            print(" TAMPER MONITOR ERROR ")
            print("===================================")

            print(error)

            print("===================================\n")

            await asyncio.sleep(10)