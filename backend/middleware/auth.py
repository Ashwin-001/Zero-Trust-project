"""
Shared authentication middleware.

Provides a unified JWT token verification function and a decorator
for protecting routes, eliminating duplicated get_token_user() logic
across route modules.
"""

import functools
import jwt
from flask import request, current_app


def get_token_user(request_obj=None) -> dict | None:
    """
    Extract and verify user from JWT token in the Authorization header.

    Returns the decoded JWT payload dict, or None if the token is
    missing, malformed, expired, or otherwise invalid.
    """
    req = request_obj or request
    auth_header = req.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None

    token = auth_header.replace('Bearer ', '')

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


def require_auth(f):
    """
    Decorator that rejects requests without a valid JWT token.
    Injects `token_payload` as the first keyword argument.
    """
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        payload = get_token_user()
        if not payload:
            return {'error': 'Unauthorized'}, 401
        kwargs['token_payload'] = payload
        return f(*args, **kwargs)
    return decorated


def require_admin(f):
    """
    Decorator that requires both a valid JWT and an admin role.
    Injects `token_payload` as a keyword argument.
    """
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        payload = get_token_user()
        if not payload:
            return {'error': 'Unauthorized'}, 401
        user_id = payload.get('user_id')
        user_data = current_app.users_db.get(user_id, {})
        if user_data.get('role') != 'admin':
            return {'error': 'Admin privileges required'}, 403
        kwargs['token_payload'] = payload
        return f(*args, **kwargs)
    return decorated