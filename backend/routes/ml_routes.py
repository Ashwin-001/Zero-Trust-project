"""
ML routes for training and predicting access decisions.

These endpoints expose:
- POST /api/ml/train   -> train model from collected events
- POST /api/ml/predict -> predict decision for a given resource/context
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime

from modules.ml_model import train_decision_model, predict_decision as ml_predict
from routes.access_routes import get_token_user, build_context, MOCK_RESOURCES

ml_bp = Blueprint("ml", __name__)


@ml_bp.route("/train", methods=["POST"])
def train():
    """
    Train ML model on collected events.
    """
    metrics, message = train_decision_model()
    return jsonify({"message": message, "metrics": metrics}), 200


@ml_bp.route("/predict", methods=["POST"])
def predict():
    """
    Predict decision for a resource using ML model only.

    Request JSON:
    {
      "resource_id": "...",
      "current_location": "Office|Remote|Mobile",
      "device_trust_score": 0-100 (optional)
    }
    """
    token_payload = get_token_user(request)
    if not token_payload:
        return {"error": "Unauthorized"}, 401

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

