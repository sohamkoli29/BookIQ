"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBook, getRecommendations, Book } from "@/lib/api";
import BookCard from "@/components/BookCard";

const SPINE_COLORS = [
  "#8B2020", "#1A3A5C", "#1C4A2A", "#5C3A1E",
  "#3A1A5C", "#4A2A10", "#1A4A3C", "#5C1A3A",
];

const SENTIMENT_STYLE: Record<string, { bg: string; color: string }> = {
  positive: { bg: "rgba(28, 74, 42, 0.1)", color: "#1C4A2A" },
  negative: { bg: "rgba(139, 32, 32, 0.1)", color: "#8B2020" },
  neutral:  { bg: "rgba(107, 76, 42, 0.1)", color: "var(--text-secondary)" },
};

export default function BookDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const bookId = Number(id);
    Promise.all([getBook(bookId), getRecommendations(bookId)])
      .then(([b, recs]) => { setBook(b); setRecommendations(recs); })
      .catch(() => setError("Failed to load book details."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {[300, 120, 200].map((h, i) => (
          <div key={i} style={{
            height: `${h}px`,
            background: "var(--bg-card)",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            animation: "pulse 1.5s ease infinite",
          }} />
        ))}
        <style>{`@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{
      background: "rgba(139, 32, 32, 0.08)",
      border: "1px solid rgba(139, 32, 32, 0.3)",
      borderRadius: "8px",
      padding: "20px 24px",
      color: "#8B2020",
      maxWidth: "600px",
    }}>
      {error}
    </div>
  );

  if (!book) return null;

  const spineColor = SPINE_COLORS[book.id % SPINE_COLORS.length];
  const sentiment = SENTIMENT_STYLE[book.sentiment] ?? SENTIMENT_STYLE.neutral;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Back */}
      <button
        onClick={() => router.back()}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-ui)",
          fontSize: "13px",
          color: "var(--text-muted)",
          padding: "4px 0",
          marginBottom: "28px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "color 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        ← Back to the shelf
      </button>

      {/* Main book card */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "var(--shadow)",
        marginBottom: "24px",
      }}>
        {/* Spine color header bar */}
        <div style={{
          height: "8px",
          background: spineColor,
          position: "relative",
        }}>
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, rgba(255,255,255,0.2), transparent 40%, rgba(0,0,0,0.15))",
          }} />
        </div>

        <div style={{ padding: "32px", display: "flex", gap: "32px", flexWrap: "wrap" as const }}>
          {/* Cover */}
          <div style={{ flexShrink: 0 }}>
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt={book.title}
                style={{
                  width: "130px",
                  height: "180px",
                  objectFit: "cover",
                  borderRadius: "4px",
                  boxShadow: "4px 4px 16px rgba(0,0,0,0.25)",
                  display: "block",
                }}
              />
            ) : (
              <div style={{
                width: "130px",
                height: "180px",
                background: spineColor,
                borderRadius: "4px",
                boxShadow: "4px 4px 16px rgba(0,0,0,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "8px",
                position: "relative",
              }}>
                <div style={{
                  position: "absolute",
                  left: 0,
                  top: "10px",
                  bottom: "10px",
                  width: "5px",
                  background: "#FAF6EE",
                  borderRadius: "0 2px 2px 0",
                }} />
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "28px" }}>✦</span>
                <span style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "9px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-ui)",
                  textAlign: "center",
                  padding: "0 8px",
                }}>
                  No Cover
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: "220px" }}>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "30px",
              fontWeight: 700,
              lineHeight: 1.2,
              color: "var(--text-primary)",
              marginBottom: "8px",
              letterSpacing: "-0.02em",
            }}>
              {book.title}
            </h1>

            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              color: "var(--text-secondary)",
              fontStyle: "italic",
              marginBottom: "20px",
            }}>
              {book.author || "Author unknown"}
            </p>

            {/* Meta row */}
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px", marginBottom: "20px" }}>
              {book.rating && (
                <span style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--wood)",
                  background: "rgba(160, 120, 74, 0.1)",
                  border: "1px solid rgba(160, 120, 74, 0.25)",
                  borderRadius: "4px",
                  padding: "4px 10px",
                }}>
                  ★ {book.rating} · {book.num_reviews ?? 0} reviews
                </span>
              )}
              {book.price && (
                <span style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  padding: "4px 10px",
                }}>
                  {book.price}
                </span>
              )}
              {book.genre && (
                <span style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase" as const,
                  padding: "4px 10px",
                  borderRadius: "4px",
                  background: `${spineColor}15`,
                  color: spineColor,
                  border: `1px solid ${spineColor}30`,
                }}>
                  {book.genre}
                </span>
              )}
              {book.sentiment && (
                <span style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase" as const,
                  padding: "4px 10px",
                  borderRadius: "4px",
                  background: sentiment.bg,
                  color: sentiment.color,
                  border: `1px solid ${sentiment.color}40`,
                }}>
                  {book.sentiment} tone
                </span>
              )}
            </div>

            {/* Source link */}
            {book.book_url && (
              <a
                href={book.book_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  borderBottom: "1px dotted var(--border)",
                  transition: "color 0.2s ease",
                }}
              >
                View original source ↗
              </a>
            )}
          </div>
        </div>
      </div>

      {/* AI Summary — styled like a journal entry */}
      {book.summary && (
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderLeft: `4px solid ${spineColor}`,
          borderRadius: "0 8px 8px 0",
          padding: "24px 28px",
          marginBottom: "24px",
          boxShadow: "var(--shadow)",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "160px",
            background: `radial-gradient(ellipse at right, ${spineColor}08, transparent)`,
            pointerEvents: "none",
          }} />
          <div style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: spineColor,
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span>✦</span> AI Summary
          </div>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "15px",
            color: "var(--text-primary)",
            lineHeight: 1.75,
            fontStyle: "italic",
          }}>
            {book.summary}
          </p>
        </div>
      )}

      {/* Full description */}
      {book.description && (
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "24px 28px",
          marginBottom: "24px",
          boxShadow: "var(--shadow)",
        }}>
          <div style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: "14px",
          }}>
            Description
          </div>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "15px",
            color: "var(--text-secondary)",
            lineHeight: 1.8,
          }}>
            {book.description}
          </p>
        </div>
      )}

      {/* Ask AI CTA */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "24px 28px",
        marginBottom: "40px",
        boxShadow: "var(--shadow)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        flexWrap: "wrap" as const,
      }}>
        <div>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontSize: "18px",
            color: "var(--text-primary)",
            marginBottom: "4px",
          }}>
            Have a question about this book?
          </h3>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--text-muted)",
            fontStyle: "italic",
          }}>
            Ask the AI anything — themes, characters, context, comparisons.
          </p>
        </div>
        <button
          onClick={() => router.push(`/ask?book_id=${book.id}&title=${encodeURIComponent(book.title)}`)}
          style={{
            background: "var(--accent)",
            color: "#F5EFE0",
            border: "none",
            borderRadius: "6px",
            padding: "12px 24px",
            fontFamily: "var(--font-ui)",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.04em",
            cursor: "pointer",
            transition: "background 0.2s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
        >
          Ask the AI →
        </button>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <div style={{ marginBottom: "24px" }}>
            <p style={{
              fontFamily: "var(--font-ui)",
              fontSize: "10px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: "6px",
            }}>
              More from the shelf
            </p>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "24px",
              color: "var(--text-primary)",
            }}>
              You might also enjoy
            </h2>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "16px",
          }}>
            {recommendations.map((rec) => (
              <BookCard key={rec.id} book={rec} />
            ))}
          </div>
          <div style={{
            marginTop: "36px",
            height: "6px",
            background: `linear-gradient(to right, var(--wood-dark), var(--wood) 15%, var(--wood-light) 50%, var(--wood) 85%, var(--wood-dark))`,
            borderRadius: "3px",
            boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
          }} />
        </div>
      )}
    </div>
  );
}