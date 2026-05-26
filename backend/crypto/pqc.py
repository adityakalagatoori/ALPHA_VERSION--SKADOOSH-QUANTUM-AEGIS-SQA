import oqs
import base64

# =========================================================
# PQC CONFIG
# =========================================================

KYBER_ALGORITHM = "Kyber1024"

SIGNATURE_ALGORITHM = "ML-DSA-65"

print("\n==============================")
print("SQA PQC CONFIG")
print("==============================")
print(f"KYBER ALGORITHM: {KYBER_ALGORITHM}")
print(f"SIGNATURE ALGORITHM: {SIGNATURE_ALGORITHM}")
print("==============================\n")

# =========================================================
# KYBER KEYPAIR
# =========================================================

def generate_kyber_keypair():

    with oqs.KeyEncapsulation(
        KYBER_ALGORITHM
    ) as kyber:

        public_key = kyber.generate_keypair()

        secret_key = kyber.export_secret_key()

        return {

            "algorithm":
                KYBER_ALGORITHM,

            # STORE AS BASE64 STRINGS
            "public_key":
                base64.b64encode(
                    public_key
                ).decode(),

            "secret_key":
                base64.b64encode(
                    secret_key
                ).decode()
        }

# =========================================================
# DILITHIUM KEYPAIR
# =========================================================

def generate_dilithium_keypair():

    with oqs.Signature(
        SIGNATURE_ALGORITHM
    ) as signer:

        public_key = signer.generate_keypair()

        secret_key = signer.export_secret_key()

        return {

            "algorithm":
                SIGNATURE_ALGORITHM,

            # STORE AS BASE64 STRINGS
            "public_key":
                base64.b64encode(
                    public_key
                ).decode(),

            "secret_key":
                base64.b64encode(
                    secret_key
                ).decode()
        }