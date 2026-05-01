"""
Access control routes
Handles access requests and applies Zero Trust decision engine
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime

from db import insert_ml_event
from middleware.auth import get_token_user, require_auth, require_admin

access_bp = Blueprint('access', __name__)

# Mock resource database
MOCK_RESOURCES = {
    'resource_financial_data': {
        'name': 'Financial Database',
        'resource_type': 'database',
        'required_role': 'employee',
        'sensitivity_level': 5,
        'required_departments': ['Finance', 'IT'],
        'min_device_trust': 60,
        'allowed_locations': ['Office', 'Remote']
    },
    'resource_hr_records': {
        'name': 'HR Personnel Records',
        'resource_type': 'database',
        'required_role': 'employee',
        'sensitivity_level': 4,
        'required_departments': ['HR', 'IT'],
        'min_device_trust': 50,
        'allowed_locations': ['Office']
    },
    'resource_company_files': {
        'name': 'Public Company Files',
        'resource_type': 'file_share',
        'required_role': 'viewer',
        'sensitivity_level': 1,
        'required_departments': [],
        'min_device_trust': 0,
        'allowed_locations': ['Office', 'Remote', 'Mobile']
    },
    'resource_it_servers': {
        'name': 'IT Infrastructure',
        'resource_type': 'infrastructure',
        'required_role': 'admin',
        'sensitivity_level': 5,
        'required_departments': ['IT'],
        'min_device_trust': 80,
        'allowed_locations': ['Office']
    },
    'resource_api_key': {
        'name': 'API Secrets',
        'resource_type': 'credential',
        'required_role': 'employee',
        'sensitivity_level': 5,
        'required_departments': ['IT', 'Dev'],
        'min_device_trust': 70,
        'allowed_locations': ['Office']
    }
}

def build_context(user_id: str, resource_id: str, request_data: dict) -> dict:
    """
    Build complete context for access decision.
    
    Args:
        user_id: The authenticated user's ID
        resource_id: The requested resource ID
        request_data: Dict from request.get_json() with optional overrides
    """
    user_data = current_app.users_db.get(user_id, {})
    resource_data = MOCK_RESOURCES.get(resource_id, {})
    
    context = {
        'user_id': user_id,
        'resource_id': resource_id,
        'role': user_data.get('role', 'guest'),
        'department': user_data.get('department', 'Unknown'),
        'device_trust_score': user_data.get('device_trust_score', 50),
        'location': user_data.get('location', 'Office'),
        'access_hour': datetime.now().hour,
        'failed_attempts': 0,
        'current_location': request_data.get('current_location', user_data.get('location', 'Office')),
        'last_location': request_data.get('last_location'),
        'resource_sensitivity': resource_data.get('sensitivity_level', 1),
        'user_department': user_data.get('department', 'Unknown'),
        'resource_required_departments': resource_data.get('required_departments', [])
    }
    
    return context

@access_bp.route('/request', methods=['POST'])
@require_auth
def request_access(token_payload=None):
    """
    Process an access request through the Zero Trust Decision Engine.
    
    Request body:
    {
        'resource_id': 'resource_name',
        'current_location': 'Office|Remote|Mobile',
        'device_trust_score': 0-100 (optional)
    }
    """
    user_id = token_payload.get('user_id')
    data = request.get_json() or {}
    resource_id = data.get('resource_id')
    
    if not resource_id:
        return {'error': 'resource_id is required'}, 400
    
    if resource_id not in MOCK_RESOURCES:
        return {'error': 'Resource not found'}, 404
    
    # Ensure user exists in users_db
    if user_id not in current_app.users_db:
        return {'error': 'User not found. Please log in again.'}, 401
    
    # Update user context if provided in the request
    if 'device_trust_score' in data:
        current_app.users_db[user_id]['device_trust_score'] = data['device_trust_score']
    if 'current_location' in data:
        current_app.users_db[user_id]['location'] = data['current_location']
    
    user_data = current_app.users_db[user_id]
    resource_data = MOCK_RESOURCES[resource_id]
    
    # Build evaluation context
    context = build_context(user_id, resource_id, data)
    
    # 1. RBAC Evaluation — use role hierarchy comparison
    #    Compare user's role level against the resource's required role level.
    user_role = user_data.get('role', 'guest')
    required_role = resource_data.get('required_role', 'viewer')
    
    user_level = current_app.rbac_module.get_role_hierarchy_level(user_role)
    required_level = current_app.rbac_module.get_role_hierarchy_level(required_role)
    
    if user_level >= required_level:
        rbac_result = (True, f"Role '{user_role}' (level {user_level}) meets required '{required_role}' (level {required_level})")
    else:
        rbac_result = (False, f"Role '{user_role}' (level {user_level}) insufficient for '{required_role}' (level {required_level})")
    
    # 2. ABAC Evaluation
    abac_result = current_app.abac_module.evaluate_abac(
        {
            'role': user_data.get('role', 'guest'),
            'department': user_data.get('department', 'Unknown'),
            'device_trust_score': context['device_trust_score'],
            'location': context['current_location']
        },
        resource_data
    )
    
    # 3. Risk Scoring
    risk_result = current_app.risk_engine.calculate_risk_score(context)
    
    # 4. Decision Making
    decision_response = current_app.decision_engine.make_decision(
        rbac_result,
        abac_result,
        risk_result
    )
    
    # Add conditional checks if applicable
    decision_response = current_app.decision_engine.evaluate_decision_conditions(decision_response)
    
    decision_response['timestamp'] = datetime.now().isoformat()
    decision_response['user_id'] = user_id
    decision_response['resource_id'] = resource_id
    
    # Record in blockchain audit log
    audit_block = current_app.audit_log.add_access_decision(
        user_id,
        resource_id,
        decision_response['decision'],
        risk_result['overall_risk_score']
    )
    
    decision_response['audit_block_id'] = audit_block['block_id']
    decision_response['audit_hash'] = audit_block['hash']
    
    # Log decision
    current_app.decision_engine.add_decision_to_log(decision_response)
    
    # Record access for pattern analysis
    current_app.risk_engine.record_access(user_id, resource_id)

    # --- Continuous Verification: create a monitored session ---
    session_data = None
    if decision_response['decision'] in ('ALLOW', 'CONDITIONAL'):
        session_data = current_app.session_manager.create_session(
            user_id=user_id,
            resource_id=resource_id,
            original_decision=decision_response,
            context=context
        )

    # --- ML Prediction (Active ML in Decision Pipeline) ---
    ml_analysis = {'model_available': False}
    try:
        from modules.ml_model import predict_decision as ml_predict
        ml_result = ml_predict(context)
        if ml_result.get('model_available'):
            predicted = ml_result.get('predicted_decision', '')
            probs = ml_result.get('probabilities', {})
            confidence = max(probs.values()) if probs else 0
            agrees = (predicted == decision_response['decision'])
            ml_analysis = {
                'model_available': True,
                'predicted_decision': predicted,
                'confidence': round(confidence, 4),
                'probabilities': {k: round(v, 4) for k, v in probs.items()},
                'agrees_with_rules': agrees,
            }
            # If ML disagrees, add a recommendation/warning
            if not agrees:
                decision_response['recommendations'].append(
                    f"ML model predicts {predicted} "
                    f"(confidence: {confidence:.0%}) — "
                    f"disagreement with rule-based decision"
                )
    except Exception:
        # ML prediction is non-critical; continue if it fails
        pass

    # Persist ML event snapshot for later training
    ml_event = {
        "timestamp": decision_response["timestamp"],
        "user_id": user_id,
        "resource_id": resource_id,
        "decision": decision_response["decision"],
        "risk_score": risk_result["overall_risk_score"],
        "risk_level": risk_result["risk_level"],
        "failed_attempts": context.get("failed_attempts", 0),
        "access_hour": context.get("access_hour"),
        "current_location": context.get("current_location"),
        "last_location": context.get("last_location"),
        "device_trust_score": context.get("device_trust_score"),
        "resource_sensitivity": context.get("resource_sensitivity"),
        "user_department": context.get("user_department"),
        "resource_required_departments_size": len(
            context.get("resource_required_departments", []) or []
        ),
    }
    try:
        insert_ml_event(ml_event)
    except Exception:
        # For academic demo, skip ML logging failures silently.
        pass
    
    response_body = {
        'decision': decision_response,
        'detailed_evaluation': {
            'rbac': {
                'passed': rbac_result[0],
                'reason': rbac_result[1]
            },
            'abac': {
                'weighted_score': abac_result['weighted_score'],
                'department_score': abac_result['department_score'],
                'device_trust_score': abac_result['device_trust_score'],
                'location_score': abac_result['location_score'],
                'sensitivity_score': abac_result['sensitivity_score']
            },
            'risk': {
                'overall_score': risk_result['overall_risk_score'],
                'risk_level': risk_result['risk_level'],
                'factors': risk_result['factor_scores']
            },
            'ml_analysis': ml_analysis
        }
    }

    if session_data:
        response_body['session'] = {
            'session_id': session_data['session_id'],
            'status': session_data['status'],
            'message': 'Continuous verification active. Send heartbeats to maintain session.'
        }

    return response_body, 200

@access_bp.route('/resources', methods=['GET'])
def get_resources():
    """
    Get list of all available resources (for frontend).
    """
    resources = []
    for resource_id, data in MOCK_RESOURCES.items():
        resources.append({
            'id': resource_id,
            'name': data['name'],
            'type': data['resource_type'],
            'sensitivity_level': data['sensitivity_level'],
            'required_role': data['required_role'],
            'required_departments': data['required_departments']
        })
    
    return {'resources': resources}, 200

@access_bp.route('/decision-stats', methods=['GET'])
def get_decision_stats():
    """
    Get statistics on access decisions.
    """
    stats = current_app.decision_engine.get_decision_stats()
    return stats, 200

@access_bp.route('/denied-accesses', methods=['GET'])
@require_auth
def get_denied_accesses(token_payload=None):
    """
    Get all denied access attempts.
    """
    user_id = token_payload.get('user_id')
    user_data = current_app.users_db.get(user_id, {})
    
    # Only admin can view all denials, others can view their own
    if user_data.get('role') == 'admin':
        denied = current_app.audit_log.get_denied_accesses()
    else:
        denied = current_app.audit_log.get_audit_trail(
            user_id=user_id,
            decision_filter='DENY'
        )
    
    return {'denied_accesses': denied}, 200

@access_bp.route('/high-risk-accesses', methods=['GET'])
@require_auth
def get_high_risk(token_payload=None):
    """
    Get all high-risk access attempts.
    """
    threshold = request.args.get('threshold', 70, type=float)
    high_risk = current_app.audit_log.get_high_risk_accesses(threshold)
    
    return {
        'high_risk_accesses': high_risk,
        'threshold': threshold,
        'count': len(high_risk)
    }, 200
