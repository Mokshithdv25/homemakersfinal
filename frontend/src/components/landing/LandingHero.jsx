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
        <div className="absolute inset-0 bg-gradient-to-r from-[#120d09]/80 via-[#1b140f]/40 to-[#241a13]/0" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#120d09]/60 via-transparent to-[#1a120c]/20" />
        {/* Readability band from the left */}
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0.55)_25%,rgba(0,0,0,0.25)_50%,rgba(0,0,0,0.05)_70%,transparent_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_120%_at_15%_50%,rgba(12,8,6,0.65),rgba(12,8,6,0.25)_50%,transparent_80%)]"
          aria-hidden
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_20%,rgba(193,132,78,0.15),transparent_40%)]" />
      </div>

      <div className="container relative z-10 flex justify-start py-28 md:py-32">
        <div className="relative w-full max-w-2xl px-4 sm:px-6 md:max-w-[42rem]">
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e3c7a3]/35 bg-[#1f1512]/60 px-3.5 py-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e3c7a3] backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                AI-first home platform
              </p>
              <h1 className="mb-6 font-display text-[2.35rem] font-semibold leading-[1.12] tracking-tight text-[#fcfbfa] sm:text-5xl md:text-[3.55rem]">
                Bring your{" "}
                <span className="bg-gradient-to-r from-[#e3c7a3] to-[#cfa170] bg-clip-text text-transparent">
                  dream home
                </span>{" "}
                to life with the power of{" "}
                <span className="text-[#e3c7a3]">AI</span>
              </h1>

              <div className="mb-9 max-w-xl">
                <p className="mb-4 font-body text-[1.1rem] font-light leading-relaxed text-[#f2eee9]/92 md:text-xl">
                  India&apos;s first complete AI home platform — from idea to execution, all in one place.
                </p>
                <p className="mb-6 font-body text-[15px] leading-relaxed text-[#f2eee9]/78 md:text-base">
                  AI v0 designs and estimates when you&apos;re dreaming it up. AI agents in your project hub when
                  you&apos;re building it — briefs, site updates, and next steps stay clear for everyone on the job.
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-px w-8 bg-[#cfa170]/60" />
                  <p className="font-display text-[14px] font-medium tracking-[0.07em] uppercase text-[#e3c7a3]">
                    AI design · AI estimates ·{" "}
                    <span className="text-[#fcfbfa]/75">AI project agents</span>
                  </p>
                </div>
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
                <p className="m-0 font-body text-[13px] font-medium text-[#f2eee9]/80 sm:max-w-[18rem]">
                  Join 2,400+ homeowners using AI on HomeMakers — from first sketch to site handover
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
                Start with AI
              </Button>
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={onExploreDesigns}
                className="h-auto rounded-lg border border-amber-200/40 bg-white/10 px-7 py-3 font-body text-[15px] font-semibold text-[#faf6f1] shadow-sm backdrop-blur-sm hover:border-amber-200/60 hover:bg-white/15"
              >
                See AI design examples
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
