import React from "react";
import { useLocation } from "react-router-dom";
import { MobileTabBar } from "./MobileTabBar";
import { MobileIdeabooksProvider } from "./MobileIdeabooksContext";

const HIDE_TAB_PATHS = [
  "/build/new-home",
  "/build/remodel",
  "/sign-in",
  "/craft",
  "/details",
  "/portfolio-theme",
  "/portfolio",
  "/live",
  "/photo/",
  "/documents",
  "/team",
  "/project/journey",
  "/project/shop",
];

export default function MobileShell({ children, hideTabs = false }) {
  const { pathname } = useLocation();
  const hide = hideTabs || HIDE_TAB_PATHS.some((p) => pathname.startsWith(p));

  return (
    <MobileIdeabooksProvider>
      <div className="hm-m-screen" style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
        <div className={`hm-m-scroll${hide ? " no-tabs" : ""}`}>{children}</div>
        {!hide ? <MobileTabBar /> : null}
      </div>
    </MobileIdeabooksProvider>
  );
}
