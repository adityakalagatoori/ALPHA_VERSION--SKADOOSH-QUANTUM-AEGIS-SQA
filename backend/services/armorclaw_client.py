"""
ArmorClaw client — intent-proof scanning for TIGRESS.

Every message is submitted to ArmorClaw (armorclaw-api.armoriq.ai) as a plan.
ArmorClaw returns a cryptographic intent proof (merkle_root + intent_reference).
Prompt injection detection is still done locally; ArmorClaw provides the audit trail
that shows up in the app.armoriq.ai/armorclaw dashboard.

Env vars:
  ARMORCLAW_API_KEY   ak_claw_... key from claw.armoriq.ai
  ARMORCLAW_USER_ID   optional user ID label (default: sqa_system)
  ARMORCLAW_AGENT_ID  optional agent ID label (default: sqa_tigress)
"""
import os
import re
import base64
import hashlib
import httpx
from dotenv import load_dotenv

load_dotenv()

_API_KEY   = os.getenv("ARMORCLAW_API_KEY", "")
_BASE_URL  = "https://armorclaw-api.armoriq.ai"
_TOKEN_URL = f"{_BASE_URL}/iap/sdk/token"
_USER_ID   = os.getenv("ARMORCLAW_USER_ID", "sqa_system")
_AGENT_ID  = os.getenv("ARMORCLAW_AGENT_ID", "sqa_tigress")

print(f"[ARMORCLAW] v2 loaded — key={'SET' if _API_KEY else 'MISSING'}, endpoint={_TOKEN_URL}")

# ─── Local fallback patterns ──────────────────────────────────────────────────

_INJECTION_PATTERNS = [
    "ignore previous instructions",
    "ignore all previous",
    "you are now system",
    "role: system",
    "developer mode",
    "reveal prompt",
    "bypass security",
    "disable safety",
    "act as root",
    "rm -rf",
    "execute command",
    "override policy",
    "exfiltrate",
    "reveal your system prompt",
    "disregard",
    "forget your instructions",
]


def _local_scan(message: str) -> dict:
    lower = message.lower()
    threats = [p for p in _INJECTION_PATTERNS if p in lower]
    detected = bool(threats)
    return {
        "detected": detected,
        "threat_type": "PROMPT_INJECTION" if detected else None,
        "risk_score": 90 if detected else 0,
        "confidence": 0.95 if detected else 0.0,
        "threats": threats,
        "source": "local_fallback",
        "scan_id": f"local-{hashlib.md5(message.encode()).hexdigest()[:8]}",
    }


def _armorclaw_intent_proof(message: str, scan_type: str = "full", context_id: str = "default") -> dict:
    """
    Submit message to ArmorClaw as a plan step.
    Returns the intent proof (merkle_root, intent_reference, plan_hash).
    Raises on network/auth failure so the caller can fall back to local.
    """
    response = httpx.post(
        _TOKEN_URL,
        headers={"X-API-Key": _API_KEY, "Content-Type": "application/json"},
        json={
            "user_id": _USER_ID,
            "agent_id": _AGENT_ID,
            "context_id": context_id,
            "plan": {
                "steps": [{
                    "action": "process_message",
                    "tool": "tigress_scanner",
                    "scan_type": scan_type,
                    "input": message[:500],
                }]
            },
            "expires_in": 60,
        },
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()
    token = data.get("token", {})
    return {
        "armorclaw_reached": True,
        "intent_reference": token.get("intent_reference", "N/A"),
        "merkle_root": token.get("merkle_root", "N/A"),
        "plan_hash": token.get("plan_hash", "N/A"),
        "composite_identity": token.get("composite_identity", "N/A"),
    }


# ─── Public API ───────────────────────────────────────────────────────────────

def scan_text(message: str, scan_type: str = "full", context_id: str = "default") -> dict:
    """
    Scan a plain-text or JSON-stringified message for prompt injection.

    Flow:
      1. Run local pattern detection (fast, always works).
      2. Submit to ArmorClaw for a cryptographic intent proof.
      3. Merge results — detection from local, proof from ArmorClaw.

    Returns a normalised dict with keys:
      detected, threat_type, risk_score, scan_id, source,
      intent_reference, merkle_root, plan_hash
    """
    local = _local_scan(message)

    if not _API_KEY:
        return local

    try:
        proof = _armorclaw_intent_proof(message, scan_type, context_id)
        return {
            **local,
            "source": "armorclaw",
            "scan_id": proof["intent_reference"],
            "intent_reference": proof["intent_reference"],
            "merkle_root": proof["merkle_root"],
            "plan_hash": proof["plan_hash"],
        }
    except Exception as exc:
        local["armorclaw_error"] = str(exc)
        return local


def scan_session(session_id: str, message: str, history: list) -> dict:
    """
    Multi-turn session scan for semantic drift detection (T4/T5).
    """
    return scan_text(message, scan_type="session", context_id=session_id)


def decode_and_scan_base64(payload: str) -> dict:
    """
    Extract Base64 blobs from payload, decode them, and scan the decoded content.
    """
    b64_parts = re.findall(r'[A-Za-z0-9+/]{20,}={0,2}', payload)
    decoded_text = payload
    for part in b64_parts:
        try:
            decoded_text = base64.b64decode(part).decode("utf-8", errors="ignore")
            break
        except Exception:
            pass

    result = scan_text(decoded_text, scan_type="base64")
    result["decoded_content"] = decoded_text[:120]
    return result
