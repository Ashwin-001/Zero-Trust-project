import numpy as np
from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)

class RAGEngine:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        """
        Custom RAG Engine from scratch.
        Uses SentenceTransformers for local CPU-efficient embeddings.
        """
        logger.info(f"Initializing RAGEngine with model: {model_name}")
        self.model_name = model_name
        self.model = None
        self.documents = []  # List of dicts: {'text': ..., 'metadata': ...}
        self.embeddings = [] # List of np.arrays

    def _get_model(self):
        if self.model is None:
            logger.info(f"Loading RAGEngine model: {self.model_name}")
            try:
                self.model = SentenceTransformer(self.model_name)
            except Exception as e:
                logger.error(f"Failed to load RAG model: {e}")
                # Fallback to a dummy model or error out gracefully?
                # For now just raise to let the caller handle it or retry
                raise e
        return self.model

    def ingest(self, text, metadata=None):
        """
        Encodes text into a vector and stores it in memory.
        """
        if not text or not isinstance(text, str):
            return
            
        print(f"[RAG ENGINE] Phase 2: Indexing local document...")
        try:
             embedding = self._get_model().encode(text)
             self.documents.append({'text': text, 'metadata': metadata or {}})
             self.embeddings.append(embedding)
        except Exception:
             pass

    def search(self, query, k=3):
        """
        Performs Cosine Similarity search from scratch using numpy.
        """
        if not self.embeddings or not query:
            return []

        print(f"[RAG ENGINE] Phase 3: Vector search for '{query[:30]}...'")
        try:
            query_vec = self._get_model().encode(query)
        except:
            return []
        
        # Convert list of embeddings to matrix
        matrix = np.array(self.embeddings)
        
        # Cosine Similarity: (A . B) / (||A|| * ||B||)
        # Dot product
        scores = np.dot(matrix, query_vec)
        
        # Normalize by magnitudes
        print("[RAG ENGINE] Calculating Similarity Scores...")
        norms = np.linalg.norm(matrix, axis=1) * np.linalg.norm(query_vec)
        scores = scores / (norms + 1e-9) # Avoid div by zero
        
        # Get top K indices
        top_k_idx = np.argsort(scores)[-k:][::-1]
        
        results = []
        for idx in top_k_idx:
            results.append({
                'content': self.documents[idx]['text'],
                'metadata': self.documents[idx]['metadata'],
                'score': float(scores[idx])
            })
            
        print(f"[RAG ENGINE] Retrieval complete. Found {len(results)} context nodes.")
        return results

    def clear(self):
        self.documents = []
        self.embeddings = []
