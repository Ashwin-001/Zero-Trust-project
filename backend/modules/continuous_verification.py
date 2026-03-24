"""
Continuous Verification Module
Implements session-level continuous trust evaluation following the
Zero Trust principle of "never trust, always verify".

Each active session is periodically re-evaluated using the same
RBAC + ABAC + Risk Scoring pipeline that granted initial access.
Sessions are automatically revoked when risk exceeds safe thresholds.
"""

import uuid
from datetime import datetime


class SessionManager:
    """
    Manages active resource-access sessions and provides continuous
    verification through heartbeat-driven re-evaluation.

    Lifecycle:
        create_session()  -> new session after ALLOW/CONDITIONAL decision
        process_heartbeat() -> re-evaluates trust using latest context
        terminate_session()  -> explicit session end (logout / revoke)

    Decision flow on heartbeat:
        1. Receive updated device/location context from frontend
        2. Re-run Risk Scoring with new context
        3. Re-run ABAC evaluation
        4. Feed into Decision Engine
        5. Compare new decision with original grant:
           - DENY -> auto-revoke session
           - CONDITIONAL (was ALLOW) -> downgrade, add warnings
           - ALLOW -> continue normally
    """

    # How long (seconds) before a session with no heartbeat is considered stale
    HEARTBEAT_TIMEOUT = 120  # 2 minutes

    def __init__(self):
        # session_id -> session dict
        self.sessions = {}
        # session_id -> list of re-evaluation event dicts
        self.re_evaluation_history = {}

    # ------------------------------------------------------------------
    # Session lifecycle
    # ------------------------------------------------------------------

    def create_session(self, user_id: str, resource_id: str,
                       original_decision: dict, context: dict) -> dict:
        """
        Create a new monitored session after an access grant.

        Parameters:
            user_id:           Authenticated user
            resource_id:       Resource that was granted access
            original_decision: The decision dict returned by DecisionEngine
            context:           The evaluation context used for the decision

        Returns:
            Session dict including the generated session_id
        """
        session_id = str(uuid.uuid4())
        now = datetime.now().isoformat()

        session = {
            'session_id': session_id,
            'user_id': user_id,
            'resource_id': resource_id,
            'original_decision': original_decision.get('decision', 'ALLOW'),
            'current_decision': original_decision.get('decision', 'ALLOW'),
            'current_risk_score': original_decision.get('risk_score', 0),
            'current_risk_level': original_decision.get('risk_level', 'LOW'),
            'status': 'ACTIVE',
            'created_at': now,
            'last_heartbeat': now,
            're_evaluation_count': 0,
            'context': context,  # latest context for re-evaluation
            'warnings': [],
        }

        self.sessions[session_id] = session
        self.re_evaluation_history[session_id] = []

        return session

    def terminate_session(self, session_id: str,
                          reason: str = 'manual') -> dict | None:
        """
        Terminate (revoke) a session.

        Parameters:
            session_id: Session to terminate
            reason:     'manual' | 'risk_exceeded' | 'heartbeat_timeout'

        Returns:
            Updated session dict, or None if not found
        """
        session = self.sessions.get(session_id)
        if not session:
            return None

        session['status'] = 'REVOKED'
        session['revoked_at'] = datetime.now().isoformat()
        session['revoke_reason'] = reason

        return session

    def get_session(self, session_id: str) -> dict | None:
        """Get a single session by ID."""
        return self.sessions.get(session_id)

    def get_active_sessions(self, user_id: str = None) -> list:
        """
        Get all active sessions, optionally filtered by user.
        """
        results = []
        for session in self.sessions.values():
            if session['status'] != 'ACTIVE':
                continue
            if user_id and session['user_id'] != user_id:
                continue
            results.append(session)
        return results

    def get_all_sessions(self, user_id: str = None) -> list:
        """
        Get all sessions (any status), optionally filtered by user.
        """
        results = []
        for session in self.sessions.values():
            if user_id and session['user_id'] != user_id:
                continue
            results.append(session)
        return results

    # ------------------------------------------------------------------
    # Continuous verification (heartbeat processing)
    # ------------------------------------------------------------------

    def process_heartbeat(self, session_id: str, updated_context: dict,
                          rbac_module, abac_module, risk_engine,
                          decision_engine, users_db: dict,
                          resources_db: dict, audit_log) -> dict:
        """
        Process a heartbeat from a client session.

        This is the core of continuous verification: it re-runs the
        entire Zero Trust decision pipeline with the latest context
        and compares the result with the original grant.

        Parameters:
            session_id:      Active session ID
            updated_context: Dict with latest device_trust_score, location, etc.
            rbac_module:     App's RBAC module
            abac_module:     App's ABAC module
            risk_engine:     App's RiskScoringEngine
            decision_engine: App's DecisionEngine
            users_db:        App's users_db for user data
            resources_db:    App's resources_db for resource data
            audit_log:       App's BlockchainAuditLog for recording

        Returns:
            Dict with re-evaluation result:
            {
                'session_status': 'ACTIVE' | 'REVOKED',
                'previous_decision': ...,
                'new_decision': ...,
                'risk_score': ...,
                'risk_level': ...,
                'action_taken': 'none' | 'downgraded' | 'revoked',
                'warnings': [...]
            }
        """
        session = self.sessions.get(session_id)
        if not session:
            return {
                'session_status': 'NOT_FOUND',
                'action_taken': 'none',
                'warnings': ['Session not found']
            }

        if session['status'] != 'ACTIVE':
            return {
                'session_status': session['status'],
                'action_taken': 'none',
                'warnings': [f"Session already {session['status']}"]
            }

        user_id = session['user_id']
        resource_id = session['resource_id']

        # Merge updated context with stored context
        context = {**session['context'], **updated_context}
        session['context'] = context

        user_data = users_db.get(user_id, {})
        resource_data = resources_db.get(resource_id, {})

        # --- Re-evaluate RBAC ---
        user_role = user_data.get('role', 'guest')
        required_role = resource_data.get('required_role', 'viewer')
        user_level = rbac_module.get_role_hierarchy_level(user_role)
        required_level = rbac_module.get_role_hierarchy_level(required_role)

        if user_level >= required_level:
            rbac_result = (True, f"Role '{user_role}' meets '{required_role}'")
        else:
            rbac_result = (False, f"Role '{user_role}' insufficient for '{required_role}'")

        # --- Re-evaluate ABAC with updated context ---
        abac_input = {
            'role': user_role,
            'department': user_data.get('department', 'Unknown'),
            'device_trust_score': context.get('device_trust_score',
                                               user_data.get('device_trust_score', 50)),
            'location': context.get('current_location',
                                     user_data.get('location', 'Office'))
        }
        abac_result = abac_module.evaluate_abac(abac_input, resource_data)

        # --- Re-evaluate Risk Score with updated context ---
        risk_context = {
            'user_id': user_id,
            'resource_id': resource_id,
            'failed_attempts': context.get('failed_attempts', 0),
            'access_hour': datetime.now().hour,
            'current_location': context.get('current_location',
                                             user_data.get('location', 'Office')),
            'last_location': context.get('last_location'),
            'device_trust_score': context.get('device_trust_score',
                                               user_data.get('device_trust_score', 50)),
            'resource_sensitivity': resource_data.get('sensitivity_level', 1),
            'user_department': user_data.get('department', 'Unknown'),
            'resource_required_departments': resource_data.get('required_departments', [])
        }
        risk_result = risk_engine.calculate_risk_score(risk_context)

        # --- Decision Engine ---
        new_decision = decision_engine.make_decision(
            rbac_result, abac_result, risk_result
        )
        new_decision = decision_engine.evaluate_decision_conditions(new_decision)

        # --- Compare with current session state ---
        previous_decision = session['current_decision']
        action_taken = 'none'
        warnings = []

        if new_decision['decision'] == 'DENY':
            # Auto-revoke the session
            action_taken = 'revoked'
            self.terminate_session(session_id, reason='risk_exceeded')
            warnings.append(
                f"Session revoked: risk score {new_decision['risk_score']}"
            )
            # Record revocation in audit log
            audit_log.add_access_decision(
                user_id, resource_id,
                'SESSION_REVOKED',
                new_decision['risk_score']
            )

        elif (new_decision['decision'] == 'CONDITIONAL'
              and previous_decision == 'ALLOW'):
            # Downgrade session
            action_taken = 'downgraded'
            session['current_decision'] = 'CONDITIONAL'
            warnings.append(
                f"Session downgraded to CONDITIONAL: "
                f"risk score {new_decision['risk_score']}"
            )
            if new_decision.get('recommendations'):
                warnings.extend(new_decision['recommendations'])

        # Update session state
        session['current_risk_score'] = new_decision['risk_score']
        session['current_risk_level'] = new_decision.get('risk_level', 'UNKNOWN')
        session['last_heartbeat'] = datetime.now().isoformat()
        session['re_evaluation_count'] += 1
        session['warnings'] = warnings

        # Record re-evaluation event
        event = {
            'session_id': session_id,
            'timestamp': datetime.now().isoformat(),
            'previous_decision': previous_decision,
            'new_decision': new_decision['decision'],
            'risk_score': new_decision['risk_score'],
            'risk_level': new_decision.get('risk_level', 'UNKNOWN'),
            'action_taken': action_taken,
            'context_snapshot': {
                'device_trust_score': context.get('device_trust_score'),
                'location': context.get('current_location'),
            }
        }
        self.re_evaluation_history.setdefault(session_id, []).append(event)

        return {
            'session_status': session['status'],
            'previous_decision': previous_decision,
            'new_decision': new_decision['decision'],
            'risk_score': new_decision['risk_score'],
            'risk_level': new_decision.get('risk_level', 'UNKNOWN'),
            'action_taken': action_taken,
            'warnings': warnings,
            're_evaluation_count': session['re_evaluation_count']
        }

    def get_session_history(self, session_id: str) -> list:
        """Get the full re-evaluation history for a session."""
        return self.re_evaluation_history.get(session_id, [])

    # ------------------------------------------------------------------
    # Statistics (for dashboard)
    # ------------------------------------------------------------------

    def get_session_stats(self) -> dict:
        """
        Aggregate statistics across all sessions.
        """
        total = len(self.sessions)
        active = sum(1 for s in self.sessions.values()
                     if s['status'] == 'ACTIVE')
        revoked = sum(1 for s in self.sessions.values()
                      if s['status'] == 'REVOKED')

        risk_scores = [s['current_risk_score']
                       for s in self.sessions.values()
                       if s['status'] == 'ACTIVE']
        avg_risk = (sum(risk_scores) / len(risk_scores)
                    if risk_scores else 0)

        total_re_evals = sum(s['re_evaluation_count']
                             for s in self.sessions.values())

        return {
            'total_sessions': total,
            'active_sessions': active,
            'revoked_sessions': revoked,
            'average_active_risk_score': round(avg_risk, 2),
            'total_re_evaluations': total_re_evals
        }
