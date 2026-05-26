from fastapi import (
    APIRouter,
    HTTPException
)

from db.supabase import (
    supabase
)

from core.armoriq import (
    log_blacklist_event
)

# =========================================================
# ROUTER
# =========================================================

router = APIRouter()

# =========================================================
# M4 — REVOKE AGENT
# =========================================================

@router.post("/revoke-agent/{agent_id}")

async def revoke_agent(
    agent_id: str
):

    # =====================================================
    # FIND AGENT
    # =====================================================

    result = (

        supabase
        .table("agents")
        .select("*")
        .eq("agent_id", agent_id)
        .execute()
    )

    if not result.data:

        raise HTTPException(

            status_code=404,

            detail=
                "Agent not found"
        )

    # =====================================================
    # UPDATE BLACKLIST STATUS
    # =====================================================

    update_result = (

        supabase
        .table("agents")
        .update({

            "is_blacklisted":
                True

        })
        .eq("agent_id", agent_id)
        .execute()
    )

    # =====================================================
    # ARMORIQ EVENT
    # =====================================================

    log_blacklist_event(
        agent_id
    )

    # =====================================================
    # TERMINAL OUTPUT
    # =====================================================

    print("\n==============================")
    print(" M4 KEY BLACKLISTING ")
    print("==============================")

    print(f"Agent ID: {agent_id}")

    print(
        "Blacklist Status: "
        "TRUE"
    )

    print(
        "Gateway Action: "
        "ALL FUTURE REQUESTS BLOCKED"
    )

    print("==============================\n")

    # =====================================================
    # RESPONSE
    # =====================================================

    return {

        "status":
            "BLACKLISTED",

        "agent_id":
            agent_id,

        "future_requests":
            "BLOCKED"
    }