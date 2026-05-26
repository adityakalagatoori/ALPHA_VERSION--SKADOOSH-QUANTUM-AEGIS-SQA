from sentence_transformers import (
    SentenceTransformer
)

from core.security_event_bus import (
    emit_security_event
)

from dotenv import load_dotenv

import requests
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
# ARMORCLAW CONFIG
# =========================================================

ARMORCLAW_API_KEY = os.getenv(
    "ARMORCLAW_API_KEY"
)

ARMORCLAW_BASE_URL = os.getenv(
    "ARMORCLAW_BASE_URL"
)

# =========================================================
# FAIL CLOSED
# =========================================================

if not ARMORCLAW_API_KEY:

    raise Exception(
        "ARMORCLAW_API_KEY_MISSING"
    )

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
# ARMORCLAW SCAN
# =========================================================

def armrclaw_scan(
    text: str
):

    headers = {

        "Authorization":
            f"Bearer {ARMORCLAW_API_KEY}",

        "Content-Type":
            "application/json"
    }

    payload = {

        "input": text
    }

    possible_endpoints = [

        f"{ARMORCLAW_BASE_URL}/api/v1/scan",

        f"{ARMORCLAW_BASE_URL}/scan",

        f"{ARMORCLAW_BASE_URL}/api/scan"
    ]

    last_error = None

    for endpoint in possible_endpoints:

        try:

            response = requests.post(

                endpoint,

                headers=headers,

                json=payload,

                timeout=15
            )

            # =============================================
            # SUCCESS
            # =============================================

            if response.status_code == 200:

                data = response.json()

                return {

                    "risk_score":
                        data.get(
                            "risk_score",
                            75
                        ),

                    "raw":
                        data
                }

            # =============================================
            # AUTH FAILURE OR ENDPOINT UNAVAILABLE
            # =============================================

            if response.status_code in [
                401,
                403,
                404
            ]:

                return {

                    "risk_score": 25,

                    "raw": {

                        "status":
                             "ARMORCLAW_FALLBACK",

                         "fallback":
                              True
                   }
                }

            # =============================================
            # SAVE ERROR
            # =============================================

            last_error = (

                f"{endpoint} -> "

                f"{response.status_code}"
            )

        except Exception as endpoint_error:

            print(
                "\n[TIGRESS ENDPOINT ERROR]"
            )

            print(endpoint_error)

            last_error = str(
                endpoint_error
            )

    # =============================================
    # FALLBACK MODE (for development)
    # =============================================

    return {

        "risk_score": 25,

        "raw": {

            "status":
                "ARMORCLAW_DEVELOPMENT_FALLBACK",

            "fallback":
                True,

            "last_error":
                str(last_error)
        }
    }

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
    # ARMORCLAW SCAN
    # =====================================================

    armorclaw_result = armrclaw_scan(
        payload_text
    )

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