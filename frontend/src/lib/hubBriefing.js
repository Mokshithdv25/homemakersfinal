/** Morning briefing + command-center copy for Homi on the project hub. */

import { HM_HUB_DEMO_PROJECT } from "./hmBrand";

export function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function formatBriefingDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function buildHubBadges(ctx, { pendingTasks = 0, openQuotes = 0 } = {}) {
  const badges = [];
  if (ctx.isDemoHub) {
    badges.push({ label: "Sample project", value: "Active", tone: "sand" });
    badges.push({ label: "Open tasks", value: String(pendingTasks || 3), tone: "amber" });
    badges.push({ label: "Stage focus", value: ctx.activePhase || "Structure", tone: "blue" });
    badges.push({ label: "Quotes", value: "Ready to post", tone: "green" });
    badges.push({ label: "v0 design", value: ctx.hasV0 ? "Saved" : "Try wizard", tone: "orange" });
    return badges;
  }
  if (ctx.pendingTaskCount > 0) {
    badges.push({
      label: "Open tasks",
      value: String(ctx.pendingTaskCount),
      tone: "amber",
    });
  }
  if (ctx.activePhase) {
    badges.push({
      label: "Stage",
      value: `${ctx.activePhase} · ${ctx.phasePct ?? 0}%`,
      tone: "blue",
    });
  }
  if (ctx.hasV0) badges.push({ label: "AI v0", value: "On file", tone: "orange" });
  if (ctx.materials?.length) badges.push({ label: "Material items", value: String(ctx.materials.length), tone: "sand" });
  if (ctx.postedBanner) badges.push({ label: "Marketplace", value: "Posted", tone: "green" });
  if (openQuotes > 0) badges.push({ label: "Quote replies", value: String(openQuotes), tone: "pink" });
  if (ctx.budgetLabel) badges.push({ label: "Budget band", value: ctx.budgetLabel, tone: "sand" });
  if (!badges.length) badges.push({ label: "Project hub", value: "Ready", tone: "green" });
  return badges.slice(0, 5);
}

export function buildHubAgenda(ctx, { pendingTasks = [], selectedPhase = "" } = {}) {
  if (ctx.isDemoHub) {
    return `Today's focus on **${HM_HUB_DEMO_PROJECT.line2}**: slab curing check, tile vendor visit, and sanction copy review. Tap a stage below or ask Homi to draft your next move.`;
  }
  const parts = [];
  if (ctx.projectTitle) parts.push(`**${ctx.projectTitle}**`);
  if (selectedPhase || ctx.activePhase) {
    parts.push(`Stage **${selectedPhase || ctx.activePhase}** is in focus.`);
  }
  if (pendingTasks.length) {
    const names = pendingTasks.slice(0, 3).map((t) => t.name).join("; ");
    parts.push(`Next up: ${names}.`);
  } else if (ctx.nextTask) {
    parts.push(`Next task: **${ctx.nextTask}**.`);
  } else {
    parts.push("No urgent tasks — good time to review budget or post for quotes.");
  }
  const blocked = (ctx.tasks || []).filter((task) => task.status === "blocked");
  if (blocked.length) parts.push(`**${blocked.length} blocked** task${blocked.length === 1 ? " needs" : "s need"} attention.`);
  const pendingApprovals = (ctx.agentActions || []).filter((action) => action.status === "suggested");
  if (pendingApprovals.length) parts.push(`**${pendingApprovals.length} suggested action${pendingApprovals.length === 1 ? "" : "s"}** await approval.`);
  if (ctx.materials?.length) {
    const selected = ctx.materials.filter((item) => item.brand).length;
    parts.push(`Material plan: ${ctx.materials.length} items; ${selected} brand selection${selected === 1 ? "" : "s"} saved.`);
  }
  return parts.join(" ");
}

export function buildSuggestedActions(ctx) {
  const q = ctx.hubQuery || "";
  const pid = ctx.projectId;
  const browse = pid ? `/browse?projectId=${encodeURIComponent(pid)}` : "/browse";

  if (ctx.isDemoHub) {
    return [
      {
        label: "Brief me on this week's site work",
        message: "latest",
      },
      {
        label: "What should I focus on before slab 2?",
        message: "tasks",
      },
      {
        label: "Show how to get contractor quotes",
        message: "quotes",
      },
      {
        label: "Open design journey & v0 concepts",
        message: "design journey",
      },
    ];
  }

  const actions = [
    { label: "Give me today's project briefing", message: "latest" },
    { label: "Ask about project risks & decisions", message: "What are the main risks and next decisions on this project?" },
  ];
  if (ctx.materials?.length) {
    actions.push({ label: "Review material takeoff & brands", message: "Show my material takeoff and selected brands" });
  }
  if (ctx.wantsMarketplaceQuotes !== false && (ctx.postedBanner || !ctx.hasV0)) {
    actions.push({
      label: "Find pros & compare quotes",
      message: "quotes",
      path: browse,
    });
  }
  if (ctx.hasV0) {
    actions.push({
      label: "Review AI v0 & design journey",
      message: "design journey",
      path: `/project/journey${q}`,
    });
  } else {
    actions.push({
      label: "Start AI v0 for my brief",
      message: "new build",
      path: "/build/new-home",
    });
  }
  if (ctx.pendingTaskCount > 0 && ctx.nextTask) {
    actions.push({
      label: `Remind me about: ${ctx.nextTask.slice(0, 42)}${ctx.nextTask.length > 42 ? "…" : ""}`,
      message: "tasks",
    });
  }
  return actions.slice(0, 4);
}

export const COMMAND_CENTER_TRY_PROMPTS = [
  { label: "Give me today's briefing", message: "latest" },
  { label: "What changed since the last update?", message: "What changed since the last site update?" },
  { label: "Show material quantities & brands", message: "Show my material takeoff and selected brands" },
  { label: "What needs my approval?", message: "What needs my approval?" },
];

/** Plain text for optional speech synthesis (strip markdown). */
export function briefingToSpeech(text) {
  return String(text || "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\n/g, ". ");
}
