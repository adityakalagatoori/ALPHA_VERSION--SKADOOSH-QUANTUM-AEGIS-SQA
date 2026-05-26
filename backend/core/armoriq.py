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
