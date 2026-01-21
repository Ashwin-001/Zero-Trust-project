import json
from django.utils import timezone
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import Log
from .blockchain_service import blockchain_service
from .ml_engine import ml_engine

class ZeroTrustMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        # Only protect secure endpoints
        if not path.startswith('/api/secure'):
            return self.get_response(request)

        # 1. CONTINUOUS VERIFICATION PHASE (RBAC + ABAC)
        
        # A. Identity & RBAC Verification
        user = None
        try:
            auth = JWTAuthentication()
            user_auth = auth.authenticate(request)
            if user_auth:
                user = user_auth[0]
                request.user = user
        except:
            pass

        if not user:
            self.log_to_ledger('Unknown', f"RBAC Failure: {path}", 'Denied', 'Critical', {}, 'Unauthorized Access Attempt')
            return JsonResponse({'error': 'RBAC Verification Failed: No Identity'}, status=401)

        # B. Attribute-Based (ABAC) & Device Verification
        device_info_str = request.headers.get('x-device-info', '{}')
        try:
            device_info = json.loads(device_info_str)
        except:
            device_info = {}

        health = self.verify_attributes(device_info)
        
        # 2. BLOCKCHAIN LEDGER PHASE
        status_val = 'Granted' if health['isHealthy'] else 'Blocked'
        risk_level = 'Low' if health['isHealthy'] else 'High'
        details = f"RBAC/ABAC Passed" if health['isHealthy'] else f"ABAC Issues: {health['issues']}"
        
        # Log every verification event to the Ledger
        self.log_to_ledger(user.username, f"Access {path}", status_val, risk_level, device_info, details)

        if not health['isHealthy']:
            return JsonResponse({
                'error': 'Continuous Verification Failure (ABAC)',
                'issues': health['issues'],
                'verdict': 'Blocked by Policy Engine'
            }, status=403)

        # 3. ENTERPRISE RESOURCE PHASE
        return self.get_response(request)

    def verify_attributes(self, device_info):
        """ABAC logic: Checking device environmental attributes"""
        issues = []
        if not device_info.get('antivirus'):
            issues.append('Antivirus_Check_Failed')
        if device_info.get('os') == 'Outdated':
            issues.append('OS_Patch_Level_Critical')
        if device_info.get('ipReputation') == 'Bad':
            issues.append('Network_Location_Untrusted')
            
        return {'isHealthy': len(issues) == 0, 'issues': issues}

    def log_to_ledger(self, username, action, status, risk_level, device_health, details):
        """Writes audit trail to the Immutable Blockchain Ledger"""
        try:
            import uuid
            blockchain_data = {
                'id': str(uuid.uuid4()),
                'user': username,
                'action': action,
                'status': status,
                'risk_level': risk_level,
                'device_health': device_health,
                'details': details,
                'timestamp': str(timezone.now()),
                'protocol': 'Z-TRUST/2.0'
            }
            blockchain_service.add_block(blockchain_data)
        except Exception as e:
            print(f"Ledger write failed: {e}")

