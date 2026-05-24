import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Unlock, UsersRound, ClipboardList, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: Sparkles,
    title: "Imagine your home",
    description:
      "Capture inspiration, spaces, and must-haves in one structured brief, so AI and your future architect both read the same vision.",
  },
  {
    icon: Unlock,
    title: "Unlock designs & estimates",
    description:
      "Generate a free AI design pack: layouts, visuals, and estimate ranges to review at home and hand to professionals before sanction-grade drawings.",
  },
  {
    icon: UsersRound,
    title: "Work with real professionals",
    description:
      "Shortlist architects and contractors from the marketplace when you need them. Review designs together, align family, reach consensus, and lock scope before site work.",
  },
  {
    icon: ClipboardList,
    title: "Run the project with clarity",
    description:
      "One hub for visits, site photos, documents, and threads. Milestones and checklists keep roles, updates, and decisions accountable from first pour to handover.",
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
            A clearer path from vision to handover
          </h2>
          <p className="text-muted-foreground font-body text-lg leading-relaxed">
            Built for how Indian homes actually get done. Brief, marketplace, and project hub connected end to end, so
            clarity replaces inbox chaos.
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
                transition={{ delay: i * 0.08 }}
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
