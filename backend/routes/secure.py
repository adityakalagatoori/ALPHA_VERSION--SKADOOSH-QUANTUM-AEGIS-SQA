from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from middleware.signature_guard import (
    verify_request_signature
)

from crypto.signature import (
    sign_payload
)

from crypto.enclave import (
    decrypt_private_key
)

from services.agent_service import (

    AGENT_DB,

    enforce_capability,

    checkpoint_validate,

    create_multisig_action,

    approve_multisig_action,

    verify_agent_token,

    armoriq_policy_gate,

    build_tribunal_record,

    blacklist_agent
)

from services.approval_service import (
    register_approver,
    create_pending_action,
    submit_approval_signature,
    get_pending_action_status
)

from models.approval_models import (
    ApproverRegisterRequest,
    ApproverRegisterResponse,
    MultisigApproveRequest,
    MultisigStartResponse
)

import secrets
import time
import asyncio
import hashlib
import json

# =========================================================
# OPTIONAL SNAKE IMPORTS
# =========================================================

try:

    from services.audit_service import (

        create_audit_log,

        get_audit_chain_status
    )

    AUDIT_AVAILABLE = True

except Exception as audit_error:

    print("\n[SNAKE AUDIT IMPORT ERROR]")
    print(audit_error)

    AUDIT_AVAILABLE = False

print("SECURE ROUTER LOADED")

router = APIRouter()

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
# C2 + C4
# REAL CAPABILITY GATE
# =========================================================

@router.post("/secure-action")
async def secure_action(
    verified=Depends(
        verify_request_signature
    )
):

    token = verified.get(
        "token"
    )

    action = verified.get(
        "action"
    )

    agent_id = verified.get(
        "agent_id"
    )

    # =====================================================
    # C2 CAPABILITY ENFORCEMENT
    # =====================================================

    capability_result = enforce_capability(

        token=token,

        requested_action=action
    )

    payload = capability_result[
        "payload"
    ]

    # =====================================================
    # C4 ARMORIQ SECOND GATE
    # =====================================================

    armoriq_policy_gate(

        action=action,

        payload=payload
    )

    # =====================================================
    # SNAKE AUDIT LOG
    # =====================================================

    audit_safe(

        agent_id=agent_id,

        action=action,

        status="ACCESS_GRANTED",

        metadata={

            "nonce":
                verified["nonce"],

            "timestamp":
                verified["timestamp"],

            "security_layers": {

                "C1":
                    "TOKEN_VALID",

                "C2":
                    "CAPABILITY_VERIFIED",

                "C4":
                    "ARMORIQ_POLICY_VERIFIED"
            }
        }
    )

    return {

        "status":
            "ACCESS_GRANTED",

        "message":
            "CRANE CAPABILITY VERIFIED",

        "agent":
            payload["agent_id"],

        "allowed_actions":
            payload["allowed_actions"],

        "executed_action":
            action,

        "nonce":
            verified["nonce"],

        "timestamp":
            verified["timestamp"],

        "security_layers": {

            "C1":
                "TOKEN_VALID",

            "C2":
                "CAPABILITY_VERIFIED",

            "C4":
                "ARMORIQ_POLICY_VERIFIED"
        }
    }

# =========================================================
# SIGN + SEND
# =========================================================

@router.post("/sign-and-send")
async def sign_and_send(

    payload: dict
):

    agent_id = payload.get(
        "agent_id"
    )

    request_payload = payload.get(
        "payload"
    )

    action = payload.get(
        "action"
    )

    token = payload.get(
        "token"
    )

    if not agent_id:

        raise HTTPException(

            status_code=400,

            detail="MISSING_AGENT_ID"
        )

    # =====================================================
    # FETCH AGENT FROM MEMORY
    # =====================================================

    agent = AGENT_DB.get(
        agent_id
    )

    if not agent:

        audit_safe(

            agent_id="UNKNOWN",

            action="SIGN_AND_SEND",

            status="FAILED",

            metadata={
                "reason":
                    "AGENT_NOT_FOUND"
            }
        )

        raise HTTPException(

            status_code=404,

            detail="AGENT_NOT_FOUND_IN_MEMORY"
        )

    # =====================================================
    # VERIFY TOKEN
    # =====================================================

    verify_agent_token(
        token
    )

    # =====================================================
    # C2 CAPABILITY CHECK
    # =====================================================

    enforce_capability(

        token=token,

        requested_action=action
    )

    # =====================================================
    # DECRYPT PRIVATE KEY
    # =====================================================

    private_key = decrypt_private_key(

        agent[
            "dilithium_private_key"
        ]
    )

    # =====================================================
    # NONCE + TIMESTAMP
    # =====================================================

    nonce = secrets.token_hex(16)

    timestamp = int(
        time.time()
    )

    # =====================================================
    # SEALED PAYLOAD
    # =====================================================

    payload_dict = {

        "agent_id":
            agent_id,

        "payload":
            request_payload,

        "action":
            action,

        "nonce":
            nonce,

        "timestamp":
            timestamp,

        "token":
            token
    }

    # =====================================================
    # SIGN PAYLOAD
    # =====================================================

    signature = sign_payload(

        private_key,

        payload_dict
    )

    print("\n===================================")
    print(" M3 SIGNED REQUEST CREATED ")
    print("===================================")

    print(
        f"Agent ID: {agent_id}"
    )

    print(
        f"Action: {action}"
    )

    print(
        "[M3] DILITHIUM SIGNATURE GENERATED"
    )

    print("===================================\n")

    # =====================================================
    # SNAKE AUDIT
    # =====================================================

    audit_safe(

        agent_id=agent_id,

        action="SIGNED_REQUEST_CREATED",

        status="SUCCESS",

        metadata={

            "nonce":
                nonce,

            "timestamp":
                timestamp,

            "signed_action":
                action
        }
    )

    return {

        "agent_id":
            agent_id,

        "payload":
            request_payload,

        "action":
            action,

        "nonce":
            nonce,

        "timestamp":
            timestamp,

        "token":
            token,

        "signature":
            signature,

        "status":
            "SIGNED_AND_SEALED"
    }

# =========================================================
# C3 MULTISIG START
# =========================================================

@router.post("/multisig/start")
async def multisig_start(

    payload: dict
):

    token = payload.get(
        "token"
    )

    action_name = payload.get(
        "action_name"
    )

    amount = payload.get(
        "amount"
    )

    result = create_multisig_action(

        token=token,

        action_name=action_name,

        amount=amount
    )

    audit_safe(

        agent_id=result["agent_id"],

        action="MULTISIG_START",

        status="WAITING_SECOND_APPROVER",

        metadata={

            "request_id":
                result["request_id"],

            "amount":
                amount
        }
    )

    return {

        "status":
            "WAITING_SECOND_APPROVER",

        "multisig":
            result
    }

# =========================================================
# C3 MULTISIG APPROVE
# =========================================================

@router.post("/multisig/approve")
async def multisig_approve(

    payload: dict
):

    request_id = payload.get(
        "request_id"
    )

    result = approve_multisig_action(
        request_id
    )

    audit_safe(

        agent_id=result["agent_id"],

        action="MULTISIG_APPROVE",

        status=result["status"],

        metadata={
            "request_id": request_id
        }
    )

    return {

        "status":
            result["status"],

        "multisig":
            result
    }

# =========================================================
# C5 CHECKPOINT
# =========================================================

@router.post("/checkpoint")
async def checkpoint(

    payload: dict
):

    token = payload.get(
        "token"
    )

    step_name = payload.get(
        "step_name"
    )

    result = checkpoint_validate(

        token=token,

        step_name=step_name
    )

    audit_safe(

        agent_id=result["agent_id"],

        action="CHECKPOINT",

        status="PASSED",

        metadata={
            "step":
                step_name
        }
    )

    return result

# =========================================================
# C6 EXPIRY DEMO
# =========================================================

@router.post("/simulate-expiry")
async def simulate_expiry(

    payload: dict
):

    token = payload.get(
        "token"
    )

    checkpoint_validate(

        token,

        "STEP_1_INITIALIZED"
    )

    print(
        "[C6] WAITING FOR TOKEN EXPIRY..."
    )

    await asyncio.sleep(10)

    checkpoint_validate(

        token,

        "STEP_2_EXECUTION"
    )

    return {

        "status":
            "TASK_COMPLETED"
    }

# =========================================================
# C7 TRIBUNAL
# =========================================================

@router.post("/tribunal-demo")
async def tribunal_demo(

    payload: dict
):

    token = payload.get(
        "token"
    )

    attempted_action = payload.get(
        "attempted_action"
    )

    decoded = verify_agent_token(
        token
    )

    tribunal = build_tribunal_record(

        payload=decoded,

        action=attempted_action,

        decision="BLOCKED",

        reason="OUT_OF_SCOPE_ACTION"
    )

    audit_safe(

        agent_id=decoded["agent_id"],

        action="TRIBUNAL_GENERATED",

        status="BLOCKED",

        metadata={
            "attempted_action":
                attempted_action
        }
    )

    return {

        "status":
            "TRIBUNAL_GENERATED",

        "tribunal":
            tribunal
    }

# =========================================================
# VERIFY TOKEN
# =========================================================

@router.post("/verify-token")
async def verify_token(

    payload: dict
):

    token = payload.get(
        "token"
    )

    decoded = verify_agent_token(
        token
    )

    return {

        "valid":
            True,

        "payload":
            decoded
    }

# =========================================================
# M4 BLACKLIST
# =========================================================

@router.post("/blacklist-agent")
async def blacklist_route(

    payload: dict
):

    agent_id = payload.get(
        "agent_id"
    )

    if not agent_id:

        raise HTTPException(

            status_code=400,

            detail="MISSING_AGENT_ID"
        )

    result = blacklist_agent(
        agent_id
    )

    audit_safe(

        agent_id=agent_id,

        action="BLACKLIST_AGENT",

        status="BLOCKED"
    )

    return result

# =========================================================
# S1 S2 S3 VERIFY CHAIN
# =========================================================

@router.get("/verify-chain")
async def verify_chain():

    if not AUDIT_AVAILABLE:

        raise HTTPException(

            status_code=503,

            detail="SNAKE_NOT_READY"
        )

    result = get_audit_chain_status()

    return result

# =========================================================
# C3 APPROVER REGISTRATION
# =========================================================

@router.post(
    "/approvers/register",
    response_model=ApproverRegisterResponse
)
def approver_register(
    payload: ApproverRegisterRequest
):

    print("\n===================================")
    print("C3 — APPROVER REGISTRATION")
    print("===================================")

    result = register_approver(
        role=payload.role,
        dilithium_public_key=payload.dilithium_public_key,
        sector_permissions=payload.sector_permissions
    )

    print(f"Approver ID: {result['user_id']}")
    print(f"Role: {result['role']}")
    print("===================================\n")

    return result

# =========================================================
# C3 MULTISIG STATUS (REAL)
# =========================================================

@router.get("/multisig/status/{task_id}")
async def multisig_status(task_id: str):

    print("\n===================================")
    print("C3 — MULTISIG STATUS CHECK")
    print("===================================")

    print(f"Task ID: {task_id}")

    result = get_pending_action_status(task_id)

    print(f"Status: {result['execution_status']}")
    print(f"Approvals: {result['current_approvals']}/{result['required_approvals']}")
    print("===================================\n")

    return result

# =========================================================
# C3 MULTISIG START (UPGRADED TO REAL)
# =========================================================

@router.post(
    "/multisig/start-real",
    response_model=MultisigStartResponse
)
async def multisig_start_real(payload: dict):

    token = payload.get("token")
    action_name = payload.get("action_name")
    amount = payload.get("amount")
    sector = payload.get("sector", "banking")

    # Verify token to get agent_id
    decoded = verify_agent_token(token)
    agent_id = decoded["agent_id"]

    print("\n===================================")
    print("C3 — MULTISIG START (REAL)")
    print("===================================")

    print(f"Agent: {agent_id}")
    print(f"Action: {action_name}")
    print(f"Amount: {amount}")

    # Create pending action (with Supabase persistence)
    result = create_pending_action(
        action_type=action_name,
        sector=sector,
        agent_id=agent_id,
        risk_score=payload.get("risk_score", 0),
        trust_score=decoded.get("trust_score", 100),
        payload={"amount": amount},
        expires_minutes=10
    )

    audit_safe(
        agent_id=agent_id,
        action="MULTISIG_START_REAL",
        status="PENDING_APPROVAL",
        metadata={
            "task_id": result["task_id"],
            "required_approvals": result["required_approvals"]
        }
    )

    print("===================================\n")

    return result

# =========================================================
# C3 MULTISIG APPROVE (UPGRADED TO REAL)
# =========================================================

@router.post(
    "/multisig/approve-real",
    response_model=dict
)
async def multisig_approve_real(payload: MultisigApproveRequest):

    print("\n===================================")
    print("C3 — MULTISIG APPROVE (REAL)")
    print("===================================")

    # Submit signature and verify
    result = submit_approval_signature(
        task_id=payload.task_id,
        approver_id=payload.approver_id,
        signature=payload.signature
    )

    audit_safe(
        agent_id="approval",
        action="MULTISIG_APPROVE_REAL",
        status=result["status"],
        metadata={
            "task_id": payload.task_id,
            "approvals": f"{result['current_approvals']}/{result['required_approvals']}"
        }
    )

    print("===================================\n")

    return {
        "status": result["status"],
        "multisig": result
    }