from fastapi import APIRouter

from models.agent_models import (
    AgentRegisterRequest,
    AgentRegisterResponse
)

from services.agent_service import (
    register_agent
)

# =========================================================
# ROUTER
# =========================================================

router = APIRouter()

# =========================================================
# PREFLIGHT HANDLER (CORS)
# =========================================================

@router.options("/agents/register")
async def preflight_register():
    return {}

# =========================================================
# REGISTER AGENT
# =========================================================

@router.post(
    "/agents/register",
    response_model=AgentRegisterResponse
)
def register_new_agent(
    payload: AgentRegisterRequest
):

    print("\n===================================")
    print("CRANE C1 — AGENT REGISTRATION")
    print("===================================")

    print("Incoming Payload:")
    print(payload)

    # =====================================================
    # REGISTER AGENT
    # =====================================================

    result = register_agent(

        payload.name,

        payload.sector,

        payload.allowed_actions
    )

    print("\n===================================")
    print("CRANE CAPABILITY TOKEN GENERATED")
    print("===================================")

    print(
        f"Agent ID: {result['agent_id']}"
    )

    print(
        f"Allowed Actions: {result['allowed_actions']}"
    )

    print("\nKyber Algorithm:")
    print(
        result["kyber_algorithm"]
    )

    print("\nDilithium Algorithm:")
    print(
        result["dilithium_algorithm"]
    )

    print("\nKyber Public Key:")
    print(
        result["kyber_public_key"][:120]
    )

    print("\nDilithium Public Key:")
    print(
        result["dilithium_public_key"][:120]
    )

    print("\nJWT TOKEN:")
    print(
        result["token"]
    )

    print("\n===================================")
    print("C1 REGISTRATION SUCCESS")
    print("===================================\n")

    # =====================================================
    # SAFE RESPONSE
    # =====================================================

    return {

        "agent_id":
            result["agent_id"],

        "kyber_algorithm":
            result["kyber_algorithm"],

        "dilithium_algorithm":
            result["dilithium_algorithm"],

        "kyber_public_key":
            result["kyber_public_key"],

        "dilithium_public_key":
            result["dilithium_public_key"],

        "token":
            result["token"],

        "allowed_actions":
            result["allowed_actions"]
    }