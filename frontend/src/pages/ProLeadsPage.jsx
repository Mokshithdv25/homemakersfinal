import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Inbox, Loader2, MapPin } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LandingNavbar from "../components/landing/LandingNavbar";
import { HM_FIXED_NAV_OFFSET_CLASS } from "../lib/hmBrand";
import { useMobileNative } from "../hooks/useMobileNative";
import { formatInrShort } from "../lib/projectFlowApi";
import { leadStatusLabel, listProLeads, updateProLeadResponse } from "../lib/proLeadsApi";
import "./ProWorkspace.css";

function readPortfolioCache() {
  try {
    const raw = localStorage.getItem("hm_portfolio");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const FILTERS = [
  ["all", "All"],
  ["new", "New"],
  ["interested", "Interested"],
  ["proposal_sent", "Proposal sent"],
  ["won", "Active projects"],
  ["declined", "Declined"],
];

const EMPTY_FILTER_TITLES = {
  new: "No new leads",
  interested: "No interested leads",
  proposal_sent: "No proposals awaiting a decision",
  won: "No active projects",
  declined: "No declined leads",
};

function budgetLabel(lead) {
  if (lead.budget_min && lead.budget_max && Number(lead.budget_min) !== Number(lead.budget_max)) {
    return `${formatInrShort(lead.budget_min)} – ${formatInrShort(lead.budget_max)}`;
  }
  return formatInrShort(lead.budget_max || lead.budget_min);
}

function postedLabel(value) {
  if (!value) return "Recently posted";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently posted";
  return `Posted ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
}

function statusBadgeClass(status) {
  if (["interested", "proposal_sent", "won"].includes(status)) return "is-positive";
  if (status === "declined") return "is-muted";
  return "";
}

export default function ProLeadsPage() {
  const navigate = useNavigate();
  const mobileNative = useMobileNative();
  const [searchParams, setSearchParams] = useSearchParams();
  const cache = useMemo(readPortfolioCache, []);
  const portfolioId = cache?.id || null;
  const requestedStatus = searchParams.get("status") || "all";
  const [filter, setFilter] = useState(FILTERS.some(([value]) => value === requestedStatus) ? requestedStatus : "all");
  const [leads, setLeads] = useState([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    listProLeads(portfolioId)
      .then((result) => {
        if (!active) return;
        setLeads(result.leads);
        setConfigured(result.configured);
        setError(result.error || "");
      })
      .catch((err) => {
        if (active) setError(err?.message || "Could not load homeowner project leads.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [portfolioId]);

  const selectFilter = (value) => {
    setFilter(value);
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("status");
    else next.set("status", value);
    setSearchParams(next, { replace: true });
  };

  const visibleLeads = useMemo(
    () => leads.filter((lead) => filter === "all" || lead.status === filter),
    [filter, leads],
  );

  const setStatus = async (lead, status) => {
    if (!portfolioId || savingId) return;
    setSavingId(lead.project_id);
    setError("");
    try {
      const response = await updateProLeadResponse({ projectId: lead.project_id, portfolioId, status });
      setLeads((current) => current.map((item) => (
        item.project_id === lead.project_id ? { ...item, status: response.status, response } : item
      )));
    } catch (err) {
      setError(err?.message || "Could not update this lead.");
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className={`${mobileNative ? "" : HM_FIXED_NAV_OFFSET_CLASS} hm-pro-workspace`}>
      {!mobileNative ? <LandingNavbar /> : null}
      <main className="hm-pro-main">
        <header className="hm-pro-headline">
          <div>
            <p className="hm-pro-eyebrow">Professional workspace</p>
            <h1 className="hm-pro-title">Homeowner project leads</h1>
            <p className="hm-pro-subtitle">Projects posted by homeowners for quotes—not professional profiles from the marketplace. Review the scope, signal interest, and move good opportunities into your active pipeline.</p>
          </div>
          <button type="button" className="hm-pro-button-secondary" onClick={() => navigate("/pro/dashboard")}>
            <ArrowLeft size={16} /> Dashboard
          </button>
        </header>

        <div className="hm-pro-filters" role="tablist" aria-label="Filter project leads">
          {FILTERS.map(([value, label]) => {
            const count = value === "all" ? leads.length : leads.filter((lead) => lead.status === value).length;
            return (
              <button key={value} type="button" role="tab" aria-selected={filter === value} className={`hm-pro-filter ${filter === value ? "is-active" : ""}`} onClick={() => selectFilter(value)}>
                {label} · {count}
              </button>
            );
          })}
        </div>

        {error ? <p className="hm-pro-error" role="alert">{error}</p> : null}

        {loading ? (
          <section className="hm-pro-card hm-pro-empty" aria-live="polite"><Loader2 className="animate-spin hm-pro-empty-icon" size={24} /><h2>Loading homeowner projects…</h2></section>
        ) : !portfolioId ? (
          <section className="hm-pro-card hm-pro-empty"><div className="hm-pro-empty-icon"><Inbox size={23} /></div><h2>Complete your professional profile first</h2><p>Your portfolio identifies your business when you respond to a homeowner project.</p><button type="button" className="hm-pro-button" style={{ marginTop: 18 }} onClick={() => navigate("/craft")}>Continue profile</button></section>
        ) : !configured ? (
          <section className="hm-pro-card hm-pro-empty"><div className="hm-pro-empty-icon"><Inbox size={23} /></div><h2>The homeowner lead connection is not live yet</h2><p>Your private project inbox is ready in the app. The production workspace still needs its lead connection enabled before homeowner projects can appear here.</p></section>
        ) : visibleLeads.length === 0 ? (
          <section className="hm-pro-card hm-pro-empty"><div className="hm-pro-empty-icon"><Inbox size={23} /></div><h2>{filter === "all" ? "No homeowner projects are open yet" : EMPTY_FILTER_TITLES[filter]}</h2><p>{filter === "all" ? "New project briefs posted for quotes will land here automatically. Your marketplace profile remains separate." : "Try another pipeline stage to see the rest of your opportunities."}</p></section>
        ) : (
          <section className="hm-pro-lead-list" aria-label="Homeowner project opportunities">
            {visibleLeads.map((lead) => (
              <article className="hm-pro-card hm-pro-lead-card" key={lead.project_id}>
                <div className="hm-pro-lead-top">
                  <div>
                    <div className="hm-pro-badges">
                      {lead.targeted_to_you ? <span className="hm-pro-badge is-targeted">Sent to you</span> : <span className="hm-pro-badge">Open opportunity</span>}
                      <span className={`hm-pro-badge ${statusBadgeClass(lead.status)}`}>{leadStatusLabel(lead.status)}</span>
                    </div>
                    <h2>{lead.title}</h2>
                  </div>
                  <span className="hm-pro-date">{postedLabel(lead.posted_at)}</span>
                </div>

                <div className="hm-pro-lead-meta">
                  <div className="hm-pro-meta-cell"><span>Project</span><strong>{lead.flow_type === "remodel" ? "Remodel" : "New home"}</strong></div>
                  <div className="hm-pro-meta-cell"><span>Location</span><strong><MapPin size={12} style={{ display: "inline", marginRight: 4 }} />{[lead.city, lead.state].filter(Boolean).join(", ")}</strong></div>
                  <div className="hm-pro-meta-cell"><span>Budget</span><strong>{budgetLabel(lead)}</strong></div>
                  <div className="hm-pro-meta-cell"><span>Timeline</span><strong>{lead.timeline_completion || "Discuss with homeowner"}</strong></div>
                </div>

                <div className="hm-pro-tags">
                  <span className="hm-pro-tag">{lead.scope_label}</span>
                  {lead.styles.slice(0, 4).map((style) => <span className="hm-pro-tag" key={style}>{style}</span>)}
                </div>

                <div className="hm-pro-lead-actions">
                  <span className="hm-pro-date">Homeowner contact details are kept private in this lead view.</span>
                  <div className="hm-pro-action-set">
                    {lead.status !== "won" ? <button type="button" className="hm-pro-button-secondary" disabled={savingId === lead.project_id} onClick={() => setStatus(lead, "declined")}>Decline</button> : null}
                    {!(["interested", "won"].includes(lead.status)) ? <button type="button" className="hm-pro-button-secondary" disabled={savingId === lead.project_id} onClick={() => setStatus(lead, "interested")}>Interested</button> : null}
                    {lead.status === "proposal_sent" ? (
                      <button type="button" className="hm-pro-button" disabled={savingId === lead.project_id} onClick={() => setStatus(lead, "won")}>{savingId === lead.project_id ? "Saving…" : "Move to active work"}</button>
                    ) : lead.status === "won" ? (
                      <button type="button" className="hm-pro-button" disabled>Active project</button>
                    ) : (
                      <button type="button" className="hm-pro-button" disabled={savingId === lead.project_id} onClick={() => setStatus(lead, "proposal_sent")}>{savingId === lead.project_id ? "Saving…" : "Mark proposal sent"}</button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
