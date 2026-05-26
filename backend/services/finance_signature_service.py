import uuid
from datetime import datetime
from typing import Dict, Any
import numpy as np

from po.po_models import (
    FinancialActionRequest,
    ValidatorSignature
)

from po.po_bft import (
    create_threshold_signing_request,
    validator_sign,
    verify_consensus
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
# FINANCIAL TRANSACTION STORE
# =========================================================

FINANCIAL_TRANSACTIONS: Dict[
    str,
    FinancialActionRequest
] = {}


# =========================================================
# CREATE FINANCIAL REQUEST
# =========================================================

async def create_financial_request(
    from_account: str,
    to_account: str,
    amount: float,
    initiated_by: str,
    currency: str = "USD"
):

    transaction_id = str(uuid.uuid4())

    transaction = FinancialActionRequest(
        transaction_id=transaction_id,
        from_account=from_account,
        to_account=to_account,
        amount=amount,
        currency=currency,
        initiated_by=initiated_by,
        approvals_required=2,
        approvals_received=[],
        executed=False
    )

    FINANCIAL_TRANSACTIONS[
        transaction_id
    ] = transaction

    # =====================================================
    # CREATE BFT CONSENSUS REQUEST
    # =====================================================

    await create_threshold_signing_request(
        request_id=transaction_id,
        action="financial_transfer",
        payload={
            "from_account": from_account,
            "to_account": to_account,
            "amount": amount,
            "currency": currency
        }
    )

    # =====================================================
    # EMIT EVENT
    # =====================================================

    await emit_security_event({
        "event_type": "po_financial_request_created",
        "transaction_id": transaction_id,
        "from_account": from_account,
        "to_account": to_account,
        "amount": amount,
        "currency": currency,
        "initiated_by": initiated_by,
        "timestamp": datetime.utcnow().isoformat()
    })

    return transaction


# =========================================================
# APPROVE FINANCIAL REQUEST
# =========================================================

async def approve_financial_request(
    transaction_id: str,
    validator_id: str
):

    if (
        transaction_id
        not in FINANCIAL_TRANSACTIONS
    ):

        raise Exception(
            "Financial request not found"
        )

    transaction = FINANCIAL_TRANSACTIONS[
        transaction_id
    ]

    # =====================================================
    # BFT VALIDATOR SIGN
    # =====================================================

    sign_result = await validator_sign(
        transaction_id,
        validator_id
    )

    if not sign_result["success"]:

        return sign_result

    # =====================================================
    # ADD APPROVAL RECORD
    # =====================================================

    validator_signature = ValidatorSignature(
        validator_id=validator_id,
        signature=f"finance_sig_{validator_id}",
        approved=True
    )

    transaction.approvals_received.append(
        validator_signature
    )

    FINANCIAL_TRANSACTIONS[
        transaction_id
    ] = transaction

    # =====================================================
    # EMIT EVENT
    # =====================================================

    await emit_security_event({
        "event_type": "po_financial_approval",
        "transaction_id": transaction_id,
        "validator_id": validator_id,
        "approval_count": len(
            transaction.approvals_received
        ),
        "required": transaction.approvals_required,
        "timestamp": datetime.utcnow().isoformat()
    })

    return {
        "success": True,
        "transaction_id": transaction_id,
        "approval_count": len(
            transaction.approvals_received
        ),
        "required": transaction.approvals_required
    }


# =========================================================
# EXECUTE FINANCIAL REQUEST
# =========================================================

async def execute_financial_request(
    transaction_id: str
):

    if (
        transaction_id
        not in FINANCIAL_TRANSACTIONS
    ):

        raise Exception(
            "Financial request not found"
        )

    transaction = FINANCIAL_TRANSACTIONS[
        transaction_id
    ]

    # =====================================================
    # CHECK APPROVAL COUNT
    # =====================================================

    if (
        len(transaction.approvals_received)
        < transaction.approvals_required
    ):

        await emit_security_event({
            "event_type": "po_finance_execution_blocked",
            "transaction_id": transaction_id,
            "reason": "Insufficient approvals",
            "timestamp": datetime.utcnow().isoformat()
        })

        return {
            "success": False,
            "message": "Not enough approvals"
        }

    # =====================================================
    # VERIFY BFT CONSENSUS
    # =====================================================

    consensus = await verify_consensus(
        transaction_id
    )

    if not consensus["approved"]:

        await emit_security_event({
            "event_type": "po_finance_bft_failed",
            "transaction_id": transaction_id,
            "timestamp": datetime.utcnow().isoformat()
        })

        return {
            "success": False,
            "message": "BFT consensus failed"
        }

    # =====================================================
    # EXECUTE TRANSACTION
    # =====================================================

    transaction.executed = True

    FINANCIAL_TRANSACTIONS[
        transaction_id
    ] = transaction

    # =====================================================
    # EMIT EXECUTION EVENT
    # =====================================================

    await emit_security_event({
        "event_type": "po_financial_executed",
        "transaction_id": transaction_id,
        "amount": transaction.amount,
        "currency": transaction.currency,
        "from_account": transaction.from_account,
        "to_account": transaction.to_account,
        "timestamp": datetime.utcnow().isoformat()
    })

    return {
        "success": True,
        "message": "Financial transaction executed",
        "transaction_id": transaction_id,
        "executed": True
    }


# =========================================================
# GET FINANCIAL REQUEST
# =========================================================

async def get_financial_request(
    transaction_id: str
):

    return FINANCIAL_TRANSACTIONS.get(
        transaction_id
    )


# =========================================================
# GET ALL FINANCIAL REQUESTS
# =========================================================

async def get_all_financial_requests():

    transactions = list(
        FINANCIAL_TRANSACTIONS.values()
    )
    return [
        convert_numpy_types(
            tx.dict() if hasattr(tx, 'dict') else tx
        ) for tx in transactions
    ]


# =========================================================
# VERIFY FINANCIAL REQUEST
# =========================================================

async def verify_financial_request(
    transaction_id: str
):

    if (
        transaction_id
        not in FINANCIAL_TRANSACTIONS
    ):

        return {
            "valid": False,
            "reason": "Transaction not found"
        }

    transaction = FINANCIAL_TRANSACTIONS[
        transaction_id
    ]

    consensus = await verify_consensus(
        transaction_id
    )

    return {
        "valid": consensus["approved"],
        "transaction_id": transaction_id,
        "approval_count": len(
            transaction.approvals_received
        ),
        "required": transaction.approvals_required,
        "executed": transaction.executed
    }


# =========================================================
# CANCEL TRANSACTION
# =========================================================

async def cancel_financial_request(
    transaction_id: str
):

    if (
        transaction_id
        in FINANCIAL_TRANSACTIONS
    ):

        del FINANCIAL_TRANSACTIONS[
            transaction_id
        ]

    await emit_security_event({
        "event_type": "po_financial_cancelled",
        "transaction_id": transaction_id,
        "timestamp": datetime.utcnow().isoformat()
    })

    return {
        "success": True
    }


# =========================================================
# DEMO FLOW
# =========================================================

async def demo_finance_flow():

    transaction = await create_financial_request(
        from_account="BANK_A",
        to_account="BANK_B",
        amount=500000,
        initiated_by="finance_agent"
    )

    await approve_financial_request(
        transaction.transaction_id,
        "validator_1"
    )

    await approve_financial_request(
        transaction.transaction_id,
        "validator_2"
    )

    await approve_financial_request(
        transaction.transaction_id,
        "validator_3"
    )

    result = await execute_financial_request(
        transaction.transaction_id
    )

    return result