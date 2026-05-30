"""
Clean terminal banners for every feature/attack trigger.
Usage:
    from utils.feature_logger import log_feature, log_result

    log_feature("M1", "KYBER-1024 KEYPAIR GEN", agent_id, {"action": "generate"})
    log_result("M1", "SUCCESS", {"public_key": "abc..."})
"""
from datetime import datetime
import sys


WARRIOR_LABELS = {
    "M": "[MONKEY]",
    "C": "[CRANE]",
    "S": "[SNAKE]",
    "A": "[MANTIS]",
    "T": "[TIGRESS]",
    "P": "[PO]",
    "#": "[MIRROR]",
    "CP": "[COMPLIANCE]",
}

STATUS_LABELS = {
    "SUCCESS":  "[OK]",
    "BLOCKED":  "[BLOCKED]",
    "TAMPERED": "[TAMPERED]",
    "FLAGGED":  "[FLAGGED]",
    "ERROR":    "[ERROR]",
    "INFO":     "[INFO]",
}


def _safe_print(*args, **kwargs):
    try:
        print(*args, **kwargs)
    except (UnicodeEncodeError, UnicodeDecodeError):
        safe = " ".join(
            str(a).encode("ascii", errors="replace").decode("ascii")
            for a in args
        )
        print(safe, **{k: v for k, v in kwargs.items() if k != "end"})


def _warrior(feature_id: str) -> str:
    prefix = feature_id[0].upper() if feature_id else "?"
    return WARRIOR_LABELS.get(prefix, "[SQA]")


def log_feature(feature_id: str, name: str, agent_id: str = "-", details: dict = None):
    """Print a banner when a feature/attack is triggered."""
    warrior = _warrior(feature_id)
    ts = datetime.utcnow().strftime("%H:%M:%S")
    width = 60
    bar = "=" * width

    _safe_print(f"\n+{bar}+")
    _safe_print(f"| {warrior}  {feature_id}: {name}")
    _safe_print(f"+{bar}+")
    _safe_print(f"| Time: {ts}   Agent: {str(agent_id)[:36]}")
    if details:
        for k, v in list(details.items())[:4]:
            _safe_print(f"|   {k}: {str(v)[:50]}")
    _safe_print(f"+{bar}+")


def log_result(feature_id: str, status: str, agent_id_or_data=None, data: dict = None):
    """Print the result/outcome of a feature call.

    Accepts two call patterns:
      log_result("M1", "SUCCESS", {"key": "val"})          # legacy 3-arg
      log_result("WARDEN", "SEALED", "agent-id", {"k":"v"})  # new 4-arg
    """
    if isinstance(agent_id_or_data, dict) and data is None:
        data = agent_id_or_data
    elif agent_id_or_data is not None and not isinstance(agent_id_or_data, dict) and data is None:
        pass  # agent_id provided, no data — fine
    label = STATUS_LABELS.get(status.upper(), "[>>]")
    ts = datetime.utcnow().strftime("%H:%M:%S")
    _safe_print(f"  {label} [{feature_id}] {status}", end="")
    if data:
        parts = []
        for k, v in list(data.items())[:3]:
            parts.append(f"{k}={str(v)[:40]}")
        if parts:
            _safe_print(f"  |  {' | '.join(parts)}", end="")
    _safe_print(f"  [{ts}]")
