import hashlib
import json
import time
import os
from django.utils import timezone
from .models import Block
from cryptography.fernet import Fernet
from pymongo import MongoClient

class BlockchainService:
    def __init__(self):
        self.key = os.environ.get('BLOCKCHAIN_ENCRYPTION_KEY')
        if not self.key:
            # Fallback for development if not in .env
            self.key = Fernet.generate_key().decode()
        self.cipher = Fernet(self.key.encode())
        
        # MongoDB Connection
        self.mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
        try:
            self.mongo_client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=2000)
            self.db = self.mongo_client['zero_trust_blockchain']
            self.collection = self.db['blocks']
            # Test connection
            self.mongo_client.server_info()
            self.mongo_active = True
        except:
            self.mongo_active = False
            print("MongoDB not reachable. Blockchain will persist to SQLite only.")

        self.initialize_chain()

    def encrypt_data(self, data):
        data_json = json.dumps(data)
        encrypted_data = self.cipher.encrypt(data_json.encode())
        return encrypted_data.decode()

    def decrypt_data(self, encrypted_data):
        decrypted_json = self.cipher.decrypt(encrypted_data.encode()).decode()
        return json.loads(decrypted_json)

    def initialize_chain(self):
        if Block.objects.count() == 0:
            self.create_genesis_block()

    def calculate_hash(self, index, previous_hash, timestamp, data, nonce):
        ts_val = timestamp
        if hasattr(timestamp, 'timestamp'): # datetime object
            ts_val = int(timestamp.timestamp() * 1000)
        
        # We hash the encrypted string to ensure content integrity
        data_str = str(data) 
        payload = f"{index}{previous_hash}{ts_val}{data_str}{nonce}"
        return hashlib.sha256(payload.encode('utf-8')).hexdigest()

    def create_genesis_block(self):
        ts = int(time.time() * 1000)
        data = {"message": "Genesis Block - Zero Trust Ledger Started"}
        encrypted_data = self.encrypt_data(data)
        
        genesis_hash = self.calculate_hash(0, "0", ts, encrypted_data, 0)
        import datetime
        dt_timestamp = datetime.datetime.fromtimestamp(ts / 1000.0, tz=datetime.timezone.utc)
        
        block = Block.objects.create(
            index=0,
            timestamp=dt_timestamp,
            data={"payload": encrypted_data}, # Store encrypted in SQLite JSONField
            previous_hash="0",
            hash=genesis_hash,
            nonce=0
        )
        
        if self.mongo_active:
            self.collection.insert_one({
                "index": 0,
                "timestamp": ts,
                "data": encrypted_data,
                "hash": genesis_hash,
                "previous_hash": "0",
                "nonce": 0,
                "is_genesis": True
            })

    def get_latest_block(self):
        return Block.objects.order_by('-index').first()

    def add_block(self, data):
        self.initialize_chain() 
        
        previous_block = self.get_latest_block()
        index = previous_block.index + 1
        ts = int(time.time() * 1000)
        previous_hash = previous_block.hash
        
        # ENCRYPT DATA
        encrypted_data = self.encrypt_data(data)
        
        nonce = 0
        block_hash = self.calculate_hash(index, previous_hash, ts, encrypted_data, nonce)
        
        while not block_hash.startswith("00"):
            nonce += 1
            block_hash = self.calculate_hash(index, previous_hash, ts, encrypted_data, nonce)
            
        import datetime
        dt_timestamp = datetime.datetime.fromtimestamp(ts / 1000.0, tz=datetime.timezone.utc)
        
        new_block = Block.objects.create(
            index=index,
            timestamp=dt_timestamp,
            data={"payload": encrypted_data},
            previous_hash=previous_hash,
            hash=block_hash,
            nonce=nonce
        )

        if self.mongo_active:
            try:
                self.collection.insert_one({
                    "index": index,
                    "timestamp": ts,
                    "data": encrypted_data,
                    "hash": block_hash,
                    "previous_hash": previous_hash,
                    "nonce": nonce
                })
            except Exception as e:
                print(f"MongoDB storage failed: {e}")

        return new_block

    def is_chain_valid(self):
        chain = Block.objects.order_by('index')
        if not chain.exists():
            return {"valid": True}
            
        for i in range(1, len(chain)):
            current_block = chain[i]
            previous_block = chain[i-1]
            
            recaptured_hash = self.calculate_hash(
                current_block.index,
                current_block.previous_hash,
                current_block.timestamp,
                current_block.data.get('payload'), # Important: use the stored encrypted payload
                current_block.nonce
            )
            
            if current_block.hash != recaptured_hash:
                return {"valid": False, "error": f"Block {current_block.index} hash invalid"}
                
            if current_block.previous_hash != previous_block.hash:
                return {"valid": False, "error": f"Block {current_block.index} broken link to previous"}
                
        return {"valid": True}

blockchain_service = BlockchainService()

