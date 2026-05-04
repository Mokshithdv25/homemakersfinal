import React from "react";
import { useNavigate } from "react-router-dom";
import ProjectHubShell from "../components/ProjectHubShell";

const OR = "#C85F2B";
const AI_BADGE = "#7A4FC0";
const ARCH_BADGE = "#2A6496";

const panel = {
  background: "linear-gradient(180deg, #FDFCFB 0%, #FAF9F7 100%)",
  borderRadius: 12,
  border: "1px solid #E8E6E3",
  boxShadow: "0 1px 2px rgba(28, 25, 23, 0.045)",
};

function StepHeader({ step, title, subtitle, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: accent,
          color: "#fff",
          fontSize: 15,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {step}
      </div>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
        {subtitle ? (
          <p style={{ fontSize: 13, color: "#7A6E62", margin: "6px 0 0", lineHeight: 1.45 }}>{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Demo narrative — replace with API / projectFlowStorage when wired. */
const STEPS = {
  client: {
    step: 1,
    title: "What you gave us (client input)",
    subtitle: "Everything the family and site context contributed before serious drawing work — the brief the AI and architect had to respect.",
    captured: "Captured: 5–10 Mar 2024 (intake & follow-up)",
    blocks: [
      {
        label: "Site & rules",
        text: "30×50 corner plot, BBMP; setbacks and road widths fixed from day one. Two covered cars + visitor scooter; lift shaft reserved for a later phase.",
      },
      {
        label: "Style & programme",
        text: "Calm modern Indian — wood, stone, lots of natural light; not a glossy “hotel” look. 3 bedrooms, study, open kitchen–dining, utility, staff room, terrace sit-out.",
      },
      {
        label: "Family & Vastu",
        text: "Elders on the ground floor; kids’ study away from noisy zones; entertaining ~12 people. Kitchen SE, master SW, puja northeast — called out as non-negotiables.",
      },
      {
        label: "Money & time",
        text: "All-in target band ₹1.15–1.25 Cr and a target move-in window so the architect could size structure and finishes realistically.",
      },
    ],
  },
  ai: {
    step: 2,
    title: "What AI generated",
    subtitle: "First-pass artefacts from your answers — narrative, massing ideas, and a rough cost shape. Not sanction-grade; meant to align the room before ink.",
    rows: [
      {
        when: "12 Mar 2024",
        body: (
          <>
            <strong>v0 narrative brief</strong> — scope story, main risks, and suggested phasing (structure → services → finishes) in plain language for the family.
          </>
        ),
      },
      {
        when: "18 Mar 2024",
        body: (
          <>
            <strong>Concept massing</strong> — two block options for the corner lot with notes on light, ventilation, and where Vastu locks sat.
          </>
        ),
      },
      {
        when: "22 Mar 2024",
        body: (
          <>
            <strong>Estimate skeleton</strong> — broad BOQ buckets (civil, MEP, kitchen, exterior) tied to the brief so budget talk wasn’t arbitrary.
          </>
        ),
      },
    ],
  },
  architect: {
    step: 3,
    title: "What the architect refined",
    subtitle: "Neha Verma translated AI + intake into workable drawings — resolving clashes, code, and how you actually live in the house.",
    rows: [
      {
        when: "28 Mar 2024",
        body: (
          <>
            Rejected Scheme A: store-room door swing fought the passage. <strong>Scheme B</strong> adopted with cleaner circulation and the same programme.
          </>
        ),
      },
      {
        when: "8 Apr 2024",
        body: (
          <>
            Softened the living–dining divide per family feedback; opened the stair volume for <strong>more daylight</strong> into the core of the house.
          </>
        ),
      },
      {
        when: "Apr–May 2024",
        body: (
          <>
            Structural grid and slab edges coordinated with elevations; drawings packaged for sanction with BBMP checklist items cross-checked.
          </>
        ),
      },
    ],
  },
  agreed: {
    step: 4,
    title: "What was finally agreed",
    subtitle: "The line in the sand after reviews — what site and contracts treat as “approved”. Earlier versions stay above for context only.",
    when: "18 May 2024 onward",
    bullets: [
      <>
        <strong>Sanction submission set v4</strong> is the authority-facing baseline; <strong>frozen BBMP copy</strong> on file in Documents.
      </>,
      <>
        Living area <strong>column grid</strong> and slab edges <strong>signed off</strong> in the project thread — changes after that need a formal revision note.
      </>,
      <>
        Budget conversations on site roll up to the <strong>skeleton + architect adjustments</strong>; major scope adds require homeowner + architect acknowledgement.
      </>,
      <>Execution has since moved faster than the original design calendar; this agreement block is still the design “source of truth” for disputes and RFIs.</>,
    ],
  },
};

export default function ProjectDesignJourney() {
  const navigate = useNavigate();

  return (
    <ProjectHubShell>
      <div
        className="px-5 md:px-10"
        style={{
          flex: 1,
          paddingTop: 24,
          paddingBottom: 40,
          overflowY: "auto",
          fontFamily: "'DM Sans','Inter',system-ui,sans-serif",
          color: "#1C1917",
          maxWidth: 920,
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9A8F87", letterSpacing: "0.1em", margin: "0 0 8px" }}>PROJECT ORIGIN</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Design journey</h1>
          <p style={{ fontSize: 14, color: "#7A6E62", marginTop: 10, lineHeight: 1.55, maxWidth: 680 }}>
            Four beats: <strong>your input</strong>, <strong>what AI drafted</strong>, <strong>what the architect refined</strong>, and <strong>what everyone locked</strong>. Handy when you need the story,
            not only the latest drawing set.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <button
              type="button"
              onClick={() => navigate("/documents")}
              style={{
                padding: "9px 16px",
                borderRadius: 9,
                border: `1.5px solid ${OR}`,
                background: "#FDF4EF",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                color: "#44403C",
              }}
            >
              Open document vault
            </button>
            <button
              type="button"
              onClick={() => navigate("/project")}
              style={{
                padding: "9px 16px",
                borderRadius: 9,
                border: "1.5px solid #D1C9BF",
                background: "#fff",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                color: "#44403C",
              }}
            >
              Back to overview
            </button>
          </div>
        </div>

        {/* 1 — Client */}
        <section style={{ ...panel, padding: "22px 24px", marginBottom: 16 }}>
          <StepHeader step={STEPS.client.step} title={STEPS.client.title} subtitle={STEPS.client.subtitle} accent={OR} />
          <p style={{ fontSize: 12, fontWeight: 700, color: "#9A8F87", margin: "0 0 14px", letterSpacing: "0.04em" }}>{STEPS.client.captured}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {STEPS.client.blocks.map((b) => (
              <div key={b.label} style={{ paddingBottom: 14, borderBottom: "1px solid #F0EBE3" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: OR, marginBottom: 6 }}>{b.label}</div>
                <div style={{ fontSize: 14, color: "#44403C", lineHeight: 1.55 }}>{b.text}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 2 — AI */}
        <section style={{ ...panel, padding: "22px 24px", marginBottom: 16, borderLeft: `4px solid ${AI_BADGE}` }}>
          <StepHeader step={STEPS.ai.step} title={STEPS.ai.title} subtitle={STEPS.ai.subtitle} accent={AI_BADGE} />
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {STEPS.ai.rows.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "104px 1fr auto",
                  gap: 12,
                  alignItems: "start",
                  padding: "12px 0",
                  borderTop: i === 0 ? "none" : "1px solid #F0EBE3",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#9A8F87" }}>{r.when}</div>
                <div style={{ fontSize: 14, color: "#44403C", lineHeight: 1.5 }}>{r.body}</div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    color: "#fff",
                    background: AI_BADGE,
                    borderRadius: 6,
                    padding: "4px 8px",
                    whiteSpace: "nowrap",
                  }}
                >
                  AI
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 3 — Architect */}
        <section style={{ ...panel, padding: "22px 24px", marginBottom: 16, borderLeft: `4px solid ${ARCH_BADGE}` }}>
          <StepHeader step={STEPS.architect.step} title={STEPS.architect.title} subtitle={STEPS.architect.subtitle} accent={ARCH_BADGE} />
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {STEPS.architect.rows.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "104px 1fr",
                  gap: 12,
                  alignItems: "start",
                  padding: "14px 0",
                  borderTop: i === 0 ? "none" : "1px solid #F0EBE3",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#9A8F87" }}>{r.when}</div>
                <div style={{ fontSize: 14, color: "#44403C", lineHeight: 1.55 }}>{r.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 4 — Agreed */}
        <section style={{ ...panel, padding: "22px 24px", border: `1px solid ${OR}40`, background: "linear-gradient(180deg, #FDF8F3 0%, #FAF9F7 100%)" }}>
          <StepHeader step={STEPS.agreed.step} title={STEPS.agreed.title} subtitle={STEPS.agreed.subtitle} accent="#22A36B" />
          <p style={{ fontSize: 12, fontWeight: 800, color: OR, margin: "0 0 14px" }}>{STEPS.agreed.when}</p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: "#44403C", lineHeight: 1.6 }}>
            {STEPS.agreed.bullets.map((item, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </ProjectHubShell>
  );
}
