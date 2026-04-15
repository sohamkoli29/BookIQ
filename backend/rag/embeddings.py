"""
embeddings.py
─────────────
Handles ChromaDB vector store setup and embedding operations.
Uses sentence-transformers for local embeddings (no API key needed).

Functions:
  get_chroma_collection()  → returns the ChromaDB collection
  embed_book(book)         → chunks + embeds a book's description
  search_similar(query, n) → returns top-N similar chunks
"""

import os
import uuid
import django
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

import chromadb
from chromadb.utils import embedding_functions
from django.conf import settings
from books.models import Book, BookChunk

# ── ChromaDB Setup ───────────────────────────────────────────────────
# Persistent client — data survives restarts
chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)

# Use sentence-transformers for local embeddings (free, no API needed)
# Model: all-MiniLM-L6-v2 is fast and good for semantic search
embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

COLLECTION_NAME = "book_chunks"


def get_chroma_collection():
    """
    Returns (or creates) the ChromaDB collection for book chunks.
    """
    return chroma_client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_fn,
        metadata={"hnsw:space": "cosine"}  # cosine similarity for semantic search
    )


def chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> list[str]:
    """
    Splits text into overlapping chunks for better RAG coverage.
    
    Args:
        text       : the text to split
        chunk_size : target size of each chunk (in characters)
        overlap    : how many characters to overlap between chunks
    
    Returns:
        List of text chunks
    """
    if not text or len(text) < chunk_size:
        return [text] if text else []

    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size

        # Try to break at a sentence boundary (period + space)
        if end < len(text):
            # Look for a good break point within the last 100 chars of the chunk
            break_point = text.rfind(". ", start, end)
            if break_point != -1 and break_point > start + (chunk_size // 2):
                end = break_point + 1  # Include the period

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # Move forward with overlap
        start = end - overlap if end - overlap > start else end

    return chunks


def embed_book(book: Book) -> int:
    """
    Chunks the book's description + summary, embeds them, and stores
    in both ChromaDB (vectors) and MySQL (BookChunk table).

    Args:
        book : Book model instance

    Returns:
        Number of chunks created
    """
    collection = get_chroma_collection()

    # Combine description and summary for richer embedding
    full_text = ""
    if book.description:
        full_text += f"Title: {book.title}\nDescription: {book.description}\n"
    if book.summary:
        full_text += f"Summary: {book.summary}\n"
    if book.genre:
        full_text += f"Genre: {book.genre}\n"

    if not full_text.strip():
        print(f"[Embed] ⚠️  No text to embed for '{book.title}'")
        return 0

    # Split into chunks
    chunks = chunk_text(full_text, chunk_size=400, overlap=50)
    print(f"[Embed] 📦 {len(chunks)} chunks for '{book.title}'")

    # Delete existing chunks for this book first (avoid duplicates on re-run)
    existing_chunks = BookChunk.objects.filter(book=book)
    if existing_chunks.exists():
        old_ids = list(existing_chunks.values_list("chroma_doc_id", flat=True))
        collection.delete(ids=old_ids)
        existing_chunks.delete()
        print(f"[Embed] 🗑️  Removed {len(old_ids)} old chunks")

    # Store chunks in ChromaDB and MySQL
    chroma_ids = []
    chroma_docs = []
    chroma_metadatas = []
    db_chunks = []

    for i, chunk in enumerate(chunks):
        doc_id = f"book_{book.id}_chunk_{i}_{uuid.uuid4().hex[:8]}"

        chroma_ids.append(doc_id)
        chroma_docs.append(chunk)
        chroma_metadatas.append({
            "book_id": str(book.id),
            "book_title": book.title[:100],  # ChromaDB metadata values must be strings
            "chunk_index": str(i),
            "genre": book.genre or "",
        })

        db_chunks.append(BookChunk(
            book=book,
            chunk_text=chunk,
            chunk_index=i,
            chroma_doc_id=doc_id
        ))

    # Batch insert into ChromaDB
    collection.add(
        ids=chroma_ids,
        documents=chroma_docs,
        metadatas=chroma_metadatas
    )

    # Batch insert into MySQL
    BookChunk.objects.bulk_create(db_chunks)

    print(f"[Embed] ✅ Embedded {len(chunks)} chunks for '{book.title}'")
    return len(chunks)


def search_similar(query: str, n_results: int = 5, book_id: int = None) -> list[dict]:
    """
    Finds the most semantically similar chunks for a given query.

    Args:
        query     : the user's question
        n_results : number of chunks to return
        book_id   : optional — filter results to a specific book

    Returns:
        List of dicts with chunk text, book title, book_id, distance
    """
    collection = get_chroma_collection()

    # Build the where filter
    where = None
    if book_id:
        where = {"book_id": str(book_id)}

    try:
        results = collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where,
            include=["documents", "metadatas", "distances"]
        )
    except Exception as e:
        print(f"[Embed] ❌ Search failed: {e}")
        return []

    # Format results
    output = []
    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    for doc, meta, dist in zip(docs, metas, distances):
        output.append({
            "chunk_text": doc,
            "book_title": meta.get("book_title", "Unknown"),
            "book_id": meta.get("book_id", ""),
            "chunk_index": meta.get("chunk_index", "0"),
            "similarity_score": round(1 - dist, 4),  # Convert distance → similarity
        })

    return output


def embed_all_books(limit: int = 50):
    """
    Embeds all books that don't have chunks yet.
    """
    books = Book.objects.filter(chunks__isnull=True).distinct()[:limit]
    print(f"\n[Embed] Starting bulk embedding for {books.count()} books...")

    for book in books:
        try:
            embed_book(book)
        except Exception as e:
            print(f"[Embed] ❌ Error embedding '{book.title}': {e}")
            continue

    print(f"\n[Embed] 🎉 Bulk embedding complete!")


# ── Run directly ─────────────────────────────────────────────────────
if __name__ == "__main__":
    embed_all_books(limit=20)