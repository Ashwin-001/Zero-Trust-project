from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate 
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken
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

    def validate_private_key(self, value):
        if not value or len(value) < 20: # Example minimum length
            raise serializers.ValidationError("Private key must be at least 20 characters long.")
        return value

class IdentityEnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('private_key', 'role')
        extra_kwargs = {
            'private_key': {'required': False, 'allow_blank': True},
            'role': {'required': False}
        }
    
    def create(self, validated_data):
        import uuid
        from django.utils.crypto import get_random_string
        # Auto-gen identiy
        uid = str(uuid.uuid4())[:8]
        username = f"Identity_{uid}"
        password = get_random_string(length=12)
        
        # Key generation logic
        custom_key = validated_data.get('private_key')
        if not custom_key:
            # Generate a secure key (simulated)
            custom_key = f"pk_{uuid.uuid4().hex}"
            
        try:
            user = User.objects.create_user(
                username=username,
                password=password,
                role=validated_data.get('role', 'user'),
                private_key=custom_key
            )
        except Exception as e:
            if "private_key" in str(e) or "unique constraint" in str(e).lower():
                raise serializers.ValidationError({"private_key": ["This key is already registered. Please login or choose another."]})
            raise e
        return user

    def validate_private_key(self, value):
        # Allow blank for auto-generation, but if provided, validate length
        if value and len(value) < 20: # Example minimum length
            raise serializers.ValidationError("Private key must be at least 20 characters long if provided.")
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Remove default fields
        self.fields['username'] = serializers.CharField(required=False)
        self.fields['password'] = serializers.CharField(required=False)
        # Support both direct key (backward compatibility) and ZKP Proof
        self.fields['private_key'] = serializers.CharField(required=False)
        self.fields['zkp_proof'] = serializers.CharField(required=False)
        self.fields['client_id'] = serializers.CharField(required=False)


    def validate(self, attrs):
        print(f"DEBUG LOGIN: attrs keys = {list(attrs.keys())}")
        username = (attrs.get('username') or "").strip()
        private_key = (attrs.get('private_key') or "").strip()
        zkp_proof = attrs.get('zkp_proof')
        client_id = attrs.get('client_id')
        
        user = None

        # Case 1: Username provided (Old Flow)
        if username:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                raise AuthenticationFailed('Subject Identity Not Found')
        
        # Case 2: No Username, try Private Key Lookup (New Zero Trust Flow)
        elif private_key:
             try:
                 user = User.objects.get(private_key=private_key)
             except User.DoesNotExist:
                 raise AuthenticationFailed('Invalid Identity Key')
        else:
             raise AuthenticationFailed(' Identity Credentials Required')

        # ZKP PROTOTYPE LOGIC
        if zkp_proof and client_id:
            from .zkp_store import CHALLENGES
            challenge = CHALLENGES.get(client_id)
            print(f"DEBUG ZKP: username={username}, client_id={client_id}, challenge_found={bool(challenge)} [Store ID: {id(CHALLENGES)}]")
            
            if not challenge:
                raise AuthenticationFailed('ZKP Session Expired. Please try again.')
            
            if not (user.private_key or "").strip():
                raise AuthenticationFailed('Identity Key Not Enrolled for this Subject')


            # Reconstruct proof: SHA256(private_key + challenge)
            import hashlib
            stored_key = user.private_key.strip() if user.private_key else ""
            expected_proof = hashlib.sha256(f"{stored_key}{challenge}".encode()).hexdigest()
            


            # Log for debugging (remove in production)
            try:
                with open('/tmp/zkp_debug.log', 'a') as f:
                    f.write(f"USER: {username} | CID: {client_id} | STORE: {id(CHALLENGES)} | CALC: {expected_proof[:10]}... | RECV: {zkp_proof.strip()[:10]}...\n")
            except: pass

            if zkp_proof.strip().lower() != expected_proof.lower():
                raise AuthenticationFailed('ZKP Proof Validation Failed: Identity Mismatch')
            
            # Clear challenge after use
            del CHALLENGES[client_id]
        elif private_key:
            if user.private_key.strip() != private_key.strip():
                raise AuthenticationFailed('Identity Key Mismatch')
        else:
            raise AuthenticationFailed('No Identity Proof Provided')

        if not user.is_active:
             raise AuthenticationFailed('User is inactive')
             
        self.user = user
        refresh = RefreshToken.for_user(self.user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'token': str(refresh.access_token),
            'role': self.user.role,
            'username': self.user.username
        }

class LogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Log
        fields = '__all__'

class BlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Block
        fields = '__all__'
