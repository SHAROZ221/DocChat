"""Retriever component connecting embedder and vector store."""

from typing import List, Dict, Any
from app.services.embedder import Embedder
from app.services.vectorstore import VectorStore


class Retriever:
    """Retrieves top relevant chunks for a question."""

    def __init__(self, embedder: Embedder, vectorstore: VectorStore, top_k: int = 5):
        self.embedder = embedder
        self.vectorstore = vectorstore
        self.top_k = top_k

    def retrieve(self, query: str, top_k: int = None) -> List[Dict[str, Any]]:
        """Retrieve most similar chunks for user query.

        Args:
            query: User's question or search phrase.
            top_k: Optional override for number of chunks.

        Returns:
            List of matching chunks with metadata and similarity score.
        """
        k = top_k or self.top_k
        query_embedding = self.embedder.embed_query(query)
        return self.vectorstore.search(query_embedding, top_k=k)
