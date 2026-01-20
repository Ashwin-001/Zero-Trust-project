import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_django.settings')
django.setup()

from core.ai_service import ai_service
from core.models import Block

def test_custom_rag():
    print("--- Starting Custom RAG Verification ---")
    
    # 1. Mock some history logs for metrics calculation
    mock_history = [
        {'user': 'admin', 'action': 'Login', 'status': 'Processed', 'risk_level': 'Low', 'details': 'Login Success'},
        {'user': 'guest', 'action': 'Access Confidential', 'status': 'Blocked', 'risk_level': 'High', 'details': 'Policy Violation'},
        {'user': 'admin', 'action': 'Transfer Funds', 'status': 'Processed', 'risk_level': 'Medium', 'details': 'Authorized'},
        {'user': 'unknown', 'action': 'Brute Force', 'status': 'Blocked', 'risk_level': 'Critical', 'details': 'Threat Detected'}
    ]
    
    # 2. Test RAG Analysis
    query = "What is our current Unauthorized Access Detection Rate (UAD Rate) and general security posture?"
    print(f"Query: {query}")
    
    print("Wait for local AI models to initialize and generate response...")
    response = ai_service.analyze_with_rag(query, mock_history)
    
    print("\n--- AI Response ---")
    print(response)
    print("-------------------\n")
    
    # 3. Verify Metrics Calculation directly
    from core.metrics import SecurityMetrics
    stats = SecurityMetrics.calculate(mock_history)
    print("Calculated Metrics:")
    for key, value in stats.items():
        print(f" - {key}: {value}")

if __name__ == "__main__":
    test_custom_rag()
