"""Chat and question answering routes."""

import uuid
from flask import Blueprint, request, jsonify, session, current_app

chat_bp = Blueprint("chat", __name__)


def get_or_create_session_id() -> str:
    """Retrieve existing session ID from cookie or generate a new one."""
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())
    return session["session_id"]


@chat_bp.route("/chat", methods=["POST"])
def chat():
    """Handle question submission, retrieval, and LLM answer generation."""
    data = request.get_json() or {}
    question = data.get("question", "").strip()

    if not question:
        return jsonify({"success": False, "error": "Question cannot be empty."}), 400

    # Ensure documents have been uploaded
    sources = current_app.vectorstore.get_sources()
    if not sources:
        return jsonify({
            "success": True,
            "answer": "No documents have been uploaded yet. Please upload at least one document (PDF, TXT, DOCX, etc.) using the sidebar before asking questions.",
            "sources": []
        })

    session_id = get_or_create_session_id()
    chat_session = current_app.session_manager.get_session(session_id)

    try:
        # 1. Retrieve top-k relevant chunks
        chunks = current_app.retriever.retrieve(question)

        # 2. Generate answer with Gemini
        answer = current_app.llm.generate_answer(
            question=question,
            context_chunks=chunks,
            chat_history=chat_session.get_history(),
        )

        # 3. Store in conversation memory
        chat_session.add_turn(question, answer, chunks)

        # Format sources for frontend display
        formatted_sources = []
        for c in chunks:
            raw_text = c.get("text", "").strip()
            snippet = raw_text[:280] + ("..." if len(raw_text) > 280 else "")
            formatted_sources.append({
                "source": c.get("source", "Unknown"),
                "page": c.get("page", "1"),
                "snippet": snippet,
                "score": round(c.get("score", 0.0), 3),
            })

        return jsonify({
            "success": True,
            "answer": answer,
            "sources": formatted_sources,
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@chat_bp.route("/chat/history", methods=["GET"])
def get_chat_history():
    """Get conversation history for current session."""
    session_id = get_or_create_session_id()
    chat_session = current_app.session_manager.get_session(session_id)
    return jsonify({"success": True, "history": chat_session.get_history()})


@chat_bp.route("/chat/clear", methods=["POST"])
def clear_chat():
    """Clear conversation history for current session."""
    session_id = get_or_create_session_id()
    chat_session = current_app.session_manager.get_session(session_id)
    chat_session.clear()
    return jsonify({"success": True, "message": "Conversation history reset."})
