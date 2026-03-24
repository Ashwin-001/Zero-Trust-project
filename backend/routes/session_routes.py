"""
Session management routes for continuous verification.
Provides heartbeat, monitoring, and revocation endpoints.
"""

from flask import Blueprint, request, current_app
from datetime import datetime

session_bp = Blueprint('session', __name__)


def _get_token_user(request_obj) -> dict:
    """Extract and verify user from JWT token."""
    import jwt
    auth_header = request_obj.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header.replace('Bearer ', '')
    try:
        payload = jwt.decode(
            token,
            current_app.config['JWT_SECRET'],
            algorithms=['HS256']
        )
        return payload
    except Exception:
        return None


@session_bp.route('/heartbeat', methods=['POST'])
def heartbeat():
    """
    Process a heartbeat from an active session.

    This is the continuous verification endpoint — it re-evaluates trust
    using the full RBAC + ABAC + Risk Scoring pipeline with the latest
    context provided by the frontend.

    Request body:
    {
        "session_id": "uuid",
        "device_trust_score": 0-100,
        "location": "Office|Remote|Mobile"
    }

    Returns:
        Re-evaluation result with session status and any actions taken.
    """
    token_payload = _get_token_user(request)
    if not token_payload:
        return {'error': 'Unauthorized'}, 401

    data = request.get_json() or {}
    session_id = data.get('session_id')

    if not session_id:
        return {'error': 'session_id is required'}, 400

    # Verify session belongs to authenticated user
    session = current_app.session_manager.get_session(session_id)
    if not session:
        return {'error': 'Session not found'}, 404

    user_id = token_payload.get('user_id')
    if session['user_id'] != user_id:
        return {'error': 'Session does not belong to this user'}, 403

    # Build updated context from heartbeat data
    updated_context = {}
    if 'device_trust_score' in data:
        updated_context['device_trust_score'] = data['device_trust_score']
    if 'location' in data:
        updated_context['current_location'] = data['location']

    # Use the MOCK_RESOURCES from access_routes as the resources_db
    from routes.access_routes import MOCK_RESOURCES
    resources_db = {**MOCK_RESOURCES, **current_app.resources_db}

    # Process heartbeat through continuous verification
    result = current_app.session_manager.process_heartbeat(
        session_id=session_id,
        updated_context=updated_context,
        rbac_module=current_app.rbac_module,
        abac_module=current_app.abac_module,
        risk_engine=current_app.risk_engine,
        decision_engine=current_app.decision_engine,
        users_db=current_app.users_db,
        resources_db=resources_db,
        audit_log=current_app.audit_log
    )

    # Persist re-evaluation event
    try:
        from db import insert_session_event
        history = current_app.session_manager.get_session_history(session_id)
        if history:
            insert_session_event(history[-1])
    except Exception:
        pass  # Non-critical for academic demo

    return {
        'heartbeat': 'processed',
        'result': result
    }, 200


@session_bp.route('/active', methods=['GET'])
def get_active_sessions():
    """
    List active sessions.
    Admin users see all sessions; others see only their own.
    """
    token_payload = _get_token_user(request)
    if not token_payload:
        return {'error': 'Unauthorized'}, 401

    user_id = token_payload.get('user_id')
    user_data = current_app.users_db.get(user_id, {})

    if user_data.get('role') == 'admin':
        sessions = current_app.session_manager.get_all_sessions()
    else:
        sessions = current_app.session_manager.get_all_sessions(user_id=user_id)

    # Return serializable session data (strip context to reduce payload)
    clean_sessions = []
    for s in sessions:
        clean_sessions.append({
            'session_id': s['session_id'],
            'user_id': s['user_id'],
            'resource_id': s['resource_id'],
            'original_decision': s['original_decision'],
            'current_decision': s['current_decision'],
            'current_risk_score': s['current_risk_score'],
            'current_risk_level': s['current_risk_level'],
            'status': s['status'],
            'created_at': s['created_at'],
            'last_heartbeat': s['last_heartbeat'],
            're_evaluation_count': s['re_evaluation_count'],
            'warnings': s.get('warnings', []),
            'revoke_reason': s.get('revoke_reason'),
        })

    stats = current_app.session_manager.get_session_stats()

    return {
        'sessions': clean_sessions,
        'stats': stats
    }, 200


@session_bp.route('/revoke/<session_id>', methods=['POST'])
def revoke_session(session_id):
    """
    Manually revoke an active session (admin only).
    """
    token_payload = _get_token_user(request)
    if not token_payload:
        return {'error': 'Unauthorized'}, 401

    user_id = token_payload.get('user_id')
    user_data = current_app.users_db.get(user_id, {})

    if user_data.get('role') != 'admin':
        return {'error': 'Admin privileges required'}, 403

    session = current_app.session_manager.terminate_session(
        session_id, reason='admin_revoked'
    )

    if not session:
        return {'error': 'Session not found'}, 404

    # Record revocation in audit log
    current_app.audit_log.add_access_decision(
        session['user_id'],
        session['resource_id'],
        'SESSION_REVOKED',
        session['current_risk_score']
    )

    return {
        'message': 'Session revoked successfully',
        'session_id': session_id,
        'user_id': session['user_id'],
        'resource_id': session['resource_id']
    }, 200


@session_bp.route('/history/<session_id>', methods=['GET'])
def get_session_history(session_id):
    """
    Get re-evaluation history for a specific session.
    """
    token_payload = _get_token_user(request)
    if not token_payload:
        return {'error': 'Unauthorized'}, 401

    user_id = token_payload.get('user_id')
    user_data = current_app.users_db.get(user_id, {})

    # Verify user has access to this session
    session = current_app.session_manager.get_session(session_id)
    if not session:
        return {'error': 'Session not found'}, 404

    if (session['user_id'] != user_id
            and user_data.get('role') != 'admin'):
        return {'error': 'Access denied'}, 403

    history = current_app.session_manager.get_session_history(session_id)

    return {
        'session_id': session_id,
        'history': history,
        'total_re_evaluations': len(history)
    }, 200
