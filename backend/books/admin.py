from django.contrib import admin
from .models import Book, BookChunk, AIInsight, QAHistory


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    """Admin view for Books — shows key fields in list view"""
    list_display = ["title", "author", "rating", "genre", "sentiment", "created_at"]
    search_fields = ["title", "author", "genre"]
    list_filter = ["genre", "sentiment"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(BookChunk)
class BookChunkAdmin(admin.ModelAdmin):
    """Admin view for BookChunks"""
    list_display = ["book", "chunk_index", "chroma_doc_id"]
    search_fields = ["book__title"]


@admin.register(AIInsight)
class AIInsightAdmin(admin.ModelAdmin):
    """Admin view for AI Insights"""
    list_display = ["book", "insight_type", "model_used", "created_at"]
    list_filter = ["insight_type"]
    search_fields = ["book__title"]


@admin.register(QAHistory)
class QAHistoryAdmin(admin.ModelAdmin):
    """Admin view for Q&A history"""
    list_display = ["question", "book", "created_at"]
    search_fields = ["question"]
    readonly_fields = ["created_at"]