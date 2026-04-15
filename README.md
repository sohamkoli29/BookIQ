# 📚 BookIQ — Intelligent Book Intelligence Platform

> A full-stack AI-powered book library with RAG-based Q&A, genre classification, sentiment analysis, and semantic search — built with Django REST Framework, Next.js, ChromaDB, and LM Studio.

---

## 🖼️ Screenshots


| Dashboard / Book Shelf | Book Detail Page |
|---|---|
| ![Dashboard](screenshots/dashboard.png) | ![Book Detail](screenshots/book-detail.png) |

| Ask the Oracle (Q&A) | Light Mode |
|---|---|
| ![Ask](screenshots/ask-oracle.png) | ![Light Mode](screenshots/light-mode.png) |

---

## 🗂️ Project Structure

```
book-intelligence/
├── backend/
│   ├── ai/
│   │   └── insights.py          # LM Studio AI insight generation
│   ├── books/
│   │   ├── models.py            # Book, BookChunk, AIInsight, QAHistory
│   │   ├── serializers.py       # DRF serializers
│   │   ├── views.py             # REST API views
│   │   └── urls.py              # API routes
│   ├── core/
│   │   ├── settings.py          # Django settings
│   │   └── urls.py              # Root URL config
│   ├── rag/
│   │   ├── embeddings.py        # ChromaDB + sentence-transformers
│   │   └── pipeline.py          # Full RAG pipeline
│   ├── scraper/
│   │   ├── scraper.py           # Selenium scraper
│   │   └── parser.py            # BeautifulSoup HTML parser
│   └── manage.py
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx         # Dashboard / Book Listing
│       │   ├── ask/page.tsx     # Q&A Interface
│       │   └── books/[id]/page.tsx  # Book Detail
│       ├── components/
│       │   ├── BookCard.tsx
│       │   ├── Navbar.tsx
│       │   └── LampToggle.tsx   # Dark/Light mode lamp toggle
│       └── lib/
│           ├── api.ts           # Axios API client
│           └── theme.tsx        # Theme context
└── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL 8+
- Google Chrome + ChromeDriver (Selenium)
- [LM Studio](https://lmstudio.ai/) with a loaded model (e.g. Mistral, Llama)

---

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/book-intelligence.git
cd book-intelligence
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### Create `.env` file in `backend/`

```env
SECRET_KEY=your-secret-key-here
DEBUG=True

# MySQL
DB_NAME=book_intelligence
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306

# LM Studio
LM_STUDIO_BASE_URL=http://localhost:1234/v1
LM_STUDIO_MODEL=mistral-7b-instruct   # Match your loaded model name in LM Studio

# ChromaDB
CHROMA_PERSIST_DIR=./chroma_db
```

#### Create MySQL Database

```sql
CREATE DATABASE book_intelligence CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

#### Create Admin User (Optional)

```bash
python manage.py createsuperuser
```

#### Start the Backend Server

```bash
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

---

### 3. LM Studio Setup

1. Download and install [LM Studio](https://lmstudio.ai/)
2. Download a model  **Mistral 7B Instruct** 
3. Go to **Local Server** tab → Start server on port `1234`
4. Note the model name shown — set it as `LM_STUDIO_MODEL` in your `.env`

---

### 4. Scrape Books

```bash
# From backend/ directory with venv activated

# Option A: Scrape via API (POST)
curl -X POST http://localhost:8000/api/books/upload/

# Option B: Run scraper directly (scrapes 3 pages ≈ 60 books)
python scraper/scraper.py

# Option C: Generate AI insights for existing books
python ai/insights.py

# Option D: Embed all books into ChromaDB
python rag/embeddings.py
```

---

### 5. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 📡 API Documentation

Base URL: `http://localhost:8000/api`

### GET Endpoints

| Endpoint | Description | Response |
|---|---|---|
| `GET /books/` | List all books | `{ count, books[] }` |
| `GET /books/<id>/` | Get single book with AI insights | Full book object + insights |
| `GET /books/<id>/recommendations/` | Get similar books by genre | `{ based_on, genre, recommendations[] }` |
| `GET /qa/history/` | Get Q&A history | `{ count, history[] }` |
| `GET /qa/history/?book_id=<id>` | Q&A history for a specific book | Filtered history |

### POST Endpoints

| Endpoint | Body | Description |
|---|---|---|
| `POST /books/upload/` | `{}` | Bulk scrape (3 pages) |
| `POST /books/upload/` | `{ "book_url": "https://..." }` | Scrape single book |
| `POST /books/ask/` | `{ "question": "..." }` | Ask a question (RAG) |
| `POST /books/ask/` | `{ "question": "...", "book_id": 1 }` | Ask about a specific book |

### Example Requests

```bash
# List all books
curl http://localhost:8000/api/books/

# Get book detail
curl http://localhost:8000/api/books/1/

# Ask a question
curl -X POST http://localhost:8000/api/books/ask/ \
  -H "Content-Type: application/json" \
  -d '{"question": "What books are about self improvement?"}'

# Scrape a single book
curl -X POST http://localhost:8000/api/books/upload/ \
  -H "Content-Type: application/json" \
  -d '{"book_url": "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html"}'
```

---

## 💬 Sample Questions & Answers

### Q: "What books are about self improvement?"

**Answer:**
> Based on the context, books related to self-improvement include titles like *"The Subtle Art of Not Giving a F*ck"* and *"You Are a Badass"*. According to the library, these books focus on mindset shifts and practical strategies for personal growth.

**Sources:** 2 chunks matched with 87%+ similarity

---

### Q: "Are there any mystery books with high ratings?"

**Answer:**
> The library contains several mystery titles with strong ratings. According to the database, books in the Mystery genre average around 4.0–4.5 stars, with titles exploring detective fiction and psychological suspense.

---

### Q: "Recommend a book similar to a fantasy novel"

**Answer:**
> Based on genre similarity, if you enjoy fantasy, you might explore titles categorized under the same genre. The recommendation engine identifies books sharing the Fantasy genre tag from the collection.

---

## ✨ Features

### Core Features
- 🔍 **Selenium-based web scraper** — scrapes books.toscrape.com across multiple pages
- 🧠 **AI Insight Generation** — Summary, Genre Classification, and Sentiment Analysis via LM Studio
- 📦 **RAG Pipeline** — ChromaDB vector store + sentence-transformers + LLM answer generation
- 💬 **Q&A with source citations** — Answers grounded in actual book chunks
- 🗄️ **QA Caching** — Repeated questions served from cache (no redundant LLM calls)
- 📚 **Book Recommendations** — Genre-based similarity recommendations
- 🌗 **Dark / Light Mode** — Animated lamp toggle with bookshelf theme

### Bonus Features Implemented
- ✅ **QA Response Caching** — `QAHistory` table caches all answers
- ✅ **Overlapping chunk strategy** — 400-char chunks with 50-char overlap for better RAG coverage
- ✅ **Bulk scraping pipeline** — Multi-page scraping with polite delays
- ✅ **Vector similarity search** — ChromaDB cosine similarity with score display
- ✅ **Loading skeletons + UX polish** — Skeleton loaders, fade-in animations, stagger effects
- ✅ **Chat history** — Full Q&A history persisted in MySQL and displayed in the UI
- ✅ **Smart deduplication** — `get_or_create` prevents duplicate books on re-scrape

---

## 🗄️ Database Schema

### `books` table
| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| title | VARCHAR(500) | Book title |
| author | VARCHAR(300) | Author name |
| rating | FLOAT | Star rating (1.0–5.0) |
| num_reviews | INT | Number of reviews |
| price | VARCHAR(50) | Price string (e.g. £12.99) |
| availability | VARCHAR(100) | Stock status |
| description | TEXT | Full book description |
| book_url | VARCHAR(255) | Source URL (unique) |
| cover_image_url | VARCHAR(255) | Cover image URL |
| summary | TEXT | AI-generated summary |
| genre | VARCHAR(200) | AI-predicted genre |
| sentiment | VARCHAR(50) | positive / negative / neutral |
| created_at | DATETIME | Record creation timestamp |

### `ai_insights` table
Stores individual AI outputs per book — allows regeneration per insight type without touching others.

### `book_chunks` table
Maps text chunks to their ChromaDB vector IDs for RAG retrieval.

### `qa_history` table
Caches all questions and answers with linked source chunks for display and deduplication.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 4.2, Django REST Framework |
| Database | MySQL 8 (metadata), ChromaDB (vectors) |
| AI / LLM | LM Studio (local), OpenAI-compatible API |
| Embeddings | `sentence-transformers` — `all-MiniLM-L6-v2` |
| Scraping | Selenium 4 + BeautifulSoup4 |
| Frontend | Next.js 15, React 18, TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| HTTP Client | Axios |

---

## 📋 Requirements

### `backend/requirements.txt`
```
django>=4.2
djangorestframework>=3.14
django-cors-headers>=4.0
mysqlclient>=2.1
python-dotenv>=1.0
openai>=1.0
chromadb>=0.4
sentence-transformers>=2.2
selenium>=4.10
beautifulsoup4>=4.12
```

---

## 🚀 Running Everything Together

```bash
# Terminal 1 — LM Studio
# Start LM Studio, load a model, and start the local server on port 1234

# Terminal 2 — Django backend
cd backend
source venv/bin/activate
python manage.py runserver

# Terminal 3 — Next.js frontend
cd frontend
npm run dev

# Terminal 4 — Scrape books (one-time setup)
cd backend
source venv/bin/activate
python scraper/scraper.py
```

Then visit `http://localhost:3000` 🎉

---

## 🛠️ Admin Panel

Access the Django admin at `http://localhost:8000/admin/` to browse and manage all books, insights, chunks, and Q&A history directly.

---

## 📝 Notes

- LM Studio must be running with a model loaded **before** scraping or asking questions
- The scraper targets `https://books.toscrape.com` — a legal, public scraping practice site
- ChromaDB data is persisted locally in `backend/chroma_db/`
- The `all-MiniLM-L6-v2` embedding model is downloaded automatically on first run (~80MB)

---

*Built for the Document Intelligence Platform Assignment — April 2026*
