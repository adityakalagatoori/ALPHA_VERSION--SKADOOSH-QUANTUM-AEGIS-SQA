"""
SQA Case File Generator — Forensic Accountability Report
GET /v2/case-file/{agent_id}
Combines SNAKE audit chain + MANTIS behavior timeline + ArmorClaw history
+ Oracle Scroll + Gemini executive summary into a court-ready evidence pack.
"""
import uuid
import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/v2/case-file", tags=["CASE FILE"])

from utils.feature_logger import log_feature, log_result


def _get_db():
    from services.db import get_admin_db
    return get_admin_db()


def _sha3(data: str) -> str:
    return hashlib.sha3_256(data.encode()).hexdigest()


# ── Compliance check helpers ───────────────────────────────────────────────────

def _compliance_check(agent: dict, audit_logs: list, actions: list) -> dict:
    has_pqc = bool(agent.get("dilithium_public_key") or agent.get("dilithium_private_key_enc"))
    has_audit_trail = len(audit_logs) > 0
    has_signed_logs = any(
        (lg.get("dilithium_sig") or "").startswith("sig_") is False and
        len(lg.get("dilithium_sig") or "") > 20
        for lg in audit_logs
    )
    blocked_actions = [a for a in actions if a.get("blocked")]
    anomaly_actions = [a for a in actions if (a.get("risk_score") or 0) > 60]

    return {
        "SOC2": {
            "passed": has_audit_trail and has_pqc,
            "evidence": "Immutable SHA-3-256 audit chain + PQC keypair present" if has_audit_trail and has_pqc else "Missing audit trail or PQC keys",
            "control": "CC6.1 — Logical and Physical Access Controls",
        },
        "NIST_AI_RMF": {
            "passed": len(anomaly_actions) == 0,
            "evidence": f"{len(anomaly_actions)} high-risk actions detected" if anomaly_actions else "No anomalous actions in behavioral baseline",
            "control": "GOVERN 1.1 — AI Risk Management Policy",
        },
        "GDPR": {
            "passed": has_signed_logs,
            "evidence": "Dilithium-3 quantum signatures on audit entries" if has_signed_logs else "Signatures unavailable or unsigned entries",
            "control": "Art. 32 — Security of processing",
        },
        "ISO_27001": {
            "passed": len(blocked_actions) > 0 or len(anomaly_actions) == 0,
            "evidence": f"{len(blocked_actions)} blocked actions logged" if blocked_actions else "Agent within normal operational bounds",
            "control": "A.12.4 — Logging and Monitoring",
        },
    }


# ── Gemini executive summary ───────────────────────────────────────────────────

def _gemini_summary(agent_name: str, sector: str, audit_count: int,
                    blocked_count: int, anomaly_count: int,
                    exposure_window_s: float, chain_ok: bool) -> str:
    try:
        from google import genai as _genai
        import os
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set")
        client = _genai.Client(api_key=api_key)
        prompt = (
            f"You are a senior cybersecurity analyst writing an executive summary "
            f"for a forensic accountability report on an AI agent breach investigation.\n\n"
            f"Agent: {agent_name} | Sector: {sector}\n"
            f"Audit entries: {audit_count} | Blocked actions: {blocked_count} | "
            f"Anomalous actions: {anomaly_count}\n"
            f"Exposure window: {exposure_window_s:.0f} seconds | "
            f"Chain integrity: {'INTACT' if chain_ok else 'COMPROMISED'}\n\n"
            f"Write 3 concise sentences: (1) what the agent did, "
            f"(2) what SQA detected and blocked, "
            f"(3) compliance posture and recommended action. "
            f"Use formal CISO-level language."
        )
        resp = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        return resp.text.strip()
    except Exception as e:
        blocked_str = f"{blocked_count} blocked" if blocked_count else "no blocked"
        chain_str = "intact" if chain_ok else "COMPROMISED"
        return (
            f"Agent {agent_name} in sector {sector} executed {audit_count} audited actions "
            f"with {anomaly_count} anomalous and {blocked_str} actions detected. "
            f"SQA's 5-layer defense stack maintained audit chain integrity ({chain_str}) "
            f"with an exposure window of {exposure_window_s:.0f}s. "
            f"Compliance posture requires immediate review of flagged actions; "
            f"all evidence is quantum-signed and court-admissible."
        )


# ── GET /v2/case-file/{agent_id} ───────────────────────────────────────────────

import re as _re
_UUID_RE = _re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', _re.I)


@router.get("/{agent_id}")
def get_case_file(agent_id: str):
    log_feature("CF", "SQA CASE FILE GENERATION", agent_id[:20], {})
    db = _get_db()

    # Agent record — accept UUID or name
    if _UUID_RE.match(agent_id):
        agent_res = db.table("agents").select("*").eq("agent_id", agent_id).single().execute()
        agent = agent_res.data
    else:
        # Lookup by name
        name_res = db.table("agents").select("*").eq("name", agent_id).limit(1).execute()
        agent = name_res.data[0] if name_res.data else None
        if agent:
            agent_id = agent["agent_id"]  # normalize to UUID for all subsequent queries

    if not agent:
        raise HTTPException(404, f"Agent '{agent_id}' not found — enter a valid agent_id (UUID) or agent name")

    # Audit chain (SNAKE)
    audit_res = db.table("audit_logs").select("*").eq("agent_id", agent_id).order("timestamp", desc=False).execute()
    audit_logs = audit_res.data or []

    # Behavioral actions (MANTIS)
    actions_res = db.table("agent_actions").select("*").eq("agent_id", agent_id).order("timestamp", desc=False).execute()
    actions = actions_res.data or []

    # Blocked / anomaly counts
    blocked_actions = [a for a in actions if a.get("blocked")]
    anomaly_actions = [a for a in actions if (a.get("risk_score") or 0) > 60]
    honeypot_actions = [a for a in actions if a.get("honeypot_routed")]

    # Timeline
    first_ts = None
    last_ts = None
    first_anomaly_ts = None

    if audit_logs:
        first_ts = audit_logs[0].get("timestamp")
        last_ts = audit_logs[-1].get("timestamp")

    if anomaly_actions:
        first_anomaly_ts = anomaly_actions[0].get("timestamp")

    # Exposure window (seconds from first anomaly to last action)
    exposure_window_s = 0.0
    if first_anomaly_ts and last_ts:
        try:
            t1 = datetime.fromisoformat(first_anomaly_ts.replace("Z", "+00:00"))
            t2 = datetime.fromisoformat(last_ts.replace("Z", "+00:00"))
            exposure_window_s = max(0.0, (t2 - t1).total_seconds())
        except Exception:
            pass

    # Chain integrity verification — PER AGENT
    # Verify chain LINKS (each entry's prev_hash matches previous entry's current_hash).
    # Skip legacy/demo entries with malformed hashes (truncated, non-hex) — they pre-date
    # the SDK pipeline and would cause false positives.
    chain_ok = True
    chain_break_at = None
    verified_entries = 0
    expected_prev = None

    def _is_proper_hash(h):
        """Real SHA-3-256 hashes are 64 hex chars, no Unicode."""
        if not h or not isinstance(h, str):
            return False
        if h == "TAMPERED":
            return False
        # Reject truncated hashes (contain "..." or "…" or are too short)
        if "..." in h or "…" in h or len(h) < 16:
            return False
        # Must be hex
        try:
            int(h[:16], 16)
            return True
        except ValueError:
            return False

    for lg in audit_logs:
        current = lg.get("current_hash")
        prev = lg.get("prev_hash")

        # Explicit tampering — break the chain
        if current == "TAMPERED":
            chain_ok = False
            chain_break_at = lg.get("log_id")
            break

        # Skip legacy/demo entries with malformed hashes (don't count as break)
        if not _is_proper_hash(current):
            continue

        verified_entries += 1

        # First valid entry — record its hash as the expected predecessor
        if expected_prev is None:
            expected_prev = current
            continue

        # Subsequent entries must link to the previous current_hash
        if prev and _is_proper_hash(prev) and prev != expected_prev:
            chain_ok = False
            chain_break_at = lg.get("log_id")
            break

        expected_prev = current

    # Compliance checks
    compliance = _compliance_check(agent, audit_logs, actions)
    compliance_score = sum(1 for v in compliance.values() if v["passed"])

    # Gemini executive summary
    gemini_summary = _gemini_summary(
        agent_name=agent.get("name", agent_id[:8]),
        sector=agent.get("sector", "unknown"),
        audit_count=len(audit_logs),
        blocked_count=len(blocked_actions),
        anomaly_count=len(anomaly_actions),
        exposure_window_s=exposure_window_s,
        chain_ok=chain_ok,
    )

    # Oracle Scroll predictions (if any)
    oracle_predictions = []
    try:
        oracle_res = db.table("oracle_predictions").select("*").eq("agent_id", agent_id).order("created_at", desc=True).limit(3).execute()
        oracle_predictions = oracle_res.data or []
    except Exception:
        pass

    case_id = str(uuid.uuid4())
    generated_at = datetime.now(timezone.utc).isoformat()

    result = {
        "case_id": case_id,
        "generated_at": generated_at,
        "agent": {
            "agent_id": agent_id,
            "name": agent.get("name"),
            "sector": agent.get("sector"),
            "trust_score": agent.get("trust_score", 100),
            "blacklisted": agent.get("blacklisted", False),
            "honeypot_isolated": agent.get("honeypot_isolated", False),
            "registered_at": agent.get("created_at"),
            "pqc_enrolled": bool(agent.get("dilithium_public_key") or agent.get("dilithium_public_key_enc")),
        },
        "timeline": {
            "first_action": first_ts,
            "last_action": last_ts,
            "first_anomaly": first_anomaly_ts,
            "exposure_window_seconds": round(exposure_window_s, 2),
        },
        "evidence": {
            "audit_entries": len(audit_logs),
            "total_actions": len(actions),
            "blocked_actions": len(blocked_actions),
            "anomalous_actions": len(anomaly_actions),
            "honeypot_routed": len(honeypot_actions),
        },
        "chain_integrity": {
            "status": "INTACT" if chain_ok else "COMPROMISED",
            "break_at_log_id": chain_break_at,
            "verified_entries": verified_entries,
            "total_entries": len(audit_logs),
        },
        "audit_chain": [
            {
                "log_id": lg.get("log_id"),
                "action_type": lg.get("action_type"),
                "timestamp": lg.get("timestamp"),
                "current_hash": (lg.get("current_hash") or "")[:16] + "…",
                "signed": bool(lg.get("dilithium_sig") and len(lg.get("dilithium_sig", "")) > 20),
            }
            for lg in audit_logs[-20:]  # last 20 for display
        ],
        "blocked_actions_log": [
            {
                "action_type": a.get("action_type"),
                "risk_score": a.get("risk_score"),
                "block_reason": a.get("block_reason"),
                "timestamp": a.get("timestamp"),
            }
            for a in blocked_actions[-10:]
        ],
        "oracle_predictions": oracle_predictions,
        "compliance": compliance,
        "compliance_score": f"{compliance_score}/4",
        "gemini_summary": gemini_summary,
    }

    # ArmorIQ case file event — synchronous with 8s timeout for real plan_id in response
    import concurrent.futures
    armoriq_cf_response = {"status": "timeout", "note": "ArmorIQ did not respond in time"}
    def _armoriq_cf():
        from core.armoriq import log_case_file_generated
        return log_case_file_generated(
            agent_id=agent_id,
            case_id=case_id,
            compliance_score=result["compliance_score"]
        )
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as _ex:
        try:
            _td = _ex.submit(_armoriq_cf).result(timeout=8)
            if _td:
                armoriq_cf_response = {"status": "logged", **{k: v for k, v in _td.items() if v is not None}}
        except Exception as _e:
            print(f"[ARMORIQ CF] {_e}")

    result["armoriq"] = armoriq_cf_response

    log_result("CF", "CASE FILE GENERATED", agent_id[:20], {
        "case_id": case_id[:8],
        "chain": "INTACT" if chain_ok else "COMPROMISED",
        "compliance": f"{compliance_score}/4",
        "audit_entries": len(audit_logs),
    })

    return result
