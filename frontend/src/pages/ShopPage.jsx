import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, ArrowRight } from "lucide-react";
import LandingNavbar from "../components/landing/LandingNavbar";
import { Button } from "@/components/ui/button";

/**
 * Retail shop — building materials, finishes, and project supplies (not the pro marketplace).
 * Professionals live at /browse; in-project hub still uses /marketplace.
 */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&q=80";

const DEPT_CATEGORIES = [
  { id: "structural", label: "Structural", sub: "Cement, steel, blocks, aggregates" },
  { id: "mep", label: "MEP rough-ins", sub: "Conduit, piping, ducting, fittings" },
  { id: "finishes", label: "Finishes", sub: "Tiles, paint, flooring, ceiling" },
  { id: "joinery", label: "Doors & windows", sub: "Modular woodwork, glazing" },
  { id: "kitchen", label: "Kitchen & bath", sub: "Fixtures, counters, fittings" },
  { id: "site", label: "Site & waterproofing", sub: "Roofing, chemicals, drainage" },
];

const ROOM_THEMES = [
  { title: "Living Room", img: "theme_living_room.png", tag: "Modern Indian" },
  { title: "Puja Room", img: "theme_puja_room.png", tag: "Traditional" },
  { title: "Modular Kitchen", img: "theme_kitchen.png", tag: "Premium" },
  { title: "Master Bedroom", img: "theme_bedroom.png", tag: "Contemporary" },
];

const DEPARTMENTS = [
  {
    title: "Cement & concrete",
    tag: "Raw materials",
    img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&q=75",
    blurb: "OPC, PPC, ready-mix, and admixtures for your slab and structural pours.",
  },
  {
    title: "Steel & reinforcement",
    tag: "Raw materials",
    img: "https://images.unsplash.com/photo-1587293852727-8cdb82539fc7?w=600&q=75",
    blurb: "TMT bars, mesh, and structural steel — spec-linked to your estimate where possible.",
  },
  {
    title: "Bricks & blocks",
    tag: "Masonry",
    img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=75",
    blurb: "Fly ash, AAC, and clay masonry for walls and partitions.",
  },
  {
    title: "Electrical & lighting",
    tag: "MEP",
    img: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=75",
    blurb: "Cables, switchgear, fixtures, and smart-home-ready accessories.",
  },
  {
    title: "Plumbing & bath",
    tag: "MEP",
    img: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=75",
    blurb: "CPVC, sanitaryware, showers, and kitchen sinks.",
  },
  {
    title: "Flooring & cladding",
    tag: "Finishes",
    img: "https://images.unsplash.com/photo-1615979310578-d96efcd53f75?w=600&q=75",
    blurb: "Tiles, stone, laminate, and exterior cladding panels.",
  },
  {
    title: "Paint & waterproofing",
    tag: "Finishes",
    img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=75",
    blurb: "Interior/exterior coats, sealants, and terrace waterproofing systems.",
  },
  {
    title: "Doors, windows & hardware",
    tag: "Joinery",
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=75",
    blurb: "FRP, UPVC, aluminium systems, and ironmongery.",
  },
  {
    title: "Modular kitchen & wardrobes",
    tag: "Finished",
    img: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&q=75",
    blurb: "Factory-finished carcasses, shutters, and soft-close hardware.",
  },
  {
    title: "Landscaping & outdoor",
    tag: "Site",
    img: "https://images.unsplash.com/photo-1598902108854-10e335adac99?w=600&q=75",
    blurb: "Pavers, turf, lighting, and exterior furniture.",
  },
];

export default function ShopPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  return (
    <div className="hm-landing-page min-h-screen bg-background">
      <LandingNavbar />

      <main className="pt-[4.65rem]">
        {/* Promo strip */}
        <div className="border-b border-border/60 bg-[#1C1917] py-2.5 text-center font-body text-[11px] font-medium text-[#f5f0eb] md:text-xs">
          Project-linked lists & GST-ready invoices when checkout is wired · Same brief as your AI v0 & estimates
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0">
            <img src={HERO_IMAGE} alt="" className="h-full w-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/25" />
          </div>
          <div className="relative container max-w-6xl py-16 md:py-24">
            <p className="mb-2 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e3c7a3]">
              Materials & finished goods
            </p>
            <h1 className="font-display text-3xl font-semibold leading-tight text-[#fcfbfa] md:text-5xl md:leading-[1.1]">
              Stock your site — raw materials to fixtures
            </h1>
            <p className="mt-4 max-w-xl font-body text-sm leading-relaxed text-[#f2eee9]/90 md:text-base">
              Browse cement-to-finish SKUs sized for Indian builds. Separate from hiring pros — use{" "}
              <button
                type="button"
                onClick={() => navigate("/browse")}
                className="font-semibold text-[#e3c7a3] underline-offset-2 hover:underline bg-transparent border-none cursor-pointer p-0"
              >
                Find Pros
              </button>{" "}
              to shortlist architects and contractors.
            </p>

            <div className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md">
                <Search className="h-5 w-5 shrink-0 text-[#e3c7a3]" aria-hidden />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search cement, tiles, switches, sanitaryware…"
                  className="w-full bg-transparent font-body text-sm text-[#fcfbfa] placeholder:text-[#d4c4b8]/80 outline-none"
                  aria-label="Search materials"
                />
              </div>
              <Button
                type="button"
                className="gradient-copper h-auto rounded-xl px-6 py-3 font-body text-sm font-semibold text-primary-foreground shadow-md"
                onClick={() => {}}
              >
                Search
              </Button>
            </div>
          </div>
        </section>

        {/* Category chips */}
        <section className="border-b border-border/40 bg-card/40 py-4">
          <div className="container max-w-6xl">
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              {DEPT_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="rounded-full border border-border/70 bg-background/90 px-4 py-2 font-body text-xs font-medium text-foreground transition-colors hover:border-copper/40 hover:bg-secondary/50"
                >
                  <span className="font-semibold">{c.label}</span>
                  <span className="text-muted-foreground"> · {c.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Shop by Room / Theme */}
        <section className="py-14 md:py-20 bg-[#FBF6F0]">
          <div className="container max-w-6xl">
            <div className="mb-10 text-center">
              <span className="section-kicker mb-3">Get Inspired</span>
              <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
                Shop by Rooms & Themes
              </h2>
              <p className="mx-auto mt-3 max-w-2xl font-body text-sm text-muted-foreground md:text-base">
                Discover curated looks and complete room packages tailored for modern Indian homes. 
                From serene Puja spaces to premium modular kitchens.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {ROOM_THEMES.map((theme) => (
                <button
                  key={theme.title}
                  type="button"
                  className="group relative flex flex-col overflow-hidden rounded-2xl p-0 text-left transition-all hover:-translate-y-1 hover:shadow-xl border-none bg-black"
                  onClick={() => {}}
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden">
                    <img
                      src={`${process.env.PUBLIC_URL || ""}/${theme.img}`}
                      alt={theme.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.08] opacity-80 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="mb-1.5 inline-block rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 font-body text-[10px] font-semibold tracking-wider text-white uppercase border border-white/30">
                        {theme.tag}
                      </div>
                      <h3 className="font-display text-xl font-medium text-white">{theme.title}</h3>
                      <div className="mt-2 flex items-center gap-1.5 font-body text-xs font-semibold text-[#e3c7a3] opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                        Shop the look
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Shop by department */}
        <section className="py-14 md:py-20">
          <div className="container max-w-6xl">
            <div className="mb-10 text-center">
              <span className="section-kicker mb-3">Shop by department</span>
              <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
                From foundation pour to final fit-off
              </h2>
              <p className="mx-auto mt-3 max-w-2xl font-body text-sm text-muted-foreground md:text-base">
                Curated for residential projects in India — quantities can later tie to your BOQ and site delivery slots.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {DEPARTMENTS.map((d) => (
                <button
                  key={d.title}
                  type="button"
                  className="group surface-panel flex flex-col overflow-hidden rounded-2xl p-0 text-left transition-all hover:-translate-y-0.5 hover:border-copper/25 hover:shadow-lg"
                  onClick={() => {}}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={d.img}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                      {d.tag}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-display text-base font-semibold text-foreground">{d.title}</h3>
                    <p className="mt-1.5 flex-1 font-body text-xs leading-relaxed text-muted-foreground">{d.blurb}</p>
                    <span className="mt-3 inline-flex items-center gap-1 font-body text-xs font-semibold text-copper">
                      View SKUs
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-secondary/30 px-6 py-8 text-center">
              <Package className="h-10 w-10 text-copper/80" aria-hidden />
              <p className="font-body text-sm leading-relaxed text-muted-foreground">
                Checkout, vendor fulfilment, and project-address delivery are staged next — this shopfront is structured so
                your selections can attach to milestones and invoices later.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
