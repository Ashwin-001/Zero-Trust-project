"""
Cryptographic demonstration routes.

Provides:
- Schnorr Zero-Knowledge Proof interactive protocol
- Merkle Tree verification for audit chain
- Non-interactive ZKP (Fiat-Shamir)
"""

from flask import Blueprint, request, jsonify, current_app
from modules.zkp_schnorr import SchnorrZKP, MerkleTree
from middleware.auth import require_auth
import json

zkp_bp = Blueprint("zkp", __name__)

# Global ZKP instance and session store for interactive proofs
_zkp = SchnorrZKP()
_zkp_sessions = {}  # session_id -> {x, y, r, R, c, ...}


@zkp_bp.route("/parameters", methods=["GET"])
def get_parameters():
    """Get the public cryptographic parameters used in the ZKP system."""
    return jsonify({
        "parameters": _zkp.get_parameters(),
        "description": {
            "p": "Safe prime (modulus)",
            "q": "Subgroup order ((p-1)/2)",
            "g": "Generator of subgroup",
        },
        "protocol": "Schnorr Identification Protocol",
        "security_basis": "Discrete Logarithm Problem",
    }), 200


@zkp_bp.route("/keygen", methods=["POST"])
def generate_keys():
    """
    Generate a new keypair for ZKP demonstration.
    Returns private key (for prover) and public key (for verifier).
    """
    x, y = _zkp.generate_keypair()
    return jsonify({
        "private_key": x,
        "public_key": y,
        "explanation": f"y = g^x mod p = {_zkp.G}^{x} mod {_zkp.P} = {y}",
    }), 200


@zkp_bp.route("/prove/interactive", methods=["POST"])
def interactive_prove():
    """
    Execute the full interactive Schnorr ZKP protocol in one call.
    Shows all 4 steps with intermediate values for educational purposes.
    
    Request JSON:
    {
        "private_key": <int>,   (optional - generates new if not provided)
        "public_key": <int>     (optional - computed from private_key)
    }
    """
    data = request.get_json() or {}
    
    # Get or generate keypair
    if "private_key" in data:
        x = int(data["private_key"])
        y = pow(_zkp.G, x, _zkp.P)
    else:
        x, y = _zkp.generate_keypair()

    # Step 1: Prover commits
    r, R = _zkp.prover_commit()
    
    # Step 2: Verifier challenges
    c = _zkp.verifier_challenge()
    
    # Step 3: Prover responds
    s = _zkp.prover_respond(r, c, x)
    
    # Step 4: Verifier checks
    lhs = pow(_zkp.G, s, _zkp.P)
    rhs = (R * pow(y, c, _zkp.P)) % _zkp.P
    is_valid = _zkp.verify(R, c, s, y)

    return jsonify({
        "protocol": "Schnorr Interactive ZKP",
        "parameters": {"p": _zkp.P, "q": _zkp.Q, "g": _zkp.G},
        "keys": {
            "private_key_x": x,
            "public_key_y": y,
            "key_relation": f"y = g^x mod p = {_zkp.G}^{x} mod {_zkp.P} = {y}",
        },
        "steps": {
            "step1_commitment": {
                "description": "Prover picks random r and computes R = g^r mod p",
                "r_nonce": r,
                "R_commitment": R,
                "formula": f"R = {_zkp.G}^{r} mod {_zkp.P} = {R}",
            },
            "step2_challenge": {
                "description": "Verifier sends random challenge c",
                "c_challenge": c,
            },
            "step3_response": {
                "description": "Prover computes s = (r + c*x) mod q",
                "s_response": s,
                "formula": f"s = ({r} + {c}*{x}) mod {_zkp.Q} = {s}",
                "note": "Secret key x is used but NEVER transmitted!",
            },
            "step4_verification": {
                "description": "Verifier checks g^s == R * y^c (mod p)",
                "lhs": f"g^s mod p = {_zkp.G}^{s} mod {_zkp.P} = {lhs}",
                "rhs": f"R * y^c mod p = {R} * {y}^{c} mod {_zkp.P} = {rhs}",
                "match": lhs == rhs,
                "verified": is_valid,
            },
        },
        "security_properties": {
            "zero_knowledge": "Verifier learns nothing about x (the secret key)",
            "soundness": "A prover who doesn't know x cannot fool the verifier",
            "completeness": "An honest prover always convinces the verifier",
        },
    }), 200


@zkp_bp.route("/prove/non-interactive", methods=["POST"])
def non_interactive_prove():
    """
    Non-interactive ZKP using Fiat-Shamir heuristic.
    Challenge is derived from hash instead of from verifier.
    
    Request JSON:
    {
        "private_key": <int>,
        "message": "optional message to bind to proof"
    }
    """
    data = request.get_json() or {}
    
    if "private_key" not in data:
        return jsonify({"error": "private_key is required"}), 400
    
    x = int(data["private_key"])
    y = pow(_zkp.G, x, _zkp.P)
    message = data.get("message", "")
    
    proof = _zkp.non_interactive_prove(x, y, message)
    
    return jsonify({
        "protocol": "Schnorr Non-Interactive ZKP (Fiat-Shamir)",
        "public_key": y,
        "proof": proof,
        "explanation": "Challenge derived from SHA-256 hash of (g, p, y, R, message) — no verifier interaction needed",
    }), 200


@zkp_bp.route("/verify/non-interactive", methods=["POST"])
def non_interactive_verify():
    """
    Verify a non-interactive ZKP proof.
    
    Request JSON:
    {
        "public_key": <int>,
        "proof": { "R": <int>, "c": <int>, "s": <int>, "message": "..." }
    }
    """
    data = request.get_json() or {}
    
    if "public_key" not in data or "proof" not in data:
        return jsonify({"error": "public_key and proof are required"}), 400
    
    y = int(data["public_key"])
    proof = data["proof"]
    
    is_valid = _zkp.non_interactive_verify(proof, y)
    
    return jsonify({
        "verified": is_valid,
        "public_key": y,
        "message": "Proof verified without any interaction with the prover" if is_valid else "Proof verification failed",
    }), 200


@zkp_bp.route("/merkle/tree", methods=["GET"])
@require_auth
def get_merkle_tree(token_payload=None):
    """
    Build and return the Merkle tree for the current audit chain.
    Shows tree structure and root hash.
    """
    blocks = current_app.audit_log.chain[1:]  # Skip genesis
    
    if not blocks:
        return jsonify({"message": "No audit blocks to build tree from", "tree": None}), 200
    
    block_data = [b.to_dict() for b in blocks]
    tree = MerkleTree(block_data)
    
    viz = tree.get_tree_visualization()
    
    return jsonify({
        "merkle_root": tree.root,
        "total_leaves": tree.data_count,
        "tree_depth": viz["levels"],
        "tree_layers": viz["tree_layers"],
        "description": "Each leaf is SHA-256 hash of an audit block. Parent nodes hash their children together up to the root.",
    }), 200


@zkp_bp.route("/merkle/proof/<int:block_index>", methods=["GET"])
@require_auth
def get_merkle_proof(block_index, token_payload=None):
    """
    Get the Merkle proof for a specific audit block.
    Allows O(log n) verification of a single block's inclusion.
    """
    blocks = current_app.audit_log.chain[1:]
    
    if not blocks:
        return jsonify({"error": "No audit blocks"}), 400
    
    if block_index < 0 or block_index >= len(blocks):
        return jsonify({"error": f"Block index must be 0-{len(blocks)-1}"}), 400
    
    block_data = [b.to_dict() for b in blocks]
    tree = MerkleTree(block_data)
    
    proof = tree.get_proof(block_index)
    leaf_hash = tree.leaves[block_index]
    is_valid = tree.verify_proof(leaf_hash, proof)
    
    return jsonify({
        "block_index": block_index,
        "block_data": block_data[block_index],
        "leaf_hash": leaf_hash,
        "merkle_root": tree.root,
        "proof_path": proof,
        "proof_length": len(proof),
        "verified": is_valid,
        "complexity": f"O(log2({tree.data_count})) = O({len(proof)}) hash computations",
        "description": "This proof allows verifying this single block belongs to the tree without checking all blocks.",
    }), 200


# Keep backwards-compatible old endpoints
@zkp_bp.route("/challenge", methods=["POST"])
def generate_challenge():
    """Legacy challenge endpoint (kept for backwards compatibility)."""
    data = request.get_json() or {}
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    challenge = current_app.auth_module.generate_challenge(user_id)
    return jsonify({"user_id": user_id, "challenge": challenge}), 200


@zkp_bp.route("/verify", methods=["POST"])
def verify_challenge():
    """Legacy verify endpoint (kept for backwards compatibility)."""
    data = request.get_json() or {}
    user_id = data.get("user_id")
    response = data.get("response")
    correct_response = data.get("correct_response")
    if not all([user_id, response, correct_response]):
        return jsonify({"error": "user_id, response, and correct_response are required"}), 400
    is_valid = current_app.auth_module.verify_challenge_response(user_id, response, correct_response)
    return jsonify({"user_id": user_id, "valid": is_valid}), 200