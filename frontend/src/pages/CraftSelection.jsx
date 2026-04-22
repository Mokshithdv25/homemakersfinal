import React, { useMemo, useState } from "react";
import axios from "axios";
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CRAFTS = {
  design: {
    label: "Design Professionals",
    icon: Sparkles,
    items: [
      {
        id: "architect",
        name: "Architect",
        tagline: "Designing spaces that inspire.",
        Icon: DraftingCompass,
        tint: "#FBE5D4",
        iconColor: "#C85F2B",
        hero:
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=70",
        specialties: ["Residential", "Commercial", "Sustainable"],
      },
      {
        id: "designer",
        name: "Designer",
        tagline: "Crafting beautiful interiors.",
        Icon: Armchair,
        tint: "#F1EBE3",
        iconColor: "#8B7E6E",
        hero:
          "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1400&q=70",
        specialties: ["Interior", "Styling", "Space Planning"],
      },
      {
        id: "engineer",
        name: "Engineer",
        tagline: "Building with precision.",
        Icon: Building2,
        tint: "#E6EBF1",
        iconColor: "#4A6B8B",
        hero:
          "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1400&q=70",
        specialties: ["Structural", "MEP", "Civil"],
      },
    ],
  },
  build: {
    label: "Build Professionals",
    icon: Building2,
    items: [
      {
        id: "contractor",
        name: "Contractor",
        tagline: "Managing projects. Delivering results.",
        Icon: ConstructionIcon,
        tint: "#FDF0D8",
        iconColor: "#D4A64A",
        hero:
          "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=70",
        specialties: ["General Contracting", "Project Management", "Renovation"],
        wide: true,
      },
    ],
  },
  trades: {
    label: "Skilled Trades",
    icon: Wrench,
    items: [
      {
        id: "plumber",
        name: "Plumber",
        tagline: "Pipes, fittings & water systems.",
        Icon: Droplets,
        tint: "#E9EEF3",
        iconColor: "#5A7B93",
        hero:
          "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1400&q=70",
        specialties: ["Residential Plumbing", "Fixtures", "Water Heaters"],
      },
      {
        id: "electrician",
        name: "Electrician",
        tagline: "Powering safe connections.",
        Icon: Zap,
        tint: "#FDF0D8",
        iconColor: "#E8A84A",
        hero:
          "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1400&q=70",
        specialties: ["Wiring", "Panels", "Lighting"],
      },
      {
        id: "painter",
        name: "Painter",
        tagline: "Finishes that bring life.",
        Icon: PaintBucket,
        tint: "#FBE5D4",
        iconColor: "#C85F2B",
        hero:
          "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1400&q=70",
        specialties: ["Interior", "Exterior", "Finishes"],
      },
      {
        id: "carpenter",
        name: "Carpenter",
        tagline: "Precision in every detail.",
        Icon: Hammer,
        tint: "#F1EBE3",
        iconColor: "#8B5E3C",
        hero:
          "https://images.unsplash.com/photo-1601058272477-3cf8edbb8a51?auto=format&fit=crop&w=1400&q=70",
        specialties: ["Framing", "Cabinetry", "Custom Millwork"],
      },
    ],
  },
};

const ALL_CRAFTS = [
  ...CRAFTS.design.items,
  ...CRAFTS.build.items,
  ...CRAFTS.trades.items,
];

const findCraft = (id) => ALL_CRAFTS.find((c) => c.id === id);

function StepRail({ currentStep = 1 }) {
  const steps = [
    { n: 1, label: "Your Craft" },
    { n: 2, label: "Your Details" },
    { n: 3, label: "Your Portfolio" },
    { n: 4, label: "Go Live" },
  ];
  return (
    <div
      className="flex items-center gap-3 md:gap-4 w-full max-w-xl"
      data-testid="step-rail"
    >
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div
              className="step-dot"
              data-state={currentStep === s.n ? "active" : "idle"}
              data-testid={`step-dot-${s.n}`}
            >
              {s.n}
            </div>
            <span
              className={`text-[11px] md:text-xs font-medium tracking-wide ${
                currentStep === s.n ? "text-[#1C1917]" : "text-[#A89A8C]"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="step-rail -mt-5"
              data-filled={currentStep > s.n ? "true" : "false"}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function ProfileStrength({ value = 15 }) {
  const deg = Math.round((value / 100) * 360);
  return (
    <div className="profile-strength-pill" data-testid="profile-strength">
      <div>
        <div className="text-[11px] font-semibold tracking-wider text-[#B04F20] uppercase">
          Profile Strength
        </div>
        <div className="font-serif-display text-2xl font-semibold text-[#C85F2B] leading-none mt-0.5">
          {value}%
        </div>
      </div>
      <div
        className="strength-ring"
        style={{ "--strength-deg": `${deg}deg` }}
        aria-hidden
      />
    </div>
  );
}

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

function LivePreview({ craftId }) {
  const craft = findCraft(craftId);
  const displayName = craft ? craft.name : "Architect";
  const hero =
    craft?.hero ||
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=70";
  const specialties = craft?.specialties || ["Residential", "Commercial", "Sustainable"];

  return (
    <div className="relative w-full max-w-[440px] mx-auto">
      <div className="preview-annotation select-none">Live Preview</div>
      <svg
        className="absolute -top-10 left-[180px] text-[#C85F2B]"
        width="42"
        height="42"
        viewBox="0 0 42 42"
        fill="none"
        aria-hidden
      >
        <path
          d="M5 6 C 18 8, 28 18, 30 32"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M26 28 L30 32 L34 26"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      <div
        className="preview-card fade-up"
        key={craftId || "default"}
        data-testid="live-preview-card"
      >
        <div
          className="preview-hero"
          style={{ backgroundImage: `url(${hero})` }}
        >
          <div
            className="preview-badge"
            data-testid="live-preview-badge"
          >
            {displayName}
          </div>
          <div className="preview-avatar">
            <User size={38} strokeWidth={1.4} />
            <span className="edit-dot" aria-hidden>
              <Pencil size={13} />
            </span>
          </div>
        </div>

        <div className="pt-14 px-7 pb-7">
          <div
            className="font-serif-display text-3xl font-semibold text-[#1C1917]"
            data-testid="live-preview-name"
          >
            Your Name
          </div>
          <div
            className="text-[#C85F2B] font-semibold text-[15px] mt-0.5"
            data-testid="live-preview-craft"
          >
            {displayName}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-[#7A6E62]">
            <MapPin size={14} strokeWidth={1.8} />
            <span>Your City</span>
          </div>

          <div className="mt-6 h-px bg-[#EFE3D2]" />

          <div className="mt-5">
            <div className="font-semibold text-[#1C1917] mb-3">About</div>
            <div className="text-sm text-[#7A6E62] mb-3">
              Your professional story will appear here.
            </div>
            <div className="skeleton-line w-11/12" />
          </div>

          <div className="mt-6">
            <div className="font-semibold text-[#1C1917] mb-3">Specialties</div>
            <div className="grid grid-cols-3 gap-2">
              {specialties.slice(0, 3).map((s, i) => (
                <div
                  key={s + i}
                  className="skeleton-chip flex items-center justify-center text-[11px] font-medium text-[#A89A8C]"
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="font-semibold text-[#1C1917] mb-3">Projects</div>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton-tile">
                  <ImageIcon size={20} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className="mt-6 bg-white border border-[#EFE3D2] rounded-2xl p-5 flex items-start gap-4"
        data-testid="why-craft-card"
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "#FDF0D8" }}
        >
          <Lightbulb size={22} color="#D4A64A" strokeWidth={1.6} />
        </div>
        <div>
          <div className="font-semibold text-[#1C1917]">Why choose your craft first?</div>
          <div className="text-sm text-[#7A6E62] mt-1 leading-relaxed">
            We'll customize your experience, suggest relevant specialties, and
            help clients find you easily.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CraftSelection() {
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const profileStrength = useMemo(() => (selected ? 25 : 15), [selected]);

  const handleContinue = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await axios.post(`${API}/portfolio`, { craft: selected });
      const portfolio = res.data;
      // Persist portfolio id for subsequent steps
      try {
        localStorage.setItem("hm_portfolio_id", portfolio.id);
        localStorage.setItem("hm_craft", portfolio.craft);
      } catch (e) {
        /* ignore storage errors */
      }
      // Next pages will be wired later; for now show a subtle confirmation.
      window.dispatchEvent(
        new CustomEvent("hm:portfolio-created", { detail: portfolio })
      );
      // Simulate navigation stub
      console.log("Portfolio created:", portfolio);
    } catch (e) {
      console.error(e);
      setError("Could not save your selection. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="hm-grid-bg min-h-screen relative overflow-hidden">
      <div className="hm-blueprint" aria-hidden />

      {/* Header */}
      <header
        className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6 md:py-8"
        data-testid="hm-header"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "#FBE5D4" }}
          >
            <Home size={20} color="#C85F2B" strokeWidth={2} />
          </div>
          <div className="leading-tight">
            <div className="font-serif-display text-2xl font-semibold text-[#1C1917]">
              HomeMaker
            </div>
            <div className="text-[11px] font-medium text-[#C85F2B] tracking-wide">
              Your Portfolio. Your Identity.
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <StepRail currentStep={1} />
        </div>

        <ProfileStrength value={profileStrength} />
      </header>

      {/* Mobile step rail */}
      <div className="md:hidden px-6 mb-4 flex justify-center">
        <StepRail currentStep={1} />
      </div>

      {/* Divider */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 px-6 md:px-12 pb-28">
        {/* LEFT */}
        <section className="lg:pr-12 lg:border-r lg:border-[#EFE3D2]">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase px-3 py-1.5 rounded-full"
            style={{ background: "#FBE5D4", color: "#B04F20" }}
            data-testid="step-indicator"
          >
            Step 1 of 4
          </div>

          <h1 className="mt-6 font-serif-display text-5xl md:text-6xl leading-[1.05] text-[#1C1917] font-medium">
            What's your{" "}
            <span
              className="italic font-semibold"
              style={{ color: "#C85F2B" }}
            >
              craft
            </span>
            ?
          </h1>

          <p className="mt-4 text-[15px] text-[#6A5E53] max-w-md leading-relaxed">
            Choose what you do best. We'll tailor your portfolio experience
            just for you.
          </p>

          {/* Design Professionals */}
          <div className="mt-10">
            <div className="craft-type-label">
              <Sparkles size={14} color="#C85F2B" />
              <span>Design Professionals</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
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
          <div className="mt-8">
            <div className="craft-type-label">
              <Building2 size={14} color="#B04F20" />
              <span>Build Professionals</span>
            </div>
            <div className="mt-4">
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
          <div className="mt-8">
            <div className="craft-type-label">
              <Wrench size={14} color="#B04F20" />
              <span>Skilled Trades</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
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
              className="mt-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
              data-testid="craft-error"
            >
              {error}
            </div>
          )}
        </section>

        {/* RIGHT */}
        <section className="lg:pl-12 lg:pt-12">
          <LivePreview craftId={selected} />
        </section>
      </div>

      {/* Sticky footer */}
      <footer
        className="fixed bottom-0 inset-x-0 z-20 backdrop-blur-md"
        style={{ background: "rgba(251, 242, 232, 0.86)" }}
        data-testid="hm-footer"
      >
        <div className="border-t border-[#EFE3D2]">
          <div className="px-6 md:px-12 py-4 pr-6 md:pr-[220px] flex flex-col-reverse md:flex-row items-stretch md:items-center gap-3 md:gap-6 justify-between">
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
              className="btn-continue"
              onClick={handleContinue}
              disabled={!selected || submitting}
              data-testid="continue-btn"
            >
              {submitting ? "Saving..." : "Continue"}
              <ArrowRight size={18} className="arrow" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
