"""
Background task: pre-generates Kyber-1024 + Dilithium-3 keypairs
into keypair_pool table so agent registration completes under 2s.
"""
import asyncio
import time
import threading
import os

POOL_TARGET = 20
POOL_REFILL_THRESHOLD = 10
REFILL_INTERVAL_SECONDS = 60


def _generate_one_keypair() -> dict:
    import oqs
    import base64

    kem = oqs.KeyEncapsulation("Kyber1024")
    kyber_pub = base64.b64encode(kem.generate_keypair()).decode()

    sig = oqs.Signature("ML-DSA-65")
    dil_pub = base64.b64encode(sig.generate_keypair()).decode()
    dil_priv = base64.b64encode(sig.export_secret_key()).decode()

    return {
        "kyber_pub": kyber_pub,
        "dilithium_pub": dil_pub,
        "dilithium_priv_enc": dil_priv,
        "used": False,
    }


def _count_available(db) -> int:
    try:
        res = db.table("keypair_pool").select("id", count="exact").eq("used", False).execute()
        return res.count or 0
    except Exception:
        return 0


def _fill_pool(db, target: int = POOL_TARGET):
    available = _count_available(db)
    needed = target - available
    if needed <= 0:
        return

    print(f"[KEYPAIR POOL] Generating {needed} keypairs...")
    pairs = []
    for _ in range(needed):
        try:
            pairs.append(_generate_one_keypair())
        except Exception as e:
            print(f"[KEYPAIR POOL] Error generating keypair: {e}")

    if pairs:
        try:
            db.table("keypair_pool").insert(pairs).execute()
            print(f"[KEYPAIR POOL] Added {len(pairs)} keypairs. Pool ready.")
        except Exception as e:
            print(f"[KEYPAIR POOL] DB insert error: {e}")


def pop_keypair(db) -> dict | None:
    try:
        res = (
            db.table("keypair_pool")
            .select("*")
            .eq("used", False)
            .order("created_at")
            .limit(1)
            .execute()
        )
        if not res.data:
            return None
        row = res.data[0]
        db.table("keypair_pool").update({"used": True}).eq("id", row["id"]).execute()
        return row
    except Exception as e:
        print(f"[KEYPAIR POOL] pop error: {e}")
        return None


def _refill_loop(db):
    while True:
        time.sleep(REFILL_INTERVAL_SECONDS)
        available = _count_available(db)
        if available < POOL_REFILL_THRESHOLD:
            _fill_pool(db, POOL_TARGET)


async def start_keypair_pool():
    from services.db import get_admin_db
    db = get_admin_db()

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, lambda: _fill_pool(db, POOL_TARGET))

    t = threading.Thread(target=_refill_loop, args=(db,), daemon=True)
    t.start()
    print(f"[KEYPAIR POOL] Background refill thread started.")
