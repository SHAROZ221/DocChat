"""Document upload and management routes."""

import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from app.services.parser import parse_document
from app.services.chunker import chunk_documents

upload_bp = Blueprint("upload", __name__)


def allowed_file(filename: str) -> bool:
    """Check if file extension is supported."""
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in current_app.config["ALLOWED_EXTENSIONS"]
    )


@upload_bp.route("/upload", methods=["POST"])
def upload_file():
    """Upload, parse, chunk, embed, and store document in vector database."""
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file part in request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "error": "No file selected"}), 400

    if not allowed_file(file.filename):
        allowed = ", ".join(sorted(current_app.config["ALLOWED_EXTENSIONS"]))
        return jsonify({"success": False, "error": f"File type not supported. Allowed types: {allowed}"}), 400

    filename = secure_filename(file.filename)
    if not filename:
        return jsonify({"success": False, "error": "Invalid filename"}), 400

    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)
    filepath = os.path.join(upload_folder, filename)

    try:
        # Save file locally
        file.save(filepath)

        # 1. Parse document
        pages = parse_document(filepath)
        if not pages:
            return jsonify({"success": False, "error": "Could not extract any readable content from the document."}), 400

        # 2. Chunk text
        chunks = chunk_documents(
            pages,
            chunk_size=current_app.config["CHUNK_SIZE"],
            chunk_overlap=current_app.config["CHUNK_OVERLAP"],
        )
        if not chunks:
            return jsonify({"success": False, "error": "Failed to generate text chunks from document."}), 400

        # 3. Embed chunks
        texts = [c["text"] for c in chunks]
        embeddings = current_app.embedder.embed_documents(texts)

        # 4. Store in ChromaDB
        added_count = current_app.vectorstore.add_documents(chunks, embeddings)

        return jsonify({
            "success": True,
            "filename": filename,
            "chunks_count": added_count,
            "message": f"Successfully processed '{filename}' into {added_count} searchable chunks.",
            "documents": current_app.vectorstore.get_sources(),
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@upload_bp.route("/documents", methods=["GET"])
def get_documents():
    """Retrieve list of currently indexed documents."""
    sources = current_app.vectorstore.get_sources()
    return jsonify({"success": True, "documents": sources})


@upload_bp.route("/documents/<path:source_name>", methods=["DELETE"])
def delete_document(source_name: str):
    """Delete a document from vector index and optionally remove from disk."""
    try:
        deleted_count = current_app.vectorstore.delete_by_source(source_name)

        # Also try to clean up the uploaded file on disk if it exists
        filepath = os.path.join(current_app.config["UPLOAD_FOLDER"], secure_filename(source_name))
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except OSError:
                pass

        return jsonify({
            "success": True,
            "message": f"Removed '{source_name}' ({deleted_count} chunks deleted).",
            "documents": current_app.vectorstore.get_sources(),
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
