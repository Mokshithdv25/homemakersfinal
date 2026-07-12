import React, { useEffect, useState } from "react";
import MobileHeader from "../MobileHeader";
import { useProjectWorkspace } from "../../hooks/useProjectWorkspace";
import { addProjectTeamMember, listProjectTeam, removeProjectTeamMember, updateProjectTeamMember } from "../../lib/projectWorkspaceApi";

export default function MobileTeamPage() {
  const { project, projectId, error: projectError } = useProjectWorkspace();
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ name: "", role: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (!projectId) return; let cancelled = false; listProjectTeam(projectId).then((rows) => { if (!cancelled) setMembers(rows); }).catch((err) => { if (!cancelled) setError(err?.message || "Could not load the team."); }); return () => { cancelled = true; }; }, [projectId]);

  const submit = async (event) => { event.preventDefault(); setSaving(true); setError(""); try { const saved = await addProjectTeamMember(projectId, form); setMembers((rows) => [...rows, saved]); setForm({ name: "", role: "" }); } catch (err) { setError(err?.message || "Could not add the team member."); } finally { setSaving(false); } };
  const changeStatus = async (member, status) => { try { const updated = await updateProjectTeamMember(projectId, member.id, { status }); setMembers((rows) => rows.map((row) => row.id === member.id ? updated : row)); } catch (err) { setError(err?.message || "Could not update the member."); } };
  const remove = async (member) => { if (!window.confirm(`Remove ${member.name}?`)) return; try { await removeProjectTeamMember(projectId, member.id); setMembers((rows) => rows.filter((row) => row.id !== member.id)); } catch (err) { setError(err?.message || "Could not remove the member."); } };

  return <><MobileHeader title="Project team" subtitle={project?.title || "Saved contacts"} />
    {projectError || error ? <p role="alert" style={{ padding: "0 16px", color: "#B42318" }}>{projectError || error}</p> : null}
    <div style={{ padding: 16 }}><form onSubmit={submit} className="hm-m-card" style={{ margin: 0 }}><div style={{ fontWeight: 700, marginBottom: 10 }}>Add team member</div><input placeholder="Name" required value={form.name} onChange={(e) => setForm((row) => ({...row,name:e.target.value}))} style={{ width: "100%", boxSizing: "border-box", padding: 10, border: "1px solid #E5DED6", borderRadius: 8, marginBottom: 8 }} /><input placeholder="Role" required value={form.role} onChange={(e) => setForm((row) => ({...row,role:e.target.value}))} style={{ width: "100%", boxSizing: "border-box", padding: 10, border: "1px solid #E5DED6", borderRadius: 8, marginBottom: 8 }} /><button type="submit" className="hm-m-btn-primary" disabled={saving || !projectId}>{saving ? "Saving…" : "Save member"}</button></form>
      <div style={{ marginTop: 14 }}>{members.length === 0 ? <p style={{ color: "#78716C", fontSize: 14 }}>No team members saved yet.</p> : members.map((member) => <div key={member.id} className="hm-m-card" style={{ margin: "8px 0" }}><div style={{ fontWeight: 700 }}>{member.name}</div><div style={{ color: "#78716C", fontSize: 13, marginTop: 3 }}>{member.role}</div><div style={{ display: "flex", gap: 8, marginTop: 10 }}><select value={member.status} onChange={(e) => changeStatus(member,e.target.value)} style={{ flex: 1, padding: 8, border: "1px solid #E5DED6", borderRadius: 8 }}><option value="invited">Invited</option><option value="active">Active</option><option value="inactive">Inactive</option></select><button type="button" onClick={() => remove(member)} style={{ border: 0, background: "none", color: "#B42318" }}>Remove</button></div></div>)}</div>
    </div>
  </>;
}
