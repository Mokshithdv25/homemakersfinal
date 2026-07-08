import React, { useId } from "react";

const ORANGE = "#C85F2B";

/**
 * Preset — flat-top hexagon drawn with SVG so the **stroke** (thick when selected) is always visible;
 * HTML borders on <button> were easy to miss or overridden; hex code text alone isn’t enough feedback.
 */
export function ColourHexSwatch({ colour, selected, onClick }) {
  return (
    <button
      type="button"
      title={colour}
      aria-label={`Colour ${colour}${selected ? " — selected" : ""}`}
      aria-pressed={selected}
      onClick={onClick}
      className="p-0 border-0 bg-transparent cursor-pointer leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C85F2B] focus-visible:ring-offset-1 rounded"
      style={{
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        flexShrink: 0,
        transform: selected ? "scale(1.08)" : "none",
        transition: "transform 0.12s ease",
        position: "relative",
        zIndex: selected ? 2 : 1,
        lineHeight: 0,
      }}
    >
      <svg
        width={48}
        height={52}
        viewBox="0 0 48 52"
        aria-hidden
        style={{ display: "block" }}
      >
        <polygon
          points="24,3 45,16 45,36 24,49 3,36 3,16"
          fill={colour}
          stroke={selected ? ORANGE : "rgba(28, 25, 23, 0.28)"}
          strokeWidth={selected ? 5 : 2}
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/**
 * Custom colour — label + full-area color input (no hidden 1×1 input + synthetic .click()).
 * useId() keeps ids unique when Base + Secondary both mount custom pickers on one screen.
 */
export function ColourOctagonCustom({ onPick }) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      title="Pick any colour"
      className="inline-flex shrink-0 cursor-pointer"
      style={{
        position: "relative",
        width: 44,
        height: 44,
        boxSizing: "border-box",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        border: "2px solid rgba(28, 25, 23, 0.18)",
        background: "linear-gradient(135deg, #EFEAE4 0%, #E7E2DC 100%)",
        boxShadow: "0 1px 3px rgba(28, 25, 23, 0.12)",
        zIndex: 1,
        touchAction: "manipulation",
      }}
    >
      <input
        id={id}
        type="color"
        onChange={(e) => {
          onPick(e.target.value);
        }}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          margin: 0,
          padding: 0,
          border: 0,
          opacity: 0,
          cursor: "pointer",
        }}
        aria-label="Add custom colour"
      />
      <span
        className="pointer-events-none"
        style={{
          color: "#78716C",
          fontSize: 20,
          fontWeight: 300,
          lineHeight: 1,
        }}
        aria-hidden
      >
        +
      </span>
    </label>
  );
}

export function normalizeHexColor(input) {
  if (input == null || input === "") return null;
  let s = String(input).trim();
  if (!s.startsWith("#")) s = `#${s}`;
  if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
    s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(s)) return null;
  return s.toUpperCase();
}

export const PALETTE_PRESET_HEX = [
  "#F5F5F0", "#F5EFE8", "#B0B0A8", "#4A4A48", "#B85C38", "#9B7B5C", "#3D5A3E", "#2E4A5A",
];
