import Link from "next/link";
import { Book } from "@/lib/api";

const SENTIMENT_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  positive: { bg: "rgba(28, 74, 42, 0.12)", color: "#1C4A2A", border: "rgba(28, 74, 42, 0.3)" },
  negative: { bg: "rgba(139, 32, 32, 0.12)", color: "#8B2020", border: "rgba(139, 32, 32, 0.3)" },
  neutral:  { bg: "rgba(107, 76, 42, 0.1)",  color: "var(--text-secondary)", border: "var(--border)" },
};

const SPINE_COLORS = [
  "#8B2020", "#1A3A5C", "#1C4A2A", "#5C3A1E",
  "#3A1A5C", "#4A2A10", "#1A4A3C", "#5C1A3A",
];

function getSpineColor(id: number) {
  return SPINE_COLORS[id % SPINE_COLORS.length];
}

export default function BookCard({ book, index = 0 }: { book: Book; index?: number }) {
  const spineColor = getSpineColor(book.id);
  const sentiment = SENTIMENT_STYLE[book.sentiment] ?? SENTIMENT_STYLE.neutral;

  return (
    <Link href={`/books/${book.id}`} style={{ textDecoration: "none", display: "block" }}>
      <article
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          overflow: "hidden",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow)",
          transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.transform = "translateY(-4px) rotate(-0.5deg)";
          el.style.boxShadow = "var(--shadow-hover)";
          el.style.borderColor = "var(--wood)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.transform = "none";
          el.style.boxShadow = "var(--shadow)";
          el.style.borderColor = "var(--border)";
        }}
      >
        {/* Spine accent stripe */}
        <div style={{
          height: "6px",
          background: spineColor,
          position: "relative",
        }}>
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, rgba(255,255,255,0.15), transparent 40%, rgba(0,0,0,0.1))",
          }} />
        </div>

        {/* Cover image or illustrated placeholder */}
        <div style={{
          position: "relative",
          height: "160px",
          overflow: "hidden",
          background: "var(--bg-surface)",
          flexShrink: 0,
        }}>
          {book.cover_image_url ? (
            <img
              src={book.cover_image_url}
              alt={book.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            /* Book cover illustration */
            <div style={{
              width: "100%",
              height: "100%",
              background: `${spineColor}18`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "16px",
            }}>
              <div style={{
                width: "52px",
                height: "64px",
                background: spineColor,
                borderRadius: "2px 4px 4px 2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "3px 3px 8px rgba(0,0,0,0.2)",
                position: "relative",
              }}>
                {/* Book pages */}
                <div style={{
                  position: "absolute",
                  left: "-3px",
                  top: "4px",
                  bottom: "4px",
                  width: "4px",
                  background: "#FAF6EE",
                  borderRadius: "0 1px 1px 0",
                }} />
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "20px" }}>✦</span>
              </div>
            </div>
          )}

          {/* Rating pill */}
          {book.rating && (
            <div style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              padding: "2px 8px",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              fontFamily: "var(--font-ui)",
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--wood)",
              backdropFilter: "blur(4px)",
            }}>
              ★ {book.rating}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flex: 1,
        }}>
          {/* Title */}
          <div>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
              marginBottom: "4px",
            }}>
              {book.title}
            </h2>
            <p style={{
              fontFamily: "var(--font-ui)",
              fontSize: "12px",
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}>
              {book.author}
            </p>
          </div>

          {/* Tags */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "5px" }}>
            {book.genre && (
              <span style={{
                fontFamily: "var(--font-ui)",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                padding: "3px 8px",
                borderRadius: "3px",
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
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                padding: "3px 8px",
                borderRadius: "3px",
                background: sentiment.bg,
                color: sentiment.color,
                border: `1px solid ${sentiment.border}`,
              }}>
                {book.sentiment}
              </span>
            )}
          </div>

          {/* Summary */}
          {(book.summary || book.description) && (
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
              flex: 1,
              fontStyle: "italic",
            }}>
              {book.summary || book.description}
            </p>
          )}

          {/* Footer */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "10px",
            borderTop: "1px solid var(--border)",
            marginTop: "auto",
          }}>
            <span style={{
              fontFamily: "var(--font-ui)",
              fontSize: "11px",
              color: "var(--wood)",
              fontWeight: 500,
            }}>
              {book.price}
            </span>
            <span style={{
              fontFamily: "var(--font-ui)",
              fontSize: "11px",
              color: "var(--accent)",
              fontWeight: 500,
              letterSpacing: "0.03em",
            }}>
              Read more →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}