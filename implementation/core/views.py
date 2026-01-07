from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, Log, Block
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, LogSerializer, BlockSerializer
from .blockchain_service import blockchain_service

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
    serializer = BlockSerializer(chain, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def verify_chain(request):
    result = blockchain_service.is_chain_valid()
    return Response(result)
