import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProjectHubShell from "../components/ProjectHubShell";
import HmFormDialog from "../components/HmFormDialog";

const OR = "#C85F2B";

/** Four vault categories — minimal set, each with an icon (ids used in folder/file data). */
const DOC_CATEGORY_DEFS = [
  { id: "plans", icon: "📐", title: "Design & plans", blurb: "Drawings, specs, structural & MEP calcs, BOQs" },
  { id: "property", icon: "🏛️", title: "Property & permits", blurb: "Title, tax, BBMP, NOCs, encumbrance / EC" },
  { id: "commercial", icon: "🧾", title: "Contracts & finance", blurb: "Agreements, invoices, receipts, payments" },
  { id: "site", icon: "📸", title: "Site media", blurb: "Progress photos & site videos" },
];

function categoryMeta(categoryId) {
  const d = DOC_CATEGORY_DEFS.find((c) => c.id === categoryId);
  if (d) return d;
  if (categoryId === "Uncategorized") return { id: "Uncategorized", icon: "📎", title: "Uncategorized", blurb: "" };
  return { id: categoryId, icon: "📎", title: categoryId, blurb: "" };
}

const INITIAL_FOLDERS = [
  { id: "pl", icon: "📐", name: "Design & plans", sub: "Drawings, specs, structural & MEP calcs, BOQs", files: 27, date: "19 Jun 2024, 10:30 AM", who: "Neha Verma", role: "Architect", category: "plans" },
  { id: "pr", icon: "🏛️", name: "Property & permits", sub: "Title, tax, BBMP, NOCs, encumbrance / EC, survey maps", files: 11, date: "18 Jun 2024, 04:15 PM", who: "Rajesh Kumar", role: "Contractor", category: "property" },
  { id: "co", icon: "🧾", name: "Contracts & finance", sub: "Signed agreements, invoices, receipts, payment proofs", files: 36, date: "20 Jun 2024, 09:45 AM", who: "Ankit Sharma", role: "Homeowner", category: "commercial" },
  { id: "si", icon: "📸", name: "Site media", sub: "Site photos, walkthroughs, drone stills", files: 156, date: "Today, 10:30 AM", who: "Rajesh Kumar", role: "Contractor", category: "site" },
];

const INITIAL_FILES = [
  { id: "f1", name: "Shanti_Nagar_Structural_Drawing_Set_03.pdf", type: "PDF", size: "2.4 MB", date: "20 Jun 2024, 10:30 AM", who: "Neha Verma", role: "Architect", category: "plans", ts: new Date("2024-06-20T10:30:00").getTime() },
  { id: "f2", name: "RCC_Column_Details.xlsx", type: "Excel", size: "1.2 MB", date: "19 Jun 2024, 05:30 PM", who: "Rajesh Kumar", role: "Contractor", category: "plans", ts: new Date("2024-06-19T17:30:00").getTime() },
  { id: "f3", name: "Building_Permit_Approval.pdf", type: "PDF", size: "1.8 MB", date: "18 Jun 2024, 11:15 AM", who: "Suresh Yadav", role: "Contractor", category: "property", ts: new Date("2024-06-18T11:15:00").getTime() },
  { id: "f4", name: "Material_Test_Report_Compressive_Strength.pdf", type: "PDF", size: "3.1 MB", date: "17 Jun 2024, 04:45 PM", who: "Neha Verma", role: "Architect", category: "plans", ts: new Date("2024-06-16T16:45:00").getTime() },
  { id: "f5", name: "Title_Deed_Scan_2023.pdf", type: "PDF", size: "890 KB", date: "12 Jun 2024, 02:00 PM", who: "Ankit Sharma", role: "Homeowner", category: "property", ts: new Date("2024-06-12T14:00:00").getTime() },
  { id: "f6", name: "Property_Tax_Receipt_FY24.pdf", type: "PDF", size: "420 KB", date: "10 Jun 2024, 11:30 AM", who: "Ankit Sharma", role: "Homeowner", category: "property", ts: new Date("2024-06-10T11:30:00").getTime() },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "PDF", label: "PDF" },
  { value: "Excel", label: "Excel" },
  { value: "Image", label: "Image" },
];

const SORT_OPTIONS = [
  { value: "modified_desc", label: "Last modified (newest)" },
  { value: "modified_asc", label: "Last modified (oldest)" },
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "size_desc", label: "Size (largest)" },
];

/** Matches project overview stages — used when tagging uploads from the dashboard link. */
const PROJECT_STAGE_OPTIONS = [
  { value: "", label: "Stage (optional)" },
  { value: "Design & Approval", label: "Design & Approval" },
  { value: "Sourcing", label: "Sourcing" },
  { value: "Site & Foundation", label: "Site & Foundation" },
  { value: "Structure", label: "Structure" },
  { value: "Finishing", label: "Finishing" },
];

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function Avatar({ name, size = 30 }) {
  const cols = [OR, "#2A6496", "#22A36B", "#7A4FC0", "#D97706"];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: cols[name.charCodeAt(0) % 5],
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)}
    </div>
  );
}

function FileIcon({ type }) {
  const map = { PDF: ["#EF4444", "PDF"], Excel: ["#22A36B", "XLS"], Image: ["#3B82F6", "IMG"] };
  const [bg, lbl] = map[type] || [OR, type.slice(0, 3)];
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 5,
        background: bg,
        color: "#fff",
        fontSize: 8,
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {lbl}
    </div>
  );
}

function DonutChart({ pct = 42 }) {
  const r = 52;
  const cx = 60;
  const cy = 60;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2D9CF" strokeWidth="14" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#22A36B"
        strokeWidth="14"
        strokeDasharray={`${(pct / 100) * circ} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
      />
      <text x="60" y="56" textAnchor="middle" fontSize="18" fontWeight="800" fill="#1C1917">
        {pct}%
      </text>
      <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#7A6E62">
        Used
      </text>
    </svg>
  );
}

const selectStyle = {
  padding: "9px 12px",
  borderRadius: 9,
  border: "1.5px solid #D1C9BF",
  background: "#fff",
  fontSize: 13,
  color: "#5C5147",
  cursor: "pointer",
  maxWidth: 200,
};

export default function DocumentVault() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
  const [files, setFiles] = useState(INITIAL_FILES);
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("modified_desc");
  const [toast, setToast] = useState("");
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const stageFromUrl = searchParams.get("stage") || "";
  const [uploadStage, setUploadStage] = useState(stageFromUrl);

  useEffect(() => {
    if (stageFromUrl) setUploadStage(stageFromUrl);
  }, [stageFromUrl]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  const clearStageFromUrl = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("stage");
    setSearchParams(next, { replace: true });
  };

  const filteredFolders = useMemo(() => {
    let list = [...folders];
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((f) => f.name.toLowerCase().includes(q) || f.sub.toLowerCase().includes(q));
    return list;
  }, [folders, search]);

  const filteredFiles = useMemo(() => {
    let list = [...files];
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((f) => f.name.toLowerCase().includes(q) || f.who.toLowerCase().includes(q));
    if (typeFilter !== "all") list = list.filter((f) => f.type === typeFilter);
    list.sort((a, b) => {
      if (sortBy === "modified_desc") return b.ts - a.ts;
      if (sortBy === "modified_asc") return a.ts - b.ts;
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      const sa = parseFloat(String(a.size).replace(/[^\d.]/g, "")) || 0;
      const sb = parseFloat(String(b.size).replace(/[^\d.]/g, "")) || 0;
      return sb - sa;
    });
    return list;
  }, [files, search, typeFilter, sortBy]);

  const onUpload = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (!picked.length) return;
    const now = Date.now();
    const stageLabel = uploadStage || "";
    const added = picked.map((file, i) => {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      let type = "PDF";
      if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) type = "Image";
      else if (["xlsx", "xls", "csv"].includes(ext)) type = "Excel";
      return {
        id: `up-${now}-${i}`,
        name: file.name,
        type,
        size: formatBytes(file.size),
        date: "Just now",
        who: "You",
        role: "Homeowner",
        category: "Uncategorized",
        ts: now,
        projectStage: stageLabel || undefined,
      };
    });
    setFiles((prev) => [...added, ...prev]);
    const stageMsg = stageLabel ? ` · tagged: ${stageLabel}` : "";
    showToast(`${added.length} file(s) added${stageMsg}`);
  };

  const newFolder = () => setFolderDialogOpen(true);

  const submitNewFolder = ({ value: name }) => {
    if (!name) return;
    setFolders((prev) => [
      ...prev,
      {
        id: `fd-${Date.now()}`,
        icon: "📁",
        name,
        sub: "Custom folder",
        files: 0,
        date: "Just now",
        who: "You",
        role: "Homeowner",
        category: "Uncategorized",
      },
    ]);
    setFolderDialogOpen(false);
    showToast("Folder created");
  };

  const S = {
    th: { fontSize: 11, fontWeight: 700, color: "#9A8F87", padding: "8px 12px", textAlign: "left", letterSpacing: "0.06em" },
    td: { fontSize: 13, padding: "12px 12px", borderBottom: "1px solid #F5EFE8" },
  };

  return (
    <ProjectHubShell>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div
          className="doc-vault-main-grid px-5 md:px-10"
          style={{ flex: 1, paddingTop: 24, paddingBottom: 24, overflowY: "auto", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(240px,290px)", gap: 24, alignItems: "start" }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Document Vault</h1>
                  <span style={{ fontSize: 18 }}>🛡️</span>
                </div>
                <p style={{ fontSize: 13, color: "#7A6E62", marginTop: 4 }}>Open a folder, upload, or find files — categories stay in the table as tags.</p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={onUpload} aria-hidden />
                <select value={uploadStage} onChange={(e) => setUploadStage(e.target.value)} style={{ ...selectStyle, maxWidth: 200 }} aria-label="Project stage for new uploads">
                  {PROJECT_STAGE_OPTIONS.map((o) => (
                    <option key={o.value || "none"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", border: "1.5px solid #D1C9BF", borderRadius: 9, background: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  ⬆ Upload
                </button>
                <button
                  type="button"
                  onClick={newFolder}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", border: "none", borderRadius: 9, background: OR, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  + New Folder
                </button>
                <button type="button" style={{ padding: "9px 12px", border: "1.5px solid #D1C9BF", borderRadius: 9, background: "#fff", cursor: "pointer", fontSize: 16 }} onClick={() => showToast("More actions (share, export) — coming soon")}>
                  ⋮
                </button>
              </div>
            </div>

            {toast ? (
              <div role="status" style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 8, background: "#F0F8EE", border: "1px solid #C3DEB8", fontSize: 13, color: "#166534" }}>
                {toast}
              </div>
            ) : null}

            {stageFromUrl ? (
              <div
                role="status"
                style={{
                  marginBottom: 16,
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "#FDF8F3",
                  border: `1px solid ${OR}`,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontSize: 13, color: "#44403C", lineHeight: 1.45 }}>
                  <strong style={{ color: "#1C1917" }}>Project stage:</strong> {stageFromUrl}. New uploads will be tagged with this stage unless you change the dropdown above.
                </div>
                <button type="button" onClick={clearStageFromUrl} style={{ flexShrink: 0, border: "none", background: "transparent", color: OR, fontWeight: 700, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                  Dismiss
                </button>
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #D1C9BF", borderRadius: 9, padding: "9px 14px", flex: "1 1 200px", minWidth: 0, background: "#fff" }}>
                <span style={{ color: "#9A8F87" }}>🔍</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search folders and files…" style={{ border: "none", outline: "none", fontSize: 13, background: "transparent", flex: 1, minWidth: 0 }} />
              </div>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectStyle} aria-label="Filter by file type">
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ ...selectStyle, maxWidth: 220 }} aria-label="Sort files">
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <div style={{ display: "flex", border: "1.5px solid #D1C9BF", borderRadius: 9, overflow: "hidden" }}>
                <button type="button" title="List view" onClick={() => setView("list")} style={{ padding: "9px 12px", border: "none", background: view === "list" ? "#FBE5D4" : "#fff", cursor: "pointer", fontSize: 14, color: view === "list" ? OR : "#7A6E62" }}>
                  ☰
                </button>
                <button type="button" title="Grid view" onClick={() => setView("grid")} style={{ padding: "9px 12px", border: "none", borderLeft: "1px solid #E8E4DE", background: view === "grid" ? "#FBE5D4" : "#fff", cursor: "pointer", fontSize: 14, color: view === "grid" ? OR : "#7A6E62" }}>
                  ⊞
                </button>
              </div>
            </div>

            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Folders</div>
            <div style={{ background: "#fff", border: "1.5px solid #E2D9CF", borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F0EBE3" }}>
                    <th style={S.th}> </th>
                    <th style={S.th}>NAME</th>
                    <th style={S.th}>FILES</th>
                    <th style={S.th}>LAST MODIFIED</th>
                    <th style={S.th}>MODIFIED BY</th>
                    <th style={S.th} />
                  </tr>
                </thead>
                <tbody>
                  {filteredFolders.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ ...S.td, textAlign: "center", color: "#9A8F87", padding: 24 }}>
                        No folders match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredFolders.map((f) => (
                      <tr key={f.id} style={{ cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAF8")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ ...S.td, width: 48, textAlign: "center", fontSize: 22 }}>{f.icon || categoryMeta(f.category).icon}</td>
                        <td style={S.td}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{f.name}</div>
                            <div style={{ fontSize: 11, color: "#9A8F87" }}>{f.sub}</div>
                          </div>
                        </td>
                        <td style={S.td}>
                          <span style={{ fontWeight: 600 }}>{f.files}</span>
                        </td>
                        <td style={{ ...S.td, color: "#7A6E62" }}>{f.date}</td>
                        <td style={S.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Avatar name={f.who} size={26} />
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600 }}>{f.who}</div>
                              <div style={{ fontSize: 10, color: "#9A8F87" }}>{f.role}</div>
                            </div>
                          </div>
                        </td>
                        <td style={S.td}>
                          <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "#9A8F87", fontSize: 16 }} aria-label="Folder actions" onClick={(e) => { e.stopPropagation(); showToast("Folder actions — coming soon"); }}>
                            ⋮
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Recent files</div>
            {view === "list" ? (
              <div style={{ background: "#fff", border: "1.5px solid #E2D9CF", borderRadius: 14, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F0EBE3" }}>
                      <th style={S.th}>NAME</th>
                      <th style={S.th}>TYPE</th>
                      <th style={S.th}>CATEGORY</th>
                      <th style={S.th}>STAGE</th>
                      <th style={S.th}>SIZE</th>
                      <th style={S.th}>UPDATED</th>
                      <th style={S.th}>UPDATED BY</th>
                      <th style={S.th} />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ ...S.td, textAlign: "center", color: "#9A8F87", padding: 24 }}>
                          No files match your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredFiles.map((f) => (
                        <tr key={f.id} style={{ cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAF8")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                          <td style={S.td}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <FileIcon type={f.type} />
                              <span style={{ fontWeight: 500, fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                            </div>
                          </td>
                          <td style={S.td}>
                            <span style={{ background: "#F8F4EF", border: "1px solid #E2D9CF", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{f.type}</span>
                          </td>
                          <td style={{ ...S.td, fontSize: 12, color: "#57534E" }}>
                            <span style={{ marginRight: 6 }}>{categoryMeta(f.category).icon}</span>
                            {categoryMeta(f.category).title}
                          </td>
                          <td style={{ ...S.td, fontSize: 11, color: f.projectStage ? "#57534E" : "#C4BCB3" }}>{f.projectStage || "—"}</td>
                          <td style={{ ...S.td, color: "#7A6E62" }}>{f.size}</td>
                          <td style={{ ...S.td, color: "#7A6E62", fontSize: 12 }}>{f.date}</td>
                          <td style={S.td}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Avatar name={f.who} size={24} />
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600 }}>{f.who}</div>
                                <div style={{ fontSize: 10, color: "#9A8F87" }}>{f.role}</div>
                              </div>
                            </div>
                          </td>
                          <td style={S.td}>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "#7A6E62", fontSize: 16 }} title="Download" onClick={() => showToast(`Download: ${f.name} (demo)`)}>
                                ⬇
                              </button>
                              <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "#9A8F87", fontSize: 16 }} title="More" onClick={() => showToast("More actions — demo")}>
                                ⋮
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div style={{ textAlign: "center", padding: "14px", borderTop: "1px solid #F0EBE3" }}>
                  <button type="button" style={{ background: "none", border: "none", color: OR, fontWeight: 700, fontSize: 13, cursor: "pointer" }} onClick={() => showToast("Full document library — coming soon")}>
                    View all documents →
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: "#fff", border: "1.5px solid #E2D9CF", borderRadius: 14, padding: 16, marginBottom: 8 }}>
                {filteredFiles.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#9A8F87", padding: 24 }}>No files match your filters.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 14 }}>
                    {filteredFiles.map((f) => (
                      <div key={f.id} style={{ border: "1px solid #E8E4DE", borderRadius: 12, padding: 12, background: "#FDFBF8", cursor: "pointer" }} onClick={() => showToast(f.name)}>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                          <FileIcon type={f.type} />
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 12, lineHeight: 1.35, marginBottom: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{f.name}</div>
                        <div style={{ fontSize: 10, color: "#9A8F87" }}>{f.size}</div>
                        <div style={{ fontSize: 10, color: OR, marginTop: 4 }}>
                          {categoryMeta(f.category).icon} {categoryMeta(f.category).title}
                        </div>
                        {f.projectStage ? <div style={{ fontSize: 10, color: "#57534E", marginTop: 2 }}>{f.projectStage}</div> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ background: "#fff", border: "1.5px solid #E2D9CF", borderRadius: 14, padding: "20px", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Storage overview</div>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12 }}>
                <DonutChart pct={42} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>21.2 GB</div>
                  <div style={{ fontSize: 12, color: "#9A8F87" }}>/ 50 GB used</div>
                </div>
              </div>
              <div style={{ height: 6, background: "#E2D9CF", borderRadius: 3, marginBottom: 8, overflow: "hidden" }}>
                <div style={{ width: "42%", height: "100%", background: "#22A36B", borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 12, color: "#7A6E62" }}>You have 28.8 GB free</div>
            </div>

            <div style={{ background: "#fff", border: "1.5px solid #E2D9CF", borderRadius: 14, padding: "20px" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Document guidelines</div>
              {["Use folders to organize; category tags on files are for quick scanning", "Upload clear PDFs or scans; name with date + version", "Property & permits = title, tax, BBMP, NOCs", "Site media = dated progress photos only"].map((g) => (
                <div key={g} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#E8F8F0", border: "1.5px solid #22A36B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#22A36B" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 12, color: "#3D3530" }}>{g}</span>
                </div>
              ))}
              <button type="button" style={{ background: "none", border: "none", color: OR, fontWeight: 700, fontSize: 13, cursor: "pointer", marginTop: 6, padding: 0 }} onClick={() => showToast("Full guidelines — coming soon")}>
                View all guidelines →
              </button>
            </div>
          </div>
        </div>
      </div>

      <HmFormDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        title="New folder"
        description="Organize uploads by consultant, stage, or trade."
        fields={[{ name: "value", label: "Folder name", placeholder: "e.g. 08. Consultant reports" }]}
        submitLabel="Create folder"
        onSubmit={submitNewFolder}
      />

      <style>{`
        @media (max-width: 900px) {
          .doc-vault-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </ProjectHubShell>
  );
}
