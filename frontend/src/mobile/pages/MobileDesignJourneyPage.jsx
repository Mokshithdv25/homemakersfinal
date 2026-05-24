import React from "react";
import MobileHeader from "../MobileHeader";

const STEPS = [
  { title: "Vision & brief", status: "Done", detail: "Plot size, lifestyle, room program" },
  { title: "AI v0 concept", status: "Done", detail: "Floor plans, renders, estimate band" },
  { title: "Architect review", status: "Active", detail: "Refine plans with your design expert" },
  { title: "Permits & sourcing", status: "Next", detail: "Approvals and material lock-in" },
  { title: "Build & handoff", status: "Upcoming", detail: "Site updates in Project tab" },
];

export default function MobileDesignJourneyPage() {
  return (
    <>
      <MobileHeader title="Design journey" subtitle="Brief → v0 → build" backTo="/project" />
      <div style={{ padding: "8px 16px 24px" }}>
        {STEPS.map((s, i) => (
          <div key={s.title} className="hm-m-journey-step">
            <div className="hm-m-journey-dot">{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontWeight: 700 }}>{s.title}</span>
                <span className={`hm-m-journey-badge ${s.status === "Active" ? "active" : ""}`}>{s.status}</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#78716C", lineHeight: 1.45 }}>{s.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
