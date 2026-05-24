import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Home, Hammer, LayoutDashboard, Briefcase, ShoppingBag } from "lucide-react";
import { navigateToHomeownerFlow } from "../../lib/requireHomeownerAuth";
import { LandingAiLead } from "./LandingAiLead";

const OR = "#C85F2B";

const PATHS = [
  {
    id: "new",
    title: "New home",
    description: "AI layouts, plans, and estimates plus a brief your architect can read.",
    homeownerPath: "/build/new-home",
    icon: Home,
  },
  {
    id: "remodel",
    title: "Remodel",
    description: "AI-guided design, photos, and cost clarity at each step.",
    homeownerPath: "/build/remodel",
    icon: Hammer,
  },
  {
    id: "hub",
    title: "Project hub",
    description: "AI agents on visits, docs, and checklists. You approve what happens next.",
    to: "/project",
    icon: LayoutDashboard,
  },
  {
    id: "shop",
    title: "Materials shop",
    description: "AI proposes raw material picks. Edit and sign off before you buy.",
    to: "/shop",
    icon: ShoppingBag,
  },
  {
    id: "pro",
    title: "For professionals",
    description: "AI-ready clients, portfolio, leads, and a workspace to run jobs.",
    to: "/sign-in?role=pro&mode=signup",
    icon: Briefcase,
  },
];

export default function LandingHomeQuickLinks() {
  const navigate = useNavigate();

  const onCardClick = (p) => {
    if (p.homeownerPath) {
      navigateToHomeownerFlow(navigate, p.homeownerPath);
      return;
    }
    navigate(p.to);
  };

  return (
    <section className="border-b border-border/50 bg-gradient-to-b from-background to-secondary/15 py-16 md:py-20">
      <div className="container max-w-6xl">
        <LandingAiLead
          suffix="-powered flows"
          sub="Design, estimates, contractor matching, project agents, and materials shopping. AI proposes. You give the final yes."
        />
        <p className="-mt-6 mb-8 font-display text-xl font-semibold text-foreground md:text-2xl">
          Start <span className="italic text-copper">here</span>
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {PATHS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onCardClick(p)}
                className="surface-panel group flex h-full flex-col rounded-[1.25rem] p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-copper/25 hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-copper/10">
                  <Icon className="h-5 w-5 text-copper" strokeWidth={2} />
                </div>
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-foreground">{p.title}</h3>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </div>
                <p className="m-0 flex-1 font-body text-sm leading-snug text-muted-foreground">{p.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
