import React from "react";
import { useNavigate } from "react-router-dom";
import MobileHeader from "../MobileHeader";
import { useHmSession } from "../../hooks/useHmSession";
import HmUserMenu from "../../components/HmUserMenu";
import { HM_PRO_FLOWS } from "../mobileIA";

export default function MobileAccountPage() {
  const navigate = useNavigate();
  const session = useHmSession();
  const name = session?.profile?.name || session?.user?.email || "Guest";

  return (
    <>
      <MobileHeader title="You" subtitle={session ? name : "Homeowner or pro"} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {session ? (
          <div className="hm-m-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700 }}>{name}</div>
              <div style={{ fontSize: 13, color: "#78716C", marginTop: 4 }}>HomeMakers account</div>
            </div>
            <HmUserMenu />
          </div>
        ) : (
          <>
            <button type="button" className="hm-m-btn-primary" onClick={() => navigate("/sign-in")}>
              Sign in
            </button>
            <button type="button" className="hm-m-btn-secondary" onClick={() => navigate("/sign-in?role=pro&mode=signup")}>
              Join as a pro
            </button>
          </>
        )}

        <p className="hm-m-section-title" style={{ padding: 0, margin: "8px 0 0" }}>
          Homeowner
        </p>
        <button type="button" className="hm-m-list-row" onClick={() => navigate("/project")}>
          <span className="hm-m-list-icon">🏠</span>
          <span>
            <span className="hm-m-list-title">My projects</span>
            <span className="hm-m-list-sub">Build, remodel & site management</span>
          </span>
        </button>
        <button type="button" className="hm-m-list-row" onClick={() => navigate("/design")}>
          <span className="hm-m-list-icon">📐</span>
          <span>
            <span className="hm-m-list-title">Design & ideabooks</span>
            <span className="hm-m-list-sub">Saved ideas from marketplace</span>
          </span>
        </button>
        <button type="button" className="hm-m-list-row" onClick={() => navigate("/browse")}>
          <span className="hm-m-list-icon">👷</span>
          <span>
            <span className="hm-m-list-title">Marketplace</span>
            <span className="hm-m-list-sub">Find published pros near you</span>
          </span>
        </button>

        <p className="hm-m-section-title" style={{ padding: 0, margin: "8px 0 0" }}>
          Professional
        </p>
        {HM_PRO_FLOWS.map((flow) => (
          <button key={flow.id} type="button" className="hm-m-list-row" onClick={() => navigate(flow.path)}>
            <span className="hm-m-list-icon">🛠️</span>
            <span>
              <span className="hm-m-list-title">{flow.label}</span>
              <span className="hm-m-list-sub">{flow.sub}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
