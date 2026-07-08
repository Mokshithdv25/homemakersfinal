import React from "react";
import { Users } from "lucide-react";

const OR = "#C85F2B";

/**
 * After v0 — explains quotes/bids vs bringing your own pros (not a single-architect handoff).
 */
export default function ProQuotesEngagementCallout({ onBrowseForQuotes, hasOwnPros }) {
  return (
    <div
      style={{
        border: "1.5px solid #EEDCCB",
        background: "linear-gradient(180deg, #FFFBF7, #FDFBF8)",
        borderRadius: 16,
        padding: "20px 22px",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "#E8E4DE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Users size={20} color="#44403C" aria-hidden />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#1C1917", lineHeight: 1.25 }}>
            Next: quotes on real scope — not a fixed drawing package
          </div>
          <p style={{ fontSize: 13, color: "#57534E", lineHeight: 1.55, margin: "8px 0 0" }}>
            Your v0 pack is a starting point.{" "}
            <strong>Architects and contractors quote their fees</strong> for the next tasks (drawings, sanction,
            build phases) — you compare proposals and hire who you want.
          </p>
          <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 12, color: "#44403C", lineHeight: 1.5 }}>
            <li style={{ marginBottom: 4 }}>Post the project to receive bids from marketplace pros</li>
            <li style={{ marginBottom: 4 }}>Or bring your own architect / contractor and run everything in one hub</li>
            <li>Working drawings, sanction, and site fees are agreed directly with whoever you hire</li>
          </ul>
        </div>
      </div>
      {!hasOwnPros && typeof onBrowseForQuotes === "function" ? (
        <button
          type="button"
          onClick={onBrowseForQuotes}
          className="btn-continue !rounded-xl !px-5 !py-2.5 text-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <span style={{ color: OR, fontWeight: 700 }}>Preview marketplace pros</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#57534E" }}>Architects · contractors · trades</span>
        </button>
      ) : null}
    </div>
  );
}
