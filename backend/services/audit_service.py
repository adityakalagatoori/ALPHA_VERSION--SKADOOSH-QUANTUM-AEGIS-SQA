import hashlib
import json
import uuid
import base64
import oqs

from datetime import datetime

from db.supabase import supabase

# =========================================================
# OPTIONAL ALERT IMPORTS
# =========================================================

try:

    from routes.alerts import (
        emit_security_event
    )

    ALERTS_AVAILABLE = True

except Exception as alert_error:

    print("\n[ALERT BUS NOT READY]")
    print(alert_error)

    ALERTS_AVAILABLE = False

# =========================================================
# AUDIT MEMORY STORE
# =========================================================

AUDIT_CHAIN = []

MERKLE_CHECKPOINTS = []

# =========================================================
# AUDIT SIGNING KEY (S2)
# =========================================================

AUDIT_SIGNING_KEY = None
AUDIT_VERIFYING_KEY = None

def load_or_create_audit_key():
    """Generate a Dilithium-3 (ML-DSA-65) signing key in memory for this session."""
    global AUDIT_SIGNING_KEY, AUDIT_VERIFYING_KEY

    try:
        signer = oqs.Signature("ML-DSA-65")
        public_key = signer.generate_keypair()
        secret_key = signer.export_secret_key()

        if public_key is None or secret_key is None:
            raise ValueError("Failed to generate keypair - keys are None")

        AUDIT_SIGNING_KEY = secret_key
        AUDIT_VERIFYING_KEY = public_key

        print("[S2] AUDIT KEY CREATED")

    except Exception as e:
        print(f"[S2] ERROR creating audit key: {e}")
        AUDIT_SIGNING_KEY = None
        AUDIT_VERIFYING_KEY = None

# Initialize key at module load
load_or_create_audit_key()

# =========================================================
# HASH HELPERS
# =========================================================

def sha3_hash(
    data: str
):

    return hashlib.sha3_256(
        data.encode()
    ).hexdigest()

# =========================================================
# BUILD MERKLE ROOT
# =========================================================

def build_merkle_root():

    if not AUDIT_CHAIN:

        return None

    hashes = [

        entry["current_hash"]

        for entry in AUDIT_CHAIN
    ]

    while len(hashes) > 1:

        temp = []

        for i in range(
            0,
            len(hashes),
            2
        ):

            left = hashes[i]

            if i + 1 < len(hashes):

                right = hashes[i + 1]

            else:

                right = left

            combined = sha3_hash(
                left + right
            )

            temp.append(
                combined
            )

        hashes = temp

    return hashes[0]

# =========================================================
# CREATE AUDIT LOG
# =========================================================

def create_audit_log(

    agent_id: str,

    action: str,

    status: str,

    metadata: dict = None
):

    global AUDIT_SIGNING_KEY

    metadata = metadata or {}

    # Load from Supabase for chain continuity on restart
    if not AUDIT_CHAIN:
        load_chain_from_db()

    previous_hash = (

        AUDIT_CHAIN[-1]["current_hash"]

        if AUDIT_CHAIN

        else "GENESIS_BLOCK"
    )

    timestamp = datetime.utcnow().isoformat()

    payload_hash = sha3_hash(

        json.dumps(
            metadata,
            sort_keys=True
        )
    )

    chain_index = len(
        AUDIT_CHAIN
    ) + 1

    raw_string = json.dumps({

        "timestamp":
            timestamp,

        "agent_id":
            agent_id,

        "action":
            action,

        "status":
            status,

        "payload_hash":
            payload_hash,

        "previous_hash":
            previous_hash,

        "chain_index":
            chain_index

    }, sort_keys=True)

    current_hash = sha3_hash(
        raw_string
    )

    # =====================================================
    # S2 REAL DILITHIUM-3 SIGNATURE
    # =====================================================

    audit_signature = None
    if AUDIT_SIGNING_KEY:
        try:
            with oqs.Signature("ML-DSA-65", secret_key=AUDIT_SIGNING_KEY) as signer:
                sig_bytes = signer.sign(current_hash.encode())
                audit_signature = base64.b64encode(sig_bytes).decode()
        except Exception as e:
            print(f"[S2] Signature error: {e}")
            audit_signature = None

    entry_id = str(uuid.uuid4())

    entry = {

        "entry_id":
            entry_id,

        "audit_id":
            entry_id,

        "chain_index":
            chain_index,

        "timestamp":
            timestamp,

        "agent_id":
            agent_id,

        "action":
            action,

        "status":
            status,

        "metadata":
            metadata,

        "payload_hash":
            payload_hash,

        "previous_hash":
            previous_hash,

        "current_hash":
            current_hash,

        "dilithium_signature":
            audit_signature,

        "verification":
            "VALID"
    }

    AUDIT_CHAIN.append(
        entry
    )

    # =====================================================
    # S1/S3 PERSIST TO SUPABASE
    # =====================================================

    try:
        supabase.table("audit_logs").insert({
            "agent_id": agent_id,
            "action_type": action,
            "payload": {"action": action, "status": status, "metadata": metadata},
            "prev_hash": previous_hash,
            "current_hash": current_hash,
            "dilithium_sig": audit_signature,
            "tampered": False,
        }).execute()
    except Exception as e:
        print(f"[S1] Supabase insert error: {e}")

    # =====================================================
    # MERKLE ROOT
    # =====================================================

    merkle_root = build_merkle_root()

    checkpoint = {

        "timestamp":
            timestamp,

        "merkle_root":
            merkle_root,

        "total_entries":
            len(AUDIT_CHAIN)
    }

    MERKLE_CHECKPOINTS.append(
        checkpoint
    )

    print("\n===================================")
    print(" SNAKE AUDIT ENTRY CREATED ")
    print("===================================")

    print(
        f"Agent ID: {agent_id}"
    )

    print(
        f"Action: {action}"
    )

    print(
        f"Status: {status}"
    )

    print(
        f"Chain Index: {chain_index}"
    )

    print(
        f"Hash: {current_hash[:24]}..."
    )

    print(
        f"Merkle Root: {merkle_root[:24]}..."
    )

    if audit_signature:
        print(f"[S2] Dilithium Signature: {audit_signature[:32]}...")

    print("===================================\n")

    return entry

# =========================================================
# LOAD CHAIN FROM SUPABASE (S1/S3)
# =========================================================

def load_chain_from_db():
    """Restore audit chain from Supabase on module init/after restart."""
    global AUDIT_CHAIN

    # Clear existing data
    AUDIT_CHAIN.clear()

    try:
        result = supabase.table("audit_logs").select("*").order("timestamp", desc=False).execute()

        if result.data:
            for row in result.data:
                payload = row.get("payload") or {}
                entry = {
                    "entry_id": row.get("log_id"),
                    "audit_id": row.get("log_id"),
                    "chain_index": len(AUDIT_CHAIN) + 1,
                    "timestamp": row.get("timestamp"),
                    "agent_id": str(row.get("agent_id", "")),
                    "action": row.get("action_type") or payload.get("action", ""),
                    "status": payload.get("status", ""),
                    "metadata": payload.get("metadata", {}),
                    "payload_hash": "",
                    "previous_hash": row.get("prev_hash", "GENESIS_BLOCK"),
                    "current_hash": row.get("current_hash", ""),
                    "dilithium_signature": row.get("dilithium_sig"),
                    "verification": "VALID"
                }
                AUDIT_CHAIN.append(entry)

            print(f"[S1/S3] Loaded {len(AUDIT_CHAIN)} audit entries from Supabase")

    except Exception as e:
        print(f"[S1/S3] Load error: {e}")

# Load chain on module init
load_chain_from_db()

# =========================================================
# VERIFY AUDIT SIGNATURE (S2)
# =========================================================

def verify_audit_signature(entry):
    """Verify Dilithium-3 signature on audit entry."""
    if not AUDIT_VERIFYING_KEY or not entry.get("dilithium_signature"):
        return False

    try:
        with oqs.Signature("ML-DSA-65") as verifier:
            sig_bytes = base64.b64decode(entry["dilithium_signature"])
            return verifier.verify(entry["current_hash"].encode(), sig_bytes, AUDIT_VERIFYING_KEY)
    except Exception as e:
        print(f"[S2] Signature verification error: {e}")
        return False

# =========================================================
# VERIFY CHAIN
# =========================================================

def verify_audit_chain():

    if not AUDIT_CHAIN:

        return {

            "valid":
                True,

            "entries":
                0
        }

    for index in range(
        1,
        len(AUDIT_CHAIN)
    ):

        current = AUDIT_CHAIN[index]

        previous = AUDIT_CHAIN[index - 1]

        if (

            current["previous_hash"]

            != previous["current_hash"]
        ):

            current["verification"] = "TAMPERED"

            return {

                "valid":
                    False,

                "tampered_index":
                    current["chain_index"],

                "entry":
                    current
            }

    return {

        "valid":
            True,

        "entries":
            len(AUDIT_CHAIN),

        "latest_hash":

            AUDIT_CHAIN[-1][
                "current_hash"
            ]
    }

# =========================================================
# CHAIN STATUS
# =========================================================

def get_audit_chain_status():

    verification = verify_audit_chain()

    return {

        "snake_status":
            "ACTIVE",

        "chain_valid":
            verification["valid"],

        "total_entries":
            len(AUDIT_CHAIN),

        "latest_entry":

            AUDIT_CHAIN[-1]

            if AUDIT_CHAIN

            else None,

        "latest_merkle_root":

            MERKLE_CHECKPOINTS[-1]

            if MERKLE_CHECKPOINTS

            else None,

        "verification":
            verification
    }

# =========================================================
# GET FULL CHAIN
# =========================================================

def get_full_audit_chain():

    return AUDIT_CHAIN

# =========================================================
# GET MERKLE CHECKPOINTS
# =========================================================

def get_merkle_checkpoints():

    return MERKLE_CHECKPOINTS

# =========================================================
# MANUAL TAMPER (DEMO)
# =========================================================

def tamper_audit_entry(
    chain_index: int
):

    for entry in AUDIT_CHAIN:

        if entry["chain_index"] == chain_index:

            entry["action"] = "CORRUPTED"

            entry["verification"] = "TAMPERED"

            print("\n===================================")
            print(" AUDIT ENTRY MANUALLY CORRUPTED ")
            print("===================================")

            print(
                f"Chain Index: {chain_index}"
            )

            print("===================================\n")

            return {

                "status":
                    "TAMPER_SUCCESS",

                "entry":
                    entry
            }

    return {

        "status":
            "ENTRY_NOT_FOUND"
    }