import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LandingNavbar from "../components/landing/LandingNavbar";
import { HM_FIXED_NAV_OFFSET_CLASS } from "../lib/hmBrand";
import { useProjectWorkspace } from "../hooks/useProjectWorkspace";
import { addProjectPayment, listProjectPayments, removeProjectPayment, updateProjectPayment } from "../lib/projectWorkspaceApi";
import { formatInrShort } from "../lib/projectFlowApi";

const OR = "#C85F2B";
const EMPTY = { title: "", amount_inr: "", category: "contractor", status: "planned", due_date: "", reference: "", notes: "" };

export default function ProjectPayments() {
  const navigate = useNavigate();
  const { projects, project, projectId, loading: projectsLoading, error: projectError, selectProject } = useProjectWorkspace();
  const [payments, setPayments] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => { setLoading(true); setError(""); try { const rows = await listProjectPayments(projectId); if (!cancelled) setPayments(rows); } catch (err) { if (!cancelled) setError(err?.message || "Could not load payment records."); } finally { if (!cancelled) setLoading(false); } })();
    return () => { cancelled = true; };
  }, [projectId]);

  const summary = useMemo(() => payments.reduce((acc, payment) => {
    const amount = Number(payment.amount_inr || 0);
    acc.total += amount;
    if (payment.status === "paid") acc.paid += amount;
    if (payment.status === "due") acc.due += amount;
    return acc;
  }, { total: 0, paid: 0, due: 0 }), [payments]);

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try { const saved = await addProjectPayment(projectId, form); setPayments((rows) => [saved, ...rows]); setForm(EMPTY); }
    catch (err) { setError(err?.message || "Could not save the payment record."); }
    finally { setSaving(false); }
  };

  const setStatus = async (payment, status) => {
    try { const updated = await updateProjectPayment(projectId, payment.id, { status }); setPayments((rows) => rows.map((row) => row.id === payment.id ? updated : row)); }
    catch (err) { setError(err?.message || "Could not update the payment record."); }
  };

  const remove = async (payment) => {
    if (!window.confirm(`Delete payment record “${payment.title}”?`)) return;
    try { await removeProjectPayment(projectId, payment.id); setPayments((rows) => rows.filter((row) => row.id !== payment.id)); }
    catch (err) { setError(err?.message || "Could not delete the payment record."); }
  };

  return (
    <div className={HM_FIXED_NAV_OFFSET_CLASS} style={{ minHeight: "100vh", background: "#FBF7F2" }}>
      <LandingNavbar />
      <main style={{ maxWidth: 1020, margin: "0 auto", padding: "36px 24px" }}>
        <button type="button" onClick={() => navigate(projectId ? `/project?projectId=${encodeURIComponent(projectId)}` : "/project")} style={{ border: 0, background: "none", color: OR, fontWeight: 700, cursor: "pointer", padding: 0 }}>← Project hub</button>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "end", flexWrap: "wrap", margin: "18px 0" }}><div><h1 style={{ margin: 0, fontSize: 28 }}>Payments ledger</h1><p style={{ color: "#78716C", margin: "6px 0 0" }}>Owner-entered project records. This does not move money or charge a card.</p></div>{projects.length > 1 ? <select value={projectId} onChange={(event) => selectProject(event.target.value)} style={{ padding: "10px 12px", border: "1px solid #D7CEC5", borderRadius: 9 }}>{projects.map((row) => <option key={row.id} value={row.id}>{row.title || "Project"}</option>)}</select> : null}</div>
        {projectError || error ? <p role="alert" style={{ color: "#B42318" }}>{projectError || error}</p> : null}
        {projectsLoading ? <p>Loading projects…</p> : !project ? <div style={{ background: "#fff", padding: 24, borderRadius: 14 }}>Create a project before recording payments.</div> : <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginBottom: 16 }}>{[["Recorded",summary.total],["Paid",summary.paid],["Due",summary.due]].map(([label,value]) => <div key={label} style={{ background: "#fff", border: "1px solid #E8E4DE", borderRadius: 12, padding: 16 }}><div style={{ color: "#78716C", fontSize: 12, fontWeight: 700 }}>{label}</div><div style={{ fontSize: 22, fontWeight: 800, marginTop: 7 }}>{value ? formatInrShort(value) : "₹0"}</div></div>)}</div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, .8fr) minmax(0, 1.2fr)", gap: 16 }}>
            <form onSubmit={submit} style={{ background: "#fff", border: "1px solid #E8E4DE", borderRadius: 14, padding: 20, alignSelf: "start" }}><h2 style={{ margin: "0 0 14px", fontSize: 18 }}>Add payment record</h2>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Title<input required value={form.title} onChange={(e) => setForm((row) => ({...row,title:e.target.value}))} style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 5, padding: 10, border: "1px solid #D7CEC5", borderRadius: 8 }} /></label>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Amount (INR)<input required type="number" min="0" step="1" value={form.amount_inr} onChange={(e) => setForm((row) => ({...row,amount_inr:e.target.value}))} style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 5, padding: 10, border: "1px solid #D7CEC5", borderRadius: 8 }} /></label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}><label style={{ fontSize: 12, fontWeight: 700 }}>Category<select value={form.category} onChange={(e) => setForm((row) => ({...row,category:e.target.value}))} style={{ display: "block", width: "100%", marginTop: 5, padding: 10, border: "1px solid #D7CEC5", borderRadius: 8 }}><option value="professional">Professional</option><option value="contractor">Contractor</option><option value="material">Material</option><option value="permit">Permit</option><option value="other">Other</option></select></label><label style={{ fontSize: 12, fontWeight: 700 }}>Status<select value={form.status} onChange={(e) => setForm((row) => ({...row,status:e.target.value}))} style={{ display: "block", width: "100%", marginTop: 5, padding: 10, border: "1px solid #D7CEC5", borderRadius: 8 }}><option value="planned">Planned</option><option value="due">Due</option><option value="paid">Paid</option></select></label></div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, margin: "10px 0" }}>Due date<input type="date" value={form.due_date} onChange={(e) => setForm((row) => ({...row,due_date:e.target.value}))} style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 5, padding: 10, border: "1px solid #D7CEC5", borderRadius: 8 }} /></label>
              <button type="submit" disabled={saving} style={{ width: "100%", border: 0, borderRadius: 9, background: OR, color: "#fff", padding: 11, fontWeight: 700, cursor: "pointer" }}>{saving ? "Saving…" : "Save record"}</button>
            </form>
            <section style={{ background: "#fff", border: "1px solid #E8E4DE", borderRadius: 14, padding: 20 }}><h2 style={{ margin: "0 0 14px", fontSize: 18 }}>{project.title || "Project"} records</h2>{loading ? <p>Loading records…</p> : payments.length === 0 ? <p style={{ color: "#78716C" }}>No payment records have been saved.</p> : payments.map((payment) => <div key={payment.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "13px 0", borderTop: "1px solid #F0E8DF" }}><div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{payment.title}</div><div style={{ color: "#78716C", fontSize: 12, marginTop: 3 }}>{payment.category}{payment.due_date ? ` · due ${new Date(`${payment.due_date}T00:00:00`).toLocaleDateString("en-IN")}` : ""}</div></div><strong>{formatInrShort(payment.amount_inr)}</strong><select value={payment.status} onChange={(e) => setStatus(payment,e.target.value)} style={{ border: "1px solid #D7CEC5", borderRadius: 8, padding: 7 }}><option value="planned">Planned</option><option value="due">Due</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option></select><button type="button" onClick={() => remove(payment)} style={{ border: 0, background: "none", color: "#B42318", cursor: "pointer" }}>Delete</button></div>)}</section>
          </div>
        </>}
      </main>
    </div>
  );
}
