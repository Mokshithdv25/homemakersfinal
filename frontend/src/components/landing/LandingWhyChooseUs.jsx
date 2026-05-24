import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const features = [
  {
    id: 1,
    title: "AI design, plans & estimates",
    description:
      "Turn your brief into layouts, floor plans, visuals, and cost ranges in days. Easy to share before you hire.",
  },
  {
    id: 2,
    title: "AI contractor matching",
    description:
      "Surface the right architects and contractors for your city and scope. You choose who to invite. AI suggests, you decide.",
  },
  {
    id: 3,
    title: "AI project agents",
    description:
      "Site visits, documents, checklists, and team chat in one hub. Agents flag what needs attention. Nothing moves without your go-ahead.",
  },
  {
    id: 4,
    title: "Agentic materials shopping",
    description:
      "AI proposes raw material options from your project. Review, edit, and approve every line before you order.",
  },
  {
    id: 5,
    title: "Marketplace & payments",
    description: "Compare pros when you want options. Milestone payments designed to stay with the build.",
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
          <p className="mb-3 font-display text-[1.65rem] font-semibold leading-tight text-foreground md:text-4xl">
            Why choose <span className="text-copper">HomeMakers</span>
          </p>
          <p className="mx-auto max-w-xl font-body text-base text-muted-foreground md:text-lg">
            <span className="font-semibold text-foreground">AI is the engine.</span> You approve hires, orders, and
            major steps. Real pros and payments when the build needs humans.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.06 }}
              viewport={{ once: true }}
              className={`flex gap-4 rounded-2xl border border-border/50 bg-card/50 p-5 pr-6 shadow-sm ${
                feature.id === 5 ? "md:col-span-2 md:max-w-xl md:mx-auto md:w-full" : ""
              }`}
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
