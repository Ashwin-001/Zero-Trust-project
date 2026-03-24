"""
Audit log routes
Provides access to blockchain-based audit trails
"""

from flask import Blueprint, request, jsonify, current_app
import jwt

audit_bp = Blueprint('audit', __name__)

def get_token_user(request_obj):
    """
    Extract and verify user from JWT token.
    """
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
    except:
        return None

@audit_bp.route('/trail', methods=['GET'])
def get_audit_trail():
    """
    Get audit trail with optional filters.
    
    Query parameters:
    - user_id: Filter by user
    - resource_id: Filter by resource
    - decision: Filter by decision (ALLOW|CONDITIONAL|DENY)
    """
    token_payload = get_token_user(request)
    if not token_payload:
        return {'error': 'Unauthorized'}, 401
    
    user_id = token_payload.get('user_id')
    user_data = current_app.users_db.get(user_id, {})
    
    # Get filter parameters
    filter_user = request.args.get('user_id')
    filter_resource = request.args.get('resource_id')
    filter_decision = request.args.get('decision')
    
    # Authorization: Only admin can view all, others only their own
    if user_data.get('role') != 'admin':
        filter_user = user_id  # Force to own user
    
    trail = current_app.audit_log.get_audit_trail(
        user_id=filter_user,
        resource_id=filter_resource,
        decision_filter=filter_decision
    )
    
    return {
        'audit_trail': trail,
        'count': len(trail),
        'filters': {
            'user_id': filter_user,
            'resource_id': filter_resource,
            'decision': filter_decision
        }
    }, 200

@audit_bp.route('/user-history/<user_id>', methods=['GET'])
def get_user_history(user_id):
    """
    Get all access decisions for a specific user.
    Only admin or the user themselves can view.
    """
    token_payload = get_token_user(request)
    if not token_payload:
        return {'error': 'Unauthorized'}, 401
    
    requester_id = token_payload.get('user_id')
    requester_data = current_app.users_db.get(requester_id, {})
    
    # Authorization check
    if requester_data.get('role') != 'admin' and requester_id != user_id:
        return {'error': 'Forbidden'}, 403
    
    history = current_app.audit_log.get_user_access_history(user_id)
    
    return {
        'user_id': user_id,
        'access_history': history,
        'total_accesses': len(history)
    }, 200

@audit_bp.route('/resource-log/<resource_id>', methods=['GET'])
def get_resource_log(resource_id):
    """
    Get all access requests for a specific resource.
    Only admin can view.
    """
    token_payload = get_token_user(request)
    if not token_payload:
        return {'error': 'Unauthorized'}, 401
    
    user_data = current_app.users_db.get(token_payload.get('user_id'), {})
    
    # Only admin can view resource logs
    if user_data.get('role') != 'admin':
        return {'error': 'Only admins can view resource logs'}, 403
    
    log = current_app.audit_log.get_resource_access_log(resource_id)
    
    return {
        'resource_id': resource_id,
        'access_log': log,
        'total_accesses': len(log)
    }, 200

@audit_bp.route('/denied-attempts', methods=['GET'])
def get_denied_attempts():
    """
    Get all denied access attempts.
    Only admin can view all; others see their own denials.
    """
    token_payload = get_token_user(request)
    if not token_payload:
        return {'error': 'Unauthorized'}, 401
    
    user_id = token_payload.get('user_id')
    user_data = current_app.users_db.get(user_id, {})
    
    if user_data.get('role') == 'admin':
        denied = current_app.audit_log.get_denied_accesses()
    else:
        denied = current_app.audit_log.get_user_access_history(user_id)
        denied = [d for d in denied if d['decision'] == 'DENY']
    
    return {
        'denied_attempts': denied,
        'count': len(denied)
    }, 200

@audit_bp.route('/high-risk', methods=['GET'])
def get_high_risk_accesses():
    """
    Get all high-risk access attempts (threshold-based).
    
    Query parameters:
    - threshold: Risk score threshold (default: 70)
    """
    token_payload = get_token_user(request)
    if not token_payload:
        return {'error': 'Unauthorized'}, 401
    
    user_data = current_app.users_db.get(token_payload.get('user_id'), {})
    
    if user_data.get('role') != 'admin':
        return {'error': 'Only admins can view high-risk accesses'}, 403
    
    threshold = request.args.get('threshold', 70, type=float)
    high_risk = current_app.audit_log.get_high_risk_accesses(threshold)
    
    return {
        'high_risk_accesses': high_risk,
        'threshold': threshold,
        'count': len(high_risk)
    }, 200

@audit_bp.route('/chain-integrity', methods=['GET'])
def check_chain_integrity():
    """
    Verify the integrity of the audit blockchain.
    Returns whether the chain has been tampered with.
    """
    token_payload = get_token_user(request)
    if not token_payload:
        return {'error': 'Unauthorized'}, 401
    
    user_data = current_app.users_db.get(token_payload.get('user_id'), {})
    
    if user_data.get('role') != 'admin':
        return {'error': 'Only admins can verify chain integrity'}, 403
    
    is_valid, message = current_app.audit_log.verify_chain_integrity()
    
    return {
        'integrity_verified': is_valid,
        'message': message,
        'total_blocks': len(current_app.audit_log.chain)
    }, 200

@audit_bp.route('/statistics', methods=['GET'])
def get_audit_statistics():
    """
    Get comprehensive statistics about the audit log.
    """
    token_payload = get_token_user(request)
    if not token_payload:
        return {'error': 'Unauthorized'}, 401
    
    user_data = current_app.users_db.get(token_payload.get('user_id'), {})
    
    if user_data.get('role') != 'admin':
        return {'error': 'Only admins can view audit statistics'}, 403
    
    stats = current_app.audit_log.get_chain_statistics()
    
    return {
        'audit_statistics': stats
    }, 200

@audit_bp.route('/export', methods=['GET'])
def export_chain():
    """
    Export entire blockchain for backup or verification.
    Only admin can export.
    """
    token_payload = get_token_user(request)
    if not token_payload:
        return {'error': 'Unauthorized'}, 401
    
    user_data = current_app.users_db.get(token_payload.get('user_id'), {})
    
    if user_data.get('role') != 'admin':
        return {'error': 'Only admins can export the chain'}, 403
    
    chain_export = current_app.audit_log.export_chain()
    
    return {
        'blockchain_export': chain_export,
        'total_blocks': len(chain_export),
        'integrity_verified': current_app.audit_log.verify_chain_integrity()[0]
    }, 200

@audit_bp.route('/block/<int:block_id>', methods=['GET'])
def get_block(block_id):
    """
    Get a specific block from the blockchain.
    """
    token_payload = get_token_user(request)
    if not token_payload:
        return {'error': 'Unauthorized'}, 401
    
    if block_id < 0 or block_id >= len(current_app.audit_log.chain):
        return {'error': 'Block not found'}, 404
    
    block = current_app.audit_log.chain[block_id]
    
    return {
        'block': block.to_dict()
    }, 200
