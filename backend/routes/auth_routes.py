"""
Authentication routes
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import secrets
import jwt
from models import User

auth_bp = Blueprint('auth', __name__)

# Demo user credentials (plaintext passwords for hash generation at startup)
DEMO_CREDENTIALS = {
    'admin_user': {
        'password': 'admin_pass',
        'email': 'admin@company.com',
        'role': 'admin',
        'department': 'IT',
        'device_trust_score': 95,
        'location': 'Office'
    },
    'john_employee': {
        'password': 'emp_pass',
        'email': 'john@company.com',
        'role': 'employee',
        'department': 'Finance',
        'device_trust_score': 70,
        'location': 'Office'
    },
    'jane_viewer': {
        'password': 'viewer_pass',
        'email': 'jane@company.com',
        'role': 'viewer',
        'department': 'HR',
        'device_trust_score': 60,
        'location': 'Remote'
    },
    'remote_employee': {
        'password': 'remote_pass',
        'email': 'remote@company.com',
        'role': 'employee',
        'department': 'IT',
        'device_trust_score': 45,
        'location': 'Remote'
    }
}

# Will be populated by init_users() at app startup
MOCK_USERS = {}


def init_users(auth_module):
    """
    Initialize MOCK_USERS with properly hashed passwords.
    Called once at app startup to ensure password hashes match the algorithm.
    """
    for username, cred in DEMO_CREDENTIALS.items():
        password_hash, salt = auth_module.hash_password(cred['password'])
        MOCK_USERS[username] = {
            'password_hash': password_hash,
            'salt': salt,
            'email': cred['email'],
            'role': cred['role'],
            'department': cred['department'],
            'device_trust_score': cred['device_trust_score'],
            'location': cred['location']
        }


def get_users_public_data():
    """
    Return user data without sensitive fields (for populating users_db).
    """
    users = {}
    for username, data in MOCK_USERS.items():
        users[username] = {
            'username': username,
            'email': data['email'],
            'role': data['role'],
            'department': data['department'],
            'device_trust_score': data.get('device_trust_score', 50),
            'location': data.get('location', 'Office'),
            'created_at': datetime.now().isoformat()
        }
    return users


def generate_token(user_id: str) -> str:
    """
    Generate JWT token for authenticated user.
    Uses integer UTC timestamps to avoid PyJWT timezone issues.
    """
    import time
    now = int(time.time())
    exp_seconds = int(current_app.config['JWT_EXPIRATION'].total_seconds())
    token = jwt.encode(
        {
            'user_id': user_id,
            'iat': now,
            'exp': now + exp_seconds
        },
        current_app.config['JWT_SECRET'],
        algorithm='HS256'
    )
    return token

def verify_token(token: str) -> dict:
    """
    Verify JWT token and return payload.
    """
    try:
        payload = jwt.decode(
            token,
            current_app.config['JWT_SECRET'],
            algorithms=['HS256']
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    User registration endpoint.
    """
    data = request.get_json()
    
    if not data or not all(k in data for k in ['username', 'password', 'email', 'role', 'department']):
        return {'error': 'Missing required fields'}, 400
    
    username = data['username']
    password = data['password']
    email = data['email']
    role = data['role']
    department = data['department']
    
    # Validate role
    if role not in ['admin', 'employee', 'viewer']:
        return {'error': 'Invalid role'}, 400
    
    if username in MOCK_USERS:
        return {'error': 'User already exists'}, 409
    
    # Hash password
    password_hash, salt = current_app.auth_module.hash_password(password)
    
    # Store user (in-memory demo)
    MOCK_USERS[username] = {
        'password_hash': password_hash,
        'salt': salt,
        'email': email,
        'role': role,
        'department': department,
        'device_trust_score': 50,
        'location': 'Office'
    }
    
    current_app.users_db[username] = {
        'username': username,
        'email': email,
        'role': role,
        'department': department,
        'device_trust_score': 50,
        'location': 'Office',
        'created_at': datetime.now().isoformat()
    }
    
    return {
        'message': 'User registered successfully',
        'user': {
            'username': username,
            'email': email,
            'role': role,
            'department': department
        }
    }, 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User login endpoint.
    Validates credentials and returns JWT token.
    """
    data = request.get_json()
    
    if not data or not all(k in data for k in ['username', 'password']):
        return {'error': 'Missing username or password'}, 400
    
    username = data['username']
    password = data['password']
    device_trust_score = data.get('device_trust_score', 50)
    location = data.get('location', 'Office')
    
    # Check if user exists
    if username not in MOCK_USERS:
        return {'error': 'Invalid credentials'}, 401
    
    user_data = MOCK_USERS[username]
    
    # Verify password with authentication module
    is_valid, message = current_app.auth_module.validate_credentials(
        password,
        user_data['password_hash'],
        user_data['salt'],
        username
    )
    
    if not is_valid:
        return {'error': message}, 401
    
    # Update user context
    user_data['device_trust_score'] = device_trust_score
    user_data['location'] = location
    user_data['last_login'] = datetime.now().isoformat()
    
    # Generate session token
    token = generate_token(username)
    current_app.active_sessions[username] = token
    
    # Store/update user in app context (without sensitive data)
    current_app.users_db[username] = {
        'username': username,
        'email': user_data['email'],
        'role': user_data['role'],
        'department': user_data['department'],
        'device_trust_score': device_trust_score,
        'location': location,
        'last_login': user_data['last_login']
    }
    
    # Record access for risk scoring
    current_app.risk_engine.record_access(username, 'LOGIN')
    
    return {
        'message': 'Login successful',
        'token': token,
        'user': {
            'username': username,
            'email': user_data['email'],
            'role': user_data['role'],
            'department': user_data['department'],
            'device_trust_score': device_trust_score,
            'location': location
        }
    }, 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    User logout endpoint.
    Invalidates the session token.
    """
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not token:
        return {'error': 'No token provided'}, 400
    
    payload = verify_token(token)
    if not payload:
        return {'error': 'Invalid token'}, 401
    
    user_id = payload.get('user_id')
    if user_id in current_app.active_sessions:
        del current_app.active_sessions[user_id]
    
    return {'message': 'Logout successful'}, 200

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token_endpoint():
    """
    Verify if a token is valid and return user data.
    """
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not token:
        return {'error': 'No token provided'}, 400
    
    payload = verify_token(token)
    if not payload:
        return {'error': 'Invalid or expired token'}, 401
    
    user_id = payload.get('user_id')
    user_data = current_app.users_db.get(user_id, {})
    
    return {
        'message': 'Token is valid',
        'user_id': user_id,
        'user': {
            'username': user_id,
            'email': user_data.get('email', ''),
            'role': user_data.get('role', 'viewer'),
            'department': user_data.get('department', ''),
            'device_trust_score': user_data.get('device_trust_score', 50),
            'location': user_data.get('location', 'Office')
        }
    }, 200

@auth_bp.route('/users', methods=['GET'])
def get_users():
    """
    Get list of all users (for demo purposes).
    """
    users = []
    for username, data in MOCK_USERS.items():
        users.append({
            'username': username,
            'email': data['email'],
            'role': data['role'],
            'department': data['department'],
            'device_trust_score': data.get('device_trust_score', 50),
            'location': data.get('location', 'Office')
        })
    
    return {'users': users}, 200
