import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileHeader from "../MobileHeader";
import { useMobileHub } from "../hooks/useMobileHub";
import { flowTypeLabel, projectStatusLabel } from "../mobileIA";
import { AUTH_UI_ENABLED, PROJECT_HUB_DEMO_MODE } from "../../lib/authMode";
import { formatInrShort, loadProjectBoard } from "../../lib/projectFlowApi";
import { buildSignInRedirect } from "../../lib/requireHomeownerAuth";
import { buildHubAssistantContext } from "../../lib/hubAssistantContext";
import HmProjectAssistant from "../../components/HmProjectAssistant";
import HmCommandCenter from "../../components/HmCommandCenter";
import HmMorningBriefing from "../../components/HmMorningBriefing";

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
  const isDemoHub = PROJECT_HUB_DEMO_MODE && !project && !loadingProjects;
  const needsProjectPick = !project && !loadingProjects && !isDemoHub;
  const title = project?.title || "Your project";
  const subtitle = project
    ? `${flowTypeLabel(project.flow_type, project.source)} · ${projectStatusLabel(project.status)}`
    : needsProjectPick
      ? "Select or start a project"
      : "Loading…";

  const budget =
    project?.budget_min || project?.budget_max
      ? formatInrShort(project.budget_max || project.budget_min)
      : null;

  const [board, setBoard] = useState(null);

  useEffect(() => {
    if (!project?.id) {
      setBoard(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const data = await loadProjectBoard({ projectId: project.id, source: project.source });
      if (!cancelled) setBoard(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [project?.id, project?.source]);

  const hubQuery = project?.id ? `?projectId=${encodeURIComponent(project.id)}` : "";
  const boardTasks = board?.tasks || [];
  const boardMsgs = board?.messages || [];
  const boardPhases = board?.phases || DEFAULT_PHASES;
  const activePhase = boardPhases.find((p) => p.status === "In Progress")?.name || boardPhases[0]?.name || "Design & approval";

  const assistantContext = useMemo(
    () =>
      buildHubAssistantContext({
        signedIn: AUTH_UI_ENABLED ? Boolean(session?.supabaseUserId) : true,
        isDemoHub,
        userFirstName: (session?.name || "").split(/\s+/)[0] || "",
        projectId: project?.id || "",
        projectTitle: title,
        projectStatus: project?.status || "",
        flowLabel: project ? flowTypeLabel(project.flow_type, project.source) : "",
        activePhase,
        phasePct: boardPhases.find((p) => p.name === activePhase)?.pct ?? 0,
        tasks: boardTasks,
        messages: boardMsgs,
        phases: boardPhases,
        pendingTaskCount: boardTasks.filter((t) => !t.done).length,
        budgetLabel: budget,
        hasV0: Boolean(board?.v0Pack?.images || board?.v0Pack?.estimate),
        v0Pack: board?.v0Pack,
        location: project?.location || project?.city || "",
        timeline: project?.timeline_completion || "",
        hubQuery,
        signInPath: buildSignInRedirect("/project"),
      }),
    [
      session?.supabaseUserId,
      session?.name,
      isDemoHub,
      project,
      title,
      activePhase,
      boardTasks,
      boardMsgs,
      boardPhases,
      board?.v0Pack,
      budget,
      hubQuery,
    ],
  );

  return (
    <>
      <MobileHeader title={title} subtitle={subtitle} />
      {AUTH_UI_ENABLED && !session?.supabaseUserId ? (
        <div style={{ padding: 16 }}>
          <p style={{ fontSize: 14, color: "#78716C", marginBottom: 16, lineHeight: 1.5 }}>
            Sign in to sync projects from build & remodel flows across devices.
          </p>
          <button
            type="button"
            className="hm-m-btn-primary"
            onClick={() => navigate(buildSignInRedirect("/project"))}
          >
            Sign in with email
          </button>
          <button type="button" className="hm-m-btn-secondary" style={{ marginTop: 10 }} onClick={() => navigate("/build")}>
            Start without signing in
          </button>
        </div>
      ) : needsProjectPick ? (
        <div className="hm-m-empty" style={{ margin: 16 }}>
          <p style={{ fontSize: 14, color: "#78716C", marginBottom: 16, lineHeight: 1.5 }}>
            {projects.length > 0
              ? "Pick a saved project below, or start a new build or remodel."
              : "Finish a build or remodel flow with AI v0 — it appears here automatically."}
          </p>
          {projects.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="hm-m-btn-secondary"
                  onClick={() => setSelectedId(p.id)}
                >
                  {p.title || "Project"}
                </button>
              ))}
            </div>
          ) : null}
          <button type="button" className="hm-m-btn-primary" onClick={() => navigate("/build/new-home")}>
            Build a new home
          </button>
          <button type="button" className="hm-m-btn-secondary" style={{ marginTop: 10 }} onClick={() => navigate("/build/remodel")}>
            Remodel a room
          </button>
          <button
            type="button"
            className="hm-m-btn-secondary"
            style={{ marginTop: 10 }}
            onClick={() => window.dispatchEvent(new CustomEvent("hm-open-assistant"))}
          >
            Ask Homi
          </button>
        </div>
      ) : (
        <>
          <div style={{ padding: "0 16px" }}>
            <HmMorningBriefing context={assistantContext} onNavigatePath={(path) => navigate(path)} />
            <HmCommandCenter />
          </div>
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
          <button
            type="button"
            className="hm-m-btn-secondary"
            style={{ margin: "0 16px 16px" }}
            onClick={() => window.dispatchEvent(new CustomEvent("hm-open-assistant"))}
          >
            ✨ Ask Homi (AI co-pilot)
          </button>
        </>
      )}
      <HmProjectAssistant
        context={assistantContext}
        onNavigatePath={(path) => navigate(path)}
        defaultPhase="Design & approval"
      />
    </>
  );
}
