from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


# =========================================================
# ENUMS
# =========================================================

class POStatus(str, Enum):
    PENDING = "PENDING"
    PASSED = "PASSED"
    FAILED = "FAILED"
    DELIVERED = "DELIVERED"
    KILLED = "KILLED"


class WarriorModule(str, Enum):
    TIGRESS = "TIGRESS"
    MONKEY = "MONKEY"
    CRANE = "CRANE"
    SNAKE = "SNAKE"
    MANTIS = "MANTIS"
    PO = "PO"


class SectorType(str, Enum):
    BANKING = "banking"
    HEALTHCARE = "healthcare"
    LEGAL = "legal"
    GOVERNMENT = "government"
    GENERAL = "general"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# =========================================================
# BASE REQUEST
# =========================================================

class POAgentRequest(BaseModel):
    request_id: str = Field(
        default_factory=lambda: str(uuid.uuid4())
    )

    agent_id: str

    session_id: str

    sector: SectorType = SectorType.GENERAL

    action: str

    payload: Dict[str, Any]

    timestamp: datetime = Field(
        default_factory=datetime.utcnow
    )

    signature: Optional[str] = None

    jwt_token: Optional[str] = None

    encrypted: bool = False

    metadata: Optional[Dict[str, Any]] = {}


# =========================================================
# PIPELINE STEP RESULT
# =========================================================

class PipelineStepResult(BaseModel):
    module: WarriorModule

    status: POStatus

    passed: bool

    risk_score: float = 0.0

    confidence: Optional[float] = None

    reason: Optional[str] = None

    execution_time_ms: Optional[float] = None

    telemetry: Optional[Dict[str, Any]] = {}

    timestamp: datetime = Field(
        default_factory=datetime.utcnow
    )


# =========================================================
# PIPELINE EXECUTION
# =========================================================

class POPipelineExecution(BaseModel):
    request_id: str

    agent_id: str

    session_id: str

    current_step: Optional[WarriorModule] = None

    completed_steps: List[PipelineStepResult] = []

    overall_risk_score: float = 0.0

    started_at: datetime = Field(
        default_factory=datetime.utcnow
    )

    completed_at: Optional[datetime] = None

    final_status: POStatus = POStatus.PENDING


# =========================================================
# FINAL VERDICT
# =========================================================

class POVerdict(BaseModel):
    request_id: str

    agent_id: str

    verdict: POStatus

    delivered: bool

    failed_at: Optional[WarriorModule] = None

    reason: Optional[str] = None

    overall_risk_score: float = 0.0

    trust_score: Optional[float] = None

    honeypot_redirected: bool = False

    timestamp: datetime = Field(
        default_factory=datetime.utcnow
    )


# =========================================================
# TRUST SCORE MODEL
# =========================================================

class AgentTrustScore(BaseModel):
    agent_id: str

    trust_score: float = 100.0

    risk_score: float = 0.0

    anomaly_count: int = 0

    blocked_requests: int = 0

    successful_requests: int = 0

    honeypot_redirects: int = 0

    last_updated: datetime = Field(
        default_factory=datetime.utcnow
    )

    sector: SectorType = SectorType.GENERAL


# =========================================================
# BFT VALIDATOR
# =========================================================

class ValidatorSignature(BaseModel):
    validator_id: str

    signature: str

    approved: bool = True

    timestamp: datetime = Field(
        default_factory=datetime.utcnow
    )


# =========================================================
# THRESHOLD SIGNING
# =========================================================

class ThresholdSigningRequest(BaseModel):
    request_id: str

    action: str

    payload_hash: str

    required_signatures: int = 3

    total_validators: int = 5

    validator_signatures: List[ValidatorSignature] = []

    approved: bool = False


# =========================================================
# FINANCIAL SIGNING
# =========================================================

class FinancialActionRequest(BaseModel):
    transaction_id: str

    from_account: str

    to_account: str

    amount: float

    currency: str = "USD"

    initiated_by: str

    approvals_required: int = 2

    approvals_received: List[ValidatorSignature] = []

    executed: bool = False

    timestamp: datetime = Field(
        default_factory=datetime.utcnow
    )


# =========================================================
# TELEMETRY EVENTS
# =========================================================

class POSecurityEvent(BaseModel):
    event_type: str

    request_id: Optional[str] = None

    agent_id: Optional[str] = None

    module: Optional[WarriorModule] = None

    severity: RiskLevel = RiskLevel.LOW

    message: str

    metadata: Dict[str, Any] = {}

    timestamp: datetime = Field(
        default_factory=datetime.utcnow
    )


# =========================================================
# LIVE DASHBOARD METRICS
# =========================================================

class PODashboardMetrics(BaseModel):
    total_requests: int = 0

    delivered_requests: int = 0

    killed_requests: int = 0

    honeypot_redirects: int = 0

    active_agents: int = 0

    average_risk_score: float = 0.0

    average_trust_score: float = 100.0

    active_alerts: int = 0

    last_updated: datetime = Field(
        default_factory=datetime.utcnow
    )


# =========================================================
# HONEYPOT EVENT
# =========================================================

class HoneypotRedirect(BaseModel):
    request_id: str

    agent_id: str

    reason: str

    original_risk_score: float

    redirected_at: datetime = Field(
        default_factory=datetime.utcnow
    )


# =========================================================
# AUDIT VERIFICATION
# =========================================================

class AuditVerificationResult(BaseModel):
    log_id: str

    valid_hash: bool

    valid_signature: bool

    tampered: bool

    verified_at: datetime = Field(
        default_factory=datetime.utcnow
    )


# =========================================================
# PIPELINE RESPONSE
# =========================================================

class POPipelineResponse(BaseModel):
    success: bool

    verdict: POVerdict

    pipeline: POPipelineExecution

    telemetry: List[POSecurityEvent] = []