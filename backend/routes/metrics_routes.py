"""
Metrics and observability routes.

Expose aggregated statistics for decisions, risk scores,
and blockchain integrity so the frontend can visualize
system behavior over time.
"""

from flask import Blueprint, current_app, jsonify
from middleware.auth import require_auth

metrics_bp = Blueprint("metrics", __name__)


@metrics_bp.route("/summary", methods=["GET"])
@require_auth
def summary_metrics(token_payload=None):
    """
    Return a summary of decision and blockchain metrics.
    Requires authentication.
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
@require_auth
def integrity_check(token_payload=None):
    """
    Explicit endpoint to verify blockchain integrity.
    Requires authentication.
    """
    is_valid, details = current_app.audit_log.verify_chain_integrity()
    return jsonify({"valid": is_valid, "details": details}), 200


@metrics_bp.route("/analytics", methods=["GET"])
@require_auth
def analytics_data(token_payload=None):
    """
    Return aggregated analytics data for visualization charts.
    Provides decision trends, risk distributions, department breakdowns,
    hourly heatmap data, and resource access frequency.
    """
    from collections import defaultdict, Counter
    from datetime import datetime as dt

    blocks = current_app.audit_log.chain[1:]  # Skip genesis

    if not blocks:
        return jsonify({
            "decision_timeline": [],
            "risk_distribution": [],
            "department_breakdown": [],
            "hourly_heatmap": [],
            "resource_frequency": [],
            "user_activity": [],
            "total_events": 0,
        }), 200

    # 1. Decision timeline (group by hour buckets)
    timeline = defaultdict(lambda: {"ALLOW": 0, "CONDITIONAL": 0, "DENY": 0})
    for b in blocks:
        try:
            ts = dt.fromisoformat(b.timestamp)
            bucket = ts.strftime("%Y-%m-%d %H:00")
        except Exception:
            bucket = "unknown"
        if b.decision in timeline[bucket]:
            timeline[bucket][b.decision] += 1

    decision_timeline = [
        {"time": k, "allow": v["ALLOW"], "conditional": v["CONDITIONAL"], "deny": v["DENY"]}
        for k, v in sorted(timeline.items())
    ][-48:]  # Last 48 time buckets

    # 2. Risk score distribution (histogram buckets)
    risk_buckets = {"0-20": 0, "20-40": 0, "40-60": 0, "60-80": 0, "80-100": 0}
    for b in blocks:
        score = b.risk_score
        if score < 20:
            risk_buckets["0-20"] += 1
        elif score < 40:
            risk_buckets["20-40"] += 1
        elif score < 60:
            risk_buckets["40-60"] += 1
        elif score < 80:
            risk_buckets["60-80"] += 1
        else:
            risk_buckets["80-100"] += 1

    risk_distribution = [{"range": k, "count": v} for k, v in risk_buckets.items()]

    # 3. Department breakdown
    dept_decisions = defaultdict(lambda: {"ALLOW": 0, "CONDITIONAL": 0, "DENY": 0})
    for b in blocks:
        user_data = current_app.users_db.get(b.user_id, {})
        dept = user_data.get("department", "Unknown")
        if b.decision in dept_decisions[dept]:
            dept_decisions[dept][b.decision] += 1

    department_breakdown = [
        {"department": dept, "allow": v["ALLOW"], "conditional": v["CONDITIONAL"], "deny": v["DENY"]}
        for dept, v in sorted(dept_decisions.items())
    ]

    # 4. Hourly heatmap (hour of day × decision count)
    hourly = defaultdict(lambda: {"total": 0, "high_risk": 0})
    for b in blocks:
        try:
            ts = dt.fromisoformat(b.timestamp)
            hour = ts.hour
        except Exception:
            hour = 0
        hourly[hour]["total"] += 1
        if b.risk_score >= 60:
            hourly[hour]["high_risk"] += 1

    hourly_heatmap = [
        {"hour": h, "total": hourly[h]["total"], "high_risk": hourly[h]["high_risk"]}
        for h in range(24)
    ]

    # 5. Resource access frequency
    resource_counts = Counter()
    for b in blocks:
        resource_counts[b.resource_id] += 1

    resource_frequency = [
        {"resource": res, "count": cnt}
        for res, cnt in resource_counts.most_common(10)
    ]

    # 6. User activity
    user_counts = Counter()
    user_risk = defaultdict(list)
    for b in blocks:
        user_counts[b.user_id] += 1
        user_risk[b.user_id].append(b.risk_score)

    user_activity = [
        {
            "user": user,
            "requests": cnt,
            "avg_risk": round(sum(user_risk[user]) / len(user_risk[user]), 1),
        }
        for user, cnt in user_counts.most_common(10)
    ]

    return jsonify({
        "decision_timeline": decision_timeline,
        "risk_distribution": risk_distribution,
        "department_breakdown": department_breakdown,
        "hourly_heatmap": hourly_heatmap,
        "resource_frequency": resource_frequency,
        "user_activity": user_activity,
        "total_events": len(blocks),
    }), 200
