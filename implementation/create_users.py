
import os
import django # type: ignore

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_django.settings')
django.setup()

from core.models import User

def create_users():
    # Admin
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(username='admin', email='admin@example.com', password='password123', role='admin', private_key='pk_admin_secret')
        print("Created admin user (Superuser, Key: pk_admin_secret)")
    else:
        u = User.objects.get(username='admin')
        u.is_staff = True
        u.is_superuser = True
        u.private_key = 'pk_admin_secret'
        u.set_password('password123') # Ensure password is known
        u.save()
        print("Updated admin user permissions and key")


    # User
    if not User.objects.filter(username='user').exists():
        User.objects.create_user(username='user', password='password123', role='user', private_key='pk_user_secret')
        print("Created standard user (Key: pk_user_secret)")
    else:
        u = User.objects.get(username='user')
        u.private_key = 'pk_user_secret'
        u.save()
        print("Updated standard user key")

if __name__ == '__main__':
    create_users()
