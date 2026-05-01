"""
ML routes for training, predicting, and monitoring access decision models.

Endpoints:
- POST /api/ml/train      -> train model from collected events (admin)
- POST /api/ml/predict    -> predict decision for a given context
- GET  /api/ml/status     -> model health and stats
- GET  /api/ml/importance -> feature importance scores
"""

import os
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime

from modules.ml_model import (
    train_decision_model,
    predict_decision as ml_predict,
    _load_model,
    MODEL_PATH,
)
from db import load_ml_events
from middleware.auth import require_auth, require_admin
from routes.access_routes import build_context, MOCK_RESOURCES

ml_bp = Blueprint("ml", __name__)


@ml_bp.route("/train", methods=["POST"])
@require_admin
def train(token_payload=None):
    """
    Train ML model on collected events (admin only).
    Returns training metrics including accuracy and classification report.
    """
    metrics, message = train_decision_model()
    return jsonify({"message": message, "metrics": metrics}), 200


@ml_bp.route("/predict", methods=["POST"])
@require_auth
def predict(token_payload=None):
    """
    Predict decision for a resource using ML model only.

    Request JSON:
    {
      "resource_id": "...",
      "current_location": "Office|Remote|Mobile",
      "device_trust_score": 0-100 (optional)
    }
    """
    user_id = token_payload.get("user_id")
    data = request.get_json() or {}
    resource_id = data.get("resource_id")

    if not resource_id:
        return {"error": "resource_id is required"}, 400

    if resource_id not in MOCK_RESOURCES:
        return {"error": "Resource not found"}, 404

    if user_id not in current_app.users_db:
        return {"error": "User not found. Please log in again."}, 401

    # Build context similarly to access request
    context = build_context(user_id, resource_id, data)
    context["timestamp"] = datetime.now().isoformat()

    result = ml_predict(context)
    return jsonify({"context": context, "ml_prediction": result}), 200


@ml_bp.route("/status", methods=["GET"])
@require_auth
def model_status(token_payload=None):
    """
    Get ML model health and training status.
    Returns whether model is trained, sample count, and cached metrics.
    """
    model_exists = os.path.exists(MODEL_PATH)
    events = load_ml_events()
    event_count = len(events)

    # Decision distribution in training data
    decision_distribution = {}
    if events:
        for ev in events:
            d = ev.get("decision", "UNKNOWN")
            decision_distribution[d] = decision_distribution.get(d, 0) + 1

    # Try to get feature importance from the trained model
    feature_importance = {}
    if model_exists:
        try:
            model = _load_model()
            if model is not None:
                # Get feature names from the preprocessor
                preprocessor = model.named_steps.get("preprocess")
                clf = model.named_steps.get("clf")
                if clf and hasattr(clf, "feature_importances_"):
                    importances = clf.feature_importances_
                    # Try to get feature names
                    try:
                        feature_names = preprocessor.get_feature_names_out()
                        feature_importance = {
                            str(name): round(float(imp), 4)
                            for name, imp in sorted(
                                zip(feature_names, importances),
                                key=lambda x: x[1],
                                reverse=True,
                            )[:15]  # Top 15 features
                        }
                    except Exception:
                        feature_importance = {
                            f"feature_{i}": round(float(imp), 4)
                            for i, imp in enumerate(importances)
                            if imp > 0.01
                        }
        except Exception:
            pass

    return jsonify({
        "model_trained": model_exists,
        "training_samples": event_count,
        "min_samples_needed": 10,
        "ready_to_train": event_count >= 10,
        "decision_distribution": decision_distribution,
        "feature_importance": feature_importance,
    }), 200


@ml_bp.route("/importance", methods=["GET"])
@require_auth
def feature_importance(token_payload=None):
    """
    Get detailed feature importance from the trained model.
    """
    if not os.path.exists(MODEL_PATH):
        return jsonify({
            "available": False,
            "message": "Model not yet trained"
        }), 200

    try:
        model = _load_model()
        if model is None:
            return jsonify({"available": False, "message": "Failed to load model"}), 200

        preprocessor = model.named_steps.get("preprocess")
        clf = model.named_steps.get("clf")

        if not clf or not hasattr(clf, "feature_importances_"):
            return jsonify({"available": False, "message": "Model has no feature importances"}), 200

        importances = clf.feature_importances_

        try:
            feature_names = list(preprocessor.get_feature_names_out())
        except Exception:
            feature_names = [f"feature_{i}" for i in range(len(importances))]

        # Sort by importance descending
        pairs = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)

        return jsonify({
            "available": True,
            "features": [
                {"name": str(name), "importance": round(float(imp), 4)}
                for name, imp in pairs
                if imp > 0.005
            ],
            "total_features": len(pairs),
        }), 200

    except Exception as e:
        return jsonify({"available": False, "message": str(e)}), 200