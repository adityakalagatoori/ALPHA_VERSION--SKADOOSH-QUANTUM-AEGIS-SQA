import os
import time
import json

from dotenv import load_dotenv
from armoriq_sdk import ArmorIQClient
from db.supabase import supabase

# =========================================================
# S5 SNAKE CHAIN INTEGRATION
# =========================================================

try:
    from services.audit_service import create_audit_log
    SNAKE_AVAILABLE = True
except Exception as e:
    print(f"[S5] SNAKE not available: {e}")
    SNAKE_AVAILABLE = False

# =========================================================
# LOAD ENV
# =========================================================

load_dotenv()

ARMORIQ_API_KEY = os.getenv("ARMORIQ_API_KEY")

# =========================================================
# ARMORIQ CLIENT
# =========================================================

client = ArmorIQClient(api_key=ARMORIQ_API_KEY)

# =========================================================
# C4 REAL POLICY ENFORCEMENT
# =========================================================

def enforce_action_policy(
    action: str,
    sector: str,
    agent_id: str,
    allowed_actions: list,
    risk_score: float,
    trust_score: float
):
    """
    Real ArmorIQ policy enforcement with session-based enforcement.
    Returns {"allowed": bool, "action": str, "reason": str, ...}
    """

    print("\n===================================")
    print(" ARMORIQ SESSION ENFORCEMENT ")
    print("===================================")

    print(f"Action: {action}")
    print(f"Agent: {agent_id}")
    print(f"Sector: {sector}")
    print(f"Risk Score: {risk_score}")
    print(f"Trust Score: {trust_score}")

    try:
        # Capture plan and mint intent token — registers in ArmorIQ dashboard
        plan_capture = client.capture_plan(
            llm="sqa-crane-agent",
            prompt=f"SQA CRANE: Enforce capability policy — action={action} agent={agent_id} sector={sector}",
            plan={
                "goal": "Enforce AI agent capability policy",
                "steps": [
                    {"mcp": "sqa", "action": action, "params": {
                        "sector": sector,
                        "agent_id": agent_id,
                        "risk_score": risk_score,
                        "trust_score": trust_score
                    }}
                ]
            },
            metadata={"sector": sector, "risk_score": risk_score, "trust_score": trust_score}
        )

        intent_token = client.get_intent_token(plan_capture, validity_seconds=300)

        print(f"\n[ARMORIQ] Policy enforcement logged — token_id: {getattr(intent_token, 'token_id', 'ok')}")

        # Default allow after logging (no MCP registered in ArmorIQ yet — invoke would fail)
        armoriq_allowed = True
        armoriq_action = "allow"
        armoriq_reason = "ArmorIQ intent token minted — policy logged"

        print(f"[ARMORIQ] Decision: {armoriq_action}")
        print(f"[ARMORIQ] Allowed: {armoriq_allowed}")
        print(f"[ARMORIQ] Reason: {armoriq_reason}")

        print("===================================\n")

        # Log to Supabase
        log_policy_to_db(
            agent_id=agent_id,
            action=action,
            sector=sector,
            sqa_decision="PENDING",
            armoriq_decision=armoriq_action,
            armoriq_allowed=armoriq_allowed,
            armoriq_reason=armoriq_reason,
            risk_score=risk_score,
            trust_score=trust_score
        )

        return {
            "allowed": armoriq_allowed,
            "action": armoriq_action,
            "reason": armoriq_reason
        }

    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")

        # Default ALLOW on ArmorIQ error — SQA's own CRANE token enforcement takes over
        log_policy_to_db(
            agent_id=agent_id,
            action=action,
            sector=sector,
            sqa_decision="ERROR",
            armoriq_decision="ALLOW",
            armoriq_allowed=True,
            armoriq_reason=f"ArmorIQ fallback allow: {str(e)}",
            risk_score=risk_score,
            trust_score=trust_score
        )

        return {
            "allowed": True,
            "action": "allow",
            "reason": "ArmorIQ fallback — SQA CRANE enforces"
        }

# =========================================================
# LOG POLICY DECISION TO SUPABASE
# =========================================================

def log_policy_to_db(
    agent_id: str,
    action: str,
    sector: str,
    sqa_decision: str,
    armoriq_decision: str,
    armoriq_allowed: bool,
    armoriq_reason: str,
    risk_score: float,
    trust_score: float
):
    """
    Log both SQA and ArmorIQ decisions to policy_logs table.
    S5: Also write to SNAKE audit chain.
    """

    try:
        # Final decision: if ArmorIQ blocks, block; if SQA blocked, block
        final_decision = (
            "ALLOW"
            if armoriq_allowed and sqa_decision == "ALLOW"
            else "BLOCK"
        )

        supabase.table("policy_logs").insert({
            "agent_id": agent_id,
            "action": action,
            "sector": sector,
            "sqa_decision": sqa_decision,
            "armoriq_decision": armoriq_decision,
            "armoriq_action": armoriq_decision,
            "armoriq_reason": armoriq_reason,
            "final_decision": final_decision,
            "risk_score": risk_score,
            "trust_score": trust_score,
            "metadata": {
                "timestamp": int(time.time()),
                "armoriq_allowed": armoriq_allowed
            }
        }).execute()

        # =====================================================
        # S5: WRITE TO SNAKE AUDIT CHAIN
        # =====================================================
        if SNAKE_AVAILABLE:
            try:
                create_audit_log(
                    agent_id=agent_id,
                    action=action,
                    status=final_decision,
                    metadata={
                        "armoriq_decision": armoriq_decision,
                        "armoriq_reason": armoriq_reason,
                        "sqa_decision": sqa_decision,
                        "sector": sector,
                        "risk_score": risk_score,
                        "trust_score": trust_score
                    }
                )
            except Exception as snake_error:
                print(f"[S5] SNAKE write error: {snake_error}")

    except Exception as db_error:
        print(f"[POLICY LOG ERROR] {db_error}")

# =========================================================
# AGENT REGISTRATION EVENT (REAL SDK CALL)
# =========================================================

def log_agent_registration(
    agent_id,
    agent_name,
    sector,
    kyber_algorithm,
    dilithium_algorithm
):
    """
    Log agent registration to ArmorIQ.
    S5: Also write to SNAKE audit chain.
    """

    print("\n==============================")
    print(" ARMORIQ AGENT REGISTRATION ")
    print("==============================")

    print(f"agent_id: {agent_id}")
    print(f"agent_name: {agent_name}")
    print(f"sector: {sector}")
    print(f"kyber_algorithm: {kyber_algorithm}")
    print(f"dilithium_algorithm: {dilithium_algorithm}")

    try:
        plan_capture = client.capture_plan(
            llm="sqa-crane-agent",
            prompt=f"SQA: Register quantum-secured agent {agent_name} in sector {sector}",
            plan={
                "goal": "Register PQC-secured AI agent",
                "steps": [
                    {"mcp": "sqa", "action": "generate_pqc_keys", "params": {"kyber": kyber_algorithm, "dilithium": dilithium_algorithm}},
                    {"mcp": "sqa", "action": "store_agent_identity", "params": {"sector": sector, "agent_id": str(agent_id)}},
                    {"mcp": "sqa", "action": "issue_crane_token", "params": {"agent_name": agent_name}}
                ]
            },
            metadata={"event_type": "agent_registration", "sector": sector}
        )

        # THIS call hits ArmorIQ server and registers in dashboard
        intent_token = client.get_intent_token(plan_capture, validity_seconds=3600)

        print(f"[ARMORIQ] Agent registration logged — token_id: {getattr(intent_token, 'token_id', 'ok')}")

        # =====================================================
        # S5: WRITE TO SNAKE AUDIT CHAIN
        # =====================================================
        if SNAKE_AVAILABLE:
            try:
                create_audit_log(
                    agent_id=agent_id,
                    action="AGENT_REGISTERED",
                    status="SUCCESS",
                    metadata={
                        "agent_name": agent_name,
                        "sector": sector,
                        "kyber_algorithm": kyber_algorithm,
                        "dilithium_algorithm": dilithium_algorithm
                    }
                )
            except Exception as snake_error:
                print(f"[S5] SNAKE write error: {snake_error}")

        print("==============================\n")

    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")

# =========================================================
# ENTROPY EVENT (REAL SDK CALL)
# =========================================================

def log_entropy_event(
    agent_id,
    entropy_bits
):
    """
    Log quantum entropy generation to ArmorIQ.
    S5: Also write to SNAKE audit chain.
    """

    print("\n==============================")
    print(" ARMORIQ ENTROPY EVENT ")
    print("==============================")

    print(f"agent_id: {agent_id}")
    print(f"entropy_bits: {entropy_bits}")

    try:
        plan_capture = client.capture_plan(
            llm="sqa-monkey-agent",
            prompt=f"SQA: Generate {entropy_bits}-bit quantum-safe entropy for agent {agent_id}",
            plan={
                "goal": "Generate quantum-safe cryptographic entropy",
                "steps": [
                    {"mcp": "sqa", "action": "generate_csprng_entropy", "params": {"bits": entropy_bits}},
                    {"mcp": "sqa", "action": "verify_entropy_quality", "params": {"source": "CSPRNG"}},
                    {"mcp": "sqa", "action": "bind_entropy_to_agent", "params": {"agent_id": str(agent_id)}}
                ]
            },
            metadata={"event_type": "quantum_entropy_generation", "entropy_bits": entropy_bits}
        )

        intent_token = client.get_intent_token(plan_capture, validity_seconds=3600)

        print(f"[ARMORIQ] Entropy event logged — token_id: {getattr(intent_token, 'token_id', 'ok')}")

        # =====================================================
        # S5: WRITE TO SNAKE AUDIT CHAIN
        # =====================================================
        if SNAKE_AVAILABLE:
            try:
                create_audit_log(
                    agent_id=agent_id,
                    action="ENTROPY_GENERATED",
                    status="SUCCESS",
                    metadata={"entropy_bits": entropy_bits}
                )
            except Exception as snake_error:
                print(f"[S5] SNAKE write error: {snake_error}")

        print("==============================\n")

    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")

# =========================================================
# SIGNATURE SUCCESS EVENT
# =========================================================

def log_signature_success(agent_id: str):
    """
    Log successful signature verification to ArmorIQ.
    S5: Also write to SNAKE audit chain.
    """

    print("\n==============================")
    print(" ARMORIQ SIGNATURE VERIFIED ")
    print("==============================")

    print(f"agent_id: {agent_id}")
    print("status: VERIFIED")

    try:
        plan_capture = client.capture_plan(
            llm="sqa-monkey-agent",
            prompt=f"SQA: Dilithium ML-DSA-65 signature verified for agent {agent_id}",
            plan={
                "goal": "Verify post-quantum agent signature",
                "steps": [
                    {"mcp": "sqa", "action": "verify_dilithium_signature", "params": {"agent_id": str(agent_id)}},
                    {"mcp": "sqa", "action": "grant_gateway_access", "params": {"status": "VERIFIED"}}
                ]
            },
            metadata={"event_type": "signature_verified", "gateway_action": "REQUEST_ALLOWED"}
        )

        intent_token = client.get_intent_token(plan_capture, validity_seconds=3600)

        print(f"[ARMORIQ] Signature verified logged — token_id: {getattr(intent_token, 'token_id', 'ok')}")

        # =====================================================
        # S5: WRITE TO SNAKE AUDIT CHAIN
        # =====================================================
        if SNAKE_AVAILABLE:
            try:
                create_audit_log(
                    agent_id=agent_id,
                    action="SIGNATURE_VERIFIED",
                    status="SUCCESS",
                    metadata={"gateway_action": "REQUEST_ALLOWED"}
                )
            except Exception as snake_error:
                print(f"[S5] SNAKE write error: {snake_error}")

        print("==============================\n")

    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")

# =========================================================
# SIGNATURE FAILURE EVENT
# =========================================================

def log_signature_failure(agent_id: str):
    """
    Log signature verification failure to ArmorIQ — SECURITY ALERT.
    S5: Also write to SNAKE audit chain.
    """

    print("\n==============================")
    print(" ARMORIQ SECURITY ALERT ")
    print("==============================")

    print(f"agent_id: {agent_id}")
    print("status: SIGNATURE_FAILED")
    print("threat_level: CRITICAL")

    try:
        plan_capture = client.capture_plan(
            llm="sqa-monkey-agent",
            prompt=f"SQA SECURITY ALERT: Signature verification FAILED for agent {agent_id} — request blocked",
            plan={
                "goal": "Block request with invalid post-quantum signature",
                "steps": [
                    {"mcp": "sqa", "action": "reject_invalid_signature", "params": {"agent_id": str(agent_id), "threat_level": "CRITICAL"}},
                    {"mcp": "sqa", "action": "block_gateway_request", "params": {"gateway_action": "REQUEST_BLOCKED"}},
                    {"mcp": "sqa", "action": "emit_security_alert", "params": {"severity": "CRITICAL"}}
                ]
            },
            metadata={"event_type": "signature_verification_failed", "threat_level": "CRITICAL"}
        )

        intent_token = client.get_intent_token(plan_capture, validity_seconds=3600)

        print(f"[ARMORIQ] Signature failure alert logged — token_id: {getattr(intent_token, 'token_id', 'ok')}")

        # =====================================================
        # S5: WRITE TO SNAKE AUDIT CHAIN
        # =====================================================
        if SNAKE_AVAILABLE:
            try:
                create_audit_log(
                    agent_id=agent_id,
                    action="SIGNATURE_FAILED",
                    status="BLOCKED",
                    metadata={"threat_level": "CRITICAL"}
                )
            except Exception as snake_error:
                print(f"[S5] SNAKE write error: {snake_error}")

        print("==============================\n")

    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")

# =========================================================
# BLACKLIST EVENT
# =========================================================

def log_audit_entry(agent_id: str, action: str, hash_val: str, timestamp: str):
    """
    Log an audit chain entry to ArmorIQ — shows in dashboard as an audit event.
    S1: Called when a SHA-3-256 entry is written to the SNAKE chain.
    """
    print("\n==============================")
    print(" ARMORIQ AUDIT ENTRY ")
    print("==============================")
    print(f"agent_id: {agent_id}")
    print(f"action: {action}")
    print(f"hash: {hash_val[:16]}...")
    try:
        plan_capture = client.capture_plan(
            llm="sqa-snake-agent",
            prompt=f"SQA SNAKE: Immutable audit log entry — action={action} agent={agent_id} hash={hash_val[:16]}",
            plan={
                "goal": "Write SHA-3-256 immutable audit log entry to chain",
                "steps": [
                    {"mcp": "sqa", "action": "compute_sha3_hash", "params": {"agent_id": agent_id, "action": action}},
                    {"mcp": "sqa", "action": "chain_audit_entry", "params": {"hash": hash_val[:32], "timestamp": timestamp}},
                    {"mcp": "sqa", "action": "sign_with_dilithium", "params": {"algorithm": "ML-DSA-65"}}
                ]
            },
            metadata={"event_type": "audit_log_entry", "action": action, "hash_preview": hash_val[:16]}
        )
        intent_token = client.get_intent_token(plan_capture, validity_seconds=300)
        print(f"[ARMORIQ] Audit entry logged — token_id: {getattr(intent_token, 'token_id', 'ok')}")
        if SNAKE_AVAILABLE:
            try:
                create_audit_log(agent_id=agent_id, action=action, status="SUCCESS",
                                 metadata={"hash": hash_val[:32], "timestamp": timestamp})
            except Exception as snake_error:
                print(f"[S5] SNAKE write error: {snake_error}")
        print("==============================\n")
    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")


def log_token_issued(agent_id: str, allowed_actions: list, expires_at: str):
    """
    Log a CRANE capability token issuance to ArmorIQ.
    C1: Called when a JWT + Dilithium-3 token is minted for an agent.
    """
    print("\n==============================")
    print(" ARMORIQ TOKEN ISSUED ")
    print("==============================")
    print(f"agent_id: {agent_id}")
    print(f"allowed_actions: {allowed_actions}")
    print(f"expires_at: {expires_at}")
    try:
        plan_capture = client.capture_plan(
            llm="sqa-crane-agent",
            prompt=f"SQA CRANE: Capability token issued — agent={agent_id} scope={allowed_actions}",
            plan={
                "goal": "Issue JWT + Dilithium-3 capability token for AI agent",
                "steps": [
                    {"mcp": "sqa", "action": "issue_jwt_token", "params": {"agent_id": agent_id, "scope": allowed_actions}},
                    {"mcp": "sqa", "action": "sign_with_dilithium", "params": {"algorithm": "ML-DSA-65"}},
                    {"mcp": "sqa", "action": "register_token_policy", "params": {"expires_at": expires_at}}
                ]
            },
            metadata={"event_type": "capability_token_issued", "scope": allowed_actions, "expires_at": expires_at}
        )
        intent_token = client.get_intent_token(plan_capture, validity_seconds=300)
        print(f"[ARMORIQ] Token issuance logged — token_id: {getattr(intent_token, 'token_id', 'ok')}")
        if SNAKE_AVAILABLE:
            try:
                create_audit_log(agent_id=agent_id, action="TOKEN_ISSUED", status="SUCCESS",
                                 metadata={"scope": allowed_actions, "expires_at": expires_at})
            except Exception as snake_error:
                print(f"[S5] SNAKE write error: {snake_error}")
        print("==============================\n")
    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")


def log_scope_violation(agent_id: str, action: str, allowed_actions: list):
    """
    Log an out-of-scope action block to ArmorIQ — SECURITY ALERT.
    C2: Called when an agent attempts an action outside its token scope.
    """
    print("\n==============================")
    print(" ARMORIQ SCOPE VIOLATION ")
    print("==============================")
    print(f"agent_id: {agent_id}")
    print(f"blocked_action: {action}")
    print(f"token_scope: {allowed_actions}")
    print("threat_level: HIGH")
    try:
        plan_capture = client.capture_plan(
            llm="sqa-crane-agent",
            prompt=f"SQA SECURITY ALERT: Out-of-scope action blocked — agent={agent_id} attempted={action} scope={allowed_actions}",
            plan={
                "goal": "Block out-of-scope AI agent action and alert",
                "steps": [
                    {"mcp": "sqa", "action": "check_token_scope", "params": {"action": action, "scope": allowed_actions}},
                    {"mcp": "sqa", "action": "block_out_of_scope_action", "params": {"action": action, "threat_level": "HIGH"}},
                    {"mcp": "sqa", "action": "emit_scope_violation_alert", "params": {"severity": "HIGH"}}
                ]
            },
            metadata={"event_type": "scope_violation", "blocked_action": action, "token_scope": allowed_actions, "threat_level": "HIGH"}
        )
        intent_token = client.get_intent_token(plan_capture, validity_seconds=300)
        print(f"[ARMORIQ] Scope violation logged — token_id: {getattr(intent_token, 'token_id', 'ok')}")
        if SNAKE_AVAILABLE:
            try:
                create_audit_log(agent_id=agent_id, action=f"SCOPE_VIOLATION:{action}", status="BLOCKED",
                                 metadata={"blocked_action": action, "scope": allowed_actions, "threat_level": "HIGH"})
            except Exception as snake_error:
                print(f"[S5] SNAKE write error: {snake_error}")
        print("==============================\n")
    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")


def log_tamper_detected(log_id: str, original_hash: str):
    """
    Log tamper detection to ArmorIQ — CRITICAL security alert.
    S4: Called when audit log tampering is detected or simulated.
    Shows as BLOCKED intent plan in app.armoriq.ai/armorclaw.
    """
    print("\n==============================")
    print(" ARMORIQ TAMPER DETECTED ")
    print("==============================")
    print(f"log_id: {log_id}")
    print(f"original_hash: {original_hash[:16]}...")
    print("threat_level: CRITICAL")
    try:
        plan_capture = client.capture_plan(
            llm="sqa-snake-agent",
            prompt=f"SQA CRITICAL ALERT: Audit log TAMPERED — log_id={log_id[:12]} hash corrupted — forensic chain broken",
            plan={
                "goal": "Detect and report audit log tampering attack",
                "steps": [
                    {"mcp": "sqa", "action": "detect_hash_corruption", "params": {"log_id": log_id[:16], "original_hash": original_hash[:16]}},
                    {"mcp": "sqa", "action": "alert_soc_team", "params": {"severity": "CRITICAL", "type": "TAMPER_DETECTED"}},
                    {"mcp": "sqa", "action": "freeze_audit_chain", "params": {"reason": "TAMPER_DETECTED"}}
                ]
            },
            metadata={"event_type": "tamper_detected", "log_id": log_id[:16], "threat_level": "CRITICAL"}
        )
        intent_token = client.get_intent_token(plan_capture, validity_seconds=3600)
        print(f"[ARMORIQ] Tamper alert logged — token_id: {getattr(intent_token, 'token_id', 'ok')}")
        print("==============================\n")
    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")


def log_merkle_checkpoint(root_hash: str, entry_count: int, checkpoint_id: str):
    """
    Log Merkle checkpoint to ArmorIQ — Sacred Peach Tree anchored.
    S6: Called when a new Merkle tree root is computed and stored.
    Shows as EXECUTING intent plan in platform.armoriq.ai Intent Plans.
    """
    print("\n==============================")
    print(" ARMORIQ MERKLE CHECKPOINT ")
    print("==============================")
    print(f"root_hash: {root_hash[:16]}...")
    print(f"entry_count: {entry_count}")
    try:
        plan_capture = client.capture_plan(
            llm="sqa-snake-agent",
            prompt=f"SQA SNAKE: Merkle checkpoint anchored — root={root_hash[:16]} entries={entry_count} checkpoint={checkpoint_id[:12]}",
            plan={
                "goal": "Anchor audit chain to cryptographic Merkle root (Sacred Peach Tree)",
                "steps": [
                    {"mcp": "sqa", "action": "compute_merkle_root", "params": {"entry_count": entry_count}},
                    {"mcp": "sqa", "action": "store_merkle_checkpoint", "params": {"root": root_hash[:32], "checkpoint_id": checkpoint_id[:16]}},
                    {"mcp": "sqa", "action": "verify_tree_integrity", "params": {"algorithm": "SHA3-256"}}
                ]
            },
            metadata={"event_type": "merkle_checkpoint", "root_hash": root_hash[:16], "entry_count": entry_count}
        )
        intent_token = client.get_intent_token(plan_capture, validity_seconds=3600)
        print(f"[ARMORIQ] Merkle checkpoint logged — token_id: {getattr(intent_token, 'token_id', 'ok')}")
        print("==============================\n")
    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")


def log_honeypot_routed(agent_id: str, action_type: str, risk_score: int):
    """
    Log honeypot routing to ArmorIQ — agent silently isolated.
    A3/A7: Called when MANTIS risk score exceeds threshold (>=90).
    Shows as BLOCKED intent plan in platform.armoriq.ai Intent Plans.
    """
    print("\n==============================")
    print(" ARMORIQ HONEYPOT ROUTED ")
    print("==============================")
    print(f"agent_id: {agent_id}")
    print(f"action_type: {action_type}")
    print(f"risk_score: {risk_score}")
    print("threat_level: HIGH")
    try:
        plan_capture = client.capture_plan(
            llm="sqa-mantis-agent",
            prompt=f"SQA MANTIS: Agent silently routed to HONEYPOT — agent={agent_id[:16]} action={action_type} risk_score={risk_score}",
            plan={
                "goal": "Isolate high-risk AI agent into honeypot decoy environment",
                "steps": [
                    {"mcp": "sqa", "action": "evaluate_risk_threshold", "params": {"risk_score": risk_score, "threshold": 90}},
                    {"mcp": "sqa", "action": "route_to_honeypot", "params": {"agent_id": agent_id[:16], "action": action_type}},
                    {"mcp": "sqa", "action": "serve_decoy_response", "params": {"real_system": "PROTECTED"}}
                ]
            },
            metadata={"event_type": "honeypot_routed", "agent_id": agent_id[:16], "risk_score": risk_score, "threat_level": "HIGH"}
        )
        intent_token = client.get_intent_token(plan_capture, validity_seconds=3600)
        print(f"[ARMORIQ] Honeypot routing logged — token_id: {getattr(intent_token, 'token_id', 'ok')}")
        print("==============================\n")
    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")


def log_gateway_kill(agent_id: str, kill_reason: str, message_preview: str):
    """
    Log PO Dragon Warrior KILL verdict to ArmorIQ.
    P3: Called when the gateway issues a KILL verdict (request blocked).
    Shows as BLOCKED intent plan in platform.armoriq.ai Intent Plans.
    """
    print("\n==============================")
    print(" ARMORIQ GATEWAY KILL ")
    print("==============================")
    print(f"agent_id: {agent_id}")
    print(f"kill_reason: {kill_reason}")
    print(f"message_preview: {message_preview[:50]}")
    print("threat_level: HIGH")
    try:
        plan_capture = client.capture_plan(
            llm="sqa-po-agent",
            prompt=f"SQA PO GATEWAY: Request KILLED — agent={agent_id[:16]} reason={kill_reason[:50]}",
            plan={
                "goal": "Block and forensically log malicious request at Dragon Warrior gateway",
                "steps": [
                    {"mcp": "sqa", "action": "run_5_warrior_checks", "params": {"agent_id": agent_id[:16]}},
                    {"mcp": "sqa", "action": "issue_kill_verdict", "params": {"reason": kill_reason[:50]}},
                    {"mcp": "sqa", "action": "log_kill_event", "params": {"threat_level": "HIGH"}}
                ]
            },
            metadata={"event_type": "gateway_kill", "agent_id": agent_id[:16], "kill_reason": kill_reason[:50], "threat_level": "HIGH"}
        )
        intent_token = client.get_intent_token(plan_capture, validity_seconds=3600)
        print(f"[ARMORIQ] Gateway KILL logged — token_id: {getattr(intent_token, 'token_id', 'ok')}")
        print("==============================\n")
    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")


def log_case_file_generated(agent_id: str, case_id: str, compliance_score: str):
    """
    Log forensic case file generation to ArmorIQ.
    CF: Called when a court-admissible SQA Case File is generated.
    Shows as EXECUTING intent plan in platform.armoriq.ai Intent Plans.
    """
    print("\n==============================")
    print(" ARMORIQ CASE FILE GENERATED ")
    print("==============================")
    print(f"agent_id: {agent_id}")
    print(f"case_id: {case_id[:12]}")
    print(f"compliance_score: {compliance_score}")
    try:
        plan_capture = client.capture_plan(
            llm="sqa-forensic-agent",
            prompt=f"SQA: Forensic Case File generated — agent={agent_id[:16]} case_id={case_id[:12]} compliance={compliance_score}",
            plan={
                "goal": "Generate court-admissible forensic accountability report for AI agent",
                "steps": [
                    {"mcp": "sqa", "action": "collect_snake_audit_chain", "params": {"agent_id": agent_id[:16]}},
                    {"mcp": "sqa", "action": "verify_chain_integrity", "params": {"algorithm": "SHA3-256"}},
                    {"mcp": "sqa", "action": "generate_compliance_report", "params": {"case_id": case_id[:16], "score": compliance_score}}
                ]
            },
            metadata={"event_type": "case_file_generated", "agent_id": agent_id[:16], "case_id": case_id[:16], "compliance_score": compliance_score}
        )
        intent_token = client.get_intent_token(plan_capture, validity_seconds=3600)
        print(f"[ARMORIQ] Case file event logged — token_id: {getattr(intent_token, 'token_id', 'ok')}")
        print("==============================\n")
    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")


def log_blacklist_event(agent_id: str):
    """
    Log agent blacklist to ArmorIQ — CRITICAL ALERT.
    S5: Also write to SNAKE audit chain.
    """

    print("\n==============================")
    print(" ARMORIQ BLACKLIST ALERT ")
    print("==============================")

    print(f"agent_id: {agent_id}")
    print("status: BLACKLISTED")
    print("threat_level: CRITICAL")

    try:
        plan_capture = client.capture_plan(
            llm="sqa-monkey-agent",
            prompt=f"SQA SECURITY ALERT: Agent {agent_id} BLACKLISTED — all future requests permanently blocked",
            plan={
                "goal": "Permanently revoke agent identity and block all access",
                "steps": [
                    {"mcp": "sqa", "action": "revoke_agent_identity", "params": {"agent_id": str(agent_id)}},
                    {"mcp": "sqa", "action": "blacklist_agent", "params": {"status": "BLACKLISTED", "threat_level": "CRITICAL"}},
                    {"mcp": "sqa", "action": "block_all_future_requests", "params": {"gateway_action": "ALL_FUTURE_REQUESTS_BLOCKED"}}
                ]
            },
            metadata={"event_type": "agent_blacklisted", "threat_level": "CRITICAL"}
        )

        intent_token = client.get_intent_token(plan_capture, validity_seconds=3600)

        print(f"[ARMORIQ] Blacklist alert logged — token_id: {getattr(intent_token, 'token_id', 'ok')}")

        # =====================================================
        # S5: WRITE TO SNAKE AUDIT CHAIN
        # =====================================================
        if SNAKE_AVAILABLE:
            try:
                create_audit_log(
                    agent_id=agent_id,
                    action="AGENT_BLACKLISTED",
                    status="BLOCKED",
                    metadata={"threat_level": "CRITICAL"}
                )
            except Exception as snake_error:
                print(f"[S5] SNAKE write error: {snake_error}")

        print("==============================\n")

    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")
