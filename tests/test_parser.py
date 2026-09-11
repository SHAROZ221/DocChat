"""Tests for document parser service."""

import pytest
import tempfile
from pathlib import Path
from app.services.parser import parse_document


def test_parse_text_file():
    with tempfile.NamedTemporaryFile(suffix=".txt", mode="w+", encoding="utf-8", delete=False) as f:
        f.write("This is a test plain text document for DocChat.")
        f.flush()
        filepath = f.name

    try:
        pages = parse_document(filepath)
        assert len(pages) == 1
        assert "plain text document" in pages[0]["text"]
        assert pages[0]["page"] == 1
        assert pages[0]["source"] == Path(filepath).name
    finally:
        Path(filepath).unlink(missing_ok=True)


def test_parse_markdown_file():
    with tempfile.NamedTemporaryFile(suffix=".md", mode="w+", encoding="utf-8", delete=False) as f:
        f.write("# Header\n\n- Item 1\n- Item 2")
        f.flush()
        filepath = f.name

    try:
        pages = parse_document(filepath)
        assert len(pages) == 1
        assert "Item 1" in pages[0]["text"]
    finally:
        Path(filepath).unlink(missing_ok=True)


def test_parse_nonexistent_file():
    with pytest.raises(FileNotFoundError):
        parse_document("nonexistent_random_file.pdf")


def test_unsupported_file_extension():
    with tempfile.NamedTemporaryFile(suffix=".xyz", mode="w+", delete=False) as f:
        f.write("content")
        filepath = f.name

    try:
        with pytest.raises(ValueError, match="Unsupported file format"):
            parse_document(filepath)
    finally:
        Path(filepath).unlink(missing_ok=True)
