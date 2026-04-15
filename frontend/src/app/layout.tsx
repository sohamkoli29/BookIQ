import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/lib/theme";

export const metadata: Metadata = {
  title: "BookIQ — Intelligent Book Shelf",
  description: "An AI-powered library with curated insights, genre classification, and intelligent Q&A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ThemeProvider>
          <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
            <Navbar />
            <main
              style={{
                maxWidth: "1280px",
                margin: "0 auto",
                padding: "40px 24px 80px",
              }}
            >
              {children}
            </main>

            {/* Decorative bottom shelf */}
            <footer
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                height: "12px",
                background: `linear-gradient(to right, var(--mahogany), var(--wood) 20%, var(--wood-light) 50%, var(--wood) 80%, var(--mahogany))`,
                boxShadow: "0 -4px 20px rgba(0,0,0,0.2)",
                zIndex: 40,
              }}
            />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}