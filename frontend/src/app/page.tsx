"use client";
import { useEffect, useState } from "react";
import { getBooks, Book } from "@/lib/api";
import BookCard from "@/components/BookCard";

export default function Dashboard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filtered, setFiltered] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getBooks()
      .then((data) => { setBooks(data); setFiltered(data); })
      .catch(() => setError("Failed to load books. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  const genres = ["All", ...Array.from(new Set(books.map((b) => b.genre).filter(Boolean)))];

  useEffect(() => {
    let result = books;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((b) =>
        b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
      );
    }
    if (genre !== "All") result = result.filter((b) => b.genre === genre);
    setFiltered(result);
  }, [search, genre, books]);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: "40px" }}>
        <p style={{
          fontFamily: "var(--font-ui)",
          fontSize: "11px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: "8px",
        }}>
          Your Collection
        </p>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "42px",
          fontWeight: 700,
          color: "var(--text-primary)",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
        }}>
          The Reading Room
        </h1>
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: "15px",
          color: "var(--text-secondary)",
          marginTop: "10px",
          fontStyle: "italic",
        }}>
          {books.length > 0
            ? `${books.length} volumes illuminated by artificial intelligence`
            : "Awaiting books from the shelf..."}
        </p>

        {/* Decorative rule */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginTop: "20px",
        }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span style={{ color: "var(--wood)", fontSize: "16px" }}>✦</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>
      </div>

      {/* Search + filter shelf */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "20px 24px",
        marginBottom: "36px",
        boxShadow: "var(--shadow)",
        display: "flex",
        gap: "16px",
        flexWrap: "wrap" as const,
        alignItems: "center",
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
          <span style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            fontSize: "14px",
            pointerEvents: "none",
          }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              paddingLeft: "38px",
              paddingRight: "16px",
              paddingTop: "10px",
              paddingBottom: "10px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: "var(--text-primary)",
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--wood)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Genre filter */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
          {genres.slice(0, 8).map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              style={{
                padding: "7px 14px",
                borderRadius: "4px",
                border: `1px solid ${genre === g ? "var(--accent)" : "var(--border)"}`,
                background: genre === g ? "var(--accent)" : "transparent",
                color: genre === g ? "#F5EFE0" : "var(--text-secondary)",
                fontFamily: "var(--font-ui)",
                fontSize: "12px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (genre !== g) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--wood)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (genre !== g) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                }
              }}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Count */}
        {!loading && (
          <span style={{
            fontFamily: "var(--font-ui)",
            fontSize: "12px",
            color: "var(--text-muted)",
            marginLeft: "auto",
            whiteSpace: "nowrap",
          }}>
            {filtered.length} book{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "20px",
        }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                height: "340px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div style={{
                height: "6px",
                background: "var(--border)",
                animation: "pulse 1.5s ease infinite",
              }} />
              <div style={{ padding: "0" }}>
                <div style={{ height: "160px", background: "var(--bg-surface)" }} />
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ height: "14px", background: "var(--border)", borderRadius: "3px", width: "80%" }} />
                  <div style={{ height: "10px", background: "var(--border)", borderRadius: "3px", width: "50%" }} />
                  <div style={{ height: "10px", background: "var(--border)", borderRadius: "3px", width: "40%" }} />
                  <div style={{ height: "32px", background: "var(--border)", borderRadius: "3px" }} />
                </div>
              </div>
              <style>{`@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }`}</style>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(139, 32, 32, 0.08)",
          border: "1px solid rgba(139, 32, 32, 0.3)",
          borderRadius: "8px",
          padding: "20px 24px",
          color: "var(--spine-red)",
          fontFamily: "var(--font-body)",
          fontSize: "14px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}>
          <span>📕</span>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "80px 20px",
          color: "var(--text-muted)",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontSize: "22px",
            color: "var(--text-secondary)",
            marginBottom: "8px",
          }}>
            No volumes found
          </h3>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontStyle: "italic" }}>
            Try a different search or browse all genres
          </p>
        </div>
      )}

      {/* Books grid — styled as bookshelf rows */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "20px",
        }}>
          {filtered.map((book, i) => (
            <div
              key={book.id}
              style={{
                opacity: 0,
                animation: "fadeInUp 0.4s ease forwards",
                animationDelay: `${Math.min(i * 0.04, 0.4)}s`,
              }}
            >
              <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }`}</style>
              <BookCard book={book} index={i} />
            </div>
          ))}
        </div>
      )}

      {/* Shelf bottom row decoration */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{
          marginTop: "48px",
          height: "8px",
          background: `linear-gradient(to right, var(--wood-dark), var(--wood) 15%, var(--wood-light) 50%, var(--wood) 85%, var(--wood-dark))`,
          borderRadius: "4px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }} />
      )}
    </div>
  );
}