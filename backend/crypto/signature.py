import oqs
import base64
import json

SIGNATURE_ALGO = "ML-DSA-65"

# =========================================================
# SIGN PAYLOAD
# =========================================================

def sign_payload(
    private_key: bytes,
    payload: dict
):

    message = json.dumps(
        payload,
        sort_keys=True
    ).encode()

    with oqs.Signature(
        SIGNATURE_ALGO,
        secret_key=private_key
    ) as signer:

        signature = signer.sign(
            message
        )

    return base64.b64encode(
        signature
    ).decode()


# =========================================================
# VERIFY SIGNATURE
# =========================================================

def verify_signature(
    public_key_b64: str,
    payload: dict,
    signature_b64: str
):

    try:

        message = json.dumps(
            payload,
            sort_keys=True
        ).encode()

        # =============================================
        # SAFE BASE64 DECODE
        # =============================================

        signature = base64.b64decode(
            signature_b64
        )

        public_key = base64.b64decode(
            public_key_b64
        )

        with oqs.Signature(
            SIGNATURE_ALGO
        ) as verifier:

            return verifier.verify(
                message,
                signature,
                public_key
            )

    except Exception:

        # =============================================
        # INVALID / FORGED SIGNATURE
        # =============================================

        return False