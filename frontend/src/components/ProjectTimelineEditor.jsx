import React, { useEffect, useState } from "react";
import { CalendarClock, Save } from "lucide-react";
import "./ProjectTimelineEditor.css";

export default function ProjectTimelineEditor({ project, brief, phases = [], onSaveProject, onSaveStage }) {
  const [overall, setOverall] = useState({ start: "", completion: "" });
  const [stageDrafts, setStageDrafts] = useState({});
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setOverall({ start: project?.timeline_start || "", completion: project?.timeline_completion || "" });
  }, [project?.id, project?.timeline_start, project?.timeline_completion]);

  useEffect(() => {
    setStageDrafts(Object.fromEntries(phases.map((phase) => [phase.id || phase.name, {
      startDate: phase.startDate || "",
      dueDate: phase.dueDate || "",
    }])));
  }, [phases]);

  const saveOverall = async () => {
    setSaving("overall");
    setMessage("");
    try {
      await onSaveProject?.({ timelineStart: overall.start, timelineCompletion: overall.completion });
      setMessage("Project target saved.");
    } catch (error) {
      setMessage(error?.message || "Could not save the project timeline.");
    } finally {
      setSaving("");
    }
  };

  const saveStage = async (phase) => {
    const key = phase.id || phase.name;
    setSaving(key);
    setMessage("");
    try {
      await onSaveStage?.(phase, stageDrafts[key] || {});
      setMessage(`${phase.name} dates saved.`);
    } catch (error) {
      setMessage(error?.message || "Could not save the stage dates.");
    } finally {
      setSaving("");
    }
  };

  const briefTimeline = brief?.timeline || brief?.completionTime || "";

  return (
    <section className="hm-timeline-editor">
      <header><div className="hm-timeline-editor__icon"><CalendarClock size={20} /></div><div><p>Editable project schedule</p><h3>You control the dates</h3><span>The initial overall target is copied from the build or remodel brief. Stage dates remain blank until you or your team set them; AI may suggest dates, but never silently changes them.</span></div></header>
      <div className="hm-timeline-editor__overall">
        <label><span>Start target</span><input value={overall.start} onChange={(event) => setOverall((current) => ({ ...current, start: event.target.value }))} placeholder="e.g. September 2026" /></label>
        <label><span>Completion target</span><input value={overall.completion} onChange={(event) => setOverall((current) => ({ ...current, completion: event.target.value }))} placeholder="e.g. 12 months or August 2027" /></label>
        <button type="button" onClick={saveOverall} disabled={saving === "overall"}><Save size={15} /> {saving === "overall" ? "Saving…" : "Save target"}</button>
      </div>
      <p className="hm-timeline-editor__source">Current source: project record{briefTimeline ? ` · original brief target: ${briefTimeline}` : " · no target was supplied in the original brief"}.</p>
      <div className="hm-timeline-editor__stages">
        {phases.map((phase) => { const key = phase.id || phase.name; const draft = stageDrafts[key] || {}; return (
          <div key={key} className="hm-timeline-editor__stage">
            <div><strong>{phase.name}</strong><span>{phase.status || "Upcoming"} · {Number(phase.pct || 0)}% complete</span></div>
            <label><span>Start</span><input type="date" value={draft.startDate || ""} onChange={(event) => setStageDrafts((current) => ({ ...current, [key]: { ...draft, startDate: event.target.value } }))} /></label>
            <label><span>End</span><input type="date" value={draft.dueDate || ""} onChange={(event) => setStageDrafts((current) => ({ ...current, [key]: { ...draft, dueDate: event.target.value } }))} /></label>
            <button type="button" onClick={() => saveStage(phase)} disabled={saving === key}>{saving === key ? "Saving…" : "Save"}</button>
          </div>
        ); })}
      </div>
      {message ? <p className="hm-timeline-editor__message" role="status">{message}</p> : null}
    </section>
  );
}
