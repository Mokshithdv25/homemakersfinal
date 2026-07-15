import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MobileHeader from "../MobileHeader";
import { listProjectMaterials } from "../../lib/projectIntelligenceApi";

const CATEGORIES = [
  { id: "structural", label: "Structural", sub: "Cement, steel, blocks", img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&q=75" },
  { id: "finishes", label: "Finishes", sub: "Tiles, paint, flooring", img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=75" },
  { id: "mep", label: "MEP", sub: "Electrical & plumbing", img: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=75" },
  { id: "kitchen", label: "Kitchen & bath", sub: "Fixtures & fittings", img: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&q=75" },
];

export default function MobileShopPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(Boolean(projectId));

  useEffect(() => {
    let active = true;
    if (!projectId) {
      setMaterials([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    listProjectMaterials(projectId)
      .then((rows) => { if (active) setMaterials(rows || []); })
      .catch(() => { if (active) setMaterials([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [projectId]);

  const approved = useMemo(() => materials.filter((item) => ["approved", "ordered", "received"].includes(item.status)), [materials]);
  const aiSuggested = useMemo(() => materials.filter((item) => /brief|v0|ai/i.test(item.source_artifact || "") && item.status === "suggested"), [materials]);
  const professionalSuggested = useMemo(() => materials.filter((item) => /professional|contractor|architect|designer/i.test(item.source_artifact || "")), [materials]);
  return (
    <>
      <MobileHeader title="Shop" subtitle={projectId ? "Your project shopping checklist" : "Materials & finishes"} backTo={-1} />
      <p style={{ padding: "0 16px", fontSize: 14, color: "#78716C", lineHeight: 1.5 }}>
        {projectId
          ? "Review the materials approved for this project. Brand and quantity changes stay in the project plan before any vendor pricing or order."
          : "Browse material departments, or open a saved project to generate an editable checklist from its brief and estimate."}
      </p>
      {projectId ? (
        <section className="hm-m-card" style={{ margin: "12px 16px", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <div><strong style={{ fontSize: 16 }}>Project checklist</strong><span style={{ display: "block", marginTop: 3, color: "#78716C", fontSize: 12 }}>{approved.length} approved · {materials.length} total</span></div>
            <button type="button" className="hm-m-card-link" onClick={() => navigate(`/project?projectId=${encodeURIComponent(projectId)}&tab=Materials`)}>Edit plan</button>
          </div>
          {loading ? <p style={{ color: "#78716C", fontSize: 13 }}>Loading project materials…</p> : (
            <div style={{ display: "grid", gap: 9, marginTop: 12 }}>
              {[
                ["✨ AI suggested", aiSuggested, "From your brief and estimate"],
                ["👷 Professional suggested", professionalSuggested, "Captured from your project professional"],
                ["🛒 Approved cart", approved, "Confirmed before pricing or ordering"],
              ].map(([title, rows, copy]) => <div key={title} style={{ border: "1px solid #EEE6DE", borderRadius: 10, padding: 10, background: "#FFFCF9" }}><strong style={{ display: "block", fontSize: 13 }}>{title} · {rows.length}</strong><span style={{ display: "block", marginTop: 3, color: "#78716C", fontSize: 10 }}>{copy}</span>{rows.slice(0, 3).map((item) => <span key={item.id} style={{ display: "block", marginTop: 7, color: "#4B423A", fontSize: 11 }}>{item.item_name} · {item.quantity} {item.unit}{item.preferred_brand ? ` · ${item.preferred_brand}` : ""}</span>)}</div>)}
            </div>
          )}
        </section>
      ) : null}
      <div style={{ padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" className="hm-m-shop-row" onClick={() => projectId ? navigate(`/project?projectId=${encodeURIComponent(projectId)}&tab=Materials`) : navigate("/project")}>
            <img src={c.img} alt="" />
            <span>
              <span className="hm-m-list-title">{c.label}</span>
              <span className="hm-m-list-sub">{c.sub}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
