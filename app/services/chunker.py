"""Text chunker with sentence-boundary awareness and metadata preservation."""

from typing import List, Dict, Any


def chunk_text(
    text: str,
    chunk_size: int = 500,
    chunk_overlap: int = 50
) -> List[str]:
    """Split text into overlapping chunks, attempting to break at natural boundaries.

    Args:
        text: Input string to split.
        chunk_size: Target maximum chunk size in characters.
        chunk_overlap: Character overlap between consecutive chunks.

    Returns:
        List of text chunks.
    """
    clean_text = text.strip()
    if not clean_text:
        return []

    if len(clean_text) <= chunk_size:
        return [clean_text]

    chunks: List[str] = []
    start = 0
    total_len = len(clean_text)

    # Valid separators in order of preference
    separators = ["\n\n", ".\n", ". ", "? ", "! ", "\n", "; ", ", ", " "]

    while start < total_len:
        end = min(start + chunk_size, total_len)

        if end < total_len:
            # Search for a natural boundary in the latter half of the window
            search_start = start + max(1, chunk_size // 2)
            boundary_found = -1

            for sep in separators:
                pos = clean_text.rfind(sep, search_start, end)
                if pos != -1:
                    boundary_found = pos + len(sep)
                    break

            if boundary_found != -1:
                end = boundary_found

        chunk = clean_text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # Move forward, taking overlap into account
        advance = end - start - chunk_overlap
        if advance <= 0:
            advance = max(1, end - start)
        start += advance

    return chunks


def chunk_documents(
    pages: List[Dict[str, Any]],
    chunk_size: int = 500,
    chunk_overlap: int = 50
) -> List[Dict[str, Any]]:
    """Chunk parsed document sections while preserving page and source metadata.

    Args:
        pages: List of dicts from parser.parse_document (each with 'text', 'source', 'page').
        chunk_size: Target chunk size in characters.
        chunk_overlap: Overlap in characters.

    Returns:
        List of chunk dicts containing 'text', 'source', 'page', and 'chunk_index'.
    """
    all_chunks: List[Dict[str, Any]] = []

    for page_info in pages:
        raw_text = page_info.get("text", "")
        source = page_info.get("source", "unknown")
        page = page_info.get("page", 1)

        pieces = chunk_text(raw_text, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        for idx, piece in enumerate(pieces):
            all_chunks.append({
                "text": piece,
                "source": source,
                "page": page,
                "chunk_index": idx,
            })

    return all_chunks
