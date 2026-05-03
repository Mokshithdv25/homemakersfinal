import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HmHeaderBrandLockup } from "../components/HmBrandLockup";
import ProjectFlowPayment from "../components/ProjectFlowPayment";
import { getBuildFlow, setBuildFlow } from "../lib/projectFlowStorage";
import { requestV0Images, requestEstimatePlan, formatAiApiError } from "../lib/aiApi";
import {
  ColourHexSwatch,
  ColourOctagonCustom,
  normalizeHexColor,
  PALETTE_PRESET_HEX,
} from "../components/HmColourPickers";
import { HM_HEADER_BAR_CLASS, HM_TAGLINE_NEW_HOME } from "../lib/hmBrand";

const STEPS = [
  { n: 1, title: "Plot & Context", sub: "Location, plot details & legal rules", icon: "📍" },
  { n: 2, title: "Functional Requirements", sub: "Your needs, rooms & lifestyle", icon: "🛋️" },
  { n: 3, title: "Spatial Configuration", sub: "Floors, staircases, vastu & more", icon: "📐" },
  { n: 4, title: "Aesthetic & Materials", sub: "Style, look & feel preferences", icon: "🎨" },
  { n: 5, title: "Budget & Timeline", sub: "Your budget and project timeline", icon: "₹" },
  { n: 6, title: "Review your brief", sub: "Confirm every input before you pay", icon: "📋" },
  { n: 7, title: "AI v0", sub: "Pay, generate, then pro drawings", icon: "✨" },
  { n: 8, title: "Architect & project", sub: "Full brief, then project hub", icon: "🤝" },
];

const RULES = [
  { label: "Front Setback", value: "10 ft" },
  { label: "Side Setback", value: "5 ft (each side)" },
  { label: "Rear Setback", value: "5 ft" },
  { label: "Height Limit", value: "40 ft (G+3)" },
  { label: "Coverage Limit", value: "60%" },
  { label: "FAR / FSI", value: "1.75" },
];

const FLOOR_ORDER = ["G", "G+1", "G+2", "G+3"];
const FLOOR_SUBLABEL = {
  G: "Ground only",
  "G+1": "1 floor above ground",
  "G+2": "2 floors above ground",
  "G+3": "3 floors above ground",
};

/** One label per idea — no separate "Rental" + "Rental Income", etc. */
const LIFESTYLE_OPTIONS = [
  "Work from Home",
  "Hosting Guests",
  "Joint Family",
  "Rental Income",
  "Elderly Friendly",
  "Future Expansion",
  "Minimalist",
  "Nature & Greenery",
  "Luxury",
];
function Dropdown({ value, onChange, options, style }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        border: "1px solid #D6D3D1",
        borderRadius: 6,
        padding: "7px 10px",
        fontSize: 13,
        background: "#fff",
        color: "#1C1917",
        cursor: "pointer",
        width: "100%",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

/** Single construction budget: unit (lakhs vs crores) + amount 0–99 on slider */
function budgetAmountClamped(form) {
  return Math.min(99, Math.max(0, parseInt(String(form.budgetAmount ?? "0"), 10) || 0));
}

function budgetSingleLabel(form) {
  const n = budgetAmountClamped(form);
  if (n === 0) return "₹0";
  return form.budgetUnit === "Crores" ? `₹${n} Cr` : `₹${n} L`;
}

function positiveFeet(val) {
  const x = parseFloat(String(val ?? "").replace(/,/g, ""));
  return Number.isFinite(x) && x > 0;
}

/** Sum of major space counts; parking excluded. “Garden / Lawn: Yes” counts as one space. */
function majorSpacesTotal(form) {
  const keys = [
    "masterBedrooms",
    "otherBedrooms",
    "living",
    "dining",
    "kitchenCount",
    "commonBathrooms",
    "attachedBathrooms",
    "utility",
    "storageRooms",
    "gym",
    "maidRoom",
    "homeTheater",
    "miniBar",
    "poojaRoom",
    "balconyCount",
  ];
  let t = 0;
  for (const k of keys) {
    t += parseCount(form[k], 0, STEPPER_UNBOUNDED);
  }
  if (form.gardenLawn === "Yes") t += 1;
  return t;
}

/** Returns an error message or null if this step passes validation. */
function validateBuildStep(step, form) {
  if (step === 1) {
    if (!String(form.location ?? "").trim()) return "Please enter your project location.";
    if (!positiveFeet(form.dimW) || !positiveFeet(form.dimL)) return "Please enter lot dimensions (width × length in feet).";
    return null;
  }
  if (step === 2) {
    if (parseCount(form.familyMembers, 0, STEPPER_UNBOUNDED) < 1) return "Please set family size to at least 1.";
    if (!form.lifestyle || form.lifestyle.length < 1) return "Please select at least one lifestyle priority.";
    if (majorSpacesTotal(form) < 1) {
      return "Please add at least one major room or space (counts can’t all be zero).";
    }
    return null;
  }
  if (step === 3) {
    if (!form.floors || !FLOOR_ORDER.includes(form.floors)) return "Please choose how many floors you want.";
    if (!form.staircase) return "Please choose a staircase option.";
    if (!form.overheadTank) return "Please choose an overhead water tank option.";
    return null;
  }
  if (step === 4) {
    if (!form.archPrimary) return "Please choose an architectural style.";
    if (form.archPrimary === "Traditional" && !String(form.archTraditionalVariant ?? "").trim()) {
      return "Please choose a regional traditional style.";
    }
    if (!form.finishTier) return "Please choose a material and finish level.";
    if (!form.exteriorPrefs || form.exteriorPrefs.length < 1) return "Please pick at least one exterior preference.";
    if (!normalizeHexColor(form.colourBase) || !normalizeHexColor(form.colourSecondary)) {
      return "Please choose both exterior colours (base and trim).";
    }
    return null;
  }
  if (step === 5) {
    if (budgetAmountClamped(form) < 1) return "Please set a construction budget above zero.";
    if (!String(form.hearAboutUs ?? "").trim()) return "Please tell us how you found HomeMakers.";
    return null;
  }
  return null;
}

function firstInvalidBuildStep(form) {
  for (let s = 1; s <= 5; s += 1) {
    const err = validateBuildStep(s, form);
    if (err) return { step: s, error: err };
  }
  return null;
}

const STEPPER_UNBOUNDED = 99999;

function parseCount(val, min, max) {
  const s = String(val).trim();
  const x = parseInt(s, 10);
  if (Number.isNaN(x)) return min;
  if (!Number.isFinite(max) || max >= STEPPER_UNBOUNDED) return Math.max(min, x);
  return Math.max(min, Math.min(max, x));
}

function Stepper({ value, onChange, min = 0, max = 10 }) {
  const unbounded = !Number.isFinite(max) || max >= STEPPER_UNBOUNDED;
  const cap = unbounded ? STEPPER_UNBOUNDED : max;
  const n = parseCount(value, min, cap);
  const bump = (delta) => {
    const next = unbounded ? Math.max(min, n + delta) : Math.max(min, Math.min(cap, n + delta));
    onChange(String(next));
  };
  const circleBtn = (disabled, delta, aria) => (
    <button
      type="button"
      aria-label={aria}
      onClick={() => bump(delta)}
      disabled={disabled}
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: "none",
        background: disabled ? "#F5F5F4" : "#EFEAE4",
        cursor: disabled ? "default" : "pointer",
        color: disabled ? "#D6D3D1" : "#57534E",
        fontSize: 17,
        fontWeight: 500,
        lineHeight: 1,
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {delta < 0 ? "−" : "+"}
    </button>
  );
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      {circleBtn(n <= min, -1, "Decrease")}
      <span
        style={{
          minWidth: n >= 100 ? 40 : n >= 10 ? 30 : 24,
          textAlign: "center",
          fontWeight: 700,
          fontSize: 16,
          color: "#1C1917",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {n}
      </span>
      {circleBtn(!unbounded && n >= max, 1, "Increase")}
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center" }}>
      {options.map((opt) => {
        const on = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              background: on ? "#C85F2B" : "#EFEAE4",
              color: on ? "#fff" : "#57534E",
              whiteSpace: "nowrap",
              lineHeight: 1.25,
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/** Step 4 — primary style row; Traditional expands to regional variants */
const ARCH_PRIMARY_OPTIONS = [
  { label: "Modern & Contemporary", tagline: "Glass, open plans, neutral palette", img: `${process.env.PUBLIC_URL || ""}/arch_modern.png` },
  { label: "Indo-Modern (Fusion)", tagline: "Courtyards, jaali, Vastu-aware layout", img: `${process.env.PUBLIC_URL || ""}/arch_fusion.png` },
  { label: "Traditional", tagline: "Kerala, Chettinad, Rajasthani…", img: `${process.env.PUBLIC_URL || ""}/arch_traditional.png` },
  { label: "Colonial Revival", tagline: "Verandas, symmetry, tall windows", img: `${process.env.PUBLIC_URL || ""}/arch_colonial.png` },
];

const ARCH_TRADITIONAL_VARIANTS = [
  { label: "Kerala Vernacular", tagline: "Sloping roofs, wood, monsoon-ready", img: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=240&q=72" },
  { label: "Chettinad Heritage", tagline: "Courtyards, pillars, ornate detail", img: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=240&q=72" },
  { label: "Rajasthani (Haveli-inspired)", tagline: "Jaalis, cool courtyards, craft", img: "https://images.unsplash.com/photo-1524492412937-b28074a18679?w=240&q=72" },
];

const ARCH_STYLE_SIDEBAR_BLURB = {
  "Modern & Contemporary": "Clean lines and generous glazing are the default in metros—stone or wood accents keep it from feeling cold.",
  "Indo-Modern (Fusion)": "Open plans with courtyards, jaali screens or Vastu-aware zoning are one of the fastest-growing residential directions.",
  "Kerala Vernacular": "Sloping tiled roofs and timber-heavy details nod to monsoon-smart tradition while pairing well with modern interiors.",
  "Chettinad Heritage": "Layered courtyards and carved pillars signal heritage—often simplified today while keeping the grand spatial rhythm.",
  "Rajasthani (Haveli-inspired)": "Jaalis and inward courtyards borrow desert-climate logic; even a few motifs read unmistakably regional.",
  "Colonial Revival": "Symmetry, verandas and tall windows suit bungalows and farmhouses where classic presence matters as much as shade.",
};

function resolvedArchStyle(form) {
  return form.archPrimary === "Traditional" ? form.archTraditionalVariant : form.archPrimary;
}

function archCardByLabel(label) {
  return [...ARCH_TRADITIONAL_VARIANTS, ...ARCH_PRIMARY_OPTIONS].find((o) => o.label === label) || ARCH_PRIMARY_OPTIONS[0];
}

/** Outside shell — plain names, no jargon (multi-select) */
const EXTERIOR_OPTION_TILES = [
  { label: "Wall paint", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&q=60" },
  { label: "Stone cladding", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=150&q=60" },
  { label: "Exposed brickwork", img: "https://images.unsplash.com/photo-1504307651254-39680f361fdc?w=150&q=60" },
  { label: "Wooden panels", img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=150&q=60" },
  { label: "Jali & lattice patterns", img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=150&q=60" },
  { label: "Tile / terracotta", img: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=150&q=60" },
  { label: "Flat / terrace roof", img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=150&q=60" },
  { label: "Sloping roof", img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=150&q=60" },
];

export default function BuildNewHome() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [preV0Paid, setPreV0Paid] = useState(false);
  const [postV0Paid, setPostV0Paid] = useState(false);
  const [v0Generated, setV0Generated] = useState(false);
  const [v0Generating, setV0Generating] = useState(false);
  const [v0ImageBundle, setV0ImageBundle] = useState(null);
  const [v0PlanBundle, setV0PlanBundle] = useState(null);
  const [architectHandoffNote, setArchitectHandoffNote] = useState("");
  const [form, setForm] = useState({
    location: "Bengaluru, Karnataka",
    dimW: "40", dimL: "60",
    facing: "North", roadAccess: "1 Side",
    locationType: "Urban",
    // Step 2 — major spaces (Indian home taxonomy; each space once, no overlap)
    familyMembers: "4",
    lifestyle: ["Work from Home", "Hosting Guests", "Elderly Friendly"],
    masterBedrooms: "1",
    otherBedrooms: "3",
    commonBathrooms: "0",
    attachedBathrooms: "4",
    living: "2",
    dining: "1",
    kitchenCount: "1",
    kitchen: "Open",
    utility: "1",
    storageRooms: "1",
    gym: "0",
    maidRoom: "1",
    homeTheater: "0",
    miniBar: "0",
    poojaRoom: "1",
    gardenLawn: "Yes",
    balconyCount: "2",
    twoWheeler: "2", fourWheeler: "2", visitorParking: "Yes",
    // Step 3
    floors: "G+1", builtupPct: "70",
    staircase: "Internal", lift: "No Lift",
    vastu: "Strict",
    overheadTank: "Yes",
    // Step 4
    archPrimary: "Modern & Contemporary",
    archTraditionalVariant: "Kerala Vernacular",
    finishTier: "Mid Range",
    exteriorPrefs: ["Wall paint", "Stone cladding", "Sloping roof"],
    colourBase: "#F5EFE8",
    colourSecondary: "#C8956A",
    // Step 5 — one figure: lakhs OR crores, slider 0–99
    budgetUnit: "Lakhs",
    budgetAmount: "80",
    startTimeline: "Within 3 Months",
    completionTime: "6 - 9 Months",
    paymentMode: "Own Savings",
    budgetNotes: "",
    hearAboutUs: "",
  });

  const [stepBlockError, setStepBlockError] = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleLifestyle = (s) => set("lifestyle", form.lifestyle.includes(s) ? form.lifestyle.filter(x => x !== s) : [...form.lifestyle, s]);
  const toggleExterior = (s) => set("exteriorPrefs", form.exteriorPrefs.includes(s) ? form.exteriorPrefs.filter(x => x !== s) : [...form.exteriorPrefs, s]);
  const archResolved = resolvedArchStyle(form);

  useEffect(() => {
    const f = getBuildFlow();
    setPreV0Paid(!!f.preV0);
    setPostV0Paid(!!f.postV0);
    setV0Generated(!!f.v0);
    if (f.v0Images) setV0ImageBundle(f.v0Images);
    if (f.v0Plan) setV0PlanBundle(f.v0Plan);
    if (f.architectComment) setArchitectHandoffNote(String(f.architectComment));
  }, []);

  const runV0Generation = async () => {
    if (!preV0Paid) return;
    setV0Generating(true);
    setStepBlockError("");
    try {
      const brief = {
        ...form,
        resolvedArchStyle: archResolved,
        flowWizard: "build_new_home",
      };
      const imagesPayload = await requestV0Images("new_home", brief);
      const planPayload = await requestEstimatePlan("new_home", brief, imagesPayload);
      setV0ImageBundle(imagesPayload);
      setV0PlanBundle(planPayload);
      setV0Generated(true);
      setBuildFlow({ v0: true, v0Images: imagesPayload, v0Plan: planPayload });
    } catch (e) {
      setStepBlockError(formatAiApiError(e));
    } finally {
      setV0Generating(false);
    }
  };

  const handleContinue = () => {
    if (activeStep === 6) {
      const bad = firstInvalidBuildStep(form);
      if (bad) {
        setActiveStep(bad.step);
        setStepBlockError(bad.error);
        return;
      }
      setStepBlockError("");
      setActiveStep(7);
      return;
    }
    if (activeStep === 7) {
      if (!preV0Paid) {
        setStepBlockError("Complete the v0 access payment to generate AI directions.");
        return;
      }
      if (!v0Generated) {
        setStepBlockError('Use "Generate v0 designs" first — the AI needs your paid brief to run.');
        return;
      }
      if (!postV0Paid) {
        setStepBlockError("Complete the professional drawing package so an architect can take over with real plans.");
        return;
      }
      setStepBlockError("");
      setBuildFlow({ formSnapshot: form, preV0: true, postV0: true, v0: true });
      setActiveStep(8);
      return;
    }
    if (activeStep === 8) {
      setBuildFlow({ architectComment: architectHandoffNote });
      navigate("/project?source=build-new&phase=handoff");
      return;
    }
    if (activeStep < 5) {
      const err = validateBuildStep(activeStep, form);
      if (err) {
        setStepBlockError(err);
        return;
      }
      setStepBlockError("");
      setActiveStep((s) => s + 1);
      return;
    }
    if (activeStep === 5) {
      const err = validateBuildStep(5, form);
      if (err) {
        setStepBlockError(err);
        return;
      }
      setStepBlockError("");
      setActiveStep(6);
    }
  };

  const btnRow = (key, options) => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => set(key, o)}
          style={{
            padding: "7px 14px",
            borderRadius: 999,
            fontSize: 12,
            cursor: "pointer",
            border: "none",
            background: form[key] === o ? "#C85F2B" : "#EFEAE4",
            color: form[key] === o ? "#fff" : "#57534E",
            fontWeight: form[key] === o ? 600 : 500,
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );

  const RoomCard = ({
    label,
    icon,
    stateKey,
    note,
    min = 0,
    max = STEPPER_UNBOUNDED,
    mode = "stepper",
    segmentOptions,
  }) => (
    <div style={{ padding: "16px 8px 6px", background: "transparent", textAlign: "center" }}>
      <div style={{ fontSize: 20, lineHeight: 1, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#292524", marginBottom: 10, lineHeight: 1.3 }}>{label}</div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        {mode === "segments" && segmentOptions ? (
          <Segmented value={form[stateKey]} onChange={(v) => set(stateKey, v)} options={segmentOptions} />
        ) : (
          <Stepper value={form[stateKey]} onChange={(v) => set(stateKey, v)} min={min} max={max} />
        )}
      </div>
      {note && (
        <div style={{ fontSize: 10, color: "#A8A29E", marginTop: 8, lineHeight: 1.45 }}>{note}</div>
      )}
    </div>
  );

  // SVG floor building illustrations
  const FloorSVG = ({ type }) => {
    const base = { width: 56, height: 52 };
    if (type === "G") return (
      <svg {...base} viewBox="0 0 56 52" fill="none">
        <rect x="8" y="28" width="40" height="20" rx="1" fill="#E8D5C0" stroke="#B8956A" strokeWidth="1.2"/>
        <path d="M4 29 L28 10 L52 29" fill="#C8956A" stroke="#A07040" strokeWidth="1.2"/>
        <rect x="22" y="36" width="12" height="12" rx="1" fill="#A07040" opacity="0.7"/>
        <rect x="10" y="33" width="9" height="7" rx="1" fill="#fff" opacity="0.6"/>
        <rect x="37" y="33" width="9" height="7" rx="1" fill="#fff" opacity="0.6"/>
      </svg>
    );
    if (type === "G+1") return (
      <svg {...base} viewBox="0 0 56 52" fill="none">
        <rect x="8" y="30" width="40" height="18" rx="1" fill="#E8D5C0" stroke="#B8956A" strokeWidth="1.2"/>
        <rect x="12" y="16" width="32" height="14" rx="1" fill="#D4C0A8" stroke="#B8956A" strokeWidth="1.2"/>
        <path d="M10 17 L28 6 L46 17" fill="#C8956A" stroke="#A07040" strokeWidth="1.2"/>
        <rect x="22" y="36" width="12" height="12" rx="1" fill="#A07040" opacity="0.7"/>
        <rect x="10" y="33" width="8" height="6" rx="1" fill="#fff" opacity="0.5"/>
        <rect x="38" y="33" width="8" height="6" rx="1" fill="#fff" opacity="0.5"/>
        <rect x="14" y="19" width="8" height="6" rx="1" fill="#fff" opacity="0.5"/>
        <rect x="34" y="19" width="8" height="6" rx="1" fill="#fff" opacity="0.5"/>
      </svg>
    );
    if (type === "G+2") return (
      <svg {...base} viewBox="0 0 56 52" fill="none">
        <rect x="8" y="34" width="40" height="16" rx="1" fill="#E8D5C0" stroke="#B8956A" strokeWidth="1.2"/>
        <rect x="12" y="22" width="32" height="12" rx="1" fill="#D4C0A8" stroke="#B8956A" strokeWidth="1.2"/>
        <rect x="14" y="11" width="28" height="11" rx="1" fill="#C8B89E" stroke="#B8956A" strokeWidth="1.2"/>
        <path d="M12 12 L28 4 L44 12" fill="#C8956A" stroke="#A07040" strokeWidth="1.2"/>
        <rect x="22" y="38" width="12" height="12" rx="1" fill="#A07040" opacity="0.7"/>
        <rect x="10" y="37" width="7" height="5" rx="1" fill="#fff" opacity="0.5"/>
        <rect x="39" y="37" width="7" height="5" rx="1" fill="#fff" opacity="0.5"/>
      </svg>
    );
    return (
      <svg {...base} viewBox="0 0 56 52" fill="none">
        <rect x="8" y="36" width="40" height="14" rx="1" fill="#E8D5C0" stroke="#B8956A" strokeWidth="1.2"/>
        <rect x="10" y="26" width="36" height="10" rx="1" fill="#D4C0A8" stroke="#B8956A" strokeWidth="1.2"/>
        <rect x="12" y="17" width="32" height="9" rx="1" fill="#C8B89E" stroke="#B8956A" strokeWidth="1.2"/>
        <rect x="14" y="9" width="28" height="8" rx="1" fill="#BCA88E" stroke="#B8956A" strokeWidth="1.2"/>
        <path d="M12 10 L28 3 L44 10" fill="#C8956A" stroke="#A07040" strokeWidth="1.2"/>
        <rect x="22" y="39" width="12" height="11" rx="1" fill="#A07040" opacity="0.7"/>
      </svg>
    );
  };

  // SVG staircase illustrations
  const StairSVG = ({ type }) => {
    if (type === "Internal") return (
      <svg width="44" height="36" viewBox="0 0 44 36" fill="none">
        <rect x="2" y="2" width="40" height="32" rx="3" fill="#F0EBE3" stroke="#C8B89E" strokeWidth="1.5"/>
        <path d="M8 28 L8 22 L14 22 L14 16 L20 16 L20 10 L26 10 L26 28 Z" fill="#C8956A" opacity="0.7"/>
      </svg>
    );
    if (type === "External") return (
      <svg width="44" height="36" viewBox="0 0 44 36" fill="none">
        <rect x="10" y="2" width="28" height="32" rx="3" fill="#F0EBE3" stroke="#C8B89E" strokeWidth="1.5"/>
        <path d="M2 30 L2 24 L6 24 L6 18 L10 18" stroke="#C8956A" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
    return (
      <svg width="44" height="36" viewBox="0 0 44 36" fill="none">
        <rect x="2" y="2" width="40" height="32" rx="3" fill="#F0EBE3" stroke="#C8B89E" strokeWidth="1.5"/>
        <path d="M16 28 L16 22 L20 22 L20 16 L24 16 L24 22 L28 22 L28 28" fill="#C8956A" opacity="0.7"/>
      </svg>
    );
  };

  return (
    <div className="relative min-h-screen bg-[#FBF7F2] overflow-x-hidden" style={{ fontFamily: "'DM Sans',Inter,system-ui,sans-serif", color: "#1C1917" }}>
      {/* Background accents matching the homepage */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(193,132,78,0.08),transparent_50%)]" aria-hidden />

      <header className={HM_HEADER_BAR_CLASS}>
        <HmHeaderBrandLockup tagline={HM_TAGLINE_NEW_HOME} />
        <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-auto">
          <nav className="hidden lg:flex items-center gap-5 mr-1">
            {["Software", "Find Pros", "My Project", "Shop"].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => { if (l === "My Project") navigate("/project"); }}
                className="bg-transparent border-none text-sm text-[#44403C] cursor-pointer font-medium inline-flex items-center gap-1"
              >
                {l}
                {l === "Software" && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                )}
              </button>
            ))}
          </nav>
          <button type="button" className="hidden sm:inline-flex items-center gap-1.5 bg-transparent border border-[#E7E5E4] rounded-md px-2.5 py-1.5 text-xs text-[#57534E] cursor-pointer">
            🇮🇳 IN
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <button type="button" className="bg-transparent border-none text-sm text-[#44403C] cursor-pointer font-medium inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            Sign In
          </button>
          <button
            type="button"
            onClick={() => navigate("/craft")}
            className="bg-white border border-[#E7D4C4] rounded-lg px-3 py-1.5 text-xs font-semibold text-[#1C1917] cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            Join as a Pro
          </button>
        </div>
      </header>

      <div style={{ display: "flex", minHeight: "calc(100vh - 76px)", position: "relative", zIndex: 10 }}>

        {/* LEFT — step navigation */}
        <aside
          style={{
            width: 228,
            flexShrink: 0,
            background: "#fff",
            borderRight: "1px solid #EFE3D2",
            padding: "24px 0",
          }}
        >
          {STEPS.map((s) => (
            <button
              key={s.n}
              type="button"
              onClick={() => {
                setStepBlockError("");
                setActiveStep(s.n);
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "12px 18px",
                background: activeStep === s.n ? "#FBF6F0" : "none",
                border: "none",
                borderLeft: activeStep === s.n ? "3px solid #C85F2B" : "3px solid transparent",
                cursor: "pointer",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: activeStep === s.n ? "#C85F2B" : s.n < activeStep ? "#22A36B" : "#EDE8E3",
                  color: activeStep === s.n || s.n < activeStep ? "#fff" : "#7A6E62",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  marginTop: 1,
                }}
              >
                {s.n < activeStep ? "✓" : s.n}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: activeStep === s.n ? "#C85F2B" : "#1C1917",
                    lineHeight: 1.3,
                  }}
                >
                  {s.title}
                </div>
                <div style={{ fontSize: 11, color: "#7A6E62", marginTop: 2, lineHeight: 1.4 }}>{s.sub}</div>
              </div>
            </button>
          ))}
        </aside>

        <main
          style={{
            flex: 1,
            background: "#fff",
            padding: "28px 36px 48px",
            overflowY: "auto",
            maxWidth: 860,
            borderRight: "1px solid #EFE3D2",
            minWidth: 0,
          }}
        >

          {/* Back */}
          <button onClick={() => {
            setStepBlockError("");
            if (activeStep === 1) navigate("/build");
            else setActiveStep((s) => s - 1);
          }}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6A5E53", marginBottom: 20, padding: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg> Back
          </button>

          {/* ─── STEP 1 ─── */}
          {activeStep === 1 && (<>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 28, marginBottom: 24, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                <h1 className="font-serif-display text-4xl md:text-[2.65rem] font-medium text-[#1C1917] tracking-tight leading-[1.08] m-0 mb-3">Build a New Home</h1>
                <p style={{ fontSize: 14, color: "#6A5E53", margin: 0, lineHeight: 1.65, maxWidth: 520 }}>
                  Let&apos;s start with your plot and project basics. This helps our AI generate accurate designs, estimates, and plans that work in India.
                </p>
              </div>
              <div style={{ width: 220, height: 148, borderRadius: 14, overflow: "hidden", border: "1px solid #E2D9CF", flexShrink: 0, boxShadow: "0 12px 32px -12px rgba(28,25,23,0.18)" }}>
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=640&q=75"
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            </div>
            <div className="craft-type-label mt-1 mb-4">
              <span style={{ color: "#C85F2B" }}>●</span>
              <span>Plot &amp; context</span>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#44403C" }}>
                Project location <span style={{ fontWeight: 500, color: "#A8A29E" }}>(required)</span>
              </label>
              <div style={{ position: "relative" }}>
                <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="City, State" style={{ width: "100%", border: "1px solid #D6D3D1", borderRadius: 8, padding: "9px 36px 9px 34px", fontSize: 14, boxSizing: "border-box", background: "#fff", outline: "none" }} />
                <button type="button" onClick={() => set("location", "")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#A8A29E", fontSize: 16, lineHeight: 1 }} aria-label="Clear">×</button>
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#44403C" }}>
                Lot dimensions <span style={{ fontWeight: 500, color: "#A8A29E" }}>(required)</span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <input value={form.dimW} onChange={e => set("dimW", e.target.value)} inputMode="decimal" style={{ width: 76, border: "1px solid #D6D3D1", borderRadius: 8, padding: "9px 11px", fontSize: 14, background: "#fff", outline: "none" }} />
                <span style={{ color: "#A8A29E", fontWeight: 600, fontSize: 13 }}>×</span>
                <input value={form.dimL} onChange={e => set("dimL", e.target.value)} inputMode="decimal" style={{ width: 76, border: "1px solid #D6D3D1", borderRadius: 8, padding: "9px 11px", fontSize: 14, background: "#fff", outline: "none" }} />
                <span style={{ fontSize: 13, color: "#57534E", fontWeight: 600 }}>ft</span>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8, color: "#44403C" }}>
                Plot facing <span style={{ fontWeight: 500, color: "#A8A29E" }}>(optional)</span>
              </label>
              {btnRow("facing", ["North","South","East","West"])}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8, color: "#44403C" }}>
                Road access <span style={{ fontWeight: 500, color: "#A8A29E" }}>(optional)</span>
              </label>
              {btnRow("roadAccess", ["1 Side","2 Side","3 Side","4 Side"])}
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8, color: "#44403C" }}>
                Location type <span style={{ fontWeight: 500, color: "#A8A29E" }}>(optional)</span>
              </label>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {["Urban","Semi-Urban","Rural"].map(t => (
                  <label key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input type="radio" name="locType" checked={form.locationType === t} onChange={() => set("locationType", t)} style={{ accentColor: "#C85F2B", width: 15, height: 15 }} /> {t}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 22, paddingBottom: 18, borderBottom: "1px solid #EDE8E0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15 }}>🛡️</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#1C4A24" }}>Applicable building rules</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#2E6B38" }}>Indicative for your location</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {RULES.map((r, i) => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, padding: "8px 0", borderTop: i === 0 ? "none" : "1px solid #F0EBE3" }}>
                    <span style={{ fontSize: 12, color: "#78716C" }}>{r.label}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#1C1917", textAlign: "right" }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 10, lineHeight: 1.45 }}>Verify with your local authority before sanction — numbers are typical defaults only.</div>
            </div>
          </>)}

          {/* ─── STEP 2 ─── */}
          {activeStep === 2 && (<>
            <h1 className="font-serif-display text-3xl md:text-[2.25rem] font-medium text-[#1C1917] tracking-tight leading-tight m-0 mb-3">
              Functional Requirements
            </h1>
            <p style={{ fontSize: 14, color: "#57534E", margin: "0 0 28px", lineHeight: 1.6, maxWidth: 640 }}>
              Tell us how you live and what you need. This helps our AI shape layouts, light and flow—before we move to structure and style.
            </p>

            {/* Family & Lifestyle — open layout (no enclosing card) */}
            <div style={{ marginBottom: 8, paddingBottom: 28, borderBottom: "1px solid #EDE8E0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>👨‍👩‍👧‍👦</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1C1917", letterSpacing: "-0.02em" }}>Family &amp; Lifestyle</span>
              </div>
              <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div style={{ width: 168, flexShrink: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6, color: "#78716C", letterSpacing: "0.06em" }}>
                    FAMILY MEMBERS <span style={{ fontWeight: 500, color: "#A8A29E" }}>(min 1)</span>
                  </label>
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <Stepper value={form.familyMembers} onChange={(v) => set("familyMembers", v)} min={0} max={STEPPER_UNBOUNDED} />
                  </div>
                  <div style={{ fontSize: 10, color: "#A8A29E", marginTop: 8, lineHeight: 1.4 }}>Including kids &amp; elders</div>
                </div>
                <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6, color: "#78716C", letterSpacing: "0.06em" }}>
                    LIFESTYLE PRIORITIES <span style={{ fontWeight: 500, color: "#A8A29E" }}>(required · select all that apply)</span>
                  </label>
                  <div style={{ fontSize: 11, color: "#A8A29E", marginBottom: 12, lineHeight: 1.5 }}>
                    Family headcount is on the left (kids &amp; elders included there). These tags only describe lifestyle and design direction—each appears once.
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {LIFESTYLE_OPTIONS.map((o) => {
                      const sel = form.lifestyle.includes(o);
                      return (
                        <button
                          key={o}
                          type="button"
                          onClick={() => toggleLifestyle(o)}
                          style={{
                            padding: "7px 14px",
                            borderRadius: 999,
                            fontSize: 12,
                            cursor: "pointer",
                            border: "none",
                            background: sel ? "#C85F2B" : "#EFEAE4",
                            color: sel ? "#fff" : "#57534E",
                            fontWeight: sel ? 600 : 500,
                          }}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Major rooms — one aligned grid (typical Indian home spaces; no duplicate outdoor rows) */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, marginTop: 8 }}>
              <span style={{ fontSize: 17, lineHeight: 1 }}>🏠</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1C1917", letterSpacing: "-0.02em" }}>Major rooms &amp; spaces</span>
            </div>
            <div style={{ fontSize: 11, color: "#A8A29E", marginBottom: 14, lineHeight: 1.45, maxWidth: 720 }}>
              Count each space once: master vs other bedrooms, common vs attached baths, utility vs storage. At least one major space must be non-zero (parking below can stay at zero).
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "8px 4px", marginBottom: 4, borderBottom: "1px solid #F5F0EA", paddingBottom: 8 }}>
              <RoomCard label="Master bedroom(s)" icon="🛏️" stateKey="masterBedrooms" note="Primary suite count" min={0} />
              <RoomCard label="Other bedroom(s)" icon="🛏️" stateKey="otherBedrooms" note="Kids, guests, elders" min={0} />
              <RoomCard label="Living / Hall" icon="🛋️" stateKey="living" note="Family + formal / TV" min={0} />
              <RoomCard label="Dining" icon="🍽️" stateKey="dining" note="Separate or combined" min={0} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "8px 4px", marginBottom: 4, borderBottom: "1px solid #F5F0EA", paddingBottom: 8 }}>
              <div style={{ padding: "16px 8px 6px", background: "transparent", textAlign: "center" }}>
                <div style={{ fontSize: 20, lineHeight: 1, marginBottom: 10 }}>🍳</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#292524", marginBottom: 10, lineHeight: 1.3 }}>Kitchen(s)</div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                  <Stepper value={form.kitchenCount} onChange={(v) => set("kitchenCount", v)} min={0} max={STEPPER_UNBOUNDED} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#78716C", marginBottom: 6, letterSpacing: "0.04em" }}>TYPICAL LAYOUT</div>
                <Segmented value={form.kitchen} onChange={(v) => set("kitchen", v)} options={["Open", "Semi-open", "Closed"]} />
                <div style={{ fontSize: 10, color: "#A8A29E", marginTop: 8, lineHeight: 1.45 }}>Count = zones / floors; style describes how you usually want kitchens to read.</div>
              </div>
              <RoomCard label="Bathroom (common)" icon="🚽" stateKey="commonBathrooms" note="Powder / shared WC" min={0} />
              <RoomCard label="Attached bathroom(s)" icon="🚿" stateKey="attachedBathrooms" note="With bedrooms" min={0} />
              <RoomCard label="Utility" icon="🧺" stateKey="utility" note="Wash, pantry, service" min={0} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "8px 4px", marginBottom: 4, borderBottom: "1px solid #F5F0EA", paddingBottom: 8 }}>
              <RoomCard label="Maid room" icon="🚪" stateKey="maidRoom" note="Staff / driver room" min={0} />
              <RoomCard label="Storage" icon="📦" stateKey="storageRooms" note="Store / loft / stilt" min={0} />
              <RoomCard label="Gym" icon="🏋️" stateKey="gym" note="Home gym / yoga" min={0} />
              <RoomCard label="Home theater" icon="🎬" stateKey="homeTheater" note="AV / media room" min={0} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "8px 4px", marginBottom: 20 }}>
              <RoomCard label="Mini bar" icon="🥂" stateKey="miniBar" note="Bar counter / niche" min={0} />
              <RoomCard label="Pooja / Prayer" icon="🪔" stateKey="poojaRoom" note="Dedicated rooms or niches" min={0} />
              <RoomCard
                label="Garden / Lawn"
                icon="🌿"
                stateKey="gardenLawn"
                note="Ground outdoor green"
                mode="segments"
                segmentOptions={["Yes", "No", "Optional"]}
              />
              <RoomCard label="Balcony count" icon="🏙️" stateKey="balconyCount" note="Per floor or façade — total projecting decks" min={0} />
            </div>

            {/* Parking */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 17, lineHeight: 1 }}>🚗</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1C1917", letterSpacing: "-0.02em" }}>Parking</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 32px", alignItems: "flex-end", marginBottom: 24, paddingBottom: 8, borderBottom: "1px solid #EDE8E0" }}>
              {[
                { label: "2-wheeler bays", key: "twoWheeler", icon: "🛵" },
                { label: "4-wheeler bays", key: "fourWheeler", icon: "🚗" },
                { label: "Visitor parking", key: "visitorParking", icon: "🅿️", opts: ["Yes", "No", "Optional"] },
              ].map((p) => (
                <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 18 }} aria-hidden>{p.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#78716C", letterSpacing: "0.04em", marginBottom: 6 }}>{p.label.toUpperCase()}</div>
                    {p.opts ? (
                      <Segmented value={form[p.key]} onChange={(v) => set(p.key, v)} options={p.opts} />
                    ) : (
                      <Stepper value={form[p.key]} onChange={(v) => set(p.key, v)} min={0} max={STEPPER_UNBOUNDED} />
                    )}
                  </div>
                </div>
              ))}
            </div>

          </>)}

          {/* ─── STEP 3 ─── */}
          {activeStep === 3 && (<>
            <h1 className="font-serif-display text-3xl md:text-[2rem] font-medium text-[#1C1917] tracking-tight leading-tight m-0 mb-3">Spatial Configuration</h1>
            <p style={{ fontSize: 14, color: "#6A5E53", margin: "0 0 28px", lineHeight: 1.6, maxWidth: 520 }}>
              Floors, footprint split, circulation and services—aligned with Indian norms for {form.location.split(",")[0]}.
            </p>

            {/* Floors — stepper + live building icon */}
            <div style={{ marginBottom: 32, paddingBottom: 28, borderBottom: "1px solid #EDE8E0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>🏗️</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#1C1917" }}>Floors</span>
              </div>
              <div style={{ fontSize: 12, color: "#A8A29E", marginBottom: 16 }}>Use + / − to change storeys. The diagram updates with your choice.</div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <div style={{ transform: "scale(1.35)", transformOrigin: "center top" }}>
                  <FloorSVG type={form.floors} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 17, color: "#1C1917" }}>{form.floors}</div>
                  <div style={{ fontSize: 12, color: "#78716C", marginTop: 4 }}>{FLOOR_SUBLABEL[form.floors] || FLOOR_SUBLABEL["G+1"]}</div>
                </div>
                <Stepper
                  value={String(Math.max(0, FLOOR_ORDER.indexOf(form.floors) === -1 ? 1 : FLOOR_ORDER.indexOf(form.floors)))}
                  onChange={(v) => set("floors", FLOOR_ORDER[parseCount(v, 0, 3)])}
                  min={0}
                  max={3}
                />
              </div>
            </div>

            {/* Built-up + open space — one block, icon reflects the split */}
            <div style={{ marginBottom: 32, paddingBottom: 28, borderBottom: "1px solid #EDE8E0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>📐</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#1C1917" }}>Built-up &amp; open space</span>
              </div>
              <div style={{ fontSize: 12, color: "#A8A29E", marginBottom: 18 }}>
                One slider sets both: higher built-up means less open land for parking, garden and setbacks. The icon hints at the balance.
              </div>
              {(() => {
                const bu = parseInt(form.builtupPct, 10) || 70;
                const openPct = 100 - bu;
                const icon = bu >= 72 ? "🏢" : bu <= 38 ? "🌿" : "🏡";
                const hint = bu >= 72 ? "Denser footprint" : bu <= 38 ? "More breathing room outdoors" : "Balanced built vs open";
                return (
                  <div style={{ textAlign: "center", maxWidth: 420, margin: "0 auto" }}>
                    <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 12 }} aria-hidden>{icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#78716C", marginBottom: 10 }}>{hint}</div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 28, marginBottom: 14, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#C85F2B", letterSpacing: "0.04em" }}>BUILT-UP</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "#C85F2B", fontVariantNumeric: "tabular-nums" }}>{bu}%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#78716C", letterSpacing: "0.04em" }}>OPEN</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "#44403C", fontVariantNumeric: "tabular-nums" }}>{openPct}%</div>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={80}
                      value={form.builtupPct}
                      onChange={(e) => set("builtupPct", e.target.value)}
                      style={{ width: "100%", maxWidth: 360, accentColor: "#C85F2B", cursor: "pointer" }}
                    />
                  </div>
                );
              })()}
            </div>

            {/* Staircase — minimal, icon updates per type */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>🪜</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#1C1917" }}>Staircase</span>
              </div>
              <div style={{ fontSize: 12, color: "#A8A29E", marginBottom: 14 }}>Tap an option — the stair diagram matches your pick.</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-end" }}>
                {[{ val: "Internal", sub: "Inside the building" }, { val: "External", sub: "Outside the building" }, { val: "Central", sub: "In the middle" }].map((s) => {
                  const on = form.staircase === s.val;
                  return (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => set("staircase", s.val)}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        padding: "4px 4px 10px",
                        borderBottom: on ? "3px solid #C85F2B" : "3px solid transparent",
                        textAlign: "center",
                        minWidth: 96,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8, opacity: on ? 1 : 0.55 }}>
                        <StairSVG type={s.val} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 12, color: on ? "#C85F2B" : "#57534E" }}>{s.val}</div>
                      <div style={{ fontSize: 10, color: "#A8A29E", marginTop: 3 }}>{s.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lift — same clean pattern */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>🛗</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#1C1917" }}>Lift</span>
              </div>
              <div style={{ fontSize: 12, color: "#A8A29E", marginBottom: 14 }}>Icon reflects lift choice.</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
                {[{ val: "No Lift", sub: "Not required", sym: "🚫" }, { val: "Lift Now", sub: "In this build", sym: "🛗" }, { val: "Provision", sub: "Shaft only", sym: "⏳" }].map((l) => {
                  const on = form.lift === l.val;
                  return (
                    <button
                      key={l.val}
                      type="button"
                      onClick={() => set("lift", l.val)}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        padding: "4px 8px 10px",
                        borderBottom: on ? "3px solid #C85F2B" : "3px solid transparent",
                        textAlign: "center",
                        minWidth: 88,
                      }}
                    >
                      <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 6, opacity: on ? 1 : 0.45 }}>{l.sym}</div>
                      <div style={{ fontWeight: 700, fontSize: 12, color: on ? "#C85F2B" : "#57534E" }}>{l.val}</div>
                      <div style={{ fontSize: 10, color: "#A8A29E", marginTop: 3 }}>{l.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vastu + overhead — pills, no cards / no dropdown */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>✨</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#1C1917" }}>Vastu &amp; services</span>
              </div>
              <div style={{ fontSize: 12, color: "#A8A29E", marginBottom: 14 }}>
                Maid / staff and pooja are in Step 2. Set vastu rigidity and overhead tank here.
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#78716C", letterSpacing: "0.06em", marginBottom: 8 }}>VASTU</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  {[{ val: "Strict", sub: "100%" }, { val: "Flexible", sub: "Balanced" }, { val: "Not Important", sub: "Open" }].map((v) => {
                    const on = form.vastu === v.val;
                    return (
                      <button
                        key={v.val}
                        type="button"
                        onClick={() => set("vastu", v.val)}
                        style={{
                          border: "none",
                          borderRadius: 999,
                          padding: "7px 14px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          background: on ? "#C85F2B" : "#EFEAE4",
                          color: on ? "#fff" : "#57534E",
                        }}
                      >
                        {v.val}
                        <span style={{ fontWeight: 500, opacity: 0.85 }}> · {v.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#78716C", letterSpacing: "0.06em", marginBottom: 8 }}>OVERHEAD TANK</div>
                <Segmented value={form.overheadTank} onChange={(v) => set("overheadTank", v)} options={["Yes", "No", "Optional"]} />
              </div>
            </div>

            <div style={{ fontSize: 13, color: "#78716C", lineHeight: 1.55, paddingTop: 8, borderTop: "1px solid #EDE8E0" }}>
              ℹ️ Configurations are checked against local bye-laws and setbacks for {form.location}.
            </div>
          </>)}

          {/* ─── STEP 4 ─── */}
          {activeStep === 4 && (<>
            <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: "Georgia,serif", marginBottom: 8 }}>Aesthetic &amp; Materials</h1>
            <p style={{ fontSize: 14, color: "#5C5147", marginBottom: 28, lineHeight: 1.6 }}>
              Choose the look, style and materials that define your dream home.<br/>
              This helps our AI create designs that match your taste and budget.
            </p>

            {/* Architectural Style */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>🏡</span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Choose Your Architectural Style</span>
            </div>
            <div style={{ fontSize: 13, color: "#7A6E62", marginBottom: 14 }}>
              Pick a direction—if you choose Traditional, we&apos;ll narrow to Kerala, Chettinad or Rajasthani below.
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: form.archPrimary === "Traditional" ? 14 : 28, overflowX: "auto", paddingBottom: 6, WebkitOverflowScrolling: "touch" }}>
              {ARCH_PRIMARY_OPTIONS.map((s) => {
                const on = form.archPrimary === s.label;
                return (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => set("archPrimary", s.label)}
                    style={{
                      minWidth: 118,
                      maxWidth: 132,
                      flex: "0 0 auto",
                      cursor: "pointer",
                      borderRadius: 12,
                      overflow: "hidden",
                      border: on ? "2px solid #C85F2B" : "1px solid #E8E4DE",
                      boxShadow: on ? "0 2px 10px rgba(200, 95, 43, 0.12)" : "0 1px 2px rgba(28, 25, 23, 0.06)",
                      background: on ? "#FFFBF7" : "#FDFBF8",
                      padding: 0,
                      textAlign: "left",
                      font: "inherit",
                    }}
                  >
                    <img src={s.img} alt="" style={{ width: "100%", height: 72, objectFit: "cover", display: "block" }} />
                    <div style={{ padding: "8px 10px 10px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: on ? "#C85F2B" : "#292524", lineHeight: 1.35, marginBottom: 4 }}>{s.label}</div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#78716C",
                          lineHeight: 1.35,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {s.tagline}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {form.archPrimary === "Traditional" && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#78716C", letterSpacing: "0.06em", marginBottom: 10 }}>TRADITIONAL REGIONAL STYLE</div>
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
                  {ARCH_TRADITIONAL_VARIANTS.map((s) => {
                    const on = form.archTraditionalVariant === s.label;
                    return (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => set("archTraditionalVariant", s.label)}
                        style={{
                          minWidth: 108,
                          maxWidth: 124,
                          flex: "0 0 auto",
                          cursor: "pointer",
                          borderRadius: 12,
                          overflow: "hidden",
                          border: on ? "2px solid #C85F2B" : "1px solid #E8E4DE",
                          background: on ? "#FFFBF7" : "#FDFBF8",
                          padding: 0,
                          textAlign: "left",
                          font: "inherit",
                        }}
                      >
                        <img src={s.img} alt="" style={{ width: "100%", height: 64, objectFit: "cover", display: "block" }} />
                        <div style={{ padding: "8px 10px 9px" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: on ? "#C85F2B" : "#292524", lineHeight: 1.35, marginBottom: 3 }}>{s.label}</div>
                          <div style={{ fontSize: 9, color: "#78716C", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.tagline}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Material & Finish Preference */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>🏗️</span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Material &amp; Finish Preference</span>
            </div>
            <div style={{ fontSize: 13, color: "#7A6E62", marginBottom: 10 }}>Quality level — affects look, durability and cost estimate.</div>
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 6 }}>
              <Segmented
                value={form.finishTier}
                onChange={(v) => set("finishTier", v)}
                options={["Budget Friendly", "Mid Range", "Premium"]}
              />
            </div>
            <div style={{ fontSize: 11, color: "#A8A29E", marginBottom: 28, lineHeight: 1.45 }}>
              Budget smart · Mid best value · Premium high-end finishes
            </div>

            {/* Exterior Preferences */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>🏠</span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Exterior Preferences</span>
            </div>
            <div style={{ fontSize: 13, color: "#7A6E62", marginBottom: 14 }}>
              Outside finish and roof — paint, stone, brick, wood, jali, tiles, roof type. Pick all that apply; pair with wall colours below.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
              {EXTERIOR_OPTION_TILES.map((e) => {
                const sel = form.exteriorPrefs.includes(e.label);
                return (
                  <button
                    key={e.label}
                    type="button"
                    onClick={() => toggleExterior(e.label)}
                    style={{
                      cursor: "pointer",
                      borderRadius: 10,
                      overflow: "hidden",
                      border: "none",
                      padding: 0,
                      textAlign: "left",
                      background: "transparent",
                      boxShadow: sel ? "0 0 0 2px #C85F2B, 0 2px 8px rgba(200,95,43,0.12)" : "0 1px 3px rgba(28,25,23,0.08)",
                      font: "inherit",
                    }}
                  >
                    <img src={e.img} alt="" style={{ width: "100%", height: 68, objectFit: "cover", display: "block", opacity: sel ? 1 : 0.92 }} />
                    <div style={{ padding: "8px 2px 4px", fontSize: 11, fontWeight: 600, color: sel ? "#C85F2B" : "#44403C", lineHeight: 1.35 }}>{e.label}</div>
                  </button>
                );
              })}
            </div>

            {/* Exterior colours — base + secondary / trim */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>🎨</span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Exterior colour scheme</span>
            </div>
            <div style={{ fontSize: 13, color: "#7A6E62", marginBottom: 14 }}>
              Main body colour and a secondary for window reveals, cornices, plinth bands or borders. Tap a hex to set that slot; octagon opens the system picker.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 28, position: "relative", zIndex: 2 }}>
              {[
                { title: "Base / main body", key: "colourBase", hint: "Walls & large fields" },
                { title: "Secondary / trim", key: "colourSecondary", hint: "Bands, reveals, accents" },
              ].map((slot) => (
                <div key={slot.key} style={{ position: "relative" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#44403C", marginBottom: 4 }}>{slot.title}</div>
                  <div style={{ fontSize: 10, color: "#A8A29E", marginBottom: 10 }}>{slot.hint}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#78716C", marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>{normalizeHexColor(form[slot.key]) || form[slot.key]}</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    {PALETTE_PRESET_HEX.map((c) => {
                      const pk = normalizeHexColor(c);
                      const sel = normalizeHexColor(form[slot.key]) === pk;
                      return (
                        <ColourHexSwatch
                          key={`${slot.key}-${c}`}
                          colour={c}
                          selected={sel}
                          onClick={() => {
                            const h = normalizeHexColor(c);
                            if (h) set(slot.key, h);
                          }}
                        />
                      );
                    })}
                    <ColourOctagonCustom
                      onPick={(raw) => {
                        const h = normalizeHexColor(raw);
                        if (h) set(slot.key, h);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: "#78716C", lineHeight: 1.55, paddingTop: 8, borderTop: "1px solid #EDE8E0" }}>
              These choices steer how AI picks materials in estimates and what elevations emphasize first.
            </div>
          </>)}

          {/* ─── STEP 5 ─── */}
          {activeStep === 5 && (<>
            <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: "Georgia,serif", marginBottom: 8 }}>Budget &amp; Timeline</h1>
            <p style={{ fontSize: 14, color: "#5C5147", marginBottom: 28, lineHeight: 1.6 }}>
              Help us plan your project better by sharing your construction budget and timeline.<br/>
              This keeps designs and estimates realistic.
            </p>

            {/* Section 1: Budget */}
            <div style={{ marginBottom: 28, paddingBottom: 26, borderBottom: "1px solid #EDE8E0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>₹</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>1. Construction budget</span>
                <span style={{ fontSize: 12, color: "#78716C", fontWeight: 600 }}>(required · above ₹0)</span>
              </div>
              <div style={{ fontSize: 13, color: "#5C5147", marginBottom: 16, maxWidth: 560 }}>
                Choose <strong>lakhs</strong> or <strong>crores</strong>, then set the amount from <strong>0 to 99</strong> on the slider (all-inclusive construction).
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", marginBottom: 18 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, fontWeight: 600, color: "#78716C", letterSpacing: "0.04em" }}>
                  AMOUNT IN
                  <select
                    value={form.budgetUnit}
                    onChange={(e) => set("budgetUnit", e.target.value)}
                    style={{
                      border: "1px solid #D6D3D1",
                      borderRadius: 6,
                      padding: "8px 12px",
                      fontSize: 13,
                      background: "#fff",
                      color: "#1C1917",
                      cursor: "pointer",
                      minWidth: 140,
                    }}
                  >
                    <option value="Lakhs">Lakhs (₹ L)</option>
                    <option value="Crores">Crores (₹ Cr)</option>
                  </select>
                </label>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#C85F2B", fontVariantNumeric: "tabular-nums", paddingBottom: 2 }}>{budgetSingleLabel(form)}</div>
              </div>
              <div style={{ maxWidth: 420, marginBottom: 8 }}>
                <input
                  type="range"
                  min={0}
                  max={99}
                  value={budgetAmountClamped(form)}
                  onChange={(e) => set("budgetAmount", e.target.value)}
                  style={{ width: "100%", accentColor: "#C85F2B", cursor: "pointer" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#A8A29E", marginTop: 6 }}>
                  <span>0</span>
                  <span>99</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#A8A29E", lineHeight: 1.5 }}>Includes construction, labour, materials, interiors and allied costs.</div>
            </div>

            {/* Section 2: Project Timeline (optional) */}
            <div style={{ marginBottom: 28, paddingBottom: 26, borderBottom: "1px solid #EDE8E0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                <span style={{ fontSize: 16 }}>📅</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>2. Project timeline</span>
                <span style={{ fontSize: 12, color: "#A8A29E", fontWeight: 500 }}>(optional)</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start", maxWidth: 520 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#5C5147", marginBottom: 6 }}>When do you plan to start?</div>
                  <Dropdown value={form.startTimeline} onChange={v => set("startTimeline", v)}
                    options={["Immediately","Within 3 Months","3–6 Months","6–12 Months","Not Sure"]} style={{ width: "100%" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#5C5147", marginBottom: 6 }}>Expected completion</div>
                  <Dropdown value={form.completionTime} onChange={v => set("completionTime", v)}
                    options={["6 - 9 Months","9 - 12 Months","12 - 18 Months","18 - 24 Months","24 Months+"]} style={{ width: "100%" }} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 12, lineHeight: 1.45 }}>Starting early usually helps lock materials and crew.</div>
            </div>

            {/* Section 3: Payment Preference */}
            <div style={{ marginBottom: 28, paddingBottom: 26, borderBottom: "1px solid #EDE8E0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 16 }}>₹</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>3. How you&apos;re funding it</span>
                <span style={{ fontSize: 12, color: "#A8A29E", fontWeight: 500 }}>(optional)</span>
              </div>
              <div style={{ fontSize: 13, color: "#5C5147", marginBottom: 12 }}>Tap one — helps us suggest phasing and payment milestones.</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  { val: "Own Savings", icon: "💰" },
                  { val: "Home Loan",   icon: "🏦" },
                  { val: "Mixed",       icon: "🔀" },
                ].map((p) => {
                  const on = form.paymentMode === p.val;
                  return (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => set("paymentMode", p.val)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 16px",
                        borderRadius: 999,
                        fontSize: 13,
                        cursor: "pointer",
                        border: "none",
                        background: on ? "#C85F2B" : "#EFEAE4",
                        color: on ? "#fff" : "#57534E",
                        fontWeight: on ? 600 : 500,
                      }}
                    >
                      <span aria-hidden>{p.icon}</span>
                      {p.val}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 4: How you found us */}
            <div style={{ marginBottom: 28, paddingBottom: 26, borderBottom: "1px solid #EDE8E0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 16 }}>👋</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>4. How did you find us?</span>
                <span style={{ fontSize: 12, color: "#78716C", fontWeight: 600 }}>(required)</span>
              </div>
              <div style={{ fontSize: 13, color: "#5C5147", marginBottom: 10 }}>Helps us see what is working for homeowners like you.</div>
              <select
                value={form.hearAboutUs}
                onChange={(e) => set("hearAboutUs", e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: 420,
                  border: "1px solid #D6D3D1",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 13,
                  background: "#fff",
                  color: form.hearAboutUs ? "#1C1917" : "#78716C",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                <option value="">Choose one…</option>
                <option value="Google or search">Google or search</option>
                <option value="Friend or family">Friend or family</option>
                <option value="Social media">Social media</option>
                <option value="Architect, builder, or consultant">Architect, builder, or consultant</option>
                <option value="Advertisement or event">Advertisement or event</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Section 5: Additional Notes */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 16 }}>✏️</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>5. Extra notes</span>
                <span style={{ fontSize: 12, color: "#A8A29E", fontWeight: 500 }}>(optional)</span>
              </div>
              <div style={{ fontSize: 13, color: "#5C5147", marginBottom: 10 }}>Anything else about cost, phasing or timeline?</div>
              <textarea
                value={form.budgetNotes}
                onChange={e => set("budgetNotes", e.target.value)}
                placeholder="E.g. phasing GST, milestone payments, local labour preference…"
                rows={3}
                style={{ width: "100%", maxWidth: 560, border: "1px solid #E7E5E4", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#1C1917", resize: "none", outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans',sans-serif", background: "#FAFAF9" }}
              />
            </div>
          </>)}

          {/* ─── STEP 6 — Review ─── */}
          {activeStep === 6 && (<>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>✨</span>
              <h1 style={{ fontSize: 30, fontWeight: 800, fontFamily: "Georgia,serif", margin: 0 }}>Review &amp; Generate v0 Designs</h1>
            </div>
            <p style={{ fontSize: 14, color: "#5C5147", marginBottom: 20, lineHeight: 1.6 }}>
              We’ve captured <strong>every</strong> input and option. Next, you’ll pay to unlock the AI v0, then a second
              payment sends the full pack to a professional for real floor &amp; elevation work — and into project management.
            </p>

            <div style={{ fontSize: 13, color: "#57534E", marginBottom: 22, lineHeight: 1.55, paddingBottom: 16, borderBottom: "1px solid #EDE8E0" }}>
              On the v0 step you can run up to <strong>3</strong> first-pass directions, then you lock in a drawing package
              so your architect isn’t working from a screenshot alone.
            </div>

            {/* Design Preferences Summary */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>✨ Your Design Preferences (Summary)</div>
              <button type="button" onClick={() => { setStepBlockError(""); setActiveStep(1); }} style={{ background: "#fff", border: "1.5px solid #D1C9BF", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#3D3530" }}>Edit All</button>
            </div>
            <div style={{ marginBottom: 24, paddingBottom: 8, borderBottom: "1px solid #EDE8E0" }}>
              {[
                ["Location", form.location],
                ["Lot size", `${form.dimW} ft × ${form.dimL} ft`],
                ["Floors", form.floors],
                ["Facing", form.facing],
                ["Vastu", `${form.vastu} preference`],
                ["Budget", budgetSingleLabel(form)],
                ["Look & materials", `${archResolved} · ${form.finishTier}`],
                ["Timeline", form.completionTime],
              ].map(([k, v], i) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "8px 0", borderTop: i === 0 ? "none" : "1px solid #F5F0EA", fontSize: 13 }}>
                  <span style={{ color: "#78716C", flexShrink: 0 }}>{k}</span>
                  <span style={{ fontWeight: 600, color: "#1C1917", textAlign: "right", lineHeight: 1.4 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Each design option includes</div>
            <div style={{ fontSize: 13, color: "#57534E", lineHeight: 1.65, marginBottom: 24 }}>
              Floor plans · 3D exteriors &amp; interiors · Elevations · Cost estimate with breakup (indicative for {form.location.split(",")[0]}).
            </div>

            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Before you generate</div>
            <ul style={{ margin: "0 0 20px", paddingLeft: 18, fontSize: 12, color: "#57534E", lineHeight: 1.65 }}>
              <li style={{ marginBottom: 6 }}>Designs follow typical local bye-laws and setbacks — always confirm with your authority.</li>
              <li style={{ marginBottom: 6 }}>Layouts respect the Vastu level you chose earlier.</li>
              <li style={{ marginBottom: 6 }}>Estimates use current {form.location.split(",")[0]} market bands (indicative).</li>
              <li>Final working drawings need your architect&apos;s sign-off.</li>
            </ul>

            <div style={{ fontSize: 12, color: "#78716C", lineHeight: 1.55 }}>
              💡 Clear inputs here mean fewer surprises in quotes and site work later.
            </div>
          </>)}

          {activeStep === 7 && (<>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>✨</span>
              <h1 style={{ fontSize: 30, fontWeight: 800, fontFamily: "Georgia,serif", margin: 0 }}>Pay, generate, then pro drawings</h1>
            </div>
            <p style={{ fontSize: 14, color: "#5C5147", marginBottom: 18, lineHeight: 1.6, maxWidth: 640 }}>
              First payment unlocks the v0 run from your <strong>complete</strong> brief. After the AI output, a second
              payment assigns an architect to produce real plans. Nothing moves to execution until you are ready in the
              project hub.
            </p>
            <ProjectFlowPayment
              variant="preV0"
              paid={preV0Paid}
              onCompletePayment={() => {
                setPreV0Paid(true);
                setBuildFlow({ preV0: true });
                setStepBlockError("");
              }}
            />
            {preV0Paid && !v0Generated && !v0Generating && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Run AI v0 (uses all wizard inputs)</div>
                <p style={{ fontSize: 13, color: "#57534E", lineHeight: 1.55, margin: "0 0 12px" }}>
                  Floor-plan direction, key elevations, and indicative cost — for discussion, not site-ready stamps.
                </p>
                <button
                  type="button"
                  onClick={runV0Generation}
                  className="btn-continue !rounded-xl !px-6 !py-3.5 text-sm"
                >
                  Generate v0 designs
                </button>
              </div>
            )}
            {v0Generating && (
              <div style={{ padding: "28px 20px", textAlign: "center", background: "#FFFBF7", border: "1px solid #EEDCCB", borderRadius: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1917", marginBottom: 6 }}>Running v0…</div>
                <div style={{ fontSize: 12, color: "#7A6E62", lineHeight: 1.55 }}>
                  Step 1 — image directions (image API). Step 2 — estimate &amp; project skeleton (plan API). Separate keys on the server.
                </div>
              </div>
            )}
            {v0Generated && (
              <>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Your v0 directions (indicative)</div>
                <p style={{ fontSize: 13, color: "#57534E", lineHeight: 1.5, margin: "0 0 14px" }}>
                  Open each when we wire 3D. For now this marks the handoff line between AI and human drawings.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
                  {(v0ImageBundle?.images?.length ? v0ImageBundle.images.slice(0, 3) : [1, 2, 3]).map((entry, i) => {
                    const label =
                      entry && typeof entry === "object"
                        ? entry.label || `Direction ${String.fromCharCode(65 + i)}`
                        : `Direction ${String.fromCharCode(65 + i)}`;
                    const url = entry?.url;
                    const hint = entry?.hint;
                    return (
                      <div
                        key={label + i}
                        style={{
                          borderRadius: 12,
                          border: "1px solid #EEDCCB",
                          padding: 12,
                          minHeight: 100,
                          background: "linear-gradient(180deg,#FFFBF7,#FDFBF8)",
                          overflow: "hidden",
                        }}
                      >
                        {url ? (
                          <img
                            src={url}
                            alt=""
                            style={{ width: "100%", height: 88, objectFit: "cover", borderRadius: 8, marginBottom: 8 }}
                          />
                        ) : null}
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#C85F2B" }}>{label}</div>
                        <div style={{ fontSize: 11, color: "#78716C", marginTop: 4, lineHeight: 1.35 }}>
                          {hint || "Layout + elevation v0"}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {v0PlanBundle?.estimate_lines?.length ? (
                  <div style={{ fontSize: 12, color: "#57534E", lineHeight: 1.55, marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, color: "#44403C" }}>Indicative estimate lines</span> — from the second
                    call (populate with your plan model). {v0PlanBundle.mock ? "Mock data until keys are wired." : null}
                  </div>
                ) : null}
                <ProjectFlowPayment
                  variant="postV0"
                  paid={postV0Paid}
                  onCompletePayment={() => {
                    setPostV0Paid(true);
                    setBuildFlow({ postV0: true });
                    setStepBlockError("");
                  }}
                />
                <div style={{ fontSize: 12, color: "#57534E", lineHeight: 1.55, marginTop: 8 }}>
                  After this payment, your architect receives the <strong>same structured brief + v0</strong> to
                  comment, clarify, and produce real floor plans, elevations, and coordination sheets.
                </div>
              </>
            )}
          </>)}

          {activeStep === 8 && (<>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>🤝</span>
              <h1 style={{ fontSize: 30, fontWeight: 800, fontFamily: "Georgia,serif", margin: 0 }}>Initial draft for your architect</h1>
            </div>
            <p style={{ fontSize: 14, color: "#5C5147", marginBottom: 16, lineHeight: 1.6, maxWidth: 640 }}>
              Everything below is what you entered — the architect sees the same, can comment line-by-line, and turns it
              into working drawings. When you are ready, open the project room to onboard your contractor team.
            </p>
            <div style={{ background: "#F7F3EE", border: "1px solid #E6DFD3", borderRadius: 12, padding: 14, marginBottom: 16, maxHeight: 280, overflow: "auto" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#44403C", marginBottom: 6 }}>Structured brief (read-only export)</div>
              <pre style={{ margin: 0, fontSize: 10, lineHeight: 1.4, color: "#292524", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
{JSON.stringify(form, null, 2)}
              </pre>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#44403C", marginBottom: 6 }}>Note for the architect (optional)</div>
            <textarea
              value={architectHandoffNote}
              onChange={(e) => {
                const v = e.target.value.slice(0, 1200);
                setArchitectHandoffNote(v);
                setBuildFlow({ architectComment: v });
              }}
              placeholder="E.g. prefer east-facing master, avoid demolishing the existing compound wall, tie-up with a known structural consultant…"
              rows={4}
              style={{ width: "100%", maxWidth: 560, border: "1px solid #E7E5E4", borderRadius: 8, padding: "10px 12px", fontSize: 13, resize: "vertical", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box", background: "#FAFAF9" }}
            />
            <div style={{ fontSize: 11, color: "#9A8F87", marginTop: 4 }}>{architectHandoffNote.length}/1200</div>
            <p style={{ fontSize: 13, color: "#57534E", lineHeight: 1.55, marginTop: 16, marginBottom: 0 }}>
              Project management is where you invite your architect, contractors, and track build stages — from this handoff
              into site execution.
            </p>
          </>)}

          <div style={{ marginTop: 44, paddingTop: 28, borderTop: "1px solid #EDE8E0" }}>
            {stepBlockError ? (
              <div role="alert" style={{ marginBottom: 16, fontSize: 13, color: "#B45309", fontWeight: 500, lineHeight: 1.45 }}>
                {stepBlockError}
              </div>
            ) : null}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                disabled={activeStep === 7 && (!preV0Paid || !v0Generated || !postV0Paid)}
                className="btn-continue text-sm md:text-[15px] !px-6 !py-3 md:!px-8 md:!py-3.5 !shadow-[0_8px_22px_-8px_rgba(200,95,43,0.45)] !rounded-[999px] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleContinue}
              >
                {activeStep === 6 && "Continue to v0 & payment"}
                {activeStep === 7 && "Continue to architect handoff"}
                {activeStep === 8 && "Open project management"}
                {activeStep < 6 && "Continue"}
                <svg className="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>

        </main>

        <aside
          style={{
            width: 288,
            flexShrink: 0,
            background: "#FDFBF8",
            padding: "24px 22px",
            overflowY: "auto",
            position: "relative",
            paddingTop: 40,
          }}
        >
          <div className="preview-annotation select-none hidden lg:block">Live Preview</div>
          <svg
            className="absolute -top-6 left-[min(52%,200px)] text-[#C85F2B] hidden lg:block pointer-events-none"
            width="38"
            height="38"
            viewBox="0 0 42 42"
            fill="none"
            aria-hidden
          >
            <path d="M5 6 C 18 8, 28 18, 30 32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M26 28 L30 32 L34 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>

          <div className="preview-card fade-up relative w-full max-w-full mx-auto">
            <div
              className="preview-hero"
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=75)",
              }}
            />
            <div style={{ padding: "16px 18px 20px", marginTop: 0 }}>
          {activeStep === 1 && (
            <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #EDE8E0" }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Project location</div>
              <div style={{ fontSize: 12, color: "#5C5147", lineHeight: 1.45 }}>{form.location}</div>
              <button type="button" style={{ fontSize: 12, color: "#C85F2B", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 6, fontWeight: 600 }}>Change location</button>
            </div>
          )}

          {activeStep >= 2 && (
            <div style={{ fontSize: 12, color: "#7A6E62", marginBottom: 6 }}>Project at {form.location}</div>
          )}

          {/* Plot / Project Summary */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{activeStep === 1 ? "Plot Summary" : "Quick Project Summary"}</div>
              {activeStep >= 2 && (
                <button type="button" onClick={() => { setStepBlockError(""); setActiveStep(1); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#C85F2B", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                  ✏️ Edit
                </button>
              )}
            </div>
            {[
              ["Lot dimensions", `${form.dimW} ft × ${form.dimL} ft`],
              ["Facing", form.facing],
              ["Road access", form.roadAccess],
              ...(activeStep >= 3 ? [
                ["Floors", form.floors],
                ["Built-up Area", `${form.builtupPct} %`],
                ["Vastu Preference", form.vastu],
                ["Parking", `${form.twoWheeler}W + ${form.fourWheeler} Car`],
              ] : [
                ["Location type", form.locationType],
              ]),
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F0EBE3", fontSize: 12 }}>
                <span style={{ color: "#7A6E62" }}>{k}</span>
                <span style={{ fontWeight: 600, textAlign: "right", maxWidth: 110 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Building Norms - shown from step 3 */}
          {activeStep >= 3 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>🛡️ Building norms (indicative)</div>
              {[
                ["Max. Permissible Floors", "G + 3"],
                ["Front Setback", "10 ft"],
                ["Side Setback", "5 ft (each side)"],
                ["Rear Setback", "5 ft"],
                ["Height Limit", "40 ft (G+3)"],
              ].map(([k,v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #F0EBE3", fontSize: 12 }}>
                  <span style={{ color: "#7A6E62" }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <button style={{ fontSize: 12, color: "#C85F2B", background: "none", border: "none", cursor: "pointer", padding: "6px 0 0", fontWeight: 600 }}>View all norms →</button>
            </div>
          )}

          {/* Steps 6–8: project summary in preview rail */}
          {activeStep >= 6 && activeStep <= 8 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Your Project Summary</div>
                <button type="button" onClick={() => { setStepBlockError(""); setActiveStep(1); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#C85F2B", fontSize: 12, fontWeight: 600 }}>✏️ Edit</button>
              </div>
              {[
                ["Location",        form.location],
                ["Lot dimensions", `${form.dimW} ft × ${form.dimL} ft`],
                ["Facing",          form.facing],
                ["Floors",          form.floors],
                ["Built-up Area",   `${form.builtupPct} %`],
                ["Vastu Preference",form.vastu],
                ["Parking",         `${form.twoWheeler}W + ${form.fourWheeler} Car`],
                ["Budget",          budgetSingleLabel(form)],
                ["Timeline",        form.completionTime],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #F0EBE3", fontSize: 12 }}>
                  <span style={{ color: "#7A6E62" }}>{k}</span>
                  <span style={{ fontWeight: 600, textAlign: "right", maxWidth: 120 }}>{v}</span>
                </div>
              ))}
              {activeStep === 6 && (
                <div style={{ marginTop: 14, paddingTop: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#44403C", marginBottom: 8 }}>What happens next</div>
                  <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: "#78716C", lineHeight: 1.55 }}>
                    <li style={{ marginBottom: 4 }}>You pay to unlock the AI on your <strong>full</strong> brief</li>
                    <li style={{ marginBottom: 4 }}>AI drafts up to 3 v0 directions; you pay again for the pro drawing set</li>
                    <li style={{ marginBottom: 4 }}>Your architect refines, comments, and produces real plans</li>
                    <li>Project management links your whole build team</li>
                  </ol>
                </div>
              )}
              <div style={{ fontSize: 11, color: "#78716C", lineHeight: 1.55, marginTop: 16, paddingTop: 14, borderTop: "1px solid #EDE8E0" }}>
                <span style={{ marginRight: 6 }} aria-hidden>🇮🇳</span>
                Built for Indian homes and local norms—always confirm rules with your authority.
              </div>
            </>
          )}

          {/* Step 5: Cost Guide right panel */}
          {activeStep === 5 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Your Project Summary</div>
                <button type="button" onClick={() => { setStepBlockError(""); setActiveStep(1); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#C85F2B", fontSize: 12, fontWeight: 600 }}>✏️ Edit</button>
              </div>
              {[
                ["Location",        form.location],
                ["Lot dimensions", `${form.dimW} ft × ${form.dimL} ft`],
                ["Facing",          form.facing],
                ["Floors",          form.floors],
                ["Built-up Area",   `${form.builtupPct} %`],
                ["Vastu Preference",form.vastu],
                ["Parking",         `${form.twoWheeler}W + ${form.fourWheeler} Car`],
                ["Budget",          budgetSingleLabel(form)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F0EBE3", fontSize: 12 }}>
                  <span style={{ color: "#7A6E62" }}>{k}</span>
                  <span style={{ fontWeight: 600, textAlign: "right", maxWidth: 120 }}>{v}</span>
                </div>
              ))}
              {/* Cost Guide */}
              <div style={{ marginTop: 16, marginBottom: 12, fontWeight: 700, fontSize: 13 }}>Cost Guide – {form.location.split(",")[0]}</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
                <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=100&q=60" alt="house" style={{ width: 60, height: 50, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, color: "#7A6E62", marginBottom: 3 }}>Current average construction cost (May 2024)</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#C85F2B" }}>₹ 2,200 – ₹ 2,800</div>
                  <div style={{ fontSize: 11, color: "#7A6E62" }}>per sq ft</div>
                </div>
              </div>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "#C85F2B", fontWeight: 700, fontSize: 12, padding: 0, marginBottom: 16 }}>View detailed cost guide →</button>
              <div style={{ fontSize: 12, color: "#78716C", lineHeight: 1.55, marginTop: 12, paddingTop: 12, borderTop: "1px solid #EDE8E0" }}>
                A clear budget band and timeline keep AI outputs buildable and quotes closer to reality.
              </div>
            </>
          )}

          {activeStep === 4 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Your Project Summary</div>
                <button type="button" onClick={() => { setStepBlockError(""); setActiveStep(1); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#C85F2B", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>✏️ Edit</button>
              </div>
              {[
                ["Location",         form.location],
                ["Lot dimensions", `${form.dimW} ft × ${form.dimL} ft`],
                ["Facing",           form.facing],
                ["Floors",           form.floors],
                ["Built-up Area",    `${form.builtupPct} %`],
                ["Vastu Preference", form.vastu],
                ["Parking",          `${form.twoWheeler}W + ${form.fourWheeler} Car`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F0EBE3", fontSize: 12 }}>
                  <span style={{ color: "#7A6E62" }}>{k}</span>
                  <span style={{ fontWeight: 600, textAlign: "right", maxWidth: 120 }}>{v}</span>
                </div>
              ))}
              <div style={{ fontSize: 12, color: "#78716C", lineHeight: 1.55, margin: "14px 0", paddingBottom: 14, borderBottom: "1px solid #EDE8E0" }}>
                Style and shell choices steer elevations, materials in estimates, and what the first-pass plans emphasize.
              </div>
              {(() => {
                const pick = archCardByLabel(archResolved);
                const blurb = ARCH_STYLE_SIDEBAR_BLURB[archResolved] || ARCH_STYLE_SIDEBAR_BLURB[pick.label];
                return (
                  <div style={{ borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 12px rgba(28,25,23,0.08)" }}>
                    <img src={pick.img} alt="" style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }} />
                    <div style={{ padding: "10px 0 0" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{archResolved}</div>
                      <div style={{ fontSize: 12, color: "#5C5147", lineHeight: 1.5 }}>{blurb}</div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          {/* Info (light — skip on review) */}
          {activeStep !== 4 && ![6, 7, 8].includes(activeStep) && (
            <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #EDE8E0" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#44403C", marginBottom: 6 }}>
                {activeStep === 2 ? "Why this matters" : "Why we ask"}
              </div>
              <div style={{ fontSize: 12, color: "#78716C", lineHeight: 1.55 }}>
                {activeStep === 2
                  ? "Room counts and how you live drive circulation, light and cost. Clear answers here mean layouts that fit your family—not generic defaults."
                  : "These details help our AI understand your plot, apply local building regulations, and create accurate designs, estimates, and compliant plans."}
              </div>
            </div>
          )}

          {/* Next Step (non-step-4, non-review) */}
          {activeStep !== 4 && ![6, 7, 8].includes(activeStep) && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 34, height: 34, background: "#F0EBE3", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>🏠</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>Next step</div>
                <div style={{ fontSize: 12, color: "#5C5147", lineHeight: 1.5 }}>
                  {activeStep === 1 && "Tell us how you live and the rooms you need—then we move to structure and services."}
                  {activeStep === 2 && "Spatial configuration: floors, staircase, vastu and building services."}
                  {activeStep === 3 && "Aesthetic & materials: style, finishes and exterior shell preferences."}
                  {activeStep === 5 && "Budget & timeline: your construction figure, schedule and how you plan to fund the build."}
                  {![1, 2, 3, 5].includes(activeStep) && "Complete each section to build your project brief."}
                </div>
              </div>
            </div>
          )}
          {[7, 8].includes(activeStep) && (
            <div style={{ marginTop: 16, padding: "12px 14px", background: activeStep === 7 ? "#FFFBF7" : "#F0FDF4", border: `1px solid ${activeStep === 7 ? "#EEDCCB" : "#BBE8CC"}`, borderRadius: 12, fontSize: 12, color: "#44403C", lineHeight: 1.5 }}>
              {activeStep === 7 && (
                <>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Checklist on this step</div>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    <li style={{ marginBottom: 4 }}>V0 access: {preV0Paid ? "✓ Paid" : "○ Pending"}</li>
                    <li style={{ marginBottom: 4 }}>AI run: {v0Generated ? "✓ Complete" : "○ Not run yet"}</li>
                    <li>Pro drawings: {postV0Paid ? "✓ Paid" : "○ Pending"}</li>
                  </ul>
                </>
              )}
              {activeStep === 8 && (
                <>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Ready for the project room</div>
                  <div>Onboard your architect, contractors, and share updates in one place.</div>
                </>
              )}
            </div>
          )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
