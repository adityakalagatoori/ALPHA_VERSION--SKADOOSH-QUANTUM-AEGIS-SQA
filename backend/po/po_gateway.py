import time
import traceback
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from po.po_models import (
    POAgentRequest,
    POPipelineExecution,
    POPipelineResponse,
    POVerdict,
    PipelineStepResult,
    POSecurityEvent,
    POStatus,
    WarriorModule,
    RiskLevel
)

from po.po_pipeline import execute_po_pipeline

from core.security_event_bus import emit_security_event


router = APIRouter()


# =========================================================
# MAIN PO GATEWAY
# =========================================================

@router.post("/po-gateway", response_model=POPipelineResponse)
async def po_gateway(request: POAgentRequest):

    start_time = time.time()

    pipeline_execution = POPipelineExecution(
        request_id=request.request_id,
        agent_id=request.agent_id,
        session_id=request.session_id,
        final_status=POStatus.PENDING
    )

    telemetry_events = []

    try:

        # =====================================================
        # EVENT: REQUEST RECEIVED
        # =====================================================

        gateway_event = POSecurityEvent(
            event_type="po_request_received",
            request_id=request.request_id,
            agent_id=request.agent_id,
            module=WarriorModule.PO,
            severity=RiskLevel.LOW,
            message="PO gateway intercepted request",
            metadata={
                "action": request.action,
                "sector": request.sector.value
            }
        )

        telemetry_events.append(gateway_event)

        await emit_security_event(gateway_event.model_dump())

        # =====================================================
        # EXECUTE FULL PIPELINE
        # =====================================================

        pipeline_result = await execute_po_pipeline(request)

        pipeline_execution.completed_steps = pipeline_result["steps"]

        pipeline_execution.overall_risk_score = pipeline_result["overall_risk_score"]

        pipeline_execution.completed_at = pipeline_result["completed_at"]

        pipeline_execution.final_status = pipeline_result["final_status"]

        # =====================================================
        # FINAL VERDICT
        # =====================================================

        delivered = pipeline_result["final_status"] == POStatus.DELIVERED

        verdict = POVerdict(
            request_id=request.request_id,
            agent_id=request.agent_id,
            verdict=pipeline_result["final_status"],
            delivered=delivered,
            failed_at=pipeline_result.get("failed_at"),
            reason=pipeline_result.get("reason"),
            overall_risk_score=pipeline_result["overall_risk_score"],
            trust_score=pipeline_result.get("trust_score", 100.0),
            honeypot_redirected=pipeline_result.get(
                "honeypot_redirected",
                False
            )
        )

        # =====================================================
        # EMIT FINAL VERDICT EVENT
        # =====================================================

        final_event = POSecurityEvent(
            event_type="po_final_verdict",
            request_id=request.request_id,
            agent_id=request.agent_id,
            module=WarriorModule.PO,
            severity=(
                RiskLevel.LOW
                if delivered
                else RiskLevel.CRITICAL
            ),
            message=(
                "REQUEST DELIVERED"
                if delivered
                else "REQUEST KILLED"
            ),
            metadata={
                "verdict": verdict.verdict.value,
                "risk_score": verdict.overall_risk_score,
                "failed_at": (
                    verdict.failed_at.value
                    if verdict.failed_at
                    else None
                )
            }
        )

        telemetry_events.append(final_event)

        await emit_security_event(final_event.model_dump())

        # =====================================================
        # RESPONSE
        # =====================================================

        total_time = round(
            (time.time() - start_time) * 1000,
            2
        )

        response = POPipelineResponse(
            success=delivered,
            verdict=verdict,
            pipeline=pipeline_execution,
            telemetry=telemetry_events
        )

        # =====================================================
        # CONSOLE LOG
        # =====================================================

        print("\n==============================")
        print("[PO] GATEWAY EXECUTION")
        print("==============================")
        print(f"Request ID : {request.request_id}")
        print(f"Agent ID   : {request.agent_id}")
        print(f"Action     : {request.action}")
        print(f"Verdict    : {verdict.verdict}")
        print(f"Risk Score : {verdict.overall_risk_score}")
        print(f"Time (ms)  : {total_time}")
        print("==============================\n")

        return response

    except Exception as e:

        traceback.print_exc()

        # =====================================================
        # FAILURE EVENT
        # =====================================================

        failure_event = POSecurityEvent(
            event_type="po_gateway_failure",
            request_id=request.request_id,
            agent_id=request.agent_id,
            module=WarriorModule.PO,
            severity=RiskLevel.CRITICAL,
            message="PO gateway crashed",
            metadata={
                "error": str(e)
            }
        )

        await emit_security_event(failure_event.model_dump())

        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "message": "PO gateway internal failure",
                "error": str(e)
            }
        )


# =========================================================
# HEALTH CHECK
# =========================================================

@router.get("/po-health")
async def po_health():

    return JSONResponse(
        content={
            "status": "healthy",
            "service": "PO Gateway",
            "message": "Dragon Warrior operational"
        }
    )


# =========================================================
# TEST ROUTE
# =========================================================

@router.post("/po-test")
async def po_test():

    return {
        "success": True,
        "message": "PO gateway route working"
    }