import os
import django
import random
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_django.settings')
django.setup()

from core.models import Log, User

def seed_logs():
    print("Seeding logs for ML training...")
    users = ['admin', 'user']
    actions = ['GET /api/secure/public-resource', 'GET /api/secure/confidential-resource', 'GET /api/ledger/chain']
    
    # Create 100 normal logs
    for i in range(100):
        user = random.choice(users)
        action = random.choice(actions)
        # Normal hours: 9 AM to 6 PM
        hour = random.randint(9, 18)
        ts = timezone.now().replace(hour=hour) - timedelta(days=random.randint(0, 7))
        
        Log.objects.create(
            user=user,
            action=action,
            status='Granted',
            risk_level='Low',
            device_health={'antivirus': True, 'os': 'Windows 11', 'ipReputation': 'Good'},
            timestamp=ts,
            details='Normal access pattern'
        )

    # Create 10 anomalous logs (Night time access)
    for i in range(10):
        user = random.choice(users)
        # Night hours: 1 AM to 4 AM
        hour = random.randint(1, 4)
        ts = timezone.now().replace(hour=hour) - timedelta(days=random.randint(0, 3))
        
        Log.objects.create(
            user=user,
            action='POST /api/secure/admin-panel',
            status='Denied',
            risk_level='High',
            device_health={'antivirus': False, 'os': 'Outdated', 'ipReputation': 'Bad'},
            timestamp=ts,
            details='Anomalous access attempt detected'
        )
    
    print(f"Successfully seeded {Log.objects.count()} logs.")

if __name__ == '__main__':
    seed_logs()
