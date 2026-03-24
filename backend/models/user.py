"""
User model for Zero Trust Framework
"""

class User:
    def __init__(self, user_id, username, password_hash, email, role, department, device_trust_score=50, location='Office'):
        self.user_id = user_id
        self.username = username
        self.password_hash = password_hash
        self.email = email
        self.role = role  # admin, employee, viewer
        self.department = department  # IT, HR, Finance, etc.
        self.device_trust_score = device_trust_score  # 0-100
        self.location = location  # Office, Remote, Mobile
        self.created_at = None
        self.last_login = None
        self.is_active = True

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'department': self.department,
            'device_trust_score': self.device_trust_score,
            'location': self.location,
            'is_active': self.is_active,
            'created_at': self.created_at,
            'last_login': self.last_login
        }

class Resource:
    def __init__(self, resource_id, name, resource_type, required_role, sensitivity_level=1, required_departments=None):
        self.resource_id = resource_id
        self.name = name
        self.resource_type = resource_type  # file, database, api, etc.
        self.required_role = required_role
        self.sensitivity_level = sensitivity_level  # 1-5 (5 is highest)
        self.required_departments = required_departments or []
        self.min_device_trust = 30
        self.allowed_locations = ['Office', 'Remote', 'Mobile']

    def to_dict(self):
        return {
            'resource_id': self.resource_id,
            'name': self.name,
            'resource_type': self.resource_type,
            'required_role': self.required_role,
            'sensitivity_level': self.sensitivity_level,
            'required_departments': self.required_departments,
            'min_device_trust': self.min_device_trust,
            'allowed_locations': self.allowed_locations
        }
