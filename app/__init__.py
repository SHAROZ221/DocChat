"""Flask application factory for DocChat."""

import os
from flask import Flask
from app.config import Config
from app.services.embedder import Embedder
from app.services.vectorstore import VectorStore
from app.services.retriever import Retriever
from app.services.llm import GeminiClient
from app.services.chat_session import SessionManager


def create_app(config_class=Config):
    """Instantiate and configure Flask app."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Ensure required directories exist
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(app.config["CHROMA_PERSIST_DIR"], exist_ok=True)

    # Initialize backend services
    app.embedder = Embedder(model_name=app.config["EMBEDDING_MODEL"])
    app.vectorstore = VectorStore(
        persist_dir=app.config["CHROMA_PERSIST_DIR"],
        collection_name="doc_chat"
    )
    app.retriever = Retriever(
        embedder=app.embedder,
        vectorstore=app.vectorstore,
        top_k=app.config["TOP_K"]
    )
    app.llm = GeminiClient(
        api_key=app.config["GEMINI_API_KEY"],
        model_name=app.config["GEMINI_MODEL"]
    )
    app.session_manager = SessionManager()

    # Register Blueprints
    from app.routes.main import main_bp
    from app.routes.upload import upload_bp
    from app.routes.chat import chat_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(upload_bp, url_prefix="/api")
    app.register_blueprint(chat_bp, url_prefix="/api")

    return app
