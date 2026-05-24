import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, User, ChevronDown, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HM_HEADER_BAR_CHROME_CLASS, HM_WORDMARK_TAGLINE_CLASS, hmLogoMarkSrc } from "../../lib/hmBrand";
import { useHmSession } from "../../hooks/useHmSession";
import HmUserMenu from "../HmUserMenu";
import HmMarketingWordmark from "../HmMarketingWordmark";

/** Browse-only specialties → standalone shop (demo filter via query string). */
const FIND_PROS_GROUPS = [
  {
    heading: "Design & engineering",
    items: ["Architects", "Interior designers", "Landscape designers", "Structural engineers", "MEP consultants", "Vastu consultants"],
  },
  {
    heading: "Build & site",
    items: ["General contractors", "Civil contractors", "Renovation specialists", "Site supervisors", "Project managers"],
  },
  {
    heading: "Skilled trades",
    items: ["Electricians", "Plumbers", "Carpenters & woodworkers", "Painters", "Masons & tile layers", "HVAC technicians", "Glass & aluminium", "Modular kitchen installers"],
  },
  {
    heading: "Supplies & specialty",
    items: ["Material suppliers", "Waterproofing", "False ceiling", "Steel fabrication", "Solar installers", "Smart home integrators"],
  },
];

/**
 * Landing nav: Software mega-menu; Find Pros label → /browse, chevron → specialties; Shop → /shop; My Project → sign-in.
 */
export default function LandingNavbar({ tagline = null }) {
  const navigate = useNavigate();
  const session = useHmSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [softwareOpen, setSoftwareOpen] = useState(false);
  const [findProsOpen, setFindProsOpen] = useState(false);

  const go = (path) => {
    navigate(path);
    setMobileOpen(false);
    setSoftwareOpen(false);
    setFindProsOpen(false);
  };

  const goShopWithTrade = (label) => {
    const q = encodeURIComponent(label);
    navigate(`/browse?trade=${q}`);
    setMobileOpen(false);
    setFindProsOpen(false);
    setSoftwareOpen(false);
  };

  /** Platform modules — live routes where we have UI; rest tagged coming soon. */
  const softwareItems = [
    { label: "AI design & v0 brief", path: "/build" },
    { label: "AI plan & flow assistant", path: "/build" },
    { label: "Estimates & takeoffs", path: "/build" },
    { label: "Change orders & revisions", path: null, comingSoon: true },
    { label: "3D floor plan viewer", path: null, comingSoon: true },
    { label: "Project management hub", path: "/project" },
    { label: "Task management & schedule", path: "/project" },
    { label: "Client dashboard", path: "/project" },
    { label: "Daily logs & site feed", path: "/stage", comingSoon: true },
    { label: "Video walkthroughs", path: null, comingSoon: true },
    { label: "Selections board", path: "/documents" },
    { label: "CRM & lead pipeline", path: "/pro/dashboard", comingSoon: true },
    { label: "Invoicing & deposits", path: "/pro/dashboard", comingSoon: true },
    { label: "Final payments & payouts", path: "/pro/dashboard", comingSoon: true },
  ];

  const navAfterFindPros = [
    { label: "My Project", path: session ? "/project" : "/sign-in" },
    { label: "Shop", path: "/shop" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${HM_HEADER_BAR_CHROME_CLASS}`}>
      <div className={`container flex items-center justify-between gap-4 ${tagline ? "min-h-[4.65rem] py-2" : "h-[4.65rem]"}`}>
        <button
          type="button"
          onClick={() => go("/")}
          className="flex items-center gap-2.5 shrink-0 bg-transparent border-none cursor-pointer p-0"
        >
          <img
            src={hmLogoMarkSrc}
            alt="HomeMakers"
            className="w-12 h-12 md:w-[60px] md:h-[60px]"
            width={60}
            height={60}
            decoding="async"
          />
          <div className="leading-tight min-w-0 text-left">
            <HmMarketingWordmark className="!pb-0" />
            {tagline ? <p className={HM_WORDMARK_TAGLINE_CLASS}>{tagline}</p> : null}
          </div>
        </button>

        <div className="hidden md:flex min-w-0 items-center gap-7">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setSoftwareOpen((o) => !o);
                setFindProsOpen(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-1 py-1 font-body text-[15px] font-medium text-foreground/74 transition-colors hover:text-foreground bg-transparent border-none cursor-pointer"
            >
              Software
              <ChevronDown className={`h-4 w-4 transition-transform ${softwareOpen ? "rotate-180" : ""}`} />
            </button>
            {softwareOpen && (
              <div className="absolute left-0 top-[calc(100%+0.9rem)] w-[19rem] max-h-[min(70vh,520px)] overflow-y-auto rounded-[1.35rem] border border-black/8 bg-[rgba(255,252,249,0.98)] p-2 shadow-[0_28px_80px_rgba(48,33,21,0.14)] backdrop-blur-xl">
                {softwareItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (item.path && !item.comingSoon) go(item.path);
                      setSoftwareOpen(false);
                    }}
                    className={`block w-full rounded-xl px-3 py-2.5 text-left font-body text-sm transition-colors bg-transparent border-none ${
                      item.comingSoon
                        ? "text-foreground/50 cursor-default"
                        : "text-foreground/78 hover:bg-secondary/70 hover:text-foreground cursor-pointer"
                    }`}
                  >
                    {item.comingSoon ? (
                      <span className="flex w-full items-start justify-between gap-3">
                        <span className="min-w-0 flex-1 text-left leading-snug text-foreground/50">{item.label}</span>
                        <span className="pointer-events-none mt-0.5 shrink-0 whitespace-nowrap rounded-md border border-[#E5D8CC]/90 bg-[linear-gradient(180deg,#FFFCF9_0%,#F6EFE8_100%)] px-2 py-1 text-[10px] font-medium leading-none tracking-wide text-[#6E655E] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                          Coming soon
                        </span>
                      </span>
                    ) : (
                      item.label
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <div className="inline-flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  go("/browse");
                  setSoftwareOpen(false);
                }}
                className="rounded-full px-1 py-1 font-body text-[15px] font-medium text-foreground/74 transition-colors hover:text-foreground bg-transparent border-none cursor-pointer"
              >
                Find Pros
              </button>
              <button
                type="button"
                aria-expanded={findProsOpen}
                aria-haspopup="menu"
                aria-label="Browse by specialty"
                onClick={() => {
                  setFindProsOpen((o) => !o);
                  setSoftwareOpen(false);
                }}
                className="inline-flex items-center justify-center rounded-full p-1 text-foreground/74 transition-colors hover:text-foreground hover:bg-secondary/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-copper/50 bg-transparent border-none cursor-pointer"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${findProsOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
            {findProsOpen && (
              <div className="absolute left-0 top-[calc(100%+0.9rem)] w-[20rem] max-h-[min(75vh,560px)] overflow-y-auto rounded-[1.35rem] border border-black/8 bg-[rgba(255,252,249,0.98)] p-3 shadow-[0_28px_80px_rgba(48,33,21,0.14)] backdrop-blur-xl">
                <p className="mb-2 px-1 font-body text-[11px] font-medium leading-snug text-muted-foreground">
                  Browse professionals by specialty — pick a trade to jump into the directory.
                </p>
                {FIND_PROS_GROUPS.map((g) => (
                  <div key={g.heading} className="mb-3 last:mb-0">
                    <div className="px-2 pb-1.5 pt-1 font-body text-[10px] font-bold uppercase tracking-[0.14em] text-copper/90">
                      {g.heading}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {g.items.map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => goShopWithTrade(label)}
                          className="rounded-lg px-2.5 py-2 text-left font-body text-sm text-foreground/80 transition-colors hover:bg-secondary/70 hover:text-foreground bg-transparent border-none cursor-pointer"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => go("/browse")}
                  className="mt-1 w-full rounded-xl border border-border/80 bg-card/80 px-3 py-2.5 text-center font-body text-xs font-semibold text-foreground transition-colors hover:bg-secondary/60"
                >
                  Browse all professionals
                </button>
              </div>
            )}
          </div>

          {navAfterFindPros.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                go(item.path);
                setSoftwareOpen(false);
                setFindProsOpen(false);
              }}
              className="font-body text-[15px] font-medium text-foreground/74 transition-colors hover:text-foreground bg-transparent border-none cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {session ? (
            <HmUserMenu />
          ) : (
            <>
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
                onClick={() => go("/sign-in?role=pro&mode=signup")}
                className="rounded-full border-foreground/15 bg-white/70 px-4 font-body text-sm gap-2 shadow-sm hover:bg-secondary"
              >
                <Briefcase className="w-4 h-4" />
                Join as a Pro
              </Button>
            </>
          )}
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
        <div className="space-y-3 border-t border-border bg-background/95 p-4 md:hidden backdrop-blur-xl max-h-[85vh] overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              go("/build");
            }}
            className="block w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-left font-body text-sm font-medium text-foreground"
          >
            Software (AI design)
          </button>
          <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
            <p className="mb-2 font-body text-xs font-semibold text-copper">Find Pros</p>
            <button type="button" onClick={() => go("/browse")} className="mb-2 w-full rounded-lg bg-copper/10 py-2 text-sm font-semibold text-copper border-none cursor-pointer">
              Browse professionals
            </button>
            <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
              {FIND_PROS_GROUPS.map((g) => (
                <div key={g.heading}>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{g.heading}</div>
                  <div className="flex flex-col gap-1">
                    {g.items.map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => goShopWithTrade(label)}
                        className="rounded-lg py-1.5 text-left text-xs text-foreground/85 bg-transparent border-none cursor-pointer"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {navAfterFindPros.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => go(item.path)}
              className="block w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-left font-body text-sm font-medium text-foreground"
            >
              {item.label}
            </button>
          ))}
          {session ? (
            <div className="flex justify-end py-1">
              <HmUserMenu />
            </div>
          ) : (
            <>
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
                onClick={() => go("/sign-in?role=pro&mode=signup")}
                className="w-full rounded-2xl border-foreground/20 font-body text-sm gap-2"
              >
                <Briefcase className="w-4 h-4" />
                Join as a Pro
              </Button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
