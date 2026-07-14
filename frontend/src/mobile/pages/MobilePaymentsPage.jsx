import React, { useEffect, useMemo, useState } from "react";
import MobileHeader from "../MobileHeader";
import { useProjectWorkspace } from "../../hooks/useProjectWorkspace";
import { addProjectPayment, listProjectPayments, updateProjectPayment } from "../../lib/projectWorkspaceApi";
import { formatInrShort } from "../../lib/projectFlowApi";

export default function MobilePaymentsPage() {
  const { project, projectId, error: projectError } = useProjectWorkspace();
  const [payments, setPayments] = useState([]);
  const [form, setForm] = useState({ title: "", amount_inr: "", status: "planned", category: "contractor" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (!projectId) return; let cancelled = false; listProjectPayments(projectId).then((rows) => { if (!cancelled) setPayments(rows); }).catch((err) => { if (!cancelled) setError(err?.message || "Could not load payment records."); }); return () => { cancelled = true; }; }, [projectId]);
  const paid = useMemo(() => payments.filter((row) => row.status === "paid").reduce((sum,row) => sum + Number(row.amount_inr || 0),0), [payments]);
  const submit = async (event) => { event.preventDefault(); setSaving(true); setError(""); try { const saved = await addProjectPayment(projectId, form); setPayments((rows) => [saved, ...rows]); setForm({ title: "", amount_inr: "", status: "planned", category: "contractor" }); } catch (err) { setError(err?.message || "Could not save the payment."); } finally { setSaving(false); } };
  const setStatus = async (payment,status) => { try { const updated = await updateProjectPayment(projectId,payment.id,{status}); setPayments((rows) => rows.map((row) => row.id === payment.id ? updated : row)); } catch (err) { setError(err?.message || "Could not update the payment."); } };
  return <><MobileHeader title="Payments ledger" subtitle={project?.title || "Owner-entered records"} backTo="/project" />
    {projectError || error ? <p role="alert" style={{ padding: "0 16px", color: "#B42318" }}>{projectError || error}</p> : null}
    <div style={{ padding: 16 }}><div className="hm-m-card" style={{ margin: "0 0 12px" }}><div style={{ color: "#78716C", fontSize: 12 }}>Recorded paid</div><div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{paid ? formatInrShort(paid) : "₹0"}</div><div style={{ color: "#78716C", fontSize: 11, marginTop: 4 }}>Ledger only — no money is moved.</div></div>
      <form onSubmit={submit} className="hm-m-card" style={{ margin: 0 }}><input required placeholder="Payment title" value={form.title} onChange={(e) => setForm((row) => ({...row,title:e.target.value}))} style={{ width: "100%", boxSizing: "border-box", padding: 10, border: "1px solid #E5DED6", borderRadius: 8, marginBottom: 8 }} /><input required type="number" min="0" placeholder="Amount in INR" value={form.amount_inr} onChange={(e) => setForm((row) => ({...row,amount_inr:e.target.value}))} style={{ width: "100%", boxSizing: "border-box", padding: 10, border: "1px solid #E5DED6", borderRadius: 8, marginBottom: 8 }} /><button type="submit" className="hm-m-btn-primary" disabled={saving || !projectId}>{saving ? "Saving…" : "Save payment record"}</button></form>
      <div style={{ marginTop: 14 }}>{payments.length === 0 ? <p style={{ color: "#78716C", fontSize: 14 }}>No payment records saved yet.</p> : payments.map((payment) => <div key={payment.id} className="hm-m-card" style={{ margin: "8px 0", display: "flex", alignItems: "center", gap: 10 }}><div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{payment.title}</div><div style={{ fontSize: 13, marginTop: 3 }}>{formatInrShort(payment.amount_inr)}</div></div><select value={payment.status} onChange={(e) => setStatus(payment,e.target.value)} style={{ padding: 8, border: "1px solid #E5DED6", borderRadius: 8 }}><option value="planned">Planned</option><option value="due">Due</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option></select></div>)}</div>
    </div>
  </>;
}
