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
        user = None
        try:
            auth = JWTAuthentication()
            user_auth = auth.authenticate(request)
            if user_auth:
                user = user_auth[0]
                request.user = user
        except:
            pass

        # Parse Device Info
        device_info_str = request.headers.get('x-device-info', '{}')
        try:
            device_info = json.loads(device_info_str)
        except:
            device_info = {}

        request_type = f"{request.method} {path}"
        
        if not user:
            self.log_access('Unknown', request_type, 'Denied', 'Critical', device_info, 'Missing Token')
            return JsonResponse({'error': 'Access Denied: Invalid Token'}, status=401)

        # 2. Device Health Check
        health = self.check_device_health(device_info)
        status_val = 'Granted' if health['isHealthy'] else 'Denied'
        risk_level = 'Low' if health['isHealthy'] else 'High'
        details = f"Checks Passed" if health['isHealthy'] else f"Device Issues: {health['issues']}"

        # Attach to request
        request.risk_level = risk_level
        request.risk_score = 0 if health['isHealthy'] else 50
        
        # Log to Blockchain (MongoDB)
        self.log_access(user.username, request_type, status_val, risk_level, device_info, details)
        
        if not health['isHealthy']:
            return JsonResponse({'error': 'Device Health Failure', 'issues': health['issues']}, status=403)

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
            import uuid
            
            
            # 1. Prepare plaintext data
            blockchain_data = {
                'id': str(uuid.uuid4()),
                'user': username,
                'action': action,
                'status': status,
                'risk_level': risk_level,
                'device_health': device_health,
                'details': details,
                'timestamp': str(timezone.now())
            }
            
            # 2. Get historical context (decrypt last 10 blocks for RAG)
            history = []
            try:
                from .models import Block
                recent_blocks = Block.objects.all().order_by('-index')[:10]
                for block in recent_blocks:
                    payload = block.data.get('payload')
                    if payload:
                        try:
                            history.append(blockchain_service.decrypt_data(payload))
                        except:
                            pass
            except:
                pass
            
            # 3. RAG Analysis - DISABLED to save quota
            # from .ai_service import ai_service
            # ai_insight = ai_service.analyze_with_rag(blockchain_data, history)
            # blockchain_data['ai_insight'] = ai_insight
            
            # 5. Encrypt and store (blockchain service handles encryption)
            blockchain_service.add_block(blockchain_data)

            
        except Exception as e:
            print(f"Logging failed: {e}")
