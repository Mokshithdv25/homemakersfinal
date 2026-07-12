import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileHeader from "../MobileHeader";
import { loadProjectBoard } from "../../lib/projectFlowApi";
import { useMobileHub } from "../hooks/useMobileHub";

export default function MobileDesignJourneyPage() {
  const navigate = useNavigate();
  const { activeProject, loadingProjects, projectError } = useMobileHub();
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (loadingProjects) return () => { cancelled = true; };
    if (!activeProject?.id) {
      setSteps([]);
      setLoading(false);
      return () => { cancelled = true; };
    }
    setLoading(true);
    setError("");
    loadProjectBoard({ projectId: activeProject.id, source: activeProject.source })
      .then((board) => {
        if (!cancelled) setSteps(board?.phases || []);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError?.message || "Could not load the saved design journey.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeProject?.id, activeProject?.source, loadingProjects]);

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
