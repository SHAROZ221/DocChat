"""Gemini LLM client with RAG prompt formatting, multi-key failover pool, and exponential backoff retry."""

import os
import time
import random
import logging
from typing import List, Dict, Any, Optional

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

logger = logging.getLogger(__name__)


class GeminiClient:
    """Gemini API client for RAG-based document Q&A with multi-key pool and retry/fallback resilience."""

    DEFAULT_MODEL = "gemini-3.8-flash"
    DEFAULT_FALLBACKS = ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-2.5-flash"]

    SYSTEM_PROMPT = """You are DocChat, an intelligent and precise document Q&A assistant.
Your goal is to answer the user's question accurately using ONLY the provided document context excerpts.

Rules:
1. Grounding: Rely strictly on the provided Document Context. Do not invent, speculate, or extrapolate facts outside the context.
2. Unanswerable Questions: If the context does not contain sufficient information to answer the question, clearly state:
   "I couldn't find information about that in the uploaded documents."
3. Citations: When answering from the context, always cite the source documents and page numbers (e.g. `[Source: document.pdf, Page 2]`).
4. Conversation Flow: Use the chat history to understand follow-up questions and pronouns (e.g. 'what did it say about X?'), but ensure factual answers are supported by the context.
5. Clarity: Be concise, structured, and easy to read (use bullet points or bold text where appropriate)."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_keys: Optional[List[str]] = None,
        model_name: str = DEFAULT_MODEL,
        fallback_models: Optional[List[str]] = None,
    ):
        if api_keys:
            self.api_keys = [k.strip() for k in api_keys if k.strip()]
        elif api_key:
            self.api_keys = [api_key.strip()]
        else:
            raw_keys = os.getenv("GEMINI_API_KEYS", "")
            if raw_keys:
                self.api_keys = [k.strip() for k in raw_keys.split(",") if k.strip()]
            else:
                single = os.getenv("GEMINI_API_KEY", "")
                self.api_keys = [single.strip()] if single else []

        self.model_name = model_name
        self.fallback_models = fallback_models if fallback_models is not None else self.DEFAULT_FALLBACKS
        self._key_index = 0
        self._clients: Dict[str, Any] = {}

    @property
    def current_api_key(self) -> str:
        if not self.api_keys:
            raise ValueError(
                "**Gemini API Key missing!** Please add your free key to the `.env` file:\n\n"
                "1. Open `.env` in the project root.\n"
                "2. Set `GEMINI_API_KEY=your_key_here` (or multiple keys: `GEMINI_API_KEYS=key1,key2`).\n"
                "3. You can obtain a free API key at [Google AI Studio](https://aistudio.google.com/apikey)."
            )
        return self.api_keys[self._key_index % len(self.api_keys)]

    def rotate_key(self) -> str:
        """Advance to next API key in the pool if multiple are configured."""
        if len(self.api_keys) > 1:
            self._key_index = (self._key_index + 1) % len(self.api_keys)
            logger.info(f"Rotated to API Key #{self._key_index + 1} in pool.")
        return self.current_api_key

    def get_client(self, api_key: Optional[str] = None):
        """Get or instantiate genai.Client for the given key."""
        if genai is None:
            raise ImportError("google-genai package is not installed.")
        key = api_key or self.current_api_key
        if key not in self._clients:
            self._clients[key] = genai.Client(api_key=key)
        return self._clients[key]

    @property
    def client(self):
        """Lazy load genai client for the active key."""
        return self.get_client()

    def _build_user_content(
        self,
        question: str,
        context_chunks: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        """Format document chunks and conversation history into prompt payload."""
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

        history_str = ""
        if chat_history:
            recent_turns = chat_history[-5:]  # Keep last 5 turns to preserve context window
            lines = []
            for turn in recent_turns:
                lines.append(f"User: {turn.get('question', '')}")
                lines.append(f"Assistant: {turn.get('answer', '')}")
            history_str = "\n".join(lines)

        return f"""### DOCUMENT CONTEXT EXCERPTS:
{context_str}

### RECENT CHAT HISTORY:
{history_str if history_str else "(No prior conversation)"}

### USER QUESTION:
{question}

Please answer the user's question following the system instructions and citing the relevant excerpts."""

    def generate_answer(
        self,
        question: str,
        context_chunks: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        """Generate answer grounded in context chunks and chat history with retry and fallback cascades.

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

        user_content = self._build_user_content(question, context_chunks, chat_history)

        # Build candidate model cascade: primary model first, followed by fallbacks
        candidate_models = [self.model_name]
        for m in self.fallback_models:
            if m and m not in candidate_models:
                candidate_models.append(m)

        last_error = None
        max_retries_per_model = 2 if len(candidate_models) > 1 else 3

        for model in candidate_models:
            for attempt in range(max_retries_per_model):
                try:
                    active_client = self.client
                    response = active_client.models.generate_content(
                        model=model,
                        contents=user_content,
                        config=types.GenerateContentConfig(
                            system_instruction=self.SYSTEM_PROMPT,
                            temperature=0.2,  # Low temperature for factual accuracy
                        ),
                    )
                    if response and response.text:
                        return response.text
                    return "No response generated."

                except Exception as e:
                    err_str = str(e)
                    last_error = err_str

                    # Check if error is transient (503 UNAVAILABLE, 429 RESOURCE_EXHAUSTED, timeout)
                    is_transient = any(
                        token in err_str
                        for token in [
                            "503",
                            "429",
                            "UNAVAILABLE",
                            "RESOURCE_EXHAUSTED",
                            "high demand",
                            "temporarily unavailable",
                            "timeout",
                        ]
                    )
                    is_not_found = "404" in err_str or "NOT_FOUND" in err_str

                    if is_not_found:
                        logger.warning(f"Model '{model}' returned 404. Trying next fallback model...")
                        break

                    if is_transient and attempt < max_retries_per_model - 1:
                        if len(self.api_keys) > 1:
                            self.rotate_key()

                        backoff = 1.2 * (2 ** attempt) + random.uniform(0.1, 0.4)
                        logger.warning(
                            f"Transient error with {model} (Attempt {attempt + 1}/{max_retries_per_model}): {err_str[:120]}. "
                            f"Retrying in {backoff:.1f}s..."
                        )
                        time.sleep(backoff)
                        continue
                    else:
                        if len(self.api_keys) > 1:
                            self.rotate_key()
                        break

        return f"Error communicating with Gemini API: {last_error}"

    def generate_answer_stream(
        self,
        question: str,
        context_chunks: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, Any]]] = None,
    ):
        """Generate streaming answer tokens grounded in context chunks and chat history.

        Args:
            question: Current user question.
            context_chunks: Retrieved document chunks.
            chat_history: Previous conversation turns [{'question': ..., 'answer': ...}].

        Yields:
            str: Token or chunk text as generated by the model.
        """
        if not context_chunks:
            yield "No relevant document excerpts were found to answer your question. Please ensure your documents are uploaded and indexed."
            return

        user_content = self._build_user_content(question, context_chunks, chat_history)

        candidate_models = [self.model_name]
        for m in self.fallback_models:
            if m and m not in candidate_models:
                candidate_models.append(m)

        last_error = None
        max_retries_per_model = 2 if len(candidate_models) > 1 else 3

        for model in candidate_models:
            for attempt in range(max_retries_per_model):
                try:
                    active_client = self.client
                    stream = active_client.models.generate_content_stream(
                        model=model,
                        contents=user_content,
                        config=types.GenerateContentConfig(
                            system_instruction=self.SYSTEM_PROMPT,
                            temperature=0.2,
                        ),
                    )

                    has_yielded = False
                    for chunk in stream:
                        if chunk and hasattr(chunk, "text") and chunk.text:
                            has_yielded = True
                            yield chunk.text

                    if has_yielded:
                        return
                    else:
                        yield "No response generated."
                        return

                except Exception as e:
                    err_str = str(e)
                    last_error = err_str

                    is_not_found = "404" in err_str or "NOT_FOUND" in err_str
                    if is_not_found:
                        logger.warning(f"Model '{model}' returned 404 in stream. Trying next fallback model...")
                        break

                    is_transient = any(
                        token in err_str
                        for token in [
                            "503",
                            "429",
                            "UNAVAILABLE",
                            "RESOURCE_EXHAUSTED",
                            "high demand",
                            "temporarily unavailable",
                            "timeout",
                        ]
                    )

                    if is_transient and attempt < max_retries_per_model - 1:
                        if len(self.api_keys) > 1:
                            self.rotate_key()

                        backoff = 1.2 * (2 ** attempt) + random.uniform(0.1, 0.4)
                        logger.warning(
                            f"Transient streaming error with {model} (Attempt {attempt + 1}/{max_retries_per_model}): {err_str[:120]}. "
                            f"Retrying in {backoff:.1f}s..."
                        )
                        time.sleep(backoff)
                        continue
                    else:
                        if len(self.api_keys) > 1:
                            self.rotate_key()
                        break

        yield f"Error communicating with Gemini API: {last_error}"
