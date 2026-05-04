import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const features = [
  {
    id: 1,
    title: "Bring your vision",
    description: "Mood, layout, and budget come together in one place so nothing gets lost in translation.",
  },
  {
    id: 2,
    title: "Work with professionals",
    description: "Bring your own architect or contractor — or shortlist and compare from our marketplace when you want options.",
  },
  {
    id: 3,
    title: "Hassle-free project management",
    description: "Tasks, files, and updates stay organised — fewer surprises on site and on paper.",
  },
  {
    id: 4,
    title: "Payment protection",
    description:
      "Milestones and approvals for homeowners — and predictable payouts for pros — with financing and payment rails designed to stay in one place as the build advances.",
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
            The calm layer between your dream and the building site — with AI where it actually helps, not as a gimmick.
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
