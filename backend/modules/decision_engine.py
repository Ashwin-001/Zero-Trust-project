"""
Decision Engine Module
Combines RBAC, ABAC, and Risk Scoring to make final access decisions
"""

class DecisionEngine:
    """
    Makes final access control decisions by combining:
    1. RBAC (Role-Based Access Control)
    2. ABAC (Attribute-Based Access Control)
    3. Risk Scoring
    
    Decision outcomes: ALLOW, CONDITIONAL, DENY
    """
    
    # Thresholds for decision making (can be overridden via profile config)
    THRESHOLDS = {
        'risk_high': 70,      # Risk score threshold for high risk
        'risk_critical': 85,  # Risk score threshold for critical risk
        'abac_conditional': 0.6,  # ABAC score for conditional access
        'rbac_pass': True     # RBAC must pass
    }
    
    def __init__(self, profile_config: dict | None = None):
        self.decision_log = []
        # Use an instance-level copy so class-level defaults are never mutated
        self.thresholds = dict(self.THRESHOLDS)
        if profile_config and 'decision_thresholds' in profile_config:
            for key, value in profile_config['decision_thresholds'].items():
                if key in self.thresholds:
                    self.thresholds[key] = float(value)
    
    def make_decision(self, rbac_result: tuple, abac_result: dict, risk_result: dict) -> dict:
        """
        Make final access decision by combining all factors.
        
        Parameters:
        - rbac_result: (is_allowed, reason) tuple
        - abac_result: dict with weighted_score and details
        - risk_result: dict with overall_risk_score and risk_level
        
        Returns: {
            'decision': 'ALLOW' | 'CONDITIONAL' | 'DENY',
            'reason': explanation,
            'risk_level': risk level,
            'rbac_status': status,
            'abac_score': score,
            'risk_score': score,
            'recommendations': []
        }
        """
        
        rbac_passed, rbac_reason = rbac_result
        abac_score = abac_result.get('weighted_score', 0.5)
        risk_score = risk_result.get('overall_risk_score', 50)
        risk_level = risk_result.get('risk_level', 'MEDIUM')
        
        # Rule 1: RBAC must pass (hard requirement)
        if not rbac_passed:
            decision = 'DENY'
            reason = f"RBAC check failed: {rbac_reason}"
            return self._build_decision_response(
                decision, reason, risk_level, 'FAILED', abac_score, risk_score
            )
        
        # Rule 2: Critical risk always denies
        if risk_score >= self.thresholds['risk_critical']:
            decision = 'DENY'
            reason = f"CRITICAL risk score {risk_score}. Access denied for security."
            recommendations = [
                "Review unusual activity patterns",
                "Verify device security",
                "Check for compromised credentials"
            ]
            return self._build_decision_response(
                decision, reason, risk_level, 'PASSED', abac_score, risk_score, recommendations
            )
        
        # Rule 3: High risk + poor ABAC = CONDITIONAL
        if risk_score >= self.thresholds['risk_high'] or abac_score < self.thresholds['abac_conditional']:
            decision = 'CONDITIONAL'
            reason = "Access granted with security checks required"
            recommendations = []
            
            if risk_score >= self.thresholds['risk_high']:
                recommendations.append(f"High risk score detected ({risk_score})")
            
            if abac_score < self.thresholds['abac_conditional']:
                recommendations.append(f"ABAC score low ({abac_score:.2f})")
            
            recommendations.extend([
                "Require additional authentication",
                "Enable session monitoring",
                "Log all actions performed"
            ])
            
            return self._build_decision_response(
                decision, reason, risk_level, 'PASSED', abac_score, risk_score, recommendations
            )
        
        # Rule 4: All checks pass = ALLOW
        decision = 'ALLOW'
        reason = "Access granted. All security checks passed."
        return self._build_decision_response(
            decision, reason, risk_level, 'PASSED', abac_score, risk_score
        )
    
    def _build_decision_response(self, decision: str, reason: str, risk_level: str, 
                                 rbac_status: str, abac_score: float, risk_score: float, 
                                 recommendations: list = None) -> dict:
        """
        Build standardized decision response.
        """
        if recommendations is None:
            recommendations = []
        
        response = {
            'decision': decision,
            'reason': reason,
            'risk_level': risk_level,
            'rbac_status': rbac_status,
            'abac_score': round(abac_score, 3),
            'risk_score': round(risk_score, 2),
            'recommendations': recommendations,
            'timestamp': None  # Will be set by caller
        }
        
        return response
    
    def evaluate_decision_conditions(self, decision_response: dict) -> dict:
        """
        If CONDITIONAL decision, specify what conditions must be met.
        """
        if decision_response['decision'] != 'CONDITIONAL':
            return decision_response
        
        conditions = {
            'multi_factor_auth_required': decision_response['risk_score'] > 50,
            'session_monitoring_required': decision_response['risk_score'] > 60,
            'time_limited_access': decision_response['risk_score'] > 70,
            'one_time_approval_required': decision_response['abac_score'] < 0.5,
            'resource_logging_required': True
        }
        
        decision_response['conditions'] = conditions
        decision_response['time_limit_minutes'] = self._calculate_time_limit(
            decision_response['risk_score']
        )
        
        return decision_response
    
    def _calculate_time_limit(self, risk_score: float) -> int:
        """
        Calculate time limit for session based on risk.
        """
        if risk_score < 40:
            return 480  # 8 hours
        elif risk_score < 60:
            return 240  # 4 hours
        elif risk_score < 80:
            return 60   # 1 hour
        else:
            return 15   # 15 minutes
    
    def add_decision_to_log(self, decision: dict):
        """
        Log decision for auditing.
        """
        self.decision_log.append(decision)
    
    def get_decision_stats(self) -> dict:
        """
        Get statistics on decision patterns.
        """
        if not self.decision_log:
            return {
                'total_decisions': 0,
                'allow_count': 0,
                'conditional_count': 0,
                'deny_count': 0
            }
        
        allow_count = sum(1 for d in self.decision_log if d['decision'] == 'ALLOW')
        conditional_count = sum(1 for d in self.decision_log if d['decision'] == 'CONDITIONAL')
        deny_count = sum(1 for d in self.decision_log if d['decision'] == 'DENY')
        
        return {
            'total_decisions': len(self.decision_log),
            'allow_count': allow_count,
            'conditional_count': conditional_count,
            'deny_count': deny_count,
            'deny_percentage': round((deny_count / len(self.decision_log)) * 100, 2)
        }
