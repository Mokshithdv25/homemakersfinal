import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { HmHeaderBrandLockup } from "../components/HmBrandLockup";
import { HM_HEADER_BAR_CLASS, HM_TAGLINE_BUILD_CHOOSER } from "../lib/hmBrand";

const NAV_LINKS = ["Software", "Find Pros", "My Project", "Shop"];

const NEW_HOME_STEPS = [
  { icon: "📍", label: "Define Plot" },
  { icon: "🏗️", label: "Configure Floors" },
  { icon: "🎨", label: "Select Aesthetic" },
  { icon: "₹", label: "Get V0 Design & Estimate" },
];

const RENOVATE_STEPS = [
  { icon: "🏠", label: "Choose Target Areas" },
  { icon: "🔍", label: "Assess Structure" },
  { icon: "⬆️", label: "Define Upgrades" },
  { icon: "₹", label: "Get V0 Design & Estimate" },
];

function StepIcon({ icon, label }) {
  return (
    <div
      className="flex flex-col items-center gap-2 flex-1 min-w-[56px]"
      style={{ maxWidth: 88 }}
    >
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          width: 44,
          height: 44,
          border: "1px solid #EEDCCB",
          background: "linear-gradient(180deg, #FFFBF7 0%, #F5EFE8 100%)",
          fontSize: 17,
          boxShadow: "0 1px 2px rgba(28,25,23,0.04)",
        }}
      >
        {icon}
      </div>
      <div
        className="text-center font-medium leading-snug"
        style={{ fontSize: 11, color: "#57534E", lineHeight: 1.35 }}
      >
        {label}
      </div>
    </div>
  );
}

function StepDivider() {
  return (
    <div
      className="flex shrink-0 items-center self-center px-0.5 text-[#D6CFC4] text-xs font-light select-none"
      style={{ paddingTop: 14 }}
      aria-hidden
    >
      ›
    </div>
  );
}

function FeatureRow({ text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M3 8 L6.5 11.5 L13 5" stroke="#C85F2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ fontSize: 14, color: "#3D3530" }}>{text}</span>
    </div>
  );
}

export default function WhatAreYouBuilding() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("new");

  return (
    <div className="relative min-h-screen bg-[#FBF7F2] overflow-x-hidden" style={{ fontFamily: "'DM Sans',Inter,system-ui,sans-serif", color: "#1C1917" }}>
      {/* Background accents matching the homepage */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(193,132,78,0.08),transparent_50%)]" aria-hidden />

      <header className={HM_HEADER_BAR_CLASS}>
        <HmHeaderBrandLockup tagline={HM_TAGLINE_BUILD_CHOOSER} />
        <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-auto">
          <nav className="hidden lg:flex items-center gap-5 mr-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link}
                type="button"
                onClick={() => { if (link === "My Project") navigate("/project"); }}
                className="bg-transparent border-none text-sm text-[#44403C] cursor-pointer font-medium inline-flex items-center gap-1"
              >
                {link}
                {link === "Software" && (
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

      {/* ── MAIN ── */}
      <main className="max-w-[920px] mx-auto px-5 md:px-8 pb-20 md:pb-24 pt-8 md:pt-10">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 border-none bg-transparent p-0 cursor-pointer text-sm text-[#5C5147] hover:text-[#C85F2B] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back
        </button>

        {/* Heading */}
        <div className="text-center mb-10 md:mb-12">
          <h1 className="font-serif-display text-3xl md:text-[2.35rem] font-semibold text-[#1C1917] tracking-tight leading-tight m-0 mb-3">
            What are you building?
          </h1>
          <p className="text-[15px] md:text-base text-[#57534E] leading-relaxed max-w-md mx-auto m-0">
            Tell us your goal — we&apos;ll tailor the entire experience to get you the
            most accurate AI designs, estimates, and plans.
          </p>
        </div>

        {/* Cards — cream surfaces like Build / Remodel, not flat white boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">

          {/* Card 1 – Build a New Home (no role=button — avoids invalid nesting with inner CTA) */}
          <div
            tabIndex={0}
            role="group"
            aria-label="Build a New Home"
            onClick={() => setSelected("new")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected("new"); } }}
            className="rounded-2xl cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#4A90D9] focus-visible:ring-offset-2"
            style={{
              background: "linear-gradient(180deg, #FFFBF7 0%, #FDFBF8 55%, #F8F4EF 100%)",
              padding: "28px 24px 26px",
              border: selected === "new" ? "2px solid #4A90D9" : "1px solid #EEDCCB",
              boxShadow: selected === "new"
                ? "0 10px 36px -12px rgba(74, 144, 217, 0.22), 0 1px 3px rgba(28,25,23,0.05)"
                : "0 2px 12px rgba(28, 25, 23, 0.05)",
            }}
          >
            {/* Title */}
            <h2 className="font-serif-display text-xl md:text-[1.35rem] font-semibold text-center text-[#1C1917] tracking-tight m-0 mb-5">
              Build a New Home
            </h2>

            {/* Illustration */}
            <div style={{
              display: "flex", justifyContent: "center", marginBottom: 20,
              height: 110
            }}>
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/new-home-illustration?width=200"
                alt="Build new home"
                style={{ objectFit: "contain", maxHeight: "100%" }}
                onError={e => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              {/* SVG fallback */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 120, height: 110
              }}>
                <svg width="110" height="100" viewBox="0 0 120 110" fill="none">
                  {/* Ground */}
                  <ellipse cx="60" cy="88" rx="50" ry="12" fill="#D4E8C2" opacity="0.6"/>
                  {/* Tripod / surveying instrument */}
                  <line x1="60" y1="30" x2="30" y2="80" stroke="#8B7355" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="60" y1="30" x2="60" y2="82" stroke="#8B7355" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="60" y1="30" x2="90" y2="80" stroke="#8B7355" strokeWidth="2.5" strokeLinecap="round"/>
                  {/* Instrument head */}
                  <rect x="48" y="20" width="24" height="14" rx="4" fill="#4A90D9"/>
                  <circle cx="60" cy="27" r="4" fill="#fff" opacity="0.7"/>
                  {/* Blueprint corners */}
                  <rect x="8" y="60" width="30" height="22" rx="3" fill="#EBF3FB" stroke="#4A90D9" strokeWidth="1.5"/>
                  <line x1="14" y1="67" x2="32" y2="67" stroke="#4A90D9" strokeWidth="1" opacity="0.6"/>
                  <line x1="14" y1="72" x2="28" y2="72" stroke="#4A90D9" strokeWidth="1" opacity="0.6"/>
                  <line x1="14" y1="77" x2="26" y2="77" stroke="#4A90D9" strokeWidth="1" opacity="0.6"/>
                </svg>
              </div>
            </div>

            {/* Description */}
            <p className="text-[13px] md:text-sm text-[#57534E] leading-relaxed m-0 mb-4">
              You have a plot and want to design your dream home from the ground up.
            </p>

            {/* Features */}
            <div className="mb-5 pb-5 border-b border-[#EDE8E0]">
              <FeatureRow text="Floor & elevation plans" />
              <FeatureRow text="3D & video renders" />
              <FeatureRow text="Estimates" />
              <FeatureRow text="Vastu planning" />
            </div>

            {/* Steps */}
            <div className="flex items-start justify-between gap-1 mb-7">
              {NEW_HOME_STEPS.map((s, i) => (
                <React.Fragment key={s.label}>
                  <StepIcon icon={s.icon} label={s.label} />
                  {i < NEW_HOME_STEPS.length - 1 && <StepDivider />}
                </React.Fragment>
              ))}
            </div>

            {/* CTA — Link avoids nested <button> inside the selectable card (fixes broken clicks) */}
            <Link
              to="/build/new-home"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 no-underline text-[15px] font-bold text-[#C85F2B] hover:text-[#A64F24] transition-colors"
            >
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {/* Card 2 – Renovate / Remodel */}
          <div
            tabIndex={0}
            role="group"
            aria-label="Renovate or remodel"
            onClick={() => setSelected("renovate")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected("renovate"); } }}
            className="rounded-2xl cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#C85F2B] focus-visible:ring-offset-2"
            style={{
              background: "linear-gradient(180deg, #FFFBF7 0%, #FDFBF8 55%, #F8F4EF 100%)",
              padding: "28px 24px 26px",
              border: selected === "renovate" ? "2px solid #C85F2B" : "1px solid #EEDCCB",
              boxShadow: selected === "renovate"
                ? "0 10px 36px -12px rgba(200, 95, 43, 0.2), 0 1px 3px rgba(28,25,23,0.05)"
                : "0 2px 12px rgba(28, 25, 23, 0.05)",
            }}
          >
            {/* Title */}
            <h2 className="font-serif-display text-xl md:text-[1.35rem] font-semibold text-center text-[#1C1917] tracking-tight m-0 mb-5">
              Renovate / Remodel
            </h2>

            {/* Illustration */}
            <div style={{
              display: "flex", justifyContent: "center", marginBottom: 20, height: 110
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 120, height: 110
              }}>
                <svg width="110" height="100" viewBox="0 0 120 110" fill="none">
                  {/* House body */}
                  <rect x="22" y="46" width="64" height="44" rx="3" fill="#F9C784"/>
                  <rect x="22" y="46" width="64" height="44" rx="3" stroke="#E8A84A" strokeWidth="1.5"/>
                  {/* Roof */}
                  <path d="M14 48 L54 20 L94 48 Z" fill="#C85F2B" stroke="#B04F20" strokeWidth="1.5"/>
                  {/* Door */}
                  <rect x="48" y="66" width="14" height="24" rx="2" fill="#8B5E3C"/>
                  {/* Windows */}
                  <rect x="28" y="54" width="16" height="14" rx="2" fill="#A8D4E8" stroke="#7AB8D0" strokeWidth="1"/>
                  <rect x="64" y="54" width="16" height="14" rx="2" fill="#A8D4E8" stroke="#7AB8D0" strokeWidth="1"/>
                  {/* Wrench */}
                  <g transform="translate(70, 20) rotate(30)">
                    <rect x="-4" y="-18" width="8" height="26" rx="4" fill="#7A7A7A"/>
                    <circle cx="0" cy="-18" r="7" fill="none" stroke="#7A7A7A" strokeWidth="3"/>
                    <circle cx="0" cy="-18" r="3" fill="#F5EFE8"/>
                  </g>
                </svg>
              </div>
            </div>

            {/* Description */}
            <p className="text-[13px] md:text-sm text-[#57534E] leading-relaxed m-0 mb-4">
              Upload photos of your existing rooms, describe your vision, and get AI-powered designs and estimates.
            </p>

            {/* Features */}
            <div className="mb-5 pb-5 border-b border-[#EDE8E0]">
              <FeatureRow text="Upload existing room photos" />
              <FeatureRow text="Describe your vision" />
              <FeatureRow text="Get AI designs & renders" />
              <FeatureRow text="Smart cost estimates" />
            </div>

            {/* Steps */}
            <div className="flex items-start justify-between gap-1 mb-7">
              {RENOVATE_STEPS.map((s, i) => (
                <React.Fragment key={s.label}>
                  <StepIcon icon={s.icon} label={s.label} />
                  {i < RENOVATE_STEPS.length - 1 && <StepDivider />}
                </React.Fragment>
              ))}
            </div>

            <Link
              to="/build/remodel"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 no-underline text-[15px] font-bold text-[#C85F2B] hover:text-[#A64F24] transition-colors"
            >
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
