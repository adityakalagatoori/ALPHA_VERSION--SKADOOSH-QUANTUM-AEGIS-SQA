from datetime import datetime
from collections import defaultdict
import statistics
import math
import json

from db.supabase import supabase
from services.gemini_service import (
    score_anomaly_with_gemini,
    predict_threat_with_gemini
)

try:
    from middleware.honeypot_middleware import (
        add_to_honeypot
    )
    HONEYPOT_AVAILABLE = True
except Exception as e:
    print(f"[MANTIS] Honeypot middleware not available: {e}")
    HONEYPOT_AVAILABLE = False

try:
    from services.oracle_scroll_service import (
        get_oracle_prediction,
        trigger_oracle_learning
    )
    ORACLE_AVAILABLE = True
except Exception as e:
    print(f"[MANTIS] Oracle Scroll not available: {e}")
    ORACLE_AVAILABLE = False

# =========================================================
# IN-MEMORY CACHE (fallback if DB slow)
# =========================================================

AGENT_BASELINES = {}
AGENT_ACTIONS = defaultdict(list)
HONEYPOT_EVENTS = []
ORACLE_PREDICTIONS = []

# =========================================================
# A1 + A2
# REGISTER BASELINE (PERSISTENT)
# =========================================================

async def register_agent_baseline(
    agent_id: str,
    sector: str,
    role: str = "agent",
    capabilities: list = None
):

    peer_baseline = build_peer_class_baseline(
        sector=sector,
        role=role
    )

    baseline_record = {
        "agent_id": agent_id,
        "sector": sector,
        "role": role,
        "capabilities": capabilities,
        "learning_phase": True,
        "baseline_ready": False,
        "action_count": 0,
        "avg_payload_size": peer_baseline["avg_payload_size"],
        "avg_response_time": peer_baseline["avg_response_time"],
        "created_at": datetime.utcnow().isoformat()
    }

    AGENT_BASELINES[agent_id] = baseline_record

    # =====================================================
    # A1/A2: PERSIST TO SUPABASE
    # =====================================================
    try:
        supabase.table("mantis_baselines").upsert({
            "agent_id": agent_id,
            "sector": sector,
            "role": role,
            "capabilities": capabilities,
            "learning_phase": True,
            "baseline_ready": False,
            "action_count": 0,
            "avg_payload_size": peer_baseline["avg_payload_size"],
            "avg_response_time": peer_baseline["avg_response_time"]
        }).execute()
    except Exception as e:
        print(f"[MANTIS] Baseline persist error: {e}")

    return {
        "status": "registered",
        "mantis": "ACTIVE",
        "peer_baseline": peer_baseline,
        "message": "Agent inherited peer-class baseline"
    }

# =========================================================
# A2
# PEER CLASS BASELINE
# =========================================================

def build_peer_class_baseline(
    sector: str,
    role: str
):

    sector_defaults = {

        "banking": {
            "avg_payload_size": 1200,
            "avg_response_time": 0.8
        },

        "healthcare": {
            "avg_payload_size": 1800,
            "avg_response_time": 1.2
        },

        "government": {
            "avg_payload_size": 1500,
            "avg_response_time": 1.5
        }
    }

    return sector_defaults.get(

        sector.lower(),

        {
            "avg_payload_size": 1000,
            "avg_response_time": 1.0
        }
    )

# =========================================================
# A3: REALTIME ANOMALY SCORING (GEMINI GUARDRAILED)
# =========================================================

async def process_agent_action(
    agent_id: str,
    action: str,
    endpoint: str,
    payload_size: int,
    response_time: float,
    metadata: dict
):

    if agent_id not in AGENT_BASELINES:
        return {"error": "Unknown agent"}

    baseline = AGENT_BASELINES[agent_id]

    action_record = {
        "timestamp": str(datetime.utcnow()),
        "action": action,
        "endpoint": endpoint,
        "payload_size": payload_size,
        "response_time": response_time
    }

    AGENT_ACTIONS[agent_id].append(action_record)
    baseline["action_count"] += 1

    # =====================================================
    # LEARNING PHASE (FIRST 50 ACTIONS)
    # =====================================================

    if baseline["action_count"] <= 50:
        update_learning_baseline(baseline, payload_size, response_time)

        # Persist learning update
        try:
            supabase.table("mantis_baselines").update({
                "action_count": baseline["action_count"],
                "avg_payload_size": baseline["avg_payload_size"],
                "avg_response_time": baseline["avg_response_time"]
            }).eq("agent_id", agent_id).execute()
        except Exception as e:
            print(f"[MANTIS] Learning update error: {e}")

        return {
            "mode": "LEARNING",
            "baseline_progress": baseline["action_count"],
            "score": 5,
            "message": "Building behavioral baseline"
        }

    baseline["learning_phase"] = False
    baseline["baseline_ready"] = True

    # =====================================================
    # A3: BASE ANOMALY SCORE (HEURISTIC)
    # =====================================================

    base_score = calculate_anomaly_score(
        baseline=baseline,
        payload_size=payload_size,
        response_time=response_time,
        endpoint=endpoint
    )

    # =====================================================
    # A4: GEMINI GUARDRAILED REFINEMENT
    # =====================================================

    payload_delta = abs(payload_size - baseline["avg_payload_size"])
    response_delta = abs(response_time - baseline["avg_response_time"])

    endpoint_risk = "HIGH" if endpoint in ["/admin/delete", "/root/access", "/system/export", "/vault/keys"] else "LOW"

    anomaly_vector = {
        "payload_delta": payload_delta,
        "response_delta": response_delta,
        "endpoint_risk_category": endpoint_risk
    }

    gemini_result = score_anomaly_with_gemini(agent_id, anomaly_vector, baseline, endpoint)
    gemini_reasoning = gemini_result.get("reasoning", "")
    confidence_adj = gemini_result.get("confidence_adjustment", 0)

    final_score = min(100, max(0, base_score + confidence_adj))

    alert = final_score >= 70
    honeypot = final_score >= 90

    # =====================================================
    # A3: PERSIST ACTION HISTORY TO SUPABASE
    # =====================================================

    try:
        supabase.table("mantis_action_history").insert({
            "agent_id": agent_id,
            "action": action,
            "endpoint": endpoint,
            "payload_size": payload_size,
            "response_time": response_time,
            "anomaly_score": final_score,
            "gemini_reasoning": gemini_reasoning,
            "metadata": metadata
        }).execute()
    except Exception as e:
        print(f"[MANTIS] Action history persist error: {e}")

    # =====================================================
    # A7/A8: HONEYPOT ROUTING + ISOLATION
    # =====================================================

    if honeypot:
        event = {
            "agent_id": agent_id,
            "score": final_score,
            "endpoint": endpoint,
            "timestamp": str(datetime.utcnow()),
            "status": "HONEYPOT_ROUTED"
        }
        HONEYPOT_EVENTS.append(event)

        # A7: Add agent to honeypot isolation
        if HONEYPOT_AVAILABLE:
            add_to_honeypot(agent_id, final_score)

        # A8: Persist honeypot event
        try:
            supabase.table("mantis_honeypot_logs").insert({
                "agent_id": agent_id,
                "endpoint": endpoint,
                "anomaly_score": final_score,
                "fake_response": {"status": "success", "message": "Action completed"},
                "real_action_blocked": True,
                "metadata": metadata
            }).execute()
        except Exception as e:
            print(f"[MANTIS] Honeypot log error: {e}")

        # A9: Generate oracle prediction
        await generate_oracle_prediction_async(agent_id, endpoint)

    return {
        "agent_id": agent_id,
        "score": final_score,
        "alert": alert,
        "honeypot": honeypot,
        "status": "ANOMALY" if alert else "NORMAL",
        "baseline_ready": True,
        "gemini_reasoning": gemini_reasoning
    }

# =========================================================
# LEARNING ENGINE
# =========================================================

def update_learning_baseline(
    baseline,
    payload_size,
    response_time
):

    count = baseline["action_count"]

    baseline["avg_payload_size"] = (
        (
            baseline["avg_payload_size"]
            * (count - 1)
        )
        + payload_size
    ) / count

    baseline["avg_response_time"] = (
        (
            baseline["avg_response_time"]
            * (count - 1)
        )
        + response_time
    ) / count

# =========================================================
# A3
# ANOMALY SCORE ENGINE
# =========================================================

def calculate_anomaly_score(
    baseline,
    payload_size,
    response_time,
    endpoint
):

    payload_delta = abs(
        payload_size
        - baseline["avg_payload_size"]
    )

    response_delta = abs(
        response_time
        - baseline["avg_response_time"]
    )

    payload_score = min(
        payload_delta / 20,
        50
    )

    response_score = min(
        response_delta * 30,
        30
    )

    suspicious_endpoints = [

        "/admin/delete",

        "/root/access",

        "/system/export",

        "/vault/keys"
    ]

    endpoint_score = (
        25
        if endpoint in suspicious_endpoints
        else 0
    )

    randomness = random.randint(
        0,
        10
    )

    final_score = min(

        int(
            payload_score
            + response_score
            + endpoint_score
            + randomness
        ),

        100
    )

    return final_score

# =========================================================
# BASELINE FETCH (CACHE + DB)
# =========================================================

async def get_agent_baseline(
    agent_id: str
):
    """Fetch baseline from cache, fallback to Supabase."""

    if agent_id in AGENT_BASELINES:
        return AGENT_BASELINES[agent_id]

    # Load from Supabase
    try:
        result = supabase.table("mantis_baselines").select("*").eq("agent_id", agent_id).execute()
        if result.data and len(result.data) > 0:
            baseline = result.data[0]
            AGENT_BASELINES[agent_id] = baseline
            return baseline
    except Exception as e:
        print(f"[MANTIS] Baseline fetch error: {e}")

    return {}

# =========================================================
# LOAD BASELINES FROM SUPABASE AT STARTUP
# =========================================================

def load_baselines_from_db():
    """Restore agent baselines from Supabase on module init."""
    import threading

    def _load():
        try:
            result = supabase.table("mantis_baselines").select("*").execute()
            if result.data:
                for row in result.data:
                    AGENT_BASELINES[row["agent_id"]] = row
                print(f"[MANTIS] Loaded {len(result.data)} baselines from Supabase")
        except Exception as e:
            print(f"[MANTIS] Load baselines error: {e}")

    # Run with 8-second timeout so slow Supabase doesn't block startup
    t = threading.Thread(target=_load, daemon=True)
    t.start()
    t.join(timeout=8)
    if t.is_alive():
        print("[MANTIS] Baseline load timed out — starting with empty baselines")

# Load on module init
load_baselines_from_db()

# =========================================================
# A8
# HONEYPOT EVENTS
# =========================================================

async def get_honeypot_events():

    return {

        "events":
            HONEYPOT_EVENTS[-20:]
    }

# =========================================================
# A9: ORACLE SCROLL (ML + GEMINI POWERED PREDICTIONS)
# =========================================================

async def generate_oracle_prediction_async(
    agent_id: str,
    endpoint: str
):
    """
    Use ML model + Gemini to predict next threat vector.
    A9: Real Oracle Scroll predictive CVE model.
    """

    recent_endpoints = [e.get("endpoint", "") for e in HONEYPOT_EVENTS[-10:]]

    # A9: ML-based prediction (primary)
    if ORACLE_AVAILABLE:
        honeypot_telemetry = {
            "escalation_score": 0.7 if len(HONEYPOT_EVENTS) > 5 else 0.3,
            "frequency": len(HONEYPOT_EVENTS)
        }

        ml_prediction = await get_oracle_prediction(agent_id, recent_endpoints, honeypot_telemetry)
        prediction_record = {
            "agent_id": agent_id,
            "endpoint": endpoint,
            "predicted_threat": ml_prediction.get("prediction", "Unknown threat"),
            "confidence": ml_prediction.get("confidence", 0.5),
            "source_event_type": "ML_PREDICTION",
            "metadata": {
                "predicted_endpoint": ml_prediction.get("predicted_endpoint", ""),
                "attack_chain": ml_prediction.get("attack_chain", []),
                "reasoning": ml_prediction.get("reasoning", "")
            }
        }
    else:
        # Fallback to Gemini-only
        gemini_prediction = predict_threat_with_gemini(HONEYPOT_EVENTS[-10:], recent_endpoints)
        prediction_record = {
            "agent_id": agent_id,
            "endpoint": endpoint,
            "predicted_threat": gemini_prediction.get("prediction", "Unknown threat"),
            "confidence": gemini_prediction.get("confidence", 0.5),
            "source_event_type": "HONEYPOT_TRIGGER",
            "metadata": {"gemini_available": gemini_prediction.get("available", False)}
        }

    ORACLE_PREDICTIONS.append(prediction_record)

    # A9: Predictions already persisted by oracle_scroll_service
    if not ORACLE_AVAILABLE:
        try:
            supabase.table("mantis_oracle_predictions").insert({
                "agent_id": agent_id,
                "endpoint": endpoint,
                "predicted_threat": prediction_record["predicted_threat"],
                "confidence": prediction_record["confidence"],
                "source_event_type": "HONEYPOT_TRIGGER",
                "metadata": prediction_record["metadata"]
            }).execute()
        except Exception as e:
            print(f"[MANTIS] Oracle prediction persist error: {e}")

async def get_oracle_predictions():
    return {
        "predictions": ORACLE_PREDICTIONS[-20:]
    }


# =========================================================
# PO GATEWAY ADAPTER
# Behavioral analysis entry point used by the Dragon Warrior
# pipeline. Maps a gateway request into a MANTIS action and
# returns a normalized {"risk_score": int} verdict.
# =========================================================

async def analyze_agent_behavior(data: dict) -> dict:

    agent_id = data.get("agent_id")
    action = data.get("action", "unknown")
    payload = data.get("payload", {})

    # No baseline yet => MONKEY identity gate already vouched for the
    # agent; behaviorally we have nothing to flag on, so low risk.
    if agent_id not in AGENT_BASELINES:
        return {
            "risk_score": 0,
            "status": "NO_BASELINE",
            "reason": "Behavioral baseline not yet established",
        }

    payload_size = len(json.dumps(payload)) if payload else 0

    result = await process_agent_action(
        agent_id=agent_id,
        action=action,
        endpoint=action,
        payload_size=payload_size,
        response_time=0.1,
        metadata={},
    )

    return {
        "risk_score": result.get("score", 0),
        "status": result.get("status", "NORMAL"),
        "reason": result.get("gemini_reasoning", "Behavioral analysis complete"),
    }