import numpy as np
from sklearn.ensemble import IsolationForest
from django.utils import timezone
from .models import Log, User
import pandas as pd
import logging

logger = logging.getLogger(__name__)

class MLEngine:
    def __init__(self):
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self.is_trained = False

    def _prepare_data(self, logs):
        if not logs:
            return None
        
        data = []
        for log in logs:
            # Convert timestamp to hour of day
            hour = log.timestamp.hour
            # Map risk level to numeric
            risk_map = {'Low': 0, 'Medium': 1, 'High': 2, 'Critical': 3}
            risk_val = risk_map.get(log.risk_level, 0)
            # Map status
            status_val = 1 if log.status == 'Denied' else 0
            
            data.append([hour, risk_val, status_val])
            
        return np.array(data)

    def train(self):
        try:
            logs = Log.objects.all().order_by('-timestamp')[:1000]
            if len(logs) < 10:
                logger.info("Not enough logs to train ML model")
                return False
            
            X = self._prepare_data(logs)
            if X is not None:
                self.model.fit(X)
                self.is_trained = True
                logger.info("ML Engine: Model trained successfully")
                return True
        except Exception as e:
            logger.error(f"ML Engine: Training failed: {e}")
        return False

    def predict_anomaly(self, request_data):
        """
        request_data: {'hour': int, 'risk_level': str, 'status': str}
        Returns: risk_boost (int) - how much to increase risk score based on anomaly
        """
        if not self.is_trained:
            return 0
        
        try:
            risk_map = {'Low': 0, 'Medium': 1, 'High': 2, 'Critical': 3}
            risk_val = risk_map.get(request_data.get('risk_level', 'Low'), 0)
            status_val = 1 if request_data.get('status') == 'Denied' else 0
            hour = request_data.get('hour', timezone.now().hour)
            
            X = np.array([[hour, risk_val, status_val]])
            prediction = self.model.predict(X)
            
            # IsolationForest returns -1 for anomalies
            if prediction[0] == -1:
                return 40 # Significant boost for anomalous behavior
            return 0
        except Exception as e:
            logger.error(f"ML Engine: Prediction failed: {e}")
            return 0

ml_engine = MLEngine()
