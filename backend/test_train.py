import sys
sys.path.append('d:/All/ZeroTrust/backend')
from modules.ml_model import train_decision_model

try:
    metrics, msg = train_decision_model()
    print("SUCCESS")
    print(msg)
    print(metrics)
except Exception as e:
    import traceback
    traceback.print_exc()
