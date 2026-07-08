import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Hammer, Users, FolderKanban, UserCircle } from "lucide-react";
import { MOBILE_TABS } from "./mobileIA";

const TAB_ICONS = {
  home: Home,
  design: Hammer,
  pros: Users,
  project: FolderKanban,
  you: UserCircle,
};

function isActive(pathname, tab) {
  if (tab.id === "home") return pathname === "/";
  if (tab.id === "design") {
    return pathname === "/design" || pathname === "/ideas" || pathname.startsWith("/build") || pathname.startsWith("/photo/");
  }
  if (tab.id === "pros") {
    return pathname.startsWith("/browse") || pathname.startsWith("/marketplace") || pathname.startsWith("/profile/");
  }
  if (tab.id === "project") {
    return (
      pathname.startsWith("/project") ||
      pathname === "/documents" ||
      pathname === "/team" ||
      pathname === "/shop"
    );
  }
  if (tab.id === "you") {
    return (
      pathname === "/account" ||
      pathname === "/sign-in" ||
      pathname.startsWith("/craft") ||
      pathname.startsWith("/details") ||
      pathname.startsWith("/portfolio-theme") ||
      pathname.startsWith("/portfolio") ||
      pathname.startsWith("/live") ||
      pathname.startsWith("/pro")
    );
  }
  return false;
}

export function MobileTabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <nav className="hm-m-tab-bar" aria-label="Main">
      {MOBILE_TABS.map((tab) => {
        const Icon = TAB_ICONS[tab.id];
        const active = isActive(pathname, tab);
        return (
          <button
            key={tab.path}
            type="button"
            className={`hm-m-tab${active ? " active" : ""}`}
            onClick={() => navigate(tab.path)}
            aria-current={active ? "page" : undefined}
          >
            <Icon strokeWidth={active ? 2.4 : 2} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
