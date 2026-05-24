import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileHeader from "../MobileHeader";
import { useMobileHub } from "../hooks/useMobileHub";
import { flowTypeLabel, projectStatusLabel } from "../mobileIA";
import { formatInrShort } from "../../lib/projectFlowApi";

const PROJECT_TOOLS = [
  { label: "Documents", path: "/documents", icon: "📄" },
  { label: "Design journey", path: "/project/journey", icon: "🧭" },
  { label: "Find pros", path: "/project/browse", icon: "👷" },
  { label: "Team", path: "/team", icon: "👥" },
  { label: "Shop", path: "/project/shop", icon: "🛒" },
];

const DEFAULT_PHASES = [
  { name: "Design & approval", pct: 8, color: "#C85F2B" },
  { name: "Sourcing", pct: 0, color: "#F59E0B" },
  { name: "Foundation", pct: 0, color: "#22A36B" },
  { name: "Structure", pct: 0, color: "#2A6496" },
  { name: "Finishing", pct: 0, color: "#A8A29E" },
];

export default function MobileProjectPage() {
  const navigate = useNavigate();
  const { session, projects, activeProject, loadingProjects } = useMobileHub();
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (activeProject && !selectedId) setSelectedId(activeProject.id);
  }, [activeProject, selectedId]);

  const project = projects.find((p) => p.id === selectedId) || activeProject;
  const title = project?.title || "Your project";
  const subtitle = project
    ? `${flowTypeLabel(project.flow_type, project.source)} · ${projectStatusLabel(project.status)}`
    : "Start build or remodel to create one";

  const budget =
    project?.budget_min || project?.budget_max
      ? formatInrShort(project.budget_max || project.budget_min)
      : null;

  return (
    <>
      <MobileHeader title={title} subtitle={subtitle} />
      {!session?.supabaseUserId ? (
        <div style={{ padding: 16 }}>
          <p style={{ fontSize: 14, color: "#78716C", marginBottom: 16, lineHeight: 1.5 }}>
            Sign in to sync projects from build & remodel flows across devices.
          </p>
          <button type="button" className="hm-m-btn-primary" onClick={() => navigate("/sign-in")}>
            Sign in
          </button>
          <button type="button" className="hm-m-btn-secondary" style={{ marginTop: 10 }} onClick={() => navigate("/build")}>
            Start without signing in
          </button>
        </div>
      ) : !project && !loadingProjects ? (
        <div className="hm-m-empty" style={{ margin: 16 }}>
          <p>No saved project yet. Complete a build or remodel flow with AI v0 — it lands here automatically.</p>
          <button type="button" className="hm-m-btn-primary" onClick={() => navigate("/build/new-home")}>
            Build a new home
          </button>
          <button type="button" className="hm-m-btn-secondary" style={{ marginTop: 10 }} onClick={() => navigate("/build/remodel")}>
            Remodel a room
          </button>
        </div>
      ) : (
        <>
          {projects.length > 1 ? (
            <div className="hm-m-pill-row" style={{ marginTop: 8 }}>
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`hm-m-pill${p.id === project?.id ? " active" : ""}`}
                  onClick={() => setSelectedId(p.id)}
                >
                  {p.title || "Project"}
                </button>
              ))}
            </div>
          ) : null}

          {budget ? (
            <div className="hm-m-card" style={{ margin: "12px 16px" }}>
              <div style={{ fontSize: 12, color: "#78716C" }}>Budget band</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{budget}</div>
              {project?.city ? <div style={{ fontSize: 13, color: "#78716C", marginTop: 6 }}>{project.city}</div> : null}
            </div>
          ) : null}

          <p className="hm-m-section-title">Phases</p>
          <div className="hm-m-phase-scroll">
            {DEFAULT_PHASES.map((ph) => (
              <div key={ph.name} className="hm-m-phase-card">
                <div style={{ fontSize: 13, fontWeight: 700 }}>{ph.name}</div>
                <div style={{ fontSize: 12, color: "#78716C", marginTop: 6 }}>{ph.pct}%</div>
                <div className="hm-m-progress">
                  <span style={{ width: `${Math.max(ph.pct, 4)}%`, background: ph.color }} />
                </div>
              </div>
            ))}
          </div>

          <p className="hm-m-section-title" style={{ marginTop: 16 }}>
            Project hub
          </p>
          <div className="hm-m-grid-2" style={{ padding: "0 16px 24px" }}>
            {PROJECT_TOOLS.map((link) => (
              <button key={link.path} type="button" className="hm-m-quick" onClick={() => navigate(link.path)}>
                <span className="hm-m-quick-icon">{link.icon}</span>
                <span className="hm-m-quick-label">{link.label}</span>
              </button>
            ))}
          </div>
          {loadingProjects ? <p style={{ padding: 16, color: "#78716C", fontSize: 13 }}>Loading projects…</p> : null}
        </>
      )}
    </>
  );
}
