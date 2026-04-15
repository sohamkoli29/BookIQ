"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LampToggle from "@/components/LampToggle";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "The Shelf" },
    { href: "/ask", label: "Ask the AI" },
  ];

  return (
    <nav
      style={{
        background: "var(--bg-card)",
        borderBottom: "3px solid var(--wood)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 4px 20px rgba(92, 58, 30, 0.15)",
      }}
    >
      {/* Wood grain top strip */}
      <div style={{
        height: "4px",
        background: `linear-gradient(to right, var(--mahogany), var(--wood-light), var(--wood), var(--wood-dark), var(--wood-light), var(--mahogany))`,
      }} />

      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 24px",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>📚</span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--accent)",
              letterSpacing: "-0.02em",
              fontStyle: "italic",
            }}
          >
            BookIQ
          </span>
        </Link>

        {/* Nav links — styled like book spines */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {links.map((link, i) => {
            const isActive = pathname === link.href;
            const spineColors = [
              { bg: "#8B2020", hover: "#6B1818" },
              { bg: "#1A3A5C", hover: "#122840" },
            ];
            const color = spineColors[i];

            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  textDecoration: "none",
                  fontFamily: "var(--font-ui)",
                  fontSize: "13px",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  padding: "8px 18px",
                  borderRadius: "4px",
                  color: isActive ? "#F5EFE0" : "var(--text-secondary)",
                  background: isActive ? color.bg : "transparent",
                  border: `1px solid ${isActive ? color.bg : "var(--border)"}`,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "var(--cream-dark)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--wood)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Divider */}
          <div style={{
            width: "1px",
            height: "28px",
            background: "var(--border-strong)",
            margin: "0 8px",
          }} />

          {/* Lamp Toggle */}
          <LampToggle />
        </div>
      </div>

      {/* Bottom shelf edge */}
      <div style={{
        height: "6px",
        background: `linear-gradient(to right, var(--wood-dark) 0%, var(--wood) 20%, var(--wood-light) 50%, var(--wood) 80%, var(--wood-dark) 100%)`,
        boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
      }} />
    </nav>
  );
}