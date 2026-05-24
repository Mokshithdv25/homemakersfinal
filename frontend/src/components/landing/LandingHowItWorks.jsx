import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Unlock, UsersRound, ClipboardList, ShoppingBag, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: Sparkles,
    title: "Share your vision",
    description:
      "One brief for mood, plot, and budget. AI and your architect read the same story from day one.",
  },
  {
    icon: Unlock,
    title: "AI design, plans & estimates",
    description:
      "Layouts, visuals, and cost ranges in days. Review at home, align family, then hand off to your team.",
  },
  {
    icon: UsersRound,
    title: "AI contractor matching",
    description:
      "AI surfaces architects and contractors that fit your city and scope. You pick who gets invited. No auto-hires.",
  },
  {
    icon: ClipboardList,
    title: "AI project agents",
    description:
      "Visits, photos, documents, and checklists in one hub. Agents highlight next steps. You approve what ships.",
  },
  {
    icon: ShoppingBag,
    title: "Agentic materials shopping",
    description:
      "AI drafts raw material options from your project. Edit the list and sign off before anything is ordered.",
  },
];

export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-28 bg-secondary/70">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mb-16 md:mb-20"
        >
          <span className="section-kicker">
            <CheckCircle2 className="h-3.5 w-3.5" />
            How it works
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-foreground mt-4 mb-4 leading-tight">
            <span className="text-copper">AI</span>-powered from sketch to handover
          </h2>
          <p className="text-muted-foreground font-body text-lg leading-relaxed max-w-2xl">
            Design, estimates, matching, project agents, and materials shopping on one platform. AI proposes. You
            approve. Built for Indian homes.
          </p>
        </motion.div>

        <div className="relative max-w-4xl">
          <div className="hidden md:block absolute left-[19px] top-8 bottom-8 w-px bg-border" aria-hidden />
          <div className="space-y-6 md:space-y-5">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="relative md:pl-14"
              >
                <div className="hidden md:flex absolute left-0 top-8 h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-card shadow-sm z-[1]">
                  <span className="font-body text-xs font-bold text-copper tabular-nums">{i + 1}</span>
                </div>
                <div className="surface-panel p-6 md:p-8 md:grid md:grid-cols-[auto_1fr] md:gap-8 items-start">
                  <div className="flex md:flex-col items-center md:items-start gap-4 mb-4 md:mb-0">
                    <div className="md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-copper font-body text-xs font-bold">
                      {i + 1}
                    </div>
                    <div className="h-12 w-12 rounded-xl gradient-copper flex items-center justify-center shrink-0">
                      <step.icon className="w-6 h-6 text-primary-foreground" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div>
                    <div className="font-body text-[10px] font-semibold text-copper tracking-[0.15em] uppercase mb-2">
                      Step {i + 1}
                    </div>
                    <h3 className="font-display text-xl md:text-2xl font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground font-body text-sm leading-relaxed max-w-prose">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
