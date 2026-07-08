import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MobileHeader from "../MobileHeader";

export default function MobileBuildPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromPortfolio = (searchParams.get("source") || "").toLowerCase() === "portfolio";
  const q = fromPortfolio ? "?source=portfolio" : "";

  return (
    <>
      <MobileHeader title="What are you building?" subtitle="We'll tailor AI design & estimates" backTo="/" />
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
        <button type="button" className="hm-m-card" style={{ textAlign: "left", cursor: "pointer", border: "2px solid transparent" }} onClick={() => navigate("/build/new-home" + q)}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏗️</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>Build a new home</h2>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "#78716C", lineHeight: 1.5 }}>Describe your plot and lifestyle — get floor plans, renders, and a ballpark cost.</p>
          <span style={{ color: "#C85F2B", fontWeight: 700, fontSize: 15 }}>Get started →</span>
        </button>
        <button type="button" className="hm-m-card" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => navigate("/build/remodel" + q)}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>Renovate / remodel</h2>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "#78716C", lineHeight: 1.5 }}>Upload room photos, describe your vision, get AI designs and costs.</p>
          <span style={{ color: "#C85F2B", fontWeight: 700, fontSize: 15 }}>Get started →</span>
        </button>
      </div>
    </>
  );
}
