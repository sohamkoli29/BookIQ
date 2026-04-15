"""
scraper.py
──────────
Selenium-based scraper for https://books.toscrape.com

Two main functions:
  scrape_single_book(url)  → scrape one book by URL
  scrape_all_books(max_pages) → bulk scrape multiple catalogue pages

Each scraped book is immediately saved to the MySQL database via Django ORM.
"""

import time
import django
import os
import sys

# ── Django setup (needed when running scraper as standalone script) ──
# This lets us use Django models outside of a Django request
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from selenium import webdriver

from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


from books.models import Book
from scraper.parser import parse_book_list_page, parse_book_detail_page

# ── Constants ────────────────────────────────────────────────────────
BASE_URL = "https://books.toscrape.com"
CATALOGUE_URL = f"{BASE_URL}/catalogue/page-{{page}}.html"
WAIT_TIMEOUT = 10       # seconds to wait for page elements
PAGE_LOAD_DELAY = 1.5   # polite delay between requests


def get_driver() -> webdriver.Chrome:
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    # No Service() — Selenium 4.6+ manages chromedriver automatically
    driver = webdriver.Chrome(options=options)
    return driver


def get_page_html(driver: webdriver.Chrome, url: str) -> str:
    """
    Navigates to a URL and returns the full page HTML.
    Waits until <body> is loaded before returning.
    """
    driver.get(url)
    WebDriverWait(driver, WAIT_TIMEOUT).until(
        EC.presence_of_element_located((By.TAG_NAME, "body"))
    )
    time.sleep(PAGE_LOAD_DELAY)   # Polite delay
    return driver.page_source


def save_book_to_db(book_data: dict) -> tuple[Book, bool]:
    """
    Saves a book dict to the database using Django ORM.
    Uses get_or_create to avoid duplicates.

    Returns:
        (book_instance, created)  — created=True if new, False if already exists
    """
    book, created = Book.objects.get_or_create(
        book_url=book_data["book_url"],
        defaults={
            "title":           book_data.get("title", ""),
            "author":          book_data.get("author", "Unknown"),
            "rating":          book_data.get("rating"),
            "num_reviews":     book_data.get("num_reviews", 0),
            "price":           book_data.get("price", ""),
            "availability":    book_data.get("availability", ""),
            "description":     book_data.get("description", ""),
            "cover_image_url": book_data.get("cover_image_url", ""),
        }
    )
    return book, created


def scrape_single_book(url: str) -> Book | None:
    """
    Scrapes a single book detail page by URL.
    Saves it to the database and returns the Book instance.

    Args:
        url : full URL of the book detail page

    Returns:
        Book instance or None if failed
    """
    print(f"\n[Scraper] Scraping single book: {url}")
    driver = get_driver()

    try:
        # ── Get detail page ────────────────────────────────────────
        html = get_page_html(driver, url)
        detail = parse_book_detail_page(html)

        # ── Also get listing info (title, rating, price) ───────────
        # We navigate to the catalogue to find the matching card
        # For a single book, we parse what's available on its detail page
        soup_data = _extract_detail_page_basics(driver.page_source, url)

        # ── Merge both data sources ────────────────────────────────
        book_data = {**soup_data, **detail, "book_url": url}

        # ── Save to DB ─────────────────────────────────────────────
        book, created = save_book_to_db(book_data)

        if created:
            print(f"[Scraper] ✅ Saved new book: {book.title}")
        else:
            print(f"[Scraper] ⚠️  Book already exists: {book.title}")

        return book

    except Exception as e:
        print(f"[Scraper] ❌ Error scraping {url}: {e}")
        return None

    finally:
        driver.quit()


def _extract_detail_page_basics(html: str, url: str) -> dict:
    """
    Extracts basic info (title, rating, price, image) directly
    from the book detail page HTML using BeautifulSoup.
    """
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    data = {"book_url": url}

    # Title
    title_tag = soup.select_one("div.product_main h1")
    data["title"] = title_tag.text.strip() if title_tag else "Unknown"

    # Rating
    rating_tag = soup.select_one("p.star-rating")
    rating_word = rating_tag["class"][1] if rating_tag else "One"
    rating_map = {"One": 1.0, "Two": 2.0, "Three": 3.0, "Four": 4.0, "Five": 5.0}
    data["rating"] = rating_map.get(rating_word, 0.0)

    # Price
    price_tag = soup.select_one("p.price_color")
    data["price"] = price_tag.text.strip() if price_tag else ""

    # Availability
    avail_tag = soup.select_one("p.availability")
    data["availability"] = avail_tag.text.strip() if avail_tag else ""

    # Cover image
    img_tag = soup.select_one("div.item.active img")
    if img_tag:
        src = img_tag["src"].replace("../../", "")
        data["cover_image_url"] = f"{BASE_URL}/{src}"
    else:
        data["cover_image_url"] = ""

    return data


def scrape_all_books(max_pages: int = 5) -> list[Book]:
    """
    Bulk scraper — scrapes multiple catalogue pages.
    For each book found, also visits its detail page for description.

    Args:
        max_pages : how many catalogue pages to scrape (each has 20 books)
                    Default = 5 pages = ~100 books

    Returns:
        List of saved Book instances
    """
    print(f"\n[Scraper] Starting bulk scrape — {max_pages} pages (~{max_pages * 20} books)")
    driver = get_driver()
    saved_books = []

    try:
        for page_num in range(1, max_pages + 1):
            page_url = CATALOGUE_URL.format(page=page_num)
            print(f"\n[Scraper] 📄 Scraping catalogue page {page_num}: {page_url}")

            # ── Get catalogue page ─────────────────────────────────
            html = get_page_html(driver, page_url)
            book_list = parse_book_list_page(html, BASE_URL)
            print(f"[Scraper] Found {len(book_list)} books on page {page_num}")

            # ── Visit each book's detail page ──────────────────────
            for i, book_basic in enumerate(book_list):
                book_url = book_basic["book_url"]

                # Skip if already in DB
                if Book.objects.filter(book_url=book_url).exists():
                    print(f"[Scraper]   [{i+1}/{len(book_list)}] Already exists, skipping: {book_basic['title']}")
                    continue

                try:
                    # Get detail page for description + reviews
                    detail_html = get_page_html(driver, book_url)
                    detail = parse_book_detail_page(detail_html)

                    # Merge basic info with detail info
                    book_data = {**book_basic, **detail}

                    # Save to database
                    book, created = save_book_to_db(book_data)

                    if created:
                        saved_books.append(book)
                        print(f"[Scraper]   [{i+1}/{len(book_list)}] ✅ Saved: {book.title}")
                    else:
                        print(f"[Scraper]   [{i+1}/{len(book_list)}] ⚠️  Duplicate: {book.title}")

                except Exception as e:
                    print(f"[Scraper]   [{i+1}/{len(book_list)}] ❌ Error: {book_url} — {e}")
                    continue

        print(f"\n[Scraper] 🎉 Bulk scrape complete! Saved {len(saved_books)} new books.")
        return saved_books

    except Exception as e:
        print(f"[Scraper] ❌ Fatal error during bulk scrape: {e}")
        return saved_books

    finally:
        driver.quit()


# ── Run directly as a script ──────────────────────────────────────────
# Usage: python scraper/scraper.py
if __name__ == "__main__":
    # Default: scrape 3 pages = ~60 books
    scrape_all_books(max_pages=3)