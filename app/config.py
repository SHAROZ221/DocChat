import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Suppress HuggingFace symlink warning on Windows
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")


class Config:
    """Application configuration."""

    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "docchat-dev-secret-key-change-in-production")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

    # Embedding model (local sentence-transformers)
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

    # ChromaDB persistent storage
    CHROMA_PERSIST_DIR = str(BASE_DIR / os.getenv("CHROMA_PERSIST_DIR", "chroma_db"))

    # File uploads
    UPLOAD_FOLDER = str(BASE_DIR / os.getenv("UPLOAD_FOLDER", "app/uploads"))
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB max per upload
    ALLOWED_EXTENSIONS = {"pdf", "txt", "md", "docx", "pptx", "xlsx"}

    # RAG chunking & retrieval parameters
    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "500"))
    CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "50"))
    TOP_K = int(os.getenv("TOP_K", "5"))
