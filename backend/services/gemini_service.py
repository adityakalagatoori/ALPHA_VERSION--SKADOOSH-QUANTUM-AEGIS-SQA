import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ONLINE_MODE = os.getenv("ONLINE_MODE", "true").lower() == "true"
OLLAMA_ENDPOINT = os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama2")

# Handle deprecated google.generativeai package
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    try:
        import google.genai as genai
        GEMINI_AVAILABLE = True
    except:
        genai = None
        GEMINI_AVAILABLE = False

if GEMINI_API_KEY and ONLINE_MODE and GEMINI_AVAILABLE:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
    except:
        pass

# =========================================================
# A6: OLLAMA LOCAL FALLBACK
# =========================================================

def score_anomaly_with_ollama(
    anomaly_vector: dict,
    baseline: dict
):
    """Fallback to local Ollama LLM for offline mode."""
    try:
        prompt = f"""
Analyze this statistical vector for anomaly:
Payload delta: {anomaly_vector.get('payload_delta', 0)}
Response delta: {anomaly_vector.get('response_delta', 0)}
Endpoint risk: {anomaly_vector.get('endpoint_risk_category', 'LOW')}
Learning phase: {baseline.get('learning_phase', False)}

Return JSON: {{"reasoning": "...", "confidence_adjustment": -10 to 20}}
"""

        response = requests.post(
            f"{OLLAMA_ENDPOINT}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            response_text = result.get("response", "")

            if "{" in response_text:
                json_start = response_text.index("{")
                json_end = response_text.rindex("}") + 1
                json_str = response_text[json_start:json_end]
                parsed = json.loads(json_str)
                return {
                    "available": True,
                    "reasoning": parsed.get("reasoning", "Ollama analysis"),
                    "confidence_adjustment": parsed.get("confidence_adjustment", 0),
                    "source": "OLLAMA_LOCAL"
                }

        return {
            "available": False,
            "reasoning": "Ollama unavailable",
            "confidence_adjustment": 0,
            "source": "OLLAMA_FAILED"
        }

    except Exception as e:
        print(f"[OLLAMA ERROR] {e}")
        return {
            "available": False,
            "reasoning": f"Ollama error: {str(e)[:30]}",
            "confidence_adjustment": 0,
            "source": "OLLAMA_ERROR"
        }

# =========================================================
# A4: GUARDRAILED GEMINI — VECTORS ONLY
# =========================================================

def score_anomaly_with_gemini(
    agent_id: str,
    anomaly_vector: dict,
    baseline: dict,
    endpoint: str
):
    """
    Guardrailed Gemini scoring with Ollama fallback.
    Input: Statistical vectors only (deltas, thresholds, endpoint risk).
    Never send raw agent context or prompts.
    Output: Reasoning + confidence adjustment.
    """

    if not GEMINI_API_KEY or not ONLINE_MODE:
        return score_anomaly_with_ollama(anomaly_vector, baseline)

    try:
        # =====================================================
        # BUILD VECTOR ONLY (NO RAW DATA)
        # =====================================================

        guardrail_vector = {
            "payload_delta": anomaly_vector.get("payload_delta", 0),
            "response_delta": anomaly_vector.get("response_delta", 0),
            "endpoint_risk_category": anomaly_vector.get("endpoint_risk_category", "LOW"),
            "baseline_payload": baseline.get("avg_payload_size", 0),
            "baseline_response": baseline.get("avg_response_time", 0),
            "learning_phase": baseline.get("learning_phase", False),
            "action_count": baseline.get("action_count", 0)
        }

        # =====================================================
        # GUARDRAILED PROMPT
        # =====================================================

        prompt = f"""
You are a security anomaly analyst. Evaluate this statistical vector ONLY:

VECTOR:
{json.dumps(guardrail_vector, indent=2)}

Rules:
1. Do NOT try to identify agent identity or raw behavior
2. Do NOT access external data
3. Return ONLY JSON with: reasoning (1-2 sentences), confidence_adjustment (-10 to +20)

Example output:
{{"reasoning": "Payload 40% above baseline, endpoint is high-risk category.", "confidence_adjustment": 10}}

Analyze the statistical vector and return JSON only.
"""

        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)

        response_text = response.text.strip()

        # Parse JSON response
        if "{" in response_text:
            json_start = response_text.index("{")
            json_end = response_text.rindex("}") + 1
            json_str = response_text[json_start:json_end]
            result = json.loads(json_str)
            return {
                "available": True,
                "reasoning": result.get("reasoning", ""),
                "confidence_adjustment": result.get("confidence_adjustment", 0)
            }
        else:
            return {
                "available": True,
                "reasoning": response_text[:100],
                "confidence_adjustment": 0
            }

    except Exception as e:
        print(f"[GEMINI ERROR] {e}, falling back to Ollama")
        return score_anomaly_with_ollama(anomaly_vector, baseline)

# =========================================================
# A6: OLLAMA THREAT PREDICTION FALLBACK
# =========================================================

def predict_threat_with_ollama(
    honeypot_events: list,
    recent_endpoints: list
):
    """Predict threat using local Ollama in offline mode."""
    try:
        threat_count = len(honeypot_events)
        threat_pattern = "escalation" if threat_count > 3 else "isolated"

        prompt = f"""
Predict next attack vector from honeypot data:
Recent endpoints: {recent_endpoints[:5]}
Threat count: {threat_count}
Pattern: {threat_pattern}

Respond with JSON: {{"prediction": "...", "confidence": 0.0-1.0}}
"""

        response = requests.post(
            f"{OLLAMA_ENDPOINT}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            response_text = result.get("response", "")

            if "{" in response_text:
                json_start = response_text.index("{")
                json_end = response_text.rindex("}") + 1
                json_str = response_text[json_start:json_end]
                parsed = json.loads(json_str)
                return {
                    "available": True,
                    "prediction": parsed.get("prediction", "Unknown threat"),
                    "confidence": min(parsed.get("confidence", 0.5), 1.0),
                    "source": "OLLAMA_LOCAL"
                }

        return {
            "available": False,
            "prediction": "Ollama unavailable",
            "confidence": 0.0,
            "source": "OLLAMA_FAILED"
        }

    except Exception as e:
        print(f"[OLLAMA THREAT ERROR] {e}")
        return {
            "available": False,
            "prediction": "Error generating prediction",
            "confidence": 0.0,
            "source": "OLLAMA_ERROR"
        }

# =========================================================
# A9: ORACLE SCROLL — PREDICT NEXT THREAT (GEMINI PRIMARY)
# =========================================================

def predict_threat_with_gemini(
    honeypot_events: list,
    recent_endpoints: list
):
    """
    Use Gemini to predict next likely attack vector
    from honeypot telemetry (statistical only).
    Falls back to Ollama if Gemini unavailable.
    """

    if not GEMINI_API_KEY or not ONLINE_MODE:
        return predict_threat_with_ollama(honeypot_events, recent_endpoints)

    try:
        prediction_vector = {
            "recent_honeypot_count": len(honeypot_events),
            "endpoints_targeted": recent_endpoints[:5],
            "threat_pattern": "escalation" if len(honeypot_events) > 3 else "isolated"
        }

        prompt = f"""
Analyze honeypot telemetry patterns (statistical vectors only):

HONEYPOT_VECTOR:
{json.dumps(prediction_vector, indent=2)}

Predict ONE likely next attack vector the agent might attempt.
Return JSON: {{"prediction": "...", "confidence": 0.0-1.0}}

Example: {{"prediction": "Credential exfiltration via /vault/keys", "confidence": 0.85}}
"""

        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)

        response_text = response.text.strip()

        if "{" in response_text:
            json_start = response_text.index("{")
            json_end = response_text.rindex("}") + 1
            json_str = response_text[json_start:json_end]
            result = json.loads(json_str)
            return {
                "available": True,
                "prediction": result.get("prediction", "Unknown threat"),
                "confidence": min(result.get("confidence", 0.5), 1.0)
            }
        else:
            return {
                "available": True,
                "prediction": response_text[:80],
                "confidence": 0.5
            }

    except Exception as e:
        print(f"[ORACLE SCROLL ERROR] {e}, falling back to Ollama")
        return predict_threat_with_ollama(honeypot_events, recent_endpoints)
