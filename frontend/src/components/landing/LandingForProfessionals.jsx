import React from "react";
import { motion } from "framer-motion";
import { Zap, IndianRupee, Globe, Handshake, Compass } from "lucide-react";

const forProfessionals = [
  {
    icon: Zap,
    title: "Start With a Clearer Brief",
    benefit: "Brief + visuals",
    description:
      "Homeowners can bring a structured brief, AI concept pack, and budget direction into the first conversation.",
  },
  {
    icon: IndianRupee,
    title: "Track Project Payments",
    benefit: "Owner-managed ledger",
    description:
      "Homeowners can record planned, due, and paid milestones in their project workspace. Payments are arranged directly with the professional.",
  },
  {
    icon: Globe,
    title: "Get Discovered Locally",
    benefit: "Shareable profile",
    description:
      "Get found in your city through the marketplace. One portfolio link, no website build required.",
  },
  {
    icon: Handshake,
    title: "Keep Project Details Together",
    benefit: "Saved workspace",
    description:
      "Keep tasks, documents, team contacts, and project notes together instead of scattering them across chats. Smart reminders and client follow-ups are the next layer.",
  },
];

export default function LandingForProfessionals() {
  return (
    <section className="py-24 md:py-28 bg-background border-t border-border/40">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid lg:grid-cols-12 gap-10 lg:gap-14 mb-12 md:mb-14 items-end"
        >
          <div className="lg:col-span-7">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-10 bg-copper/60" />
              <span className="font-body text-xs font-semibold text-copper tracking-[0.2em] uppercase">
                For professional teams
              </span>
            </div>
            <h3 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-3 leading-tight">
              Built for architects, designers, engineers, and contractors
            </h3>
            <p className="text-muted-foreground font-body text-base max-w-xl leading-relaxed">
              A shareable portfolio, directory visibility, and structured homeowner briefs in one place.
            </p>
          </div>
          <div className="lg:col-span-5 flex justify-start lg:justify-end">
            <div className="h-12 w-12 rounded-xl border border-border/60 bg-card flex items-center justify-center text-copper">
              <Compass className="w-6 h-6" strokeWidth={1.25} />
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-5">
          {forProfessionals.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="surface-panel p-6 md:p-7 group transition-colors duration-300 hover:border-accent/25"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-charcoal flex items-center justify-center shrink-0 group-hover:scale-[1.02] transition-transform">
                  <item.icon className="w-5 h-5 text-cream" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>
                    <span className="font-body text-[10px] font-semibold text-copper bg-accent/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {item.benefit}
                    </span>
                  </div>
                  <p className="text-muted-foreground font-body text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
