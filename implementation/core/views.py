from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, Log, Block
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, LogSerializer, BlockSerializer
from .blockchain_service import blockchain_service
from .ml_engine import ml_engine
from .ai_service import ai_service

# Auth Views
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.AllowAny,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)
        return Response({'error': 'Registration failed', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# Protected Views (Zero Trust verified by Middleware)
@api_view(['GET'])
def public_resource(request):
    return Response({
        'message': 'Access Granted to Public Resource',
        'riskLevel': getattr(request, 'risk_level', 'Unknown')
    })

@api_view(['GET'])
def confidential_resource(request):
    # Additional Role Check
    if getattr(request.user, 'role', '') == 'guest':
        return Response({'error': 'Access Denied: Insufficient Role for Confidential Data'}, status=403)
        
    return Response({
        'message': 'Access Granted to Confidential Resource',
        'riskLevel': getattr(request, 'risk_level', 'Unknown'),
        'data': 'TOP SECRET DATA: 42'
    })

@api_view(['GET'])
def admin_panel(request):
    if getattr(request.user, 'role', '') != 'admin':
         return Response({'error': 'Access Denied: Admistrators Only'}, status=403)
    
    return Response({
        'message': 'Welcome to Admin Panel',
        'riskLevel': getattr(request, 'risk_level', 'Unknown')
    })

@api_view(['GET'])
def get_logs(request):
    logs = Log.objects.all().order_by('-timestamp')[:50]
    serializer = LogSerializer(logs, many=True)
    return Response(serializer.data)

# Blockchain Views
@api_view(['GET'])
def get_chain(request):
    chain = Block.objects.all().order_by('-index')[:20]
    data = []
    for block in chain:
        payload_encrypted = block.data.get('payload')
        if payload_encrypted:
            try:
                decrypted = blockchain_service.decrypt_data(payload_encrypted)
            except:
                decrypted = {"error": "Decryption failed"}
        else:
            decrypted = block.data
            
        data.append({
            'id': block.id,
            'index': block.index,
            'timestamp': block.timestamp,
            'data': decrypted,
            'previous_hash': block.previous_hash,
            'hash': block.hash,
            'nonce': block.nonce
        })
    return Response(data)

@api_view(['GET'])
def verify_chain(request):
    result = blockchain_service.is_chain_valid()
    return Response(result)

# ML & AI Views
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def train_ml_model(request):
    success = ml_engine.train()
    if success:
        return Response({'message': 'Model trained successfully'})
    return Response({'error': 'Training failed or insufficient data'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_ml_status(request):
    return Response({
        'is_trained': ml_engine.is_trained,
        'model_type': 'IsolationForest'
    })

@api_view(['POST'])
def get_ai_insight(request):
    log_id = request.data.get('log_id')
    try:
        log = Log.objects.get(id=log_id)
        # Get last 5 logs for context
        history = Log.objects.filter(user=log.user).order_by('-timestamp')[:5]
        history_desc = ", ".join([f"{l.action} ({l.status})" for l in history])
        
        insight = ai_service.analyze_risk(
            risk_score='N/A', # Add logic if available
            risk_level=log.risk_level,
            device_info=log.device_health,
            user_history=history_desc
        )
        return Response({'insight': insight})
    except Log.DoesNotExist:
        return Response({'error': 'Log not found'}, status=404)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_posture_insight(request):
    # Summary of last 20 logs
    recent_logs = Log.objects.all().order_by('-timestamp')[:20]
    summary = "\n".join([f"User: {l.user}, Action: {l.action}, Result: {l.status}, Risk: {l.risk_level}" for l in recent_logs])
    
    insight = ai_service.generate_posture_insight(summary)
    return Response({'insight': insight})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_intelligence(request):
    # Fetch blocks for context
    blocks = Block.objects.all().order_by('-index')[:10]
    decrypted_context = []
    for b in blocks:
        payload = b.data.get('payload')
        if payload:
            try:
                decrypted_context.append(blockchain_service.decrypt_data(payload))
            except:
                pass
    
    intel = ai_service.get_realtime_intelligence(decrypted_context)
    return Response(intel)
