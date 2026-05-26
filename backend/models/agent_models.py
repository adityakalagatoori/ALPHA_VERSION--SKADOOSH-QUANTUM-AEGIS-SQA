from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# =========================================================
# REGISTER REQUEST
# =========================================================

class AgentRegisterRequest(BaseModel):

    name: str

    sector: str

    allowed_actions: List[str]

# =========================================================
# REGISTER RESPONSE
# =========================================================

class AgentRegisterResponse(BaseModel):

    agent_id: str

    kyber_algorithm: str

    dilithium_algorithm: str

    kyber_public_key: str

    dilithium_public_key: str

    token: str

    allowed_actions: List[str]

# =========================================================
# JWT TOKEN PAYLOAD
# =========================================================

class AgentTokenPayload(BaseModel):

    agent_id: str

    name: str

    sector: str

    allowed_actions: List[str]

# =========================================================
# C2 — ACTION REQUEST
# =========================================================

class AgentActionRequest(BaseModel):

    token: str

    action: str

# =========================================================
# C2 — ACTION RESPONSE
# =========================================================

class AgentActionResponse(BaseModel):

    status: str

    action: str

    message: str

# =========================================================
# C3 — MULTISIG REQUEST
# =========================================================

class MultiSigRequest(BaseModel):

    token: str

    action_name: str

    amount: float

# =========================================================
# C3 — MULTISIG APPROVAL
# =========================================================

class MultiSigApprovalRequest(BaseModel):

    request_id: str

# =========================================================
# C3 — MULTISIG RESPONSE
# =========================================================

class MultiSigResponse(BaseModel):

    request_id: str

    status: str

    signatures: int

    required_signatures: int

# =========================================================
# C5 — CHECKPOINT REQUEST
# =========================================================

class CheckpointRequest(BaseModel):

    token: str

    step_name: str

# =========================================================
# C5 — CHECKPOINT RESPONSE
# =========================================================

class CheckpointResponse(BaseModel):

    status: str

    step: str

    agent_id: str

# =========================================================
# C7 — TRIBUNAL RESPONSE
# =========================================================

class TribunalResponse(BaseModel):

    agent_id: str

    action: str

    decision: str

    reason: str

    confidence: float

    explanation: Dict[str, Any]

    timestamp: str

# =========================================================
# C4 — ARMORIQ POLICY RESPONSE
# =========================================================

class ArmorIQPolicyResponse(BaseModel):

    status: str

    policy_gate: str

    action: str

    verified: bool

# =========================================================
# TOKEN VERIFY RESPONSE
# =========================================================

class TokenVerifyResponse(BaseModel):

    valid: bool

    payload: Dict[str, Any]

# =========================================================
# C6 — EXPIRED TOKEN RESPONSE
# =========================================================

class ExpiredTokenResponse(BaseModel):

    message: str

    failed_step: str

# =========================================================
# CRANE SECURITY STATUS
# =========================================================

class CraneSecurityStatus(BaseModel):

    c1: str

    c2: str

    c3: str

    c4: str

    c5: str

    c6: str

    c7: str

# =========================================================
# FULL AGENT SECURITY RESPONSE
# =========================================================

class FullAgentSecurityResponse(BaseModel):

    agent_id: str

    token: str

    allowed_actions: List[str]

    crane_security: CraneSecurityStatus