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


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Remove default fields
        self.fields['username'] = serializers.CharField(required=True)
        self.fields['password'] = serializers.CharField(required=False)
        # Support both direct key (backward compatibility) and ZKP Proof
        self.fields['private_key'] = serializers.CharField(required=False)
        self.fields['zkp_proof'] = serializers.CharField(required=False)
        self.fields['client_id'] = serializers.CharField(required=False)


    def validate(self, attrs):
        print(f"DEBUG LOGIN: attrs keys = {list(attrs.keys())}")
        username = (attrs.get('username') or "").strip()
        private_key = attrs.get('private_key')
        zkp_proof = attrs.get('zkp_proof')
        client_id = attrs.get('client_id')
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
             raise AuthenticationFailed('Subject Identity Not Found')

        # Demo quality-of-life: if the DB user exists but is missing a private_key,
        # auto-repair from `create_users.py` (seed source of truth) to prevent
        # ZKP/identity mismatches for known demo identities like `admin`.
        if not (user.private_key or "").strip():
            try:
                import sys, os
                sys.path.append(os.path.dirname(os.path.dirname(__file__)))
                from create_users import users_to_create  # type: ignore
                seeded = next((u for u in users_to_create if (u.get('username') or "").strip() == username), None)
                seeded_key = (seeded.get('private_key') or "").strip() if seeded else ""
                if seeded_key:
                    user.private_key = seeded_key
                    if seeded.get('role'):
                        user.role = seeded.get('role')
                    if 'is_staff' in seeded:
                        user.is_staff = bool(seeded.get('is_staff'))
                    if 'is_superuser' in seeded:
                        user.is_superuser = bool(seeded.get('is_superuser'))
                    user.save(update_fields=['private_key', 'role', 'is_staff', 'is_superuser'])
            except Exception:
                # If anything goes wrong, fall through to normal auth errors below.
                pass





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
