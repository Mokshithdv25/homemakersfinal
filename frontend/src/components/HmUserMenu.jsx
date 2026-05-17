import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Settings, Hammer, LayoutGrid, Home, Paintbrush } from "lucide-react";
import { useHmSession } from "../hooks/useHmSession";
import { getProfileInitial, signOutHm } from "../lib/hmAuth";

/**
 * Signed-in avatar (one letter) + menu: account, build flows, project hub, sign out.
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

  if (!session) return null;

  const initial = getProfileInitial(session);
  const displayName = session.profile?.name || "Your account";
  const isPro = session.role === "pro";

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOutHm();
    navigate("/", { replace: true });
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
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[60] w-[min(17rem,calc(100vw-2rem))] rounded-2xl border border-black/8 bg-[rgba(255,252,249,0.98)] p-2 shadow-[0_20px_60px_rgba(48,33,21,0.16)] backdrop-blur-xl"
        >
          <div className="px-3 py-2.5 border-b border-border/60 mb-1">
            <div className="font-body text-sm font-semibold text-foreground truncate">{displayName}</div>
            {session.profile?.email ? (
              <div className="font-body text-xs text-muted-foreground truncate mt-0.5">{session.profile.email}</div>
            ) : null}
            {session.profile?.city ? (
              <div className="font-body text-xs text-muted-foreground mt-0.5">{session.profile.city}</div>
            ) : null}
          </div>

          {menuItem(<Settings className="h-4 w-4 shrink-0 text-copper" />, "Account & profile", "/account")}
          {!isPro ? (
            <>
              {menuItem(<Hammer className="h-4 w-4 shrink-0 text-copper" />, "New build or remodel", "/build")}
              {menuItem(<Home className="h-4 w-4 shrink-0 text-copper" />, "Build a new home", "/build/new-home")}
              {menuItem(<Paintbrush className="h-4 w-4 shrink-0 text-copper" />, "Remodel my home", "/build/remodel")}
              {menuItem(<LayoutGrid className="h-4 w-4 shrink-0 text-copper" />, "My project hub", "/project")}
            </>
          ) : (
            menuItem(<LayoutGrid className="h-4 w-4 shrink-0 text-copper" />, "Pro dashboard", "/pro/dashboard")
          )}

          <div className="mt-1 border-t border-border/60 pt-1">
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
