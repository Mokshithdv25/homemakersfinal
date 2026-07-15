import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileHeader from "../MobileHeader";
import { loadProjectBoard, updateProjectSchedule, updateProjectStageSchedule } from "../../lib/projectFlowApi";
import { useMobileHub } from "../hooks/useMobileHub";
import ProjectTimelineEditor from "../../components/ProjectTimelineEditor";

export default function MobileDesignJourneyPage() {
  const navigate = useNavigate();
  const { activeProject, loadingProjects, projectError } = useMobileHub();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (loadingProjects) return () => { cancelled = true; };
    if (!activeProject?.id) {
      setBoard(null);
      setLoading(false);
      return () => { cancelled = true; };
    }
    setLoading(true);
    setError("");
    loadProjectBoard({ projectId: activeProject.id, source: activeProject.source })
      .then((board) => {
        if (!cancelled) setBoard(board || null);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError?.message || "Could not load the saved design journey.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeProject?.id, activeProject?.source, loadingProjects]);

  const steps = board?.phases || [];
  const brief = board?.brief || {};
  const visualCount = [
    ...(board?.v0Pack?.images?.images || []),
    ...(board?.v0Pack?.images?.floor_plans || board?.v0Pack?.images?.floorPlans || board?.v0Pack?.floorPlans || []),
  ].length;

  const saveProjectSchedule = async (schedule) => {
    const saved = await updateProjectSchedule(activeProject.id, schedule);
    setBoard((current) => ({ ...current, project: { ...(current?.project || {}), ...saved } }));
    return saved;
  };

  const saveStageSchedule = async (phase, schedule) => {
    const saved = await updateProjectStageSchedule({ projectId: activeProject.id, stageId: phase.id, ...schedule });
    setBoard((current) => ({ ...current, phases: (current?.phases || []).map((row) => row.id === phase.id ? { ...row, startDate: saved.start_date || "", dueDate: saved.due_date || "" } : row) }));
    return saved;
  };

  return (
    <>
      <MobileHeader title="Design journey" subtitle="Brief → v0 → build" backTo="/project" />
      <div style={{ padding: "8px 16px 24px" }}>
        {loading ? <p style={{ color: "#78716C" }}>Loading saved stages…</p> : null}
        {!loading && (error || projectError) ? <p style={{ color: "#B91C1C" }}>{error || projectError}</p> : null}
        {!loading && !error && !projectError && steps.length === 0 ? (
          <div className="hm-m-empty">
            <p>Create or open a saved project to see its real design stages.</p>
            <button type="button" className="hm-m-btn-primary" onClick={() => navigate("/build")}>Start a project</button>
          </div>
        ) : null}
        {!loading && board ? (
          <div className="hm-m-journey-summary">
            <div><span>Project brief</span><strong>{brief.location || brief.city || activeProject?.city || "Location saved in your brief"}</strong></div>
            <div><span>AI v0</span><strong>{visualCount ? `${visualCount} saved visual${visualCount === 1 ? "" : "s"}` : board?.v0Pack?.estimate ? "Estimate ready" : "Not generated yet"}</strong></div>
            <div><span>Budget</span><strong>{brief.budgetLabel || (brief.budgetInr ? `₹${Number(brief.budgetInr).toLocaleString("en-IN")}` : "Add during planning")}</strong></div>
          </div>
        ) : null}
        {!loading && board?.v0Pack?.estimate?.project_summary ? <p className="hm-m-journey-note">{board.v0Pack.estimate.project_summary}</p> : null}
        {!loading && board ? <ProjectTimelineEditor project={board.project || activeProject} brief={brief} phases={steps} onSaveProject={saveProjectSchedule} onSaveStage={saveStageSchedule} /> : null}
        {steps.map((s, i) => (
          <div key={s.id || s.name || s.title || i} className="hm-m-journey-step">
            <div className="hm-m-journey-dot">{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontWeight: 700 }}>{s.name || s.title}</span>
                <span className={`hm-m-journey-badge ${s.status === "In Progress" ? "active" : ""}`}>{s.status || "Upcoming"}</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#78716C", lineHeight: 1.45 }}>{Number(s.pct || 0)}% of saved checklist tasks complete</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
