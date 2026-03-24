"""
Authentication module with privacy-preserving mechanisms and Zero Knowledge Proof concepts
"""

import hashlib
import secrets
import hmac
from datetime import datetime, timedelta

class AuthenticationModule:
    """
    Implements privacy-preserving authentication inspired by ZKP concepts.
    Uses challenge-response mechanism and secure hashing.
    """
    
    def __init__(self):
        self.challenge_store = {}  # Store active challenges
        self.failed_attempts = {}  # Track failed login attempts
        self.max_attempts = 5
        self.lockout_duration = 15  # minutes
    
    def hash_password(self, password: str, salt: str = None) -> tuple:
        """
        Hash password using SHA-256 with salt.
        Returns (hashed_password, salt)
        """
        if salt is None:
            salt = secrets.token_hex(16)
        
        hashed = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000  # iterations
        )
        return hashed.hex(), salt
    
    def verify_password(self, password: str, stored_hash: str, salt: str) -> bool:
        """
        Verify password against stored hash.
        Uses constant-time comparison to prevent timing attacks.
        """
        hashed, _ = self.hash_password(password, salt)
        return hmac.compare_digest(hashed, stored_hash)
    
    def generate_challenge(self, user_id: str) -> str:
        """
        Generate a challenge for ZKP-inspired challenge-response authentication.
        In a real system, this would involve cryptographic commitments.
        """
        challenge = secrets.token_hex(32)
        self.challenge_store[user_id] = {
            'challenge': challenge,
            'created_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(minutes=5)
        }
        return challenge
    
    def verify_challenge_response(self, user_id: str, response: str, correct_response: str) -> bool:
        """
        Verify the user's response to a challenge.
        Uses constant-time comparison.
        """
        if user_id not in self.challenge_store:
            return False
        
        challenge_data = self.challenge_store[user_id]
        
        # Check if challenge has expired
        if datetime.now() > challenge_data['expires_at']:
            del self.challenge_store[user_id]
            return False
        
        # Verify response using constant-time comparison
        is_valid = hmac.compare_digest(response, correct_response)
        
        if is_valid:
            del self.challenge_store[user_id]
        
        return is_valid
    
    def check_login_attempt(self, user_id):
        """Check if user account is locked due to failed login attempts."""
        attempt_data = self.failed_attempts.get(user_id)

        if not attempt_data:
            return True, 0

        locked_at = attempt_data.get('locked_at')

        if locked_at is not None and isinstance(locked_at, datetime):
            time_passed = datetime.now() - locked_at
            lockout_duration = timedelta(minutes=self.lockout_duration)

            if time_passed < lockout_duration:
                minutes_remaining = (lockout_duration - time_passed).total_seconds() / 60
                return False, int(minutes_remaining)
            else:
                del self.failed_attempts[user_id]
                return True, 0

        if attempt_data.get('count', 0) >= self.max_attempts:
            attempt_data['locked_at'] = datetime.now()
            return False, self.lockout_duration

        return True, 0


    
    def record_failed_attempt(self, user_id: str):
        """
        Record a failed login attempt and lock account if needed.
        """
        if user_id not in self.failed_attempts:
            self.failed_attempts[user_id] = {
                'count': 0,
                'locked_at': None
            }
        
        self.failed_attempts[user_id]['count'] += 1
        
        if self.failed_attempts[user_id]['count'] >= self.max_attempts:
            self.failed_attempts[user_id]['locked_at'] = datetime.now()
    
    def record_successful_attempt(self, user_id: str):
        """
        Clear failed attempts on successful login.
        """
        if user_id in self.failed_attempts:
            del self.failed_attempts[user_id]
    
    def validate_credentials(self, password: str, stored_hash: str, salt: str, user_id: str) -> tuple:
        """
        Full credential validation with lockout checking.
        Returns (is_valid, message)
        """
        # Check lockout status
        is_allowed, lockout_minutes = self.check_login_attempt(user_id)
        if not is_allowed:
            return False, f"Account locked. Try again in {lockout_minutes} minutes."
        
        # Verify password
        if not self.verify_password(password, stored_hash, salt):
            self.record_failed_attempt(user_id)
            return False, "Invalid credentials."
        
        # Clear failed attempts
        self.record_successful_attempt(user_id)
        return True, "Authentication successful."
