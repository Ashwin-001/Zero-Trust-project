import hashlib
import json
import time
from django.utils import timezone
from .models import Block

class BlockchainService:

    def initialize_chain(self):
        if Block.objects.count() == 0:
            self.create_genesis_block()

    def calculate_hash(self, index, previous_hash, timestamp, data, nonce):
        # Timestamp should be handled consistently. 
        # If timestamp is datetime, convert to ms. If int/float, use as is.
        # The Node app seemingly used ms (Date.now()) for creation.
        
        ts_val = timestamp
        if hasattr(timestamp, 'timestamp'): # datetime object
            ts_val = int(timestamp.timestamp() * 1000)
        
        # Data serialization: compact json
        data_str = json.dumps(data, separators=(',', ':'))
        
        # Payload construction
        # In Node: index + previousHash + timestamp + JSON.stringify(data) + nonce
        # Note: In Node, if timestamp is number, it connects as string of number.
        payload = f"{index}{previous_hash}{ts_val}{data_str}{nonce}"
        
        return hashlib.sha256(payload.encode('utf-8')).hexdigest()

    def create_genesis_block(self):
        print("Creating Genesis Block...")
        ts = int(time.time() * 1000)
        data = {"message": "Genesis Block - Zero Trust Ledger Started"}
        
        # Genesis hash
        genesis_hash = self.calculate_hash(0, "0", ts, data, 0)
        
        # Create block
        # We store timestamp as datetime for DB readability, 
        # but validation must verify against the ms value implicitly or we store ms.
        # Since I can't change the past easily, let's just store the datetime corresponding to ts.
        
        dt_timestamp = timezone.datetime.fromtimestamp(ts / 1000.0, tz=timezone.utc)
        
        Block.objects.create(
            index=0,
            timestamp=dt_timestamp,
            data=data,
            previous_hash="0",
            hash=genesis_hash,
            nonce=0
        )

    def get_latest_block(self):
        return Block.objects.order_by('-index').first()

    def add_block(self, data):
        self.initialize_chain() # Ensure chain exists
        
        previous_block = self.get_latest_block()
        index = previous_block.index + 1
        ts = int(time.time() * 1000)
        previous_hash = previous_block.hash
        
        nonce = 0
        block_hash = self.calculate_hash(index, previous_hash, ts, data, nonce)
        
        # Proof of Work
        while not block_hash.startswith("00"):
            nonce += 1
            block_hash = self.calculate_hash(index, previous_hash, ts, data, nonce)
            
        dt_timestamp = timezone.datetime.fromtimestamp(ts / 1000.0, tz=timezone.utc)
        
        new_block = Block.objects.create(
            index=index,
            timestamp=dt_timestamp,
            data=data,
            previous_hash=previous_hash,
            hash=block_hash,
            nonce=nonce
        )
        return new_block

    def is_chain_valid(self):
        chain = Block.objects.order_by('index')
        if not chain.exists():
            return {"valid": True}
            
        # Iterate from 1
        for i in range(1, len(chain)):
            current_block = chain[i]
            previous_block = chain[i-1]
            
            # 1. Check hash
            # We must convert current_block.timestamp (datetime) back to ms for hash check
            recaptured_hash = self.calculate_hash(
                current_block.index,
                current_block.previous_hash,
                current_block.timestamp,
                current_block.data,
                current_block.nonce
            )
            
            if current_block.hash != recaptured_hash:
                return {"valid": False, "error": f"Block {current_block.index} hash invalid"}
                
            # 2. Check previous hash link
            if current_block.previous_hash != previous_block.hash:
                return {"valid": False, "error": f"Block {current_block.index} broken link to previous"}
                
        return {"valid": True}

blockchain_service = BlockchainService()
