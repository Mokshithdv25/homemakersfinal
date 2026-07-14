import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MobileHeader from "../MobileHeader";
import { publicAsset } from "../../lib/publicAsset";

export default function MobileBuildPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromPortfolio = (searchParams.get("source") || "").toLowerCase() === "portfolio";
  const referredPro = searchParams.get("pro") || "";
  const flowParams = new URLSearchParams();
  if (fromPortfolio) flowParams.set("source", "portfolio");
  if (referredPro) flowParams.set("pro", referredPro);
  const q = flowParams.toString() ? `?${flowParams.toString()}` : "";

  return (
    <>
      <MobileHeader title="What are you building?" subtitle="We'll tailor AI design & estimates" backTo="/" />
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
        <button type="button" className="hm-m-card" style={{ textAlign: "left", cursor: "pointer", border: "2px solid transparent" }} onClick={() => navigate("/build/new-home" + q)}>
          <img className="hm-m-flow-image" src={publicAsset("mobile_flow_build.jpg")} alt="Modern Indian home exterior" decoding="async" />
          <span className="hm-m-flow-badge">1 free exterior concept</span>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>Build a new home</h2>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "#78716C", lineHeight: 1.5 }}>Describe your plot and lifestyle — get floor plans, renders, and a ballpark cost.</p>
          <div className="hm-m-flow-features"><span>✓ Saved brief</span><span>✓ AI exterior</span><span>✓ Estimate & project hub</span></div>
          <span style={{ color: "#C85F2B", fontWeight: 700, fontSize: 15 }}>Get started →</span>
        </button>
        <button type="button" className="hm-m-card" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => navigate("/build/remodel" + q)}>
          <img className="hm-m-flow-image" src={publicAsset("mobile_flow_remodel.jpg")} alt="Warm modern living room" loading="lazy" decoding="async" />
          <span className="hm-m-flow-badge">Photo-to-concept journey</span>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>Renovate / remodel</h2>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "#78716C", lineHeight: 1.5 }}>Upload room photos, describe your vision, get AI designs and costs.</p>
          <div className="hm-m-flow-features"><span>✓ Existing-space photos</span><span>✓ AI remodel concept</span><span>✓ Costs, tasks & pros</span></div>
          <span style={{ color: "#C85F2B", fontWeight: 700, fontSize: 15 }}>Get started →</span>
        </button>
      </div>
    </>
  );
}
