"""Gemini LLM client with RAG prompt formatting and source grounding."""

import os
from typing import List, Dict, Any, Optional

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None


class GeminiClient:
    """Gemini API client for RAG-based document Q&A."""

    DEFAULT_MODEL = "gemini-3.6-flash"

    SYSTEM_PROMPT = """You are DocChat, an intelligent and precise document Q&A assistant.
Your goal is to answer the user's question accurately using ONLY the provided document context excerpts.

Rules:
1. Grounding: Rely strictly on the provided Document Context. Do not invent, speculate, or extrapolate facts outside the context.
2. Unanswerable Questions: If the context does not contain sufficient information to answer the question, clearly state:
   "I couldn't find information about that in the uploaded documents."
3. Citations: When answering from the context, always cite the source documents and page numbers (e.g. `[Source: document.pdf, Page 2]`).
4. Conversation Flow: Use the chat history to understand follow-up questions and pronouns (e.g. 'what did it say about X?'), but ensure factual answers are supported by the context.
5. Clarity: Be concise, structured, and easy to read (use bullet points or bold text where appropriate)."""

    def __init__(self, api_key: Optional[str] = None, model_name: str = DEFAULT_MODEL):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model_name = model_name
        self._client = None

    @property
    def client(self):
        """Lazy load genai client."""
        if not self.api_key:
            raise ValueError(
                "**Gemini API Key missing!** Please add your free key to the `.env` file:\n\n"
                "1. Open `.env` in the project root.\n"
                "2. Set `GEMINI_API_KEY=your_key_here`.\n"
                "3. You can obtain a free API key at [Google AI Studio](https://aistudio.google.com/apikey)."
            )
        if genai is None:
            raise ImportError("google-genai package is not installed.")

        if self._client is None:
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def generate_answer(
        self,
        question: str,
        context_chunks: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        """Generate answer grounded in context chunks and chat history.

        Args:
            question: Current user question.
            context_chunks: Retrieved document chunks.
            chat_history: Previous conversation turns [{'question': ..., 'answer': ...}].

        Returns:
            Assistant's response text.
        """
        # If no context is provided at all
        if not context_chunks:
            return "No relevant document excerpts were found to answer your question. Please ensure your documents are uploaded and indexed."

        # Format context excerpts
        context_blocks = []
        for i, chunk in enumerate(context_chunks, 1):
            source = chunk.get("source", "Unknown document")
            page = chunk.get("page", "1")
            text = chunk.get("text", "").strip()
            score = chunk.get("score", 0.0)
            context_blocks.append(
                f"--- Excerpt {i} [File: {source} | Page: {page} | Relevance: {score:.2f}] ---\n{text}"
            )
        context_str = "\n\n".join(context_blocks)

        # Format conversation history
        history_str = ""
        if chat_history:
            recent_turns = chat_history[-5:]  # Keep last 5 turns to preserve context window
            lines = []
            for turn in recent_turns:
                lines.append(f"User: {turn.get('question', '')}")
                lines.append(f"Assistant: {turn.get('answer', '')}")
            history_str = "\n".join(lines)

        user_content = f"""### DOCUMENT CONTEXT EXCERPTS:
{context_str}

### RECENT CHAT HISTORY:
{history_str if history_str else "(No prior conversation)"}

### USER QUESTION:
{question}

Please answer the user's question following the system instructions and citing the relevant excerpts."""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=user_content,
                config=types.GenerateContentConfig(
                    system_instruction=self.SYSTEM_PROMPT,
                    temperature=0.2,  # Low temperature for factual accuracy
                )
            )
            return response.text if response.text else "No response generated."
        except Exception as e:
            return f"Error communicating with Gemini API: {str(e)}"
