"""Chat session manager for multi-turn conversations."""

from typing import List, Dict, Any, Optional


class ChatSession:
    """Represents a single conversation session."""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.history: List[Dict[str, Any]] = []

    def add_turn(self, question: str, answer: str, sources: List[Dict[str, Any]]) -> None:
        """Add a conversation turn."""
        self.history.append({
            "question": question,
            "answer": answer,
            "sources": sources,
        })

    def get_history(self) -> List[Dict[str, Any]]:
        """Return history list."""
        return self.history

    def clear(self) -> None:
        """Reset session history."""
        self.history.clear()


class SessionManager:
    """Manages active chat sessions by ID."""

    def __init__(self):
        self._sessions: Dict[str, ChatSession] = {}

    def get_session(self, session_id: str) -> ChatSession:
        """Retrieve existing session or create a new one."""
        if session_id not in self._sessions:
            self._sessions[session_id] = ChatSession(session_id)
        return self._sessions[session_id]

    def delete_session(self, session_id: str) -> None:
        """Remove a session."""
        self._sessions.pop(session_id, None)

    def clear_all(self) -> None:
        """Clear all active sessions."""
        self._sessions.clear()
