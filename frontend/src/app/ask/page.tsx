"use client";
import Link from "next/link";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { askQuestion, getQAHistory, QAResult, QAHistory, Source } from "@/lib/api";


function AskPageInner() {
  const searchParams = useSearchParams();
  const prefillBookId = searchParams.get("book_id");
  const prefillTitle = searchParams.get("title");

  const [question, setQuestion] = useState("");
  const [bookId, setBookId] = useState<number | undefined>(
    prefillBookId ? Number(prefillBookId) : undefined
  );
  const [result, setResult] = useState<QAResult | null>(null);
  const [history, setHistory] = useState<QAHistory[]>([]);
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const answerRef = useRef<HTMLDivElement>(null);

  const toggleSource = (i: number) =>
    setExpandedSources((prev) => ({ ...prev, [i]: !prev[i] }));

  useEffect(() => {
    getQAHistory()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    if (result) answerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await askQuestion(question.trim(), bookId);
      setResult(data);
      const updated = await getQAHistory();
      setHistory(updated);
    } catch {
      setError("Failed to get answer. Make sure the backend and LM Studio are running.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); }
  };

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <p style={{
          fontFamily: "var(--font-ui)",
          fontSize: "11px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: "8px",
        }}>
          Knowledge Chamber
        </p>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "38px",
          fontWeight: 700,
          color: "var(--text-primary)",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
        }}>
          Ask the AI
        </h1>
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: "15px",
          color: "var(--text-secondary)",
          marginTop: "10px",
          fontStyle: "italic",
        }}>
          Pose your question and the oracle shall search the library&apos;s depths to illuminate an answer.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "20px" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span style={{ color: "var(--wood)", fontSize: "16px" }}>📖</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>
      </div>

      {/* Book context banner */}
      {prefillTitle && (
        <div style={{
          background: "rgba(26, 58, 92, 0.08)",
          border: "1px solid rgba(26, 58, 92, 0.2)",
          borderLeft: "4px solid #1A3A5C",
          borderRadius: "0 8px 8px 0",
          padding: "14px 20px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            color: "#1A3A5C",
          }}>
            Consulting: <em>&ldquo;{prefillTitle}&rdquo;</em>
          </p>
          <button
            onClick={() => { setBookId(undefined); window.history.replaceState({}, "", "/ask"); }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontFamily: "var(--font-ui)",
              fontSize: "12px",
              padding: "4px 8px",
            }}
          >
            ✕ Clear
          </button>
        </div>
      )}

      {/* Input area */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "var(--shadow)",
        marginBottom: "28px",
      }}>
        {/* Decorative header */}
        <div style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-surface)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}>
          <span style={{ fontSize: "14px" }}>✦</span>
          <span style={{
            fontFamily: "var(--font-ui)",
            fontSize: "11px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}>
            Your Question
          </span>
        </div>

        <div style={{ padding: "20px" }}>
          <textarea
            rows={3}
            placeholder="e.g. What is book in a Dark ,Dark Wood"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              color: "var(--text-primary)",
              lineHeight: 1.7,
            }}
          />
        </div>

        <div style={{
          padding: "14px 20px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-surface)",
          gap: "12px",
        }}>
          <p style={{
            fontFamily: "var(--font-ui)",
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.04em",
          }}>
            Press Enter to consult · Shift+Enter for new line
          </p>
          <button
            onClick={handleAsk}
            disabled={loading || !question.trim()}
            style={{
              background: loading || !question.trim() ? "var(--border)" : "var(--accent)",
              color: loading || !question.trim() ? "var(--text-muted)" : "#F5EFE0",
              border: "none",
              borderRadius: "6px",
              padding: "10px 22px",
              fontFamily: "var(--font-ui)",
              fontSize: "13px",
              fontWeight: 500,
              letterSpacing: "0.04em",
              cursor: loading || !question.trim() ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: "12px",
                  height: "12px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTop: "2px solid #F5EFE0",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  flexShrink: 0,
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                Consulting...
              </>
            ) : (
              "Consult the AI →"
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(139, 32, 32, 0.08)",
          border: "1px solid rgba(139, 32, 32, 0.3)",
          borderRadius: "8px",
          padding: "16px 20px",
          color: "#8B2020",
          fontFamily: "var(--font-body)",
          fontSize: "14px",
          marginBottom: "24px",
        }}>
          📕 {error}
        </div>
      )}

      {/* Answer */}
      {result && (
        <div ref={answerRef} style={{ marginBottom: "40px" }}>
          {/* Answer box */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderLeft: "4px solid var(--wood)",
            borderRadius: "0 8px 8px 0",
            padding: "24px 28px",
            marginBottom: "16px",
            boxShadow: "var(--shadow)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "14px",
            }}>
              <div style={{
                fontFamily: "var(--font-ui)",
                fontSize: "10px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--wood)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <span>✦</span> Oracle&apos;s Response
              </div>
              {result.cached && (
                <span style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "10px",
                  background: "rgba(139, 105, 20, 0.1)",
                  color: "var(--wood)",
                  border: "1px solid rgba(139, 105, 20, 0.25)",
                  borderRadius: "20px",
                  padding: "3px 10px",
                  letterSpacing: "0.06em",
                }}>
                  ⚡ From memory
                </span>
              )}
            </div>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              color: "var(--text-primary)",
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
            }}>
              {result.answer}
            </p>
          </div>

          {/* Sources */}
          {result.sources.length > 0 && (
            <div>
              <p style={{
                fontFamily: "var(--font-ui)",
                fontSize: "11px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "12px",
              }}>
                Sources consulted ({result.sources.length})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {result.sources.map((source: Source, i: number) => {
                  const isExpanded = !!expandedSources[i];
                  const PREVIEW_LEN = 180;
                  const isLong = source.chunk_text.length > PREVIEW_LEN;
                  const displayText = isExpanded || !isLong
                    ? source.chunk_text
                    : source.chunk_text.slice(0, PREVIEW_LEN).trimEnd() + "…";

                  return (
                    <div key={i} style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      overflow: "hidden",
                      transition: "border-color 0.2s ease",
                    }}>
                      {/* Card header */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--border)",
                        background: "var(--bg-surface)",
                      }}>
                        <p style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--accent)",
                          fontStyle: "italic",
                          margin: 0,
                        }}>
                          {source.book_title}
                        </p>
                        <span style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          background: "var(--bg-card)",
                          padding: "2px 8px",
                          borderRadius: "20px",
                          border: "1px solid var(--border)",
                          flexShrink: 0,
                        }}>
                          {(source.similarity_score * 100).toFixed(0)}% match
                        </span>
                      </div>

                      {/* Text body */}
                      <div style={{ padding: "14px 16px 0" }}>
                        <p style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "13px",
                          color: "var(--text-secondary)",
                          lineHeight: 1.7,
                          fontStyle: "italic",
                          margin: 0,
                        }}>
                          &ldquo;{displayText}&rdquo;
                        </p>
                      </div>
                         <Link href={`/books/${source.book_id}`} style={{ textDecoration: "none", display: "block" }}>
                      {/* Footer: read more / collapse */}
                      {isLong && (
                        <div style={{ padding: "8px 16px 12px" }}>
                          <button
                            onClick={() => toggleSource(i)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontFamily: "var(--font-ui)",
                              fontSize: "11px",
                              fontWeight: 500,
                              color: "var(--accent)",
                              letterSpacing: "0.04em",
                              padding: "4px 0",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              transition: "opacity 0.2s ease",
                            }}
                            
                          >
                                  Read more →
                          </button>
                        </div>
                      )}
                      </Link>

                      {/* Book link if available */}
                      {!isLong && (
                        <div style={{ padding: "4px 16px 12px" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      <div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
        }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span style={{
            fontFamily: "var(--font-ui)",
            fontSize: "11px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            whiteSpace: "nowrap",
          }}>
            Past Consultations
          </span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        {historyLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                height: "72px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                animation: "pulse 1.5s ease infinite",
              }} />
            ))}
            <style>{`@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }`}</style>
          </div>
        )}

        {!historyLoading && history.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "48px 20px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-body)",
            fontStyle: "italic",
            fontSize: "14px",
          }}>
            No questions have been asked yet. Begin your inquiry above.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {!historyLoading && history.map((item) => (
            <div
              key={item.id}
              onClick={() => setQuestion(item.question)}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "16px 18px",
                cursor: "pointer",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--wood)";
                el.style.boxShadow = "var(--shadow)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--border)";
                el.style.boxShadow = "none";
              }}
            >
              <p style={{
                fontFamily: "var(--font-display)",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "5px",
              }}>
                {item.question}
              </p>
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
                fontStyle: "italic",
              }}>
                {item.answer}
              </p>
              <p style={{
                fontFamily: "var(--font-ui)",
                fontSize: "10px",
                color: "var(--text-muted)",
                marginTop: "8px",
                letterSpacing: "0.04em",
              }}>
                {new Date(item.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AskPage() {
  return (
    <Suspense fallback={
      <div style={{
        fontFamily: "var(--font-body)",
        color: "var(--text-muted)",
        padding: "80px",
        textAlign: "center",
        fontStyle: "italic",
        fontSize: "14px",
      }}>
        Opening the library...
      </div>
    }>
      <AskPageInner />
    </Suspense>
  );
}