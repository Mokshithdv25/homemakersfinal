import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ProjectHubAppHeader, ProjectHubProjectCenter } from "./HmBrandLockup";
import {
  hmProjectHubPageBackground,
  hmProjectSidebarAsideStyle,
  hmProjectSidebarFooterStyle,
  hmProjectSidebarNavItemStyle,
  hmProjectSidebarNavScrollStyle,
  hmProjectSidebarProjectCardStyle,
} from "../lib/hmBrand";
import { PROJECT_HUB_NAV, hubNavActive } from "../lib/projectHubNav";

const OR = "#C85F2B";

function HubAvatar({ name, size = 30 }) {
  const colors = ["#C85F2B", "#2A6496", "#22A36B", "#7A4FC0", "#D97706"];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: colors[idx],
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

export default function ProjectHubShell({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const shellFont = { fontFamily: "'DM Sans','Inter',sans-serif", color: "#1C1917" };

  const goNav = (path) => {
    if (path && path !== "#") navigate(path);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: hmProjectHubPageBackground, ...shellFont }}>
      <ProjectHubAppHeader
        center={<ProjectHubProjectCenter />}
        trailing={
          <>
            <button type="button" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#7A6E62" }} aria-label="Notifications">
              🔔
            </button>
            <span style={{ fontSize: 13, fontWeight: 600 }}>🇮🇳 IN</span>
            <HubAvatar name="Ankit" size={30} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Hi, Ankit ∨</span>
          </>
        }
      />
      <div style={{ display: "flex", flex: 1, minWidth: 0, minHeight: 0 }}>
        <aside style={hmProjectSidebarAsideStyle}>
          <div style={{ padding: "14px 20px 8px", fontSize: 10, fontWeight: 700, color: "#9A8F87", letterSpacing: "0.08em" }}>PROJECTS</div>
          <div style={{ padding: "0 10px 8px" }}>
            <div style={hmProjectSidebarProjectCardStyle} onClick={() => navigate("/project")}>
              <div style={{ fontWeight: 700, fontSize: 13, color: OR }}>Shanti Nagar Residence</div>
              <div style={{ fontSize: 11, color: "#9A8F87" }}>Sharma Project</div>
            </div>
          </div>
          <nav style={hmProjectSidebarNavScrollStyle}>
            {PROJECT_HUB_NAV.map((n) => (
              <div
                key={n.label}
                role="button"
                tabIndex={0}
                onClick={() => goNav(n.path)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") goNav(n.path);
                }}
                style={hmProjectSidebarNavItemStyle(hubNavActive(pathname, n.path))}
              >
                <span style={{ fontSize: 15 }}>{n.icon}</span>
                {n.label}
              </div>
            ))}
          </nav>
          <div style={hmProjectSidebarFooterStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Need Help?</div>
            <div style={{ fontSize: 11, color: "#7A6E62", marginBottom: 10 }}>Chat with our team to find the right expert.</div>
            <button type="button" style={{ width: "100%", background: OR, color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              💬 Start Chat
            </button>
          </div>
        </aside>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#fff", overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>{children}</div>
      </div>
    </div>
  );
}
