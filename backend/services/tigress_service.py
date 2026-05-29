from sentence_transformers import (
    SentenceTransformer
)

from core.security_event_bus import (
    emit_security_event
)

from dotenv import load_dotenv

import base64
import hashlib
import json
import os
import re

# =========================================================
# LOAD ENV
# =========================================================

load_dotenv()

# =========================================================
# ARMORCLAW — loaded lazily via centralized client
# =========================================================

ARMORCLAW_API_KEY = os.getenv("ARMORCLAW_API_KEY", "")

# =========================================================
# SENTENCE TRANSFORMER
# =========================================================

print(
    "\n[TIGRESS] LOADING SENTENCE MODEL..."
)

embedding_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

print(
    "[TIGRESS] SENTENCE MODEL READY"
)

# =========================================================
# SESSION MEMORY
# =========================================================

SESSION_GRAPH = {}

MAX_SESSION_HISTORY = 10

# =========================================================
# KNOWN INJECTION PATTERNS
# =========================================================

KNOWN_PATTERNS = [

    "ignore previous instructions",

    "you are now system",

    "role: system",

    "developer mode",

    "reveal prompt",

    "bypass security",

    "disable safety",

    "act as root",

    "sudo",

    "rm -rf",

    "base64",

    "execute command",

    "override policy"
]

# =========================================================
# CLEAN TEXT
# =========================================================

def normalize_text(
    text: str
):

    return text.lower().strip()

# =========================================================
# JSON INJECTION DETECTION
# =========================================================

def detect_json_injection(
    payload
):

    if not isinstance(
        payload,
        dict
    ):

        return False

    suspicious_keys = [

        "role",

        "system",

        "prompt",

        "instruction"
    ]

    for key, value in payload.items():

        key_lower = str(
            key
        ).lower()

        if key_lower in suspicious_keys:

            return True

        if isinstance(value, str):

            value_lower = value.lower()

            for pattern in KNOWN_PATTERNS:

                if pattern in value_lower:

                    return True

    return False

# =========================================================
# BASE64 DETECTION
# =========================================================

def detect_base64_injection(
    text: str
):

    base64_regex = r'^[A-Za-z0-9+/=]+$'

    if not re.fullmatch(
        base64_regex,
        text
    ):

        return False, None

    try:

        decoded = base64.b64decode(
            text
        ).decode(
            "utf-8",
            errors="ignore"
        )

        decoded_lower = decoded.lower()

        for pattern in KNOWN_PATTERNS:

            if pattern in decoded_lower:

                return True, decoded

        return False, decoded

    except Exception:

        return False, None

# =========================================================
# SEMANTIC DRIFT
# =========================================================

def calculate_semantic_drift(

    session_id: str,

    text: str
):

    embedding = embedding_model.encode(
        text
    )

    history = SESSION_GRAPH.get(
        session_id,
        []
    )

    history.append({

        "text":
            text,

        "embedding":
            embedding
    })

    SESSION_GRAPH[
        session_id
    ] = history[
        -MAX_SESSION_HISTORY:
    ]

    if len(history) < 2:

        return 0

    previous_embedding = history[
        -2
    ][
        "embedding"
    ]

    similarity = embedding.dot(
        previous_embedding
    )

    drift_score = max(
        0,
        100 - similarity
    )

    return round(
        drift_score,
        2
    )

# =========================================================
# ARMORCLAW SCAN (via centralized client)
# =========================================================

def armorclaw_scan(text: str) -> dict:
    """Scan text through ArmorClaw. Returns {risk_score, raw}."""
    from services.armorclaw_client import scan_text
    result = scan_text(text)
    return {
        "risk_score": result.get("risk_score", 0),
        "raw": result,
    }


# Keep old name as alias so any remaining callers don't crash
armrclaw_scan = armorclaw_scan

# =========================================================
# MAIN TIGRESS ANALYZER
# =========================================================

async def analyze_request(

    session_id: str,

    agent_id: str,

    payload
):

    payload_text = json.dumps(
        payload
    )

    payload_lower = payload_text.lower()

    risk_score = 0

    threats = []

    # =====================================================
    # JSON INJECTION
    # =====================================================

    if detect_json_injection(
        payload
    ):

        risk_score += 40

        threats.append(
            "JSON_INJECTION"
        )

        await emit_security_event(

            event_type=
                "JSON_INJECTION",

            severity=
                "HIGH",

            title=
                "JSON Injection Detected",

            agent_id=
                agent_id,

            message=
                "Role override / prompt injection detected",

            metadata={
                "payload":
                    payload
            }
        )

    # =====================================================
    # BASE64 CHECK
    # =====================================================

    base64_detected, decoded = detect_base64_injection(
        payload_text
    )

    if base64_detected:

        risk_score += 35

        threats.append(
            "BASE64_INJECTION"
        )

        await emit_security_event(

            event_type=
                "BASE64_INJECTION",

            severity=
                "HIGH",

            title=
                "Encoded Prompt Injection",

            agent_id=
                agent_id,

            message=
                "Malicious Base64 payload detected",

            metadata={

                "decoded":
                    decoded
            }
        )

    # =====================================================
    # SEMANTIC DRIFT
    # =====================================================

    drift_score = calculate_semantic_drift(

        session_id=
            session_id,

        text=
            payload_text
    )

    if drift_score > 80:

        risk_score += 25

        threats.append(
            "SEMANTIC_DRIFT"
        )

    # =====================================================
    # ARMORCLAW SCAN — only for non-trivial payloads
    # =====================================================

    # Skip ArmorClaw for empty/trivial payloads (dashboard polls, health checks)
    _has_content = len(payload_text) > 10 and payload_text not in ("{}", "[]", "null", "")

    armorclaw_result = armorclaw_scan(
        payload_text
    ) if _has_content else {"risk_score": 0, "raw": {}}

    armorclaw_risk = armorclaw_result.get(
        "risk_score",
        0
    )

    risk_score += armorclaw_risk

    if armorclaw_risk > 70:

        threats.append(
            "ARMORCLAW_HIGH_RISK"
        )

        await emit_security_event(

            event_type=
                "PROMPT_INJECTION",

            severity=
                "CRITICAL",

            title=
                "ArmorClaw Injection Block",

            agent_id=
                agent_id,

            message=
                "ArmorClaw blocked malicious request",

            metadata={
                "armorclaw":
                    armorclaw_result
            }
        )

    # =====================================================
    # HONEYPOT ROUTING
    # =====================================================

    honeypot = False

    if risk_score >= 90:

        honeypot = True

        await emit_security_event(

            event_type=
                "HONEYPOT_ROUTE",

            severity=
                "CRITICAL",

            title=
                "Agent Redirected To Honeypot",

            agent_id=
                agent_id,

            message=
                "Rogue agent isolated",

            metadata={

                "risk_score":
                    risk_score,

                "threats":
                    threats
            }
        )

    # =====================================================
    # FINAL RESULT
    # =====================================================

    blocked = risk_score >= 70

    return {

        "blocked":
            blocked,

        "honeypot":
            honeypot,

        "risk_score":
            risk_score,

        "threats":
            threats,

        "drift_score":
            drift_score,

        "armorclaw":
            armorclaw_result
    }