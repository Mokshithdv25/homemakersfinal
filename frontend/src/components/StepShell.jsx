import React from "react";
import { HmHeaderBrandLockup } from "./HmBrandLockup";
import { HM_HEADER_BAR_CLASS, HM_TAGLINE_PORTFOLIO } from "../lib/hmBrand";

const STEPS = [
  { n: 1, label: "Your Craft" },
  { n: 2, label: "Your Details" },
  { n: 3, label: "Your Portfolio" },
  { n: 4, label: "Go Live" },
];

function StepRail({ currentStep = 1 }) {
  return (
    <div
      className="flex items-center gap-3 md:gap-4 w-full max-w-xl"
      data-testid="step-rail"
    >
      {STEPS.map((s, i) => {
        const state =
          currentStep > s.n
            ? "complete"
            : currentStep === s.n
              ? "active"
              : "idle";
        return (
          <React.Fragment key={s.n}>
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div
                className="step-dot"
                data-state={state}
                data-testid={`step-dot-${s.n}`}
              >
                {state === "complete" ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 7.5l3 3 7-7"
                      stroke="white"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  s.n
                )}
              </div>
              <span
                className={`text-[11px] md:text-xs font-medium tracking-wide ${
                  currentStep === s.n
                    ? "text-[#1C1917] font-semibold"
                    : currentStep > s.n
                      ? "text-[#7A6E62]"
                      : "text-[#A89A8C]"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="step-rail -mt-5"
                data-filled={currentStep > s.n ? "true" : "false"}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ProfileStrength({ value = 15 }) {
  const deg = Math.round((value / 100) * 360);
  let caption = null;
  let captionColor = "#B04F20";
  if (value >= 100) {
    caption = "Amazing! You're all set \uD83C\uDF89";
    captionColor = "#2E7D32";
  } else if (value >= 65) {
    caption = "Almost there!";
  } else if (value >= 35) {
    caption = "Keep going!";
  }

  return (
    <div className="profile-strength-pill" data-testid="profile-strength">
      <div>
        <div className="text-[11px] font-semibold tracking-wider text-[#B04F20] uppercase">
          Profile Strength
        </div>
        <div
          className="font-serif-display text-2xl font-semibold leading-none mt-0.5"
          style={{ color: value >= 100 ? "#2E7D32" : "#C85F2B" }}
          data-testid="profile-strength-value"
        >
          {value}%
        </div>
        {caption && (
          <div
            className="text-[11px] font-medium mt-1"
            style={{ color: captionColor }}
          >
            {caption}
          </div>
        )}
      </div>
      <div
        className="strength-ring"
        style={{
          "--strength-deg": `${deg}deg`,
          "--strength-color": value >= 100 ? "#2E7D32" : "#C85F2B",
        }}
        aria-hidden
      />
    </div>
  );
}

export default function StepShell({ currentStep, profileStrength, children }) {
  return (
    <div className="hm-grid-bg min-h-screen relative overflow-hidden">
      <div className="hm-blueprint" aria-hidden />

      <header className={HM_HEADER_BAR_CLASS} data-testid="hm-header">
        <HmHeaderBrandLockup tagline={HM_TAGLINE_PORTFOLIO} />

        <div className="hidden lg:block">
          <StepRail currentStep={currentStep} />
        </div>

        <ProfileStrength value={profileStrength} />
      </header>

      <div className="lg:hidden px-6 mb-2 flex justify-center">
        <StepRail currentStep={currentStep} />
      </div>

      {children}
    </div>
  );
}
