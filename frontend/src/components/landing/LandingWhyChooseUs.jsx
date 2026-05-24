import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const features = [
  {
    id: 1,
    title: "Beautiful AI design, faster",
    description: "See layouts and visuals early. Share with family before you spend on drawings.",
  },
  {
    id: 2,
    title: "Pros and marketplace",
    description: "Bring your team or compare architects and contractors when you want options.",
  },
  {
    id: 3,
    title: "Hassle-free project hub",
    description: "Tasks, site photos, and files in one place. Fewer surprises on site.",
  },
  {
    id: 4,
    title: "Materials and payments",
    description: "Shop and milestone payments designed to stay with the build as it moves.",
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
          <p className="mx-auto max-w-xl font-body text-base text-muted-foreground md:text-lg">
            Faster, smarter, seamless. AI where it saves you time. Real pros where it matters.
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
