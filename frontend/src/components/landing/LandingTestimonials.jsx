import React from "react";
import { motion } from "framer-motion";
import { ClipboardCheck, Images, Users } from "lucide-react";

const useCases = [
  {
    title: "Turn ideas into a clear brief",
    text: "Capture scope, style, budget, and constraints in one place before you speak with professionals.",
    Icon: ClipboardCheck,
  },
  {
    title: "Compare early directions",
    text: "Review indicative AI concepts and estimate bands, then validate the direction with a qualified professional.",
    Icon: Images,
  },
  {
    title: "Keep the project organized",
    text: "Track checklists, documents, team contacts, and owner-entered payment records from the project hub.",
    Icon: Users,
  },
];

export default function LandingTestimonials() {
  return (
    <section className="py-24 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="section-kicker">
            Built for real project coordination
          </span>
          <h2 className="mt-4 mb-4 font-display text-4xl font-bold text-foreground md:text-5xl">From first brief to active project</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {useCases.map(({ title, text, Icon }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="surface-panel flex flex-col p-6 transition-all duration-300 group hover:-translate-y-0.5"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-copper/10 text-copper">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-3 font-display text-xl font-bold text-foreground">{title}</h3>
              <p className="text-foreground font-body text-sm leading-relaxed flex-1">{text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
