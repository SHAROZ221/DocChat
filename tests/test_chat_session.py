"""Tests for chat session manager."""

from app.services.chat_session import SessionManager, ChatSession


def test_session_manager_create_and_get():
    manager = SessionManager()
    session = manager.get_session("session-123")
    assert isinstance(session, ChatSession)
    assert session.session_id == "session-123"

    # Fetch same session
    session_again = manager.get_session("session-123")
    assert session is session_again


def test_session_add_and_clear():
    manager = SessionManager()
    session = manager.get_session("session-test")

    session.add_turn(
        question="What is RAG?",
        answer="Retrieval-Augmented Generation.",
        sources=[{"source": "doc.pdf", "page": 1, "score": 0.95}]
    )

    history = session.get_history()
    assert len(history) == 1
    assert history[0]["question"] == "What is RAG?"
    assert history[0]["answer"] == "Retrieval-Augmented Generation."

    session.clear()
    assert len(session.get_history()) == 0
