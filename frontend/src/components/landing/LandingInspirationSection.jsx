import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const publicUrl = process.env.PUBLIC_URL || "";

/** Real renders from the product asset library — regional Indian architecture directions */
const inspirations = [
  {
    id: 1,
    title: "Kerala & coastal",
    subtitle: "Sloping roofs, courtyards, breeze-friendly plans",
    image: `${publicUrl}/arch_kerala.png`,
    alt: "Kerala-style home exterior with traditional sloping roof and tropical landscaping",
  },
  {
    id: 2,
    title: "Traditional warmth",
    subtitle: "Courtyards, jaalis, craft-forward façades",
    image: `${publicUrl}/arch_traditional.png`,
    alt: "Traditional Indian home façade with carved details and warm stone tones",
  },
  {
    id: 3,
    title: "Modern metro",
    subtitle: "Clean lines for Bengaluru, Mumbai, Hyderabad",
    image: `${publicUrl}/arch_modern.png`,
    alt: "Contemporary Indian villa with flat roof planes and large glazing",
  },
  {
    id: 4,
    title: "Heritage & colonial",
    subtitle: "Verandahs, lime, timeless street presence",
    image: `${publicUrl}/arch_colonial.png`,
    alt: "Colonial-influenced Indian home with verandah and classic proportions",
  },
  {
    id: 5,
    title: "Fusion & eclectic",
    subtitle: "Mix regional cues with a contemporary shell",
    image: `${publicUrl}/arch_fusion.png`,
    alt: "Fusion-style Indian residence blending traditional elements with modern massing",
  },
];

export default function LandingInspirationSection({ onExplore }) {
  return (
    <section
      id="landing-inspiration"
      className="scroll-mt-[4.75rem] py-20 md:py-28 bg-background"
      aria-labelledby="landing-inspiration-heading"
    >
      <div className="container max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 id="landing-inspiration-heading" className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Get inspired by real Indian homes
          </h2>
          <p className="mx-auto max-w-2xl font-body text-base text-muted-foreground md:text-lg">
            Facades and moods from our India-first style library — the same references we use when you brief AI v0.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6"
        >
          {inspirations.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
              onClick={onExplore}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onExplore();
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="relative h-56 md:h-72 overflow-hidden rounded-2xl border border-border/50 shadow-md transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl">
                <img
                  src={item.image}
                  alt={item.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 text-left">
                  <p className="m-0 font-display text-lg font-semibold text-white md:text-xl">{item.title}</p>
                  <p className="mt-1.5 font-body text-xs font-medium leading-snug text-white/85 md:text-sm">{item.subtitle}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button
            type="button"
            size="lg"
            onClick={onExplore}
            className="gradient-copper rounded-lg px-8 py-3 font-body text-base font-semibold text-primary-foreground hover:opacity-90 h-auto"
          >
            Explore Designs
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
