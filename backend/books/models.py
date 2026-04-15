from django.db import models


class Book(models.Model):
    """
    Stores metadata for each scraped book.
    This is the main table that holds all book information.
    """

    # ── Core Info ──────────────────────────────────────────
    title = models.CharField(max_length=500)
    author = models.CharField(max_length=300, blank=True, default="Unknown")
    rating = models.FloatField(null=True, blank=True)          # e.g. 4.2
    num_reviews = models.IntegerField(null=True, blank=True)   # e.g. 120
    price = models.CharField(max_length=50, blank=True)        # e.g. "£12.99"
    availability = models.CharField(max_length=100, blank=True)

    # ── Description & URL ──────────────────────────────────
    description = models.TextField(blank=True, default="")
    # max_length=255 to stay within MySQL's unique index key limit (3072 bytes)
    book_url = models.CharField(max_length=255, unique=True)
    cover_image_url = models.CharField(max_length=255, blank=True)

    # ── AI Generated Insights ─────────────────────────────
    summary = models.TextField(blank=True, default="")           # AI summary
    genre = models.CharField(max_length=200, blank=True)         # AI genre prediction
    sentiment = models.CharField(max_length=50, blank=True)      # positive/negative/neutral

    # ── Timestamps ────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "books"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.rating}★)"


class BookChunk(models.Model):
    """
    Stores text chunks of each book for the RAG pipeline.
    Each book is split into smaller chunks, embedded, and stored in ChromaDB.
    This table keeps track of which chunks belong to which book.
    """

    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name="chunks"
    )

    # The actual text content of this chunk
    chunk_text = models.TextField()

    # Position of this chunk in the original document (for ordering)
    chunk_index = models.IntegerField(default=0)

    # ChromaDB document ID — used to look up the vector
    chroma_doc_id = models.CharField(max_length=200, unique=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "book_chunks"
        ordering = ["book", "chunk_index"]

    def __str__(self):
        return f"Chunk {self.chunk_index} of '{self.book.title}'"


class AIInsight(models.Model):
    """
    Stores AI-generated insights for each book separately.
    This allows us to regenerate or cache insights independently.
    """

    INSIGHT_TYPES = [
        ("summary", "Summary"),
        ("genre", "Genre Classification"),
        ("recommendation", "Recommendation"),
        ("sentiment", "Sentiment Analysis"),
    ]

    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name="insights"
    )

    insight_type = models.CharField(max_length=50, choices=INSIGHT_TYPES)
    content = models.TextField()                  # The actual AI output
    model_used = models.CharField(max_length=100, blank=True)  # e.g. "claude-3-haiku"

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_insights"
        # Each book should have at most one insight of each type
        unique_together = ("book", "insight_type")

    def __str__(self):
        return f"{self.insight_type} for '{self.book.title}'"


class QAHistory(models.Model):
    """
    Saves chat/Q&A history for each question asked by the user.
    Bonus: avoids repeated AI calls for the same question (caching).
    """

    question = models.TextField()
    answer = models.TextField()

    # Which book this question was about (optional — can be global)
    book = models.ForeignKey(
        Book,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="qa_history"
    )

    # Source chunks used to generate this answer
    source_chunks = models.JSONField(default=list)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "qa_history"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Q: {self.question[:60]}..."