"""
views.py
────────
All REST API views for the Book Intelligence Platform.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from scraper.scraper import scrape_single_book, scrape_all_books
from ai.insights import generate_all_insights
from rag.embeddings import embed_book
from rag.pipeline import ask_question

from .models import Book, QAHistory
from .serializers import (
    BookListSerializer,
    BookDetailSerializer,
    BookCreateSerializer,
    QuestionSerializer,
    QAHistorySerializer,
)


class BookListView(APIView):
    """
    GET /api/books/
    Returns a list of all books stored in the database.
    """
    def get(self, request):
        books = Book.objects.all()
        serializer = BookListSerializer(books, many=True)
        return Response({
            "count": books.count(),
            "books": serializer.data
        })


class BookDetailView(APIView):
    """
    GET /api/books/<id>/
    Returns full details of a single book including AI insights.
    """
    def get(self, request, pk):
        try:
            book = Book.objects.get(pk=pk)
        except Book.DoesNotExist:
            return Response({"error": "Book not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = BookDetailSerializer(book)
        return Response(serializer.data)


class BookRecommendationsView(APIView):
    """
    GET /api/books/<id>/recommendations/
    Returns books with the same genre as the given book.
    """
    def get(self, request, pk):
        try:
            book = Book.objects.get(pk=pk)
        except Book.DoesNotExist:
            return Response({"error": "Book not found."}, status=status.HTTP_404_NOT_FOUND)

        recommendations = Book.objects.filter(
            genre=book.genre
        ).exclude(pk=pk)[:5]

        serializer = BookListSerializer(recommendations, many=True)
        return Response({
            "based_on": book.title,
            "genre": book.genre,
            "recommendations": serializer.data
        })


class BookUploadView(APIView):
    """
    POST /api/books/upload/
    Scrapes a single book URL, or triggers bulk scraping if no URL given.
    After scraping: generates AI insights + embeds chunks into ChromaDB.
    """
    def post(self, request):
        book_url = request.data.get("book_url")

        if book_url:
            # Single book flow
            book = scrape_single_book(book_url)
            if not book:
                return Response({"error": "Scraping failed"}, status=500)

            try:
                generate_all_insights(book)
            except Exception as e:
                print(f"[View] AI insights error: {e}")

            try:
                embed_book(book)
            except Exception as e:
                print(f"[View] Embedding error: {e}")

            return Response({
                "message": f"Scraped, insights generated, and embedded: {book.title}",
                "book_id": book.id
            }, status=200)

        else:
            # Bulk scrape flow
            books = scrape_all_books(max_pages=3)
            results = {"success": 0, "ai_errors": 0, "embed_errors": 0}

            for book in books:
                try:
                    generate_all_insights(book)
                    results["success"] += 1
                except Exception as e:
                    print(f"[View] AI error for {book.title}: {e}")
                    results["ai_errors"] += 1

                try:
                    embed_book(book)
                except Exception as e:
                    print(f"[View] Embed error for {book.title}: {e}")
                    results["embed_errors"] += 1

            return Response({
                "message": f"Scraped {len(books)} books",
                "results": results
            }, status=200)


class BookAskView(APIView):
    """
    POST /api/books/ask/
    Runs the full RAG pipeline to answer a question about books.

    Request body:
      { "question": "...", "book_id": 1 (optional) }

    Response:
      { "answer": "...", "sources": [...], "cached": false }
    """
    def post(self, request):
        serializer = QuestionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        question = serializer.validated_data["question"]
        book_id = serializer.validated_data.get("book_id")

        try:
            result = ask_question(question=question, book_id=book_id)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"RAG pipeline error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class QAHistoryView(APIView):
    """
    GET /api/qa/history/
    Returns saved Q&A history, optionally filtered by book.
    """
    def get(self, request):
        book_id = request.query_params.get("book_id")

        if book_id:
            history = QAHistory.objects.filter(book_id=book_id)
        else:
            history = QAHistory.objects.all()[:50]

        serializer = QAHistorySerializer(history, many=True)
        return Response({
            "count": history.count(),
            "history": serializer.data
        })