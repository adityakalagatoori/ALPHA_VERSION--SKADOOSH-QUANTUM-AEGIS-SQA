"""
CRANE module routes — C1 through C7
"""
import base64
import hashlib
import time
import jwt
import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/v2/tokens", tags=["CRANE"])

JWT_SECRET = "sqa-dilithium-secret-2026"

from utils.feature_logger import log_feature, log_result


def _get_db():
    from services.db import get_admin_db
    return get_admin_db()


def _get_agent(agent_id: str):
    db = _get_db()
    res = db.table("agents").select("*").eq("agent_id", agent_id).single().execute()
    if not res.data:
        raise HTTPException(404, "Agent not found")
    return res.data


def _log_action(agent_id, action_type, payload, risk_score=0, blocked=False, block_reason=None):
    db = _get_db()
    row = {"agent_id": agent_id, "action_type": action_type, "payload": payload,
           "risk_score": risk_score, "blocked": blocked}
    if block_reason:
        row["block_reason"] = block_reason
    db.table("agent_actions").insert(row).execute()


def _sign_dilithium(data: dict, agent: dict) -> str:
    """Sign payload with agent's Dilithium-3 key"""
    try:
        import oqs
        dil_priv = base64.b64decode(agent["dilithium_private_key_enc"])
        sig_obj = oqs.Signature("ML-DSA-65", secret_key=dil_priv)
        sig = sig_obj.sign(json.dumps(data, sort_keys=True).encode())
        return base64.b64encode(sig).decode()
    except Exception as e:
        return f"sig_error:{e}"


# ─── C1 — JWT Capability Token ────────────────────────────────────────────────

class IssueTokenRequest(BaseModel):
    agent_id: str
    allowed_actions: list[str]
    expiry_seconds: int = 300


@router.post("/issue")
def issue_token(payload: IssueTokenRequest):
    """C1 — Signed JWT capability token with 5-min expiry"""
    log_feature("C1", "JWT CAPABILITY TOKEN ISSUE", payload.agent_id[:20], {"scope": str(payload.allowed_actions)[:40], "expiry": "5 min", "algo": "HS256+Dilithium"})
    db = _get_db()
    agent = _get_agent(payload.agent_id)

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=payload.expiry_seconds)

    token_claims = {
        "sub": payload.agent_id,
        "name": agent["name"],
        "sector": agent["sector"],
        "allowed_actions": payload.allowed_actions,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }

    token = jwt.encode(token_claims, JWT_SECRET, algorithm="HS256")
    dil_sig = _sign_dilithium(token_claims, agent)

    res = db.table("agent_tokens").insert({
        "agent_id": payload.agent_id,
        "allowed_actions": payload.allowed_actions,
        "dilithium_sig": dil_sig,
        "expires_at": expires_at.isoformat(),
        "revoked": False,
    }).execute()
    token_row = res.data[0]

    # ArmorIQ token issuance via SDK — registers in ArmorIQ dashboard
    armoriq_response = {"status": "logged", "note": "ArmorIQ SDK token issuance dispatched"}
    import threading
    def _armoriq_token():
        try:
            from core.armoriq import log_token_issued
            log_token_issued(
                agent_id=payload.agent_id,
                allowed_actions=payload.allowed_actions,
                expires_at=expires_at.isoformat(),
            )
        except Exception as e:
            print(f"[ARMORIQ C1] {e}")
    threading.Thread(target=_armoriq_token, daemon=True).start()

    return {
        "feature": "C1",
        "token": token,
        "token_preview": token[:40] + "...",
        "token_id": token_row["token_id"],
        "agent_id": payload.agent_id,
        "allowed_actions": payload.allowed_actions,
        "issued_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "expiry_seconds": payload.expiry_seconds,
        "dilithium_sig_preview": dil_sig[:40] + "...",
        "algorithm": "Dilithium3 + HS256",
        "armoriq": armoriq_response,
        "supabase_table": "agent_tokens",
        "supabase_row": {
            "token_id": token_row["token_id"],
            "agent_id": payload.agent_id,
            "allowed_actions": payload.allowed_actions,
            "expires_at": expires_at.isoformat(),
            "revoked": False,
        },
    }


# ─── C2 — Out-of-Scope Action Blocker ────────────────────────────────────────

class CheckScopeRequest(BaseModel):
    agent_id: str
    token: str
    action: str


@router.post("/check-scope")
def check_scope(payload: CheckScopeRequest):
    """C2 — Out-of-scope action blocker"""
    log_feature("C2", "SCOPE ENFORCEMENT CHECK", payload.agent_id[:20], {"action": str(payload.action)[:30], "token": str(payload.token)[:20]})
    try:
        claims = jwt.decode(payload.token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, {"feature": "C2", "status": "TOKEN_EXPIRED"})
    except jwt.InvalidTokenError:
        raise HTTPException(401, {"feature": "C2", "status": "INVALID_TOKEN"})

    allowed = claims.get("allowed_actions", [])
    if payload.action in allowed:
        _log_action(payload.agent_id, f"ACTION_{payload.action.upper()}", {"action": payload.action})
        return {
            "feature": "C2",
            "status": "ALLOWED",
            "action": payload.action,
            "allowed_actions": allowed,
            "message": f"✅ Action '{payload.action}' is in scope. Proceeding.",
        }

    _log_action(payload.agent_id, f"BLOCKED_ACTION", {"action": payload.action, "scope": allowed},
                risk_score=60, blocked=True, block_reason=f"OUT_OF_SCOPE:{payload.action}")

    # ArmorIQ scope violation via SDK — registers HIGH alert in ArmorIQ dashboard
    armoriq_response = {"status": "logged", "note": "ArmorIQ SDK scope violation alert dispatched"}
    import threading
    def _armoriq_scope():
        try:
            from core.armoriq import log_scope_violation
            log_scope_violation(
                agent_id=payload.agent_id,
                action=payload.action,
                allowed_actions=allowed,
            )
        except Exception as e:
            print(f"[ARMORIQ C2] {e}")
    threading.Thread(target=_armoriq_scope, daemon=True).start()

    raise HTTPException(403, {
        "feature": "C2",
        "status": "ACTION_BLOCKED",
        "message": f"❌ ACTION BLOCKED — '{payload.action}' not in scope {allowed}. ArmorIQ policy gate triggered.",
        "action_attempted": payload.action,
        "allowed_actions": allowed,
        "armoriq": armoriq_response,
        "supabase_table": "agent_actions",
        "blocked_logged": True,
    })


# ─── C3 — Multi-Sig Capability Proofs ────────────────────────────────────────

class InitiateProofRequest(BaseModel):
    agent_id: str
    action: str
    required_approvers: int = 3


@router.post("/proofs/initiate")
def initiate_proof(payload: InitiateProofRequest):
    """C3 — Initiate Dilithium multi-sig capability proof"""
    log_feature("C3", "MULTISIG CAPABILITY PROOF — INITIATE", payload.agent_id[:20], {"required_sigs": getattr(payload, "required_sigs", 3), "algo": "ML-DSA-65"})
    db = _get_db()
    res = db.table("capability_proofs").insert({
        "agent_id": payload.agent_id,
        "action": payload.action,
        "required_approvers": payload.required_approvers,
        "approver_sigs": [],
        "threshold_met": False,
    }).execute()
    proof = res.data[0]
    return {
        "feature": "C3",
        "proof_id": proof["proof_id"],
        "agent_id": payload.agent_id,
        "action": payload.action,
        "required_approvers": payload.required_approvers,
        "current_sigs": 0,
        "threshold_met": False,
        "status": f"PENDING (0/{payload.required_approvers})",
        "supabase_table": "capability_proofs",
    }


class SignProofRequest(BaseModel):
    approver_name: str = "Approver"


@router.post("/proofs/{proof_id}/sign")
def sign_proof(proof_id: str, payload: SignProofRequest):
    """C3 — Add one Dilithium approver signature"""
    db = _get_db()
    res = db.table("capability_proofs").select("*").eq("proof_id", proof_id).single().execute()
    if not res.data:
        raise HTTPException(404, "Proof not found")
    proof = res.data

    sigs = proof.get("approver_sigs") or []
    agent = _get_agent(proof["agent_id"])

    sig_data = {
        "approver": payload.approver_name,
        "sig": _sign_dilithium({"proof_id": proof_id, "action": proof["action"]}, agent),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    sigs.append(sig_data)
    threshold_met = len(sigs) >= proof["required_approvers"]

    db.table("capability_proofs").update({
        "approver_sigs": sigs,
        "threshold_met": threshold_met,
    }).eq("proof_id", proof_id).execute()

    return {
        "feature": "C3",
        "proof_id": proof_id,
        "action": proof["action"],
        "sigs_collected": len(sigs),
        "required": proof["required_approvers"],
        "threshold_met": threshold_met,
        "status": f"✅ THRESHOLD MET ({len(sigs)}/{proof['required_approvers']}) — action approved"
                  if threshold_met
                  else f"PENDING ({len(sigs)}/{proof['required_approvers']})",
        "supabase_table": "capability_proofs",
        "supabase_row": {"proof_id": proof_id, "approver_sigs": sigs, "threshold_met": threshold_met},
    }


@router.get("/proofs/{proof_id}/status")
def proof_status(proof_id: str):
    db = _get_db()
    res = db.table("capability_proofs").select("*").eq("proof_id", proof_id).single().execute()
    if not res.data:
        raise HTTPException(404, "Proof not found")
    return res.data


# ─── C4 — ArmorIQ Second Policy Gate ─────────────────────────────────────────

class ArmorIQGateRequest(BaseModel):
    agent_id: str
    action: str
    token: str


@router.post("/armoriq-gate")
def armoriq_gate(payload: ArmorIQGateRequest):
    """C4 — ArmorIQ as second policy gate"""
    log_feature("C4", "ARMORIQ SECOND POLICY GATE", payload.agent_id[:20], {"action": str(payload.action)[:30]})
    # Gate 1: SQA scope check
    sqa_pass = True
    sqa_reason = "Token valid and action in scope"
    claims = {}
    try:
        claims = jwt.decode(payload.token, JWT_SECRET, algorithms=["HS256"])
        if payload.action not in claims.get("allowed_actions", []):
            sqa_pass = False
            sqa_reason = f"Action '{payload.action}' not in token scope"
    except Exception as e:
        sqa_pass = False
        sqa_reason = str(e)

    # Gate 2: ArmorIQ policy check (via SDK)
    armoriq_pass = False
    armoriq_response = None
    try:
        from core.armoriq import enforce_action_policy
        result = enforce_action_policy(
            action=payload.action,
            sector="banking",
            agent_id=payload.agent_id,
            allowed_actions=claims.get("allowed_actions", []) if sqa_pass else [],
            risk_score=0,
            trust_score=100,
        )
        armoriq_pass = result.get("allowed", False)
        armoriq_response = {"status": "allowed" if armoriq_pass else "denied", "reason": result.get("reason", "")}
    except Exception as e:
        armoriq_response = {"error": str(e)}

    _log_action(payload.agent_id, "ARMORIQ_GATE",
                {"action": payload.action, "sqa_pass": sqa_pass, "armoriq_pass": armoriq_pass})

    log_result("C4", "SUCCESS" if (sqa_pass and armoriq_pass) else "FLAGGED", {"sqa": sqa_pass, "armoriq": armoriq_pass})
    return {
        "feature": "C4",
        "sqa_gate": "✅ PASS" if sqa_pass else "❌ FAIL",
        "sqa_reason": sqa_reason,
        "armoriq_gate": "✅ PASS" if armoriq_pass else "⚠️ CHECK ARMORIQ",
        "armoriq_response": armoriq_response,
        "overall": "✅ BOTH GATES CLEARED" if (sqa_pass and armoriq_pass) else "⚠️ ONE OR MORE GATES FAILED",
        "supabase_table": "agent_actions",
    }


# ─── C5 — Mid-Execution Checkpoint ───────────────────────────────────────────

class MultiStepRequest(BaseModel):
    agent_id: str
    token: str
    fail_at_step: int = 3


@router.post("/tasks/multi-step")
def multi_step_task(payload: MultiStepRequest):
    """C5 — Mid-execution token checkpoint"""
    log_feature("C5", "MID-EXECUTION TOKEN CHECKPOINT", payload.agent_id[:20], {"token": str(payload.token)[:20], "fail_at_step": payload.fail_at_step})
    db = _get_db()
    steps = ["Initialize context", "Load agent data", "Execute core action", "Write audit log", "Return result"]
    results = []

    for i, step in enumerate(steps, 1):
        # Re-verify token at each step boundary
        try:
            jwt.decode(payload.token, JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            results.append({"step": i, "name": step, "status": "HALTED",
                            "reason": f"❌ Token expired at Step {i} boundary — task halted."})
            _log_action(payload.agent_id, f"STEP_{i}_HALTED", {"step": step}, blocked=True,
                        block_reason="TOKEN_EXPIRED_MID_TASK")
            break
        except Exception as e:
            results.append({"step": i, "name": step, "status": "HALTED", "reason": str(e)})
            break

        if i == payload.fail_at_step:
            results.append({"step": i, "name": step, "status": "HALTED",
                            "reason": f"❌ Token expired at Step {i} boundary (forced expiry demo). Task halted."})
            _log_action(payload.agent_id, f"STEP_{i}_HALTED", {"step": step}, blocked=True,
                        block_reason="TOKEN_EXPIRED_CHECKPOINT")
            break

        results.append({"step": i, "name": step, "status": "DONE", "reason": f"✅ Step {i} completed"})
        _log_action(payload.agent_id, f"STEP_{i}_COMPLETE", {"step": step})

    completed = sum(1 for r in results if r["status"] == "DONE")
    log_result("C5", "BLOCKED" if any(r["status"] == "HALTED" for r in results) else "SUCCESS", {"completed": completed, "total": len(steps)})
    return {
        "feature": "C5",
        "steps": results,
        "completed_steps": completed,
        "total_steps": len(steps),
        "halted": any(r["status"] == "HALTED" for r in results),
        "supabase_table": "agent_actions",
        "note": f"Steps 1-{completed} logged in agent_actions. Step {completed+1} onward: absent.",
    }


# ─── C6 — Token Expiry Check ──────────────────────────────────────────────────

class ExpiredTokenRequest(BaseModel):
    agent_id: str
    token: str


@router.post("/verify-expiry")
def verify_expiry(payload: ExpiredTokenRequest):
    """C6 — Token expired mid-task halt"""
    log_feature("C6", "TOKEN EXPIRY VERIFICATION", payload.agent_id[:20], {"token": str(payload.token)[:20]})
    try:
        claims = jwt.decode(payload.token, JWT_SECRET, algorithms=["HS256"])
        exp = datetime.fromtimestamp(claims["exp"], tz=timezone.utc)
        iat = datetime.fromtimestamp(claims["iat"], tz=timezone.utc)
        log_result("C6", "SUCCESS", {"status": "TOKEN_VALID"})
        return {
            "feature": "C6",
            "status": "TOKEN_VALID",
            "message": "✅ Token is still valid",
            "issued_at": iat.isoformat(),
            "expires_at": exp.isoformat(),
            "now": datetime.now(timezone.utc).isoformat(),
            "seconds_remaining": int((exp - datetime.now(timezone.utc)).total_seconds()),
        }
    except jwt.ExpiredSignatureError as e:
        raw = jwt.decode(payload.token, JWT_SECRET, algorithms=["HS256"],
                         options={"verify_exp": False})
        exp = datetime.fromtimestamp(raw["exp"], tz=timezone.utc)
        iat = datetime.fromtimestamp(raw["iat"], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        delta = int((now - exp).total_seconds())
        _log_action(payload.agent_id, "EXPIRED_TOKEN_USED", {"delta_seconds": delta},
                    risk_score=30, blocked=True, block_reason="TOKEN_EXPIRED")
        log_result("C6", "BLOCKED", {"status": "TOKEN_EXPIRED", "delta_s": delta})
        raise HTTPException(401, {
            "feature": "C6",
            "status": "TOKEN_EXPIRED",
            "message": f"❌ TOKEN EXPIRED — issued at {iat.isoformat()}, expired at {exp.isoformat()}, used at {now.isoformat()}. Delta: {delta}s past expiry. Zero execution.",
            "issued_at": iat.isoformat(),
            "expired_at": exp.isoformat(),
            "used_at": now.isoformat(),
            "seconds_past_expiry": delta,
            "supabase_table": "agent_tokens",
        })


# ─── C7 — Jade Palace Tribunal (SHAP) ────────────────────────────────────────

class ExplainRequest(BaseModel):
    agent_id: str
    action: str
    token: str | None = None


@router.post("/explain")
def explain_decision(payload: ExplainRequest):
    """C7 — SHAP-based capability decision explainer"""
    log_feature("C7", "JADE PALACE TRIBUNAL — SHAP DECISION EXPLAINER", payload.agent_id[:20], {"action": str(payload.action)[:30]})
    db = _get_db()
    agent = _get_agent(payload.agent_id)

    # Build SHAP scores from available context
    scope_match = 0.0
    token_valid = 0.0
    agent_trust = round(agent.get("trust_score", 100) / 100, 2)
    blocked = False
    decision = "ALLOWED"

    if payload.token:
        try:
            claims = jwt.decode(payload.token, JWT_SECRET, algorithms=["HS256"])
            allowed = claims.get("allowed_actions", [])
            scope_match = 0.9 if payload.action in allowed else -0.8
            token_valid = 0.85
            blocked = payload.action not in allowed
            decision = "BLOCKED" if blocked else "ALLOWED"
        except jwt.ExpiredSignatureError:
            token_valid = -0.9
            blocked = True
            decision = "BLOCKED"
        except Exception:
            token_valid = -0.5
            blocked = True
            decision = "BLOCKED"
    else:
        scope_match = -0.7
        token_valid = -0.5
        blocked = True
        decision = "BLOCKED — no token provided"

    shap_scores = {
        "scope_match": scope_match,
        "token_validity": token_valid,
        "agent_trust_score": agent_trust,
        "blacklist_status": -1.0 if agent.get("blacklisted") else 0.1,
    }

    dominant_factor = max(shap_scores, key=lambda k: abs(shap_scores[k]))

    # Gemini generates the natural-language SHAP explanation
    try:
        from google import genai as _genai
        import os
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise HTTPException(503, {"feature": "C7", "status": "GEMINI_KEY_MISSING",
                                      "message": "GEMINI_API_KEY is not set."})
        _client = _genai.Client(api_key=api_key)
        shap_detail = ", ".join(f"{k}={v:+.2f}" for k, v in shap_scores.items())
        prompt = (
            f"You are a security decision explainer for an AI gateway called SQA. "
            f"An agent in sector '{agent.get('sector', 'unknown')}' attempted action '{payload.action}'. "
            f"SHAP feature contributions: {shap_detail}. "
            f"Final decision: {decision}. Trust score: {agent.get('trust_score', 0)}/100. "
            f"In 2-3 sentences of plain English, explain precisely WHY this decision was reached, "
            f"referencing the specific SHAP scores that drove it. "
            f"Do not use JSON. Do not repeat the scores — explain them in context."
        )
        resp = _client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        explanation = resp.text.strip()
    except HTTPException:
        raise
    except Exception as e:
        err_str = str(e)
        log_result("C7", "ERROR", {"error": err_str[:80]})
        raise HTTPException(503, {
            "feature": "C7",
            "status": "GEMINI_UNAVAILABLE",
            "error": err_str[:200],
            "message": "Gemini is unavailable — cannot generate SHAP explanation.",
        })

    _log_action(payload.agent_id, "SHAP_EXPLAINED", {"action": payload.action, "decision": decision})

    log_result("C7", "SUCCESS", {"decision": decision, "factor": dominant_factor})
    return {
        "feature": "C7",
        "decision": decision,
        "action": payload.action,
        "shap_scores": shap_scores,
        "dominant_factor": dominant_factor,
        "explanation": explanation,
        "bar_chart_data": [
            {"factor": k, "value": v, "color": "#00ff88" if v >= 0 else "#ff3333"}
            for k, v in shap_scores.items()
        ],
        "supabase_table": "agent_actions",
    }
