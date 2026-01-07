from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate 
from rest_framework.exceptions import AuthenticationFailed
from .models import User, Log, Block

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'role', 'risk_score', 'private_key')

    def create(self, validated_data):
        # Use create_user to handle hashing
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            role=validated_data.get('role', 'user'),
            risk_score=validated_data.get('risk_score', 0),
            private_key=validated_data.get('private_key', None)
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Remove default fields
        self.fields['username'] = serializers.CharField(required=False)
        self.fields['password'] = serializers.CharField(required=False)
        # Add private key
        self.fields['private_key'] = serializers.CharField(required=True)

    def validate(self, attrs):
        private_key = attrs.get('private_key')
        
        # Authenticate using private key
        try:
            user = User.objects.get(private_key=private_key)
        except User.DoesNotExist:
             raise AuthenticationFailed('Invalid Private Key')

        if not user.is_active:
             raise AuthenticationFailed('User is inactive')
             
        # Manually set user for Token generation
        self.user = user
        
        # Generate tokens
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(self.user)

        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'token': str(refresh.access_token), # For client compatibility
            'role': self.user.role,
            'username': self.user.username
        }
        
        return data

class LogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Log
        fields = '__all__'

class BlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Block
        fields = '__all__'
