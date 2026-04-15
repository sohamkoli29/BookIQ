from rest_framework import serializers
from .models import Book, BookChunk, AIInsight, QAHistory


class AIInsightSerializer(serializers.ModelSerializer):
    """Serializes AI insight objects (summary, genre, etc.)"""

    class Meta:
        model = AIInsight
        fields = ["id", "insight_type", "content", "model_used", "created_at"]


class BookChunkSerializer(serializers.ModelSerializer):
    """Serializes individual text chunks of a book"""

    class Meta:
        model = BookChunk
        fields = ["id", "chunk_index", "chunk_text", "chroma_doc_id"]


class BookListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing all books.
    Used in the dashboard/book listing page.
    Does NOT include chunks (too heavy for a list view).
    """

    class Meta:
        model = Book
        fields = [
            "id",
            "title",
            "author",
            "rating",
            "num_reviews",
            "price",
            "availability",
            "description",
            "book_url",
            "cover_image_url",
            "genre",
            "sentiment",
            "created_at",
        ]


class BookDetailSerializer(serializers.ModelSerializer):
    """
    Full serializer for a single book detail page.
    Includes AI insights and chunk count.
    """

    # Nest all insights inside the book response
    insights = AIInsightSerializer(many=True, read_only=True)

    # Count of chunks (useful for showing RAG readiness)
    chunk_count = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            "id",
            "title",
            "author",
            "rating",
            "num_reviews",
            "price",
            "availability",
            "description",
            "book_url",
            "cover_image_url",
            "summary",
            "genre",
            "sentiment",
            "insights",
            "chunk_count",
            "created_at",
            "updated_at",
        ]

    def get_chunk_count(self, obj):
        """Returns the number of text chunks stored for this book"""
        return obj.chunks.count()


class BookCreateSerializer(serializers.ModelSerializer):
    """
    Used when uploading/creating a new book via the POST API.
    Only requires the book_url — everything else is scraped/generated.
    """

    class Meta:
        model = Book
        fields = ["book_url"]

    def validate_book_url(self, value):
        """Make sure the URL starts with http"""
        if not value.startswith("http"):
            raise serializers.ValidationError("Please provide a valid URL starting with http.")
        return value


class QAHistorySerializer(serializers.ModelSerializer):
    """Serializes question-answer history entries"""

    book_title = serializers.SerializerMethodField()

    class Meta:
        model = QAHistory
        fields = [
            "id",
            "question",
            "answer",
            "book",
            "book_title",
            "source_chunks",
            "created_at",
        ]

    def get_book_title(self, obj):
        """Return the book title if a book is linked"""
        return obj.book.title if obj.book else None


class QuestionSerializer(serializers.Serializer):
    """
    Serializer for incoming RAG question requests.
    Not tied to a model — just validates the request body.
    """

    question = serializers.CharField(
        max_length=1000,
        help_text="The question to ask about the books"
    )

    book_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Optional: limit search to a specific book by ID"
    )