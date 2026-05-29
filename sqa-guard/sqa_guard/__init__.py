"""
sqa-guard — Post-quantum AI agent security wrapper.

Quick start:
    from sqa_guard import SQAGuard
    guard = SQAGuard(api_url="https://your-sqa.onrender.com")
    agent = guard.wrap(agent_id="your-agent-id")
    result = await agent.run("summarise Q3 revenue report")
"""

from .guard import SQAGuard, WrappedAgent, SQAVerdict, SQABlockedError

__all__ = ["SQAGuard", "WrappedAgent", "SQAVerdict", "SQABlockedError"]
__version__ = "0.1.0"
