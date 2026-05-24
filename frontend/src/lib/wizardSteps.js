/** Sidebar may only open steps already reached via Continue (back navigation allowed). */
export function canVisitWizardStep(targetStep, maxStepReached) {
  const t = Number(targetStep);
  const max = Number(maxStepReached);
  return Number.isFinite(t) && t >= 1 && t <= max;
}

export function nextMaxStepReached(currentMax, stepJustCompleted) {
  return Math.max(Number(currentMax) || 1, Number(stepJustCompleted) + 1);
}

export function wizardExitPath() {
  if (typeof document !== "undefined" && document.documentElement.classList.contains("hm-mobile-app")) {
    return "/design";
  }
  return "/build";
}
