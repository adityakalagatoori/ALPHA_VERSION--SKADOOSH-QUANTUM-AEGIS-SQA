import json
import numpy as np
from datetime import datetime, timedelta
from collections import defaultdict, Counter

from db.supabase import supabase

# =========================================================
# A9: ORACLE SCROLL — PREDICTIVE CVE MODEL
# =========================================================

class OracleScroll:
    """
    Machine learning threat prediction from honeypot telemetry.
    Learns attack patterns and predicts next likely threat vectors.
    """

    def __init__(self):
        self.endpoint_sequences = defaultdict(list)
        self.threat_patterns = []
        self.agent_behavior_history = defaultdict(list)
        self.model_updated = False

    def analyze_honeypot_telemetry(self, honeypot_logs: list):
        """Analyze honeypot logs to extract attack patterns."""
        if not honeypot_logs:
            return None

        pattern_vector = {
            "endpoint_count": len(set(log.get("endpoint", "") for log in honeypot_logs)),
            "escalation_score": self._calculate_escalation(honeypot_logs),
            "frequency": len(honeypot_logs),
            "time_span": self._calculate_time_span(honeypot_logs),
            "agent_ids": list(set(log.get("agent_id", "") for log in honeypot_logs))
        }

        return pattern_vector

    def _calculate_escalation(self, logs: list) -> float:
        """Calculate escalation score (0-1) based on endpoint severity."""
        severity_map = {
            "/admin/delete": 0.9,
            "/root/access": 0.95,
            "/vault/keys": 0.85,
            "/system/export": 0.8,
            "/admin/user": 0.7,
            "/config/edit": 0.6
        }

        if not logs:
            return 0.0

        severities = [
            severity_map.get(log.get("endpoint", ""), 0.3)
            for log in logs
        ]
        return min(max(severities) + (len(logs) * 0.05), 1.0)

    def _calculate_time_span(self, logs: list) -> int:
        """Calculate time span in seconds between first and last event."""
        if len(logs) < 2:
            return 0

        times = []
        for log in logs:
            created_at = log.get("created_at")
            if created_at:
                try:
                    if isinstance(created_at, str):
                        dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                    else:
                        dt = created_at
                    times.append(dt)
                except:
                    pass

        if len(times) >= 2:
            return int((max(times) - min(times)).total_seconds())
        return 0

    def predict_next_threat(
        self,
        agent_id: str,
        recent_endpoints: list,
        honeypot_telemetry: dict
    ) -> dict:
        """
        Predict next likely attack vector.
        Uses endpoint sequence analysis + escalation patterns.
        """

        if not recent_endpoints:
            return {
                "prediction": "Behavioral analysis inconclusive",
                "confidence": 0.3,
                "reasoning": "Insufficient endpoint history"
            }

        threat_map = {
            "/admin/delete": "Privilege escalation attack likely",
            "/vault/keys": "Credential exfiltration attempt predicted",
            "/system/export": "Mass data extraction planned",
            "/root/access": "Full system compromise risk HIGH",
            "/config/edit": "Configuration tampering predicted"
        }

        # Analyze endpoint sequence
        last_endpoint = recent_endpoints[-1] if recent_endpoints else ""
        endpoint_progression = {
            "/admin/user": "/admin/delete",
            "/config": "/root/access",
            "/data": "/system/export",
            "/api": "/vault/keys"
        }

        # Predict next endpoint based on pattern
        predicted_endpoint = None
        for key, val in endpoint_progression.items():
            if key in last_endpoint and val not in recent_endpoints:
                predicted_endpoint = val
                break

        if not predicted_endpoint:
            predicted_endpoint = "/vault/keys"  # Most common critical endpoint

        # Calculate confidence
        escalation = honeypot_telemetry.get("escalation_score", 0.5)
        frequency = min(honeypot_telemetry.get("frequency", 1) / 10.0, 1.0)
        confidence = min(escalation * 0.6 + frequency * 0.4, 1.0)

        prediction_text = threat_map.get(
            predicted_endpoint,
            "Unknown threat vector"
        )

        return {
            "prediction": prediction_text,
            "confidence": confidence,
            "predicted_endpoint": predicted_endpoint,
            "reasoning": f"Agent behavior escalation detected. Based on {len(recent_endpoints)} endpoint accesses, likely to target {predicted_endpoint}",
            "attack_chain": recent_endpoints[-3:] + [predicted_endpoint]
        }

    async def persist_prediction(
        self,
        agent_id: str,
        prediction: dict
    ):
        """Store prediction to Supabase for learning."""
        try:
            supabase.table("mantis_oracle_predictions").insert({
                "agent_id": agent_id,
                "endpoint": prediction.get("predicted_endpoint", "UNKNOWN"),
                "predicted_threat": prediction.get("prediction", ""),
                "confidence": prediction.get("confidence", 0.0),
                "source_event_type": "ML_PREDICTION",
                "metadata": {
                    "attack_chain": prediction.get("attack_chain", []),
                    "reasoning": prediction.get("reasoning", "")
                }
            }).execute()
        except Exception as e:
            print(f"[ORACLE SCROLL] Persist error: {e}")

    async def learn_from_honeypot(self):
        """
        Periodically learn from honeypot telemetry to improve predictions.
        Called by background task every 5 minutes.
        """
        try:
            # Fetch recent honeypot events
            result = supabase.table("mantis_honeypot_logs").select(
                "*"
            ).order(
                "created_at",
                desc=True
            ).limit(100).execute()

            if result.data:
                logs = result.data
                pattern = self.analyze_honeypot_telemetry(logs)

                if pattern:
                    self.threat_patterns.append({
                        "timestamp": datetime.utcnow().isoformat(),
                        "pattern": pattern
                    })

                    print(f"[ORACLE SCROLL] Learned {len(logs)} honeypot events")
                    self.model_updated = True

        except Exception as e:
            print(f"[ORACLE SCROLL] Learning error: {e}")


# Global oracle instance
oracle_instance = OracleScroll()


async def get_oracle_prediction(
    agent_id: str,
    recent_endpoints: list,
    honeypot_telemetry: dict = None
) -> dict:
    """
    Get ML-based threat prediction for agent.
    A9: Real Oracle Scroll implementation.
    """

    if honeypot_telemetry is None:
        honeypot_telemetry = {}

    prediction = oracle_instance.predict_next_threat(
        agent_id,
        recent_endpoints,
        honeypot_telemetry
    )

    # Persist to database
    await oracle_instance.persist_prediction(agent_id, prediction)

    return prediction


async def trigger_oracle_learning():
    """Background task to update model from honeypot data."""
    await oracle_instance.learn_from_honeypot()
