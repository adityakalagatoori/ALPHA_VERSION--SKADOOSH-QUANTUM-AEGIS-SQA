from fastapi import (
    Header,
    HTTPException
)

from crypto.signature import (
    verify_signature
)

from core.armoriq import (

    log_signature_success,

    log_signature_failure,

    log_blacklist_event,
)

from services.agent_service import (
    AGENT_DB
)

import time
import hashlib
import json

# =========================================================
# OPTIONAL SNAKE IMPORTS
# =========================================================

try:

    from services.audit_service import (
        create_audit_log
    )

    AUDIT_AVAILABLE = True

except Exception as audit_error:

    print("\n[SNAKE AUDIT IMPORT ERROR]")
    print(audit_error)

    AUDIT_AVAILABLE = False

# =========================================================
# REPLAY CACHE
# =========================================================

USED_NONCES = set()

MAX_REQUEST_AGE = 300

# =========================================================
# SAFE AUDIT WRAPPER
# =========================================================

def audit_safe(

    agent_id: str,

    action: str,

    status: str,

    metadata: dict = None
):

    if not AUDIT_AVAILABLE:

        return

    try:

        create_audit_log(

            agent_id=agent_id,

            action=action,

            status=status,

            metadata=metadata or {}
        )

    except Exception as audit_error:

        print("\n[AUDIT FAILURE]")
        print(audit_error)

# =========================================================
# SIGNATURE VERIFICATION GATE
# =========================================================

async def verify_request_signature(

    x_agent_id: str = Header(None),

    x_signature: str = Header(None),

    x_payload: str = Header(None),

    x_action: str = Header(None),

    x_token: str = Header(None),

    x_nonce: str = Header(None),

    x_timestamp: str = Header(None),
):

    # =====================================================
    # VALIDATE HEADERS
    # =====================================================

    if not x_agent_id:

        raise HTTPException(
            status_code=401,
            detail="MISSING_AGENT_ID"
        )

    if not x_signature:

        raise HTTPException(
            status_code=401,
            detail="MISSING_SIGNATURE"
        )

    if not x_payload:

        raise HTTPException(
            status_code=401,
            detail="MISSING_PAYLOAD"
        )

    if not x_action:

        raise HTTPException(
            status_code=401,
            detail="MISSING_ACTION"
        )

    if not x_token:

        raise HTTPException(
            status_code=401,
            detail="MISSING_TOKEN"
        )

    if not x_nonce:

        raise HTTPException(
            status_code=401,
            detail="MISSING_NONCE"
        )

    if not x_timestamp:

        raise HTTPException(
            status_code=401,
            detail="MISSING_TIMESTAMP"
        )

    # =====================================================
    # FETCH AGENT FROM MEMORY
    # =====================================================

    agent = AGENT_DB.get(
        x_agent_id
    )

    if not agent:

        audit_safe(

            agent_id="UNKNOWN",

            action="AGENT_LOOKUP",

            status="FAILED",

            metadata={
                "reason":
                    "AGENT_NOT_FOUND"
            }
        )

        raise HTTPException(
            status_code=404,
            detail="AGENT_NOT_FOUND"
        )

    # =====================================================
    # BLACKLIST CHECK
    # =====================================================

    if agent.get("is_blacklisted"):

        print(
            f"[M4] BLACKLISTED AGENT BLOCKED: {x_agent_id}"
        )

        log_blacklist_event(
            x_agent_id
        )

        audit_safe(

            agent_id=x_agent_id,

            action="BLACKLIST_CHECK",

            status="BLOCKED",

            metadata={
                "reason":
                    "BLACKLISTED_AGENT"
            }
        )

        raise HTTPException(

            status_code=403,

            detail=
                "AGENT_BLACKLISTED"
        )

    # =====================================================
    # TIMESTAMP VALIDATION
    # =====================================================

    try:

        request_timestamp = int(
            x_timestamp
        )

    except Exception:

        audit_safe(

            agent_id=x_agent_id,

            action="TIMESTAMP_VALIDATION",

            status="FAILED",

            metadata={
                "reason":
                    "INVALID_TIMESTAMP_FORMAT"
            }
        )

        raise HTTPException(

            status_code=400,

            detail=
                "INVALID_TIMESTAMP_FORMAT"
        )

    current_time = int(
        time.time()
    )

    request_age = (
        current_time - request_timestamp
    )

    if request_age > MAX_REQUEST_AGE:

        print(
            f"[M5] EXPIRED PACKET BLOCKED: {x_nonce}"
        )

        audit_safe(

            agent_id=x_agent_id,

            action="TIMESTAMP_VALIDATION",

            status="BLOCKED",

            metadata={

                "reason":
                    "REQUEST_TIMESTAMP_EXPIRED",

                "request_age":
                    request_age
            }
        )

        raise HTTPException(

            status_code=403,

            detail=
                "REQUEST_TIMESTAMP_EXPIRED"
        )

    # =====================================================
    # REPLAY DETECTION
    # =====================================================

    if x_nonce in USED_NONCES:

        print(
            f"[M5] REPLAY DETECTED: {x_nonce}"
        )

        audit_safe(

            agent_id=x_agent_id,

            action="REPLAY_ATTACK",

            status="BLOCKED",

            metadata={
                "nonce":
                    x_nonce
            }
        )

        raise HTTPException(

            status_code=403,

            detail=
                "REPLAY_ATTACK_BLOCKED"
        )

    USED_NONCES.add(
        x_nonce
    )

    print(
        f"[M5] NONCE ACCEPTED: {x_nonce}"
    )

    audit_safe(

        agent_id=x_agent_id,

        action="NONCE_ACCEPTED",

        status="VERIFIED",

        metadata={
            "nonce":
                x_nonce
        }
    )

    # =====================================================
    # VERIFY SIGNATURE
    # =====================================================

    payload_dict = {

        "agent_id":
            x_agent_id,

        "payload":
            x_payload,

        "action":
            x_action,

        "nonce":
            x_nonce,

        "timestamp":
            request_timestamp,

        "token":
            x_token,
    }

    verified = verify_signature(

        public_key_b64=
            agent["dilithium_public_key"],

        payload=
            payload_dict,

        signature_b64=
            x_signature,
    )

    # =====================================================
    # INVALID SIGNATURE
    # =====================================================

    if not verified:

        print(
            f"[M3] INVALID SIGNATURE: {x_agent_id}"
        )

        log_signature_failure(
            x_agent_id
        )

        audit_safe(

            agent_id=x_agent_id,

            action="SIGNATURE_VERIFICATION",

            status="FAILED",

            metadata={

                "reason":
                    "INVALID_SIGNATURE",

                "action":
                    x_action
            }
        )

        raise HTTPException(

            status_code=403,

            detail=
                "INVALID_SIGNATURE"
        )

    # =====================================================
    # VALID SIGNATURE
    # =====================================================

    print("\n===================================")
    print(" M3 SIGNATURE VERIFIED ")
    print("===================================")

    print(
        f"Agent: {x_agent_id}"
    )

    print(
        f"Action: {x_action}"
    )

    print(
        "[M3] DILITHIUM SIGNATURE VALID"
    )

    print("===================================\n")

    log_signature_success(
        x_agent_id
    )

    # =====================================================
    # SNAKE AUDIT ENTRY
    # =====================================================

    audit_safe(

        agent_id=x_agent_id,

        action="SIGNATURE_VERIFIED",

        status="SUCCESS",

        metadata={

            "secured_action":
                x_action,

            "nonce":
                x_nonce,

            "timestamp":
                request_timestamp
        }
    )

    return {

        "verified":
            True,

        "agent_id":
            x_agent_id,

        "payload":
            x_payload,

        "action":
            x_action,

        "token":
            x_token,

        "nonce":
            x_nonce,

        "timestamp":
            request_timestamp,
    }