<div align="center">

<img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=32&duration=3000&pause=1000&color=00D1FF&center=true&vCenter=true&width=600&lines=%F0%9F%93%84+DocChat;Chat+With+Your+Documents;RAG-Powered+Q%26A" alt="Typing SVG" />

### Retrieval-Augmented Q&A for Your Documents

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20Store-FF6B6B?style=flat-square)]()
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)]()
[![Status](https://img.shields.io/badge/Status-Active-00ff88?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)]()

<br/>

> *A Python-based RAG application that lets you upload documents and have grounded, multi-turn conversations with them — with every answer traced back to the exact source chunk it came from.*

</div>

---

## 🔍 What is DocChat?

DocChat turns any document into something you can **talk to**. Upload a file, ask a question in plain English, and get an answer generated only from what's actually in the document — not the model's memory.

- 📄 Upload a document → **Parsed, chunked, and embedded locally**
- ❓ Ask a question → **Top-matching chunks retrieved via vector search**
- 🤖 Answer generated → **Grounded strictly in retrieved context, with citations**
- 🚫 Answer not in the document? → **DocChat says so instead of guessing**
- 💬 Follow-up question? → **Chat history carries the conversation forward**

This is the same core pattern (retrieve → augment → generate) behind production RAG systems like enterprise document search and internal knowledge-base assistants.

---

## ⚙️ How It Works

```
Document Upload
        │
        ▼
┌───────────────────┐
│   Parse & Chunk    │──► Sentence-boundary-aware splitting
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Embed & Store      │──► Local embeddings → ChromaDB (cosine index)
└───────────────────┘

User Question
        │
        ▼
┌───────────────────┐
│  Retrieve Top-K     │──► Semantic search over stored chunks
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Build Prompt        │──► Context + chat history + question
└───────────────────┘
        │
        ▼
   Gemini 2.5 Flash ✅ → Grounded Answer + Cited Sources
```

Every answer is generated strictly from retrieved chunks — no source, no answer, just an honest "not found in the documents."

---

## 📁 Supported Formats

| Format | Extension | Parser |
|---|---|:---:|
| PDF | `.pdf` | PyMuPDF |
| Word Document | `.docx` | python-docx |
| PowerPoint | `.pptx` | python-pptx |
| Excel Spreadsheet | `.xlsx` | openpyxl |
| Plain Text | `.txt` | built-in |
| Markdown | `.md` | built-in |

---

## 💬 Chat Interface

> Local App → **[localhost:5000](http://127.0.0.1:5000)**

The interface shows in real time:

- 📂 **Document sidebar** — uploaded files with drag-and-drop upload and per-file delete
- 💭 **Chat thread** — user/assistant message bubbles with markdown rendering
- 📎 **Source cards** — collapsible citations showing source file, page, and similarity score
- 🌙 **Dark/light toggle** — theme preference persisted locally
- 🔁 **Multi-turn memory** — follow-up questions resolved using chat history

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Gemini API key ([get one free](https://aistudio.google.com/apikey))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/SHAROZ221/DocChat.git
cd DocChat

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure your API key
cp .env.example .env
# → edit .env and add your GEMINI_API_KEY

# 5. Run the app
python run.py

# 6. Open the app
# → http://127.0.0.1:5000
```

---

## 📁 Project Structure

```
DocChat/
├── app/
│   ├── __init__.py        → Flask app factory & service singletons
│   ├── config.py           → Environment and app configuration
│   ├── routes/
│   │   ├── main.py         → Main UI route
│   │   ├── upload.py       → File upload & document management
│   │   └── chat.py         → Q&A retrieval and conversation routes
│   ├── services/
│   │   ├── parser.py       → Multi-format document text extraction
│   │   ├── chunker.py      → Sentence-aware chunking with overlap
│   │   ├── embedder.py     → Local sentence-transformers embedder
│   │   ├── vectorstore.py  → ChromaDB client & cosine search
│   │   ├── retriever.py    → Top-k chunk retrieval orchestrator
│   │   ├── llm.py           → Gemini client with RAG prompting
│   │   └── chat_session.py → Multi-turn session state manager
│   ├── static/              → CSS & JS (AJAX, drag-and-drop, theming)
│   ├── templates/           → Jinja2 chat interface
│   └── uploads/             → Uploaded files (gitignored)
├── tests/                   → Unit tests (parser, chunker, sessions)
├── .env.example              → Environment variable template
├── requirements.txt          → Python dependencies
├── run.py                    → Application entry point
└── README.md
```

---

## 🧰 Built With

| Technology | Purpose |
|---|---|
| **Python 3.10+** | Core language |
| **Flask 3** | Web server and routing |
| **sentence-transformers** | Local, free text embeddings |
| **ChromaDB** | Persistent vector store, cosine similarity |
| **Gemini 2.5 Flash** | Grounded answer generation |
| **PyMuPDF / python-docx / python-pptx / openpyxl** | Multi-format document parsing |
| **Tailwind CSS** | Frontend styling |

---

## 🧪 Try It Locally

Upload any document and try questions like:

```
"Summarize the key points of this document"
"What does section 3 say about pricing?"
"Does this mention anything about deadlines?"
```

Then ask something that isn't in the document at all — DocChat should tell you it can't find the answer instead of making one up.

---

## 🎯 Learning Outcomes

Building this project covers core GenAI/LLM engineering skills:

- ✅ Document parsing across multiple file formats
- ✅ Chunking strategy and why overlap matters for retrieval quality
- ✅ Embedding generation and vector similarity search
- ✅ Retrieval-augmented prompt construction
- ✅ Hallucination control via strict context-grounding
- ✅ Multi-turn conversational state management
- ✅ End-to-end RAG pipeline, from raw file to cited answer

---

<div align="center">

Made with 🤖 by **[Sharoz](https://github.com/SHAROZ221)**

BCA Final Year · GenAI/LLM Application Engineering · India

[![GitHub](https://img.shields.io/badge/GitHub-SHAROZ221-181717?style=flat-square&logo=github)](https://github.com/SHAROZ221)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Sharoz_Mohd-0077B5?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/sharoz-mohd-86057a408/)

*"Retrieve • Ground • Answer"*

</div>