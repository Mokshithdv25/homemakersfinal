import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const features = [
  {
    id: 1,
    title: "AI v0 before you hire anyone",
    description:
      "Free AI layouts, visuals, and estimate ranges from your brief—so family and pros align on scope before sanction-grade drawings.",
  },
  {
    id: 2,
    title: "AI-native briefs & designs",
    description:
      "Mood, plot, budget, and constraints in one structured brief—AI reads the same story your architect will, with nothing lost in translation.",
  },
  {
    id: 3,
    title: "AI agents in project management",
    description:
      "Tasks, site photos, documents, and threads in one hub—AI agents highlight next steps, overdue items, and decisions so the build keeps moving.",
  },
  {
    id: 4,
    title: "Pros when you need humans",
    description:
      "Bring your own team or shortlist from our marketplace—AI handles the busywork; architects and contractors handle sign-off and site.",
  },
];

export default function LandingWhyChooseUs() {
  return (
    <section className="border-y border-border/40 bg-secondary/40 py-16 md:py-20">
      <div className="container max-w-5xl">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 font-display text-4xl font-bold text-foreground md:text-5xl">Why choose HomeMakers</h2>
          <p className="mx-auto max-w-2xl font-body text-base text-muted-foreground md:text-lg">
            India&apos;s AI-first home platform—design, estimates, marketplace, and project agents built for real builds,
            not slide decks.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-8 md:grid-cols-2"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.08 }}
              viewport={{ once: true }}
              className="flex gap-4 rounded-2xl border border-border/50 bg-card/50 p-5 pr-6 shadow-sm"
            >
              <CheckCircle2 className="h-8 w-8 shrink-0 text-green-600" />
              <div>
                <p className="mb-1 font-body text-lg font-semibold text-foreground">{feature.title}</p>
                <p className="m-0 font-body text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
