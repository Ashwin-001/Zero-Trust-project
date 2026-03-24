"""
Metrics and observability routes.

Expose aggregated statistics for decisions, risk scores,
and blockchain integrity so the frontend can visualize
system behavior over time.
"""

from flask import Blueprint, current_app, jsonify

metrics_bp = Blueprint("metrics", __name__)


@metrics_bp.route("/summary", methods=["GET"])
def summary_metrics():
    """
    Return a summary of decision and blockchain metrics.
    """
    decision_stats = current_app.decision_engine.get_decision_stats()
    chain_stats = current_app.audit_log.get_chain_statistics()

    return (
        jsonify(
            {
                "decision_stats": decision_stats,
                "blockchain_stats": chain_stats,
                "risk_profile": current_app.active_risk_profile,
            }
        ),
        200,
    )


@metrics_bp.route("/integrity", methods=["GET"])
def integrity_check():
    """
    Explicit endpoint to verify blockchain integrity.
    """
    is_valid, details = current_app.audit_log.verify_chain_integrity()
    return jsonify({"valid": is_valid, "details": details}), 200


