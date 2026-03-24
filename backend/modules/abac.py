"""
Attribute-Based Access Control (ABAC) Module
Evaluates contextual attributes for access decisions
"""

class ABACModule:
    """
    Implements Attribute-Based Access Control.
    Considers user attributes, resource attributes, and environment attributes.
    """
    
    # Policy keys must match the result keys used in evaluate_abac()
    POLICY_WEIGHTS = {
        'department': 0.3,
        'device_trust': 0.25,
        'location': 0.2,
        'sensitivity': 0.25,
    }
    
    def __init__(self, profile_config: dict | None = None):
        """
        Initialize ABAC module.
        Optionally accepts a profile configuration dict that can override policy weights.
        """
        self.policies = {}
        self._initialize_default_policies()

        # Override weights from profile if provided
        if profile_config and 'abac_policy_weights' in profile_config:
            for key, weight in profile_config['abac_policy_weights'].items():
                if key in self.policies:
                    self.policies[key]['weight'] = float(weight)
    
    def _initialize_default_policies(self):
        """
        Initialize default ABAC policies.
        Keys here MUST match the result dict keys in evaluate_abac().
        """
        self.policies = {
            'department': {
                'description': 'User department must match resource required departments',
                'weight': 0.3
            },
            'device_trust': {
                'description': 'Device trust score must meet minimum threshold',
                'weight': 0.25
            },
            'location': {
                'description': 'User location must be allowed for resource',
                'weight': 0.2
            },
            'sensitivity': {
                'description': 'User role must have adequate clearance for resource sensitivity',
                'weight': 0.25
            }
        }
    
    def evaluate_department_attribute(self, user: dict, resource: dict) -> tuple:
        """
        Evaluate if user's department matches resource requirements.
        Returns (score, reason)
        """
        user_dept = user.get('department', 'Unknown')
        required_depts = resource.get('required_departments', [])
        
        if not required_depts:
            return 1.0, f"No department restriction for resource"
        
        if user_dept in required_depts:
            return 1.0, f"Department '{user_dept}' matches required departments"
        
        return 0.0, f"Department '{user_dept}' not in required departments {required_depts}"
    
    def evaluate_device_trust_attribute(self, user: dict, resource: dict) -> tuple:
        """
        Evaluate if device trust score meets requirements.
        Returns (score, reason)
        """
        device_trust = user.get('device_trust_score', 50)
        min_trust = resource.get('min_device_trust', 30)
        
        if device_trust >= min_trust:
            score = min(1.0, device_trust / 100)
            return score, f"Device trust score {device_trust} meets minimum {min_trust}"
        
        score = device_trust / 100
        return score, f"Device trust score {device_trust} below minimum {min_trust}"
    
    def evaluate_location_attribute(self, user: dict, resource: dict) -> tuple:
        """
        Evaluate if user's location is allowed for resource.
        Returns (score, reason)
        """
        location = user.get('location', 'Unknown')
        allowed_locations = resource.get('allowed_locations', ['Office', 'Remote', 'Mobile'])
        
        if location in allowed_locations:
            return 1.0, f"Location '{location}' is allowed"
        
        return 0.0, f"Location '{location}' not in allowed locations {allowed_locations}"
    
    def evaluate_sensitivity_clearance(self, user_role: str, resource_sensitivity: int) -> tuple:
        """
        Evaluate if user role has adequate clearance for resource sensitivity.
        Returns (score, reason)
        """
        role_clearance = {
            'guest': 1,
            'viewer': 2,
            'employee': 3,
            'admin': 5
        }
        
        user_clearance = role_clearance.get(user_role, 0)
        
        if user_clearance >= resource_sensitivity:
            score = min(1.0, user_clearance / 5)
            return score, f"Role '{user_role}' has clearance level {user_clearance} for sensitivity {resource_sensitivity}"
        
        score = user_clearance / 5
        return score, f"Role '{user_role}' insufficient clearance {user_clearance} for sensitivity {resource_sensitivity}"
    
    def evaluate_abac(self, user: dict, resource: dict) -> dict:
        """
        Comprehensive ABAC evaluation.
        Returns dict with individual policy scores and overall weighted score.
        """
        # Keys here MUST match self.policies keys
        results = {
            'department': self.evaluate_department_attribute(user, resource),
            'device_trust': self.evaluate_device_trust_attribute(user, resource),
            'location': self.evaluate_location_attribute(user, resource),
            'sensitivity': self.evaluate_sensitivity_clearance(
                user.get('role'), resource.get('sensitivity_level', 1)
            )
        }
        
        # Calculate weighted score using aligned keys
        weighted_score = 0.0
        for policy_key, policy_data in self.policies.items():
            if policy_key in results:
                score, _ = results[policy_key]
                weighted_score += score * policy_data['weight']
        
        return {
            'department_score': results['department'][0],
            'department_reason': results['department'][1],
            'device_trust_score': results['device_trust'][0],
            'device_trust_reason': results['device_trust'][1],
            'location_score': results['location'][0],
            'location_reason': results['location'][1],
            'sensitivity_score': results['sensitivity'][0],
            'sensitivity_reason': results['sensitivity'][1],
            'weighted_score': round(weighted_score, 4),
            'details': results
        }
    
    def add_custom_policy(self, policy_name: str, weight: float, description: str):
        """
        Add custom ABAC policy (for extensibility).
        """
        self.policies[policy_name] = {
            'weight': weight,
            'description': description
        }
