import json
from django.utils import timezone
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import Log
from .blockchain_service import blockchain_service

class ZeroTrustMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Exclude auth, admin, and non-api routes
        path = request.path
        if not (path.startswith('/api/secure') or path.startswith('/api/ledger')):
            return self.get_response(request)

        # Bypass strict checks for logs (read-only monitoring)
        if '/api/secure/logs' in path:
             try:
                 auth = JWTAuthentication()
                 user_auth = auth.authenticate(request)
                 if user_auth:
                     request.user = user_auth[0]
                 else:
                     return JsonResponse({'error': 'Access Denied'}, status=401)
             except Exception:
                 return JsonResponse({'error': 'Access Denied'}, status=401)
             
             return self.get_response(request)

        # 1. Identity Verification
        # We manually invoke DRF's JWT Auth to validate the token early
        user = None
        try:
            auth = JWTAuthentication()
            user_auth = auth.authenticate(request)
            if user_auth:
                user = user_auth[0]
                request.user = user
        except AuthenticationFailed:
            pass # Fall through to failure
        except Exception:
            pass

        # Parse Device Info
        device_info_str = request.headers.get('x-device-info', '{}')
        try:
            device_info = json.loads(device_info_str)
        except:
            device_info = {}

        request_type = f"{request.method} {path}"
        
        if not user:
            self.log_access('Unknown', request_type, 'Denied', 'Critical', device_info, 'Missing or Invalid Token')
            return JsonResponse({'error': 'Access Denied: Invalid Token'}, status=401)

        # 2. Device Health Check
        health = self.check_device_health(device_info)
        if not health['isHealthy']:
            self.log_access(user.username, request_type, 'Denied', 'High', device_info, f"Device Health Failed: {', '.join(health['issues'])}")
            return JsonResponse({'error': 'Access Denied: Device Health Check Failed', 'issues': health['issues']}, status=403)

        # 3. Risk Scoring
        risk_score = 0
        
        if device_info.get('location') == 'Unknown':
            risk_score += 30
        
        current_hour = timezone.now().hour
        if current_hour < 6:
            risk_score += 20
        
        if 'admin-panel' in path and user.role != 'admin':
            risk_score += 50
            
        # Determine Level
        if risk_score > 70:
            risk_level = 'Critical'
        elif risk_score > 40:
            risk_level = 'High'
        elif risk_score > 20:
            risk_level = 'Medium'
        else:
            risk_level = 'Low'
            
        # Enforcement
        if risk_score > 60:
            self.log_access(user.username, request_type, 'Denied', risk_level, device_info, f"Risk Score too high: {risk_score}")
            return JsonResponse({'error': 'Access Denied: Risk Threshold Exceeded'}, status=403)
            
        # Attach risk level to request for views to use
        request.risk_level = risk_level
        
        # Log Success
        self.log_access(user.username, request_type, 'Granted', risk_level, device_info, 'All checks passed')
        
        return self.get_response(request)

    def check_device_health(self, device_info):
        issues = []
        if not device_info.get('antivirus'):
            issues.append('Antivirus Disabled')
        if device_info.get('os') == 'Outdated':
            issues.append('OS Outdated')
        if device_info.get('ipReputation') == 'Bad':
            issues.append('Suspicious IP')
            
        return {'isHealthy': len(issues) == 0, 'issues': issues}

    def log_access(self, username, action, status, risk_level, device_health, details):
        try:
            log = Log.objects.create(
                user=username,
                action=action,
                status=status,
                risk_level=risk_level,
                device_health=device_health,
                details=details
            )
            
            # Add to Blockchain
            blockchain_data = {
                'logId': str(log.id),
                'user': username,
                'action': action,
                'status': status,
                'riskLevel': risk_level,
                'details': details
            }
            blockchain_service.add_block(blockchain_data)
        except Exception as e:
            print(f"Logging failed: {e}")
