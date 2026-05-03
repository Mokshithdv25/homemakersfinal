import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HmHeaderBrandLockup } from "../components/HmBrandLockup";
import ProjectFlowPayment from "../components/ProjectFlowPayment";
import { getRemodelFlow, setRemodelFlow } from "../lib/projectFlowStorage";
import { requestV0Images, requestEstimatePlan, formatAiApiError } from "../lib/aiApi";
import {
  ColourHexSwatch,
  ColourOctagonCustom,
  normalizeHexColor,
  PALETTE_PRESET_HEX,
} from "../components/HmColourPickers";
import { HM_HEADER_BAR_CLASS, HM_TAGLINE_REMODEL } from "../lib/hmBrand";

const REMODEL_STEPS = [
  { n: 1, title: "Capture Space", sub: "Photos, property & room details" },
  { n: 2, title: "Define Outcome", sub: "Goals, pain points & notes" },
  { n: 3, title: "Set Constraints", sub: "Budget, timeline & boundaries" },
  { n: 4, title: "Choose Style", sub: "Look, finish & colours" },
  { n: 5, title: "Review brief", sub: "Confirm before you pay" },
  { n: 6, title: "AI v0", sub: "Pay, generate, pro handoff" },
  { n: 7, title: "Architect & project", sub: "Full brief & project hub" },
];
/** Nine remodel targets — aligned with new-home taxonomy (no maid room). */
const REMODEL_ROOMS = [
  { label: "Living room", icon: "🛋️" },
  { label: "Kitchen", icon: "🍳" },
  { label: "Bedroom", icon: "🛏️" },
  { label: "Bathroom", icon: "🚿" },
  { label: "Dining area", icon: "🍽️" },
  { label: "Balcony / terrace", icon: "🌿" },
  { label: "Puja room", icon: "🪔" },
  { label: "Parking / garage", icon: "🚗" },
  { label: "Study, office, or hall", icon: "🚪" },
];
const PTYPES = ["Apartment","Independent House","Villa"];
const DEMO_PHOTOS = [
  { label:"Front View", url:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&q=70" },
  { label:"Left View",  url:"https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=200&q=70" },
  { label:"Right View", url:"https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=200&q=70" },
  { label:"Back View",  url:"https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=200&q=70" },
];
const REF_IMGS = [
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=140&q=70",
  "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=140&q=70",
];
const PAIN_OPTS = ["Cramped / Small","Poor Lighting","Not Enough Storage","Outdated Design","Poor Ventilation","Other"];
const GOAL_OPTS = [
  { v:"Improve Layout",        sub:"Make the space more functional",      icon:"⬡" },
  { v:"Upgrade Look",          sub:"Give the space a modern new look",     icon:"✦" },
  { v:"Add Storage",           sub:"More storage and better organization", icon:"▤" },
  { v:"Increase Property Value",sub:"Upgrade to increase property value", icon:"₹" },
  { v:"Other",                 sub:"Something else (specify later)",       icon:"○" },
];

const OR = "#C85F2B";

function budgetAmountClampedRemodel(budgetAmount) {
  return Math.min(99, Math.max(0, parseInt(String(budgetAmount ?? "0"), 10) || 0));
}

function remodelBudgetLabel(budgetUnit, budgetAmount) {
  const n = budgetAmountClampedRemodel(budgetAmount);
  if (n === 0) return "₹0";
  return budgetUnit === "Crores" ? `₹${n} Cr` : `₹${n} L`;
}

const flowSection = { marginBottom: 28, paddingBottom: 26, borderBottom: "1px solid #EDE8E0" };

const cardStyle = {
  background: "#fff",
  borderRadius: 14,
  border: "1px solid #EFE3D2",
  padding: "20px 24px",
  marginBottom: 20,
  boxShadow: "0 1px 2px rgba(28, 25, 23, 0.04)",
};

const inputStyle = {
  border: "1px solid #D6D3D1",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 14,
  background: "#fff",
  outline: "none",
};

const sumRow = { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F0EBE3", fontSize: 12 };

function RightPanel({
  step,
  room,
  ptype,
  len,
  breadth,
  photos,
  spaceNotes,
  mainGoal,
  changeLevel,
  budgetUnit,
  budgetAmount,
  layoutOk,
  mustKeep,
  dealbreakers3,
  styles,
  finishTier,
  startTimeline,
  completionTime,
  colourBase,
  colourSecondary,
}) {
  const area = (parseInt(len)||0)*(parseInt(breadth)||0);
  const budgetLine = remodelBudgetLabel(budgetUnit, budgetAmount);
  const colourLine =
    normalizeHexColor(colourBase) && normalizeHexColor(colourSecondary)
      ? `${normalizeHexColor(colourBase)} · ${normalizeHexColor(colourSecondary)}`
      : "—";
  const infoBox = step === 3
    ? { icon:"🛡️", title:"Why we ask for constraints?", color:"#44403C", bg:"#FBF6F0", border:"#EEDCCB", items:["Helps us create realistic designs","Improves cost estimates","Ensures smooth execution"], art:"📋🪴" }
    : step === 4
    ? { icon:"✨", title:"Why style matters?", color:"#44403C", bg:"#FBF6F0", border:"#EEDCCB", items:["Reflects your personality","Stays within your budget","Guides AI design choices"], art:"🛏️🪴" }
    : step === 5
    ? { icon:"📋", title:"Review before you pay", color:"#44403C", bg:"#FBF6F0", border:"#EEDCCB", items:["Same inputs your architect will see in the handoff","Pay first to unlock the AI, then to assign working drawings","Then open the project room for your team"], art:"✅🪴" }
    : step === 6
    ? { icon:"🤖", title:"About v0 concept", color:"#44403C", bg:"#FBF6F0", border:"#EEDCCB", items:["AI v0 is a machine first pass — not a sanction set","Your professional refines, comments, and produces real plans","Project hub is where the build team works together"], art:"💻🪴" }
    : step === 7
    ? { icon:"🏗️", title:"Project management", color:"#14532D", bg:"#F0FDF4", border:"#BBF7D0", items:["Onboard your architect, contractors, and trades","One thread for decisions, files, and site photos","Tied to the brief and notes you just exported"], art:"🧱🪴" }
    : null;
  return (
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
      <div className="preview-card fade-up relative w-full max-w-full mx-auto">
        <div
          className="preview-hero"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=75)",
          }}
        />
        <div style={{ padding: "16px 18px 20px", marginTop: 0 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:14 }}>Project Summary</div>
        <button type="button" style={{ background:"none", border:"none", color:OR, fontWeight:700, fontSize:12, cursor:"pointer" }}>✏️ Edit</button>
      </div>
      {[
        ["Project Type","Remodel"],
        ["Location","Bengaluru, Karnataka"],
        ["Room", room],
        ["Property Type", ptype],
        ["Room Size", area>0?`${len} ft × ${breadth} ft (${area} sq ft)`:"Not added yet"],
        ["Budget", budgetLine],
        ["Timeline", `${startTimeline} → ${completionTime}`],
        ["Photos", photos.length>0?`${photos.length} photos uploaded`:"Not uploaded yet"],
        ["Notes", spaceNotes.trim()?spaceNotes.slice(0,38)+(spaceNotes.length>38?"…":""):"Not added yet"],
        ...(step>=2?[["Goal", mainGoal||"Not set"]]:[]),
        ...(step>=3?[
          ["Layout Change", layoutOk],
          ["Must Keep", mustKeep.length>0?mustKeep.slice(0,2).join(", "):"Not set"],
          ["Dealbreakers", dealbreakers3.length>0?dealbreakers3.slice(0,2).join(",\n"):"None"],
        ]:[]),
        ...(step>=4?[["Style", styles.join(" + ")],["Finish",finishTier],["Colours", colourLine]]:[]),
      ].map(([k,v]) => (
        <div key={k} style={sumRow}>
          <span style={{ color:"#7A6E62" }}>{k}</span>
          <span style={{ fontWeight:600, textAlign:"right", maxWidth:130, fontSize:12 }}>{v}</span>
        </div>
      ))}
      {infoBox ? (
        <div style={{ background:infoBox.bg, border:`1px solid ${infoBox.border}`, borderRadius:12, padding:"14px 16px", margin:"16px 0" }}>
          <div style={{ fontWeight:700, fontSize:12, color:infoBox.color, marginBottom:8 }}>{infoBox.icon} {infoBox.title}</div>
          {infoBox.items.map(t => (
            <div key={t} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#22A36B" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <span style={{ fontSize:11, color:infoBox.color }}>{t}</span>
            </div>
          ))}
          <div style={{ marginTop:10, fontSize:28, textAlign:"center" }}>{infoBox.art}</div>
        </div>
      ) : (
        <div style={{ background:"#FBF6F0", border:"1px solid #EEDCCB", borderRadius:12, padding:"14px 16px", margin:"16px 0" }}>
          <div style={{ fontWeight:700, fontSize:12, color:"#44403C", marginBottom:5 }}>🎯 Why this matters</div>
          <div style={{ fontSize:12, color:"#57534E", lineHeight:1.55 }}>Your goals help us understand your priorities and create designs that fit your lifestyle and budget.</div>
          <div style={{ marginTop:8, fontSize:22 }}>🛋️🪴</div>
        </div>
      )}
      {step === 6 && (
        <div style={{ background:"#F8F4EF", border:"1px solid #E2D9CF", borderRadius:10, padding:"12px 14px", marginTop:12 }}>
          <div style={{ fontWeight:700, fontSize:12, marginBottom:8 }}>What happens next?</div>
          {[
            "Your architect or assigned professional reviews the AI v0 and tightens the concept.",
            "You collaborate with your own design expert — not a generic bot — to refine plans and finishes.",
            "Move into project management: one place for updates, visibility, and coordination.",
          ].map((t,i) => (
            <div key={i} style={{ display:"flex", gap:8, marginBottom:6, alignItems:"flex-start" }}>
              <div style={{ width:16, height:16, borderRadius:"50%", background:OR, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, flexShrink:0, marginTop:1 }}>{i+1}</div>
              <span style={{ fontSize:11, color:"#5C5147", lineHeight:1.5 }}>{t}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ background:"#F0F8EE", border:"1px solid #C3DEB8", borderRadius:12, padding:"14px 16px" }}>
        <div style={{ fontWeight:700, fontSize:12, color:"#166534", marginBottom:4 }}>🔒 Your privacy matters</div>
        <div style={{ fontSize:12, color:"#15803D", lineHeight:1.5 }}>Your information is secure and only used for this project.</div>
      </div>
        </div>
      </div>
    </aside>
  );
}

export default function RemodelHome() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  // Step 1
  const [photos, setPhotos] = useState(DEMO_PHOTOS);
  const [ptype, setPtype] = useState("Apartment");
  const [room, setRoom] = useState("Living room");
  const [len, setLen] = useState("15");
  const [breadth, setBreadth] = useState("12");
  // Step 2 — single notes field (no duplicate “vision” on step 1)
  const [spaceNotes, setSpaceNotes] = useState("");
  const [mainGoal, setMainGoal] = useState("Improve Layout");
  const [painPoints, setPainPoints] = useState(["Cramped / Small","Poor Lighting","Not Enough Storage"]);
  const [changeLevel, setChangeLevel] = useState("Moderate Remodel");
  const [refImgs, setRefImgs] = useState(REF_IMGS);
  // Step 3 — same budget logic as new home (lakhs / crores · 0–99)
  const [budgetUnit, setBudgetUnit] = useState("Lakhs");
  const [budgetAmount, setBudgetAmount] = useState("25");
  const [budgetNotes, setBudgetNotes] = useState("");
  const [startTimeline, setStartTimeline] = useState("Within 3 Months");
  const [completionTime, setCompletionTime] = useState("9 - 12 Months");
  const [layoutOk, setLayoutOk] = useState("Yes, open to changes");
  const [mustKeep, setMustKeep] = useState([]);
  const [dealbreakers3, setDealbreakers3] = useState([]);
  // Step 4
  const [styles, setStyles] = useState(["Modern"]);
  const [finishTier, setFinishTier] = useState("Budget Friendly");
  const [colourBase, setColourBase] = useState("#F5F5F0");
  const [colourSecondary, setColourSecondary] = useState("#9B7B5C");
  // After AI v0 (step 6+)
  const [postAiNotes, setPostAiNotes] = useState("");
  const [preV0Paid, setPreV0Paid] = useState(false);
  const [postV0Paid, setPostV0Paid] = useState(false);
  const [v0Generated, setV0Generated] = useState(false);
  const [v0Generating, setV0Generating] = useState(false);
  const [v0ImageBundle, setV0ImageBundle] = useState(null);
  const [v0PlanBundle, setV0PlanBundle] = useState(null);
  const [architectHandoffNote, setArchitectHandoffNote] = useState("");
  const [stepBlockError, setStepBlockError] = useState("");
  const [inspirationImgs, setInspirationImgs] = useState([
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=160&q=70",
    "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=160&q=70",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=160&q=70",
  ]);
  const toggleStyle = (s) => setStyles(prev => prev.includes(s) ? prev.filter(x=>x!==s) : prev.length < 2 ? [...prev, s] : prev);

  const togglePain = (p) => setPainPoints(prev => prev.includes(p)?prev.filter(x=>x!==p):[...prev,p]);
  const area = (parseInt(len)||0)*(parseInt(breadth)||0);
  const sel = (v) => ({ border:`2px solid ${v?OR:"#D1C9BF"}`, background:v?"#FBE5D4":"#fff", borderRadius:10, cursor:"pointer", padding:"12px 14px", textAlign:"center", color:v?OR:"#1C1917" });

  useEffect(() => {
    const f = getRemodelFlow();
    setPreV0Paid(!!f.preV0);
    setPostV0Paid(!!f.postV0);
    setV0Generated(!!f.v0);
    if (f.v0Images) setV0ImageBundle(f.v0Images);
    if (f.v0Plan) setV0PlanBundle(f.v0Plan);
    if (f.architectComment) setArchitectHandoffNote(String(f.architectComment));
  }, []);

  const remodelBriefPayload = () => ({
    flowWizard: "remodel_home",
    location: "Bengaluru, Karnataka",
    room,
    ptype,
    len,
    breadth,
    spaceNotes,
    mainGoal,
    painPoints,
    changeLevel,
    budgetUnit,
    budgetAmount,
    budgetNotes,
    startTimeline,
    completionTime,
    layoutOk,
    mustKeep,
    dealbreakers3,
    styles,
    finishTier,
    colourBase,
    colourSecondary,
    inspirationCount: inspirationImgs.length,
  });

  const runRemodelV0 = async () => {
    if (!preV0Paid) return;
    setV0Generating(true);
    setStepBlockError("");
    try {
      const brief = remodelBriefPayload();
      const imagesPayload = await requestV0Images("remodel", brief);
      const planPayload = await requestEstimatePlan("remodel", brief, imagesPayload);
      setV0ImageBundle(imagesPayload);
      setV0PlanBundle(planPayload);
      setV0Generated(true);
      setRemodelFlow({ v0: true, v0Images: imagesPayload, v0Plan: planPayload });
    } catch (e) {
      setStepBlockError(formatAiApiError(e));
    } finally {
      setV0Generating(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FBF7F2] overflow-x-hidden" style={{ fontFamily: "'DM Sans',Inter,system-ui,sans-serif", color: "#1C1917" }}>
      {/* Background accents matching the homepage */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(193,132,78,0.08),transparent_50%)]" aria-hidden />

      <header className={HM_HEADER_BAR_CLASS}>
        <HmHeaderBrandLockup tagline={HM_TAGLINE_REMODEL} />
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
        <aside
          style={{
            width: 228,
            flexShrink: 0,
            background: "#fff",
            borderRight: "1px solid #EFE3D2",
            padding: "24px 0",
          }}
        >
          {REMODEL_STEPS.map((s) => (
            <button
              key={s.n}
              type="button"
              onClick={() => { setStepBlockError(""); setStep(s.n); }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "12px 18px",
                background: step === s.n ? "#FBF6F0" : "none",
                border: "none",
                borderLeft: step === s.n ? "3px solid #C85F2B" : "3px solid transparent",
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
                  background: step === s.n ? "#C85F2B" : s.n < step ? "#22A36B" : "#EDE8E3",
                  color: step === s.n || s.n < step ? "#fff" : "#7A6E62",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  marginTop: 1,
                }}
              >
                {s.n < step ? "✓" : s.n}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: step === s.n ? "#C85F2B" : "#1C1917", lineHeight: 1.3 }}>{s.title}</div>
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
          <button
            type="button"
            onClick={() => (step === 1 ? navigate("/build") : setStep((s) => s - 1))}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6A5E53", marginBottom: 20, padding: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </button>

          {/* ═══ STEP 1 ═══ */}
          {step===1 && <>
            <div className="craft-type-label mt-1 mb-4">
              <span style={{ color: "#C85F2B" }}>●</span>
              <span>Capture space</span>
            </div>
            <h1 className="font-serif-display text-3xl md:text-[2.25rem] font-medium text-[#1C1917] tracking-tight leading-tight m-0 mb-3">
              Your existing room
            </h1>
            <p style={{ fontSize: 14, color: "#57534E", margin: "0 0 28px", lineHeight: 1.6, maxWidth: 640 }}>
              Upload photos for <strong>one room at a time</strong>, then pick the space and rough size — same flow rhythm as new home, lighter layout.
            </p>

            <div style={{ ...flowSection, background: "#FDFBF8", borderRadius: 16, padding: "22px 22px 8px", border: "1px solid #EFE3D2", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>📷</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Photos</span>
                <span style={{ fontSize: 12, color: "#78716C" }}>one room per pass</span>
              </div>
              <div style={{ fontSize: 13, color: "#5C5147", marginBottom: 16, lineHeight: 1.55 }}>Clear angles help AI and your professional read the room.</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                {photos.map((p,i)=>(
                  <div key={i} style={{ position:"relative", borderRadius:12, overflow:"hidden", boxShadow:"0 2px 10px rgba(28,25,23,0.06)" }}>
                    <img src={p.url} alt={p.label} style={{ width:132, height:102, objectFit:"cover", display:"block" }}/>
                    <button type="button" onClick={()=>setPhotos(prev=>prev.filter((_,j)=>j!==i))} style={{ position:"absolute", top:6, right:6, width:24, height:24, borderRadius:"50%", background:"rgba(255,255,255,0.92)", border:"none", cursor:"pointer", fontWeight:700 }}>×</button>
                    <div style={{ background:"rgba(255,255,255,0.95)", padding:"5px 10px", fontSize:11, fontWeight:600, color:"#5C5147" }}>{p.label}</div>
                  </div>
                ))}
                <div style={{ width:132, height:132, borderRadius:12, border:"1.5px dashed #C8B89E", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#7A6E62", gap:4, background:"#fff" }}>
                  <span style={{ fontSize:26 }}>+</span><span style={{ fontSize:11, fontWeight:600, textAlign:"center" }}>Add photos</span>
                </div>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:12, fontSize:12, color:"#7A6E62", paddingTop: 4 }}>
                <span>🌞 Natural light</span><span>📐 Corners</span><span>🪟 Openings</span>
              </div>
            </div>

            <div style={flowSection}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>🏠</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Property &amp; room</span>
              </div>
              <div style={{ fontSize: 13, color: "#5C5147", marginBottom: 18, lineHeight: 1.55 }}>Nine common spaces — pick what matches this photoset (no maid room).</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
                {PTYPES.map(t=>(
                  <button key={t} type="button" onClick={()=>setPtype(t)} style={{ ...sel(ptype===t), display:"inline-flex", flexDirection:"row", alignItems:"center", gap:8, padding:"10px 16px", borderRadius:999, flex:"0 1 auto" }}>
                    <span style={{ fontSize: 18 }}>{t==="Apartment"?"🏢":t==="Independent House"?"🏠":"🏡"}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{t}</span>
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 10 }}>
                {REMODEL_ROOMS.map(({ label, icon }) => (
                  <button key={label} type="button" onClick={()=>setRoom(label)} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:12, cursor:"pointer", border:room===label?`2px solid ${OR}`:"1px solid #E8E4DE", background:room===label?"#FFFBF7":"#fff", fontSize:13, fontWeight:600, color:room===label?OR:"#1C1917", textAlign:"left", boxShadow: room===label ? "0 4px 14px -6px rgba(200,95,43,0.25)" : "0 1px 3px rgba(28,25,23,0.04)" }}>
                    <span style={{ fontSize: 20 }} aria-hidden>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={flowSection}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>📐</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Approximate size</span>
                <span style={{ fontSize: 12, color: "#A8A29E" }}>(feet)</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap", marginBottom:10 }}>
                {[["Length",len,setLen],["Breadth",breadth,setBreadth]].map(([lbl,val,fn],i)=>(
                  <React.Fragment key={lbl}>
                    {i===1 && <span style={{ fontSize:18, color:"#C8B89E" }}>×</span>}
                    <div><div style={{ fontSize:12, color:"#7A6E62", marginBottom:4 }}>{lbl}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <input value={val} onChange={e=>fn(e.target.value)} style={{ ...inputStyle, width:76 }}/><span style={{ fontSize:13 }}>ft</span>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
                <span style={{ fontSize:18, color:"#C8B89E" }}>=</span>
                <div style={{ background:"linear-gradient(180deg,#FFFBF7,#F5EFE8)", border:"1px solid #EEDCCB", borderRadius:12, padding:"12px 22px", textAlign:"center" }}>
                  <div style={{ fontSize:11, color:"#7A6E62" }}>Approx. area</div>
                  <div style={{ fontWeight:800, fontSize:22, color:OR }}>{area}</div>
                  <div style={{ fontSize:11, color:"#7A6E62" }}>sq ft</div>
                </div>
              </div>
              <div style={{ fontSize:12, color:"#7A6E62" }}>Rough numbers are fine — you can refine later with a site visit.</div>
            </div>
          </>}

          {/* ═══ STEP 2 ═══ */}
          {step===2 && <>
            <div className="craft-type-label mt-1 mb-4">
              <span style={{ color: "#C85F2B" }}>●</span>
              <span>Define outcome</span>
            </div>
            <h1 className="font-serif-display text-3xl md:text-[2.25rem] font-medium text-[#1C1917] tracking-tight leading-tight m-0 mb-3">
              What you want from this remodel
            </h1>
            <p style={{ fontSize: 14, color: "#57534E", margin: "0 0 22px", lineHeight: 1.6, maxWidth: 640 }}>
              Goals, pain points, and how deep you want to go — most remodels skew toward paint, carpentry, and services; bigger layout moves are optional.
            </p>

            <div style={flowSection}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>🎯</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Main goal</span>
                <span style={{ fontSize: 12, color: "#A8A29E" }}>one</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:12 }}>
                {GOAL_OPTS.map(g=>(
                  <button key={g.v} type="button" onClick={()=>setMainGoal(g.v)} style={{ ...sel(mainGoal===g.v), position:"relative", textAlign:"left", padding:"14px 16px", borderRadius:12, boxShadow: mainGoal===g.v ? "0 4px 16px -8px rgba(200,95,43,0.35)" : "0 1px 3px rgba(28,25,23,0.05)" }}>
                    {mainGoal===g.v && <div style={{ position:"absolute", top:10, right:10, width:18, height:18, borderRadius:"50%", background:OR, display:"flex", alignItems:"center", justifyContent:"center" }}><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg></div>}
                    <div style={{ fontSize:24, marginBottom:6 }}>{g.icon}</div>
                    <div style={{ fontWeight:700, fontSize:13 }}>{g.v}</div>
                    <div style={{ fontSize:11, color:"#7A6E62", marginTop:4, lineHeight:1.45 }}>{g.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={flowSection}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>What&apos;s not working</span>
                <span style={{ fontSize: 12, color: "#A8A29E" }}>multi</span>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {PAIN_OPTS.map(p=>{
                  const on = painPoints.includes(p);
                  return (
                    <button key={p} type="button" onClick={()=>togglePain(p)} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"9px 14px", borderRadius:999, cursor:"pointer", border:on?`2px solid ${OR}`:"1px solid #E8E4DE", background:on?"#FBE5D4":"#fff", position:"relative", fontSize:13, fontWeight:600, color:on?OR:"#1C1917" }}>
                      {on && <span style={{ width:8, height:8, borderRadius:"50%", background:OR }} aria-hidden />}
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={flowSection}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>🔧</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>How much change?</span>
              </div>
              <div style={{ fontSize: 13, color: "#5C5147", marginBottom: 14, lineHeight: 1.55 }}>Typical paths: refresh walls &amp; finishes, swap carpentry and services, or occasionally reconfigure structure.</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:12, marginBottom:12 }}>
                {[
                  { v:"Light Refresh",       icon:"🖌️", sub:"Mostly paint, lighting, and light décor — furniture can stay." },
                  { v:"Moderate Remodel",     icon:"🔨", sub:"Carpentry, wardrobes, kitchen/bath upgrades; services as needed." },
                  { v:"Full Transformation",  icon:"🏗️", sub:"Layout moves, civil changes, or full replan when you’re ready for it." },
                ].map(o=>(
                  <button key={o.v} type="button" onClick={()=>setChangeLevel(o.v)} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"16px 16px", borderRadius:14, cursor:"pointer", border:changeLevel===o.v?`2px solid ${OR}`:"1px solid #E8E4DE", background:changeLevel===o.v?"#FFFBF7":"#fff", textAlign:"left", boxShadow: changeLevel===o.v ? "0 6px 20px -10px rgba(200,95,43,0.3)" : "none" }}>
                    <span style={{ fontSize: 22 }} aria-hidden>{o.icon}</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:changeLevel===o.v?OR:"#1C1917", marginBottom:6 }}>{o.v}</div>
                      <div style={{ fontSize:12, color:"#7A6E62", lineHeight:1.5 }}>{o.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ fontSize:12, color:"#78716C" }}>You can revisit this after seeing v0 concepts.</div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>✏️</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Notes &amp; references</span>
                <span style={{ fontSize: 12, color: "#A8A29E" }}>(optional)</span>
              </div>
              <p style={{ fontSize: 13, color: "#5C5147", margin: "0 0 14px", lineHeight: 1.55, maxWidth: 640 }}>Anything you didn&apos;t already capture — mood, brands you like, or what must not change.</p>
              <textarea value={spaceNotes} onChange={e=>setSpaceNotes(e.target.value.slice(0,500))} placeholder="E.g. Keep the hall sofa; mainly new wall colour and TV wall. Prefer warm oak, not glossy white." rows={4} style={{ ...inputStyle, width:"100%", maxWidth:640, resize:"vertical", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif", marginBottom:10 }}/>
              <div style={{ fontSize:11, color:"#9A8F87", marginBottom:16 }}>{spaceNotes.length}/500</div>
              <div style={{ fontSize:12, color:"#5C5147", fontWeight:600, marginBottom:8 }}>Reference images</div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                <div style={{ width:72, height:72, borderRadius:12, border:"1.5px dashed #C8B89E", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#7A6E62", flexDirection:"column", gap:2, background:"#FDFBF8" }}>
                  <span style={{ fontSize:22 }}>+</span><span style={{ fontSize:10, fontWeight:600 }}>Add</span>
                </div>
                {refImgs.map((img,i)=>(
                  <div key={i} style={{ position:"relative", borderRadius:12, overflow:"hidden", boxShadow:"0 2px 8px rgba(28,25,23,0.08)" }}>
                    <img src={img} alt="" style={{ width:96, height:72, objectFit:"cover", display:"block" }}/>
                    <button type="button" onClick={()=>setRefImgs(prev=>prev.filter((_,j)=>j!==i))} style={{ position:"absolute", top:4, right:4, width:22, height:22, borderRadius:"50%", background:"rgba(255,255,255,0.92)", border:"none", cursor:"pointer", fontSize:12, lineHeight:1 }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          </>}

          {/* ═══ STEP 3 ═══ */}
          {step===3 && <>
            <div className="craft-type-label mt-1 mb-4">
              <span style={{ color: "#C85F2B" }}>●</span>
              <span>Set constraints</span>
            </div>
            <h1 className="font-serif-display text-3xl md:text-[2.25rem] font-medium text-[#1C1917] tracking-tight leading-tight m-0 mb-3">
              Budget, timeline & boundaries
            </h1>
            <p style={{ fontSize: 14, color: "#57534E", margin: "0 0 28px", lineHeight: 1.6, maxWidth: 640 }}>
              Same budget control as new home — <strong>lakhs or crores</strong> on a 0–99 slider — plus when you want work to start and finish.
            </p>

            <div style={flowSection}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 16 }}>₹</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>1. Budget for this remodel</span>
                <span style={{ fontSize: 12, color: "#78716C", fontWeight: 600 }}>(required · above ₹0)</span>
              </div>
              <div style={{ fontSize: 13, color: "#5C5147", marginBottom: 16, maxWidth: 560, lineHeight: 1.55 }}>
                Choose <strong>lakhs</strong> or <strong>crores</strong>, then set the amount from <strong>0 to 99</strong> (all-in band for this scope — materials, labour, finishes).
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", marginBottom: 18 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, fontWeight: 600, color: "#78716C", letterSpacing: "0.04em" }}>
                  AMOUNT IN
                  <select
                    value={budgetUnit}
                    onChange={(e) => setBudgetUnit(e.target.value)}
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
                <div style={{ fontSize: 28, fontWeight: 800, color: "#C85F2B", fontVariantNumeric: "tabular-nums", paddingBottom: 2 }}>{remodelBudgetLabel(budgetUnit, budgetAmount)}</div>
              </div>
              <div style={{ maxWidth: 420, marginBottom: 8 }}>
                <input
                  type="range"
                  min={0}
                  max={99}
                  value={budgetAmountClampedRemodel(budgetAmount)}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  style={{ width: "100%", accentColor: "#C85F2B", cursor: "pointer" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#A8A29E", marginTop: 6 }}>
                  <span>0</span>
                  <span>99</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#A8A29E", lineHeight: 1.5, marginBottom: 16 }}>Indicative band — final numbers follow site survey and selections.</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#44403C", marginBottom: 6 }}>Extra notes on cost (optional)</div>
              <textarea
                value={budgetNotes}
                onChange={(e) => setBudgetNotes(e.target.value)}
                placeholder="E.g. stretch for kitchen counters only, or phase paint first…"
                rows={2}
                style={{ width: "100%", maxWidth: 560, border: "1px solid #E7E5E4", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#1C1917", resize: "none", outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans',sans-serif", background: "#FAFAF9" }}
              />
            </div>

            <div style={flowSection}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                <span style={{ fontSize: 16 }}>📅</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>2. Project timeline</span>
                <span style={{ fontSize: 12, color: "#A8A29E", fontWeight: 500 }}>(optional)</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start", maxWidth: 520 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#5C5147", marginBottom: 6 }}>When do you plan to start?</div>
                  <select
                    value={startTimeline}
                    onChange={(e) => setStartTimeline(e.target.value)}
                    style={{ width: "100%", border: "1px solid #D6D3D1", borderRadius: 8, padding: "10px 12px", fontSize: 13, background: "#fff", color: "#1C1917", cursor: "pointer", boxSizing: "border-box" }}
                  >
                    {["Immediately","Within 3 Months","3–6 Months","6–12 Months","Not Sure"].map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#5C5147", marginBottom: 6 }}>Expected completion</div>
                  <select
                    value={completionTime}
                    onChange={(e) => setCompletionTime(e.target.value)}
                    style={{ width: "100%", border: "1px solid #D6D3D1", borderRadius: 8, padding: "10px 12px", fontSize: 13, background: "#fff", color: "#1C1917", cursor: "pointer", boxSizing: "border-box" }}
                  >
                    {["6 - 9 Months","9 - 12 Months","12 - 18 Months","18 - 24 Months","24 Months+"].map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 12, lineHeight: 1.45 }}>Starting early usually helps lock materials and crew.</div>
            </div>

            {/* Layout change */}
            <div style={{ ...cardStyle, border: "1px solid #E8E4DE", boxShadow: "none" }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>3. Are you okay changing the layout? <span style={{ fontWeight:400, color:"#7A6E62", fontSize:13 }}>(moving walls, kitchen, etc.)</span></div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                {[
                  { v:"Yes, open to changes", sub:"I'm open to layout, wall or space changes." },
                  { v:"No, keep layout same",  sub:"I want to retain the existing layout." },
                  { v:"Not sure",              sub:"I'll decide after seeing the design options." },
                ].map(o => (
                  <button key={o.v} onClick={()=>setLayoutOk(o.v)} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"14px 14px", borderRadius:10, cursor:"pointer", border:layoutOk===o.v?`2px solid ${OR}`:"1.5px solid #D1C9BF", background:layoutOk===o.v?"#FBE5D4":"#fff", textAlign:"left", position:"relative" }}>
                    {layoutOk===o.v && <div style={{ position:"absolute", top:8, right:8, width:18, height:18, borderRadius:"50%", background:OR, display:"flex", alignItems:"center", justifyContent:"center" }}><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg></div>}
                    <div style={{ width:14, height:14, borderRadius:"50%", border:layoutOk===o.v?`4px solid ${OR}`:"2px solid #C8B89E", background:layoutOk===o.v?"#fff":"transparent", flexShrink:0, marginTop:2 }} />
                    <div>
                      <div style={{ fontWeight:700, fontSize:13, color:layoutOk===o.v?OR:"#1C1917", marginBottom:4 }}>{o.v}</div>
                      <div style={{ fontSize:11, color:"#7A6E62", lineHeight:1.5 }}>{o.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Must-keep */}
            <div style={{ ...cardStyle, border: "1px solid #E8E4DE", boxShadow: "none" }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>4. What should stay as-is in <span style={{ color:OR }}>{room}</span>? <span style={{ fontWeight:400, color:"#7A6E62" }}>(optional)</span></div>
              <div style={{ fontSize:13, color:"#7A6E62", marginBottom:14 }}>Hall, bedroom, or study — tick what must not move while we repaint, redo services, or refresh carpentry.</div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:10 }}>
                {["Mostly walls / paint only","Keep large furniture (sofa, bed, etc.)","Keep flooring as-is","Keep layout & services","Doors & windows","False ceiling","Other"].map(mk => {
                  const on = mustKeep.includes(mk);
                  return (
                    <button key={mk} onClick={()=>setMustKeep(prev=>on?prev.filter(x=>x!==mk):[...prev,mk])} style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 14px", borderRadius:8, cursor:"pointer", border:on?`2px solid ${OR}`:"1.5px solid #D1C9BF", background:on?"#FBE5D4":"#fff" }}>
                      {on && <div style={{ width:14, height:14, borderRadius:3, background:OR, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg></div>}
                      <span style={{ fontSize:13, fontWeight:600, color:on?OR:"#1C1917" }}>{mk}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ background:"#EBF3FB", border:"1px solid #C3DCF0", borderRadius:8, padding:"8px 12px", display:"flex", alignItems:"center", gap:6 }}>
                <span>ℹ️</span><span style={{ fontSize:12, color:"#2A6496" }}>You can select multiple, but we'll prioritise the most important ones.</span>
              </div>
            </div>

            {/* Dealbreakers */}
            <div style={{ ...cardStyle, border: "1px solid #E8E4DE", boxShadow: "none" }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>5. Dealbreakers <span style={{ fontWeight:400, color:"#7A6E62" }}>(optional)</span></div>
              <div style={{ fontSize:13, color:"#7A6E62", marginBottom:14 }}>Hard limits for this phase — we’ll route designs around them.</div>
              <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                {["No wall breaking","No plumbing changes","No major construction","Avoid dust / noise","Other"].map(d => {
                  const on = dealbreakers3.includes(d);
                  return (
                    <label key={d} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                      <div onClick={()=>setDealbreakers3(prev=>on?prev.filter(x=>x!==d):[...prev,d])} style={{ width:16, height:16, borderRadius:4, border:on?`2px solid ${OR}`:"2px solid #C8B89E", background:on?OR:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                        {on && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>}
                      </div>
                      <span style={{ fontSize:13, fontWeight:500, color:"#1C1917" }}>{d}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </>}

          {/* ═══ STEP 4 ═══ */}
          {step===4 && <>
            <div className="craft-type-label mt-1 mb-4">
              <span style={{ color: "#C85F2B" }}>●</span>
              <span>Choose style</span>
            </div>
            <h1 className="font-serif-display text-3xl md:text-[2.25rem] font-medium text-[#1C1917] tracking-tight leading-tight m-0 mb-3">
              Look, materials & colour
            </h1>
            <p style={{ fontSize: 14, color: "#57534E", margin: "0 0 28px", lineHeight: 1.6, maxWidth: 640 }}>
              Select your preferred style and finish so designs match your taste.
            </p>

            {/* Style cards */}
            <div style={{ ...cardStyle, border: "1px solid #E8E4DE", boxShadow: "0 2px 12px rgba(28,25,23,0.04)" }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>1. Select your preferred style <span style={{ fontWeight:400, color:"#7A6E62" }}>(Choose up to 2)</span></div>
              <div style={{ display:"flex", gap:12, marginTop:12, flexWrap:"wrap" }}>
                {[
                  { v:"Modern",        img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=150&q=70" },
                  { v:"Minimalist",    img:"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150&q=70" },
                  { v:"Scandinavian",  img:"https://images.unsplash.com/photo-1592229506151-845940174bb0?w=150&q=70" },
                  { v:"Contemporary", img:"https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=150&q=70" },
                  { v:"Traditional",   img:"https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=150&q=70" },
                ].map(s => {
                  const on = styles.includes(s.v);
                  return (
                    <button key={s.v} type="button" onClick={()=>toggleStyle(s.v)} style={{ cursor:"pointer", borderRadius:12, overflow:"hidden", border:"none", padding:0, background:"transparent", boxShadow: on ? `0 0 0 2px ${OR}, 0 4px 14px -6px rgba(200,95,43,0.25)` : "0 1px 4px rgba(28,25,23,0.08)", width:112, flexShrink:0, position:"relative", font:"inherit" }}>
                      {on && <div style={{ position:"absolute", top:6, right:6, width:20, height:20, borderRadius:"50%", background:OR, display:"flex", alignItems:"center", justifyContent:"center", zIndex:1 }}><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg></div>}
                      <img src={s.img} alt={s.v} style={{ width:"100%", height:86, objectFit:"cover", display:"block" }}/>
                      <div style={{ padding:"8px 8px", fontSize:12, fontWeight:600, color:on?OR:"#1C1917", background:"#fff", textAlign:"center" }}>{s.v}</div>
                    </button>
                  );
                })}
                <div style={{ cursor:"default", borderRadius:12, border:"1px dashed #C8B89E", width:112, flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6, height:118, background:"#FDFBF8" }}>
                  <span style={{ fontSize:26 }}>🎨</span>
                  <div style={{ fontSize:11, fontWeight:600, color:"#7A6E62", textAlign:"center", padding: "0 6px" }}>Describe in notes</div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:12, fontSize:12, color:"#7A6E62" }}>
                <span>ℹ️</span><span>Up to 2 styles — we blend them in the concept.</span>
              </div>
            </div>

            {/* Material finish */}
            <div style={{ ...cardStyle, border: "1px solid #E8E4DE", boxShadow: "none" }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>2. Choose your material &amp; finish preference</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 }}>
                {[
                  { v:"Budget Friendly", icon:"💼", sub:"Practical and durable materials that are easy on the budget." },
                  { v:"Mid Range",       icon:"🛋️", sub:"Good quality materials with a balance of style, durability and cost." },
                  { v:"Premium",         icon:"💎", sub:"High-end materials and finishes for a luxurious look and feel." },
                ].map(f => {
                  const on = finishTier === f.v;
                  return (
                    <button key={f.v} onClick={()=>setFinishTier(f.v)} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"14px", borderRadius:10, cursor:"pointer", border:on?`2px solid ${OR}`:"1.5px solid #D1C9BF", background:on?"#FBE5D4":"#fff", textAlign:"left", position:"relative" }}>
                      {on && <div style={{ position:"absolute", top:8, right:8, width:18, height:18, borderRadius:"50%", background:OR, display:"flex", alignItems:"center", justifyContent:"center" }}><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg></div>}
                      <span style={{ fontSize:24, flexShrink:0 }}>{f.icon}</span>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13, color:on?OR:"#1C1917", marginBottom:4 }}>{f.v}</div>
                        <div style={{ fontSize:11, color:"#7A6E62", lineHeight:1.5 }}>{f.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div style={{ background:"#F0F8EE", border:"1px solid #C3DEB8", borderRadius:8, padding:"7px 12px", display:"flex", alignItems:"center", gap:6 }}>
                <span>🌿</span><span style={{ fontSize:12, color:"#2A6A30" }}>This helps us recommend the right materials and accurate estimates.</span>
              </div>
            </div>

            {/* Interior colours — primary + secondary (same pattern as new home) */}
            <div style={{ ...cardStyle, border: "1px solid #E8E4DE", boxShadow: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>🎨</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>3. Interior colour scheme</span>
              </div>
              <div style={{ fontSize: 13, color: "#7A6E62", marginBottom: 14, lineHeight: 1.55 }}>
                Primary field colour and a secondary for trims, niches, or accent walls — presets plus any hex you want.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 12 }}>
                {[
                  { title: "Primary / main", key: "base", state: colourBase, set: setColourBase, hint: "Walls & large fields" },
                  { title: "Secondary / accent", key: "sec", state: colourSecondary, set: setColourSecondary, hint: "Trims, feature wall, wood tones" },
                ].map((slot) => (
                  <div key={slot.key}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#44403C", marginBottom: 4 }}>{slot.title}</div>
                    <div style={{ fontSize: 10, color: "#A8A29E", marginBottom: 10 }}>{slot.hint}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#78716C", marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>{normalizeHexColor(slot.state) || slot.state}</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      {PALETTE_PRESET_HEX.map((c) => {
                        const pk = normalizeHexColor(c);
                        const selected = normalizeHexColor(slot.state) === pk;
                        return (
                          <ColourHexSwatch
                            key={`${slot.key}-${c}`}
                            colour={c}
                            selected={selected}
                            onClick={() => {
                              const h = normalizeHexColor(c);
                              if (h) slot.set(h);
                            }}
                          />
                        );
                      })}
                      <ColourOctagonCustom
                        onPick={(raw) => {
                          const h = normalizeHexColor(raw);
                          if (h) slot.set(h);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inspiration images */}
            <div style={{ ...cardStyle, border: "1px solid #E8E4DE", boxShadow: "none" }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>4. Add inspiration images <span style={{ fontWeight:400, color:"#7A6E62" }}>(optional)</span></div>
              <div style={{ fontSize:13, color:"#7A6E62", marginBottom:14 }}>Upload images that you like. This helps us understand your taste better.</div>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <div style={{ width:120, height:90, borderRadius:10, border:"1.5px dashed #C8B89E", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#7A6E62", gap:4 }}>
                  <span style={{ fontSize:24 }}>+</span>
                  <div style={{ fontSize:11, fontWeight:600, textAlign:"center" }}>Upload Images</div>
                  <div style={{ fontSize:9, color:"#9A8F87", textAlign:"center" }}>JPG, PNG up to 10MB each</div>
                </div>
                {inspirationImgs.map((img,i) => (
                  <div key={i} style={{ position:"relative", borderRadius:10, overflow:"hidden" }}>
                    <img src={img} alt="" style={{ width:120, height:90, objectFit:"cover", display:"block" }}/>
                    <button onClick={()=>setInspirationImgs(prev=>prev.filter((_,j)=>j!==i))} style={{ position:"absolute", top:4, right:4, width:20, height:20, borderRadius:"50%", background:"rgba(255,255,255,0.9)", border:"none", cursor:"pointer", fontSize:12, lineHeight:1 }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          </>}

          {/* ═══ STEP 5 — Review brief ═══ */}
          {step===5 && <>
            <div className="craft-type-label mt-1 mb-4">
              <span style={{ color: "#C85F2B" }}>●</span>
              <span>Review</span>
            </div>
            <h1 className="font-serif-display text-3xl md:text-[2.25rem] font-medium text-[#1C1917] tracking-tight leading-tight m-0 mb-2">
              Review your remodel brief
            </h1>
            <p style={{ fontSize: 14, color: "#57534E", margin: "0 0 20px", lineHeight: 1.6, maxWidth: 640 }}>
              The architect will see the <strong>same</strong> inputs: photos, room, goals, pain points, budget, and style. Next you&rsquo;ll
              pay to unlock the AI v0, then pay again to assign a professional for real drawings before you use the project hub.
            </p>
            <div style={{ ...cardStyle, maxWidth: 640 }}>
              {[
                ["Room", room],
                ["Property", ptype],
                ["Size", area > 0 ? `${len} ft × ${breadth} ft (${area} sq ft)` : "—"],
                ["Main goal", mainGoal || "—"],
                ["Budget", remodelBudgetLabel(budgetUnit, budgetAmount)],
                ["Timeline", `${startTimeline} → ${completionTime}`],
                ["Style", styles.join(" + ")],
                ["Finish", finishTier],
                ["Layout change", layoutOk],
                ["Must keep", mustKeep.length ? mustKeep.join(", ") : "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderTop: "1px solid #F0EBE3", fontSize: 13 }}>
                  <span style={{ color: "#7A6E62" }}>{k}</span>
                  <span style={{ fontWeight: 600, textAlign: "right", lineHeight: 1.4, maxWidth: 320 }}>{v}</span>
                </div>
              ))}
            </div>
          </>}

          {/* ═══ STEP 6 — Pay + v0 ═══ */}
          {step===6 && <>
            <div className="craft-type-label mt-1 mb-4">
              <span style={{ color: "#C85F2B" }}>●</span>
              <span>AI v0</span>
            </div>
            <h1 className="font-serif-display text-3xl md:text-[2.25rem] font-medium text-[#1C1917] tracking-tight leading-tight m-0 mb-2">
              Pay, then run your v0
            </h1>
            <p style={{ fontSize: 14, color: "#57534E", margin: "0 0 18px", lineHeight: 1.6, maxWidth: 640 }}>
              First you complete v0 access payment. We generate from your <strong>full</strong> brief. After you see the concept, a second
              payment routes the job to a professional for working drawings.
            </p>
            <ProjectFlowPayment
              variant="preV0"
              paid={preV0Paid}
              onCompletePayment={() => {
                setPreV0Paid(true);
                setRemodelFlow({ preV0: true });
                setStepBlockError("");
              }}
            />
            {preV0Paid && !v0Generated && !v0Generating && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Generate v0 for {room}</div>
                <p style={{ fontSize: 13, color: "#57534E", lineHeight: 1.5, margin: "0 0 12px" }}>Indicative visuals and layout direction only — your pro turns this into buildable work.</p>
                <button type="button" onClick={runRemodelV0} className="btn-continue !rounded-xl !px-6 !py-3.5 text-sm">Generate v0</button>
              </div>
            )}
            {v0Generating && (
              <div style={{ padding: "24px 18px", textAlign: "center", background: "#FFFBF7", border: "1px solid #EEDCCB", borderRadius: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Running v0…</div>
                <div style={{ fontSize: 12, color: "#7A6E62", lineHeight: 1.55 }}>
                  Image API first, then estimate &amp; project skeleton (second API). Separate keys on the server.
                </div>
              </div>
            )}

            {v0Generated && (<>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:16 }}>
              <div>
                <h2 className="font-serif-display text-2xl font-medium text-[#1C1917] m-0 mb-2">
                  Your v0 concept is ready
                </h2>
                <p style={{ fontSize: 14, color: "#57534E", margin: 0, lineHeight: 1.6, maxWidth: 520 }}>
                  Here&apos;s a first design direction from everything you shared.
                </p>
              </div>
              <button type="button" style={{ background:"#fff", border:"1.5px solid #D1C9BF", borderRadius:9, padding:"9px 18px", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                🎯 View in 3D
              </button>
            </div>

            {/* Quick stats */}
            <div style={{ border:"1px solid #EEDCCB", borderRadius:14, padding:"16px 22px", marginBottom:20, display:"flex", flexWrap:"wrap", gap:"20px 36px", background:"linear-gradient(180deg,#FFFBF7,#FDFBF8)" }}>
              {[
                { icon:"🛋️", label:"Style",        val: styles.join(" + ") },
                { icon:"₹",   label:"Budget",       val: remodelBudgetLabel(budgetUnit, budgetAmount) },
                { icon:"📅",  label:"Timeline",     val: `${startTimeline} → ${completionTime}` },
                { icon:"📐",  label:"Layout", val: layoutOk },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#7A6E62", marginBottom:2 }}><span>{s.icon}</span>{s.label}</div>
                  <div style={{ fontWeight:700, fontSize:14, color:"#1C1917" }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* AI variants — 2 free, 3rd paid (same idea as new home) */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>AI concept directions</div>
              <p style={{ fontSize: 13, color: "#5C5147", margin: "0 0 14px", lineHeight: 1.55, maxWidth: 640 }}>
                You get <strong>two AI-generated v0 images free</strong>. A <strong>third direction</strong> unlocks when you add paid credits — same rule set as new home.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                {[
                  { n: 1, label: "Direction A", free: true },
                  { n: 2, label: "Direction B", free: true },
                  { n: 3, label: "Direction C", free: false },
                ].map((d) => (
                  <div key={d.n} style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: d.free ? `1px solid #EEDCCB` : "1px dashed #C8B89E", background: d.free ? "#fff" : "#F8F4EF", minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 12 }}>
                    {!d.free && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(253,251,248,0.82)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: 10 }}>
                        <span style={{ fontSize: 22 }}>🔒</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#57534E", textAlign: "center" }}>Add credits to generate</span>
                      </div>
                    )}
                    <div style={{ fontSize: 11, fontWeight: 700, color: d.free ? OR : "#78716C" }}>{d.label}{d.free ? " · Free" : ""}</div>
                    <div style={{ fontSize: 10, color: "#9A8F87", marginTop: 4 }}>{d.free ? "Included in v0" : "Third option"}</div>
                  </div>
                ))}
              </div>
            </div>

            <ProjectFlowPayment
              variant="postV0"
              paid={postV0Paid}
              onCompletePayment={() => {
                setPostV0Paid(true);
                setRemodelFlow({ postV0: true });
                setStepBlockError("");
              }}
            />

            {/* BEFORE / AFTER */}
            <div style={{ ...cardStyle, border: "1px solid #E8E4DE", boxShadow: "0 4px 20px -8px rgba(28,25,23,0.08)" }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>{room} — first AI v0</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", borderRadius:12, overflow:"hidden", border:"1px solid #EEDCCB", position:"relative", marginBottom:12 }}>
                <div style={{ position:"relative" }}>
                  <div style={{ position:"absolute", top:10, left:10, background:"rgba(0,0,0,0.55)", color:"#fff", fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:4, zIndex:1 }}>BEFORE</div>
                  <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=75" alt="before" style={{ width:"100%", height:200, objectFit:"cover", display:"block" }}/>
                </div>
                <div style={{ position:"relative" }}>
                  <div style={{ position:"absolute", top:10, left:10, background:"#22A36B", color:"#fff", fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:4, zIndex:1 }}>AFTER (AI v0)</div>
                  <img src={v0ImageBundle?.images?.[0]?.url || "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400&q=75"} alt="after AI v0" style={{ width:"100%", height:200, objectFit:"cover", display:"block" }}/>
                </div>
                <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", background:"rgba(255,255,255,0.95)", border:"1px solid #EEDCCB", borderRadius:"50%", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, zIndex:2, cursor:"pointer", fontSize:14 }}>⟷</div>
              </div>
              <div style={{ background:"#FBF6F0", border:"1px solid #EEDCCB", borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#44403C", marginBottom:8 }}>After this AI pass</div>
                <p style={{ fontSize:12, color:"#57534E", lineHeight:1.6, margin:0 }}>
                  This v0 is a machine first draft. Your <strong>architect or assigned professional</strong> will review it, tighten the layout and materials, and share solid options — you are <strong>not</strong> limited to “our” in-house expert; you keep working with <strong>your</strong> design partner.
                </p>
              </div>
              <div style={{ fontSize:12, fontWeight:600, color:"#44403C", marginBottom:6 }}>Anything to add while they review? <span style={{ fontWeight:400, color:"#78716C" }}>(optional)</span></div>
              <textarea
                value={postAiNotes}
                onChange={(e) => setPostAiNotes(e.target.value.slice(0, 400))}
                placeholder="E.g. prefer matte finishes, keep the puja corner untouched, or share vendor constraints…"
                rows={3}
                style={{ width:"100%", border:"1px solid #E7E5E4", borderRadius:8, padding:"10px 12px", fontSize:13, resize:"vertical", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box", background:"#FAFAF9" }}
              />
              <div style={{ fontSize:11, color:"#9A8F87", marginTop:4 }}>{postAiNotes.length}/400</div>
            </div>

            {/* Single narrative — replaces rigid included / not-included grid */}
            <div style={{ ...flowSection, marginBottom: 18 }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:10 }}>What this concept is (and isn&apos;t)</div>
              <p style={{ fontSize:13, color:"#57534E", lineHeight:1.65, margin:"0 0 14px" }}>
                The preview above is an <strong>AI-generated concept</strong> from your photos and brief — not a final working drawing. Scope (paint, carpentry, civil, services) will be confirmed with your professional after sign-off.
              </p>
              <p style={{ fontSize:13, color:"#57534E", lineHeight:1.65, margin:"0 0 12px" }}>
                Next: use the <strong>architect handoff</strong> step to export your full brief, then <strong>open the project room</strong> to onboard your build team.
              </p>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:12, marginBottom:8 }}>
              {[
                { icon:"✏️", title:"Request tweaks", sub:"Layout, palette, storage, or phasing — your expert updates the brief.", toProject: false },
                { icon:"🔄", title:"Regenerate v0", sub:"Spin another AI direction (within your free / paid limits).", toProject: false },
                { icon:"🚀", title:"Go to detailed design", sub:"Lock a direction and open tasks, milestones, and site coordination.", toProject: true },
              ].map(a => (
                <button
                  key={a.title}
                  type="button"
                  onClick={() => {
                    if (!a.toProject) return;
                    if (!postV0Paid) {
                      setStepBlockError("Complete the professional drawing package payment so your architect can take over with real plans.");
                      return;
                    }
                    setStep(7);
                  }}
                  style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"16px", borderRadius:14, cursor:"pointer", border:"1px solid #E8E4DE", background:"#fff", textAlign:"left", boxShadow:"0 2px 10px rgba(28,25,23,0.04)" }}
                >
                  <span style={{ fontSize:22 }} aria-hidden>{a.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{a.title}</div>
                    <div style={{ fontSize:12, color:"#7A6E62", lineHeight:1.45 }}>{a.sub}</div>
                  </div>
                  <span style={{ color:OR, fontSize:16, fontWeight:700 }}>→</span>
                </button>
              ))}
            </div>
            </>)}
          </>}

          {/* ═══ STEP 7 — Architect & project hub ═══ */}
          {step===7 && <>
            <div className="craft-type-label mt-1 mb-4">
              <span style={{ color: "#C85F2B" }}>●</span>
              <span>Handoff</span>
            </div>
            <h1 className="font-serif-display text-3xl md:text-[2.25rem] font-medium text-[#1C1917] tracking-tight leading-tight m-0 mb-2">
              Initial draft for your architect
            </h1>
            <p style={{ fontSize: 14, color: "#57534E", margin: "0 0 16px", lineHeight: 1.6, maxWidth: 640 }}>
              The JSON below is the same structured data we send with your v0. Your pro can comment, clarify, and issue real plans. Then open project management to add contractors and run the build.
            </p>
            <div style={{ background: "#F7F3EE", border: "1px solid #E6DFD3", borderRadius: 12, padding: 14, marginBottom: 16, maxHeight: 280, overflow: "auto" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#44403C", marginBottom: 6 }}>Remodel brief (read-only export)</div>
              <pre style={{ margin: 0, fontSize: 10, lineHeight: 1.4, color: "#292524", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
{JSON.stringify(
                {
                  room, ptype, len, breadth, photos, spaceNotes, mainGoal, painPoints, changeLevel, budgetUnit, budgetAmount, budgetNotes,
                  startTimeline, completionTime, layoutOk, mustKeep, dealbreakers3, styles, finishTier, colourBase, colourSecondary, postAiNotes,
                },
                null,
                2
              )}
              </pre>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#44403C", marginBottom: 6 }}>Note for the architect (optional)</div>
            <textarea
              value={architectHandoffNote}
              onChange={(e) => {
                const v = e.target.value.slice(0, 1200);
                setArchitectHandoffNote(v);
                setRemodelFlow({ architectComment: v });
              }}
              placeholder="Access constraints, vendor preferences, or phasing for your professional…"
              rows={4}
              style={{ width: "100%", maxWidth: 640, border: "1px solid #E7E5E4", borderRadius: 8, padding: "10px 12px", fontSize: 13, resize: "vertical", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box", background: "#FAFAF9" }}
            />
            <p style={{ fontSize: 13, color: "#57534E", lineHeight: 1.55, marginTop: 16, marginBottom: 0 }}>
              Project management is your shared room for architects, contractors, and homeowners — from this handoff into site.
            </p>
          </>}

          <div style={{ marginTop: 44, paddingTop: 28, borderTop: "1px solid #EDE8E0" }}>
            {stepBlockError ? (
              <div role="alert" style={{ marginBottom: 16, fontSize: 13, color: "#B45309", fontWeight: 500, lineHeight: 1.45 }}>
                {stepBlockError}
              </div>
            ) : null}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                disabled={step === 6 && (!preV0Paid || !v0Generated || !postV0Paid)}
                className="btn-continue text-sm md:text-[15px] !px-6 !py-3 md:!px-8 md:!py-3.5 !shadow-[0_8px_22px_-8px_rgba(200,95,43,0.45)] !rounded-[999px] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  setStepBlockError("");
                  if (step === 3 && budgetAmountClampedRemodel(budgetAmount) < 1) {
                    setStepBlockError("Please set a remodel budget above zero (same rule as new home).");
                    return;
                  }
                  if (step === 5) {
                    setStep(6);
                    return;
                  }
                  if (step === 6) {
                    if (!preV0Paid) {
                      setStepBlockError("Complete the v0 access payment to run the AI on your full brief.");
                      return;
                    }
                    if (!v0Generated) {
                      setStepBlockError("Generate your v0 first — the button is above when payment is done.");
                      return;
                    }
                    if (!postV0Paid) {
                      setStepBlockError("Complete the professional drawing package so a human can produce real plans for site.");
                      return;
                    }
                    setRemodelFlow({
                      preV0: true,
                      postV0: true,
                      v0: true,
                    });
                    setStep(7);
                    return;
                  }
                  if (step === 7) {
                    navigate("/project?source=remodel&phase=handoff");
                    return;
                  }
                  if (step < 5) setStep((s) => s + 1);
                }}
              >
                {step === 5 && "Continue to v0 & payment"}
                {step === 6 && "Continue to architect handoff"}
                {step === 7 && "Open project management"}
                {step < 5 && "Continue"}
                <svg className="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

        </main>

        <RightPanel
          step={step}
          room={room}
          ptype={ptype}
          len={len}
          breadth={breadth}
          photos={photos}
          spaceNotes={spaceNotes}
          mainGoal={mainGoal}
          changeLevel={changeLevel}
          budgetUnit={budgetUnit}
          budgetAmount={budgetAmount}
          layoutOk={layoutOk}
          mustKeep={mustKeep}
          dealbreakers3={dealbreakers3}
          styles={styles}
          finishTier={finishTier}
          startTimeline={startTimeline}
          completionTime={completionTime}
          colourBase={colourBase}
          colourSecondary={colourSecondary}
        />
      </div>
    </div>
  );
}
