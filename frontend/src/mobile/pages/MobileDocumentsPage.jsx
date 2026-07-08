import React, { useMemo, useState } from "react";
import MobileHeader from "../MobileHeader";

const FILES = [
  { id: "f1", name: "Structural Drawing Set 03.pdf", type: "PDF", size: "2.4 MB", date: "20 Jun 2024", category: "plans" },
  { id: "f2", name: "RCC Column Details.xlsx", type: "Excel", size: "1.2 MB", date: "19 Jun 2024", category: "plans" },
  { id: "f3", name: "Building Permit Approval.pdf", type: "PDF", size: "1.8 MB", date: "18 Jun 2024", category: "property" },
  { id: "f4", name: "Material Test Report.pdf", type: "PDF", size: "3.1 MB", date: "17 Jun 2024", category: "plans" },
  { id: "f5", name: "Title Deed Scan 2023.pdf", type: "PDF", size: "890 KB", date: "12 Jun 2024", category: "property" },
];

const FILTERS = [
  { id: "all", label: "All" },
  { id: "plans", label: "Plans" },
  { id: "property", label: "Property" },
];

export default function MobileDocumentsPage() {
  const [filter, setFilter] = useState("all");
  const rows = useMemo(() => {
    if (filter === "all") return FILES;
    return FILES.filter((f) => f.category === filter);
  }, [filter]);

  return (
    <>
      <MobileHeader title="Documents" subtitle="Plans, permits & property" backTo="/project" />
      <div className="hm-m-pill-row" style={{ marginTop: 8 }}>
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={`hm-m-pill${filter === f.id ? " active" : ""}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      <div style={{ padding: "8px 16px 24px" }}>
        {rows.map((file) => (
          <div key={file.id} className="hm-m-list-row static">
            <span className="hm-m-list-icon">📄</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="hm-m-list-title">{file.name}</span>
              <span className="hm-m-list-sub">
                {file.type} · {file.size} · {file.date}
              </span>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
