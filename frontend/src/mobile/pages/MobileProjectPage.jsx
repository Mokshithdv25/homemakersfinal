import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import MobileHeader from "../MobileHeader";
import { useMobileHub } from "../hooks/useMobileHub";
import { flowTypeLabel, projectStatusLabel } from "../mobileIA";
import { AUTH_UI_ENABLED, PROJECT_HUB_DEMO_MODE } from "../../lib/authMode";
import {
  addProjectTask,
  derivePhaseProgress,
  formatInrShort,
  loadProjectBoard,
  setProjectStageStatus,
  setProjectTaskDone,
} from "../../lib/projectFlowApi";
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
  { label: "Payments", path: "/project/payments", icon: "💳" },
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
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardError, setBoardError] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskSaving, setTaskSaving] = useState(false);

  useEffect(() => {
    if (!project?.id) {
      setBoard(null);
      setBoardError("");
      return;
    }
    let cancelled = false;
    (async () => {
      setBoardLoading(true);
      setBoardError("");
      try {
        const data = await loadProjectBoard({ projectId: project.id, source: project.source });
        if (!data) throw new Error("This project could not be loaded for the signed-in account.");
        if (!cancelled) setBoard(data);
      } catch (err) {
        if (!cancelled) setBoardError(err?.message || "Could not load this project.");
      } finally {
        if (!cancelled) setBoardLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project?.id, project?.source]);

  const hubQuery = project?.id ? `?projectId=${encodeURIComponent(project.id)}` : "";
  const boardTasks = useMemo(() => board?.tasks || [], [board?.tasks]);
  const boardMsgs = useMemo(() => board?.messages || [], [board?.messages]);
  const boardPhases = useMemo(() => board?.phases || [], [board?.phases]);
  const activePhase = boardPhases.find((p) => p.status === "In Progress")?.name || boardPhases[0]?.name || "";

  const saveTask = async (event) => {
    event.preventDefault();
    const titleValue = taskTitle.trim();
    if (!project?.id || !titleValue || !activePhase) return;
    setTaskSaving(true);
    setBoardError("");
    try {
      const id = await addProjectTask({ projectId: project.id, title: titleValue, phaseName: activePhase });
      setBoard((current) => ({
        ...current,
        tasks: [...(current?.tasks || []), { id, name: titleValue, phase: activePhase, done: false, date: "Just now", assignee: "Team" }],
        phases: derivePhaseProgress(current?.phases || [], [...(current?.tasks || []), { id, name: titleValue, phase: activePhase, done: false }]),
      }));
      setTaskTitle("");
    } catch (err) {
      setBoardError(err?.message || "Could not save the task.");
    } finally {
      setTaskSaving(false);
    }
  };

  const toggleTask = async (task) => {
    setBoardError("");
    try {
      await setProjectTaskDone(task.id, !task.done);
      setBoard((current) => ({
        ...current,
        tasks: (current?.tasks || []).map((row) => row.id === task.id ? { ...row, done: !row.done } : row),
        phases: derivePhaseProgress(
          current?.phases || [],
          (current?.tasks || []).map((row) => row.id === task.id ? { ...row, done: !row.done } : row),
        ),
      }));
    } catch (err) {
      setBoardError(err?.message || "Could not update the task.");
    }
  };

  const changeStageStatus = async (event) => {
    const stage = boardPhases.find((row) => row.name === activePhase);
    if (!stage?.id || !project?.id) return;
    const status = event.target.value;
    if (status === "done" && stage.pct < 100) {
      setBoardError("Complete every checklist task before marking this stage done.");
      return;
    }
    setBoardError("");
    try {
      await setProjectStageStatus(stage.id, project.id, status);
      const label = status === "done" ? "Done" : status === "blocked" ? "Blocked" : status === "in_progress" ? "In Progress" : "Upcoming";
      setBoard((current) => ({ ...current, phases: (current?.phases || []).map((row) => row.id === stage.id ? { ...row, status: label, pct: status === "done" ? 100 : row.pct } : row) }));
    } catch (err) {
      setBoardError(err?.message || "Could not update the stage status.");
    }
  };

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
      <MobileHeader
        title={title}
        subtitle={subtitle}
        right={(
          <button type="button" className="hm-m-icon-btn" aria-label="Start a new project" onClick={() => navigate("/build")}>
            <Plus size={22} />
          </button>
        )}
      />
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

          {boardError ? <p role="alert" style={{ padding: "10px 16px", color: "#B42318", fontSize: 13 }}>{boardError}</p> : null}
          <p className="hm-m-section-title">Phases</p>
          {boardLoading ? (
            <p style={{ padding: "0 16px", color: "#78716C", fontSize: 13 }}>Loading saved project…</p>
          ) : boardPhases.length === 0 ? (
            <p style={{ padding: "0 16px", color: "#78716C", fontSize: 13 }}>No saved phases are available for this project.</p>
          ) : (
          <div className="hm-m-phase-scroll">
            {boardPhases.map((ph) => (
              <div key={ph.name} className="hm-m-phase-card">
                <div style={{ fontSize: 13, fontWeight: 700 }}>{ph.name}</div>
                <div style={{ fontSize: 12, color: "#78716C", marginTop: 6 }}>{ph.pct}%</div>
                <div className="hm-m-progress">
                  <span style={{ width: `${Math.max(ph.pct, 4)}%`, background: ph.color }} />
                </div>
              </div>
            ))}
          </div>
          )}
          {activePhase ? (
            <label className="hm-m-stage-status">
              <span>{activePhase} status</span>
              <select value={boardPhases.find((row) => row.name === activePhase)?.status === "Done" ? "done" : boardPhases.find((row) => row.name === activePhase)?.status === "Blocked" ? "blocked" : boardPhases.find((row) => row.name === activePhase)?.status === "In Progress" ? "in_progress" : "upcoming"} onChange={changeStageStatus} style={{ flex: 1, padding: 9, border: "1px solid #E5DED6", borderRadius: 8, background: "#fff" }}>
                <option value="upcoming">Upcoming</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="done" disabled={(boardPhases.find((row) => row.name === activePhase)?.pct || 0) < 100}>Done — checklist complete</option>
              </select>
            </label>
          ) : null}

          <p className="hm-m-section-title" style={{ marginTop: 16 }}>Tasks</p>
          <div style={{ padding: "0 16px" }}>
            <form onSubmit={saveTask} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder={activePhase ? `Add a task to ${activePhase}` : "Project phases are still loading"}
                disabled={!activePhase || taskSaving}
                style={{ flex: 1, minWidth: 0, border: "1px solid #E7DED3", borderRadius: 10, padding: "10px 12px" }}
              />
              <button type="submit" className="hm-m-btn-primary" disabled={!taskTitle.trim() || !activePhase || taskSaving} style={{ width: "auto", padding: "0 16px" }}>
                {taskSaving ? "Saving…" : "Add"}
              </button>
            </form>
            {boardTasks.length === 0 ? (
              <p style={{ color: "#78716C", fontSize: 13 }}>No saved tasks yet.</p>
            ) : boardTasks.map((task) => (
              <label key={task.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #F0E8DF" }}>
                <input type="checkbox" checked={Boolean(task.done)} onChange={() => toggleTask(task)} />
                <span style={{ flex: 1, fontSize: 14, textDecoration: task.done ? "line-through" : "none" }}>
                  {task.name}
                  <small style={{ display: "block", color: "#78716C", marginTop: 3 }}>{task.phase}</small>
                </span>
              </label>
            ))}
          </div>

          <p className="hm-m-section-title" style={{ marginTop: 16 }}>
            Project hub
          </p>
          <div className="hm-m-grid-2" style={{ padding: "0 16px 24px" }}>
            {PROJECT_TOOLS.map((link) => (
              <button key={link.path} type="button" className="hm-m-quick" onClick={() => navigate(`${link.path}${hubQuery}`)}>
                <span className="hm-m-quick-icon">{link.icon}</span>
                <span className="hm-m-quick-label">{link.label}</span>
              </button>
            ))}
          </div>
          {loadingProjects ? <p style={{ padding: 16, color: "#78716C", fontSize: 13 }}>Loading projects…</p> : null}
          <button
            type="button"
            className="hm-m-btn-secondary"
            style={{ width: "calc(100% - 32px)", margin: "0 16px 16px" }}
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
