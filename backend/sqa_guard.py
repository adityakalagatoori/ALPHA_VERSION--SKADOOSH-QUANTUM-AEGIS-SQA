"""
SQA Guard — Python SDK wrapper
Wraps the SQA Dragon Warrior gateway so any Python AI agent (LangChain, AutoGPT,
CrewAI, custom) gets post-quantum security with 3 lines of code.

Usage:
    from sqa_guard import SQAGuard
    guard = SQAGuard(api_url="https://your-sqa-instance.onrender.com")
    agent = guard.wrap(agent_id="<your-agent-id>")

    # Now every action is scored, signed, and audited
    result = await agent.run("send email to finance@company.com")
"""

import httpx
import json
import hashlib
import time
from typing import Any, Callable, Awaitable, Optional
from dataclasses import dataclass, field


@dataclass
class SQAVerdict:
    allowed: bool
    risk_score: int
    blocked: bool
    reason: Optional[str]
    audit_log_id: Optional[str]
    chain_hash: Optional[str]
    tigress_clean: bool
    latency_ms: float


class SQAGuard:
    """
    Post-quantum security wrapper for AI agents.
    Intercepts every action, scores it via MANTIS behavioral AI,
    scans it via TIGRESS ArmorClaw, logs it to the SNAKE audit chain,
    and blocks if risk_score > threshold.
    """

    def __init__(
        self,
        api_url: str = "http://127.0.0.1:8000",
        block_threshold: int = 70,
        timeout: float = 10.0,
    ):
        self.api_url = api_url.rstrip("/")
        self.block_threshold = block_threshold
        self.timeout = timeout
        self._client = httpx.AsyncClient(base_url=self.api_url, timeout=timeout)

    def wrap(self, agent_id: str) -> "WrappedAgent":
        return WrappedAgent(guard=self, agent_id=agent_id)

    async def check(self, agent_id: str, action_type: str, payload: dict) -> SQAVerdict:
        t0 = time.monotonic()
        verdict = SQAVerdict(
            allowed=True, risk_score=0, blocked=False, reason=None,
            audit_log_id=None, chain_hash=None, tigress_clean=True,
            latency_ms=0.0,
        )

        try:
            # 1. TIGRESS scan — semantic attack detection
            tigress_resp = await self._client.post("/v2/tigress/scan", json={
                "message": json.dumps(payload),
                "session_id": f"sqa_guard_{agent_id}",
                "agent_id": agent_id,
            })
            if tigress_resp.status_code == 200:
                td = tigress_resp.json()
                if td.get("blocked") or td.get("verdict") == "BLOCKED":
                    verdict.allowed = False
                    verdict.blocked = True
                    verdict.tigress_clean = False
                    verdict.reason = td.get("reason", "TIGRESS ArmorClaw blocked payload")
                    verdict.latency_ms = (time.monotonic() - t0) * 1000
                    return verdict

            # 2. MANTIS score — behavioral anomaly detection
            score_resp = await self._client.post("/v2/behavior/score-action", json={
                "agent_id": agent_id,
                "action_type": action_type,
                "payload": payload,
            })
            if score_resp.status_code == 200:
                sd = score_resp.json()
                verdict.risk_score = sd.get("risk_score", 0)
                if verdict.risk_score > self.block_threshold:
                    verdict.allowed = False
                    verdict.blocked = True
                    verdict.reason = sd.get("block_reason", f"Risk score {verdict.risk_score} exceeds threshold {self.block_threshold}")
                    verdict.latency_ms = (time.monotonic() - t0) * 1000
                    return verdict

            # 3. SNAKE audit — immutable log entry
            audit_resp = await self._client.post("/v2/audit/log", json={
                "agent_id": agent_id,
                "action_type": action_type,
                "payload": payload,
            })
            if audit_resp.status_code == 200:
                ad = audit_resp.json()
                verdict.audit_log_id = ad.get("log_id")
                verdict.chain_hash = ad.get("current_hash")

        except Exception as e:
            # Fail open — SQA unavailable should not break the agent
            # but the action is unaudited (log to stderr)
            import sys
            print(f"[SQA Guard] WARNING: SQA unreachable — action unaudited: {e}", file=sys.stderr)

        verdict.latency_ms = (time.monotonic() - t0) * 1000
        return verdict

    async def close(self):
        await self._client.aclose()

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        await self.close()


class WrappedAgent:
    """Agent proxy — intercepts .run() calls through SQA gateway."""

    def __init__(self, guard: SQAGuard, agent_id: str):
        self._guard = guard
        self._agent_id = agent_id
        self._inner: Optional[Any] = None

    def bind(self, inner_agent: Any) -> "WrappedAgent":
        """Bind a real agent (e.g. LangChain) to proxy its run() calls."""
        self._inner = inner_agent
        return self

    async def run(self, task: str, **kwargs) -> Any:
        verdict = await self._guard.check(
            agent_id=self._agent_id,
            action_type="run_task",
            payload={"task": task, **kwargs},
        )
        if not verdict.allowed:
            raise PermissionError(
                f"[SQA Guard] Action BLOCKED — {verdict.reason} "
                f"(risk_score={verdict.risk_score}, "
                f"latency={verdict.latency_ms:.0f}ms)"
            )
        if self._inner is not None:
            return await self._inner.run(task, **kwargs)
        return {"verdict": "allowed", "audit_log_id": verdict.audit_log_id}

    async def tool_call(self, tool_name: str, arguments: dict) -> Any:
        """Intercept tool_call before execution — used with function-calling agents."""
        verdict = await self._guard.check(
            agent_id=self._agent_id,
            action_type=f"tool_call:{tool_name}",
            payload=arguments,
        )
        if not verdict.allowed:
            return {
                "error": f"SQA_BLOCKED",
                "reason": verdict.reason,
                "risk_score": verdict.risk_score,
            }
        return None  # caller proceeds with original tool

    @property
    def agent_id(self) -> str:
        return self._agent_id
