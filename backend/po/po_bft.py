import hashlib
import secrets
from datetime import datetime
from typing import Dict, List, Any
import numpy as np

from po.po_models import (
    ThresholdSigningRequest,
    ValidatorSignature
)

from core.security_event_bus import emit_security_event


def convert_numpy_types(obj: Any, _depth: int = 0) -> Any:
    if _depth > 10:
        return obj
    if isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, dict):
        return {k: convert_numpy_types(v, _depth+1) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [convert_numpy_types(item, _depth+1) for item in obj]
    elif hasattr(obj, 'dict') and callable(obj.dict):
        return convert_numpy_types(obj.dict(), _depth+1)
    return obj


# =========================================================
# VALIDATOR STORE
# =========================================================

VALIDATORS = {
    "validator_1": {},
    "validator_2": {},
    "validator_3": {},
    "validator_4": {},
    "validator_5": {}
}


# =========================================================
# ACTIVE CONSENSUS REQUESTS
# =========================================================

BFT_REQUESTS: Dict[str, ThresholdSigningRequest] = {}


# =========================================================
# CREATE THRESHOLD REQUEST
# =========================================================

async def create_threshold_signing_request(
    request_id: str,
    action: str,
    payload: dict
):

    payload_hash = hashlib.sha3_256(
        str(payload).encode()
    ).hexdigest()

    signing_request = ThresholdSigningRequest(
        request_id=request_id,
        action=action,
        payload_hash=payload_hash,
        required_signatures=3,
        total_validators=5,
        validator_signatures=[],
        approved=False
    )

    BFT_REQUESTS[request_id] = signing_request

    # =====================================================
    # EMIT EVENT
    # =====================================================

    await emit_security_event({
        "event_type": "po_bft_request_created",
        "request_id": request_id,
        "action": action,
        "required_signatures": 3,
        "timestamp": datetime.utcnow().isoformat()
    })

    return signing_request


# =========================================================
# VALIDATOR SIGN
# =========================================================

async def validator_sign(
    request_id: str,
    validator_id: str
):

    if request_id not in BFT_REQUESTS:

        raise Exception(
            "BFT request not found"
        )

    if validator_id not in VALIDATORS:

        raise Exception(
            "Invalid validator"
        )

    signing_request = BFT_REQUESTS[request_id]

    # =====================================================
    # CHECK ALREADY SIGNED
    # =====================================================

    for sig in signing_request.validator_signatures:

        if sig.validator_id == validator_id:

            return {
                "success": False,
                "message": "Validator already signed"
            }

    # =====================================================
    # GENERATE MOCK DILITHIUM SIGNATURE
    # =====================================================

    signature = generate_mock_signature(
        request_id,
        validator_id
    )

    validator_signature = ValidatorSignature(
        validator_id=validator_id,
        signature=signature,
        approved=True
    )

    signing_request.validator_signatures.append(
        validator_signature
    )

    # =====================================================
    # CHECK CONSENSUS
    # =====================================================

    if (
        len(signing_request.validator_signatures)
        >= signing_request.required_signatures
    ):

        signing_request.approved = True

    # =====================================================
    # UPDATE STORE
    # =====================================================

    BFT_REQUESTS[request_id] = signing_request

    # =====================================================
    # EMIT EVENT
    # =====================================================

    await emit_security_event({
        "event_type": "po_validator_signed",
        "request_id": request_id,
        "validator_id": validator_id,
        "signature_count": len(
            signing_request.validator_signatures
        ),
        "approved": signing_request.approved,
        "timestamp": datetime.utcnow().isoformat()
    })

    return {
        "success": True,
        "request_id": request_id,
        "validator_id": validator_id,
        "signature_count": len(
            signing_request.validator_signatures
        ),
        "approved": signing_request.approved
    }


# =========================================================
# VERIFY CONSENSUS
# =========================================================

async def verify_consensus(
    request_id: str
):

    if request_id not in BFT_REQUESTS:

        return {
            "approved": False,
            "reason": "Request not found"
        }

    signing_request = BFT_REQUESTS[request_id]

    valid_signatures = 0

    for sig in signing_request.validator_signatures:

        if verify_mock_signature(
            sig.signature
        ):

            valid_signatures += 1

    approved = (
        valid_signatures
        >= signing_request.required_signatures
    )

    return {
        "approved": approved,
        "valid_signatures": valid_signatures,
        "required_signatures": (
            signing_request.required_signatures
        ),
        "request_id": request_id
    }


# =========================================================
# GET BFT REQUEST
# =========================================================

async def get_bft_request(
    request_id: str
):

    return BFT_REQUESTS.get(request_id)


# =========================================================
# GET ALL REQUESTS
# =========================================================

async def get_all_bft_requests():

    requests = list(BFT_REQUESTS.values())
    return [
        convert_numpy_types(
            req.dict() if hasattr(req, 'dict') else req
        ) for req in requests
    ]


# =========================================================
# EXECUTE BFT ACTION
# =========================================================

async def execute_bft_action(
    request_id: str
):

    consensus = await verify_consensus(
        request_id
    )

    if not consensus["approved"]:

        await emit_security_event({
            "event_type": "po_bft_execution_blocked",
            "request_id": request_id,
            "reason": "Insufficient signatures",
            "timestamp": datetime.utcnow().isoformat()
        })

        return {
            "success": False,
            "message": "Consensus failed"
        }

    await emit_security_event({
        "event_type": "po_bft_execution_approved",
        "request_id": request_id,
        "timestamp": datetime.utcnow().isoformat()
    })

    return {
        "success": True,
        "message": "BFT consensus approved",
        "request_id": request_id
    }


# =========================================================
# MOCK DILITHIUM SIGNATURE
# =========================================================

def generate_mock_signature(
    request_id: str,
    validator_id: str
):

    raw = (
        f"{request_id}"
        f"{validator_id}"
        f"{secrets.token_hex(32)}"
    )

    return hashlib.sha3_256(
        raw.encode()
    ).hexdigest()


# =========================================================
# VERIFY SIGNATURE
# =========================================================

def verify_mock_signature(
    signature: str
):

    return len(signature) == 64


# =========================================================
# RESET REQUEST
# =========================================================

async def reset_bft_request(
    request_id: str
):

    if request_id in BFT_REQUESTS:

        del BFT_REQUESTS[request_id]

    await emit_security_event({
        "event_type": "po_bft_request_reset",
        "request_id": request_id,
        "timestamp": datetime.utcnow().isoformat()
    })

    return {
        "success": True
    }


# =========================================================
# DEMO FLOW
# =========================================================

async def demo_bft_flow():

    request = await create_threshold_signing_request(
        request_id="demo_request",
        action="transfer_funds",
        payload={
            "amount": 500000,
            "currency": "USD"
        }
    )

    await validator_sign(
        "demo_request",
        "validator_1"
    )

    await validator_sign(
        "demo_request",
        "validator_2"
    )

    await validator_sign(
        "demo_request",
        "validator_3"
    )

    consensus = await verify_consensus(
        "demo_request"
    )

    return consensus