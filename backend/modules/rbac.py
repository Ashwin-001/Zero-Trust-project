"""
Role-Based Access Control (RBAC) Module
Defines roles and their associated permissions
"""

class RBACModule:
    """
    Implements Role-Based Access Control with predefined roles.
    """
    
    # Define role hierarchy and permissions
    ROLES = {
        'admin': {
            'permissions': [
                'read_all_resources',
                'write_all_resources',
                'delete_all_resources',
                'view_audit_logs',
                'manage_users',
                'manage_roles'
            ],
            'hierarchy_level': 3
        },
        'employee': {
            'permissions': [
                'read_own_department_resources',
                'write_own_department_resources',
                'read_shared_resources',
                'view_own_audit_logs'
            ],
            'hierarchy_level': 2
        },
        'viewer': {
            'permissions': [
                'read_own_department_resources',
                'read_shared_resources',
                'view_own_audit_logs'
            ],
            'hierarchy_level': 1
        },
        'guest': {
            'permissions': [
                'read_public_resources'
            ],
            'hierarchy_level': 0
        }
    }
    
    def __init__(self):
        self.role_definitions = self.ROLES
    
    def get_role_permissions(self, role: str) -> list:
        """
        Retrieve all permissions for a given role.
        """
        if role not in self.role_definitions:
            return []
        return self.role_definitions[role]['permissions']
    
    def has_permission(self, role: str, permission: str) -> bool:
        """
        Check if a role has a specific permission.
        """
        permissions = self.get_role_permissions(role)
        return permission in permissions
    
    def evaluate_rbac(self, user_role: str, required_permission: str) -> tuple:
        """
        Evaluate if user's role grants required permission.
        Returns (is_allowed, reason)
        """
        if user_role not in self.role_definitions:
            return False, f"Unknown role: {user_role}"
        
        if self.has_permission(user_role, required_permission):
            return True, f"Role '{user_role}' has permission '{required_permission}'"
        
        return False, f"Role '{user_role}' lacks permission '{required_permission}'"
    
    def get_role_hierarchy_level(self, role: str) -> int:
        """
        Get the hierarchy level of a role (higher = more privileged).
        """
        if role not in self.role_definitions:
            return -1
        return self.role_definitions[role]['hierarchy_level']
    
    def is_role_superior(self, role1: str, role2: str) -> bool:
        """
        Check if role1 is superior to role2 in hierarchy.
        """
        level1 = self.get_role_hierarchy_level(role1)
        level2 = self.get_role_hierarchy_level(role2)
        return level1 > level2
    
    def add_custom_role(self, role_name: str, permissions: list, hierarchy_level: int):
        """
        Add a custom role (for academic extensibility).
        """
        self.role_definitions[role_name] = {
            'permissions': permissions,
            'hierarchy_level': hierarchy_level
        }
        return True
    
    def list_all_roles(self) -> dict:
        """
        List all available roles and their permissions.
        """
        return self.role_definitions
