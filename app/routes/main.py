"""Main route serving the chat user interface."""

from flask import Blueprint, render_template, current_app

main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def index():
    """Render main chat interface with active document list."""
    sources = current_app.vectorstore.get_sources()
    return render_template("index.html", documents=sources)
