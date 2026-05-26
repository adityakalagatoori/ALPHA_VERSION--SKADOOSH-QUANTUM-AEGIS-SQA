import uuid
import gc
import hashlib
import json

from datetime import (
    datetime,
    timedelta
)

from jose import (
    jwt,
    JWTError,
    ExpiredSignatureError
)

from fastapi import HTTPException

from crypto.pqc import (
    generate_kyber_keypair,
    generate_dilithium_keypair
)

from crypto.enclave import (
    encrypt_private_key
)

from crypto.entropy import (
    generate_entropy,
    build_entropy_metadata,
    display_entropy
)

from db.supabase import (
    supabase
)

from core.armoriq import (
    log_agent_registration,
    log_entropy_event,
    enforce_action_policy
)

try:
    from services.tribunal_service import compute_tribunal
    TRIBUNAL_AVAILABLE = True
except Exception as tribunal_import_error:
    print(f"\n[TRIBUNAL SERVICE NOT READY] {tribunal_import_error}")
    TRIBUNAL_AVAILABLE = False
    compute_tribunal = None

# =========================================================
# OPTIONAL SNAKE IMPORTS
# =========================================================

try:

    from services.audit_service import (
        create_audit_log
    )

    AUDIT_AVAILABLE = True

except Exception as audit_error:

    print("\n[SNAKE AUDIT NOT READY]")
    print(audit_error)

    AUDIT_AVAILABLE = False

# =========================================================
# CRANE CONFIG
# =========================================================

JWT_SECRET = "SQA_CRANE_QUANTUM_SECRET"

JWT_ALGORITHM = "HS256"

JWT_EXPIRE_MINUTES = 5

# =========================================================
# MEMORY STORES
# =========================================================

AGENT_DB = {}

MULTISIG_QUEUE = {}

TRIBUNAL_LOGS = []

BLACKLISTED_AGENTS = set()

# =========================================================
# AUDIT HELPER
# =========================================================

def audit_event(
    agent_id: str,
    action: str,
    status: str,
    metadata: dict = None
):

    if not AUDIT_AVAILABLE:

        return

    try:

        create_audit_log(

            agent_id=agent_id,

            action=action,

            status=status,

            metadata=metadata or {}
        )

    except Exception as audit_error:

        print("\n[AUDIT ERROR]")
        print(audit_error)

# =========================================================
# C1 CREATE JWT
# =========================================================

def create_agent_token(

    agent_id: str,

    name: str,

    sector: str,

    allowed_actions: list
):

    issued_at = datetime.utcnow()

    expire = issued_at + timedelta(
        minutes=JWT_EXPIRE_MINUTES
    )

    payload = {

        "agent_id":
            agent_id,

        "name":
            name,

        "sector":
            sector,

        "allowed_actions":
            allowed_actions,

        "iat":
            int(
                issued_at.timestamp()
            ),

        "exp":
            int(
                expire.timestamp()
            ),

        "token_type":
            "CRANE_CAPABILITY_TOKEN",

        "security_layer":
            "CRANE",

        "quantum_signed":
            True
    }

    token = jwt.encode(

        payload,

        JWT_SECRET,

        algorithm=JWT_ALGORITHM
    )

    print("\n===================================")
    print(" C1 TOKEN CREATED ")
    print("===================================")

    print(
        f"Agent ID: {agent_id}"
    )

    print(
        f"Allowed Actions: {allowed_actions}"
    )

    print(
        f"Expiry Minutes: {JWT_EXPIRE_MINUTES}"
    )

    print("===================================\n")

    audit_event(
        agent_id,
        "TOKEN_CREATED",
        "SUCCESS",
        {
            "allowed_actions": allowed_actions
        }
    )

    return token

# =========================================================
# C1 VERIFY TOKEN
# =========================================================

def verify_agent_token(
    token: str
):

    try:

        print("\n===================================")
        print(" C1 TOKEN VERIFICATION ")
        print("===================================")

        if not token:

            raise HTTPException(

                status_code=401,

                detail="TOKEN_MISSING"
            )

        payload = jwt.decode(

            token,

            JWT_SECRET,

            algorithms=[JWT_ALGORITHM],

            options={
                "verify_exp": False
            }
        )

        agent_id = payload.get(
            "agent_id"
        )

        if agent_id in BLACKLISTED_AGENTS:

            audit_event(
                agent_id,
                "BLACKLIST_CHECK",
                "BLOCKED"
            )

            raise HTTPException(

                status_code=403,

                detail="AGENT_BLACKLISTED"
            )

        print(
            "[C1] TOKEN VERIFIED SUCCESSFULLY"
        )

        print(
            f"Agent ID: {agent_id}"
        )

        print("===================================\n")

        audit_event(
            agent_id,
            "TOKEN_VERIFIED",
            "SUCCESS"
        )

        return payload

    except ExpiredSignatureError:

        raise HTTPException(

            status_code=401,

            detail="TOKEN_EXPIRED"
        )

    except JWTError as jwt_error:

        print(jwt_error)

        raise HTTPException(

            status_code=401,

            detail="INVALID_OR_EXPIRED_TOKEN"
        )

    except Exception as error:

        print(error)

        raise HTTPException(

            status_code=401,

            detail="TOKEN_VERIFICATION_FAILED"
        )

# =========================================================
# C2 CAPABILITY ENFORCEMENT
# =========================================================

def enforce_capability(

    token: str,

    requested_action: str
):

    payload = verify_agent_token(
        token
    )

    allowed_actions = payload.get(
        "allowed_actions",
        []
    )

    agent_id = payload.get(
        "agent_id"
    )

    print("\n===================================")
    print(" C2 CAPABILITY CHECK ")
    print("===================================")

    print(
        f"Requested Action: {requested_action}"
    )

    print(
        f"Allowed Actions: {allowed_actions}"
    )

    if requested_action not in allowed_actions:

        tribunal = build_tribunal_record(

            payload=payload,

            action=requested_action,

            decision="BLOCKED",

            reason="OUT_OF_SCOPE_ACTION"
        )

        audit_event(
            agent_id,
            requested_action,
            "BLOCKED",
            {
                "reason":
                    "OUT_OF_SCOPE_ACTION"
            }
        )

        raise HTTPException(

            status_code=403,

            detail={

                "message":
                    "ACTION_BLOCKED",

                "reason":
                    "OUT_OF_SCOPE_ACTION",

                "tribunal":
                    tribunal
            }
        )

    print(
        "[C2] ACTION AUTHORIZED"
    )

    print("===================================\n")

    audit_event(
        agent_id,
        requested_action,
        "AUTHORIZED"
    )

    return {

        "status":
            "ACCESS_GRANTED",

        "payload":
            payload
    }

# =========================================================
# C5 CHECKPOINT
# =========================================================

def checkpoint_validate(

    token: str,

    step_name: str
):

    payload = verify_agent_token(
        token
    )

    agent_id = payload["agent_id"]

    print(
        f"[C5] CHECKPOINT VERIFIED: {step_name}"
    )

    audit_event(
        agent_id,
        f"CHECKPOINT_{step_name}",
        "PASSED"
    )

    return {

        "status":
            "CHECKPOINT_PASSED",

        "step":
            step_name,

        "agent_id":
            agent_id
    }

# =========================================================
# C3 MULTISIG
# =========================================================

def create_multisig_action(

    token: str,

    action_name: str,

    amount: float
):

    payload = verify_agent_token(
        token
    )

    request_id = str(
        uuid.uuid4()
    )

    MULTISIG_QUEUE[request_id] = {

        "request_id":
            request_id,

        "agent_id":
            payload["agent_id"],

        "action":
            action_name,

        "amount":
            amount,

        "status":
            "WAITING_SECOND_APPROVER",

        "signatures": 1,

        "required_signatures": 2,

        "created_at":
            datetime.utcnow().isoformat()
    }

    audit_event(
        payload["agent_id"],
        "MULTISIG_CREATED",
        "WAITING_APPROVAL",
        {
            "request_id": request_id,
            "amount": amount
        }
    )

    print(
        "[C3] MULTISIG CREATED"
    )

    return MULTISIG_QUEUE[
        request_id
    ]

# =========================================================
# C3 APPROVE
# =========================================================

def approve_multisig_action(
    request_id: str
):

    if request_id not in MULTISIG_QUEUE:

        raise HTTPException(

            status_code=404,

            detail="MULTISIG_REQUEST_NOT_FOUND"
        )

    request = MULTISIG_QUEUE[
        request_id
    ]

    request["signatures"] += 1

    if request["signatures"] >= 2:

        request["status"] = "APPROVED"

    audit_event(
        request["agent_id"],
        "MULTISIG_APPROVED",
        request["status"],
        {
            "request_id": request_id
        }
    )

    return request

# =========================================================
# C7 REAL TRIBUNAL WITH SHAP
# =========================================================

def build_tribunal_record(

    payload: dict,

    action: str,

    decision: str,

    reason: str
):

    agent_id = payload.get("agent_id")
    sector = payload.get("sector", "unknown")

    # Gather feature data
    # For now, use defaults; in real flow these come from MANTIS + PO services
    anomaly_score = 0
    trust_score = 100
    token_validity = decision != "BLOCKED"
    policy_result = decision != "BLOCKED"
    scope_match = decision != "BLOCKED"

    # Use real SHAP tribunal
    if TRIBUNAL_AVAILABLE and compute_tribunal is not None:

        tribunal = compute_tribunal(
            agent_id=agent_id,
            action=action,
            sector=sector,
            anomaly_score=anomaly_score,
            trust_score=trust_score,
            token_validity=token_validity,
            policy_result=policy_result,
            scope_match=scope_match
        )

    else:

        # Fallback to hardcoded (C7 PARTIAL)
        tribunal = {

            "agent_id": agent_id,

            "action": action,

            "decision": decision,

            "reason": reason,

            "confidence": 0.92,

            "explanation": {

                "scope_match": False,

                "token_valid": True,

                "behavior_risk": 0.12,

                "policy_violation": True
            },

            "timestamp": datetime.utcnow().isoformat()
        }

    TRIBUNAL_LOGS.append(
        tribunal
    )

    return tribunal

# =========================================================
# C4 REAL ARMORIQ ENFORCEMENT GATE
# =========================================================

def armoriq_policy_gate(

    action: str,

    payload: dict
):

    agent_id = payload["agent_id"]
    sector = payload.get("sector", "unknown")
    allowed_actions = payload.get("allowed_actions", [])
    risk_score = payload.get("risk_score", 0)
    trust_score = payload.get("trust_score", 100)

    # Real ArmorIQ policy enforcement
    armoriq_result = enforce_action_policy(
        action=action,
        sector=sector,
        agent_id=agent_id,
        allowed_actions=allowed_actions,
        risk_score=risk_score,
        trust_score=trust_score
    )

    # If ArmorIQ blocks, raise exception
    if not armoriq_result["allowed"]:

        audit_event(
            agent_id,
            "ARMORIQ_POLICY_GATE",
            "BLOCKED",
            {
                "action": action,
                "reason": armoriq_result["reason"]
            }
        )

        raise HTTPException(

            status_code=403,

            detail={

                "message":
                    "ARMORIQ_POLICY_BLOCKED",

                "reason":
                    armoriq_result["reason"],

                "armoriq_action":
                    armoriq_result["action"]
            }
        )

    audit_event(
        agent_id,
        "ARMORIQ_POLICY_GATE",
        "VERIFIED",
        {
            "action": action,
            "armoriq_action": armoriq_result["action"]
        }
    )

    return armoriq_result

# =========================================================
# M4 BLACKLIST AGENT
# =========================================================

def blacklist_agent(
    agent_id: str
):

    BLACKLISTED_AGENTS.add(
        agent_id
    )

    if agent_id in AGENT_DB:

        AGENT_DB[agent_id][
            "is_blacklisted"
        ] = True

    audit_event(
        agent_id,
        "BLACKLISTED",
        "BLOCKED"
    )

    return {

        "status":
            "BLACKLISTED",

        "agent_id":
            agent_id
    }

# =========================================================
# REGISTER AGENT
# =========================================================

def register_agent(

    agent_name: str,

    sector: str,

    allowed_actions: list
):

    agent_id = str(
        uuid.uuid4()
    )

    entropy = generate_entropy()

    display_entropy(
        entropy
    )

    entropy_metadata = build_entropy_metadata(
        entropy
    )

    kyber_keys = generate_kyber_keypair()

    dilithium_keys = generate_dilithium_keypair()

    print(
        "[M6] PQC KEYS GENERATED"
    )

    kyber_enclave_handle = encrypt_private_key(

        kyber_keys["secret_key"]
    )

    dilithium_enclave_handle = encrypt_private_key(

        dilithium_keys["secret_key"]
    )

    kyber_keys["secret_key"] = None

    dilithium_keys["secret_key"] = None

    gc.collect()

    token = create_agent_token(

        agent_id=agent_id,

        name=agent_name,

        sector=sector,

        allowed_actions=allowed_actions
    )

    AGENT_DB[agent_id] = {

        "agent_id":
            agent_id,

        "agent_name":
            agent_name,

        "sector":
            sector,

        "allowed_actions":
            allowed_actions,

        "token":
            token,

        "is_blacklisted":
            False,

        "created_at":
            datetime.utcnow().isoformat(),

        "kyber_algorithm":
            kyber_keys["algorithm"],

        "dilithium_algorithm":
            dilithium_keys["algorithm"],

        "kyber_public_key":
            kyber_keys["public_key"],

        "dilithium_public_key":
            dilithium_keys["public_key"],

        "kyber_private_key":
            kyber_enclave_handle,

        "dilithium_private_key":
            dilithium_enclave_handle,
    }

    try:

        supabase.table(
            "agents"
        ).insert({

            "agent_id":
                agent_id,

            "agent_name":
                agent_name,

            "sector":
                sector,

            "allowed_actions":
                allowed_actions,

            "token":
                token,

            "is_blacklisted":
                False,

            "kyber_algorithm":
                kyber_keys["algorithm"],

            "dilithium_algorithm":
                dilithium_keys["algorithm"],

            "kyber_public_key":
                kyber_keys["public_key"],

            "dilithium_public_key":
                dilithium_keys["public_key"],

            "entropy_metadata":
                entropy_metadata

        }).execute()

        print(
            "[DB] AGENT STORED"
        )

    except Exception as db_error:

        print(
            "[DB WARNING]"
        )

        print(db_error)

    log_agent_registration(

        agent_id=agent_id,

        agent_name=agent_name,

        sector=sector,

        kyber_algorithm=
            kyber_keys["algorithm"],

        dilithium_algorithm=
            dilithium_keys["algorithm"]
    )

    log_entropy_event(

        agent_id=agent_id,

        entropy_bits=
            entropy_metadata["entropy_bits"]
    )

    audit_event(
        agent_id,
        "AGENT_REGISTERED",
        "SUCCESS",
        {
            "sector": sector
        }
    )

    return {

        "agent_id":
            agent_id,

        "agent_name":
            agent_name,

        "sector":
            sector,

        "allowed_actions":
            allowed_actions,

        "token":
            token,

        "is_blacklisted":
            False,

        "kyber_algorithm":
            kyber_keys["algorithm"],

        "dilithium_algorithm":
            dilithium_keys["algorithm"],

        "kyber_public_key":
            kyber_keys["public_key"],

        "dilithium_public_key":
            dilithium_keys["public_key"]
    }