"""
MongoDB persistence layer for academic demo.

Provides helper functions to initialize the database and perform
CRUD operations for users, resources, and audit blocks.
"""

import os
from typing import Dict, List

from pymongo import MongoClient, ASCENDING
from pymongo.errors import OperationFailure


def _get_client() -> MongoClient:
    uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    return MongoClient(uri)


def _get_db():
    client = _get_client()
    db_name = os.getenv("MONGO_DB_NAME", "zero_trust")
    return client[db_name]


def init_db():
    """
    Initialize MongoDB collections and indexes.
    """
    db = _get_db()

    def _safe_create_index(collection_name: str, keys, **kwargs):
        """
        Create index, ignoring IndexKeySpecsConflict if index already exists with
        compatible definition.
        """
        coll = db[collection_name]
        try:
            coll.create_index(keys, **kwargs)
        except OperationFailure as exc:
            # If an index with same name/spec already exists, ignore conflict.
            if getattr(exc, "code", None) == 86 or "IndexKeySpecsConflict" in str(exc):
                return
            raise

    _safe_create_index("users", [("user_id", ASCENDING)], unique=True)
    _safe_create_index("resources", [("resource_id", ASCENDING)], unique=True)
    _safe_create_index("audit_blocks", [("block_id", ASCENDING)], unique=True)


def upsert_user(user: dict):
    """Insert or update a user record."""
    db = _get_db()
    db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": user},
        upsert=True,
    )


def load_users() -> Dict[str, dict]:
    """Load all users into a simple dictionary keyed by user_id."""
    db = _get_db()
    users_cursor = db.users.find({})
    users: Dict[str, dict] = {}
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


def upsert_resource(resource_id: str, data: dict):
    """Insert or update a resource record."""
    db = _get_db()
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
    db.resources.update_one(
        {"resource_id": resource_id},
        {"$set": payload},
        upsert=True,
    )


def load_resources() -> Dict[str, dict]:
    """Load all resources into a dictionary keyed by resource_id."""
    db = _get_db()
    cursor = db.resources.find({})
    resources: Dict[str, dict] = {}
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


def insert_audit_block(block_dict: dict):
    """Persist an audit block created by BlockchainAuditLog."""
    db = _get_db()
    # Use block_id as unique identifier
    db.audit_blocks.update_one(
        {"block_id": block_dict.get("block_id")},
        {"$set": block_dict},
        upsert=True,
    )


def load_audit_blocks() -> List[dict]:
    """Load all audit blocks ordered by block_id."""
    db = _get_db()
    cursor = db.audit_blocks.find({}).sort("block_id", ASCENDING)
    return [dict(doc) for doc in cursor]


def insert_ml_event(event: dict):
    """Persist a context/decision snapshot for ML training."""
    db = _get_db()
    db.ml_events.insert_one(event)


def load_ml_events() -> List[dict]:
    """Load all ML events."""
    db = _get_db()
    cursor = db.ml_events.find({})
    return [dict(doc) for doc in cursor]


def upsert_session(session: dict):
    """Insert or update a session record for continuous verification."""
    db = _get_db()
    db.sessions.update_one(
        {"session_id": session["session_id"]},
        {"$set": session},
        upsert=True,
    )


def load_active_sessions() -> List[dict]:
    """Load all sessions with ACTIVE status."""
    db = _get_db()
    cursor = db.sessions.find({"status": "ACTIVE"})
    return [dict(doc) for doc in cursor]


def insert_session_event(event: dict):
    """Persist a re-evaluation event for audit trail."""
    db = _get_db()
    db.session_events.insert_one(event)


