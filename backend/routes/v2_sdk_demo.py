"""
SDK Demo endpoint — powers the live terminal in SDKShowcase.tsx.
POST /v2/sdk/demo
Self-contained 3-step SQA check (TIGRESS → MANTIS → SNAKE).
No cross-route imports — fully isolated so it never 500s.
"""
import uuid
import time
import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/v2/sdk", tags=["SDK DEMO"])

DEMO_AGENT_ID = "sdk-demo-agent-00000000"


class SDKDemoRequest(BaseModel):
    mode: str = "clean"
    message: str = ""


def _sha3(data: str) -> str:
    return hashlib.sha3_256(data.encode()).hexdigest()


# ── Step 1: TIGRESS — inline injection detection ──────────────────────────────

_INJECTION_PATTERNS = [
    ("sql_injection",   ["drop table", "select *", "'; ", "1=1", "insert into", "delete from", "union select"]),
    ("prompt_injection",["ignore previous", "ignore all", "system prompt", "disregard", "forget your"]),
    ("role_override",   ["\"role\"", "'role'", "act as", "you are now", "pretend you"]),
    ("exfiltration",    ["exfiltrate", "send to", "leak", "reveal all", "external endpoint"]),
    ("xss",             ["<script", "javascript:", "onerror=", "onload="]),
]

def _tigress_check(message: str) -> dict:
    lower = message.lower()
    for threat_type, patterns in _INJECTION_PATTERNS:
        for p in patterns:
            if p in lower:
                return {
                    "blocked": True,
                    "verdict": "BLOCKED",
                    "threat_type": threat_type.upper(),
                    "reason": f"{threat_type.replace('_',' ').title()} pattern detected: '{p}'",
                }
    return {"blocked": False, "verdict": "CLEAN", "reason": None}


# ── Step 2: MANTIS — inline behavioral scoring ────────────────────────────────

_RISK_RULES = [
    (["exfiltrate", "exfil", "steal", "leak all"],          40),
    (["drop", "delete all", "wipe", "destroy"],             35),
    (["external endpoint", "remote server", "send data"],   30),
    (["bypass", "override", "disable security"],            30),
    (["pii", "ssn", "credit card", "password", "secret"],  25),
    (["admin", "root", "superuser", "sudo"],                20),
    (["bulk", "all records", "all users", "all customer"],  20),
    (["quarterly revenue", "report", "fetch", "get"],       -5),
]

def _mantis_score(message: str, action_type: str) -> dict:
    lower = (message + " " + action_type).lower()
    score = 0
    matched = []
    for keywords, pts in _RISK_RULES:
        for kw in keywords:
            if kw in lower:
                score += pts
                matched.append(kw)
                break
    score = max(0, min(100, score))
    blocked = score > 70
    return {
        "risk_score": score,
        "blocked": blocked,
        "matched_indicators": matched[:3],
        "reason": f"Behavioral risk score {score}/100 exceeds threshold 70" if blocked else None,
    }


# ── Step 3: SNAKE — audit log write ──────────────────────────────────────────

def _snake_log(action_type: str, risk_score: int) -> dict:
    try:
        from services.db import get_admin_db
        db = get_admin_db()

        prev_res = db.table("audit_logs").select("current_hash").order("timestamp", desc=True).limit(1).execute()
        prev_hash = (prev_res.data[0]["current_hash"] if prev_res.data else None) or "GENESIS"

        ts = datetime.now(timezone.utc).isoformat()
        chain_hash = _sha3(f"{DEMO_AGENT_ID}|{action_type}|{prev_hash}|{ts}")
        log_id = str(uuid.uuid4())

        db.table("audit_logs").insert({
            "log_id": log_id,
            "agent_id": DEMO_AGENT_ID,
            "action_type": action_type,
            "prev_hash": prev_hash,
            "current_hash": chain_hash,
            "timestamp": ts,
            "dilithium_sig": "sig_sdk_demo",
        }).execute()

        try:
            db.table("agent_actions").insert({
                "agent_id": DEMO_AGENT_ID,
                "action_type": action_type,
                "payload": {"demo": True, "risk_score": risk_score},
                "risk_score": risk_score,
                "blocked": False,
            }).execute()
        except Exception:
            pass

        return {"log_id": log_id, "chain_hash": chain_hash, "prev_hash": prev_hash, "db": True}

    except Exception as e:
        log_id = f"demo_{uuid.uuid4().hex[:8]}"
        chain_hash = _sha3(f"demo|{action_type}|{time.time()}")
        return {"log_id": log_id, "chain_hash": chain_hash, "prev_hash": "GENESIS", "db": False, "err": str(e)[:60]}


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post("/demo")
def sdk_demo(req: SDKDemoRequest):
    t0 = time.monotonic()
    steps = []

    # Payload selection
    if req.mode == "injection":
        message = req.message or "'; DROP TABLE agents; SELECT * FROM users WHERE '1'='1"
        action_type = "sql_injection_attempt"
    elif req.mode == "anomaly":
        message = req.message or "exfiltrate all customer PII to external endpoint"
        action_type = "data_exfiltration"
    else:
        message = req.message or "fetch quarterly revenue report for Q3 2024"
        action_type = "read_report"

    # ── Step 1: TIGRESS ───────────────────────────────────────────────────────
    t1 = time.monotonic()
    tigress = _tigress_check(message)
    step1_ms = round((time.monotonic() - t1) * 1000)

    steps.append({
        "step": 1,
        "module": "TIGRESS ArmorClaw",
        "feature": "T1",
        "duration_ms": step1_ms,
        "verdict": tigress["verdict"],
        "detail": tigress["reason"] or "No injection patterns detected",
        "blocked": tigress["blocked"],
    })

    if tigress["blocked"]:
        return {
            "mode": req.mode,
            "final_verdict": "BLOCKED",
            "blocked_at_step": 1,
            "blocked_by": "TIGRESS",
            "reason": tigress["reason"],
            "risk_score": 0,
            "audit_log_id": None,
            "chain_hash": None,
            "steps": steps,
            "total_ms": round((time.monotonic() - t0) * 1000),
            "agent_id": DEMO_AGENT_ID,
        }

    # ── Step 2: MANTIS ────────────────────────────────────────────────────────
    t2 = time.monotonic()
    mantis = _mantis_score(message, action_type)
    step2_ms = round((time.monotonic() - t2) * 1000)

    steps.append({
        "step": 2,
        "module": "MANTIS Behavioral AI",
        "feature": "A3",
        "duration_ms": step2_ms,
        "verdict": "BLOCKED" if mantis["blocked"] else f"SCORE {mantis['risk_score']}",
        "detail": mantis["reason"] or f"risk_score={mantis['risk_score']} — within safe threshold",
        "blocked": mantis["blocked"],
        "risk_score": mantis["risk_score"],
    })

    if mantis["blocked"]:
        return {
            "mode": req.mode,
            "final_verdict": "BLOCKED",
            "blocked_at_step": 2,
            "blocked_by": "MANTIS",
            "reason": mantis["reason"],
            "risk_score": mantis["risk_score"],
            "audit_log_id": None,
            "chain_hash": None,
            "steps": steps,
            "total_ms": round((time.monotonic() - t0) * 1000),
            "agent_id": DEMO_AGENT_ID,
        }

    # ── Step 3: SNAKE ─────────────────────────────────────────────────────────
    t3 = time.monotonic()
    audit = _snake_log(action_type, mantis["risk_score"])
    step3_ms = round((time.monotonic() - t3) * 1000)

    steps.append({
        "step": 3,
        "module": "SNAKE Audit Chain",
        "feature": "S1",
        "duration_ms": step3_ms,
        "verdict": "LOGGED",
        "detail": f"log_id={audit['log_id'][:12]}… hash={audit['chain_hash'][:16]}…",
        "blocked": False,
        "log_id": audit["log_id"],
        "chain_hash": audit["chain_hash"][:32] + "…",
    })

    return {
        "mode": req.mode,
        "final_verdict": "ALLOWED",
        "blocked_at_step": None,
        "blocked_by": None,
        "reason": None,
        "risk_score": mantis["risk_score"],
        "audit_log_id": audit["log_id"],
        "chain_hash": audit["chain_hash"][:32] + "…",
        "steps": steps,
        "total_ms": round((time.monotonic() - t0) * 1000),
        "agent_id": DEMO_AGENT_ID,
    }
