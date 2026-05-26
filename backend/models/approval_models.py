from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# =========================================================
# APPROVER REGISTRATION
# =========================================================

class ApproverRegisterRequest(BaseModel):
    role: str
    dilithium_public_key: str
    sector_permissions: List[str]

class ApproverRegisterResponse(BaseModel):
    user_id: str
    role: str
    created_at: str

# =========================================================
# MULTISIG APPROVAL
# =========================================================

class MultisigApproveRequest(BaseModel):
    task_id: str
    approver_id: str
    signature: str

class MultisigApproveResponse(BaseModel):
    status: str
    task_id: str
    current_approvals: int
    required_approvals: int
    verified: bool

# =========================================================
# PENDING ACTION STATUS
# =========================================================

class PendingActionStatus(BaseModel):
    task_id: str
    action_type: str
    sector: str
    agent_id: str
    execution_status: str
    current_approvals: int
    required_approvals: int
    approvals: Optional[List[dict]] = None
    expires_at: str
    created_at: str

class MultisigStartResponse(BaseModel):
    task_id: str
    action_type: str
    sector: str
    execution_status: str
    required_approvals: int
    expires_at: str
