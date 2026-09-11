"""Local embedding service powered by sentence-transformers."""

from typing import List
from sentence_transformers import SentenceTransformer


class Embedder:
    """Embedder class wrapping SentenceTransformer."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._model = None

    @property
    def model(self) -> SentenceTransformer:
        """Lazy load model to avoid blocking on startup until needed."""
        if self._model is None:
            self._model = SentenceTransformer(self.model_name)
        return self._model

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Compute embeddings for a batch of text chunks.

        Args:
            texts: List of text chunks.

        Returns:
            List of embedding vectors (float lists).
        """
        if not texts:
            return []
        embeddings = self.model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        return embeddings.tolist()

    def embed_query(self, query: str) -> List[float]:
        """Compute embedding for a single search query.

        Args:
            query: Query string.

        Returns:
            Embedding vector as list of floats.
        """
        embedding = self.model.encode(query, convert_to_numpy=True)
        return embedding.tolist()
