"""Main route serving the chat user interface."""

from flask import Blueprint, render_template, current_app

main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def index():
    """Render main chat interface with active document list and statistics."""
    details = current_app.vectorstore.get_sources_details()
    total_chunks = sum(d.get("chunks", 0) for d in details)
    return render_template(
        "index.html",
        documents=details,
        total_chunks=total_chunks,
        model_name=current_app.config.get("GEMINI_MODEL", "gemini-3.6-flash"),
        embedding_model=current_app.config.get("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    )
