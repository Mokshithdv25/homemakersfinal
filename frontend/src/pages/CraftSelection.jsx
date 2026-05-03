import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StepRail, ProfileStrength, LivePreview } from "../components/SharedUI";
import { HmHeaderBrandLockup } from "../components/HmBrandLockup";
import { HM_HEADER_BAR_CLASS, HM_TAGLINE_PORTFOLIO } from "../lib/hmBrand";
import {
  Home,
  Sparkles,
  Building2,
  Wrench,
  Check,
  ArrowRight,
  Shield,
  Lightbulb,
  ImageIcon,
  Pencil,
  User,
  MapPin,
  DraftingCompass,
  Armchair,
  ConstructionIcon,
  Hammer,
  PaintBucket,
  Zap,
  Droplets,
} from "lucide-react";



import { CRAFTS, findCraft } from "../lib/crafts";

function CraftCard({ craft, selected, onSelect, wide }) {
  const Icon = craft.Icon;
  return (
    <button
      type="button"
      className={`craft-card ${wide ? "flex items-center gap-4 text-left" : ""}`}
      data-selected={selected ? "true" : "false"}
      data-testid={`craft-card-${craft.id}`}
      onClick={() => onSelect(craft.id)}
      aria-pressed={selected}
    >
      <div className="craft-check" aria-hidden>
        <Check size={14} strokeWidth={3} />
      </div>

      {wide ? (
        <>
          <div
            className="craft-icon-wrap shrink-0"
            style={{ background: craft.tint, margin: 0 }}
          >
            <Icon size={26} color={craft.iconColor} strokeWidth={1.6} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-serif-display text-xl font-semibold text-[#1C1917] leading-tight">
              {craft.name}
            </div>
            <div className="text-sm text-[#7A6E62] mt-1">{craft.tagline}</div>
          </div>
        </>
      ) : (
        <>
          <div className="craft-icon-wrap" style={{ background: craft.tint }}>
            <Icon size={26} color={craft.iconColor} strokeWidth={1.6} />
          </div>
          <div className="font-serif-display text-lg font-semibold text-[#1C1917] leading-tight">
            {craft.name}
          </div>
          <div className="text-[13px] text-[#7A6E62] mt-1.5 leading-snug">
            {craft.tagline}
          </div>
        </>
      )}
    </button>
  );
}

export default function CraftSelection() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const profileStrength = useMemo(() => (selected ? 25 : 15), [selected]);

  const handleContinue = () => {
    if (!selected) return;
    setSubmitting(true);
    // Save craft to localStorage — no backend needed
    const id = `hm_${Date.now()}`;
    localStorage.setItem("hm_portfolio_id", id);
    localStorage.setItem("hm_craft", selected);
    // Persist empty portfolio object
    const portfolio = {
      id,
      craft: selected,
      full_name: "", business_name: "", city: "",
      years_experience: "", phone: "", email: "", license_number: "",
      short_bio: "", specialties: [], photos: [],
      cover_photo: "", profile_photo: "",
      profile_strength: 25, step: 1, published: false, slug: null
    };
    localStorage.setItem("hm_portfolio", JSON.stringify(portfolio));
    setSubmitting(false);
    navigate("/details");
  };

  return (
    <div className="relative min-h-screen bg-[#FBF7F2] overflow-x-hidden">
      {/* Background accents matching the homepage */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(193,132,78,0.08),transparent_50%)]" aria-hidden />

      {/* Header */}
      <header className={HM_HEADER_BAR_CLASS} data-testid="hm-header">
        <HmHeaderBrandLockup tagline={HM_TAGLINE_PORTFOLIO} />

        <div className="hidden md:block">
          <StepRail currentStep={1} />
        </div>

        <ProfileStrength value={profileStrength} />
      </header>

      {/* Mobile step rail */}
      <div className="md:hidden px-6 mb-2 flex justify-center">
        <StepRail currentStep={1} />
      </div>

      {/* Divider */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0 px-6 md:px-12 pb-6">
        {/* LEFT */}
        <section className="lg:pr-12 lg:border-r lg:border-[#EFE3D2]">
          <div
            className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] uppercase px-3 py-1 rounded-full"
            style={{ background: "#FBE5D4", color: "#B04F20" }}
            data-testid="step-indicator"
          >
            Step 1 of 4
          </div>

          <h1 className="mt-3 font-serif-display text-4xl md:text-5xl leading-[1.05] text-[#1C1917] font-medium">
            What's your{" "}
            <span
              className="italic font-semibold"
              style={{ color: "#C85F2B" }}
            >
              craft
            </span>
            ?
          </h1>

          <p className="mt-2 text-[14px] text-[#6A5E53] max-w-md leading-relaxed">
            Choose what you do best. We'll tailor your portfolio experience
            just for you.
          </p>

          {/* Design Professionals */}
          <div className="mt-5">
            <div className="craft-type-label">
              <Sparkles size={14} color="#C85F2B" />
              <span>Design Professionals</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
              {CRAFTS.design.items.map((c) => (
                <CraftCard
                  key={c.id}
                  craft={c}
                  selected={selected === c.id}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </div>

          {/* Build Professionals */}
          <div className="mt-4">
            <div className="craft-type-label">
              <Building2 size={14} color="#B04F20" />
              <span>Build Professionals</span>
            </div>
            <div className="mt-3">
              {CRAFTS.build.items.map((c) => (
                <CraftCard
                  key={c.id}
                  craft={c}
                  selected={selected === c.id}
                  onSelect={setSelected}
                  wide
                />
              ))}
            </div>
          </div>

          {/* Skilled Trades */}
          <div className="mt-4">
            <div className="craft-type-label">
              <Wrench size={14} color="#B04F20" />
              <span>Skilled Trades</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              {CRAFTS.trades.items.map((c) => (
                <CraftCard
                  key={c.id}
                  craft={c}
                  selected={selected === c.id}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </div>

          {error && (
            <div
              className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
              data-testid="craft-error"
            >
              {error}
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-[#EFE3D2] flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div
              className="flex items-center gap-3 bg-white/70 border border-[#EFE3D2] rounded-xl px-4 py-3"
              data-testid="privacy-note"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "#F1EBE3" }}
              >
                <Shield size={16} color="#8B7E6E" />
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-semibold text-[#1C1917]">
                  Your information is private and secure
                </div>
                <div className="text-[12px] text-[#7A6E62]">
                  We never share your data with anyone.
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-continue w-full sm:w-auto"
              onClick={handleContinue}
              disabled={!selected || submitting}
              data-testid="continue-btn"
            >
              {submitting ? "Saving..." : "Continue"}
              <ArrowRight size={18} className="arrow" />
            </button>
          </div>
        </section>

        {/* RIGHT */}
        <section className="lg:pl-12 lg:pt-12">
          <LivePreview craftId={selected} />
        </section>
      </div>
    </div>
  );
}
