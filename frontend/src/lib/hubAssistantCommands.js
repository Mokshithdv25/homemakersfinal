/** Local intent routing for Homi — works offline and as fallback when AI is unavailable. */

import { HM_HUB_DEMO_PROJECT } from "./hmBrand";

const NAV_ALIASES = {
  overview: "Overview",
  home: "Overview",
  timeline: "Timeline",
  schedule: "Timeline",
  tasks: "Tasks",
  todo: "Tasks",
  budget: "Budget",
  money: "Budget",
  feed: "Site Feed",
  site: "Site Feed",
  settings: "Settings",
};

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ");
}

function formatTaskList(tasks, { limit = 6, openOnly = false } = {}) {
  const rows = (tasks || []).filter((t) => (openOnly ? !t.done : true));
  if (!rows.length) return openOnly ? "No open tasks on the board." : "No tasks tracked yet.";
  return rows
    .slice(0, limit)
    .map((t) => {
      const mark = t.done ? "✓" : "○";
      const phase = t.phase ? ` (${t.phase})` : "";
      return `${mark} ${t.title || t.name}${phase}`;
    })
    .join("\n");
}

function formatMessageDigest(messages, limit = 5) {
  const rows = (messages || []).slice(-limit);
  if (!rows.length) return "No site-feed messages yet.";
  return rows
    .map((m) => {
      const who = m.name || m.role || "Team";
      const phase = m.phase ? ` · ${m.phase}` : "";
      return `**${who}**${phase}: ${m.text}`;
    })
    .join("\n");
}

export function buildLatestBriefing(ctx) {
  const lines = [];
  const name = ctx.userFirstName ? `${ctx.userFirstName}, ` : "";
  if (!ctx.signedIn) {
    return `${name}sign in to sync your build and remodel projects across devices. I can still explain the hub and help you start a flow.`;
  }
  if (!ctx.projectId && ctx.isDemoHub) {
    return `${name}you're on the **${HM_HUB_DEMO_PROJECT.line2}** sample hub (${HM_HUB_DEMO_PROJECT.meta}). Stage **${ctx.activePhase || "Structure"}** · **${ctx.pendingTaskCount ?? 3}** open tasks. Say **tasks**, **quotes**, or **design journey** — or **new build** to start yours.`;
  }
  if (!ctx.projectId) {
    return `${name}pick a saved project in the sidebar, or say **new build** / **remodel** to start one.`;
  }
  lines.push(`**${ctx.projectTitle || "Your project"}** · ${ctx.flowLabel || "Project"}`);
  if (ctx.activePhase) lines.push(`Stage focus: **${ctx.activePhase}** (${ctx.phasePct ?? 0}% in tracker).`);
  if (ctx.pendingTaskCount > 0) {
    lines.push(`**${ctx.pendingTaskCount}** open task${ctx.pendingTaskCount === 1 ? "" : "s"}${ctx.nextTask ? ` — next: ${ctx.nextTask}` : ""}.`);
  } else if (ctx.taskCount > 0) {
    lines.push("All tracked tasks are done for now — nice.");
  }
  if (ctx.budgetLabel) lines.push(`Budget band: **${ctx.budgetLabel}**.`);
  if (ctx.hasV0) lines.push("Your **AI v0** pack is saved on this project.");
  if (ctx.v0Summary?.totalInr) {
    lines.push(`V0 estimate ballpark: **${ctx.v0Summary.totalInr}** INR (indicative).`);
  }
  if (ctx.pendingTasks?.length) {
    lines.push(`Open tasks:\n${formatTaskList(ctx.pendingTasks, { limit: 4, openOnly: true })}`);
  }
  if (ctx.recentMessages?.length) {
    lines.push(`Recent site feed:\n${formatMessageDigest(ctx.recentMessages, 3)}`);
  }
  if (ctx.postedBanner) {
    lines.push(
      ctx.wantsMarketplaceQuotes === false
        ? "You posted with your own team — use **Team** to invite pros."
        : "Your project is posted — try **Find pros** for bids and proposals.",
    );
  }
  return lines.join("\n");
}

export function parseHubCommand(message, ctx) {
  const t = normalize(message);
  if (!t) return null;

  if (/\b(sign\s*in|log\s*in|google)\b/.test(t)) {
    return { kind: "navigate", path: ctx.signInPath || "/sign-in?mode=signin&role=homeowner&redirect=/project" };
  }
  if (/\b(new\s*home|new\s*build|build\s*new)\b/.test(t)) {
    return { kind: "navigate", path: "/build/new-home" };
  }
  if (/\b(remodel|renovat|refresh)\b/.test(t)) {
    return { kind: "navigate", path: "/build/remodel" };
  }
  if (/\b(design\s*journey|journey|v0|concepts?)\b/.test(t)) {
    const q = ctx.hubQuery || "";
    return { kind: "navigate", path: `/project/journey${q}` };
  }
  if (/\b(documents?|files?|vault)\b/.test(t)) {
    const q = ctx.hubQuery || "";
    return { kind: "navigate", path: `/documents${q}` };
  }
  if (/\b(quote|quotes|bid|bids|proposal|proposals|rfq)\b/.test(t)) {
    const path = ctx.projectId ? `/browse?projectId=${encodeURIComponent(ctx.projectId)}` : "/browse";
    return { kind: "navigate", path };
  }
  if (/\b(team|architect|invite|contractor)\b/.test(t)) {
    const q = ctx.hubQuery || "";
    return { kind: "navigate", path: `/team${q}` };
  }
  if (/\b(shop|materials?)\b/.test(t)) {
    return { kind: "navigate", path: "/shop" };
  }
  if (/\b(pros|marketplace|browse)\b/.test(t)) {
    return { kind: "navigate", path: "/browse" };
  }
  if (/\b(latest|what'?s new|update|status|briefing|summary)\b/.test(t)) {
    return { kind: "reply", text: buildLatestBriefing(ctx) };
  }
  if (/\b(open\s*tasks?|todo|to[\s-]?do|pending\s*tasks?)\b/.test(t)) {
    return {
      kind: "reply",
      text: `**Open tasks** on ${ctx.projectTitle || "your project"}:\n${formatTaskList(ctx.pendingTasks || ctx.tasks, { openOnly: true })}`,
    };
  }
  if (/\b(all\s*tasks?|task\s*list|my\s*tasks?)\b/.test(t)) {
    return {
      kind: "reply",
      text: `**Tasks** (${ctx.taskCount ?? ctx.tasks?.length ?? 0} total):\n${formatTaskList(ctx.tasks)}`,
    };
  }
  if (/\b(messages?|site\s*feed|feed|updates?\s*from\s*site)\b/.test(t)) {
    return {
      kind: "reply",
      text: `**Site feed** (latest):\n${formatMessageDigest(ctx.recentMessages || ctx.messages)}`,
    };
  }
  if (/\b(phase|stage|timeline|progress)\b/.test(t) && ctx.phases?.length) {
    const phaseLines = ctx.phases
      .map((p) => `**${p.name}** — ${p.pct ?? 0}%${p.status ? ` (${p.status})` : ""}`)
      .join("\n");
    return { kind: "reply", text: `Project phases:\n${phaseLines}` };
  }

  for (const [key, nav] of Object.entries(NAV_ALIASES)) {
    if (t === key || t.startsWith(`${key} `) || t.includes(`open ${key}`) || t.includes(`show ${key}`)) {
      return { kind: "nav", nav };
    }
  }

  const addTask = t.match(/^(add task|create task|new task)\s+(.+)$/);
  if (addTask?.[2]) {
    return { kind: "addTask", title: addTask[2].trim() };
  }

  if (/\b(help|commands?|what can you)\b/.test(t)) {
    return {
      kind: "reply",
      text:
        "Try: **latest**, **tasks**, **timeline**, **budget**, **design journey**, **add task** _tile samples_, or **new build** / **remodel**.",
    };
  }

  return null;
}

export function localHubAssistantReply(message, ctx) {
  const cmd = parseHubCommand(message, ctx);
  if (cmd?.kind === "reply") return { text: cmd.text, action: null };
  if (cmd?.kind === "nav") {
    return {
      text: `Opening **${cmd.nav}** for you.`,
      action: { type: "nav", nav: cmd.nav },
    };
  }
  if (cmd?.kind === "navigate") {
    return {
      text: `Taking you there now.`,
      action: { type: "path", path: cmd.path },
    };
  }
  if (cmd?.kind === "addTask") {
    return {
      text: `Added task: **${cmd.title}**`,
      action: { type: "addTask", title: cmd.title },
    };
  }

  if (!ctx.signedIn) {
    return {
      text: "I’m **Homi**, your project co-pilot. Sign in to see saved builds and v0 packs — or ask about **new build**, **remodel**, or **help**.",
      action: null,
    };
  }

  return {
    text: buildLatestBriefing(ctx),
    action: null,
  };
}
