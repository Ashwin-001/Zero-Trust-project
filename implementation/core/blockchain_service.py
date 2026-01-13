import hashlib
import json
import time
import os
from django.utils import timezone
from .models import Block
from cryptography.fernet import Fernet
from pymongo import MongoClient
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives import serialization
import base64

class BlockchainService:
    def __init__(self):
        self.key = os.environ.get('BLOCKCHAIN_ENCRYPTION_KEY')
        if not self.key:
            self.key = Fernet.generate_key().decode()
        self.cipher = Fernet(self.key.encode())
        
        # Load or Generate RSA Keys for Digital Signatures
        self.private_key_path = "system_private_key.pem"
        if os.path.exists(self.private_key_path):
            with open(self.private_key_path, "rb") as key_file:
                self.private_key = serialization.load_pem_private_key(
                    key_file.read(),
                    password=None,
                )
        else:
            self.private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048,
            )
            with open(self.private_key_path, "wb") as key_file:
                key_file.write(
                    self.private_key.private_bytes(
                        encoding=serialization.Encoding.PEM,
                        format=serialization.PrivateFormat.PKCS8,
                        encryption_algorithm=serialization.NoEncryption(),
                    )
                )
        self.public_key = self.private_key.public_key()

        # MongoDB Connection
        self.mongo_uri = os.environ.get('MONGO_URI', 'mongodb://db:27017/')
        try:
            self.mongo_client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=2000)
            self.db = self.mongo_client['zero_trust_blockchain']
            self.collection = self.db['blocks']
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

    def calculate_merkle_root(self, data):
        """Simulated Merkle Root: Hash of sorted key-value pairs"""
        if isinstance(data, dict):
            # Sort items to ensure consistent hashing
            items = sorted(data.items())
            data_str = json.dumps(items)
        else:
            data_str = str(data)
        return hashlib.sha256(data_str.encode()).hexdigest()

    def sign_hash(self, block_hash):
        """Digitally sign a block hash using RSA private key"""
        signature = self.private_key.sign(
            block_hash.encode(),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return base64.b64encode(signature).decode()

    def verify_signature(self, block_hash, signature_b64):
        """Verify the RSA signature of a block"""
        try:
            signature = base64.b64decode(signature_b64)
            self.public_key.verify(
                signature,
                block_hash.encode(),
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True
        except:
            return False

    def initialize_chain(self):
        if Block.objects.count() == 0:
            self.create_genesis_block()

    def calculate_hash(self, index, previous_hash, timestamp, data, nonce, merkle_root):
        ts_val = timestamp
        if hasattr(timestamp, 'timestamp'):
            ts_val = int(timestamp.timestamp() * 1000)
        
        payload = f"{index}{previous_hash}{ts_val}{data}{nonce}{merkle_root}"
        return hashlib.sha256(payload.encode('utf-8')).hexdigest()

    def create_genesis_block(self):
        ts = int(time.time() * 1000)
        data = {"message": "Genesis Block - RSA Signed Zero Trust Ledger"}
        merkle_root = self.calculate_merkle_root(data)
        encrypted_data = self.encrypt_data(data)
        
        genesis_hash = self.calculate_hash(0, "0", ts, encrypted_data, 0, merkle_root)
        signature = self.sign_hash(genesis_hash)
        
        import datetime
        dt_timestamp = datetime.datetime.fromtimestamp(ts / 1000.0, tz=datetime.timezone.utc)
        
        block = Block.objects.create(
            index=0,
            timestamp=dt_timestamp,
            data={"payload": encrypted_data},
            previous_hash="0",
            hash=genesis_hash,
            nonce=0,
            merkle_root=merkle_root,
            signature=signature
        )
        
        if self.mongo_active:
            self.collection.insert_one({
                "index": 0,
                "timestamp": ts,
                "data": encrypted_data,
                "hash": genesis_hash,
                "previous_hash": "0",
                "nonce": 0,
                "merkle_root": merkle_root,
                "signature": signature
            })

    def get_latest_block(self):
        return Block.objects.order_by('-index').first()

    def add_block(self, data):
        self.initialize_chain() 
        previous_block = self.get_latest_block()
        index = previous_block.index + 1
        ts = int(time.time() * 1000)
        previous_hash = previous_block.hash
        
        merkle_root = self.calculate_merkle_root(data)
        encrypted_data = self.encrypt_data(data)
        
        nonce = 0
        block_hash = self.calculate_hash(index, previous_hash, ts, encrypted_data, nonce, merkle_root)
        
        # Proof of Work (Simplified for Demo)
        while not block_hash.startswith("00"):
            nonce += 1
            block_hash = self.calculate_hash(index, previous_hash, ts, encrypted_data, nonce, merkle_root)
            
        signature = self.sign_hash(block_hash)
        
        import datetime
        dt_timestamp = datetime.datetime.fromtimestamp(ts / 1000.0, tz=datetime.timezone.utc)
        
        new_block = Block.objects.create(
            index=index,
            timestamp=dt_timestamp,
            data={"payload": encrypted_data},
            previous_hash=previous_hash,
            hash=block_hash,
            nonce=nonce,
            merkle_root=merkle_root,
            signature=signature
        )

        if self.mongo_active:
            try:
                self.collection.insert_one({
                    "index": index,
                    "timestamp": ts,
                    "data": encrypted_data,
                    "hash": block_hash,
                    "previous_hash": previous_hash,
                    "nonce": nonce,
                    "merkle_root": merkle_root,
                    "signature": signature
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
            
            # 1. Verify Hash Integrity
            recaptured_hash = self.calculate_hash(
                current_block.index,
                current_block.previous_hash,
                current_block.timestamp,
                current_block.data.get('payload'),
                current_block.nonce,
                current_block.merkle_root
            )
            
            if current_block.hash != recaptured_hash:
                return {"valid": False, "error": f"Block {current_block.index} hash mismatch"}
                
            # 2. Verify Chain Link
            if current_block.previous_hash != previous_block.hash:
                return {"valid": False, "error": f"Block {current_block.index} linkage broken"}
            
            # 3. Verify Digital RSA Signature
            if not self.verify_signature(current_block.hash, current_block.signature):
                return {"valid": False, "error": f"Block {current_block.index} signature invalid"}
                
        return {"valid": True}

blockchain_service = BlockchainService()

