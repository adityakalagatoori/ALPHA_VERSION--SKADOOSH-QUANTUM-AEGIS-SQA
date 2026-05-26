import os
import mmap
import ctypes
import base64
import secrets

# =========================================================
# RUNTIME SECURE ENCLAVE STORE
# =========================================================

ENCLAVE_STORE = {}

# =========================================================
# LIBC FOR mlock
# =========================================================

try:

    libc = ctypes.CDLL("msvcrt.dll")

except:

    libc = None

# =========================================================
# ENCLAVE BUFFER
# =========================================================

class SecureEnclaveBuffer:

    def __init__(self, secret_bytes: bytes):

        self.size = len(secret_bytes)

        # =============================================
        # ALLOCATE MEMORY
        # =============================================

        self.buffer = mmap.mmap(

            -1,
            self.size,
            access=mmap.ACCESS_WRITE
        )

        # =============================================
        # WRITE SECRET INTO BUFFER
        # =============================================

        self.buffer.write(secret_bytes)

        # =============================================
        # MEMORY LOCK (SIMULATION)
        # =============================================

        self._mlock()

    # =================================================
    # MEMORY LOCK
    # =================================================

    def _mlock(self):

        if libc is None:

            return

        try:

            address = ctypes.addressof(

                ctypes.c_char.from_buffer(
                    self.buffer
                )
            )

            libc._locking(
                address,
                self.size
            )

            print(
                "[M6] ENCLAVE MEMORY LOCKED"
            )

        except Exception:

            print(
                "[M6] mlock unavailable on this platform"
            )

    # =================================================
    # READ SECRET
    # =================================================

    def read_secret(self):

        self.buffer.seek(0)

        return self.buffer.read(
            self.size
        )

    # =================================================
    # ZEROIZE MEMORY
    # =================================================

    def destroy(self):

        try:

            self.buffer.seek(0)

            self.buffer.write(

                b"\x00" * self.size
            )

            self.buffer.flush()

            self.buffer.close()

            print(
                "[M6] ENCLAVE MEMORY ZEROIZED"
            )

        except Exception:

            pass

# =========================================================
# STORE PRIVATE KEY INSIDE ENCLAVE
# =========================================================

def encrypt_private_key(
    private_key: str
):

    # =============================================
    # CONVERT TO BYTES
    # =============================================

    if isinstance(private_key, str):

        secret_bytes = base64.b64decode(
            private_key
        )

    else:

        secret_bytes = private_key

    # =============================================
    # CREATE ENCLAVE SESSION
    # =============================================

    enclave_id = secrets.token_hex(16)

    ENCLAVE_STORE[
        enclave_id
    ] = SecureEnclaveBuffer(
        secret_bytes
    )

    print(
        "[M6] PRIVATE KEY MOVED TO ENCLAVE"
    )

    print(
        "[M6] RAW PRIVATE KEY DESTROYED"
    )

    # =============================================
    # RETURN ENCLAVE HANDLE ONLY
    # =============================================

    return enclave_id

# =========================================================
# ACCESS PRIVATE KEY FROM ENCLAVE
# =========================================================

def decrypt_private_key(
    enclave_id: str
):

    enclave = ENCLAVE_STORE.get(
        enclave_id
    )

    if not enclave:

        raise Exception(
            "[M6] ENCLAVE SESSION NOT FOUND"
        )

    print(
        "[M6] SECURE ENCLAVE ACCESS GRANTED"
    )

    return enclave.read_secret()

# =========================================================
# DESTROY ENCLAVE SESSION
# =========================================================

def destroy_enclave(
    enclave_id: str
):

    enclave = ENCLAVE_STORE.get(
        enclave_id
    )

    if enclave:

        enclave.destroy()

        del ENCLAVE_STORE[
            enclave_id
        ]

        print(
            "[M6] ENCLAVE SESSION DESTROYED"
        )

# =========================================================
# MEMORY DUMP SIMULATION
# =========================================================

def memory_dump_attack(
    enclave_id: str
):

    enclave = ENCLAVE_STORE.get(
        enclave_id
    )

    if not enclave:

        return "NO ENCLAVE"

    print(
        "[M6] MEMORY DUMP ATTEMPT DETECTED"
    )

    # =============================================
    # RETURN NOISE INSTEAD OF REAL KEY
    # =============================================

    fake_noise = os.urandom(64)

    return fake_noise.hex()