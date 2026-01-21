
import os
import django # type: ignore

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_django.settings')
django.setup()

from core.models import User

def create_users():
    users_to_create = [
        {
            'username': 'admin',
            'email': 'admin@example.com',
            'password': 'password123',
            'role': 'admin',
            'private_key': 'pk_admin_secret',
            'is_superuser': True,
            'is_staff': True
        },
        {
            'username': 'user',
            'email': 'user@example.com',
            'password': 'password123',
            'role': 'user',
            'private_key': 'pk_user_secret'
        },
        {
            'username': 'security_officer',
            'email': 'security@corp.com',
            'password': 'password123',
            'role': 'admin',
            'private_key': 'pk_security_alpha'
        },
        {
            'username': 'guest_auditor',
            'email': 'auditor@external.com',
            'password': 'password123',
            'role': 'guest',
            'private_key': 'pk_guest_delta'
        }
,
        {
            'username': 'vatson',
            'email': 'vatson@example.com',
            'password': 'myssvm@2022',
            'role': 'user',
            'private_key': 'pk_user_1_256'
        }    ]

    for user_data in users_to_create:
        username = user_data.pop('username')
        password = user_data.pop('password')
        
        user, created = User.objects.update_or_create(
            username=username,
            defaults=user_data
        )
        user.set_password(password)
        user.save()
        
        status = "Created" if created else "Updated"
        print(f"{status} user: {username} (Role: {user.role}, Key: {user.private_key})")

if __name__ == '__main__':
    create_users()
