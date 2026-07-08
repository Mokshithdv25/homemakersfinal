import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  LogOut,
  Settings,
  Home,
  Paintbrush,
  LayoutGrid,
  ExternalLink,
  CreditCard,
  FolderKanban,
  Pencil,
  Users,
  ShoppingBag,
} from "lucide-react";
import { AUTH_UI_ENABLED } from "../lib/authMode";
import { useHmSession } from "../hooks/useHmSession";
import {
  getProOnboardingResumePath,
  getProPublicProfilePath,
  getProfileInitial,
  signOutHm,
} from "../lib/hmAuth";

function MenuSection({ label, children }) {
  return (
    <div className="py-1">
      {label ? (
        <p className="px-3 pt-1.5 pb-1 font-body text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground m-0">
          {label}
        </p>
      ) : null}
      {children}
    </div>
  );
}

/**
 * Signed-in avatar + role-specific menu (homeowner vs pro).
 */
export default function HmUserMenu({ className = "" }) {
  const navigate = useNavigate();
  const session = useHmSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!AUTH_UI_ENABLED || !session) return null;

  const initial = getProfileInitial(session);
  const displayName = session.profile?.name || session.profile?.email || "Your account";
  const isPro = session.role === "pro";
  const publicProfilePath = isPro ? getProPublicProfilePath() : null;
  const portfolioPath = isPro ? getProOnboardingResumePath() : null;
  const portfolioLabel =
    portfolioPath === "/pro/dashboard"
      ? "Edit portfolio"
      : portfolioPath === "/portfolio" || portfolioPath === "/live"
        ? "Edit portfolio"
        : "Continue portfolio setup";

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleSignOut = () => {
    setOpen(false);
    navigate("/", { replace: true });
    void signOutHm();
  };

  const menuItem = (icon, label, path) => (
    <button
      type="button"
      key={label}
      onClick={() => go(path)}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left font-body text-sm text-foreground/85 transition-colors hover:bg-secondary/70 hover:text-foreground bg-transparent border-none cursor-pointer"
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-[#E7D4C4] bg-white/90 pl-1 pr-2.5 py-1 shadow-sm hover:border-[#C85F2B]/40 transition-colors cursor-pointer"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, #C85F2B 0%, #E8A84A 100%)" }}
          aria-hidden
        >
          {initial}
        </span>
        <span className="hidden sm:inline max-w-[120px] truncate font-body text-sm font-semibold text-[#1C1917]">
          {displayName.split(" ")[0]}
        </span>
        <ChevronDown className={`h-4 w-4 text-[#78716C] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[60] w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-black/8 bg-[rgba(255,252,249,0.98)] p-2 shadow-[0_20px_60px_rgba(48,33,21,0.16)] backdrop-blur-xl"
        >
          <div className="px-3 py-2.5 border-b border-border/60 mb-0.5">
            <div className="font-body text-sm font-semibold text-foreground truncate">{displayName}</div>
            {session.profile?.email ? (
              <div className="font-body text-xs text-muted-foreground truncate mt-0.5">{session.profile.email}</div>
            ) : null}
            <div className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1.5">
              {isPro ? "Professional" : "Homeowner"}
            </div>
          </div>

          {!isPro ? (
            <>
              <MenuSection label="Projects">
                {menuItem(
                  <FolderKanban className="h-4 w-4 shrink-0 text-copper" />,
                  "My projects",
                  "/project",
                )}
              </MenuSection>
              <MenuSection label="Start something new">
                {menuItem(<Home className="h-4 w-4 shrink-0 text-copper" />, "Start a new home", "/build/new-home")}
                {menuItem(
                  <Paintbrush className="h-4 w-4 shrink-0 text-copper" />,
                  "Start a remodel",
                  "/build/remodel",
                )}
              </MenuSection>
              <MenuSection label="Explore">
                {menuItem(<Users className="h-4 w-4 shrink-0 text-copper" />, "Find professionals", "/browse")}
                {menuItem(<ShoppingBag className="h-4 w-4 shrink-0 text-copper" />, "Materials shop", "/shop")}
              </MenuSection>
            </>
          ) : (
            <>
              <MenuSection label="Work">
                {menuItem(
                  <LayoutGrid className="h-4 w-4 shrink-0 text-copper" />,
                  "Dashboard",
                  "/pro/dashboard",
                )}
                {menuItem(
                  <Users className="h-4 w-4 shrink-0 text-copper" />,
                  "Leads & new projects",
                  "/browse",
                )}
                {menuItem(
                  <FolderKanban className="h-4 w-4 shrink-0 text-copper" />,
                  "Manage jobs",
                  "/project",
                )}
                {menuItem(
                  <ShoppingBag className="h-4 w-4 shrink-0 text-copper" />,
                  "Materials shop",
                  "/shop",
                )}
                {menuItem(
                  <Pencil className="h-4 w-4 shrink-0 text-copper" />,
                  portfolioLabel,
                  portfolioPath || "/portfolio",
                )}
                {publicProfilePath
                  ? menuItem(
                      <ExternalLink className="h-4 w-4 shrink-0 text-copper" />,
                      "View live portfolio",
                      publicProfilePath,
                    )
                  : null}
              </MenuSection>
            </>
          )}

          <MenuSection label="Account">
            {menuItem(<CreditCard className="h-4 w-4 shrink-0 text-copper" />, "My subscription", "/subscriptions")}
            {menuItem(<Settings className="h-4 w-4 shrink-0 text-copper" />, "Account & settings", "/account/settings")}
          </MenuSection>

          <div className="mt-0.5 border-t border-border/60 pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left font-body text-sm text-destructive transition-colors hover:bg-destructive/5 bg-transparent border-none cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
