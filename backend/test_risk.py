import sys
import traceback

try:
    from modules.risk_scoring import RiskScoringEngine
    engine = RiskScoringEngine()
    context = {'failed_attempts': 5, 'device_trust_score': 0, 'resource_sensitivity': 5, 'access_hour': 3, 'user_id': 'hacker', 'resource_id': 'financial_db'}
    
    print('Context:')
    print(context)
    
    result = engine.calculate_risk_score(context)
    print('Risk Result:')
    print(result)
    
except Exception as e:
    traceback.print_exc()
