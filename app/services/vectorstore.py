"""ChromaDB vector store wrapper for DocChat."""

import os
import uuid
from typing import List, Dict, Any
import chromadb


class VectorStore:
    """Persistent ChromaDB vector store for document chunks."""

    def __init__(self, persist_dir: str = "./chroma_db", collection_name: str = "doc_chat"):
        self.persist_dir = persist_dir
        self.collection_name = collection_name
        os.makedirs(self.persist_dir, exist_ok=True)

        self.client = chromadb.PersistentClient(path=self.persist_dir)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )

    def add_documents(
        self,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]]
    ) -> int:
        """Store chunks and their embedding vectors in ChromaDB.

        Args:
            chunks: List of chunk dicts (text, source, page, chunk_index).
            embeddings: Corresponding embedding vectors.

        Returns:
            Number of chunks added.
        """
        if not chunks or not embeddings:
            return 0

        ids: List[str] = []
        documents: List[str] = []
        metadatas: List[Dict[str, Any]] = []

        for idx, chunk in enumerate(chunks):
            # Generate deterministic or semi-unique ID
            unique_suffix = uuid.uuid4().hex[:6]
            chunk_id = f"{chunk['source']}_p{chunk['page']}_c{chunk.get('chunk_index', idx)}_{unique_suffix}"
            ids.append(chunk_id)
            documents.append(chunk["text"])
            metadatas.append({
                "source": str(chunk["source"]),
                "page": str(chunk["page"]),
                "chunk_index": int(chunk.get("chunk_index", idx)),
            })

        self.collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )
        return len(ids)

    def search(
        self,
        query_embedding: List[float],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Search for top_k most similar chunks.

        Args:
            query_embedding: Query vector.
            top_k: Number of chunks to retrieve.

        Returns:
            List of matching chunks with text, source, page, score.
        """
        count = self.collection.count()
        if count == 0:
            return []

        actual_k = min(top_k, count)
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=actual_k,
            include=["documents", "metadatas", "distances"]
        )

        hits: List[Dict[str, Any]] = []
        if not results or not results.get("ids") or not results["ids"][0]:
            return hits

        ids = results["ids"][0]
        docs = results["documents"][0]
        metas = results["metadatas"][0]
        distances = results["distances"][0]

        for i in range(len(ids)):
            # In cosine space, distance is (1 - cosine_similarity). Score = 1 - distance
            score = max(0.0, min(1.0, 1.0 - distances[i]))
            hits.append({
                "id": ids[i],
                "text": docs[i],
                "source": metas[i].get("source", "unknown"),
                "page": metas[i].get("page", "1"),
                "chunk_index": metas[i].get("chunk_index", 0),
                "score": score,
            })

        return hits

    def get_sources(self) -> List[str]:
        """Return list of distinct source document names currently stored."""
        count = self.collection.count()
        if count == 0:
            return []

        data = self.collection.get(include=["metadatas"])
        metas = data.get("metadatas", [])
        sources = set()
        for meta in metas:
            if meta and "source" in meta:
                sources.add(meta["source"])
        return sorted(list(sources))

    def get_sources_details(self) -> List[Dict[str, Any]]:
        """Return list of distinct documents with chunk counts and stats."""
        count = self.collection.count()
        if count == 0:
            return []

        data = self.collection.get(include=["metadatas"])
        metas = data.get("metadatas", [])
        stats: Dict[str, Dict[str, Any]] = {}
        for meta in metas:
            if not meta or "source" not in meta:
                continue
            src = meta["source"]
            if src not in stats:
                stats[src] = {"name": src, "chunks": 0}
            stats[src]["chunks"] += 1

        return sorted(list(stats.values()), key=lambda x: x["name"])

    def delete_by_source(self, source_name: str) -> int:
        """Delete all chunks belonging to a specific document."""
        # Find all matching IDs
        data = self.collection.get(
            where={"source": source_name},
            include=[]
        )
        ids_to_delete = data.get("ids", [])
        if ids_to_delete:
            self.collection.delete(ids=ids_to_delete)
        return len(ids_to_delete)

    def clear(self) -> None:
        """Delete and recreate the collection."""
        self.client.delete_collection(self.collection_name)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )
