"""
parser.py
─────────
Uses BeautifulSoup to extract structured book data from raw HTML pages.
Two parsers:
  1. parse_book_list_page  → extracts all book cards from a catalogue page
  2. parse_book_detail_page → extracts full info from a single book page
"""

from bs4 import BeautifulSoup


# Mapping from text rating to number
RATING_MAP = {
    "One": 1.0,
    "Two": 2.0,
    "Three": 3.0,
    "Four": 4.0,
    "Five": 5.0,
}


def parse_book_list_page(html: str, base_url: str) -> list[dict]:
    """
    Parses a catalogue/listing page and returns a list of basic book info dicts.
    Each dict contains: title, rating, price, book_url, cover_image_url

    Args:
        html      : raw HTML string of the catalogue page
        base_url  : base URL of the site (e.g. https://books.toscrape.com)

    Returns:
        List of dicts with partial book info
    """
    soup = BeautifulSoup(html, "html.parser")
    books = []

    # Each book card is inside <article class="product_pod">
    for article in soup.select("article.product_pod"):
        try:
            # ── Title ──────────────────────────────────────────────
            title_tag = article.select_one("h3 > a")
            title = title_tag["title"] if title_tag else "Unknown Title"

            # ── Relative URL → Absolute URL ────────────────────────
            relative_url = title_tag["href"] if title_tag else ""
            # Remove leading "../" patterns
            relative_url = relative_url.replace("../", "")
            book_url = f"{base_url}/catalogue/{relative_url}"

            # ── Cover Image ────────────────────────────────────────
            img_tag = article.select_one("img.thumbnail")
            img_src = img_tag["src"] if img_tag else ""
            img_src = img_src.replace("../", "")
            cover_image_url = f"{base_url}/{img_src}"

            # ── Rating ─────────────────────────────────────────────
            rating_tag = article.select_one("p.star-rating")
            rating_word = rating_tag["class"][1] if rating_tag else "One"
            rating = RATING_MAP.get(rating_word, 0.0)

            # ── Price ──────────────────────────────────────────────
            price_tag = article.select_one("p.price_color")
            price = price_tag.text.strip() if price_tag else ""

            # ── Availability ───────────────────────────────────────
            avail_tag = article.select_one("p.availability")
            availability = avail_tag.text.strip() if avail_tag else ""

            books.append({
                "title": title,
                "rating": rating,
                "price": price,
                "availability": availability,
                "book_url": book_url,
                "cover_image_url": cover_image_url,
            })

        except Exception as e:
            # Skip malformed book cards instead of crashing
            print(f"[Parser] Skipping a book card due to error: {e}")
            continue

    return books


def parse_book_detail_page(html: str) -> dict:
    """
    Parses a single book detail page and returns full book info.
    Extracts: description, author (UPC as fallback), num_reviews

    Args:
        html : raw HTML string of the book detail page

    Returns:
        Dict with description, author, num_reviews
    """
    soup = BeautifulSoup(html, "html.parser")
    detail = {}

    # ── Description ────────────────────────────────────────────────
    # The description is inside <div id="product_description"> followed by <p>
    desc_header = soup.find("div", id="product_description")
    if desc_header:
        desc_tag = desc_header.find_next_sibling("p")
        detail["description"] = desc_tag.text.strip() if desc_tag else ""
    else:
        detail["description"] = ""

    # ── Product Table (UPC, availability, num_reviews) ─────────────
    # The product info table has rows of <th> and <td>
    detail["author"] = "Unknown"
    detail["num_reviews"] = 0

    table = soup.select_one("table.table-striped")
    if table:
        rows = table.select("tr")
        for row in rows:
            header = row.select_one("th")
            value = row.select_one("td")
            if not header or not value:
                continue

            key = header.text.strip().lower()

            # Number of reviews
            if "number of reviews" in key:
                try:
                    detail["num_reviews"] = int(value.text.strip())
                except ValueError:
                    detail["num_reviews"] = 0

    return detail