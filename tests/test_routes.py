"""Tests for Flask web routes and API endpoints."""

import io
import tempfile
import shutil
import pytest
from app import create_app
from app.config import Config


class TestConfig(Config):
    TESTING = True
    CHROMA_PERSIST_DIR = tempfile.mkdtemp()
    UPLOAD_FOLDER = tempfile.mkdtemp()
    GEMINI_API_KEY = "test_key_for_unit_tests"


@pytest.fixture(scope="module")
def app_client():
    test_config = TestConfig()
    app = create_app(test_config)
    with app.test_client() as client:
        yield client
    shutil.rmtree(test_config.CHROMA_PERSIST_DIR, ignore_errors=True)
    shutil.rmtree(test_config.UPLOAD_FOLDER, ignore_errors=True)


def test_index_route(app_client):
    response = app_client.get("/")
    assert response.status_code == 200
    assert b"DocChat" in response.data


def test_list_documents_empty(app_client):
    response = app_client.get("/api/documents")
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert isinstance(data["documents"], list)


def test_upload_text_file(app_client):
    file_content = b"Quantum computing uses qubits that can exist in superposition."
    data = {
        "file": (io.BytesIO(file_content), "quantum.txt")
    }
    response = app_client.post("/api/upload", data=data, content_type="multipart/form-data")
    assert response.status_code == 200
    result = response.get_json()
    assert result["success"] is True
    assert result["filename"] == "quantum.txt"
    assert "quantum.txt" in result["documents"]


def test_chat_empty_question(app_client):
    response = app_client.post("/api/chat", json={"question": ""})
    assert response.status_code == 400


def test_chat_clear_session(app_client):
    response = app_client.post("/api/chat/clear")
    assert response.status_code == 200
    assert response.get_json()["success"] is True


def test_delete_document_route(app_client):
    response = app_client.delete("/api/documents/quantum.txt")
    assert response.status_code == 200
    assert response.get_json()["success"] is True
    assert "quantum.txt" not in response.get_json()["documents"]


def test_chat_stream_empty_question(app_client):
    response = app_client.post("/api/chat/stream", json={"question": ""})
    assert response.status_code == 400


def test_chat_stream_no_documents(app_client):
    response = app_client.post("/api/chat/stream", json={"question": "What is Python?"})
    assert response.status_code == 200
    assert "text/event-stream" in response.content_type
    data = response.data.decode("utf-8")
    assert "data: " in data
    assert '"type": "done"' in data

