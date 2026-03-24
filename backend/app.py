"""
Flask application initialization and global state management
"""

from flask import Flask
from flask_cors import CORS
import os
from config import config

# Initialize modules
from modules import (
    AuthenticationModule,
    RBACModule,
    ABACModule,
    RiskScoringEngine,
    DecisionEngine,
    BlockchainAuditLog,
    SessionManager
)

from db import init_db, load_users, load_resources, upsert_resource

from pathlib import Path
import json

def create_app(config_name='development'):
    """
    Application factory for Flask app.
    """
    app = Flask(__name__)
    
    # Load configuration
    config_obj = config.get(config_name, config['default'])
    app.config.from_object(config_obj)
    
    # Enable CORS
    cors_origins = app.config.get('CORS_ORIGINS', ['*'])
    if isinstance(cors_origins, str):
        cors_origins = [cors_origins]
    CORS(app, origins=cors_origins, supports_credentials=True)
    
    # Load risk/ABAC/decision profile configuration
    config_path = Path(app.root_path) / "risk_config.json"
    profile_config = None
    selected_profile_name = None
    if config_path.exists():
        with open(config_path, "r", encoding="utf-8") as f:
            all_profiles = json.load(f)
        default_profile = all_profiles.get("default_profile")
        selected_profile_name = app.config.get("RISK_PROFILE", default_profile)
        profile_config = all_profiles.get("profiles", {}).get(
            selected_profile_name or default_profile, {}
        )
    
    # Initialize modules (some depend on profile_config)
    app.auth_module = AuthenticationModule()
    app.rbac_module = RBACModule()
    app.abac_module = ABACModule(profile_config)
    app.risk_engine = RiskScoringEngine(profile_config)
    app.decision_engine = DecisionEngine(profile_config)
    app.audit_log = BlockchainAuditLog()
    app.session_manager = SessionManager()

    # Expose active profile name for introspection/metrics
    app.active_risk_profile = selected_profile_name or "balanced"
    
    # Initialize SQLite database and load persisted state
    init_db()

    # Session storage (in-memory for academic demo)
    app.active_sessions = {}  # user_id -> session_token

    # Users and resources are mirrored in-memory for fast access,
    # but persisted to SQLite for reproducible experiments.
    app.users_db = {}  # user_id -> user_object (public data only)
    app.resources_db = {}  # resource_id -> resource_object
    
    # Register blueprints
    from routes.auth_routes import auth_bp, init_users, get_users_public_data
    from routes.access_routes import access_bp, MOCK_RESOURCES
    from routes.audit_routes import audit_bp
    from routes.zkp_routes import zkp_bp
    from routes.metrics_routes import metrics_bp
    from routes.ml_routes import ml_bp
    from routes.session_routes import session_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(access_bp, url_prefix='/api/access')
    app.register_blueprint(audit_bp, url_prefix='/api/audit')
    app.register_blueprint(zkp_bp, url_prefix='/api/zkp')
    app.register_blueprint(metrics_bp, url_prefix='/api/metrics')
    app.register_blueprint(ml_bp, url_prefix='/api/ml')
    app.register_blueprint(session_bp, url_prefix='/api/session')
    
    # Seed demo data
    with app.app_context():
        # Generate proper password hashes for demo users
        init_users(app.auth_module)
        
        # Populate users_db with public user data and persist to DB
        app.users_db = get_users_public_data()
        for user_id, user in app.users_db.items():
            # Ensure user_id is part of record for persistence
            record = {
                "user_id": user_id,
                "role": user.get("role", "guest"),
                "department": user.get("department", "Unknown"),
                "device_trust_score": user.get("device_trust_score", 50),
                "location": user.get("location", "Office"),
            }
            from db import upsert_user  # local import to avoid circulars at module import time
            upsert_user(record)

        # Populate resources_db from static MOCK_RESOURCES and persist to DB
        for res_id, res_data in MOCK_RESOURCES.items():
            app.resources_db[res_id] = res_data
            upsert_resource(res_id, res_data)

        # If there are additional resources/users already in DB (from previous runs),
        # merge them into the in-memory stores so experiments are reproducible.
        persisted_users = load_users()
        app.users_db.update(persisted_users)

        persisted_resources = load_resources()
        app.resources_db.update(persisted_resources)
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {
            'status': 'healthy',
            'version': '1.0.0',
            'modules': {
                'authentication': 'active',
                'rbac': 'active',
                'abac': 'active',
                'risk_scoring': 'active',
                'decision_engine': 'active',
                'blockchain_audit': 'active',
                'session_manager': 'active'
            }
        }, 200
    
    return app

if __name__ == '__main__':
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    print("\n" + "=" * 60)
    print("  Zero Trust Security Framework — Backend Server")
    print("=" * 60)
    print(f"  Server running at:  http://localhost:5000")
    print(f"  Health check:       http://localhost:5000/api/health")
    print(f"  CORS origins:       http://localhost:3000")
    print("=" * 60 + "\n")
    app.run(debug=app.config['DEBUG'], host='0.0.0.0', port=5000)
