"""Chat and question answering routes."""

import json
import uuid
from flask import Blueprint, request, jsonify, session, current_app, Response, stream_with_context

chat_bp = Blueprint("chat", __name__)


def get_or_create_session_id() -> str:
    """Retrieve existing session ID from cookie or generate a new one."""
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())
    return session["session_id"]


@chat_bp.route("/chat/stream", methods=["POST"])
def chat_stream():
    """Stream answer generation token-by-token using Server-Sent Events (SSE)."""
    data = request.get_json() or {}
    question = data.get("question", "").strip()

    if not question:
        return jsonify({"success": False, "error": "Question cannot be empty."}), 400

    # Ensure documents have been uploaded
    sources = current_app.vectorstore.get_sources()
    if not sources:
        def no_docs_stream():
            yield f"data: {json.dumps({'type': 'sources', 'sources': []})}\n\n"
            msg = "No documents have been uploaded yet. Please upload at least one document (PDF, TXT, DOCX, etc.) using the document drawer before asking questions."
            yield f"data: {json.dumps({'type': 'token', 'token': msg})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        resp = Response(stream_with_context(no_docs_stream()), mimetype="text/event-stream")
        resp.headers["Cache-Control"] = "no-cache"
        resp.headers["X-Accel-Buffering"] = "no"
        return resp

    session_id = get_or_create_session_id()
    chat_session = current_app.session_manager.get_session(session_id)

    try:
        chunks = current_app.retriever.retrieve(question)
    except Exception as e:
        return jsonify({"success": False, "error": f"Document retrieval failed: {str(e)}"}), 500

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

    app = current_app._get_current_object()

    def event_stream():
        with app.app_context():
            # 1. Yield sources citations immediately
            yield f"data: {json.dumps({'type': 'sources', 'sources': formatted_sources})}\n\n"

            accumulated_tokens = []
            try:
                # 2. Stream tokens from Gemini
                for token in app.llm.generate_answer_stream(
                    question=question,
                    context_chunks=chunks,
                    chat_history=chat_session.get_history(),
                ):
                    accumulated_tokens.append(token)
                    yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"

                # 3. Store full turn in conversation memory
                full_answer = "".join(accumulated_tokens)
                chat_session.add_turn(question, full_answer, chunks)

                # 4. Notify frontend of stream completion
                yield f"data: {json.dumps({'type': 'done'})}\n\n"

            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    response = Response(stream_with_context(event_stream()), mimetype="text/event-stream")
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"
    return response


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
