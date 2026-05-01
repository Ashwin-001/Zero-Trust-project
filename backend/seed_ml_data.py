import sys
import os
import random
import urllib.request
from datetime import datetime

# Add the backend directory to the path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db import insert_ml_event

def seed_data():
    users = ["admin", "alice", "bob", "charlie", "hacker"]
    departments = ["IT", "HR", "Engineering", "Sales", "Unknown"]
    locations = ["Office", "Remote", "Mobile", "Foreign"]
    resources = ["financial_db", "public_site", "employee_portal", "source_code"]
    
    events_generated = 0
    for _ in range(150):
        user = random.choice(users)
        dept = random.choice(departments)
        loc = random.choice(locations)
        last_loc = random.choice(locations)
        res = random.choice(resources)
        
        # Determine realistic scenarios for the AI to learn from
        if user == "hacker" or loc == "Foreign":
            # Malicious-looking events (Should be DENY)
            failed_attempts = random.randint(3, 10)
            trust = random.randint(0, 30)
            hour = random.choice([1, 2, 3, 22, 23])
            decision = "DENY"
        elif user == "admin" and loc == "Office":
            # Safe, normal events (Should be ALLOW)
            failed_attempts = 0
            trust = random.randint(80, 100)
            hour = random.randint(9, 17)
            decision = "ALLOW"
        else:
            # Mixed conditions
            failed_attempts = random.randint(0, 2)
            trust = random.randint(40, 90)
            hour = random.randint(6, 20)
            
            if trust < 50 or failed_attempts > 0:
                decision = "CONDITIONAL"
            else:
                decision = "ALLOW"
                
        # Force a few random denies to teach the model boundary cases
        if random.random() < 0.1:
            decision = "DENY"
            
        context = {
            "user_id": user,
            "resource_id": res,
            "failed_attempts": failed_attempts,
            "access_hour": hour,
            "device_trust_score": trust,
            "resource_sensitivity": random.randint(1, 5),
            "user_department": dept,
            "current_location": loc,
            "last_location": last_loc,
            "resource_required_departments": [dept] if random.random() > 0.5 else [],
            "timestamp": datetime.now().isoformat(),
            "decision": decision
        }
        
        insert_ml_event(context)
        events_generated += 1
        
    print(f"Successfully seeded {events_generated} ML events into the database.")
    
    # Trigger training automatically via local API
    print("Triggering ML model training endpoint...")
    req = urllib.request.Request("http://localhost:5000/api/ml/train", method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            print("Response:", response.read().decode('utf-8'))
    except Exception as e:
        print("Failed to call train API:", e)

if __name__ == "__main__":
    seed_data()
