/** Serialize live project board data for Homi (Grok + local fallback). */

const MAX_TASKS = 40;
const MAX_MESSAGES = 20;

function trimText(text, max = 280) {
  const s = String(text || "").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function compactTask(task) {
  if (!task) return null;
  const title = task.name || task.title || "";
  if (!title) return null;
  return {
    id: task.id || null,
    title: trimText(title, 120),
    done: Boolean(task.done),
    phase: task.phase || null,
    date: task.date || null,
    assignee: task.assignee || null,
  };
}

function compactMessage(msg) {
  if (!msg) return null;
  const text = msg.text || msg.message || "";
  if (!text) return null;
  return {
    role: msg.role || msg.author_role || "Team",
    name: msg.name || msg.role || "Team",
    phase: msg.phase || null,
    time: msg.time || null,
    text: trimText(text, 320),
  };
}

function compactPhase(phase) {
  if (!phase?.name) return null;
  return {
    name: phase.name,
    pct: Number(phase.pct ?? 0),
    status: phase.status || null,
  };
}

function buildV0Summary(v0Pack) {
  if (!v0Pack) return null;
  const images = v0Pack.images?.images || v0Pack.images || [];
  const imageList = Array.isArray(images) ? images : [];
  const estimate = v0Pack.estimate || null;
  return {
    hasImages: imageList.length > 0,
    imageCount: imageList.length,
    hasEstimate: Boolean(estimate?.estimate_lines?.length || estimate?.total_indicative_inr),
    totalInr: estimate?.total_indicative_inr ?? null,
    lineCount: estimate?.estimate_lines?.length ?? 0,
    mock: Boolean(v0Pack.mock),
    generatedAt: v0Pack.generatedAt || null,
  };
}

/**
 * Build context payload sent to /api/ai/hub-assistant (Grok RAG-lite).
 * @param {Record<string, unknown>} params
 */
export function buildHubAssistantContext({
  signedIn = false,
  isDemoHub = false,
  userFirstName = "",
  projectId = "",
  projectTitle = "Your project",
  projectStatus = "",
  flowLabel = "",
  activePhase = "",
  phasePct = 0,
  tasks = [],
  messages = [],
  phases = [],
  taskCount = 0,
  pendingTaskCount = 0,
  nextTask = null,
  budgetLabel = null,
  hasV0 = false,
  v0Pack = null,
  postedBanner = false,
  wantsMarketplaceQuotes = true,
  hubQuery = "",
  signInPath = "/sign-in",
  location = "",
  timeline = "",
}) {
  const compactTasks = (tasks || []).map(compactTask).filter(Boolean).slice(0, MAX_TASKS);
  const compactMsgs = (messages || []).map(compactMessage).filter(Boolean).slice(-MAX_MESSAGES);
  const compactPhases = (phases || []).map(compactPhase).filter(Boolean);
  const pending = compactTasks.filter((t) => !t.done);
  const done = compactTasks.filter((t) => t.done);

  return {
    signedIn,
    isDemoHub,
    userFirstName,
    projectId: projectId || "",
    projectTitle,
    projectStatus: projectStatus || "",
    flowLabel,
    activePhase,
    phasePct,
    location: location || "",
    timeline: timeline || "",
    taskCount: taskCount || compactTasks.length,
    pendingTaskCount: pendingTaskCount || pending.length,
    nextTask: nextTask || pending[0]?.title || null,
    budgetLabel,
    hasV0: hasV0 || Boolean(v0Pack?.images || v0Pack?.estimate),
    v0Summary: buildV0Summary(v0Pack),
    phases: compactPhases,
    tasks: compactTasks,
    pendingTasks: pending.slice(0, 15),
    completedTasks: done.slice(-10),
    messages: compactMsgs,
    recentMessages: compactMsgs.slice(-8),
    postedBanner,
    wantsMarketplaceQuotes,
    hubQuery,
    signInPath,
  };
}
