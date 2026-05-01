"""
Schnorr Zero-Knowledge Proof Implementation.

Implements the Schnorr identification protocol which allows a prover
to demonstrate knowledge of a secret (private key) without revealing it.

Protocol Steps:
1. Prover generates random commitment R = g^r mod p
2. Verifier sends random challenge c
3. Prover computes response s = (r + c * x) mod q  (x = secret key)
4. Verifier checks: g^s ≡ R * y^c (mod p)  (y = public key = g^x mod p)

Security: Based on the discrete logarithm problem.
Zero-Knowledge: Verifier learns nothing about x beyond the fact that prover knows it.
"""

import secrets
import hashlib
import json


class SchnorrZKP:
    """
    Schnorr Zero-Knowledge Proof over a prime-order subgroup.
    
    For academic demonstration, uses small safe primes.
    Production would use elliptic curves (Ed25519).
    """

    # Safe prime parameters for demo (p = 2q + 1 where both p, q are prime)
    # These are small enough to display but large enough to demonstrate the math
    P = 7919   # Safe prime
    Q = 3959   # (P-1)/2, also prime
    G = 7      # Generator of subgroup of order Q

    def __init__(self, p=None, q=None, g=None):
        """Initialize with custom or default parameters."""
        if p: self.P = p
        if q: self.Q = q
        if g: self.G = g

    def generate_keypair(self):
        """
        Generate a (private_key, public_key) pair.
        
        private_key (x): random integer in [1, Q-1]
        public_key (y): y = g^x mod p
        """
        x = secrets.randbelow(self.Q - 2) + 1  # [1, Q-1]
        y = pow(self.G, x, self.P)
        return x, y

    def prover_commit(self):
        """
        Step 1 (Prover): Generate random nonce and compute commitment.
        
        Returns: (r, R) where r is the secret nonce and R = g^r mod p
        """
        r = secrets.randbelow(self.Q - 2) + 1
        R = pow(self.G, r, self.P)
        return r, R

    def verifier_challenge(self):
        """
        Step 2 (Verifier): Generate random challenge.
        
        Returns: c (random challenge in [1, Q-1])
        """
        return secrets.randbelow(self.Q - 2) + 1

    def prover_respond(self, r, c, x):
        """
        Step 3 (Prover): Compute response without revealing secret key.
        
        s = (r + c * x) mod q
        
        Note: The secret key x is used but never transmitted.
        """
        s = (r + c * x) % self.Q
        return s

    def verify(self, R, c, s, y):
        """
        Step 4 (Verifier): Verify the proof.
        
        Check: g^s ≡ R * y^c (mod p)
        
        Left side:  g^s mod p
        Right side: (R * y^c) mod p
        
        If they match, the prover knows the secret key without revealing it.
        """
        lhs = pow(self.G, s, self.P)
        rhs = (R * pow(y, c, self.P)) % self.P
        return lhs == rhs

    def non_interactive_prove(self, x, y, message=""):
        """
        Non-interactive variant using Fiat-Shamir heuristic.
        
        The challenge is derived from a hash of (g, y, R, message)
        instead of being sent by a verifier. This makes it non-interactive.
        """
        r, R = self.prover_commit()
        
        # Fiat-Shamir: derive challenge from hash
        hash_input = json.dumps({
            "g": self.G, "p": self.P, "y": y, "R": R, "message": message
        }, sort_keys=True)
        c_hash = hashlib.sha256(hash_input.encode()).hexdigest()
        c = int(c_hash, 16) % self.Q
        if c == 0:
            c = 1
        
        s = self.prover_respond(r, c, x)
        
        return {
            "R": R,
            "c": c,
            "s": s,
            "message": message,
        }

    def non_interactive_verify(self, proof, y):
        """
        Verify a non-interactive proof.
        """
        R = proof["R"]
        s = proof["s"]
        message = proof.get("message", "")
        
        # Recompute challenge using same hash
        hash_input = json.dumps({
            "g": self.G, "p": self.P, "y": y, "R": R, "message": message
        }, sort_keys=True)
        c_hash = hashlib.sha256(hash_input.encode()).hexdigest()
        c = int(c_hash, 16) % self.Q
        if c == 0:
            c = 1
        
        return self.verify(R, c, s, y)

    def get_parameters(self):
        """Return the public parameters for display."""
        return {"p": self.P, "q": self.Q, "g": self.G}


class MerkleTree:
    """
    Merkle Tree implementation for efficient integrity verification.
    
    Allows O(log n) verification of individual blocks without
    checking the entire chain. Provides tamper-detection that
    pinpoints exactly which block was modified.
    """

    def __init__(self, data_list):
        """
        Build a Merkle tree from a list of data items.
        Each item is hashed to form a leaf node.
        """
        self.leaves = [self._hash_leaf(item) for item in data_list]
        self.data_count = len(data_list)
        self.tree = self._build_tree()
        self.root = self.tree[-1][0] if self.tree and self.tree[-1] else None

    @staticmethod
    def _hash_leaf(data):
        """Hash a single data item (leaf node)."""
        if isinstance(data, dict):
            data_str = json.dumps(data, sort_keys=True)
        else:
            data_str = str(data)
        return hashlib.sha256(data_str.encode()).hexdigest()

    @staticmethod
    def _hash_pair(left, right):
        """Hash two child nodes to create parent node."""
        combined = f"{left}{right}"
        return hashlib.sha256(combined.encode()).hexdigest()

    def _build_tree(self):
        """Build the complete Merkle tree from leaves up to root."""
        if not self.leaves:
            return [[]]
        
        tree = [list(self.leaves)]
        current_level = list(self.leaves)
        
        while len(current_level) > 1:
            next_level = []
            for i in range(0, len(current_level), 2):
                left = current_level[i]
                right = current_level[i + 1] if i + 1 < len(current_level) else left
                next_level.append(self._hash_pair(left, right))
            tree.append(next_level)
            current_level = next_level
        
        return tree

    def get_proof(self, index):
        """
        Get the Merkle proof (authentication path) for a leaf at given index.
        
        Returns a list of (hash, direction) tuples needed to reconstruct
        the root hash from the target leaf.
        """
        if index < 0 or index >= len(self.leaves):
            return None
        
        proof = []
        current_index = index
        
        for level in range(len(self.tree) - 1):
            level_nodes = self.tree[level]
            is_right = current_index % 2 == 1
            
            if is_right:
                sibling_index = current_index - 1
            else:
                sibling_index = current_index + 1
                if sibling_index >= len(level_nodes):
                    sibling_index = current_index  # Duplicate for odd count
            
            proof.append({
                "hash": level_nodes[sibling_index],
                "direction": "left" if is_right else "right",
                "level": level,
            })
            
            current_index = current_index // 2
        
        return proof

    def verify_proof(self, leaf_hash, proof):
        """
        Verify that a leaf belongs to the tree using its proof path.
        O(log n) verification without needing the entire tree.
        """
        current = leaf_hash
        
        for step in proof:
            sibling = step["hash"]
            if step["direction"] == "right":
                current = self._hash_pair(current, sibling)
            else:
                current = self._hash_pair(sibling, current)
        
        return current == self.root

    def get_tree_visualization(self):
        """Return tree structure for frontend visualization."""
        return {
            "root": self.root,
            "levels": len(self.tree),
            "leaf_count": len(self.leaves),
            "tree_layers": [
                [h[:12] + "..." for h in level]
                for level in self.tree
            ],
        }

    def detect_tampering(self, data_list):
        """
        Compare current data against the tree to detect which items changed.
        Returns list of indices that were tampered with.
        """
        tampered = []
        for i, item in enumerate(data_list):
            if i >= len(self.leaves):
                break
            current_hash = self._hash_leaf(item)
            if current_hash != self.leaves[i]:
                tampered.append(i)
        return tampered