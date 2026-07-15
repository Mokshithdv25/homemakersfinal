import React from "react";
import { motion } from "framer-motion";
import { Bot, Calculator, FolderKanban, ShoppingCart } from "lucide-react";

const capabilityGroups = [
  {
    title: "Design & planning",
    Icon: Bot,
    items: ["New-home design concepts", "Remodel concepts", "Floor-plan directions", "Mood boards & ideabooks", "Design preferences & briefs"],
  },
  {
    title: "Estimates & decisions",
    Icon: Calculator,
    items: ["Indicative cost estimates", "Material takeoffs", "Quantity & brand editing", "AI contractor matching", "Approval-ready suggestions"],
  },
  {
    title: "Project management",
    Icon: FolderKanban,
    items: ["Schedules & task management", "Daily briefings & site logs", "Documents & approvals", "Project-grounded AI Q&A", "Client project dashboard"],
  },
  {
    title: "Professionals & materials",
    Icon: ShoppingCart,
    items: ["Professional portfolios & leads", "Proposal-stage tracking", "AI- and pro-suggested carts", "Project-linked material shopping", "Payments & receipt ledger"],
  },
];

export default function LandingTestimonials() {
  return (
    <section className="border-y border-border/40 bg-[#FBF7F2] py-20 md:py-24">
      <div className="container max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto mb-12 max-w-4xl text-center">
          <span className="section-kicker">One connected HomeMakers workflow</span>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl">End-to-end AI tools for planning, hiring, shopping, and running a home project.</h2>
          <p className="mx-auto mt-5 max-w-3xl font-body text-sm leading-relaxed text-muted-foreground md:text-base">HomeMakers connects design concepts, floor-plan directions, estimates, material takeoffs, professional matching, project shopping, and day-to-day project management—without pretending every construction-business tool belongs in the homeowner workflow.</p>
        </motion.div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {capabilityGroups.map(({ title, Icon, items }, groupIndex) => (
            <motion.article key={title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: groupIndex * 0.07 }} className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-copper/10 text-copper"><Icon className="h-5 w-5" /></div>
              <h3 className="font-display text-xl font-bold text-foreground">{title}</h3>
              <ul className="mt-4 space-y-3 p-0">
                {items.map((item) => <li key={item} className="flex gap-2 font-body text-sm leading-snug text-foreground/80"><span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />{item}</li>)}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
