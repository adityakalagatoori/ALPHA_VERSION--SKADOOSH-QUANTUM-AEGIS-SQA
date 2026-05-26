from datetime import datetime

# =========================================================
# MONKEY
# =========================================================

try:

    from services.monkey_service import (

        verify_agent_identity,

        is_agent_blacklisted
    )

    MONKEY_AVAILABLE = True

except Exception as e:

    print("[PO] MONKEY INTEGRATION FAILED")
    print(e)

    MONKEY_AVAILABLE = False

# =========================================================
# CRANE
# =========================================================

try:

    from services.crane_service import (

        validate_agent_scope
    )

    CRANE_AVAILABLE = True

except Exception as e:

    print("[PO] CRANE INTEGRATION FAILED")
    print(e)

    CRANE_AVAILABLE = False

# =========================================================
# SNAKE
# =========================================================

try:

    from services.snake_service import (

        verify_audit_chain
    )

    SNAKE_AVAILABLE = True

except Exception as e:

    print("[PO] SNAKE INTEGRATION FAILED")
    print(e)

    SNAKE_AVAILABLE = False

# =========================================================
# MANTIS
# =========================================================

try:

    from services.mantis_service import (

        analyze_agent_behavior
    )

    MANTIS_AVAILABLE = True

except Exception as e:

    print("[PO] MANTIS INTEGRATION FAILED")
    print(e)

    MANTIS_AVAILABLE = False


# =========================================================
# MONKEY EXECUTION
# =========================================================

async def execute_monkey_check(
    agent_id: str,
    signature: str
):

    if not MONKEY_AVAILABLE:

        return {
            "passed": False,
            "risk_score": 95,
            "reason": "MONKEY unavailable"
        }

    try:

        # =================================================
        # BLACKLIST CHECK
        # =================================================

        blacklisted = await is_agent_blacklisted(
            agent_id
        )

        if blacklisted:

            return {
                "passed": False,
                "risk_score": 100,
                "reason": "Agent blacklisted"
            }

        # =================================================
        # SIGNATURE VERIFY
        # =================================================

        verified = await verify_agent_identity(
            agent_id,
            signature
        )

        if not verified:

            return {
                "passed": False,
                "risk_score": 90,
                "reason": "Signature verification failed"
            }

        return {
            "passed": True,
            "risk_score": 5,
            "reason": "Identity verified"
        }

    except Exception as e:

        return {
            "passed": False,
            "risk_score": 95,
            "reason": str(e)
        }


# =========================================================
# CRANE EXECUTION
# =========================================================

async def execute_crane_check(
    agent_id: str,
    action: str,
    jwt_token: str
):

    if not CRANE_AVAILABLE:

        return {
            "passed": False,
            "risk_score": 90,
            "reason": "CRANE unavailable"
        }

    try:

        result = await validate_agent_scope(

            agent_id=agent_id,

            action=action,

            jwt_token=jwt_token
        )

        if not result.get("allowed"):

            return {
                "passed": False,
                "risk_score": 85,
                "reason": result.get(
                    "reason",
                    "Out of scope"
                )
            }

        return {
            "passed": True,
            "risk_score": 5,
            "reason": "Scope validated"
        }

    except Exception as e:

        return {
            "passed": False,
            "risk_score": 95,
            "reason": str(e)
        }


# =========================================================
# SNAKE EXECUTION
# =========================================================

async def execute_snake_check():

    if not SNAKE_AVAILABLE:

        return {
            "passed": False,
            "risk_score": 90,
            "reason": "SNAKE unavailable"
        }

    try:

        result = await verify_audit_chain()

        if not result.get("valid"):

            return {
                "passed": False,
                "risk_score": 90,
                "reason": "Audit chain tampered"
            }

        return {
            "passed": True,
            "risk_score": 5,
            "reason": "Audit chain verified"
        }

    except Exception as e:

        return {
            "passed": False,
            "risk_score": 95,
            "reason": str(e)
        }


# =========================================================
# MANTIS EXECUTION
# =========================================================

async def execute_mantis_check(
    agent_id: str,
    action: str,
    payload: dict
):

    if not MANTIS_AVAILABLE:

        return {
            "passed": False,
            "risk_score": 90,
            "reason": "MANTIS unavailable"
        }

    try:

        result = await analyze_agent_behavior({

            "agent_id":
                agent_id,

            "action":
                action,

            "payload":
                payload
        })

        risk_score = result.get(
            "risk_score",
            0
        )

        # ================================================
        # HONEYPOT THRESHOLD
        # ================================================

        if risk_score >= 90:

            return {
                "passed": False,
                "risk_score": risk_score,
                "reason": "HONEYPOT_REDIRECT"
            }

        # ================================================
        # ALERT THRESHOLD
        # ================================================

        if risk_score >= 70:

            return {
                "passed": True,
                "risk_score": risk_score,
                "reason": "HIGH_RISK"
            }

        return {
            "passed": True,
            "risk_score": risk_score,
            "reason": "Behavior normal"
        }

    except Exception as e:

        return {
            "passed": False,
            "risk_score": 95,
            "reason": str(e)
        }