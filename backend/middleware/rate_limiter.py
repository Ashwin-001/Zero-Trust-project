"""
Simple in-memory rate limiter for protecting sensitive endpoints
like login from brute-force attacks.
"""

import time
import threading
from functools import wraps
from flask import request


class RateLimiter:
    """
    Token-bucket style rate limiter keyed by client IP.
    Thread-safe via a lock.
    """

    def __init__(self, max_requests: int = 5, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._store: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def _cleanup(self, key: str):
        """Remove timestamps older than the window."""
        now = time.time()
        cutoff = now - self.window_seconds
        self._store[key] = [
            ts for ts in self._store.get(key, []) if ts > cutoff
        ]

    def is_allowed(self, key: str) -> bool:
        with self._lock:
            self._cleanup(key)
            if len(self._store.get(key, [])) >= self.max_requests:
                return False
            self._store.setdefault(key, []).append(time.time())
            return True

    def remaining(self, key: str) -> int:
        with self._lock:
            self._cleanup(key)
            return max(0, self.max_requests - len(self._store.get(key, [])))


# Global limiter instances
login_limiter = RateLimiter(max_requests=10, window_seconds=60)
api_limiter = RateLimiter(max_requests=60, window_seconds=60)


def rate_limit(limiter: RateLimiter | None = None):
    """
    Decorator to apply rate limiting to a route.
    Uses client IP as the key.
    """
    _limiter = limiter or api_limiter

    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            client_ip = request.remote_addr or 'unknown'
            if not _limiter.is_allowed(client_ip):
                return {
                    'error': 'Too many requests. Please try again later.',
                    'retry_after_seconds': _limiter.window_seconds
                }, 429
            return f(*args, **kwargs)
        return wrapper
    return decorator