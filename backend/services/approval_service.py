import uuid
import base64
import oqs
from datetime import datetime, timedelta
from fastapi import HTTPException

from db.supabase import supabase

# =========================================================
# HIGH-VALUE ACTIONS CONFIG
# =========================================================

HIGH_VALUE_ACTIONS = {
    "transfer_funds": 2,
    "delete_records": 2,
    "admin_override": 3,
    "rotate_keys": 3,
    "approve_payment": 2,
    "shutdown_agent": 3,
    "export_sensitive_data": 2
}

SIGNATURE_ALGO = "ML-DSA-65"

# =========================================================
# C3 APPROVER REGISTRATION
# =========================================================

def register_approver(
    role: str,
    dilithium_public_key: str,
    sector_permissions: list
):
    """
    Register a new approver in Supabase.
    Approvers are separate user accounts, not agents.
    """

    user_id = str(uuid.uuid4())

    print("\n===================================")
    print(" C3 APPROVER REGISTRATION ")
    print("===================================")

    print(f"User ID: {user_id}")
    print(f"Role: {role}")
    print(f"Sector Permissions: {sector_permissions}")
    print(f"Dilithium Key (first 100 chars): {dilithium_public_key[:100]}...")

    try:
        result = supabase.table("approvers").insert({
            "user_id": user_id,
            "role": role,
            "dilithium_public_key": dilithium_public_key,
            "sector_permissions": sector_permissions,
            "is_active": True
        }).execute()

        print(f"[SUPABASE] Approver registered")
        print("===================================\n")

        return {
            "user_id": user_id,
            "role": role,
            "created_at": datetime.utcnow().isoformat()
        }

    except Exception as db_error:
        print(f"[DB ERROR] {db_error}")
        print("===================================\n")

        raise HTTPException(
            status_code=500,
            detail="APPROVER_REGISTRATION_FAILED"
        )

# =========================================================
# C3 CREATE PENDING ACTION
# =========================================================

def create_pending_action(
    action_type: str,
    sector: str,
    agent_id: str,
    risk_score: float = 0,
    trust_score: float = 100,
    payload: dict = None,
    expires_minutes: int = 10
):
    """
    Create a pending action that requires approval(s).
    High-value actions require multiple signatures.
    """

    task_id = str(uuid.uuid4())

    # Determine required approvals based on action type
    required_approvals = HIGH_VALUE_ACTIONS.get(
        action_type,
        1  # default to 1 if not in high-value list
    )

    expires_at = (
        datetime.utcnow() + timedelta(minutes=expires_minutes)
    ).isoformat()

    print("\n===================================")
    print(" C3 PENDING ACTION CREATED ")
    print("===================================")

    print(f"Task ID: {task_id}")
    print(f"Action: {action_type}")
    print(f"Sector: {sector}")
    print(f"Agent: {agent_id}")
    print(f"Required Approvals: {required_approvals}")
    print(f"Expires: {expires_at}")

    try:
        result = supabase.table("pending_actions").insert({
            "task_id": task_id,
            "action_type": action_type,
            "sector": sector,
            "agent_id": agent_id,
            "risk_score": risk_score,
            "trust_score": trust_score,
            "required_approvals": required_approvals,
            "current_approvals": 0,
            "execution_status": "PENDING_APPROVAL",
            "payload": payload or {},
            "expires_at": expires_at
        }).execute()

        print("[SUPABASE] Action pending approval")
        print("===================================\n")

        return {
            "task_id": task_id,
            "action_type": action_type,
            "sector": sector,
            "execution_status": "PENDING_APPROVAL",
            "required_approvals": required_approvals,
            "expires_at": expires_at
        }

    except Exception as db_error:
        print(f"[DB ERROR] {db_error}")
        print("===================================\n")

        raise HTTPException(
            status_code=500,
            detail="PENDING_ACTION_CREATION_FAILED"
        )

# =========================================================
# C3 VERIFY APPROVER DILITHIUM SIGNATURE
# =========================================================

def verify_approver_signature(
    public_key_b64: str,
    task_id: str,
    approver_id: str,
    signature_b64: str
):
    """
    Verify Dilithium signature from approver.
    Message format: "{task_id}:{approver_id}"
    """

    try:
        message = f"{task_id}:{approver_id}".encode()

        # Decode keys from base64
        public_key = base64.b64decode(public_key_b64)
        signature = base64.b64decode(signature_b64)

        # Verify with liboqs Dilithium
        with oqs.Signature(SIGNATURE_ALGO) as verifier:
            is_valid = verifier.verify(
                message,
                signature,
                public_key
            )

        print(f"[C3] Signature verification: {'PASSED' if is_valid else 'FAILED'}")

        return is_valid

    except Exception as e:
        print(f"[C3 ERROR] Signature verification failed: {e}")
        return False

# =========================================================
# C3 SUBMIT APPROVAL SIGNATURE
# =========================================================

def submit_approval_signature(
    task_id: str,
    approver_id: str,
    signature: str
):
    """
    Submit and verify an approver's signature.
    Updates task status to APPROVED if enough sigs collected.
    """

    print("\n===================================")
    print(" C3 APPROVAL SIGNATURE SUBMITTED ")
    print("===================================")

    print(f"Task ID: {task_id}")
    print(f"Approver ID: {approver_id}")

    # Fetch pending action
    try:
        action_response = supabase.table(
            "pending_actions"
        ).select("*").eq("task_id", task_id).execute()

        if not action_response.data:
            raise HTTPException(
                status_code=404,
                detail="TASK_NOT_FOUND"
            )

        action = action_response.data[0]

    except Exception as e:
        print(f"[DB ERROR] {e}")
        raise HTTPException(
            status_code=500,
            detail="TASK_FETCH_FAILED"
        )

    # Fetch approver details
    try:
        approver_response = supabase.table(
            "approvers"
        ).select("*").eq("user_id", approver_id).execute()

        if not approver_response.data:
            raise HTTPException(
                status_code=404,
                detail="APPROVER_NOT_FOUND"
            )

        approver = approver_response.data[0]

    except Exception as e:
        print(f"[DB ERROR] {e}")
        raise HTTPException(
            status_code=500,
            detail="APPROVER_FETCH_FAILED"
        )

    # Verify signature
    is_valid = verify_approver_signature(
        public_key_b64=approver["dilithium_public_key"],
        task_id=task_id,
        approver_id=approver_id,
        signature_b64=signature
    )

    if not is_valid:
        print("[C3] SIGNATURE VERIFICATION FAILED")
        print("===================================\n")

        raise HTTPException(
            status_code=401,
            detail="SIGNATURE_VERIFICATION_FAILED"
        )

    # Store approval in action_approvals table
    try:
        supabase.table("action_approvals").insert({
            "task_id": task_id,
            "approver_id": approver_id,
            "signature": signature,
            "verified": True
        }).execute()

        print("[SUPABASE] Signature stored and verified")

    except Exception as db_error:
        print(f"[DB ERROR] {db_error}")
        raise HTTPException(
            status_code=500,
            detail="APPROVAL_STORAGE_FAILED"
        )

    # Increment current_approvals
    current_approvals = action["current_approvals"] + 1
    required_approvals = action["required_approvals"]

    new_status = "APPROVED" if current_approvals >= required_approvals else "PENDING_APPROVAL"

    # Update pending_actions
    try:
        supabase.table("pending_actions").update({
            "current_approvals": current_approvals,
            "execution_status": new_status
        }).eq("task_id", task_id).execute()

        print(f"[SUPABASE] Updated approvals: {current_approvals}/{required_approvals}")
        print(f"[SUPABASE] New status: {new_status}")

    except Exception as db_error:
        print(f"[DB ERROR] {db_error}")
        raise HTTPException(
            status_code=500,
            detail="APPROVAL_UPDATE_FAILED"
        )

    print("===================================\n")

    return {
        "status": new_status,
        "task_id": task_id,
        "current_approvals": current_approvals,
        "required_approvals": required_approvals,
        "verified": True
    }

# =========================================================
# GET PENDING ACTION STATUS
# =========================================================

def get_pending_action_status(task_id: str):
    """
    Fetch pending action status and list of current approvals.
    """

    try:
        # Fetch action
        action_response = supabase.table(
            "pending_actions"
        ).select("*").eq("task_id", task_id).execute()

        if not action_response.data:
            raise HTTPException(
                status_code=404,
                detail="TASK_NOT_FOUND"
            )

        action = action_response.data[0]

        # Fetch approvals for this task
        approvals_response = supabase.table(
            "action_approvals"
        ).select("*").eq("task_id", task_id).execute()

        approvals = [
            {
                "approver_id": a["approver_id"],
                "verified": a["verified"],
                "approved_at": a["approved_at"]
            }
            for a in approvals_response.data
        ]

        return {
            "task_id": task_id,
            "action_type": action["action_type"],
            "sector": action["sector"],
            "agent_id": action["agent_id"],
            "execution_status": action["execution_status"],
            "current_approvals": action["current_approvals"],
            "required_approvals": action["required_approvals"],
            "approvals": approvals,
            "expires_at": action["expires_at"],
            "created_at": action["created_at"]
        }

    except HTTPException:
        raise

    except Exception as e:
        print(f"[DB ERROR] {e}")
        raise HTTPException(
            status_code=500,
            detail="STATUS_FETCH_FAILED"
        )
