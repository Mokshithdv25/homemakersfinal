import React from "react";

/** Section lead with prominent “AI” — use on landing blocks, not in hero. */
export function LandingAiLead({ suffix, sub, className = "" }) {
  return (
    <div className={`mb-10 max-w-2xl ${className}`.trim()}>
      <h2 className="mb-2 font-display text-[1.75rem] font-semibold leading-tight text-foreground md:text-[2.1rem]">
        <span className="text-copper text-[1.22em] font-bold tracking-tight">AI</span>
        <span className="text-foreground">{suffix}</span>
      </h2>
      {sub ? <p className="m-0 font-body text-sm leading-relaxed text-muted-foreground md:text-base">{sub}</p> : null}
    </div>
  );
}
