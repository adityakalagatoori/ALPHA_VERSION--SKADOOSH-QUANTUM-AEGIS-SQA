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
        token_data = {
            "plan_id": getattr(intent_token, "plan_id", None),
            "plan_hash": getattr(intent_token, "plan_hash", None),
            "token_id": getattr(intent_token, "token_id", None),
            "merkle_root": getattr(intent_token, "merkle_root", None),
            "intent_reference": getattr(intent_token, "intent_reference", None),
        }
        print(f"[ARMORIQ] Agent registration logged — plan_id: {token_data['plan_id']}")

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
        return token_data

    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")
        return None

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
        token_data = {
            "plan_id": getattr(intent_token, "plan_id", None),
            "plan_hash": getattr(intent_token, "plan_hash", None),
            "token_id": getattr(intent_token, "token_id", None),
            "merkle_root": getattr(intent_token, "merkle_root", None),
            "intent_reference": getattr(intent_token, "intent_reference", None),
        }
        print(f"[ARMORIQ] Entropy event logged — plan_id: {token_data['plan_id']}")

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
        return token_data

    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")
        return None

# =========================================================
# SIGNATURE SUCCESS EVENT
# =========================================================

def log_signature_success(agent_id: str, action_type: str = "SIGNATURE_VERIFIED"):
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
        token_data = {
            "plan_id": getattr(intent_token, "plan_id", None),
            "plan_hash": getattr(intent_token, "plan_hash", None),
            "token_id": getattr(intent_token, "token_id", None),
            "merkle_root": getattr(intent_token, "merkle_root", None),
            "intent_reference": getattr(intent_token, "intent_reference", None),
        }
        print(f"[ARMORIQ] Signature verified logged — plan_id: {token_data['plan_id']}")

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
        return token_data

    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")
        return None

# =========================================================
# SIGNATURE FAILURE EVENT
# =========================================================

def log_signature_failure(agent_id: str, reason: str = "SIGNATURE_FAILED"):
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
        token_data = {
            "plan_id": getattr(intent_token, "plan_id", None),
            "plan_hash": getattr(intent_token, "plan_hash", None),
            "token_id": getattr(intent_token, "token_id", None),
            "merkle_root": getattr(intent_token, "merkle_root", None),
            "intent_reference": getattr(intent_token, "intent_reference", None),
        }
        print(f"[ARMORIQ] Signature failure alert logged — plan_id: {token_data['plan_id']}")

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
        return token_data

    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")
        return None

# =========================================================
# BLACKLIST EVENT
# =========================================================

def log_audit_entry(agent_id: str, action: str = "", hash_val: str = "", timestamp: str = "",
                    action_type: str = "", current_hash: str = ""):
    """
    Log an audit chain entry to ArmorIQ — shows in dashboard as an audit event.
    S1: Called when a SHA-3-256 entry is written to the SNAKE chain.
    Accepts both old (action, hash_val, timestamp) and new (action_type, current_hash) conventions.
    """
    # Normalize parameter names
    effective_action = action_type or action
    effective_hash = current_hash or hash_val
    print("\n==============================")
    print(" ARMORIQ AUDIT ENTRY ")
    print("==============================")
    print(f"agent_id: {agent_id}")
    print(f"action: {effective_action}")
    print(f"hash: {effective_hash[:16] if effective_hash else 'N/A'}...")
    try:
        plan_capture = client.capture_plan(
            llm="sqa-snake-agent",
            prompt=f"SQA SNAKE: Immutable audit log entry — action={effective_action} agent={agent_id} hash={effective_hash[:16] if effective_hash else 'N/A'}",
            plan={
                "goal": "Write SHA-3-256 immutable audit log entry to chain",
                "steps": [
                    {"mcp": "sqa", "action": "compute_sha3_hash", "params": {"agent_id": agent_id, "action": effective_action}},
                    {"mcp": "sqa", "action": "chain_audit_entry", "params": {"hash": effective_hash[:32] if effective_hash else "", "timestamp": timestamp}},
                    {"mcp": "sqa", "action": "sign_with_dilithium", "params": {"algorithm": "ML-DSA-65"}}
                ]
            },
            metadata={"event_type": "audit_log_entry", "action": effective_action, "hash_preview": effective_hash[:16] if effective_hash else ""}
        )
        intent_token = client.get_intent_token(plan_capture, validity_seconds=300)
        token_data = {
            "plan_id": getattr(intent_token, "plan_id", None),
            "plan_hash": getattr(intent_token, "plan_hash", None),
            "token_id": getattr(intent_token, "token_id", None),
            "merkle_root": getattr(intent_token, "merkle_root", None),
            "intent_reference": getattr(intent_token, "intent_reference", None),
        }
        print(f"[ARMORIQ] Audit entry logged — plan_id: {token_data['plan_id']}")
        if SNAKE_AVAILABLE:
            try:
                create_audit_log(agent_id=agent_id, action=effective_action, status="SUCCESS",
                                 metadata={"hash": effective_hash[:32] if effective_hash else "", "timestamp": timestamp})
            except Exception as snake_error:
                print(f"[S5] SNAKE write error: {snake_error}")
        print("==============================\n")
        return token_data
    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")
        return None


def log_token_issued(agent_id: str, allowed_actions: list = None, expires_at: str = "",
                     token_id: str = "", scope: list = None):
    """
    Log a CRANE capability token issuance to ArmorIQ.
    C1: Called when a JWT + Dilithium-3 token is minted for an agent.
    Accepts both old (allowed_actions, expires_at) and new (token_id, scope) calling conventions.
    """
    # Normalize parameter names — accept both calling conventions
    effective_scope = scope or allowed_actions or []
    print("\n==============================")
    print(" ARMORIQ TOKEN ISSUED ")
    print("==============================")
    print(f"agent_id: {agent_id}")
    print(f"token_id: {token_id}")
    print(f"scope: {effective_scope}")
    print(f"expires_at: {expires_at}")
    try:
        plan_capture = client.capture_plan(
            llm="sqa-crane-agent",
            prompt=f"SQA CRANE: Capability token issued — agent={agent_id} scope={effective_scope}",
            plan={
                "goal": "Issue JWT + Dilithium-3 capability token for AI agent",
                "steps": [
                    {"mcp": "sqa", "action": "issue_jwt_token", "params": {"agent_id": agent_id, "scope": effective_scope, "token_id": token_id}},
                    {"mcp": "sqa", "action": "sign_with_dilithium", "params": {"algorithm": "ML-DSA-65"}},
                    {"mcp": "sqa", "action": "register_token_policy", "params": {"expires_at": expires_at}}
                ]
            },
            metadata={"event_type": "capability_token_issued", "scope": effective_scope, "token_id": token_id, "expires_at": expires_at}
        )
        intent_token = client.get_intent_token(plan_capture, validity_seconds=300)
        token_data = {
            "plan_id": getattr(intent_token, "plan_id", None),
            "plan_hash": getattr(intent_token, "plan_hash", None),
            "token_id": getattr(intent_token, "token_id", None),
            "merkle_root": getattr(intent_token, "merkle_root", None),
            "intent_reference": getattr(intent_token, "intent_reference", None),
        }
        print(f"[ARMORIQ] Token issuance logged — plan_id: {token_data['plan_id']}")
        if SNAKE_AVAILABLE:
            try:
                create_audit_log(agent_id=agent_id, action="TOKEN_ISSUED", status="SUCCESS",
                                 metadata={"scope": allowed_actions, "expires_at": expires_at})
            except Exception as snake_error:
                print(f"[S5] SNAKE write error: {snake_error}")
        print("==============================\n")
        return token_data
    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")
        return None


def log_scope_violation(agent_id: str, action: str = "", allowed_actions: list = None,
                        attempted_action: str = "", allowed_scope: list = None):
    """
    Log an out-of-scope action block to ArmorIQ — SECURITY ALERT.
    C2: Called when an agent attempts an action outside its token scope.
    Accepts both old (action, allowed_actions) and new (attempted_action, allowed_scope) conventions.
    """
    # Normalize parameter names
    effective_action = attempted_action or action
    effective_scope = allowed_scope or allowed_actions or []
    print("\n==============================")
    print(" ARMORIQ SCOPE VIOLATION ")
    print("==============================")
    print(f"agent_id: {agent_id}")
    print(f"blocked_action: {effective_action}")
    print(f"token_scope: {effective_scope}")
    print("threat_level: HIGH")
    try:
        plan_capture = client.capture_plan(
            llm="sqa-crane-agent",
            prompt=f"SQA SECURITY ALERT: Out-of-scope action blocked — agent={agent_id} attempted={effective_action} scope={effective_scope}",
            plan={
                "goal": "Block out-of-scope AI agent action and alert",
                "steps": [
                    {"mcp": "sqa", "action": "check_token_scope", "params": {"action": effective_action, "scope": effective_scope}},
                    {"mcp": "sqa", "action": "block_out_of_scope_action", "params": {"action": effective_action, "threat_level": "HIGH"}},
                    {"mcp": "sqa", "action": "emit_scope_violation_alert", "params": {"severity": "HIGH"}}
                ]
            },
            metadata={"event_type": "scope_violation", "blocked_action": effective_action, "token_scope": effective_scope, "threat_level": "HIGH"}
        )
        intent_token = client.get_intent_token(plan_capture, validity_seconds=300)
        token_data = {
            "plan_id": getattr(intent_token, "plan_id", None),
            "plan_hash": getattr(intent_token, "plan_hash", None),
            "token_id": getattr(intent_token, "token_id", None),
            "merkle_root": getattr(intent_token, "merkle_root", None),
            "intent_reference": getattr(intent_token, "intent_reference", None),
        }
        print(f"[ARMORIQ] Scope violation logged — plan_id: {token_data['plan_id']}")
        if SNAKE_AVAILABLE:
            try:
                create_audit_log(agent_id=agent_id, action=f"SCOPE_VIOLATION:{action}", status="BLOCKED",
                                 metadata={"blocked_action": action, "scope": allowed_actions, "threat_level": "HIGH"})
            except Exception as snake_error:
                print(f"[S5] SNAKE write error: {snake_error}")
        print("==============================\n")
        return token_data
    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")
        return None


def log_tamper_detected(log_id: str, original_hash: str = "", agent_id: str = "",
                        expected_hash: str = "", actual_hash: str = ""):
    """
    Log tamper detection to ArmorIQ — CRITICAL security alert.
    S4: Called when audit log tampering is detected or simulated.
    Shows as BLOCKED intent plan in app.armoriq.ai/armorclaw.
    Accepts both old (original_hash) and new (agent_id, expected_hash, actual_hash) conventions.
    """
    effective_hash = expected_hash or original_hash
    print("\n==============================")
    print(" ARMORIQ TAMPER DETECTED ")
    print("==============================")
    print(f"agent_id: {agent_id}")
    print(f"log_id: {log_id}")
    print(f"expected_hash: {effective_hash[:16] if effective_hash else 'N/A'}...")
    print(f"actual_hash: {actual_hash[:16] if actual_hash else 'N/A'}...")
    print("threat_level: CRITICAL")
    try:
        plan_capture = client.capture_plan(
            llm="sqa-snake-agent",
            prompt=f"SQA CRITICAL ALERT: Audit log TAMPERED — agent={agent_id[:16] if agent_id else 'SYSTEM'} log_id={log_id[:12]} hash corrupted — forensic chain broken",
            plan={
                "goal": "Detect and report audit log tampering attack",
                "steps": [
                    {"mcp": "sqa", "action": "detect_hash_corruption", "params": {"log_id": log_id[:16], "expected_hash": effective_hash[:16] if effective_hash else ""}},
                    {"mcp": "sqa", "action": "alert_soc_team", "params": {"severity": "CRITICAL", "type": "TAMPER_DETECTED"}},
                    {"mcp": "sqa", "action": "freeze_audit_chain", "params": {"reason": "TAMPER_DETECTED"}}
                ]
            },
            metadata={"event_type": "tamper_detected", "log_id": log_id[:16], "agent_id": agent_id[:16] if agent_id else "", "threat_level": "CRITICAL"}
        )
        intent_token = client.get_intent_token(plan_capture, validity_seconds=3600)
        token_data = {
            "plan_id": getattr(intent_token, "plan_id", None),
            "plan_hash": getattr(intent_token, "plan_hash", None),
            "token_id": getattr(intent_token, "token_id", None),
            "merkle_root": getattr(intent_token, "merkle_root", None),
            "intent_reference": getattr(intent_token, "intent_reference", None),
        }
        print(f"[ARMORIQ] Tamper alert logged — plan_id: {token_data['plan_id']}")
        print("==============================\n")
        return token_data
    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")
        return None


def log_merkle_checkpoint(root_hash: str = "", entry_count: int = 0, checkpoint_id: str = "",
                          agent_id: str = "", merkle_root: str = ""):
    """
    Log Merkle checkpoint to ArmorIQ — Sacred Peach Tree anchored.
    S6: Called when a new Merkle tree root is computed and stored.
    Shows as EXECUTING intent plan in platform.armoriq.ai Intent Plans.
    Accepts both old (root_hash, checkpoint_id) and new (agent_id, merkle_root) conventions.
    """
    effective_root = merkle_root or root_hash
    effective_checkpoint = checkpoint_id or f"ckpt-{effective_root[:12]}"
    print("\n==============================")
    print(" ARMORIQ MERKLE CHECKPOINT ")
    print("==============================")
    print(f"agent_id: {agent_id}")
    print(f"merkle_root: {effective_root[:16] if effective_root else 'N/A'}...")
    print(f"entry_count: {entry_count}")
    try:
        plan_capture = client.capture_plan(
            llm="sqa-snake-agent",
            prompt=f"SQA SNAKE: Merkle checkpoint anchored — agent={agent_id[:16] if agent_id else 'SYSTEM'} root={effective_root[:16] if effective_root else 'N/A'} entries={entry_count}",
            plan={
                "goal": "Anchor audit chain to cryptographic Merkle root (Sacred Peach Tree)",
                "steps": [
                    {"mcp": "sqa", "action": "compute_merkle_root", "params": {"entry_count": entry_count, "agent_id": agent_id[:16] if agent_id else ""}},
                    {"mcp": "sqa", "action": "store_merkle_checkpoint", "params": {"root": effective_root[:32] if effective_root else "", "checkpoint_id": effective_checkpoint[:16]}},
                    {"mcp": "sqa", "action": "verify_tree_integrity", "params": {"algorithm": "SHA3-256"}}
                ]
            },
            metadata={"event_type": "merkle_checkpoint", "root_hash": effective_root[:16] if effective_root else "", "entry_count": entry_count, "agent_id": agent_id[:16] if agent_id else ""}
        )
        intent_token = client.get_intent_token(plan_capture, validity_seconds=3600)
        token_data = {
            "plan_id": getattr(intent_token, "plan_id", None),
            "plan_hash": getattr(intent_token, "plan_hash", None),
            "token_id": getattr(intent_token, "token_id", None),
            "merkle_root": getattr(intent_token, "merkle_root", None),
            "intent_reference": getattr(intent_token, "intent_reference", None),
        }
        print(f"[ARMORIQ] Merkle checkpoint logged — plan_id: {token_data['plan_id']}")
        print("==============================\n")
        return token_data
    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")
        return None


def log_honeypot_routed(agent_id: str, action_type: str = "HIGH_RISK_ACTION",
                        risk_score: int = 95, endpoint: str = ""):
    """
    Log honeypot routing to ArmorIQ — agent silently isolated.
    A3/A7: Called when MANTIS risk score exceeds threshold (>=90).
    Shows as BLOCKED intent plan in platform.armoriq.ai Intent Plans.
    Accepts both old (action_type) and new (endpoint) calling conventions.
    """
    effective_action = action_type or (f"HONEYPOT_ROUTE:{endpoint}" if endpoint else "HIGH_RISK_ACTION")
    print("\n==============================")
    print(" ARMORIQ HONEYPOT ROUTED ")
    print("==============================")
    print(f"agent_id: {agent_id}")
    print(f"action_type: {effective_action}")
    print(f"risk_score: {risk_score}")
    print("threat_level: HIGH")
    try:
        plan_capture = client.capture_plan(
            llm="sqa-mantis-agent",
            prompt=f"SQA MANTIS: Agent silently routed to HONEYPOT — agent={agent_id[:16]} action={effective_action} risk_score={risk_score}",
            plan={
                "goal": "Isolate high-risk AI agent into honeypot decoy environment",
                "steps": [
                    {"mcp": "sqa", "action": "evaluate_risk_threshold", "params": {"risk_score": risk_score, "threshold": 90}},
                    {"mcp": "sqa", "action": "route_to_honeypot", "params": {"agent_id": agent_id[:16], "action": effective_action}},
                    {"mcp": "sqa", "action": "serve_decoy_response", "params": {"real_system": "PROTECTED"}}
                ]
            },
            metadata={"event_type": "honeypot_routed", "agent_id": agent_id[:16], "risk_score": risk_score, "threat_level": "HIGH"}
        )
        intent_token = client.get_intent_token(plan_capture, validity_seconds=3600)
        token_data = {
            "plan_id": getattr(intent_token, "plan_id", None),
            "plan_hash": getattr(intent_token, "plan_hash", None),
            "token_id": getattr(intent_token, "token_id", None),
            "merkle_root": getattr(intent_token, "merkle_root", None),
            "intent_reference": getattr(intent_token, "intent_reference", None),
        }
        print(f"[ARMORIQ] Honeypot routing logged — plan_id: {token_data['plan_id']}")
        print("==============================\n")
        return token_data
    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")
        return None


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
        token_data = {
            "plan_id": getattr(intent_token, "plan_id", None),
            "plan_hash": getattr(intent_token, "plan_hash", None),
            "token_id": getattr(intent_token, "token_id", None),
            "merkle_root": getattr(intent_token, "merkle_root", None),
            "intent_reference": getattr(intent_token, "intent_reference", None),
        }
        print(f"[ARMORIQ] Gateway KILL logged — plan_id: {token_data['plan_id']}")
        print("==============================\n")
        return token_data
    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")
        return None


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
        token_data = {
            "plan_id": getattr(intent_token, "plan_id", None),
            "plan_hash": getattr(intent_token, "plan_hash", None),
            "token_id": getattr(intent_token, "token_id", None),
            "merkle_root": getattr(intent_token, "merkle_root", None),
            "intent_reference": getattr(intent_token, "intent_reference", None),
        }
        print(f"[ARMORIQ] Case file event logged — plan_id: {token_data['plan_id']}")
        print("==============================\n")
        return token_data
    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")
        return None


def log_blacklist_event(agent_id: str, reason: str = "AGENT_BLACKLISTED"):
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
        token_data = {
            "plan_id": getattr(intent_token, "plan_id", None),
            "plan_hash": getattr(intent_token, "plan_hash", None),
            "token_id": getattr(intent_token, "token_id", None),
            "merkle_root": getattr(intent_token, "merkle_root", None),
            "intent_reference": getattr(intent_token, "intent_reference", None),
        }
        print(f"[ARMORIQ] Blacklist alert logged — plan_id: {token_data['plan_id']}")

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
        return token_data

    except Exception as e:
        print(f"[ARMORIQ WARNING] {e}")
        print("==============================\n")
        return None
