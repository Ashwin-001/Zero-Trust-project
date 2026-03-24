"""
Risk Scoring Engine Module
Evaluates contextual factors to compute a risk score
"""

from datetime import datetime, timedelta
import json
from pathlib import Path


class RiskScoringEngine:
    """
    Implements a rule-based risk scoring system.
    Evaluates multiple contextual factors and returns a composite risk score (0-100).
    Higher score = higher risk.
    """
    
    # Default risk factors and their weights (can be overridden via config)
    RISK_FACTORS = {
        'login_attempts': 0.15,
        'time_of_access': 0.1,
        'location_change': 0.15,
        'device_risk': 0.2,
        'resource_sensitivity': 0.15,
        'department_mismatch': 0.1,
        'access_pattern_anomaly': 0.15,
    }
    
    def __init__(self, profile_config: dict | None = None):
        """
        Initialize engine.
        Optionally accepts a profile configuration dict that can override RISK_FACTORS.
        """
        self.user_access_history = {}  # Track user access patterns
        if profile_config and 'risk_factors' in profile_config:
            # Safely override only known keys to avoid silent typos.
            for k, v in profile_config['risk_factors'].items():
                if k in self.RISK_FACTORS:
                    self.RISK_FACTORS[k] = float(v)
    
    def calculate_login_attempt_risk(self, user_id: str, failed_attempts: int) -> float:
        """
        Calculate risk score based on failed login attempts.
        Returns score 0-1.
        """
        # Exponential risk increase with failed attempts
        if failed_attempts == 0:
            return 0.0
        elif failed_attempts == 1:
            return 0.1
        elif failed_attempts == 2:
            return 0.25
        elif failed_attempts >= 3:
            return min(1.0, 0.5 + (failed_attempts - 3) * 0.1)
    
    def calculate_time_of_access_risk(self, access_hour: int, user_id: str) -> float:
        """
        Calculate risk based on access time (unusual hours = higher risk).
        Returns score 0-1.
        """
        # Define business hours: 8 AM to 6 PM
        business_start = 8
        business_end = 18
        
        if business_start <= access_hour < business_end:
            return 0.0  # No risk during business hours
        
        # After hours and weekend access
        if access_hour >= 20 or access_hour < 6:
            return 0.5  # Late night/very early morning
        elif access_hour < business_start or access_hour >= business_end:
            return 0.2  # Early morning or evening
        
        return 0.1
    
    def calculate_location_change_risk(self, user_id: str, current_location: str, last_location: str = None) -> float:
        """
        Calculate risk based on location change.
        Returns score 0-1.
        """
        if last_location is None:
            return 0.0  # First access
        
        # Same location = no risk
        if current_location == last_location:
            return 0.0
        
        # Location change
        impossible_distance = {
            ('Office', 'Mobile'): 0.1,
            ('Office', 'Remote'): 0.15,
            ('Remote', 'Office'): 0.15,
            ('Remote', 'Mobile'): 0.1,
            ('Mobile', 'Mobile'): 0.0,
        }
        
        location_pair = (last_location, current_location)
        return impossible_distance.get(location_pair, 0.3)
    
    def calculate_device_risk(self, device_trust_score: int, resource_sensitivity: int) -> float:
        """
        Calculate risk based on device trust score and resource sensitivity.
        Returns score 0-1.
        """
        # Device trust mismatch with resource sensitivity
        trust_level = device_trust_score / 100
        sensitivity_requirement = min(1.0, resource_sensitivity / 5)
        
        if trust_level >= sensitivity_requirement:
            return 0.0
        
        # Risk increases with mismatch
        mismatch = sensitivity_requirement - trust_level
        return min(1.0, mismatch * 2)
    
    def calculate_department_mismatch_risk(self, user_dept: str, resource_required_depts: list) -> float:
        """
        Calculate risk if user department doesn't match resource requirements.
        Returns score 0-1.
        """
        if not resource_required_depts:
            return 0.0  # No restriction
        
        if user_dept in resource_required_depts:
            return 0.0  # Match
        
        return 0.4  # Department mismatch is risky
    
    def calculate_access_pattern_anomaly(self, user_id: str, resource_id: str) -> float:
        """
        Detect if this access pattern is unusual for the user.
        Returns score 0-1.
        """
        if user_id not in self.user_access_history:
            return 0.1  # Slight risk for new history
        
        history = self.user_access_history[user_id]
        
        if resource_id in history['frequent_resources']:
            return 0.0  # Normal access pattern
        
        if resource_id in history['rarely_accessed']:
            return 0.3  # Unusual access
        
        return 0.15  # New resource access
    
    def record_access(self, user_id: str, resource_id: str):
        """
        Record user access to track patterns.
        """
        if user_id not in self.user_access_history:
            self.user_access_history[user_id] = {
                'frequent_resources': set(),
                'rarely_accessed': set(),
                'access_count': {}
            }
        
        history = self.user_access_history[user_id]
        history['access_count'][resource_id] = history['access_count'].get(resource_id, 0) + 1
        
        # Update frequent and rare
        if history['access_count'][resource_id] > 5:
            history['frequent_resources'].add(resource_id)
            history['rarely_accessed'].discard(resource_id)
        elif history['access_count'][resource_id] == 1:
            history['rarely_accessed'].add(resource_id)
    
    def calculate_risk_score(self, context: dict) -> dict:
        """
        Calculate composite risk score from multiple factors.
        
        context should include:
        - user_id
        - resource_id
        - failed_attempts
        - access_hour
        - current_location
        - last_location
        - device_trust_score
        - resource_sensitivity
        - user_department
        - resource_required_departments
        """
        
        scores = {
            'login_attempts': self.calculate_login_attempt_risk(
                context.get('user_id', ''),
                context.get('failed_attempts', 0)
            ),
            'time_of_access': self.calculate_time_of_access_risk(
                context.get('access_hour', datetime.now().hour),
                context.get('user_id', '')
            ),
            'location_change': self.calculate_location_change_risk(
                context.get('user_id', ''),
                context.get('current_location', 'Office'),
                context.get('last_location')
            ),
            'device_risk': self.calculate_device_risk(
                context.get('device_trust_score', 50),
                context.get('resource_sensitivity', 1)
            ),
            'department_mismatch': self.calculate_department_mismatch_risk(
                context.get('user_department', 'Unknown'),
                context.get('resource_required_departments', [])
            ),
            'access_pattern': self.calculate_access_pattern_anomaly(
                context.get('user_id', ''),
                context.get('resource_id', '')
            )
        }
        
        # Calculate weighted composite score
        composite_score = 0.0
        for factor, score in scores.items():
            weight = self.RISK_FACTORS.get(factor, 0.0)
            composite_score += score * weight
        
        # Normalize to 0-100
        risk_score = composite_score * 100
        
        return {
            'overall_risk_score': round(risk_score, 2),
            'risk_level': self._get_risk_level(risk_score),
            'factor_scores': scores,
            'risk_factors': self.RISK_FACTORS
        }
    
    def _get_risk_level(self, score: float) -> str:
        """
        Map risk score to risk level.
        """
        if score < 20:
            return 'LOW'
        elif score < 50:
            return 'MEDIUM'
        elif score < 75:
            return 'HIGH'
        else:
            return 'CRITICAL'
