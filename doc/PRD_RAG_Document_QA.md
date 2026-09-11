# DocChat — Project Discovery

*Before I write the build spec, I need to understand what you're actually trying to make. Answer what you can — skip anything you're not sure about yet, that's fine, we'll lock it in as we go.*

---

## 1. The Core Idea

1.1. In one sentence, what does DocChat do for the person using it?

1.2. Who is this for — just you learning, or do you imagine anyone else ever using it (classmates, recruiters testing it live, etc.)?

1.3. What's the *one* document type you care about most to start — PDFs, lecture notes, research papers, your own project docs, something else?

1.4. Is there a real document sitting on your laptop right now that you want to test this on? (Having a real target document from day one usually surfaces problems faster than a generic test file.)

---

## 2. Why This Project (not a different one)

2.1. Is the main goal (a) learning RAG concepts deeply, (b) having a portfolio piece to show recruiters, or (c) both equally? This changes how much I'll push you to explain *why* at each step vs. just get it working.

2.2. Do you want this to plug into your longer-term RAG Engine project later, or is DocChat meant to be a standalone, finished thing on its own?

---

## 3. Scope — What's In, What's Out

3.1. One document at a time, or multiple documents in one session?

3.2. Should it remember previous questions in the same session (follow-up questions like "what about the next section?"), or is each question independent?

3.3. Do you want the UI from day one, or would you rather get the whole pipeline working in a plain script/console first and add UI last?

3.4. Any hard "not doing this" items you already know — for example, no login system, no deployment to the cloud, no support for scanned/image PDFs?

---

## 4. Tech Choices You Already Lean Toward

4.1. Gemini or Claude for generating the answers — or do you want to keep both wired up and switch easily?

4.2. Embeddings: pull from an API (Gemini's embedding endpoint) or run them locally for free (`sentence-transformers`)? If you're not sure, tell me whether you'd rather avoid API costs/rate limits while developing, or keep everything cloud-based for simplicity.

4.3. Vector store: any preference between ChromaDB and FAISS, or should I just pick the simpler one to start?

4.4. UI: Flask (you've already got Ep. Log experience) or Streamlit (new to you, but faster for this kind of app)?

---

## 5. What "Working" Looks Like to You

5.1. Describe the moment you'd consider this project done for v1 — what are you doing, what do you see on screen?

5.2. How do you want wrong or unanswerable questions handled — should it say "I don't know" from the document, or would you rather see how bad the hallucination gets first (some people build the naive version on purpose to *feel* the problem before fixing it)?

5.3. Do you care about seeing *which* chunk the answer came from as text, or would you want it more visual (e.g. highlighted in the original doc)? That's a v2 idea, but worth knowing your preference now.

---

## 6. Working Style for This Project

6.1. Do you want me to explain the "why" behind each architectural choice as we go (chunking strategy, why overlap matters, why top-k retrieval), or do you already understand these and just want to build?

6.2. Do you want a checklist you tick off yourself, or do you want to come back to me at each stage and have me review what you built before moving on?

6.3. Should I hold off on suggesting frameworks (LangChain/LlamaIndex) entirely until you ask, or is it fine if I flag when they'd help as we go, even if you're building raw for now?

---

*Once you've answered what you can, I'll turn this into the actual build spec — locking in the architecture and step order based on your answers instead of my assumptions.*