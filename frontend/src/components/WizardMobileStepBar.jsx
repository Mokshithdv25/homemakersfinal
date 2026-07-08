import React from "react";
import { canVisitWizardStep } from "../lib/wizardSteps";

/** Horizontal step pills for narrow viewports / mobile shell (desktop sidebar hidden). */
export default function WizardMobileStepBar({ steps, activeStep, maxStepReached, onStepClick }) {
  if (!steps?.length) return null;

  return (
    <nav className="hm-wizard-mobile-bar" aria-label="Wizard progress">
      <div className="hm-wizard-mobile-bar-scroll">
        {steps.map((s) => {
          const visitable = canVisitWizardStep(s.n, maxStepReached);
          const active = activeStep === s.n;
          const done = s.n < activeStep;
          return (
            <button
              key={s.n}
              type="button"
              disabled={!visitable}
              className={[
                "hm-wizard-mobile-pill",
                active ? "active" : "",
                done ? "done" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                if (!visitable) return;
                onStepClick?.(s.n);
              }}
            >
              <span className="hm-wizard-mobile-pill-num">{done ? "✓" : s.n}</span>
              <span className="hm-wizard-mobile-pill-label">{s.title}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
