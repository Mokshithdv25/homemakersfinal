import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const HERO_URL = `${process.env.PUBLIC_URL || ""}/landing-hero.png`;

/** Letter avatars for social proof — single initial, warm palette */
const PROOF_LETTERS = [
  { letter: "A", bg: "bg-[#7c4a2f]" },
  { letter: "K", bg: "bg-[#2a6496]" },
  { letter: "M", bg: "bg-[#2d6a4f]" },
  { letter: "P", bg: "bg-[#6b4c9a]" },
  { letter: "R", bg: "bg-[#b45309]" },
];

export default function LandingHero({ onGetStarted, onExploreDesigns }) {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={HERO_URL}
          alt="Luxury living room with architectural floor plan overlay"
          className="h-full w-full object-cover"
        />
        {/* Base tone — heavier on the left where copy lives */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#120d09]/95 via-[#1b140f]/60 to-[#241a13]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#120d09]/70 via-transparent to-[#1a120c]/30" />
        {/* Readability band from the left */}
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.75)_25%,rgba(0,0,0,0.45)_50%,rgba(0,0,0,0.1)_75%,transparent_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_120%_at_15%_50%,rgba(12,8,6,0.85),rgba(12,8,6,0.4)_50%,transparent_80%)]"
          aria-hidden
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_20%,rgba(193,132,78,0.2),transparent_45%)]" />
      </div>

      <div className="container relative z-10 flex justify-start py-28 md:py-32">
        <div className="relative w-full max-w-2xl px-4 sm:px-6 md:max-w-[42rem]">
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="mb-5 font-display text-[2.4rem] font-bold leading-[1.1] tracking-[-0.01em] text-[#faf6f1] drop-shadow-md sm:text-5xl md:text-[3.5rem]">
                Where your vision is turned into your{" "}
                <span className="bg-gradient-to-r from-amber-200 via-[#e8a87c] to-[#c17f59] bg-clip-text text-transparent">
                  dream home
                </span>
                {" "}with the power of{" "}
                <span className="text-amber-200/95">AI</span>
              </h1>
              
              <div className="mb-7 max-w-lg">
                <p className="mb-5 font-body text-base font-normal leading-relaxed text-[#e8ddd4]/90 md:text-lg drop-shadow">
                  India's first complete home platform — from idea to execution, all in one place.
                </p>
                <p className="font-display text-lg font-semibold text-amber-100/85 tracking-wide drop-shadow">
                  Design. Build. Move In.{" "}
                  <span className="text-[#e8a87c]">Without the Chaos.</span>
                </p>
              </div>

              <div className="mb-10 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                <div className="flex items-center -space-x-2" aria-hidden="true">
                  {PROOF_LETTERS.map((p, i) => (
                    <div
                      key={i}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1f1512] font-body text-sm font-bold text-[#faf6f1] shadow-sm ${p.bg}`}
                    >
                      {p.letter}
                    </div>
                  ))}
                </div>
                <p className="m-0 font-body text-sm font-medium text-[#e8ddd4]/95 sm:max-w-[16rem] drop-shadow-sm">
                  Join 2,400+ homeowners already building on HomeMakers
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-2 flex flex-col gap-4 sm:flex-row"
            >
              <Button
                type="button"
                size="default"
                onClick={onGetStarted}
                className="gradient-copper h-auto rounded-lg px-7 py-3 font-body text-[15px] font-semibold text-primary-foreground shadow-md transition-opacity hover:opacity-90"
              >
                Start Your Home Project
              </Button>
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={onExploreDesigns}
                className="h-auto rounded-lg border border-amber-200/40 bg-white/10 px-7 py-3 font-body text-[15px] font-semibold text-[#faf6f1] shadow-sm backdrop-blur-sm hover:border-amber-200/60 hover:bg-white/15"
              >
                Explore Designs
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="mt-10 flex flex-wrap items-center gap-2 text-[#d4c4b8]/85"
            >
              <p className="m-0 font-body text-sm drop-shadow">Get inspired by 10,000+ real Indian home ideas</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
