"""
Blockchain-based Audit Logging Module
Implements immutable audit trail with hash chaining
"""

import hashlib
import json
from datetime import datetime

from db import insert_audit_block, load_audit_blocks

class AuditBlock:
    """
    Represents a block in the audit blockchain.
    Each block contains access decision and is linked to previous block via hash.
    """
    
    def __init__(self, block_id: int, user_id: str, resource_id: str, decision: str, 
                 risk_score: float, previous_hash: str = None, timestamp: str = None):
        self.block_id = block_id
        self.user_id = user_id
        self.resource_id = resource_id
        self.decision = decision  # ALLOW, CONDITIONAL, DENY
        self.risk_score = risk_score
        self.timestamp = timestamp or datetime.now().isoformat()
        self.previous_hash = previous_hash or "0" * 64  # Genesis block
        self.hash = None
        self.compute_hash()
    
    def compute_hash(self):
        """
        Compute SHA-256 hash of block data.
        Used for integrity verification.
        """
        block_string = json.dumps({
            'block_id': self.block_id,
            'user_id': self.user_id,
            'resource_id': self.resource_id,
            'decision': self.decision,
            'risk_score': self.risk_score,
            'timestamp': self.timestamp,
            'previous_hash': self.previous_hash
        }, sort_keys=True)
        
        self.hash = hashlib.sha256(block_string.encode()).hexdigest()
    
    def to_dict(self):
        """
        Convert block to dictionary for serialization.
        """
        return {
            'block_id': self.block_id,
            'user_id': self.user_id,
            'resource_id': self.resource_id,
            'decision': self.decision,
            'risk_score': self.risk_score,
            'timestamp': self.timestamp,
            'previous_hash': self.previous_hash,
            'hash': self.hash
        }
    
    def verify(self) -> bool:
        """
        Verify block integrity by recomputing hash.
        Non-destructive: does not modify self.hash.
        """
        block_string = json.dumps({
            'block_id': self.block_id,
            'user_id': self.user_id,
            'resource_id': self.resource_id,
            'decision': self.decision,
            'risk_score': self.risk_score,
            'timestamp': self.timestamp,
            'previous_hash': self.previous_hash
        }, sort_keys=True)
        
        recomputed = hashlib.sha256(block_string.encode()).hexdigest()
        return self.hash == recomputed


class BlockchainAuditLog:
    """
    Blockchain-based audit logging system.
    Ensures immutability and integrity of access decision logs.
    """
    
    def __init__(self):
        self.chain = []
        self.block_counter = 0
        # Attempt to rebuild chain from persisted audit_blocks table;
        # if none exist, create a fresh genesis block.
        self._load_or_initialize_chain()

    def _load_or_initialize_chain(self):
        persisted = load_audit_blocks()
        if not persisted:
            self.create_genesis_block()
            return

        # Reconstruct chain from persisted blocks
        self.chain = []
        for row in persisted:
            block = AuditBlock(
                block_id=row["block_id"],
                user_id=row["user_id"],
                resource_id=row["resource_id"],
                decision=row["decision"],
                risk_score=row["risk_score"],
                previous_hash=row["previous_hash"],
                timestamp=row["timestamp"],
            )
            # Trust the stored hash for integrity verification; overwrite with stored value.
            block.hash = row["hash"]
            self.chain.append(block)

        # Ensure there is at least a genesis block
        if not self.chain:
            self.create_genesis_block()
        # Set block_counter for the next block
        self.block_counter = self.chain[-1].block_id + 1
    
    def create_genesis_block(self):
        """
        Create the first block (genesis block) in the chain.
        """
        genesis_block = AuditBlock(
            block_id=0,
            user_id="SYSTEM",
            resource_id="GENESIS",
            decision="N/A",
            risk_score=0,
            timestamp=datetime.now().isoformat()
        )
        self.chain.append(genesis_block)
        self.block_counter = 1

        # Persist genesis block
        insert_audit_block(genesis_block.to_dict())
    
    def add_access_decision(self, user_id: str, resource_id: str, decision: str, 
                           risk_score: float) -> dict:
        """
        Add a new access decision to the blockchain.
        
        Returns: New block data
        """
        # Get previous block
        previous_block = self.chain[-1]
        
        # Create new block
        new_block = AuditBlock(
            block_id=self.block_counter,
            user_id=user_id,
            resource_id=resource_id,
            decision=decision,
            risk_score=risk_score,
            previous_hash=previous_block.hash,
            timestamp=datetime.now().isoformat()
        )
        
        # Add to chain and persist
        self.chain.append(new_block)
        self.block_counter += 1

        block_dict = new_block.to_dict()
        insert_audit_block(block_dict)
        return block_dict
    
    def verify_chain_integrity(self) -> tuple:
        """
        Verify the entire blockchain for tampering.
        Returns (is_valid, tampering_details)
        """
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            
            # Verify current block hash
            if not current_block.verify():
                return False, f"Block {i} hash mismatch (block tampering detected)"
            
            # Verify hash chain
            if current_block.previous_hash != previous_block.hash:
                return False, f"Block {i} previous hash mismatch (chain tampering detected)"
        
        return True, "Blockchain integrity verified"
    
    def get_audit_trail(self, user_id: str = None, resource_id: str = None, 
                       decision_filter: str = None) -> list:
        """
        Retrieve audit trail, optionally filtered.
        
        Parameters:
        - user_id: Optional filter by user
        - resource_id: Optional filter by resource
        - decision_filter: Optional filter by decision type
        
        Returns: List of audit blocks (excluding genesis)
        """
        trail = []
        
        for block in self.chain[1:]:  # Skip genesis block
            # Apply filters
            if user_id and block.user_id != user_id:
                continue
            if resource_id and block.resource_id != resource_id:
                continue
            if decision_filter and block.decision != decision_filter:
                continue
            
            trail.append(block.to_dict())
        
        return trail
    
    def get_user_access_history(self, user_id: str) -> list:
        """
        Get all access decisions for a specific user.
        """
        return self.get_audit_trail(user_id=user_id)
    
    def get_resource_access_log(self, resource_id: str) -> list:
        """
        Get all access requests for a specific resource.
        """
        return self.get_audit_trail(resource_id=resource_id)
    
    def get_denied_accesses(self) -> list:
        """
        Get all denied access attempts.
        """
        return self.get_audit_trail(decision_filter='DENY')
    
    def get_high_risk_accesses(self, threshold: float = 70) -> list:
        """
        Get all accesses with risk score above threshold.
        """
        high_risk = []
        for block in self.chain[1:]:
            if block.risk_score >= threshold:
                high_risk.append(block.to_dict())
        return high_risk
    
    def get_chain_statistics(self) -> dict:
        """
        Get statistics about the audit chain.
        """
        if len(self.chain) <= 1:
            return {
                'total_blocks': 0,
                'allow_count': 0,
                'conditional_count': 0,
                'deny_count': 0,
                'average_risk_score': 0
            }
        
        access_blocks = self.chain[1:]  # Exclude genesis
        allow_count = sum(1 for b in access_blocks if b.decision == 'ALLOW')
        conditional_count = sum(1 for b in access_blocks if b.decision == 'CONDITIONAL')
        deny_count = sum(1 for b in access_blocks if b.decision == 'DENY')
        avg_risk = sum(b.risk_score for b in access_blocks) / len(access_blocks)
        
        return {
            'total_blocks': len(access_blocks),
            'allow_count': allow_count,
            'conditional_count': conditional_count,
            'deny_count': deny_count,
            'average_risk_score': round(avg_risk, 2),
            'integrity_verified': self.verify_chain_integrity()[0]
        }
    
    def export_chain(self) -> list:
        """
        Export entire blockchain for backup or external verification.
        """
        return [block.to_dict() for block in self.chain]
