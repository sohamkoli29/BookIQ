from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    # All book-related API routes will live under /api/
    path("api/", include("books.urls")),
]