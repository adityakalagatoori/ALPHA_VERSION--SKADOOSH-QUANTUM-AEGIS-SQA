import time
from datetime import datetime

from po.po_models import (
    POAgentRequest,
    PipelineStepResult,
    POStatus,
    WarriorModule
)

from core.security_event_bus import (
    emit_security_event
)

from services.tigress_service import (
    analyze_request as tigress_scan_request
)

from services.po_integrations import (

    execute_monkey_check,

    execute_crane_check,

    execute_snake_check,

    execute_mantis_check
)

from services.trust_score_service import (
    update_trust_score
)


# =========================================================
# PIPELINE STEP CREATOR
# =========================================================

async def create_pipeline_step(
    module: WarriorModule,
    passed: bool,
    risk_score: float,
    reason: str = None,
    telemetry: dict = None,
    execution_time_ms: float = 0
):

    status = (
        POStatus.PASSED
        if passed
        else POStatus.FAILED
    )

    step = PipelineStepResult(

        module=module,

        status=status,

        passed=passed,

        risk_score=risk_score,

        reason=reason,

        telemetry=telemetry or {},

        execution_time_ms=execution_time_ms
    )

    # =====================================================
    # REALTIME EVENT
    # =====================================================

    await emit_security_event({

        "event_type":
            "po_pipeline_step",

        "module":
            module.value,

        "status":
            status.value,

        "passed":
            passed,

        "risk_score":
            risk_score,

        "reason":
            reason,

        "timestamp":
            datetime.utcnow().isoformat()
    })

    return step


# =========================================================
# MAIN PO PIPELINE
# =========================================================

async def execute_po_pipeline(
    request: POAgentRequest
):

    steps = []

    overall_risk_score = 0.0

    honeypot_redirected = False

    failed_at = None

    failure_reason = None

    # =====================================================
    # TIGRESS
    # =====================================================

    tigress_start = time.time()

    tigress_result = await run_tigress(
        request
    )

    tigress_time = round(
        (time.time() - tigress_start) * 1000,
        2
    )

    tigress_step = await create_pipeline_step(

        module=WarriorModule.TIGRESS,

        passed=tigress_result["passed"],

        risk_score=tigress_result["risk_score"],

        reason=tigress_result.get("reason"),

        telemetry=tigress_result,

        execution_time_ms=tigress_time
    )

    steps.append(tigress_step)

    overall_risk_score += tigress_result[
        "risk_score"
    ]

    if not tigress_result["passed"]:

        failed_at = WarriorModule.TIGRESS

        failure_reason = tigress_result.get(
            "reason",
            "TIGRESS BLOCKED"
        )

        if tigress_result["risk_score"] >= 90:

            honeypot_redirected = True

        return await build_failure_response(

            request=request,

            steps=steps,

            risk_score=overall_risk_score,

            failed_at=failed_at,

            reason=failure_reason,

            honeypot_redirected=honeypot_redirected
        )

    # =====================================================
    # MONKEY
    # =====================================================

    monkey_start = time.time()

    monkey_result = await run_monkey(
        request
    )

    monkey_time = round(
        (time.time() - monkey_start) * 1000,
        2
    )

    monkey_step = await create_pipeline_step(

        module=WarriorModule.MONKEY,

        passed=monkey_result["passed"],

        risk_score=monkey_result["risk_score"],

        reason=monkey_result.get("reason"),

        telemetry=monkey_result,

        execution_time_ms=monkey_time
    )

    steps.append(monkey_step)

    overall_risk_score += monkey_result[
        "risk_score"
    ]

    if not monkey_result["passed"]:

        failed_at = WarriorModule.MONKEY

        failure_reason = monkey_result.get(
            "reason",
            "MONKEY BLOCKED"
        )

        return await build_failure_response(

            request=request,

            steps=steps,

            risk_score=overall_risk_score,

            failed_at=failed_at,

            reason=failure_reason
        )

    # =====================================================
    # CRANE
    # =====================================================

    crane_start = time.time()

    crane_result = await run_crane(
        request
    )

    crane_time = round(
        (time.time() - crane_start) * 1000,
        2
    )

    crane_step = await create_pipeline_step(

        module=WarriorModule.CRANE,

        passed=crane_result["passed"],

        risk_score=crane_result["risk_score"],

        reason=crane_result.get("reason"),

        telemetry=crane_result,

        execution_time_ms=crane_time
    )

    steps.append(crane_step)

    overall_risk_score += crane_result[
        "risk_score"
    ]

    if not crane_result["passed"]:

        failed_at = WarriorModule.CRANE

        failure_reason = crane_result.get(
            "reason",
            "CRANE BLOCKED"
        )

        return await build_failure_response(

            request=request,

            steps=steps,

            risk_score=overall_risk_score,

            failed_at=failed_at,

            reason=failure_reason
        )

    # =====================================================
    # SNAKE
    # =====================================================

    snake_start = time.time()

    snake_result = await run_snake(
        request
    )

    snake_time = round(
        (time.time() - snake_start) * 1000,
        2
    )

    snake_step = await create_pipeline_step(

        module=WarriorModule.SNAKE,

        passed=snake_result["passed"],

        risk_score=snake_result["risk_score"],

        reason=snake_result.get("reason"),

        telemetry=snake_result,

        execution_time_ms=snake_time
    )

    steps.append(snake_step)

    overall_risk_score += snake_result[
        "risk_score"
    ]

    if not snake_result["passed"]:

        failed_at = WarriorModule.SNAKE

        failure_reason = snake_result.get(
            "reason",
            "SNAKE BLOCKED"
        )

        return await build_failure_response(

            request=request,

            steps=steps,

            risk_score=overall_risk_score,

            failed_at=failed_at,

            reason=failure_reason
        )

    # =====================================================
    # MANTIS
    # =====================================================

    mantis_start = time.time()

    mantis_result = await run_mantis(
        request
    )

    mantis_time = round(
        (time.time() - mantis_start) * 1000,
        2
    )

    mantis_step = await create_pipeline_step(

        module=WarriorModule.MANTIS,

        passed=mantis_result["passed"],

        risk_score=mantis_result["risk_score"],

        reason=mantis_result.get("reason"),

        telemetry=mantis_result,

        execution_time_ms=mantis_time
    )

    steps.append(mantis_step)

    overall_risk_score += mantis_result[
        "risk_score"
    ]

    if not mantis_result["passed"]:

        failed_at = WarriorModule.MANTIS

        failure_reason = mantis_result.get(
            "reason",
            "MANTIS BLOCKED"
        )

        if mantis_result["risk_score"] >= 90:

            honeypot_redirected = True

        return await build_failure_response(

            request=request,

            steps=steps,

            risk_score=overall_risk_score,

            failed_at=failed_at,

            reason=failure_reason,

            honeypot_redirected=honeypot_redirected
        )

    # =====================================================
    # TRUST SCORE UPDATE
    # =====================================================

    trust = await update_trust_score(

        agent_id=request.agent_id,

        risk_score=overall_risk_score,

        success=True
    )

    # =====================================================
    # FINAL SUCCESS
    # =====================================================

    await emit_security_event({

        "event_type":
            "po_request_delivered",

        "agent_id":
            request.agent_id,

        "request_id":
            request.request_id,

        "risk_score":
            overall_risk_score,

        "timestamp":
            datetime.utcnow().isoformat()
    })

    return {

        "steps":
            steps,

        "overall_risk_score":
            round(overall_risk_score, 2),

        "completed_at":
            datetime.utcnow(),

        "final_status":
            POStatus.DELIVERED,

        "failed_at":
            None,

        "reason":
            None,

        "honeypot_redirected":
            False,

        "trust_score":
            trust.trust_score
    }


# =========================================================
# FAILURE RESPONSE
# =========================================================

async def build_failure_response(

    request,

    steps,

    risk_score,

    failed_at,

    reason,

    honeypot_redirected=False
):

    trust = await update_trust_score(

        agent_id=request.agent_id,

        risk_score=risk_score,

        success=False,

        honeypot=honeypot_redirected,

        anomaly=(risk_score >= 70)
    )

    await emit_security_event({

        "event_type":
            "po_request_killed",

        "agent_id":
            request.agent_id,

        "request_id":
            request.request_id,

        "failed_at":
            failed_at.value,

        "reason":
            reason,

        "risk_score":
            risk_score,

        "honeypot_redirected":
            honeypot_redirected,

        "timestamp":
            datetime.utcnow().isoformat()
    })

    return {

        "steps":
            steps,

        "overall_risk_score":
            round(risk_score, 2),

        "completed_at":
            datetime.utcnow(),

        "final_status":
            POStatus.KILLED,

        "failed_at":
            failed_at,

        "reason":
            reason,

        "honeypot_redirected":
            honeypot_redirected,

        "trust_score":
            trust.trust_score
    }


# =========================================================
# TIGRESS
# =========================================================

async def run_tigress(
    request: POAgentRequest
):

    try:

        result = await tigress_scan_request(
            session_id=request.session_id,
            agent_id=request.agent_id,
            payload=request.payload
        )

        blocked = result.get(
            "blocked",
            False
        )

        return {

            "passed":
                not blocked,

            "risk_score":
                result.get(
                    "risk_score",
                    0
                ),

            "reason":
                result.get(
                    "reason"
                ),

            "telemetry":
                result
        }

    except Exception as e:

        return {

            "passed":
                False,

            "risk_score":
                95,

            "reason":
                f"TIGRESS FAILURE: {str(e)}"
        }


# =========================================================
# MONKEY
# =========================================================

async def run_monkey(
    request: POAgentRequest
):

    return await execute_monkey_check(

        agent_id=request.agent_id,

        signature=request.signature
    )


# =========================================================
# CRANE
# =========================================================

async def run_crane(
    request: POAgentRequest
):

    return await execute_crane_check(

        agent_id=request.agent_id,

        action=request.action,

        jwt_token=request.jwt_token
    )


# =========================================================
# SNAKE
# =========================================================

async def run_snake(
    request: POAgentRequest
):

    return await execute_snake_check()


# =========================================================
# MANTIS
# =========================================================

async def run_mantis(
    request: POAgentRequest
):

    return await execute_mantis_check(

        agent_id=request.agent_id,

        action=request.action,

        payload=request.payload
    )