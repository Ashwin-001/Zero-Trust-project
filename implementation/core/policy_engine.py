
import json
from datetime import datetime

class PolicyEngine:
    def __init__(self):
        # Define base policies
        self.abac_rules = {
            'min_os_version': ['Windows 11', 'MacOS', 'Linux'],
            'trusted_locations': ['Corporate HQ', 'Safe Zone'],
            'required_services': ['antivirus'],
            'blocked_ips': ['192.168.1.666'], # Example malicious IP
        }

    def evaluate_risk(self, user, device_info, path):
        """
        Calculates a dynamic risk score (0-100)
        0 = Safe, 100 = Critical Threat
        """
        score = 0
        reasons = []

        # 1. Identity Risk (RBAC based)
        role = getattr(user, 'role', 'guest')
        if role == 'guest':
            score += 10
            reasons.append("Guest access level assigned")
        elif role == 'restricted':
            score += 40
            reasons.append("Account under restriction")

        # 2. Device Attribute Risk (ABAC)
        if not device_info.get('antivirus'):
            score += 30
            reasons.append("Security Service: Antivirus Disabled")
        
        os_name = device_info.get('os', 'Unknown')
        if os_name == 'Outdated' or os_name not in self.abac_rules['min_os_version']:
            score += 20
            reasons.append(f"OS Version Insufficient: {os_name}")
            
        if device_info.get('ipReputation') == 'Bad':
            score += 50
            reasons.append("Network Reputation: MALICIOUS_IP_DETECTED")

        # 3. Contextual Risk
        hour = datetime.now().hour
        if hour < 6 or hour > 22: # After hours
            score += 15
            reasons.append("Access attempted during non-business hours")

        # Sensitive paths increase risk sensitivity
        if '/admin' in path or '/secure' in path:
            score *= 1.2

        # Cap at 100
        final_score = min(int(score), 100)
        
        level = "Low"
        if final_score > 70: level = "Critical"
        elif final_score > 40: level = "Medium"
        elif final_score > 20: level = "Elevated"

        return {
            'score': final_score,
            'level': level,
            'reasons': reasons,
            'timestamp': datetime.now().isoformat()
        }

    def check_permissions(self, user, path):
        """RBAC Permission Mapping"""
        role = getattr(user, 'role', 'guest')
        
        role_hierarchy = {
            'admin': ['public', 'secure', 'admin'],
            'developer': ['public', 'secure'],
            'user': ['public', 'secure'],
            'guest': ['public'],
            'restricted': []
        }

        allowed_zones = role_hierarchy.get(role, [])
        
        if '/api/admin' in path and 'admin' not in allowed_zones:
            return False, "Role 'admin' required for this sector."
        
        if '/api/secure' in path and 'secure' not in allowed_zones:
            return False, "Identity validation required for secure zones."
            
        return True, "RBAC Clear"

policy_engine = PolicyEngine()
