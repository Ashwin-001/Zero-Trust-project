"""
MongoDB persistence layer for academic demo.

Provides helper functions to initialize the database and perform
CRUD operations for users, resources, and audit blocks.

Falls back to in-memory storage when MongoDB is not available.
"""

import os
from typing import Dict, List

# ---------------------------------------------------------------------------
# In-memory fallback store
# ---------------------------------------------------------------------------
_USE_MEMORY = False
_memory_store: Dict[str, List[dict]] = {
    "users": [],
    "resources": [],
    "audit_blocks": [],
    "ml_events": [],
    "sessions": [],
    "session_events": [],
}


def _init_mongo():
    """Try to connect to MongoDB. Return (client, db) or (None, None)."""
    try:
        from pymongo import MongoClient
        uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        client = MongoClient(uri, serverSelectionTimeoutMS=3000)
        # Force a quick check to see if server is reachable
        client.admin.command("ping")
        db_name = os.getenv("MONGO_DB_NAME", "zero_trust")
        return client, client[db_name]
    except Exception:
        return None, None


_mongo_client, _mongo_db = _init_mongo()

if _mongo_db is None:
    _USE_MEMORY = True
    print("[db] MongoDB not available — using in-memory storage (demo mode)")
else:
    print("[db] Connected to MongoDB successfully")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_db():
    return _mongo_db


def init_db():
    """Initialize MongoDB collections and indexes (no-op for in-memory)."""
    if _USE_MEMORY:
        return

    from pymongo import ASCENDING
    from pymongo.errors import OperationFailure

    db = _get_db()

    def _safe_create_index(collection_name: str, keys, **kwargs):
        coll = db[collection_name]
        try:
            coll.create_index(keys, **kwargs)
        except OperationFailure as exc:
            if getattr(exc, "code", None) == 86 or "IndexKeySpecsConflict" in str(exc):
                return
            raise

    _safe_create_index("users", [("user_id", ASCENDING)], unique=True)
    _safe_create_index("resources", [("resource_id", ASCENDING)], unique=True)
    _safe_create_index("audit_blocks", [("block_id", ASCENDING)], unique=True)


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

def upsert_user(user: dict):
    """Insert or update a user record."""
    if _USE_MEMORY:
        store = _memory_store["users"]
        for i, u in enumerate(store):
            if u.get("user_id") == user.get("user_id"):
                store[i] = {**u, **user}
                return
        store.append(dict(user))
        return

    db = _get_db()
    db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": user},
        upsert=True,
    )


def load_users() -> Dict[str, dict]:
    """Load all users into a simple dictionary keyed by user_id."""
    if _USE_MEMORY:
        users: Dict[str, dict] = {}
        for doc in _memory_store["users"]:
            uid = doc.get("user_id")
            if not uid:
                continue
            users[uid] = {
                "role": doc.get("role"),
                "department": doc.get("department"),
                "device_trust_score": doc.get("device_trust_score"),
                "location": doc.get("location"),
            }
        return users

    db = _get_db()
    users_cursor = db.users.find({})
    users = {}
    for doc in users_cursor:
        uid = doc.get("user_id")
        if not uid:
            continue
        users[uid] = {
            "role": doc.get("role"),
            "department": doc.get("department"),
            "device_trust_score": doc.get("device_trust_score"),
            "location": doc.get("location"),
        }
    return users


# ---------------------------------------------------------------------------
# Resources
# ---------------------------------------------------------------------------

def upsert_resource(resource_id: str, data: dict):
    """Insert or update a resource record."""
    payload = {
        "resource_id": resource_id,
        "name": data.get("name"),
        "resource_type": data.get("resource_type"),
        "sensitivity_level": data.get("sensitivity_level"),
        "required_role": data.get("required_role"),
        "required_departments": data.get("required_departments", []),
        "min_device_trust": data.get("min_device_trust"),
        "allowed_locations": data.get("allowed_locations", []),
    }

    if _USE_MEMORY:
        store = _memory_store["resources"]
        for i, r in enumerate(store):
            if r.get("resource_id") == resource_id:
                store[i] = payload
                return
        store.append(payload)
        return

    db = _get_db()
    db.resources.update_one(
        {"resource_id": resource_id},
        {"$set": payload},
        upsert=True,
    )


def load_resources() -> Dict[str, dict]:
    """Load all resources into a dictionary keyed by resource_id."""
    if _USE_MEMORY:
        resources: Dict[str, dict] = {}
        for doc in _memory_store["resources"]:
            rid = doc.get("resource_id")
            if not rid:
                continue
            resources[rid] = {
                "name": doc.get("name"),
                "resource_type": doc.get("resource_type"),
                "sensitivity_level": doc.get("sensitivity_level"),
                "required_role": doc.get("required_role"),
                "required_departments": doc.get("required_departments", []) or [],
                "min_device_trust": doc.get("min_device_trust"),
                "allowed_locations": doc.get("allowed_locations", []) or [],
            }
        return resources

    db = _get_db()
    cursor = db.resources.find({})
    resources = {}
    for doc in cursor:
        rid = doc.get("resource_id")
        if not rid:
            continue
        resources[rid] = {
            "name": doc.get("name"),
            "resource_type": doc.get("resource_type"),
            "sensitivity_level": doc.get("sensitivity_level"),
            "required_role": doc.get("required_role"),
            "required_departments": doc.get("required_departments", []) or [],
            "min_device_trust": doc.get("min_device_trust"),
            "allowed_locations": doc.get("allowed_locations", []) or [],
        }
    return resources


# ---------------------------------------------------------------------------
# Audit blocks
# ---------------------------------------------------------------------------

def insert_audit_block(block_dict: dict):
    """Persist an audit block created by BlockchainAuditLog."""
    if _USE_MEMORY:
        store = _memory_store["audit_blocks"]
        for i, b in enumerate(store):
            if b.get("block_id") == block_dict.get("block_id"):
                store[i] = block_dict
                return
        store.append(dict(block_dict))
        return

    db = _get_db()
    db.audit_blocks.update_one(
        {"block_id": block_dict.get("block_id")},
        {"$set": block_dict},
        upsert=True,
    )


def load_audit_blocks() -> List[dict]:
    """Load all audit blocks ordered by block_id."""
    if _USE_MEMORY:
        return sorted(
            _memory_store["audit_blocks"],
            key=lambda b: b.get("block_id", 0),
        )

    from pymongo import ASCENDING
    db = _get_db()
    cursor = db.audit_blocks.find({}).sort("block_id", ASCENDING)
    return [dict(doc) for doc in cursor]


# ---------------------------------------------------------------------------
# ML events
# ---------------------------------------------------------------------------

def insert_ml_event(event: dict):
    """Persist a context/decision snapshot for ML training."""
    if _USE_MEMORY:
        _memory_store["ml_events"].append(dict(event))
        return

    db = _get_db()
    db.ml_events.insert_one(event)


def load_ml_events() -> List[dict]:
    """Load all ML events."""
    if _USE_MEMORY:
        return list(_memory_store["ml_events"])

    db = _get_db()
    cursor = db.ml_events.find({})
    return [dict(doc) for doc in cursor]


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------

def upsert_session(session: dict):
    """Insert or update a session record for continuous verification."""
    if _USE_MEMORY:
        store = _memory_store["sessions"]
        for i, s in enumerate(store):
            if s.get("session_id") == session.get("session_id"):
                store[i] = {**s, **session}
                return
        store.append(dict(session))
        return

    db = _get_db()
    db.sessions.update_one(
        {"session_id": session["session_id"]},
        {"$set": session},
        upsert=True,
    )


def load_active_sessions() -> List[dict]:
    """Load all sessions with ACTIVE status."""
    if _USE_MEMORY:
        return [
            dict(s) for s in _memory_store["sessions"]
            if s.get("status") == "ACTIVE"
        ]

    db = _get_db()
    cursor = db.sessions.find({"status": "ACTIVE"})
    return [dict(doc) for doc in cursor]


def insert_session_event(event: dict):
    """Persist a re-evaluation event for audit trail."""
    if _USE_MEMORY:
        _memory_store["session_events"].append(dict(event))
        return

    db = _get_db()
    db.session_events.insert_one(event)