import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Home, Hammer, LayoutDashboard, Briefcase } from "lucide-react";
import { navigateToHomeownerFlow } from "../../lib/requireHomeownerAuth";

const OR = "#C85F2B";

const PATHS = [
  {
    id: "new",
    title: "New home",
    description: "Plan from the ground up with AI help on scope, design, cost, and your project story.",
    homeownerPath: "/build/new-home",
    icon: Home,
  },
  {
    id: "remodel",
    title: "Remodel or renovate",
    description: "Reimagine your space with AI-assisted briefs and visuals — not a rigid wizard, real guidance at each step.",
    homeownerPath: "/build/remodel",
    icon: Hammer,
  },
  {
    id: "hub",
    title: "Project management",
    description: "Cut the chaos: visits, photos, documents, and decisions in one place — with AI keeping threads and next actions legible.",
    to: "/project",
    icon: LayoutDashboard,
  },
  {
    id: "pro",
    title: "Professionals",
    description:
      "Portfolio, marketplace visibility, leads, and a workspace to run jobs — get discovered, collaborate, and close faster with AI where it saves time.",
    to: "/sign-in?role=pro&mode=signup",
    icon: Briefcase,
  },
];

/**
 * Home journey cards — new/remodel sign in when picked; hub and pro use their own entry paths.
 */
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
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-copper">Get started</p>
        <h2 className="mb-3 font-display text-2xl font-semibold leading-tight text-foreground md:text-3xl">
          Pick where you are <span className="italic" style={{ color: OR }}>in your journey</span>
        </h2>
        <p className="mb-10 max-w-2xl font-body text-sm leading-relaxed text-muted-foreground md:text-base">
          Jump straight in — new build, remodel, project hub, or your practice profile. Fewer clicks, one calm thread.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <p className="m-0 flex-1 font-body text-sm leading-relaxed text-muted-foreground">{p.description}</p>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}
