from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

from po.po_models import (
    POAgentRequest
)

from po.po_gateway import po_gateway

from po.po_bft import (
    create_threshold_signing_request,
    validator_sign,
    verify_consensus,
    get_all_bft_requests
)

from services.trust_score_service import (
    get_agent_trust_score,
    get_all_trust_scores,
    get_high_risk_agents
)

from services.finance_signature_service import (
    create_financial_request,
    approve_financial_request,
    execute_financial_request,
    get_all_financial_requests
)

from services.kyber_service import (
    generate_kyber_keypair,
    encrypt_payload,
    decrypt_payload,
    generate_demo_payload
)


router = APIRouter(
    prefix="/po",
    tags=["PO Dragon Warrior"]
)


# =========================================================
# REQUEST MODELS
# =========================================================

class EncryptRequest(BaseModel):
    plaintext: str
    public_key: str


class DecryptRequest(BaseModel):
    ciphertext: str
    encrypted_payload: str
    secret_key: str


class ValidatorApproveRequest(BaseModel):
    validator_id: str


class FinanceRequest(BaseModel):
    from_account: str
    to_account: str
    amount: float
    initiated_by: str
    currency: str = "USD"


# =========================================================
# P1 - CENTRAL GATEWAY
# =========================================================

@router.post("/gateway")
async def po_central_gateway(
    request: POAgentRequest
):

    return await po_gateway(request)


# =========================================================
# P4 - KYBER KEYPAIR
# =========================================================

@router.get("/kyber/generate")
async def generate_kyber_keys():

    return generate_kyber_keypair()


# =========================================================
# P4 - ENCRYPT PAYLOAD
# =========================================================

@router.post("/kyber/encrypt")
async def encrypt_po_payload(
    request: EncryptRequest
):

    return encrypt_payload(
        request.plaintext,
        request.public_key
    )


# =========================================================
# P4 - DECRYPT PAYLOAD
# =========================================================

@router.post("/kyber/decrypt")
async def decrypt_po_payload(
    request: DecryptRequest
):

    plaintext = decrypt_payload(
        request.ciphertext,
        request.encrypted_payload,
        request.secret_key
    )

    return {
        "plaintext": plaintext
    }


# =========================================================
# P4 - KYBER DEMO
# =========================================================

@router.get("/kyber/demo")
async def kyber_demo():

    return generate_demo_payload()


# =========================================================
# P5 - CREATE BFT REQUEST
# =========================================================

@router.post("/bft/create")
async def create_bft_request():

    request = await create_threshold_signing_request(
        request_id="bft_demo_request",
        action="critical_action",
        payload={
            "amount": 1000000
        }
    )

    return request


# =========================================================
# P5 - VALIDATOR SIGN
# =========================================================

@router.post("/bft/{request_id}/sign")
async def sign_bft_request(
    request_id: str,
    body: ValidatorApproveRequest
):

    return await validator_sign(
        request_id,
        body.validator_id
    )


# =========================================================
# P5 - VERIFY CONSENSUS
# =========================================================

@router.get("/bft/{request_id}/verify")
async def verify_bft_consensus(
    request_id: str
):

    return await verify_consensus(
        request_id
    )


# =========================================================
# P5 - ALL BFT REQUESTS
# =========================================================

@router.get("/bft/all")
async def all_bft_requests():

    return await get_all_bft_requests()


# =========================================================
# P6 - TRUST SCORE
# =========================================================

@router.get("/trust/{agent_id}")
async def get_trust_score(
    agent_id: str
):

    return await get_agent_trust_score(
        agent_id
    )


# =========================================================
# P6 - ALL TRUST SCORES
# =========================================================

@router.get("/trust/all")
async def all_trust_scores():

    return await get_all_trust_scores()


# =========================================================
# P6 - HIGH RISK AGENTS
# =========================================================

@router.get("/trust/high-risk")
async def high_risk_agents():

    return await get_high_risk_agents()


# =========================================================
# P7 - CREATE FINANCIAL REQUEST
# =========================================================

@router.post("/finance/create")
async def create_finance_request(
    request: FinanceRequest
):

    return await create_financial_request(
        from_account=request.from_account,
        to_account=request.to_account,
        amount=request.amount,
        initiated_by=request.initiated_by,
        currency=request.currency
    )


# =========================================================
# P7 - APPROVE FINANCIAL REQUEST
# =========================================================

@router.post(
    "/finance/{transaction_id}/approve"
)
async def approve_finance_request(
    transaction_id: str,
    body: ValidatorApproveRequest
):

    return await approve_financial_request(
        transaction_id,
        body.validator_id
    )


# =========================================================
# P7 - EXECUTE FINANCIAL REQUEST
# =========================================================

@router.post(
    "/finance/{transaction_id}/execute"
)
async def execute_finance_request(
    transaction_id: str
):

    return await execute_financial_request(
        transaction_id
    )


# =========================================================
# P7 - ALL FINANCIAL REQUESTS
# =========================================================

@router.get("/finance/all")
async def all_financial_requests():

    return await get_all_financial_requests()


# =========================================================
# P8 - LIVE DASHBOARD METRICS
# =========================================================

@router.get("/dashboard/overview")
async def dashboard_overview():

    trust_scores = await get_all_trust_scores()

    finance_requests = (
        await get_all_financial_requests()
    )

    bft_requests = (
        await get_all_bft_requests()
    )

    high_risk = (
        await get_high_risk_agents()
    )

    return {
        "active_agents": len(trust_scores),
        "financial_requests": len(
            finance_requests
        ),
        "bft_requests": len(
            bft_requests
        ),
        "high_risk_agents": len(
            high_risk
        ),
        "system_status": "OPERATIONAL",
        "dragon_warrior": "ACTIVE"
    }


# =========================================================
# HEALTH
# =========================================================

@router.get("/health")
async def po_health():

    return {
        "status": "healthy",
        "service": "PO Dragon Warrior",
        "gateway": "ACTIVE",
        "bft": "ACTIVE",
        "trust_network": "ACTIVE",
        "finance_security": "ACTIVE"
    }