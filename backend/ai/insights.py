"""
insights.py
───────────
Uses LM Studio (local LLM) to generate AI insights for books.
LM Studio exposes an OpenAI-compatible API at http://localhost:1234

Three functions:
  generate_summary(book)   → 2-3 sentence summary
  generate_genre(book)     → genre classification
  generate_sentiment(book) → positive / negative / neutral
"""

import django
import os
import sys
import time
from openai import OpenAI  # LM Studio uses OpenAI-compatible API

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from books.models import Book, AIInsight

# ── LM Studio Client ─────────────────────────────────────────────────
# LM Studio runs locally — no real API key needed, just "lm-studio"
client = OpenAI(
    base_url="http://127.0.0.1:1234/v1",
    api_key="lm-studio"
)

# The model name shown in LM Studio's "Local Server" tab
# Change this to match whatever model you have loaded in LM Studio
MODEL = os.getenv("LM_STUDIO_MODEL")


def _call_llm(prompt: str, max_tokens: int = 300, system_prompt: str = None) -> str:
    # Mistral format with [INST] tags
    if system_prompt:
        full_prompt = f"[INST] {system_prompt}\n\n{prompt} [/INST]"
    else:
        full_prompt = f"[INST] {prompt} [/INST]"

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "user", "content": full_prompt}
            ],
            max_tokens=max_tokens,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[LM Studio] ❌ API call failed: {e}")
        print("[LM Studio] Make sure LM Studio is running with a model loaded on port 1234")
        raise


def _save_insight(book: Book, insight_type: str, content: str):
    """
    Saves or updates an AIInsight row for a book.
    Also updates the shortcut field on the Book model.
    """
    AIInsight.objects.update_or_create(
        book=book,
        insight_type=insight_type,
        defaults={
            "content": content,
            "model_used": MODEL,
        }
    )

    # Update shortcut field on Book model
    if insight_type == "summary":
        book.summary = content
    elif insight_type == "genre":
        book.genre = content
    elif insight_type == "sentiment":
        book.sentiment = content

    book.save()


def generate_summary(book: Book) -> str:
    if not book.description:
        return "No description available."

    result = _call_llm(
        prompt=f"Title: {book.title}\nDescription: {book.description}",
        max_tokens=200,
        system_prompt="Write a concise 2-3 sentence summary of the book. Return ONLY the summary, no extra text."
    )
    _save_insight(book, "summary", result)
    return result


def generate_genre(book: Book) -> str:
    """Classifies the book into a single genre."""

    prompt = f"""Classify this book into exactly ONE genre. Return ONLY the genre name, nothing else.

Title: {book.title}
Description: {book.description or 'Not available'}

Choose from: Fiction, Non-Fiction, Mystery, Romance, Science Fiction, Fantasy, Biography, Self-Help, History, Children, Horror, Thriller, Poetry, Philosophy, Other"""

    result = _call_llm(prompt, max_tokens=20)
    # Take only the first line/word in case model adds extra text
    result = result.split("\n")[0].strip().split(".")[0].strip()
    _save_insight(book, "genre", result)
    print(f"[AI] ✅ Genre for '{book.title}': {result}")
    return result


def generate_sentiment(book: Book) -> str:
    """Determines the overall sentiment of the book's description."""

    if not book.description:
        return "neutral"

    prompt = f"""Analyze the tone of this book description. Return ONLY one word: positive, negative, or neutral.

Title: {book.title}
Description: {book.description}"""

    result = _call_llm(prompt, max_tokens=10).lower().strip()

    # Sanitize — ensure valid value
    if "positive" in result:
        result = "positive"
    elif "negative" in result:
        result = "negative"
    else:
        result = "neutral"

    _save_insight(book, "sentiment", result)
    print(f"[AI] ✅ Sentiment for '{book.title}': {result}")
    return result


def generate_all_insights(book: Book):
    """Runs all three insight generators for a single book."""
    print(f"\n[AI] Generating insights for: {book.title}")
    generate_summary(book)
    generate_genre(book)
    generate_sentiment(book)


def run_bulk_insights(limit: int = 10):
    books = Book.objects.filter(summary="").order_by("created_at")[:limit]
    print(f"\n[AI] Running bulk insights for {books.count()} books...")

    for book in books:
        try:
            generate_all_insights(book)
            time.sleep(1)  # ← give LM Studio breathing room
        except Exception as e:
            print(f"[AI] ❌ Error for '{book.title}': {e}")
            continue

    print(f"\n[AI] 🎉 Bulk insights complete!")


# ── Run directly ─────────────────────────────────────────────────────
if __name__ == "__main__":
    run_bulk_insights(limit=10)