# DocChat — Intelligent Document Q&A (RAG)

DocChat is a production-quality **Retrieval-Augmented Generation (RAG)** web application that enables users to have contextual, multi-turn conversations with their documents. 

DocChat processes documents locally, chunks them with sentence-boundary awareness, stores vector embeddings in **ChromaDB**, and leverages **Google's Gemini 2.5 Flash** for grounded answers with citations.

---

## Key Features

- **Multi-Format Ingestion**: Supports `.pdf`, `.docx`, `.pptx`, `.xlsx`, `.txt`, and `.md` files.
- **Multi-Document Sessions**: Upload multiple documents simultaneously and query across all of them in a single conversation.
- **Local Embeddings**: Embeddings run locally via `sentence-transformers` (`all-MiniLM-L6-v2`) for free, offline vector computation without API rate limits or costs.
- **Persistent Vector Store**: ChromaDB vector store retains indexed documents and cosine similarity indexes across server restarts.
- **Grounded Answers & Citations**: Answers are strictly grounded in document excerpts with source names, page numbers, and similarity scores.
- **Hallucination Prevention**: If a question cannot be answered from the document context, DocChat explicitly informs the user rather than fabricating information.
- **Multi-Turn Chat History**: Retains session memory for follow-up questions and conversational continuity.
- **Modern UI**: Clean, responsive interface featuring Dark/Light mode toggle, drag-and-drop file upload, collapsible source cards, and rendered Markdown with syntax highlighting.

---

## Architecture Overview

```
User Browser (Jinja2 + Tailwind CSS + JS)
         │
         ▼
Flask Application Layer
   ├── /api/upload ──> Document Parser (PyMuPDF, docx, pptx, openpyxl)
   │                         │
   │                         ▼
   │                   Text Chunker (sentence boundary aware)
   │                         │
   │                         ▼
   │                   Local Embedder (sentence-transformers)
   │                         │
   │                         ▼
   │                   ChromaDB Vector Store (cosine distance index)
   │
   └── /api/chat ───> Retriever (top-k semantic search)
                             │
                             ▼
                      Prompt Builder (context + history + question)
                             │
                             ▼
                      Gemini 2.5 Flash API
                             │
                             ▼
                      Grounded Answer + Cited Sources
```

---

## Tech Stack

| Component | Technology | Rationale |
|---|---|---|
| **LLM** | Google Gemini 2.5 Flash (`google-genai`) | High reasoning capability, low latency, generous free tier |
| **Embeddings** | `sentence-transformers` (`all-MiniLM-L6-v2`) | Free, runs locally, 384-dimensional dense vectors |
| **Vector Database** | ChromaDB | Lightweight, persistent, built-in cosine similarity |
| **Web Framework** | Flask 3 | Lightweight, flexible, Pythonic |
| **Document Parsers** | PyMuPDF, python-docx, python-pptx, openpyxl | Broad multi-format support |
| **Frontend** | HTML5, Tailwind CSS, Lucide Icons, Marked.js | Clean, fast, modern, responsive UI |

---

## Project Structure

```
Doc Chat/
├── app/
│   ├── __init__.py               # Flask app factory & service singletons
│   ├── config.py                 # Environment and application configuration
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── main.py               # Main UI route
│   │   ├── upload.py             # File upload and document management routes
│   │   └── chat.py               # Q&A retrieval and conversation routes
│   ├── services/
│   │   ├── __init__.py
│   │   ├── parser.py             # Multi-format document text extraction
│   │   ├── chunker.py            # Sentence-aware text chunker with overlap
│   │   ├── embedder.py           # Local sentence-transformers embedder
│   │   ├── vectorstore.py        # ChromaDB client and cosine search
│   │   ├── retriever.py          # Top-k chunk retrieval orchestrator
│   │   ├── llm.py                # Gemini 2.5 client with RAG prompting
│   │   └── chat_session.py       # Multi-turn session state manager
│   ├── static/
│   │   ├── css/
│   │   │   └── styles.css        # Custom styles, animations, scrollbars
│   │   └── js/
│   │       └── chat.js           # AJAX handlers, UI rendering, drag-and-drop
│   ├── templates/
│   │   ├── base.html             # Base HTML with Tailwind and scripts
│   │   └── index.html            # Main chat interface & sidebar
│   └── uploads/                  # Uploaded files directory (gitignored)
├── doc/                          # Project discovery & specifications
├── tests/
│   ├── __init__.py
│   ├── test_chunker.py           # Unit tests for text chunker
│   ├── test_parser.py            # Unit tests for document parser
│   └── test_chat_session.py      # Unit tests for session manager
├── .env.example                  # Template for environment configuration
├── .gitignore                    # Git ignore file
├── requirements.txt              # Project dependencies
├── run.py                        # Application entry point
└── README.md                     # Documentation
```

---

## Quick Start

### 1. Prerequisites

- Python 3.10+ (tested on Python 3.10, 3.11, 3.12, 3.14)
- Google AI Studio Gemini API Key ([Get one free here](https://aistudio.google.com/apikey))

### 2. Setup Virtual Environment

```bash
# Clone or navigate to the repository
cd "Doc Chat"

# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and insert your Gemini API key:

```env
GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
```

### 5. Run the Application

```bash
python run.py
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## Running Tests

Run the test suite using `pytest`:

```bash
python -m pytest tests/ -v
```

---

## License

MIT License. Free for learning, modification, and portfolio use.
