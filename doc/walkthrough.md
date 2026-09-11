# DocChat — Implementation & Verification Walkthrough

DocChat is a production-ready **Retrieval-Augmented Generation (RAG)** web application that enables multi-turn Q&A conversations grounded in uploaded documents (PDF, DOCX, PPTX, XLSX, TXT, MD).

---

## 1. What Was Built

### Core Services (`app/services/`)
- **Document Parser (`parser.py`)**: Multi-format extractor supporting `.pdf` (PyMuPDF), `.docx` (python-docx), `.pptx` (python-pptx), `.xlsx` (openpyxl), `.txt`, and `.md`.
- **Text Chunker (`chunker.py`)**: Sentence-boundary aware text splitting with configurable chunk size (500 chars) and overlap (50 chars), preserving source and page metadata.
- **Local Embedder (`embedder.py`)**: Offline dense vector embeddings using `sentence-transformers` (`all-MiniLM-L6-v2`, 384 dimensions) — zero API cost during development.
- **Vector Store (`vectorstore.py`)**: Persistent ChromaDB store using cosine similarity distance metric, with document deletion, source tracking, and collection management.
- **Retriever (`retriever.py`)**: Top-$k$ semantic search orchestrator linking queries to context chunks.
- **LLM Client (`llm.py`)**: Google Gemini 2.5 Flash client with strict grounding instructions, anti-hallucination guardrails, and citation formatting (`[Source: doc.pdf, Page 1]`).
- **Session Manager (`chat_session.py`)**: Multi-turn conversation state manager preserving chat history for contextual follow-up questions.

### Flask Web Application (`app/`)
- **Blueprints & Routes**:
  - `GET /`: Clean, responsive web UI with sidebar and chat window.
  - `POST /api/upload`: Multi-file upload, parsing, chunking, embedding, and indexing.
  - `GET /api/documents`: List currently indexed documents with chunk counts.
  - `DELETE /api/documents/<source>`: Remove a document and its vectors.
  - `POST /api/chat`: Semantic search + Gemini generation with cited sources.
  - `POST /api/chat/clear`: Reset active conversation session.
- **Modern UI**:
  - Single-page application built with **Tailwind CSS**, **Lucide icons**, and **Marked.js**.
  - **Dark / Light mode** toggle with `localStorage` persistence.
  - **Drag-and-drop** file upload zone with animated progress indicator.
  - **Collapsible source citations** below each answer showing file name, page, relevance score, and excerpt snippet.
  - Textarea with auto-expanding height and keyboard shortcuts (`Enter` to send, `Shift+Enter` for new line).

---

## 2. Automated Test Results

All **18 unit and integration tests** passed:

```
tests/test_chat_session.py::test_session_manager_create_and_get PASSED   [  5%]
tests/test_chat_session.py::test_session_add_and_clear PASSED            [ 11%]
tests/test_chunker.py::test_chunk_text_empty PASSED                      [ 16%]
tests/test_chunker.py::test_chunk_text_short PASSED                      [ 22%]
tests/test_chunker.py::test_chunk_text_splits_on_boundaries PASSED       [ 27%]
tests/test_chunker.py::test_chunk_documents_metadata PASSED              [ 33%]
tests/test_parser.py::test_parse_text_file PASSED                        [ 38%]
tests/test_parser.py::test_parse_markdown_file PASSED                    [ 44%]
tests/test_parser.py::test_parse_nonexistent_file PASSED                 [ 50%]
tests/test_parser.py::test_unsupported_file_extension PASSED             [ 55%]
tests/test_retriever.py::test_embedder_and_retriever PASSED              [ 61%]
tests/test_retriever.py::test_delete_by_source PASSED                    [ 66%]
tests/test_routes.py::test_index_route PASSED                            [ 72%]
tests/test_routes.py::test_list_documents_empty PASSED                   [ 77%]
tests/test_routes.py::test_upload_text_file PASSED                       [ 83%]
tests/test_routes.py::test_chat_empty_question PASSED                    [ 88%]
tests/test_routes.py::test_chat_clear_session PASSED                     [ 94%]
tests/test_routes.py::test_delete_document_route PASSED                  [100%]

================== 18 passed, 3 warnings in 60.46s ==================
```

---

## 3. Live Server Verification

The server is actively running on **`http://127.0.0.1:5000`**.

### Upload & Indexing Test
Uploaded `sample_docs/titan_overview.md`:
```json
{
  "chunks_count": 5,
  "documents": ["titan_overview.md"],
  "filename": "titan_overview.md",
  "message": "Successfully processed 'titan_overview.md' into 5 searchable chunks.",
  "success": true
}
```

### Retrieval Test
Sent query: *"What is the operating depth of Project Titan?"*
Top chunks retrieved by semantic similarity:
| Page | Cosine Score | Snippet Excerpt |
|---|---|---|
| 1 | 0.539 | `# Project Titan: Architecture & System Overview...` |
| 1 | 0.382 | `real-time salinity, temperature, and acoustic data...` |
| 1 | 0.309 | `Payload Capacity: 45 kilograms of scientific instrumentation...` |

---

## 4. How to Use & Next Steps

1. Open your browser to:
   ```
   http://127.0.0.1:5000
   ```
2. **Add your Gemini API Key**:
   Open `.env` in the root folder and paste your key:
   ```env
   GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
   ```
   *(Get one free at [Google AI Studio](https://aistudio.google.com/apikey) if you don't already have one).*
3. Drag and drop any PDF, Word doc, or text file into the left sidebar.
4. Start chatting with your documents!
