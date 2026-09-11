"""Tests for embedder, ChromaDB vector store, and retriever."""

import tempfile
import shutil
import pytest
from app.services.embedder import Embedder
from app.services.vectorstore import VectorStore
from app.services.retriever import Retriever


@pytest.fixture(scope="module")
def shared_embedder():
    return Embedder(model_name="all-MiniLM-L6-v2")


@pytest.fixture
def temp_vectorstore():
    temp_dir = tempfile.mkdtemp()
    store = VectorStore(persist_dir=temp_dir, collection_name="test_collection")
    yield store
    shutil.rmtree(temp_dir, ignore_errors=True)


def test_embedder_and_retriever(shared_embedder, temp_vectorstore):
    chunks = [
        {"text": "Python is a popular programming language created by Guido van Rossum.", "source": "python.txt", "page": 1, "chunk_index": 0},
        {"text": "Photosynthesis is the process by which green plants make food using sunlight.", "source": "biology.txt", "page": 1, "chunk_index": 0},
        {"text": "Gravitational waves are ripples in spacetime caused by massive accelerating bodies.", "source": "physics.txt", "page": 1, "chunk_index": 0},
    ]

    texts = [c["text"] for c in chunks]
    embeddings = shared_embedder.embed_documents(texts)
    assert len(embeddings) == 3

    temp_vectorstore.add_documents(chunks, embeddings)
    sources = temp_vectorstore.get_sources()
    assert len(sources) == 3
    assert "python.txt" in sources

    retriever = Retriever(embedder=shared_embedder, vectorstore=temp_vectorstore, top_k=1)
    results = retriever.retrieve("Who created Python?")

    assert len(results) >= 1
    assert "Guido van Rossum" in results[0]["text"]
    assert results[0]["source"] == "python.txt"


def test_delete_by_source(shared_embedder, temp_vectorstore):
    chunks = [
        {"text": "Doc Alpha content.", "source": "alpha.txt", "page": 1, "chunk_index": 0},
        {"text": "Doc Beta content.", "source": "beta.txt", "page": 1, "chunk_index": 0},
    ]
    embeddings = shared_embedder.embed_documents([c["text"] for c in chunks])
    temp_vectorstore.add_documents(chunks, embeddings)

    assert "alpha.txt" in temp_vectorstore.get_sources()
    temp_vectorstore.delete_by_source("alpha.txt")

    sources = temp_vectorstore.get_sources()
    assert "alpha.txt" not in sources
    assert "beta.txt" in sources
