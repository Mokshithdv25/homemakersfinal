import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ClipboardList, UsersRound, ShoppingBag } from "lucide-react";

const PILLARS = [
  {
    icon: Sparkles,
    title: "Design, plans & estimates",
    description:
      "AI turns your brief into layouts, visuals, and cost ranges fast. Your dream becomes easy to explain before sanction drawings.",
  },
  {
    icon: ClipboardList,
    title: "Smart project management",
    description:
      "Site visits, photos, documents, checklists, and team chat in one hub. AI highlights what needs attention so the build stays on track.",
  },
  {
    icon: UsersRound,
    title: "Pros & contractor matching",
    description:
      "Bring your own architect or shortlist from our marketplace. Smarter matching helps you find the right team for your city and scope.",
  },
  {
    icon: ShoppingBag,
    title: "Materials marketplace",
    description:
      "Shop raw materials with AI-assisted picks you can review, revise, and approve. You stay in control of every line item.",
  },
];

export default function LandingPlatformStrip() {
  return (
    <section className="border-b border-border/40 bg-background py-14 md:py-20">
      <div className="container max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 max-w-2xl"
        >
          <p className="mb-2 font-body text-sm font-bold uppercase tracking-[0.14em] text-copper">
            Powered by AI. Built for real homes.
          </p>
          <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl leading-tight">
            Everything you need from brief to handover
          </h2>
          <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground md:text-base">
            Not AI for its own sake. Faster design and estimates, a documented project hub, pros when you need them,
            and materials you can shop with confidence. 3D walkthroughs and more are on the roadmap.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PILLARS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="surface-panel rounded-2xl p-5 md:p-6"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-copper/10">
                  <Icon className="h-5 w-5 text-copper" strokeWidth={2} />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="m-0 font-body text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
