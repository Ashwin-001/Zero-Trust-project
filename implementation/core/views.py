from rest_framework import generics, permissions, status
from rest_framework.views import APIView
import requests
import os
import datetime
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, Log, Block, AIInsight
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

class GoogleLoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        code = request.data.get('code')
        
        # Google Configuration
        CLIENT_ID = "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com"
        # Ideally this should be in environment variables
        CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '') 
        REDIRECT_URI = "http://localhost:53077/oauth-callback"
        
        if not CLIENT_SECRET:
             # For dev/demo without secret, we can't really do the exchange securely.
             # However, assuming the user might put it in env later.
             pass

        # Exchange code for token
        token_endpoint = "https://oauth2.googleapis.com/token"
        data = {
            'code': code,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'redirect_uri': REDIRECT_URI,
            'grant_type': 'authorization_code'
        }
        
        try:
             response = requests.post(token_endpoint, data=data)
             if response.status_code != 200:
                  return Response({'error': 'Failed to exchange token from Google', 'details': response.json()}, status=status.HTTP_400_BAD_REQUEST)
             
             tokens = response.json()
             access_token = tokens.get('access_token')
             
             # Get User Info
             user_info_resp = requests.get('https://www.googleapis.com/oauth2/v2/userinfo', 
                                           headers={'Authorization': f'Bearer {access_token}'})
             
             if user_info_resp.status_code != 200:
                  return Response({'error': 'Failed to fetch user info from Google'}, status=status.HTTP_400_BAD_REQUEST)
                  
             user_data = user_info_resp.json()
             email = user_data.get('email')
             
             # Find or Create User
             try:
                 user = User.objects.get(username=email)
             except User.DoesNotExist:
                 user = User.objects.create(
                     username=email,
                     email=email,
                     role='user',
                     private_key=f"google_{email}" # Placeholder
                 )
                 user.set_unusable_password()
                 user.save()
            
             # Generate JWT
             refresh = RefreshToken.for_user(user)
             return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'token': str(refresh.access_token),
                'role': user.role,
                'username': user.username
             })

        except Exception as e:
             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    # Retrieve logs from Blockchain (since SQL logging is disabled)
    chain = Block.objects.all().order_by('-index')[:50]
    logs = []
    
    for block in chain:
        payload = block.data.get('payload')
        block_data = {}
        if payload:
            try:
                block_data = blockchain_service.decrypt_data(payload)
            except:
                continue
        else:
             block_data = block.data
             
        # Check if this block looks like a log entry
        if 'user' in block_data and 'action' in block_data:
             log_entry = {
                 'id': block_data.get('id', block.id),
                 'user': block_data.get('user'),
                 'action': block_data.get('action'),
                 'status': block_data.get('status'),
                 'risk_level': block_data.get('risk_level', block_data.get('riskLevel', 'Unknown')),
                 'device_health': block_data.get('device_health', {}),
                 'timestamp': block_data.get('timestamp', block.timestamp),
                 'details': block_data.get('details')
             }
             logs.append(log_entry)
             
    return Response(logs)

# Blockchain Views
@api_view(['GET'])
def get_chain(request):
    data = []
    
    # Priority: Fetch from MongoDB (Immutable Store)
    if blockchain_service.mongo_active:
        try:
            # Fetch last 20 blocks from MongoDB
            cursor = blockchain_service.collection.find({}, {'_id': 0}).sort("index", -1).limit(20)
            mongo_chain = list(cursor)
            
            for block in mongo_chain:
                payload_encrypted = block.get('data')
                
                # Handle double encapsulation if present (data.payload vs data)
                if isinstance(payload_encrypted, dict) and 'payload' in payload_encrypted:
                    payload_encrypted = payload_encrypted['payload']
                
                if payload_encrypted:
                    try:
                        decrypted = blockchain_service.decrypt_data(payload_encrypted)
                    except Exception as e:
                        decrypted = {"error": "Decryption failed", "raw": str(payload_encrypted)}
                else:
                    decrypted = block.get('data', {})

                data.append({
                    'id': str(block.get('index')), # MongoDB doesn't have ID in projection, use index
                    'index': block.get('index'),
                    'timestamp': block.get('timestamp') if not isinstance(block.get('timestamp'), float) else datetime.datetime.fromtimestamp(block.get('timestamp')/1000.0).isoformat(),
                    'data': decrypted,
                    'previous_hash': block.get('previous_hash'),
                    'hash': block.get('hash'),
                    'nonce': block.get('nonce'),
                    'signature': block.get('signature'),
                    'merkle_root': block.get('merkle_root'),
                    'source': 'MONGODB_REPLICA'
                })
            return Response(data)
        except Exception as e:
            print(f"MongoDB Fetch Error: {e}")
            # Fallthrough to SQLite

    # Fallback: SQLite
    chain = Block.objects.all().order_by('-index')[:20]
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
            'nonce': block.nonce,
            'signature': block.signature,
            'merkle_root': block.merkle_root,
            'source': 'SQLITE_CACHE'
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
class RAGChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # 1. Extract data from frontend
        data = request.data
        user = request.user
        query = data.get('query', 'General Security Assessment')
        
        # 2. Prepare History for Formula Calculation (decrypted)
        blocks = Block.objects.all().order_by('-index')[:20]
        history = []
        for b in blocks:
            payload = b.data.get('payload')
            if payload:
                try:
                    history.append(blockchain_service.decrypt_data(payload))
                except: pass
        
        # 3. CUSTOM RAG Analysis (Local LLM + Metrics Formulas)
        chat_response = ai_service.analyze_with_rag(query, history)
        
        # 4. DUAL OUTPUT PATTERN:
        
        # OUTPUT 1: Immediate Frontend Response
        frontend_response = {
            'chat': chat_response,
            'status': 'success'
        }
        
        # OUTPUT 2: Prepare for Encrypted Storage
        import uuid
        from django.utils import timezone
        log_entry = {
            'id': str(uuid.uuid4()),
            'user': user.username,
            'action': f"RAG Query: {query[:50]}...",
            'status': 'Processed',
            'risk_level': 'Low',
            'device_health': data.get('device_health', {}),
            'details': f"Custom RAG analysis completed locally.",
            'timestamp': str(timezone.now()),
            'ai_insight': chat_response
        }
        
        # Encrypt and store to blockchain (MongoDB + SQLite)
        blockchain_service.add_block(log_entry)
        
        # 5. Return frontend response
        return Response(frontend_response)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_posture_insight(request):
    # Returning last cached insight but allowing fresh RAG analysis via the POST endpoint
    try:
        insight = AIInsight.objects.get(insight_type='posture')
        return Response(insight.content)
    except AIInsight.DoesNotExist:
        return Response({'insight': 'AI Analysis initializing... Please wait.'})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_intelligence(request):
    try:
        intel = AIInsight.objects.get(insight_type='intelligence')
        return Response(intel.content)
    except AIInsight.DoesNotExist:
        return Response({"summary": "AI Initializing", "chart_data": [0,0,0,0,0]})

