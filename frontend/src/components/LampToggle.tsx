"use client";
import { useRef } from "react";
import { useTheme } from "@/lib/theme";

export default function LampToggle() {
  const { theme, toggle } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const isOn = theme === "dark";

  const handleClick = () => {
    const el = containerRef.current;
    if (!el) return;
    el.classList.add("lamp-pulling");
    setTimeout(() => el.classList.remove("lamp-pulling"), 900);
    toggle();
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="lamp-toggle-container"
      title={isOn ? "Turn off the lamp" : "Turn on the lamp"}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        userSelect: "none",
        width: "44px",
      }}
    >
      {/* Ceiling mount */}
      <div style={{
        width: "20px",
        height: "4px",
        background: "var(--wood)",
        borderRadius: "2px",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
      }} />

      {/* String */}
      <div
        className="lamp-string"
        style={{
          width: "1.5px",
          height: "28px",
          background: `linear-gradient(to bottom, var(--wood-dark), var(--wood))`,
          transformOrigin: "top center",
          position: "relative",
        }}
      />

      {/* Lamp body */}
      <div
        className="lamp-body"
        style={{
          transformOrigin: "top center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Lamp shade */}
        <svg
          width="44"
          height="30"
          viewBox="0 0 44 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shade */}
          <path
            d="M6 6 L2 28 L42 28 L38 6 Z"
            fill={isOn ? "#2C1A0E" : "#3A2010"}
            stroke={isOn ? "#4A3020" : "#5A3A18"}
            strokeWidth="1"
          />
          {/* Shade rim top */}
          <rect x="5" y="4" width="34" height="4" rx="2"
            fill={isOn ? "#3A2010" : "#4A2A14"}
            stroke={isOn ? "#5A3A18" : "#6A4020"}
            strokeWidth="0.5"
          />
          {/* Inner glow when on */}
          {isOn && (
            <>
              <path
                d="M8 28 L36 28 L34 12 L10 12 Z"
                fill="url(#lampGlow)"
                opacity="0.6"
              />
              <defs>
                <radialGradient id="lampGlow" cx="50%" cy="100%" r="80%">
                  <stop offset="0%" stopColor="#FFD060" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#FFD060" stopOpacity="0" />
                </radialGradient>
              </defs>
            </>
          )}
          {/* Bulb */}
          <circle
            cx="22"
            cy="28"
            r="4"
            fill={isOn ? "#FFD060" : "#4A3020"}
            style={isOn ? { filter: "drop-shadow(0 0 6px #FFD060)" } : {}}
          />
        </svg>

        {/* Light cone when on */}
        {isOn && (
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "22px solid transparent",
              borderRight: "22px solid transparent",
              borderTop: "40px solid rgba(255, 208, 96, 0.08)",
              marginTop: "-2px",
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      {/* Pull string knob */}
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "var(--wood)",
          marginTop: "-4px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </div>
  );
}