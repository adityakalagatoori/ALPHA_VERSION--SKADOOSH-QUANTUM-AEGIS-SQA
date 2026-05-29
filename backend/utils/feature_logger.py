"""
Clean terminal banners for every feature/attack trigger.
Usage:
    from utils.feature_logger import log_feature, log_result

    log_feature("M1", "KYBER-1024 KEYPAIR GEN", agent_id, {"action": "generate"})
    log_result("M1", "SUCCESS", {"public_key": "abc..."})
"""
from datetime import datetime


WARRIOR_ICONS = {
    "M": "🐒 MONKEY",
    "C": "🦢 CRANE",
    "S": "🐍 SNAKE",
    "A": "🦗 MANTIS",
    "T": "🐯 TIGRESS",
    "P": "🐼 PO",
    "#": "⚔️  MIRROR",
}

STATUS_ICONS = {
    "SUCCESS":  "✅",
    "BLOCKED":  "🚫",
    "TAMPERED": "🔴",
    "FLAGGED":  "⚠️ ",
    "ERROR":    "❌",
    "INFO":     "ℹ️ ",
}


def _warrior(feature_id: str) -> str:
    prefix = feature_id[0].upper() if feature_id else "?"
    return WARRIOR_ICONS.get(prefix, "🔷")


def log_feature(feature_id: str, name: str, agent_id: str = "—", details: dict = None):
    """Print a banner when a feature/attack is triggered."""
    warrior = _warrior(feature_id)
    ts = datetime.utcnow().strftime("%H:%M:%S")
    line = f"[{feature_id}] {name}"
    width = max(len(line) + 4, 50)
    bar = "═" * width

    print(f"\n╔{bar}╗")
    print(f"║  {warrior}  —  {line:<{width - len(warrior) - 7}}║")
    print(f"╠{bar}╣")
    print(f"║  🕐 {ts}   Agent: {str(agent_id)[:30]:<30}  ║")
    if details:
        for k, v in list(details.items())[:4]:
            val = str(v)[:width - len(k) - 8]
            print(f"║  → {k}: {val:<{width - len(k) - 5}}║")
    print(f"╚{bar}╝")


def log_result(feature_id: str, status: str, data: dict = None):
    """Print the result/outcome of a feature call."""
    icon = STATUS_ICONS.get(status.upper(), "▸")
    ts = datetime.utcnow().strftime("%H:%M:%S")
    print(f"  {icon} [{feature_id}] {status}", end="")
    if data:
        parts = []
        for k, v in list(data.items())[:3]:
            val = str(v)[:40]
            parts.append(f"{k}={val}")
        if parts:
            print(f"  |  {' · '.join(parts)}", end="")
    print(f"  [{ts}]\n")
