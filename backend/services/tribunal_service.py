import os
import json
import numpy as np
import xgboost as xgb
import shap
from datetime import datetime
from dotenv import load_dotenv

from db.supabase import supabase

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Gemini SDK (deprecated google.generativeai package, imported the
# supported way). Degrades gracefully to XGBoost+SHAP-only scoring when
# the SDK or API key is unavailable.
import warnings

try:
    from google import genai as _genai_sdk
    GEMINI_AVAILABLE = bool(GEMINI_API_KEY)
    if not GEMINI_API_KEY:
        print("[TRIBUNAL] GEMINI_API_KEY not set - using XGBoost+SHAP only")
except Exception as e:
    print(f"[TRIBUNAL] Gemini SDK unavailable ({e}) - using XGBoost+SHAP only")
    _genai_sdk = None
    GEMINI_AVAILABLE = False

# =========================================================
# XGBOOST + SHAP MODEL INITIALIZATION
# =========================================================

class TribunalModel:
    def __init__(self):
        self.model = None
        self.explainer = None
        self.feature_names = None
        self.train_data = None
        self.is_trained = False
        self._initialize()

    def _initialize(self):
        """
        Initialize XGBoost model with synthetic training data.
        Encodes domain rules: high anomaly + low trust = block.
        """

        print("\n===================================")
        print(" C7 SHAP MODEL INITIALIZATION ")
        print("===================================")

        # Feature names
        self.feature_names = [
            "anomaly_score",
            "trust_score",
            "token_validity",
            "policy_result",
            "scope_match",
            "action_risk",
            "sector_risk"
        ]

        # Generate synthetic training data
        # Features: anomaly(0-100), trust(0-100), token(0/1), policy(0/1), scope(0/1), action_risk(0-100), sector_risk(0-100)
        # Label: 0=allow, 1=block

        np.random.seed(42)
        n_samples = 200

        X = []
        y = []

        for _ in range(n_samples):
            anomaly = np.random.uniform(0, 100)
            trust = np.random.uniform(0, 100)
            token_valid = np.random.choice([0, 1])
            policy_ok = np.random.choice([0, 1])
            scope_ok = np.random.choice([0, 1])
            action_risk = np.random.uniform(0, 100)
            sector_risk = np.random.uniform(0, 100)

            features = [anomaly, trust, token_valid, policy_ok, scope_ok, action_risk, sector_risk]
            X.append(features)

            # Decision rule (domain knowledge):
            # block if: token invalid OR policy failed OR scope mismatch
            #        OR anomaly > 70 OR trust < 30
            if (
                token_valid == 0 or
                policy_ok == 0 or
                scope_ok == 0 or
                anomaly > 70 or
                trust < 30
            ):
                y.append(1)  # BLOCK
            else:
                y.append(0)  # ALLOW

        X = np.array(X)
        y = np.array(y)

        self.train_data = X

        # Train XGBoost
        dtrain = xgb.DMatrix(X, label=y)

        params = {
            "max_depth": 4,
            "learning_rate": 0.1,
            "objective": "binary:logistic",
            "eval_metric": "logloss"
        }

        self.model = xgb.train(params, dtrain, num_boost_round=100)

        # Initialize SHAP explainer
        self.explainer = shap.TreeExplainer(self.model)

        self.is_trained = True

        print("[C7] XGBoost model trained on 200 synthetic samples")
        print("[C7] SHAP TreeExplainer initialized")
        print("===================================\n")

    def predict_and_explain(self, features_dict):
        """
        Predict decision and compute SHAP values.
        Returns: (prediction, confidence, shap_values_dict, feature_importance_dict)
        """

        # Build feature vector in correct order
        feature_vector = np.array([[
            features_dict.get("anomaly_score", 0),
            features_dict.get("trust_score", 100),
            features_dict.get("token_validity", 1),
            features_dict.get("policy_result", 1),
            features_dict.get("scope_match", 1),
            features_dict.get("action_risk", 0),
            features_dict.get("sector_risk", 0)
        ]])

        # Predict
        prediction = self.model.predict(xgb.DMatrix(feature_vector))[0]
        decision = "BLOCK" if prediction > 0.5 else "ALLOW"
        confidence = max(prediction, 1 - prediction)

        # Explain with SHAP
        shap_values = self.explainer.shap_values(feature_vector)
        shap_values_single = shap_values[0]

        # Build feature importance dict
        feature_importance = {}
        for i, fname in enumerate(self.feature_names):
            feature_importance[fname] = float(shap_values_single[i])

        return {
            "decision": decision,
            "confidence": float(confidence),
            "shap_values": dict(zip(self.feature_names, [float(v) for v in shap_values_single])),
            "feature_importance": feature_importance
        }

# =========================================================
# GLOBAL TRIBUNAL MODEL INSTANCE
# =========================================================

tribunal_model = None

def initialize_tribunal():
    global tribunal_model
    if tribunal_model is None:
        tribunal_model = TribunalModel()

# =========================================================
# ACTION + SECTOR RISK WEIGHTS
# =========================================================

ACTION_RISK_WEIGHTS = {
    "transfer_funds": 90,
    "delete_records": 80,
    "admin_override": 95,
    "rotate_keys": 75,
    "approve_payment": 85,
    "shutdown_agent": 100,
    "export_sensitive_data": 90,
    "read": 10,
    "write": 30,
    "update": 25,
    "create": 20
}

SECTOR_RISK_WEIGHTS = {
    "banking": 80,
    "healthcare": 75,
    "legal": 70,
    "government": 85,
    "analytics": 30,
    "research": 25,
    "operations": 40
}

# =========================================================
# GEMINI EXPLANATION
# =========================================================

def generate_gemini_explanation(
    decision: str,
    confidence: float,
    feature_importance: dict,
    action: str,
    sector: str
):
    """
    Use Gemini API to generate human-readable tribunal explanation.
    """

    try:
        prompt = f"""
You are a security tribunal explainer. Based on the following decision analysis, provide a 1-2 sentence explanation of why the action was {decision.lower()}.

Decision: {decision}
Confidence: {confidence:.2%}
Action: {action}
Sector: {sector}

Feature importance (SHAP values):
- Anomaly Score: {feature_importance.get('anomaly_score', 0):.2f}
- Trust Score: {feature_importance.get('trust_score', 0):.2f}
- Token Validity: {feature_importance.get('token_validity', 0):.2f}
- Policy Result: {feature_importance.get('policy_result', 0):.2f}
- Scope Match: {feature_importance.get('scope_match', 0):.2f}
- Action Risk: {feature_importance.get('action_risk', 0):.2f}
- Sector Risk: {feature_importance.get('sector_risk', 0):.2f}

Provide a security-focused, technical explanation of the tribunal verdict.
"""

        if not _genai_sdk or not GEMINI_API_KEY:
            raise ValueError("Gemini unavailable")
        client = _genai_sdk.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        explanation = response.text.strip()

        print(f"[GEMINI] Explanation: {explanation}")

        return explanation

    except Exception as e:
        print(f"[GEMINI ERROR] {e}")

        # Fallback explanation
        if decision == "BLOCK":
            return "Action blocked by tribunal policy enforcement based on risk analysis."
        else:
            return "Action allowed by tribunal policy enforcement."

# =========================================================
# C7 COMPUTE TRIBUNAL RECORD
# =========================================================

def compute_tribunal(
    agent_id: str,
    action: str,
    sector: str,
    anomaly_score: float = 0,
    trust_score: float = 100,
    token_validity: bool = True,
    policy_result: bool = True,
    scope_match: bool = True
):
    """
    Real C7 tribunal with SHAP explainability and Gemini summarization.
    Returns tribunal record with real confidence score and feature importance.
    """

    # Initialize model if needed
    initialize_tribunal()

    print("\n===================================")
    print(" C7 TRIBUNAL COMPUTATION ")
    print("===================================")

    print(f"Agent: {agent_id}")
    print(f"Action: {action}")
    print(f"Sector: {sector}")

    # Build feature vector
    features = {
        "anomaly_score": min(anomaly_score, 100),
        "trust_score": max(trust_score, 0),
        "token_validity": 1 if token_validity else 0,
        "policy_result": 1 if policy_result else 0,
        "scope_match": 1 if scope_match else 0,
        "action_risk": ACTION_RISK_WEIGHTS.get(action, 50),
        "sector_risk": SECTOR_RISK_WEIGHTS.get(sector, 50)
    }

    print(f"Features: {features}")

    # Get SHAP prediction and explanation
    shap_result = tribunal_model.predict_and_explain(features)

    decision = shap_result["decision"]
    confidence = shap_result["confidence"]
    feature_importance = shap_result["feature_importance"]
    shap_values = shap_result["shap_values"]

    print(f"[C7] Decision: {decision}")
    print(f"[C7] Confidence: {confidence:.2%}")
    print(f"[C7] Feature Importance: {feature_importance}")

    # Gemini explanation
    gemini_explanation = generate_gemini_explanation(
        decision=decision,
        confidence=confidence,
        feature_importance=feature_importance,
        action=action,
        sector=sector
    )

    # Build tribunal record
    tribunal_record = {
        "agent_id": agent_id,
        "action": action,
        "decision": decision,
        "reason": "POLICY_ENFORCEMENT",
        "confidence": confidence,
        "explanation": {
            "scope_match": bool(scope_match),
            "token_valid": token_validity,
            "behavior_risk": anomaly_score / 100,
            "policy_violation": not policy_result
        },
        "feature_importance": feature_importance,
        "gemini_explanation": gemini_explanation,
        "shap_values": shap_values,
        "timestamp": datetime.utcnow().isoformat()
    }

    # Log to Supabase
    try:
        supabase.table("tribunal_logs").insert({
            "agent_id": agent_id,
            "action": action,
            "decision": decision,
            "confidence": float(confidence),
            "feature_importance": feature_importance,
            "gemini_explanation": gemini_explanation,
            "shap_values": shap_values
        }).execute()

        print("[SUPABASE] Tribunal record logged")

    except Exception as db_error:
        print(f"[DB WARNING] {db_error}")

    print("===================================\n")

    return tribunal_record
