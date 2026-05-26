import base64
import secrets

try:
    import oqs
except:
    oqs = None


# =========================================================
# KYBER CONFIG
# =========================================================

KYBER_ALGORITHM = "Kyber1024"


# =========================================================
# GENERATE KYBER KEYPAIR
# =========================================================

def generate_kyber_keypair():

    if oqs is None:

        raise Exception(
            "liboqs-python not installed"
        )

    kem = oqs.KeyEncapsulation(KYBER_ALGORITHM)

    public_key = kem.generate_keypair()

    secret_key = kem.export_secret_key()

    return {
        "algorithm": KYBER_ALGORITHM,
        "public_key": base64.b64encode(
            public_key
        ).decode(),
        "secret_key": base64.b64encode(
            secret_key
        ).decode()
    }


# =========================================================
# ENCRYPT PAYLOAD
# =========================================================

def encrypt_payload(
    plaintext: str,
    public_key_b64: str
):

    if oqs is None:

        raise Exception(
            "liboqs-python not installed"
        )

    public_key = base64.b64decode(
        public_key_b64
    )

    kem = oqs.KeyEncapsulation(KYBER_ALGORITHM)

    ciphertext, shared_secret = kem.encap_secret(
        public_key
    )

    plaintext_bytes = plaintext.encode()

    encrypted_data = xor_encrypt(
        plaintext_bytes,
        shared_secret
    )

    return {
        "ciphertext": base64.b64encode(
            ciphertext
        ).decode(),

        "encrypted_payload": base64.b64encode(
            encrypted_data
        ).decode(),

        "algorithm": KYBER_ALGORITHM
    }


# =========================================================
# DECRYPT PAYLOAD
# =========================================================

def decrypt_payload(
    ciphertext_b64: str,
    encrypted_payload_b64: str,
    secret_key_b64: str
):

    if oqs is None:

        raise Exception(
            "liboqs-python not installed"
        )

    ciphertext = base64.b64decode(
        ciphertext_b64
    )

    encrypted_payload = base64.b64decode(
        encrypted_payload_b64
    )

    secret_key = base64.b64decode(
        secret_key_b64
    )

    kem = oqs.KeyEncapsulation(KYBER_ALGORITHM)

    kem.import_secret_key(secret_key)

    shared_secret = kem.decap_secret(
        ciphertext
    )

    decrypted = xor_encrypt(
        encrypted_payload,
        shared_secret
    )

    return decrypted.decode()


# =========================================================
# XOR ENCRYPTION
# =========================================================
# Shared-secret symmetric encryption layer
# =========================================================

def xor_encrypt(
    data: bytes,
    key: bytes
):

    return bytes(
        [
            b ^ key[i % len(key)]
            for i, b in enumerate(data)
        ]
    )


# =========================================================
# GENERATE SECURE SESSION ID
# =========================================================

def generate_secure_session_id():

    return secrets.token_hex(32)


# =========================================================
# TEST KYBER ROUNDTRIP
# =========================================================

def test_kyber_roundtrip():

    keys = generate_kyber_keypair()

    message = "Skadoosh Quantum Aegis"

    encrypted = encrypt_payload(
        message,
        keys["public_key"]
    )

    decrypted = decrypt_payload(
        encrypted["ciphertext"],
        encrypted["encrypted_payload"],
        keys["secret_key"]
    )

    return {
        "success": decrypted == message,
        "original": message,
        "decrypted": decrypted
    }


# =========================================================
# PLAINTEXT VS CIPHERTEXT DEMO
# =========================================================

def generate_demo_payload():

    keys = generate_kyber_keypair()

    sample_payload = """
    {
        "action": "transfer_money",
        "amount": 50000,
        "currency": "USD"
    }
    """

    encrypted = encrypt_payload(
        sample_payload,
        keys["public_key"]
    )

    return {
        "plaintext": sample_payload,
        "ciphertext": encrypted["ciphertext"],
        "encrypted_payload": encrypted[
            "encrypted_payload"
        ],
        "algorithm": KYBER_ALGORITHM
    }