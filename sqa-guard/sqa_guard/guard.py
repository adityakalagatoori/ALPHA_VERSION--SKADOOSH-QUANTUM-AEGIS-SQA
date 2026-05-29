"""
SQA Guard — post-quantum security wrapper for AI agents.
Every action is intercepted, scanned by TIGRESS ArmorClaw,
scored by MANTIS behavioral AI, then SHA-3-256 / Dilithium-3
logged to the SNAKE immutable audit chain.
"""

from __future__ import annotations

import json
import sys
import time
from dataclasses import dataclass, field
from typing import Any, Optional

import httpx


class SQABlockedError(PermissionError):
    """Raised when SQA blocks an agent action."""

    def __init__(self, reason: str, risk_score: int, latency_ms: float):
        self.reason = reason
        self.risk_score = risk_score
        self.latency_ms = latency_ms
        super().__init__(
            f"[SQA Guard] BLOCKED — {reason} "
            f"(risk_score={risk_score}, latency={latency_ms:.0f}ms)"
        )


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
    tigress_detail: dict = field(default_factory=dict)
    mantis_detail: dict = field(default_factory=dict)
    audit_detail: dict = field(default_factory=dict)


class SQAGuard:
    """
    Post-quantum security wrapper for any AI agent.

    Parameters
    ----------
    api_url : str
        URL of your SQA Dragon Warrior backend.
    block_threshold : int
        MANTIS risk score (0-100) above which actions are blocked.
        Default 70. Set to 0 to log-only (never block).
    timeout : float
        HTTP timeout in seconds for each SQA call.
    fail_open : bool
        If True (default), allow action when SQA is unreachable.
        If False, block all actions when SQA is unreachable.

    Example
    -------
    >>> guard = SQAGuard(api_url="https://your-sqa.onrender.com")
    >>> agent = guard.wrap(agent_id="finance-bot-001")
    >>> result = await agent.run("send wire transfer")
    """

    def __init__(
        self,
        api_url: str = "http://127.0.0.1:8000",
        block_threshold: int = 70,
        timeout: float = 10.0,
        fail_open: bool = True,
    ):
        self.api_url = api_url.rstrip("/")
        self.block_threshold = block_threshold
        self.timeout = timeout
        self.fail_open = fail_open
        self._client: Optional[httpx.AsyncClient] = None

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(base_url=self.api_url, timeout=self.timeout)
        return self._client

    def wrap(self, agent_id: str) -> WrappedAgent:
        """Return a WrappedAgent proxy that intercepts all .run() / .tool_call() calls."""
        return WrappedAgent(guard=self, agent_id=agent_id)

    async def check(
        self,
        agent_id: str,
        action_type: str,
        payload: dict,
    ) -> SQAVerdict:
        """
        Run the full SQA 3-step check:
          1. TIGRESS ArmorClaw — prompt / injection scan
          2. MANTIS behavioral AI — risk score
          3. SNAKE audit chain — immutable log

        Returns an SQAVerdict. Raises nothing — callers decide whether to block.
        """
        t0 = time.monotonic()
        verdict = SQAVerdict(
            allowed=True, risk_score=0, blocked=False, reason=None,
            audit_log_id=None, chain_hash=None, tigress_clean=True,
            latency_ms=0.0,
        )

        try:
            client = self._get_client()

            # ── Step 1: TIGRESS ArmorClaw ─────────────────────────────────────
            tigress_resp = await client.post("/v2/tigress/scan", json={
                "message": json.dumps(payload),
                "session_id": f"sqa_guard_{agent_id}",
                "agent_id": agent_id,
            })
            if tigress_resp.status_code == 200:
                td = tigress_resp.json()
                verdict.tigress_detail = td
                if td.get("blocked") or td.get("verdict") == "BLOCKED":
                    verdict.allowed = False
                    verdict.blocked = True
                    verdict.tigress_clean = False
                    verdict.reason = td.get("reason", "TIGRESS ArmorClaw: injection pattern detected")
                    verdict.latency_ms = (time.monotonic() - t0) * 1000
                    return verdict

            # ── Step 2: MANTIS behavioral scoring ─────────────────────────────
            score_resp = await client.post("/v2/behavior/score-action", json={
                "agent_id": agent_id,
                "action_type": action_type,
                "payload": payload,
            })
            if score_resp.status_code == 200:
                sd = score_resp.json()
                verdict.risk_score = sd.get("risk_score", 0)
                verdict.mantis_detail = sd
                if verdict.risk_score > self.block_threshold:
                    verdict.allowed = False
                    verdict.blocked = True
                    verdict.reason = (
                        sd.get("block_reason")
                        or f"MANTIS: risk_score {verdict.risk_score} > threshold {self.block_threshold}"
                    )
                    verdict.latency_ms = (time.monotonic() - t0) * 1000
                    return verdict

            # ── Step 3: SNAKE audit log ───────────────────────────────────────
            audit_resp = await client.post("/v2/audit/log", json={
                "agent_id": agent_id,
                "action_type": action_type,
                "payload": payload,
            })
            if audit_resp.status_code == 200:
                ad = audit_resp.json()
                verdict.audit_log_id = ad.get("log_id")
                verdict.chain_hash = ad.get("current_hash")
                verdict.audit_detail = ad

        except httpx.ConnectError as e:
            msg = f"SQA unreachable ({self.api_url}): {e}"
            print(f"[SQA Guard] WARNING: {msg}", file=sys.stderr)
            if not self.fail_open:
                verdict.allowed = False
                verdict.blocked = True
                verdict.reason = msg
        except Exception as e:
            print(f"[SQA Guard] WARNING: unexpected error — {e}", file=sys.stderr)
            if not self.fail_open:
                verdict.allowed = False
                verdict.blocked = True
                verdict.reason = str(e)

        verdict.latency_ms = (time.monotonic() - t0) * 1000
        return verdict

    async def aclose(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def __aenter__(self) -> SQAGuard:
        return self

    async def __aexit__(self, *_: Any) -> None:
        await self.aclose()


class WrappedAgent:
    """
    Proxy around any agent object. Intercepts .run() and .tool_call()
    through the SQA 3-step check before delegating to the inner agent.

    Example
    -------
    >>> wrapped = guard.wrap("my-agent-id").bind(my_langchain_agent)
    >>> result = await wrapped.run("write report")   # blocked if risky
    """

    def __init__(self, guard: SQAGuard, agent_id: str):
        self._guard = guard
        self._agent_id = agent_id
        self._inner: Optional[Any] = None

    def bind(self, inner_agent: Any) -> WrappedAgent:
        """Bind a real agent so .run() delegates to it after the SQA check."""
        self._inner = inner_agent
        return self

    async def run(self, task: str, **kwargs: Any) -> Any:
        """Run task through SQA check, then delegate to inner agent."""
        verdict = await self._guard.check(
            agent_id=self._agent_id,
            action_type="run_task",
            payload={"task": task, **kwargs},
        )
        if not verdict.allowed:
            raise SQABlockedError(
                reason=verdict.reason or "blocked",
                risk_score=verdict.risk_score,
                latency_ms=verdict.latency_ms,
            )
        if self._inner is not None:
            # Support both sync and async inner agents
            import asyncio
            inner_run = getattr(self._inner, "arun", None) or getattr(self._inner, "run", None)
            if inner_run:
                result = inner_run(task, **kwargs)
                if asyncio.iscoroutine(result):
                    return await result
                return result
        return {
            "verdict": "allowed",
            "audit_log_id": verdict.audit_log_id,
            "chain_hash": verdict.chain_hash,
            "risk_score": verdict.risk_score,
            "latency_ms": verdict.latency_ms,
        }

    async def tool_call(self, tool_name: str, arguments: dict) -> Optional[dict]:
        """
        Intercept a tool call before execution.
        Returns None if allowed (caller proceeds), or a block dict.

        Example
        -------
        >>> block = await agent.tool_call("send_email", {"to": "cfo@company.com"})
        >>> if block:
        ...     return block   # {"error": "SQA_BLOCKED", "reason": "..."}
        >>> return real_tool.run(arguments)
        """
        verdict = await self._guard.check(
            agent_id=self._agent_id,
            action_type=f"tool:{tool_name}",
            payload=arguments,
        )
        if not verdict.allowed:
            return {
                "error": "SQA_BLOCKED",
                "tool": tool_name,
                "reason": verdict.reason,
                "risk_score": verdict.risk_score,
                "latency_ms": round(verdict.latency_ms),
            }
        return None

    @property
    def agent_id(self) -> str:
        return self._agent_id

    @property
    def guard(self) -> SQAGuard:
        return self._guard
