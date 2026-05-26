import secrets
import hashlib
import time


# =========================================================
# QUANTUM SAFE ENTROPY GENERATION
# =========================================================

def generate_entropy(num_bytes: int = 64):
    """
    Generate cryptographically secure entropy.
    64 bytes = 512 bits.
    """

    entropy = secrets.token_bytes(num_bytes)

    return entropy


# =========================================================
# HASH ENTROPY
# NEVER STORE RAW ENTROPY
# =========================================================

def hash_entropy(entropy: bytes):

    return hashlib.sha3_256(entropy).hexdigest()


# =========================================================
# ENTROPY METADATA
# =========================================================

def build_entropy_metadata(entropy: bytes):

    return {
        "entropy_hash": hash_entropy(entropy),
        "entropy_bits": len(entropy) * 8,
        "entropy_source": "CSPRNG",
        "generated_at": int(time.time())
    }


# =========================================================
# TERMINAL DEBUG DISPLAY
# =========================================================

def display_entropy(entropy: bytes):

    print("\n==============================")
    print(" QUANTUM ENTROPY GENERATED ")
    print("==============================")

    print(f"Entropy HEX: {entropy.hex()}")
    print(f"Entropy Bits: {len(entropy) * 8}")

    print("\nThis is NOT RSA randomness.")
    print("This uses OS-level CSPRNG entropy.")
    print("==============================\n")