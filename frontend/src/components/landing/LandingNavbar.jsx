import React, { useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, User, ChevronDown, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HM_HEADER_BAR_CHROME_CLASS, HM_WORDMARK_TAGLINE_CLASS, hmLogoMarkSrc } from "../../lib/hmBrand";
import { AUTH_UI_ENABLED } from "../../lib/authMode";
import { getProEntryPath } from "../../lib/proEntryPath";
import { useHmSession } from "../../hooks/useHmSession";
import HmUserMenu from "../HmUserMenu";
import HmMarketingWordmark from "../HmMarketingWordmark";

const HOMEOWNER_SOFTWARE_GROUPS = [
  {
    heading: "Design & planning",
    items: [
      { label: "New-home design & estimate", path: "/build/new-home" },
      { label: "Remodel design & estimate", path: "/build/remodel" },
      { label: "Floor-plan concepts", path: "/build/new-home" },
      { label: "Mood boards & ideabooks", path: "/design" },
      { label: "Material takeoffs", path: "/project?tab=Materials" },
      { label: "AI contractor matching", path: "/browse" },
    ],
  },
  {
    heading: "Project management",
    items: [
      { label: "Client project dashboard", path: "/project" },
      { label: "Schedule", path: "/project?tab=Timeline" },
      { label: "Task management", path: "/project?tab=Tasks" },
      { label: "Daily briefings & site logs", path: "/project?tab=Site%20Feed" },
      { label: "Documents & approvals", path: "/documents" },
      { label: "Project-grounded AI Q&A", path: "/project" },
    ],
  },
  {
    heading: "Costs & materials",
    items: [
      { label: "Estimates & cost planning", path: "/build" },
      { label: "Budget & payment ledger", path: "/project/payments" },
      { label: "AI-suggested material cart", path: "/shop" },
      { label: "Professional-suggested cart", path: "/shop" },
      { label: "Brand & quantity selection", path: "/project?tab=Materials" },
      { label: "Project-linked material shop", path: "/shop" },
    ],
  },
  {
    heading: "For professionals",
    items: [
      { label: "Portfolio & marketplace profile", path: "/craft" },
      { label: "Homeowner leads & CRM pipeline", path: "/pro/leads" },
      { label: "Proposal-stage tracking", path: "/pro/leads" },
      { label: "Active project workspace", path: "/pro/dashboard" },
      { label: "Invoicing & payouts", comingSoon: true },
      { label: "Change orders & financial reports", comingSoon: true },
    ],
  },
];

const PRO_SOFTWARE_GROUPS = HOMEOWNER_SOFTWARE_GROUPS.slice(1);

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
 * Marketing / homeowner / pro nav. Pro sessions hide homeowner-only items (Find Pros, My Project).
 */
export default function LandingNavbar({ tagline = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useHmSession();

  const signInHref = useCallback(({ role, mode } = {}) => {
    const params = new URLSearchParams();
    params.set("mode", mode || "signin");
    if (role) params.set("role", role);
    const base = location.pathname + location.search;
    if (base && base !== "/" && !base.startsWith("/sign-in")) {
      params.set("redirect", base);
    }
    return `/sign-in?${params.toString()}`;
  }, [location.pathname, location.search]);
  const isProSession = session?.role === "pro";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [softwareOpen, setSoftwareOpen] = useState(false);
  const [findProsOpen, setFindProsOpen] = useState(false);

  const softwareGroups = useMemo(
    () => (isProSession ? PRO_SOFTWARE_GROUPS : HOMEOWNER_SOFTWARE_GROUPS),
    [isProSession],
  );

  const primaryNav = useMemo(() => {
    if (isProSession) {
      return [
        { label: "Leads", path: "/pro/leads" },
        { label: "Collaborate", path: "/browse" },
        { label: "Shop", path: "/shop" },
      ];
    }
    if (!AUTH_UI_ENABLED) {
      return [
        { label: "My Project", path: "/project" },
        { label: "Start build", path: "/build" },
        { label: "Shop", path: "/shop" },
      ];
    }
    return [
      { label: "My Project", path: "/project" },
      { label: "Shop", path: "/shop" },
    ];
  }, [isProSession]);

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

  const renderSoftwareMenu = () => (
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
        <div className="absolute left-0 top-[calc(100%+0.9rem)] w-[min(70rem,calc(100vw-3rem))] max-h-[min(76vh,620px)] overflow-y-auto rounded-[1.35rem] border border-black/8 bg-[rgba(255,252,249,0.99)] p-5 shadow-[0_28px_80px_rgba(48,33,21,0.14)] backdrop-blur-xl">
          <div className={`grid gap-x-7 gap-y-6 ${softwareGroups.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
            {softwareGroups.map((group) => <div key={group.heading}><div className="mb-2 px-2 font-body text-sm font-bold text-foreground">{group.heading}</div><div className="space-y-0.5">{group.items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.path && !item.comingSoon) go(item.path);
                  if (!item.comingSoon) setSoftwareOpen(false);
                }}
                className={`block w-full rounded-lg px-2 py-2 text-left font-body text-[13px] leading-snug transition-colors bg-transparent border-none ${item.comingSoon ? "text-foreground/45 cursor-default" : "text-foreground/76 hover:bg-secondary/70 hover:text-foreground cursor-pointer"}`}
              >
                {item.comingSoon ? <span className="flex items-start justify-between gap-2"><span>{item.label}</span><span className="shrink-0 rounded-md border border-[#E5D8CC] bg-[#F8F1EA] px-1.5 py-1 text-[9px] font-semibold leading-none text-[#6E655E]">Soon</span></span> : item.label}
              </button>
            ))}</div></div>)}
          </div>
          <div className="mt-5 flex items-center justify-between gap-4 border-t border-border/60 px-2 pt-4"><div><strong className="font-display text-base text-foreground">HomeMakers</strong><span className="ml-2 font-body text-xs text-muted-foreground">AI-assisted software for Indian home design, construction, and remodeling</span></div><button type="button" onClick={() => go(isProSession ? "/pro/dashboard" : "/build")} className="shrink-0 rounded-xl border border-copper/25 bg-copper/10 px-4 py-2 font-body text-xs font-bold text-copper">Open workspace</button></div>
        </div>
      )}
    </div>
  );

  const renderFindPros = () => (
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
  );

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${HM_HEADER_BAR_CHROME_CLASS}`}>
      <div className={`container flex items-center justify-between gap-4 ${tagline ? "min-h-[4.65rem] py-2" : "h-[4.65rem]"}`}>
        <button
          type="button"
          onClick={() => go(isProSession ? "/pro/dashboard" : "/")}
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
          {renderSoftwareMenu()}
          {!isProSession ? renderFindPros() : null}
          {primaryNav.map((item) => (
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
          {AUTH_UI_ENABLED ? (
            session ? (
              <HmUserMenu />
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => go(signInHref())}
                  className="rounded-full px-3.5 font-body text-sm gap-2"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => go(getProEntryPath())}
                  className="rounded-full border-foreground/15 bg-white/70 px-4 font-body text-sm gap-2 shadow-sm hover:bg-secondary"
                >
                  <Briefcase className="w-4 h-4" />
                  Join as a Pro
                </Button>
              </>
            )
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => go(getProEntryPath())}
              className="rounded-full border-foreground/15 bg-white/70 px-4 font-body text-sm gap-2 shadow-sm hover:bg-secondary"
            >
              <Briefcase className="w-4 h-4" />
              Join as a Pro
            </Button>
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
            onClick={() => go(isProSession ? "/pro/dashboard" : "/build")}
            className="block w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-left font-body text-sm font-medium text-foreground"
          >
            Software
          </button>
          {!isProSession ? (
            <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
              <p className="mb-2 font-body text-xs font-semibold text-copper">Find Pros</p>
              <button type="button" onClick={() => go("/browse")} className="mb-2 w-full rounded-lg bg-copper/10 py-2 text-sm font-semibold text-copper border-none cursor-pointer">
                Browse professionals
              </button>
            </div>
          ) : null}
          {primaryNav.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => go(item.path)}
              className="block w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-left font-body text-sm font-medium text-foreground"
            >
              {item.label}
            </button>
          ))}
          {AUTH_UI_ENABLED ? (
            session ? (
              <div className="flex justify-end py-1">
                <HmUserMenu />
              </div>
            ) : (
              <>
                <Button type="button" variant="ghost" onClick={() => go(signInHref())} className="w-full justify-start font-body text-sm gap-2">
                  <User className="w-4 h-4" />
                  Sign In
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => go(getProEntryPath())}
                  className="w-full rounded-2xl border-foreground/20 font-body text-sm gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  Join as a Pro
                </Button>
              </>
            )
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => go(getProEntryPath())}
              className="w-full rounded-2xl border-foreground/20 font-body text-sm gap-2"
            >
              <Briefcase className="w-4 h-4" />
              Join as a Pro
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}
