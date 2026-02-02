import time
import psutil # You might need to add this to requirements if not present, but for now I'll use standard lib or mock if missing. 
# actually psutil is standard for this. If not available, I'll mock close approximations.
import datetime
import random

class MetricsService:
    def __init__(self):
        self.start_time = time.time()
        self.request_count = 0
        self.error_count = 0
        self.blocked_count = 0
        self.device_checks = 0
        self.logs_generated = 0
        
    def get_system_metrics(self):
        # Simulation of complex system counters
        uptime = int(time.time() - self.start_time)
        
        # Increment counters for simulation effect
        self.device_checks += random.randint(1, 10)
        self.logs_generated += random.randint(0, 2)
        if random.random() > 0.9:
            self.blocked_count += 1
            
        return {
            "frontend_metrics": {
                "performance": {
                    "page_load_time": f"{random.randint(120, 350)}ms",
                    "api_response_time": f"{int(random.uniform(20, 150))}ms",
                    "device_check_latency": f"{random.randint(450, 550)}ms",
                    "dashboard_refresh_time": "2.0s"
                },
                "reliability": {
                    "failed_api_requests": self.error_count + random.randint(0, 5),
                    "ui_errors": random.randint(0, 2),
                    "session_timeout_count": random.randint(0, 3)
                },
                "device_monitoring": {
                    "checks_per_sec": f"{random.randint(2, 8)}/s",
                    "success_vs_failed": f"{random.randint(200, 300)} / {random.randint(0, 5)}",
                    "trust_status": "TRUSTED",
                    "trust_score": f"{random.randint(92, 100)}/100"
                },
                "security": {
                    "login_success_vs_fail": f"{random.randint(50, 100)} / {random.randint(0, 2)}",
                    "access_granted": random.randint(100, 500),
                    "access_denied": self.blocked_count + random.randint(5, 20),
                    "antivirus_off_alerts": random.randint(0, 1),
                    "ip_geo_mismatch": random.randint(0, 3)
                }
            },
            "backend_metrics": {
                "performance": {
                    "api_response_time": f"{int(random.uniform(5, 60))}ms",
                    "requests_per_sec": int(random.uniform(80, 250)),
                    "device_checks_processed_sec": int(random.uniform(50, 120)),
                    "avg_verification_time": f"{int(random.uniform(15, 45))}ms",
                    "db_query_time": f"{random.randint(2, 12)}ms",
                    "cpu_usage": f"{int(random.uniform(15, 60))}%",
                    "memory_usage": f"{int(random.uniform(300, 800))}MB"
                },
                "reliability": {
                    "uptime": str(datetime.timedelta(seconds=uptime)),
                    "error_rate": f"{random.uniform(0.01, 0.5):.3f}%",
                    "failed_validations": self.blocked_count + random.randint(2, 10),
                    "service_crashes": 0
                },
                "zero_trust_security": {
                    "total_checks": self.device_checks,
                    "ip_failures": random.randint(1, 10),
                    "antivirus_failures": random.randint(0, 5),
                    "geo_violations": random.randint(0, 8),
                    "trust_score_device": f"{random.randint(85, 99)}/100",
                    "blocked_requests": self.blocked_count,
                    "restricted_attempts": random.randint(5, 15),
                    "unauthorized_access": random.randint(0, 3),
                    "risk_score": random.randint(1, 12),
                    "logs_generated": self.logs_generated
                }
            }
        }

metrics_engine = MetricsService()
