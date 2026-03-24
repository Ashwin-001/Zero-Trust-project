"""
ZKP-inspired authentication demo routes.

These endpoints expose a simple challenge–response flow so that
the frontend can visualize privacy-preserving authentication
without sending the raw password on each step.
"""

from flask import Blueprint, request, jsonify, current_app

zkp_bp = Blueprint("zkp", __name__)


@zkp_bp.route("/challenge", methods=["POST"])
def generate_challenge():
    """
    Generate a challenge for a given user_id.

    Request JSON:
    {
        "user_id": "alice"
    }
    """
    data = request.get_json() or {}
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    challenge = current_app.auth_module.generate_challenge(user_id)
    return jsonify(
        {
            "user_id": user_id,
            "challenge": challenge,
            "message": "Use this challenge to compute a response client-side.",
        }
    ), 200


@zkp_bp.route("/verify", methods=["POST"])
def verify_challenge():
    """
    Verify a challenge response.

    For demo purposes we accept a 'correct_response' field so that
    students can simulate both valid and invalid flows without
    exposing actual passwords.

    Request JSON:
    {
        "user_id": "alice",
        "response": "<client_computed_response>",
        "correct_response": "<expected_response>"
    }
    """
    data = request.get_json() or {}
    user_id = data.get("user_id")
    response = data.get("response")
    correct_response = data.get("correct_response")

    if not all([user_id, response, correct_response]):
        return jsonify({"error": "user_id, response, and correct_response are required"}), 400

    is_valid = current_app.auth_module.verify_challenge_response(
        user_id, response, correct_response
    )

    return jsonify(
        {
            "user_id": user_id,
            "valid": is_valid,
            "message": "Challenge response verified using constant-time comparison.",
        }
    ), 200

