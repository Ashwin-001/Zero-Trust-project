import os
import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

logger = logging.getLogger(__name__)

class MongoDBConnection:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDBConnection, cls).__new__(cls)
            cls._instance.client = None
            cls._instance.db = None
            cls._instance.active = False
            cls._instance._connect()
        return cls._instance

    def _connect(self):
        # Centralized URI from .env or default to localhost
        self.uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/zerotrust')
        
        # Extract DB name from URI if possible, or use a default
        try:
            # Simple parsing: find the part after the last /
            db_name = self.uri.split('/')[-1].split('?')[0]
            if not db_name:
                db_name = 'zero_trust_matrix'
        except:
            db_name = 'zero_trust_matrix'

        logger.info(f"Attempting connection to Matrix Ledger: {self.uri}")
        
        try:
            self.client = MongoClient(self.uri, serverSelectionTimeoutMS=3000)
            # Trigger a ping to verify connection
            self.client.admin.command('ping')
            self.db = self.client[db_name]
            self.active = True
            print(f"[MONGODB] Matrix Ledger Connection Established: {db_name}")
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            self.active = False
            logger.error(f"Failed to connect to MongoDB: {e}")
            print(f"[MONGODB] SHADOW MODE: Ledger disconnected. Systems failing over to SQLite...")

    def get_collection(self, name):
        if not self.active or self.db is None:
            return None
        return self.db[name]

    def close(self):
        if self.client:
            self.client.close()
            self.active = False

# Singleton instance for the entire application
db_connection = MongoDBConnection()
