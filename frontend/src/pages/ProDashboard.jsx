import React from "react";
import { useNavigate } from "react-router-dom";
import LandingNavbar from "../components/landing/LandingNavbar";
import HmUserMenu from "../components/HmUserMenu";
import { HM_FIXED_NAV_OFFSET_TAGLINE_CLASS, HM_TAGLINE_PORTFOLIO } from "../lib/hmBrand";
import { useHmSession } from "../hooks/useHmSession";
import { getProOnboardingResumePath, readProPortfolioState } from "../lib/hmAuth";

const OR = "#C85F2B";

const cards = [
  { title: "Leads in pipeline", value: "14", sub: "5 new this week" },
  { title: "Active homeowner projects", value: "8", sub: "3 in design, 5 on site" },
  { title: "Pending quote requests", value: "6", sub: "Avg response time: 2.3h" },
  { title: "Upcoming meetings", value: "4", sub: "Today + tomorrow" },
];

const tasks = [
  { owner: "Ananya R.", task: "Review v0 pack and send revision notes", due: "Today, 6:30 PM", status: "Urgent" },
  { owner: "Sharma Residence", task: "Submit structural coordination checklist", due: "Tomorrow", status: "In Progress" },
  { owner: "Kumar Remodel", task: "Share BOQ draft with homeowner", due: "Tue", status: "Pending" },
  { owner: "D'Souza Villa", task: "Schedule site visit with contractor", due: "Thu", status: "Planned" },
];

const capabilityBoard = [
  {
    title: "Selections Board",
    status: "Added",
    blurb: "Share finishes/material options with clients, capture comments, and mark approval in one thread.",
    actions: ["Selections board (new)", "Client comments", "Approve / revise"],
  },
  {
    title: "Estimates & Takeoffs",
    status: "Added",
    blurb: "Fast branded estimate draft with basic takeoff-style quantity math from input dimensions.",
    actions: ["Estimate draft", "Material qty calc", "Export-ready totals"],
  },
  {
    title: "Client Dashboard & Portal",
    status: "Already exists",
    blurb: "Project schedules, docs, team, and stage tracking already live in your current setup.",
    actions: ["Project dashboard", "Documents vault", "Team + stage pages"],
  },
  {
    title: "Lead Management & Marketing",
    status: "Mostly exists",
    blurb: "Marketplace + profile and pro onboarding are available; CRM automation can be layered next.",
    actions: ["Marketplace leads", "Public profile", "Pro onboarding pages"],
  },
  {
    title: "Online Payments & Invoicing",
    status: "Added (demo)",
    blurb: "Invoice/deposit workflow is now represented in dashboard; gateway wiring remains pending.",
    actions: ["Invoice tracker", "Deposit request CTA", "Pending/paid visibility"],
  },
];

const selectionItems = [
  { item: "Living room flooring", option: "Italian marble · Statuario", amount: "₹265 / sq ft", status: "Client review" },
  { item: "Kitchen countertop", option: "Quartz · Calacatta", amount: "₹610 / sq ft", status: "Approved" },
  { item: "Master wardrobe finish", option: "Matte laminate + veneer edge", amount: "₹1,480 / running ft", status: "Revise" },
];

const takeoffRows = [
  { material: "Floor tile 600x600", qty: "840 sq ft", unitRate: "₹92", amount: "₹77,280" },
  { material: "Wall putty + primer", qty: "1,950 sq ft", unitRate: "₹22", amount: "₹42,900" },
  { material: "False ceiling gypsum", qty: "620 sq ft", unitRate: "₹135", amount: "₹83,700" },
  { material: "Electrical points", qty: "72 points", unitRate: "₹1,150", amount: "₹82,800" },
];

const invoices = [
  { id: "INV-2406-08", project: "Sharma Residence", amount: "₹2,40,000", status: "Pending deposit" },
  { id: "INV-2406-05", project: "Ananya Remodel", amount: "₹1,10,000", status: "Part paid" },
  { id: "INV-2405-22", project: "D'Souza Villa", amount: "₹3,80,000", status: "Paid" },
];

export default function ProDashboard() {
  const navigate = useNavigate();
  const session = useHmSession();
  const portfolioState = readProPortfolioState();
  const firstName = (session?.profile?.name || "Pro").split(" ")[0];
  const portfolioSlug = (() => {
    try {
      const p = JSON.parse(localStorage.getItem("hm_portfolio") || "{}");
      return p.slug || null;
    } catch {
      return null;
    }
  })();

  return (
    <div className={HM_FIXED_NAV_OFFSET_TAGLINE_CLASS} style={{ minHeight: "100vh", background: "#FBF7F2", color: "#1C1917", fontFamily: "'DM Sans', Inter, system-ui, sans-serif" }}>
      <LandingNavbar tagline={HM_TAGLINE_PORTFOLIO} />

      <main className="mx-auto max-w-6xl px-5 md:px-8 py-8 md:py-10">
        <div
          style={{
            border: "1px solid #EEDCCB",
            background: "linear-gradient(180deg, #FFFBF7, #FDFBF8)",
            borderRadius: 14,
            padding: "16px 18px",
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
            Welcome back, {firstName}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#57534E", lineHeight: 1.55 }}>
            You are signed in as a professional. Review homeowner AI-v0 packs, share quotes, and move confirmed work into project management.
          </p>
          {portfolioState.status !== "published" ? (
            <button
              type="button"
              onClick={() => navigate(getProOnboardingResumePath())}
              className="mt-3 rounded-lg bg-[#C85F2B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B04F20] cursor-pointer border-none"
            >
              Continue portfolio setup
            </button>
          ) : portfolioSlug ? (
            <button
              type="button"
              onClick={() => window.open(`/profile/${portfolioSlug}`, "_blank")}
              className="mt-3 rounded-lg border border-[#E7D4C4] bg-white px-4 py-2 text-sm font-semibold text-[#1C1917] hover:bg-[#FDF8F3] cursor-pointer"
            >
              View live portfolio
            </button>
          ) : null}
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5">
          {cards.map((c) => (
            <div
              key={c.title}
              style={{
                border: "1px solid #E8E4DE",
                background: "#fff",
                borderRadius: 12,
                padding: "14px 14px 12px",
                boxShadow: "0 1px 2px rgba(28,25,23,0.04)",
              }}
            >
              <div style={{ fontSize: 12, color: "#7A6E62", marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: OR, lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 11, color: "#9A8F87", marginTop: 6 }}>{c.sub}</div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 md:gap-5">
          <div
            style={{
              border: "1px solid #E8E4DE",
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 1px 2px rgba(28,25,23,0.04)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #F0EBE3", fontWeight: 800 }}>Today&apos;s priorities</div>
            <div style={{ padding: "8px 12px 10px" }}>
              {tasks.map((t) => (
                <div
                  key={t.owner + t.task}
                  style={{
                    border: "1px solid #F1ECE6",
                    borderRadius: 10,
                    padding: "10px 12px",
                    marginBottom: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    background: "#FFFCFA",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: OR, fontWeight: 700, marginBottom: 3 }}>{t.owner}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1C1917", marginBottom: 2 }}>{t.task}</div>
                    <div style={{ fontSize: 11, color: "#7A6E62" }}>Due: {t.due}</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#57534E", whiteSpace: "nowrap", alignSelf: "flex-start" }}>
                    {t.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              border: "1px solid #E8E4DE",
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 1px 2px rgba(28,25,23,0.04)",
              padding: 14,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Quick actions</div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate("/browse")}
                className="text-left rounded-lg border border-[#E7D4C4] bg-[#FFFBF7] px-3 py-2 text-sm font-semibold text-[#1C1917] hover:bg-[#FDF5EE] cursor-pointer"
              >
                Review quote requests
              </button>
              <button
                type="button"
                onClick={() => navigate("/project")}
                className="text-left rounded-lg border border-[#E7D4C4] bg-[#FFFBF7] px-3 py-2 text-sm font-semibold text-[#1C1917] hover:bg-[#FDF5EE] cursor-pointer"
              >
                Open project management hub
              </button>
              <button
                type="button"
                onClick={() => navigate("/build/new-home")}
                className="text-left rounded-lg border border-[#E7D4C4] bg-[#FFFBF7] px-3 py-2 text-sm font-semibold text-[#1C1917] hover:bg-[#FDF5EE] cursor-pointer"
              >
                Open homeowner v0 flow (demo)
              </button>
              <button
                type="button"
                onClick={() => navigate("/profile/demo-pro")}
                className="text-left rounded-lg border border-[#E7D4C4] bg-[#FFFBF7] px-3 py-2 text-sm font-semibold text-[#1C1917] hover:bg-[#FDF5EE] cursor-pointer"
              >
                View public profile page
              </button>
            </div>
          </div>
        </section>

        <section
          style={{
            border: "1px solid #E8E4DE",
            background: "#fff",
            borderRadius: 12,
            marginTop: 18,
            padding: "14px 14px 10px",
            boxShadow: "0 1px 2px rgba(28,25,23,0.04)",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Platform capability coverage (current setup)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {capabilityBoard.map((f) => (
              <div
                key={f.title}
                style={{
                  border: "1px solid #EFE9E2",
                  borderRadius: 10,
                  padding: "10px 11px",
                  background: "#FFFCFA",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start", marginBottom: 5 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{f.title}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: OR, whiteSpace: "nowrap" }}>{f.status}</span>
                </div>
                <div style={{ fontSize: 11, color: "#5C5147", lineHeight: 1.5, marginBottom: 6 }}>{f.blurb}</div>
                <div style={{ fontSize: 10, color: "#7A6E62", lineHeight: 1.45 }}>
                  {f.actions.map((a) => `• ${a}`).join("  ")}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5 mt-4">
          <div
            style={{
              border: "1px solid #E8E4DE",
              background: "#fff",
              borderRadius: 12,
              padding: 14,
              boxShadow: "0 1px 2px rgba(28,25,23,0.04)",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Selections Board</div>
            {selectionItems.map((s) => (
              <div key={s.item} style={{ border: "1px solid #F1ECE6", borderRadius: 9, padding: "8px 9px", marginBottom: 7, background: "#FFFCFA" }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{s.item}</div>
                <div style={{ fontSize: 11, color: "#57534E", marginTop: 2 }}>{s.option}</div>
                <div style={{ fontSize: 10, color: "#9A8F87", marginTop: 4 }}>{s.amount} · {s.status}</div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => navigate("/documents")}
              className="w-full rounded-lg border border-[#E7D4C4] bg-[#FFFBF7] px-3 py-2 text-sm font-semibold text-[#1C1917] hover:bg-[#FDF5EE] cursor-pointer"
            >
              Open client board
            </button>
          </div>

          <div
            style={{
              border: "1px solid #E8E4DE",
              background: "#fff",
              borderRadius: 12,
              padding: 14,
              boxShadow: "0 1px 2px rgba(28,25,23,0.04)",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Estimate & Takeoff (draft)</div>
            {takeoffRows.map((r) => (
              <div key={r.material} style={{ display: "grid", gridTemplateColumns: "1.4fr .7fr .6fr .7fr", gap: 8, fontSize: 11, padding: "6px 0", borderBottom: "1px solid #F1ECE6" }}>
                <div style={{ fontWeight: 600 }}>{r.material}</div>
                <div>{r.qty}</div>
                <div>{r.unitRate}</div>
                <div style={{ textAlign: "right", fontWeight: 700 }}>{r.amount}</div>
              </div>
            ))}
            <div style={{ marginTop: 8, fontSize: 12, color: "#57534E" }}>
              Branded estimate pack + PDF export can plug into this table.
            </div>
          </div>

          <div
            style={{
              border: "1px solid #E8E4DE",
              background: "#fff",
              borderRadius: 12,
              padding: 14,
              boxShadow: "0 1px 2px rgba(28,25,23,0.04)",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Invoices & Payments</div>
            {invoices.map((i) => (
              <div key={i.id} style={{ border: "1px solid #F1ECE6", borderRadius: 9, padding: "8px 9px", marginBottom: 7, background: "#FFFCFA" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{i.id}</div>
                  <div style={{ fontSize: 11, color: OR, fontWeight: 700 }}>{i.status}</div>
                </div>
                <div style={{ fontSize: 11, color: "#57534E", marginTop: 2 }}>{i.project}</div>
                <div style={{ fontSize: 12, marginTop: 3, fontWeight: 700 }}>{i.amount}</div>
              </div>
            ))}
            <button
              type="button"
              className="w-full rounded-lg border border-[#E7D4C4] bg-[#FFFBF7] px-3 py-2 text-sm font-semibold text-[#1C1917] hover:bg-[#FDF5EE] cursor-pointer"
            >
              Request deposit (demo)
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
