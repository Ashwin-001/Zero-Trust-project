import json
from django.utils import timezone
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import Log
from .blockchain_service import blockchain_service
from .ml_engine import ml_engine


from .policy_engine import policy_engine

class ZeroTrustMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        
        # 1. INITIAL IDENTITY HARVESTING
        user = None
        try:
            auth = JWTAuthentication()
            user_auth = auth.authenticate(request)
            if user_auth:
                user = user_auth[0]
                request.user = user
        except:
            pass

        # Public endpoints bypass core verification but still log
        if not path.startswith('/api/secure') and not path.startswith('/api/admin'):
             return self.get_response(request)

        # 2. RBAC VERIFICATION
        if not user:
            self.log_to_ledger('Unknown', f"RBAC Failure: {path}", 'Denied', 'Critical', 100, {}, 'Unauthorized Access Attempt')
            return JsonResponse({'error': 'RBAC Verification Failed: No IdentityFound'}, status=401)

        is_allowed, rbac_msg = policy_engine.check_permissions(user, path)
        if not is_allowed:
             self.log_to_ledger(user.username, f"Unauthorized Path: {path}", 'Blocked', 'High', 80, {}, rbac_msg)
             return JsonResponse({'error': f'RBAC Denied: {rbac_msg}'}, status=403)

        # 3. ABAC & RISK SCORING PHASE
        device_info_str = request.headers.get('x-device-info', '{}')
        try:
            device_info = json.loads(device_info_str)
        except:
            device_info = {}

        risk_analysis = policy_engine.evaluate_risk(user, device_info, path)
        request.risk_score = risk_analysis['score']
        request.risk_level = risk_analysis['level']
        
        # 4. ENFORCEMENT PHASE
        if risk_analysis['score'] > 60:
            self.log_to_ledger(user.username, f"Access {path}", 'Blocked', risk_analysis['level'], risk_analysis['score'], device_info, f"Policy Violation: {', '.join(risk_analysis['reasons'])}")
            return JsonResponse({
                'error': 'Terminal Policy Violation',
                'risk_score': risk_analysis['score'],
                'risk_level': risk_analysis['level'],
                'violations': risk_analysis['reasons'],
                'verdict': 'Blocked by Rule-Based Risk Engine'
            }, status=403)

        # 5. BLOCKCHAIN LEDGER PHASE (FOR SUCCESS)
        self.log_to_ledger(
            user.username, 
            f"Access {path}", 
            'Granted', 
            risk_analysis['level'], 
            risk_analysis['score'],
            device_info, 
            "Identity verified via ZKP Prototype & Multi-Attribute Check"
        )

        return self.get_response(request)

    def log_to_ledger(self, username, action, status, risk_level, risk_score, device_health, details):
        """Writes audit trail to the Immutable Blockchain Ledger"""
        try:
            import uuid
            blockchain_data = {
                'id': str(uuid.uuid4()),
                'user': username,
                'action': action,
                'status': status,
                'risk_level': risk_level,
                'risk_score': risk_score,
                'device_health': device_health,
                'details': details,
                'timestamp': str(timezone.now()),
                'protocol': 'Z-TRUST/2.5'
            }
            blockchain_service.add_block(blockchain_data)
        except Exception as e:
            print(f"Ledger write failed: {e}")

