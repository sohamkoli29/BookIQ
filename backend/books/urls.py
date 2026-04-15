from django.urls import path
from . import views

urlpatterns = [
    # ── GET APIs ────────────────────────────────────────────────
    # List all books
    path("books/", views.BookListView.as_view(), name="book-list"),

    # Get full detail of a single book
    path("books/<int:pk>/", views.BookDetailView.as_view(), name="book-detail"),

    # Get book recommendations related to a specific book
    path("books/<int:pk>/recommendations/", views.BookRecommendationsView.as_view(), name="book-recommendations"),

    # Get Q&A history (all or for a specific book)
    path("qa/history/", views.QAHistoryView.as_view(), name="qa-history"),

    # ── POST APIs ───────────────────────────────────────────────
    # Scrape + process a book (or trigger bulk scraping)
    path("books/upload/", views.BookUploadView.as_view(), name="book-upload"),

    # Ask a question using the RAG pipeline
    path("books/ask/", views.BookAskView.as_view(), name="book-ask"),
]