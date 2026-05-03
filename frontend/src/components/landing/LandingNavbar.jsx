import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, User, ChevronDown, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Landing nav: Software → /build (chooser); Find Pros & My Project → /sign-in; Shop → marketplace.
 */
export default function LandingNavbar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [softwareOpen, setSoftwareOpen] = useState(false);

  const go = (path) => {
    navigate(path);
    setMobileOpen(false);
    setSoftwareOpen(false);
  };

  /** All Software items → “What are you building?” / start your home project flow. */
  const softwareItems = [
    { label: "AI Design", path: "/build" },
    { label: "Estimates", path: "/build" },
    { label: "Project Management", path: "/build" },
  ];

  const navLinks = [
    { label: "Find Pros", path: "/sign-in" },
    { label: "My Project", path: "/sign-in" },
    { label: "Shop", path: "/marketplace" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-black/5 bg-[rgba(251,247,242,0.84)] backdrop-blur-2xl">
      <div className="container flex h-[4.65rem] items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => go("/")}
          className="flex items-center gap-2.5 shrink-0 bg-transparent border-none cursor-pointer p-0"
        >
          <img
            src={`${process.env.PUBLIC_URL || ""}/logo.svg`}
            alt="HomeMakers"
            className="w-12 h-12 md:w-[60px] md:h-[60px]"
          />
          <span
            className="font-display text-[30px] md:text-[42px] tracking-[0.03em] font-semibold leading-none pb-1"
            style={{
              color: "#A86A31",
              textShadow: "0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            HomeMakers
          </span>
        </button>

        <div className="hidden md:flex min-w-0 items-center gap-7">
          <div className="relative">
            <button
              type="button"
              onClick={() => setSoftwareOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-full px-1 py-1 font-body text-[15px] font-medium text-foreground/74 transition-colors hover:text-foreground bg-transparent border-none cursor-pointer"
            >
              Software
              <ChevronDown
                className={`h-4 w-4 transition-transform ${softwareOpen ? "rotate-180" : ""}`}
              />
            </button>
            {softwareOpen && (
              <div className="absolute left-0 top-[calc(100%+0.9rem)] w-60 rounded-[1.35rem] border border-black/8 bg-[rgba(255,252,249,0.98)] p-2 shadow-[0_28px_80px_rgba(48,33,21,0.14)] backdrop-blur-xl">
                {softwareItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (item.path) go(item.path);
                      setSoftwareOpen(false);
                    }}
                    className="block w-full rounded-xl px-3 py-2.5 text-left font-body text-sm text-foreground/78 transition-colors hover:bg-secondary/70 hover:text-foreground bg-transparent border-none cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {navLinks.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                go(item.path);
                setSoftwareOpen(false);
              }}
              className="font-body text-[15px] font-medium text-foreground/74 transition-colors hover:text-foreground bg-transparent border-none cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => go("/sign-in")}
            className="rounded-full px-3.5 font-body text-sm gap-2"
          >
            <User className="w-4 h-4" />
            Sign In
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => go("/craft")}
            className="rounded-full border-foreground/15 bg-white/70 px-4 font-body text-sm gap-2 shadow-sm hover:bg-secondary"
          >
            <Briefcase className="w-4 h-4" />
            Join as a Pro
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden text-foreground bg-transparent border-none cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="space-y-3 border-t border-border bg-background/95 p-4 md:hidden backdrop-blur-xl">
          <button
            type="button"
            onClick={() => {
              go("/build");
            }}
            className="block w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-left font-body text-sm font-medium text-foreground"
          >
            Software (AI design)
          </button>
          {navLinks.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => go(item.path)}
              className="block w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-left font-body text-sm font-medium text-foreground"
            >
              {item.label}
            </button>
          ))}
          <Button
            type="button"
            variant="ghost"
            onClick={() => go("/sign-in")}
            className="w-full justify-start font-body text-sm gap-2"
          >
            <User className="w-4 h-4" />
            Sign In
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => go("/craft")}
            className="w-full rounded-2xl border-foreground/20 font-body text-sm gap-2"
          >
            <Briefcase className="w-4 h-4" />
            Join as a Pro
          </Button>
        </div>
      )}
    </nav>
  );
}
