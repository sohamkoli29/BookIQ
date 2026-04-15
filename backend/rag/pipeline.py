"""
pipeline.py
───────────
Full RAG (Retrieval-Augmented Generation) pipeline.
"""

import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from openai import OpenAI
from rag.embeddings import search_similar
from books.models import QAHistory, Book

# ── LM Studio Client ─────────────────────────────────────────────────
client = OpenAI(
    base_url="http://127.0.0.1:1234/v1",
    api_key="lm-studio"
)

# Your Mistral model
MODEL = "mistralai/mistral-7b-instruct-v0.3"

def build_context(chunks: list[dict]) -> str:
    """Formats retrieved chunks into a readable context block for the LLM."""
    if not chunks:
        return "No relevant book information found."

    lines = ["Here are relevant excerpts from books in the database:\n"]

    for i, chunk in enumerate(chunks, 1):
        lines.append(f"[Source {i} — {chunk['book_title']}]")
        lines.append(chunk["chunk_text"])
        lines.append("")

    return "\n".join(lines)


def ask_question(question: str, book_id: int = None, n_chunks: int = 5) -> dict:
    """Full RAG pipeline: retrieves chunks → builds context → generates answer."""

    # ── Step 1: Check cache ───────────────────────────────────────
    existing = QAHistory.objects.filter(
        question__iexact=question.strip()
    ).first()

    if existing and (book_id is None or str(existing.book_id) == str(book_id)):
        print(f"[RAG] 💾 Cache hit for: '{question}'")
        return {
            "answer": existing.answer,
            "sources": existing.source_chunks,
            "cached": True,
            "qa_id": existing.id,
        }

    # ── Step 2: Similarity search ─────────────────────────────────
    print(f"[RAG] 🔍 Searching for: '{question}'")
    chunks = search_similar(query=question, n_results=n_chunks, book_id=book_id)

    if not chunks:
        return {
            "answer": "I couldn't find relevant information in the book database to answer that question.",
            "sources": [],
            "cached": False,
        }

    # ── Step 3: Build context ─────────────────────────────────────
    context = build_context(chunks)

    # ── Step 4: Generate answer via LM Studio (Mistral-compatible) ─
    # CRITICAL: Mistral doesn't support system role - combine everything into user message
    
    # Format for Mistral Instruct
    user_prompt = f"""[INST] You are a knowledgeable book assistant. Answer questions about books using ONLY the provided context.

Rules:
- Base your answer strictly on the context provided
- Cite sources by mentioning the book title (e.g., "According to 'Book Title'...")
- If the context doesn't contain enough info, say so honestly
- Keep answers concise but complete (3-5 sentences max)
- Do not make up information

Context:
{context}

Question: {question}

Answer based on the context above: [/INST]"""

    try:
        print(f"[RAG] 🤖 Calling LM Studio with model: {MODEL}")
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=400,
            temperature=0.2,
        )
        answer = response.choices[0].message.content.strip()
        print(f"[RAG] ✅ Got answer from LM Studio ({len(answer)} chars)")
    except Exception as e:
        print(f"[RAG] ❌ LM Studio error: {e}")
        answer = f"Sorry, I couldn't generate an answer right now. Please make sure LM Studio is running on port 1234 with the Mistral model loaded. Error: {str(e)[:100]}"

    # ── Step 5: Format source citations ──────────────────────────
    sources = [
        {
            "book_title": c["book_title"],
            "book_id": c["book_id"],
            "chunk_text": c["chunk_text"][:200] + "..." if len(c["chunk_text"]) > 200 else c["chunk_text"],
            "similarity_score": c["similarity_score"],
        }
        for c in chunks
    ]

    # ── Step 6: Save to QA history ───────────────────────────────
    book_instance = None
    if book_id:
        try:
            book_instance = Book.objects.get(pk=book_id)
        except Book.DoesNotExist:
            pass

    qa_entry = QAHistory.objects.create(
        question=question.strip(),
        answer=answer,
        book=book_instance,
        source_chunks=sources,
    )

    print(f"[RAG] ✅ Answer generated and cached (QA ID: {qa_entry.id})")

    return {
        "answer": answer,
        "sources": sources,
        "cached": False,
        "qa_id": qa_entry.id,
    }


# ── Run directly for testing ──────────────────────────────────────────
if __name__ == "__main__":
    # Test with a simple question
    print("Testing RAG pipeline with Mistral...")
    result = ask_question("What books are available?")
    print("\n=== ANSWER ===")
    print(result["answer"])
    print("\n=== SOURCES ===")
    for s in result["sources"]:
        print(f"  - {s['book_title']} (score: {s['similarity_score']})")