import React from "react";
import { CheckCircle2, CreditCard, Sparkles, PenLine } from "lucide-react";

const OR = "#C85F2B";

const COPY = {
  preV0: {
    title: "AI v0 access",
    amount: 2999,
    sub: "Unlocks the AI to draft up to three first-pass directions from your full brief. No working drawings — those come after your professional signs on.",
    bullets: [
      "Up to 3 layout + elevation directions (v0, indicative)",
      "Uses all inputs and option picks from your wizard",
      "Suitable to discuss with a designer before sanction-grade work",
      "No architect assigned here — that starts when you pay for the drawing package; revisions route through your pro",
    ],
  },
  postV0: {
    title: "Professional drawing package",
    amount: 14999,
    sub: "Second payment assigns your architect (or pro you choose) to produce real plans from your structured brief and v0 — floor plans, key elevations, and coordination-ready outputs.",
    bullets: [
      "Floor plans & key elevations to agreed scope (not AI-only renders)",
      "Your pro clarifies and comments on the v0 in one shared brief",
      "Nothing moves to site execution until you’re ready — onboard teams through the project hub",
    ],
  },
};

/**
 * @param {Object} p
 * @param {"preV0"|"postV0"} p.variant
 * @param {boolean} p.paid
 * @param {() => void} p.onCompletePayment — mock checkout success (no gateway wired)
 */
export default function ProjectFlowPayment({ variant, paid, onCompletePayment }) {
  const c = COPY[variant] || COPY.preV0;
  return (
    <div
      style={{
        border: `1.5px solid ${paid ? "#BFE8D1" : "#EEDCCB"}`,
        background: paid ? "linear-gradient(180deg, #F0FDF4, #FDFBF8)" : "linear-gradient(180deg, #FFFBF7, #FDFBF8)",
        borderRadius: 16,
        padding: "20px 22px",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {variant === "preV0" ? (
            <span style={{ width: 40, height: 40, borderRadius: 12, background: "#FBE5D4", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={20} color={OR} />
            </span>
          ) : (
            <span style={{ width: 40, height: 40, borderRadius: 12, background: "#E8E4DE", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PenLine size={20} color="#44403C" />
            </span>
          )}
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#1C1917", lineHeight: 1.25 }}>{c.title}</div>
            <div style={{ fontSize: 12, color: "#78716C", marginTop: 2 }}>India · GST may apply at checkout (when we wire a gateway)</div>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: OR, fontVariantNumeric: "tabular-nums" }}>₹{c.amount.toLocaleString("en-IN")}</div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "#57534E", lineHeight: 1.55, margin: "0 0 12px" }}>{c.sub}</p>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#44403C", lineHeight: 1.5 }}>
        {c.bullets.map((b) => (
          <li key={b} style={{ marginBottom: 4 }}>
            {b}
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        {paid ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#166534", fontWeight: 700, fontSize: 14 }}>
            <CheckCircle2 size={18} /> Paid
          </div>
        ) : (
          <button
            type="button"
            onClick={onCompletePayment}
            className="btn-continue !rounded-xl !px-5 !py-2.5 text-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <CreditCard size={18} />
            Complete payment (demo)
          </button>
        )}
        {!paid && (
          <span style={{ fontSize: 11, color: "#9A8F87" }}>Razorpay / Stripe TBD — this button simulates success for the flow.</span>
        )}
      </div>
    </div>
  );
}
