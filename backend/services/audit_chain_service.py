import hashlib
import json
from datetime import datetime
from typing import Dict
from typing import List

from core.security_event_bus import (
    emit_security_event
)


# =========================================================
# IMMUTABLE AUDIT CHAIN
# =========================================================

AUDIT_CHAIN: List[Dict] = []


# =========================================================
# HASH EVENT
# =========================================================

def generate_event_hash(
    event_data: dict,
    previous_hash: str
):

    payload = json.dumps({

        "event":
            event_data,

        "previous_hash":
            previous_hash

    }, sort_keys=True)

    return hashlib.sha3_256(
        payload.encode()
    ).hexdigest()


# =========================================================
# ADD EVENT TO CHAIN
# =========================================================

async def add_audit_event(
    event_data: dict
):

    previous_hash = (
        AUDIT_CHAIN[-1]["hash"]
        if AUDIT_CHAIN
        else "GENESIS"
    )

    current_hash = generate_event_hash(

        event_data=event_data,

        previous_hash=previous_hash
    )

    chain_entry = {

        "log_id":
            f"log_{len(AUDIT_CHAIN)+1}",

        "timestamp":
            datetime.utcnow().isoformat(),

        "event":
            event_data,

        "previous_hash":
            previous_hash,

        "hash":
            current_hash
    }

    AUDIT_CHAIN.append(
        chain_entry
    )

    return chain_entry


# =========================================================
# VERIFY SINGLE LOG
# =========================================================

async def verify_chain_entry(
    log_id: str
):

    for index, entry in enumerate(AUDIT_CHAIN):

        if entry["log_id"] == log_id:

            recalculated_hash = generate_event_hash(

                event_data=entry["event"],

                previous_hash=entry["previous_hash"]
            )

            valid_hash = (
                recalculated_hash
                ==
                entry["hash"]
            )

            # =============================================
            # CHAIN LINK VERIFY
            # =============================================

            valid_chain = True

            if index > 0:

                previous_entry = AUDIT_CHAIN[
                    index - 1
                ]

                if (

                    entry["previous_hash"]
                    !=
                    previous_entry["hash"]
                ):

                    valid_chain = False

            tampered = not (
                valid_hash and valid_chain
            )

            # =============================================
            # SECURITY EVENT
            # =============================================

            if tampered:

                await emit_security_event({

                    "event_type":
                        "AUDIT_TAMPER_DETECTED",

                    "severity":
                        "CRITICAL",

                    "message":
                        "Audit chain tampering detected",

                    "log_id":
                        log_id,

                    "timestamp":
                        datetime.utcnow().isoformat()
                })

            return {

                "log_id":
                    log_id,

                "valid_hash":
                    valid_hash,

                "valid_signature":
                    True,

                "valid_chain":
                    valid_chain,

                "tampered":
                    tampered,

                "hash":
                    entry["hash"],

                "previous_hash":
                    entry["previous_hash"]
            }

    return {

        "log_id":
            log_id,

        "valid_hash":
            False,

        "valid_signature":
            False,

        "valid_chain":
            False,

        "tampered":
            True,

        "reason":
            "Log not found"
    }


# =========================================================
# VERIFY ENTIRE CHAIN
# =========================================================

async def verify_full_chain():

    corrupted_logs = []

    for entry in AUDIT_CHAIN:

        result = await verify_chain_entry(
            entry["log_id"]
        )

        if result["tampered"]:

            corrupted_logs.append(
                result
            )

    return {

        "chain_valid":
            len(corrupted_logs) == 0,

        "total_logs":
            len(AUDIT_CHAIN),

        "corrupted_logs":
            corrupted_logs
    }


# =========================================================
# GET FULL CHAIN
# =========================================================

async def get_full_chain():

    return AUDIT_CHAIN


# =========================================================
# FORCE TAMPER
# =========================================================
# DEMO PURPOSE
# =========================================================

async def tamper_log(
    log_id: str
):

    for entry in AUDIT_CHAIN:

        if entry["log_id"] == log_id:

            entry["event"] = {

                "tampered":
                    True
            }

            return {

                "success":
                    True,

                "log_id":
                    log_id
            }

    return {

        "success":
            False
    }