"""Tests for text chunker service."""

import pytest
from app.services.chunker import chunk_text, chunk_documents


def test_chunk_text_empty():
    assert chunk_text("") == []
    assert chunk_text("   ") == []


def test_chunk_text_short():
    text = "Hello world, this is a short sentence."
    chunks = chunk_text(text, chunk_size=100, chunk_overlap=10)
    assert len(chunks) == 1
    assert chunks[0] == text


def test_chunk_text_splits_on_boundaries():
    text = (
        "First sentence is about RAG pipelines and vector databases. "
        "Second sentence explains how embeddings capture semantic meaning. "
        "Third sentence discusses prompt engineering and context stuffing."
    )
    chunks = chunk_text(text, chunk_size=75, chunk_overlap=15)
    assert len(chunks) >= 2
    # Ensure chunks retain content
    joined = " ".join(chunks)
    assert "First sentence" in joined
    assert "embeddings" in joined


def test_chunk_documents_metadata():
    pages = [
        {"text": "Page one content with details on architecture.", "source": "doc1.pdf", "page": 1},
        {"text": "Page two content discussing benchmarks and latency.", "source": "doc1.pdf", "page": 2},
    ]
    chunks = chunk_documents(pages, chunk_size=50, chunk_overlap=10)
    assert len(chunks) >= 2
    for c in chunks:
        assert "text" in c
        assert c["source"] == "doc1.pdf"
        assert c["page"] in (1, 2)
        assert "chunk_index" in c
