import { getSupabase } from "./supabaseClient";
import { persistV0ImagesToStorage } from "./supabaseStorage";

const supabase = getSupabase();

function stageColor(status) {
  if (status === "done") return "#22A36B";
  if (status === "in_progress") return "#F59E0B";
  if (status === "blocked") return "#DC2626";
  return "#A8A29E";
}

function stagePill(status) {
  if (status === "done") return { label: "Done", color: "#22A36B" };
  if (status === "in_progress") return { label: "In Progress", color: "#F59E0B" };
  if (status === "blocked") return { label: "Blocked", color: "#DC2626" };
  return { label: "Upcoming", color: "#9A8F87" };
}

function mapFlowType(source) {
  if (source === "build-new") return "new_home";
  if (source === "remodel") return "remodel";
  return null;
}

export function formatInrShort(amountInr) {
  const n = Number(amountInr);
  if (!Number.isFinite(n) || n <= 0) return "TBD";
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2).replace(/\.00$/, "")} Cr`;
  if (n >= 100_000) return `₹${Math.round(n / 100_000)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function budgetFieldsFromBrief(brief) {
  if (typeof brief?.budgetInr === "number" && brief.budgetInr > 0) {
    const cap = Math.round(brief.budgetInr);
    return { budget_min: cap, budget_max: cap, budgetBand: brief.budgetLabel || formatInrShort(cap) };
  }
  const amount = Number(brief?.budgetAmount || 0);
  const unit = brief?.budgetUnit;
  if (amount > 0 && unit) {
    const cap = unit === "Crores" ? amount * 10_000_000 : amount * 100_000;
    const rounded = Math.round(cap);
    return {
      budget_min: rounded,
      budget_max: rounded,
      budgetBand: brief?.budgetLabel || `${brief.budgetAmount} ${unit}`,
    };
  }
  return { budget_min: null, budget_max: null, budgetBand: brief?.budgetLabel || null };
}

async function getCurrentUserId() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

function lastProjectStorageKey(userId) {
  return `hm_last_project_${userId}`;
}

/** Remember which project this user last opened (per device). */
export function rememberActiveProject(userId, projectId, source) {
  if (!userId || !projectId) return;
  try {
    localStorage.setItem(
      lastProjectStorageKey(userId),
      JSON.stringify({ projectId, source: source || "", at: Date.now() })
    );
  } catch (_) {
    /* ignore */
  }
}

export function getRememberedProject(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(lastProjectStorageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const ANON_PROJECT_IDS_KEY = "hm_anon_project_ids";

/** After sign-in: attach projects created on this device before login. */
export async function claimAnonymousProjects(userId) {
  if (!supabase || !userId) return [];
  const ids = new Set();
  try {
    const build = JSON.parse(localStorage.getItem("hm_build_new_flow") || "{}");
    const remodel = JSON.parse(localStorage.getItem("hm_remodel_flow") || "{}");
    if (build?.projectId) ids.add(build.projectId);
    if (remodel?.projectId) ids.add(remodel.projectId);
    const extra = JSON.parse(localStorage.getItem(ANON_PROJECT_IDS_KEY) || "[]");
    if (Array.isArray(extra)) extra.forEach((id) => ids.add(id));
  } catch (_) {
    /* ignore */
  }
  if (!ids.size) return [];
  const claimed = [];
  for (const id of ids) {
    const { data, error } = await supabase
      .from("projects")
      .update({ owner_user_id: userId })
      .eq("id", id)
      .is("owner_user_id", null)
      .select("id")
      .maybeSingle();
    if (!error && data?.id) claimed.push(data.id);
  }
  if (claimed.length) {
    try {
      const remaining = JSON.parse(localStorage.getItem(ANON_PROJECT_IDS_KEY) || "[]").filter(
        (id) => !claimed.includes(id),
      );
      localStorage.setItem(ANON_PROJECT_IDS_KEY, JSON.stringify(remaining));
    } catch (_) {
      /* ignore */
    }
  }
  return claimed;
}

/** Claim device drafts, then list projects for the signed-in user. */
export async function claimAndListUserProjects(userId) {
  if (!userId) return [];
  await claimAnonymousProjects(userId);
  return listUserProjects();
}

/** All projects owned by the signed-in user (for return visits). */
export async function listUserProjects() {
  if (!supabase) return [];
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, flow_type, status, source, location, city, budget_min, budget_max, created_at, updated_at")
    .eq("owner_user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) {
    console.warn("listUserProjects:", error.message);
    return [];
  }
  return data || [];
}

/** Projects referenced in this browser's build/remodel flows (no account required). */
export function listLocalFlowProjects() {
  const out = [];
  try {
    const build = JSON.parse(localStorage.getItem("hm_build_new_flow") || "{}");
    if (build?.projectId) {
      out.push({
        id: build.projectId,
        title: build.title || "New home",
        flow_type: "new_home",
        source: "build-new",
      });
    }
  } catch (_) {
    /* ignore */
  }
  try {
    const remodel = JSON.parse(localStorage.getItem("hm_remodel_flow") || "{}");
    if (remodel?.projectId && !out.some((p) => p.id === remodel.projectId)) {
      out.push({
        id: remodel.projectId,
        title: remodel.title || "Remodel",
        flow_type: "remodel",
        source: "remodel",
      });
    }
  } catch (_) {
    /* ignore */
  }
  return out;
}

function seedFromBrief(brief, flowType, aiPlan = null) {
  const area = Number(brief?.plotArea || brief?.len || 0) * Number(brief?.breadth || 1);
  const style = Array.isArray(brief?.styles) ? brief.styles.join(" + ") : brief?.style || "selected style";
  const location = brief?.location || brief?.city || "project location";
  const goal = brief?.mainGoal || (Array.isArray(brief?.lifestyle) ? brief.lifestyle[0] : "") || "project goals";

  const phases = [
    { name: "Design & Approval", pct: 8, color: "#C85F2B", status: "In Progress", statusColor: "#F59E0B" },
    { name: "Sourcing", pct: 0, color: "#A8A29E", status: "Upcoming", statusColor: "#9A8F87" },
    { name: "Site & Foundation", pct: 0, color: "#A8A29E", status: "Upcoming", statusColor: "#9A8F87" },
    { name: "Structure", pct: 0, color: "#A8A29E", status: "Upcoming", statusColor: "#9A8F87" },
    { name: "Finishing", pct: 0, color: "#A8A29E", status: "Upcoming", statusColor: "#9A8F87" },
  ];

  const llmMilestones = Array.isArray(aiPlan?.milestones) ? aiPlan.milestones : [];
  const estimateLines = Array.isArray(aiPlan?.estimate_lines) ? aiPlan.estimate_lines : [];

  const milestoneTasks = llmMilestones.slice(0, 5).map((m, idx) => ({
    done: false,
    name: String(m?.title || `Milestone ${idx + 1}`),
    phase: phases[Math.min(idx, phases.length - 1)].name,
    date: String(m?.timeframe || "Planned"),
    assignee: "Team",
  }));

  const estimateTasks = estimateLines.slice(0, 4).map((line, idx) => ({
    done: false,
    name: `Review estimate: ${line?.label || `Line ${idx + 1}`}${line?.amount_inr ? ` (${formatInrShort(line.amount_inr)})` : ""}`,
    phase: idx < 2 ? "Design & Approval" : "Sourcing",
    date: "From v0 estimate",
    assignee: "You",
  }));

  const genericTasks = [
    {
      done: false,
      name: `Finalize ${flowType === "remodel" ? "remodel" : "home"} concept for ${location}`,
      phase: "Design & Approval",
      date: "This week",
      assignee: "Architect",
    },
    {
      done: false,
      name: `Freeze ${style} material shortlist`,
      phase: "Sourcing",
      date: "Next",
      assignee: "Contractor",
    },
    {
      done: false,
      name: `Confirm site readiness${area > 0 ? ` (${Math.round(area)} sq ft scope)` : ""}`,
      phase: "Site & Foundation",
      date: "Planned",
      assignee: "Site Team",
    },
    {
      done: false,
      name: "Lock structural execution sequence",
      phase: "Structure",
      date: "Planned",
      assignee: "Engineer",
    },
    {
      done: false,
      name: `Prepare finishing plan around "${goal}"`,
      phase: "Finishing",
      date: "Planned",
      assignee: "Designer",
    },
  ];

  const tasks =
    milestoneTasks.length > 0
      ? [...milestoneTasks, ...estimateTasks].slice(0, 8)
      : estimateTasks.length > 0
        ? [...estimateTasks, ...genericTasks].slice(0, 8)
        : genericTasks;

  const summaryNote = aiPlan?.project_summary
    ? String(aiPlan.project_summary).slice(0, 280)
    : null;

  const messages = [
    {
      phase: "Design & Approval",
      role: "System",
      name: "HomeMakers",
      time: "Just now",
      text: `Project created from ${flowType === "remodel" ? "Remodel" : "Build New Home"} brief for ${location}.`,
      color: "#2A6496",
    },
    {
      phase: "Design & Approval",
      role: "System",
      name: "HomeMakers",
      time: "Just now",
      text: summaryNote || `Primary direction captured: ${goal}.`,
      color: "#2A6496",
    },
  ];

  if (aiPlan?.total_indicative_inr) {
    messages.push({
      phase: "Design & Approval",
      role: "System",
      name: "HomeMakers",
      time: "Just now",
      text: `Indicative v0 total: ${formatInrShort(aiPlan.total_indicative_inr)} (ballpark — validate with your architect).`,
      color: "#2A6496",
    });
  }

  return { phases, tasks, messages };
}

async function saveProjectV0Pack(projectId, v0Images, v0Plan) {
  if (!v0Images && !v0Plan) return;
  const row = {
    project_id: projectId,
    images_json: v0Images || null,
    floor_plans_json: v0Images?.floorPlans || v0Images?.floor_plans || null,
    estimate_json: v0Plan || null,
    is_mock: Boolean(v0Images?.mock || v0Plan?.mock),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("project_v0_packs").upsert(row, { onConflict: "project_id" });
  if (error) {
    console.warn("project_v0_packs upsert failed (run db/homemakers_supabase_align.sql?):", error.message);
  }

  if (v0Images) {
    await supabase.from("project_ai_runs").insert({
      project_id: projectId,
      run_type: "v0_images",
      provider: v0Images?.provider || "grok",
      status: "completed",
      output_json: v0Images,
    });
  }
  if (v0Plan) {
    await supabase.from("project_ai_runs").insert({
      project_id: projectId,
      run_type: "estimate_plan",
      provider: v0Plan?.provider || "grok",
      status: "completed",
      output_json: v0Plan,
    });
  }
}

async function ensureProjectStagesAndTasks(projectId, brief, flowType, aiPlan) {
  const { data: existingStages } = await supabase
    .from("project_stages")
    .select("id")
    .eq("project_id", projectId)
    .limit(1);
  const { data: existingTasks } = await supabase
    .from("project_tasks")
    .select("id")
    .eq("project_id", projectId)
    .limit(1);

  if (existingStages?.length && existingTasks?.length) return;

  const seeded = seedFromBrief(brief, flowType, aiPlan);
  let stageIdByName = {};

  if (!existingStages?.length) {
    const stageRows = seeded.phases.map((p, idx) => ({
      project_id: projectId,
      name: p.name,
      sort_order: idx,
      status: p.status === "Done" ? "done" : p.status === "In Progress" ? "in_progress" : "upcoming",
      progress_percent: p.pct,
    }));
    const { data: stages } = await supabase.from("project_stages").insert(stageRows).select("*");
    stageIdByName = Object.fromEntries((stages || []).map((s) => [s.name, s.id]));
  } else {
    const { data: stages } = await supabase
      .from("project_stages")
      .select("*")
      .eq("project_id", projectId);
    stageIdByName = Object.fromEntries((stages || []).map((s) => [s.name, s.id]));
  }

  if (!existingTasks?.length) {
    await supabase.from("project_tasks").insert(
      seeded.tasks.map((t) => ({
        project_id: projectId,
        stage_id: stageIdByName[t.phase] || null,
        title: t.name,
        description: null,
        status: t.done ? "done" : "todo",
        priority: "medium",
      }))
    );
  }

  const { data: existingMsgs } = await supabase
    .from("project_messages")
    .select("id")
    .eq("project_id", projectId)
    .limit(1);
  if (!existingMsgs?.length) {
    await supabase.from("project_messages").insert(
      seeded.messages.map((m) => ({
        project_id: projectId,
        stage_id: stageIdByName[m.phase] || null,
        author_role: m.role,
        message: m.text,
      }))
    );
  }
}

/**
 * Create or update a flow project; persist brief, budget, v0 pack, and seed tasks once.
 */
export async function upsertFlowProject({
  projectId: existingProjectId,
  flowType,
  brief,
  source = "flow",
  aiPlan = null,
  v0Images = null,
  v0Plan = null,
  flowStep = "v0",
}) {
  if (!supabase) return null;

  const ownerUserId = await getCurrentUserId();
  if (!ownerUserId) {
    throw new Error("Sign in to save your project");
  }
  const budget = budgetFieldsFromBrief(brief);
  const title =
    brief?.title ||
    (flowType === "remodel"
      ? `${brief?.room || "Remodel"} remodel`
      : `${brief?.homeType || "New home"} build`);

  const city = brief?.city || "";
  const location = brief?.location || "";
  const timeline = brief?.timeline || brief?.completionTime || "";

  const projectRow = {
    title,
    flow_type: flowType,
    status: flowStep === "handoff" || flowStep === "posted" ? "planning" : "draft",
    source,
    location,
    city,
    timeline_completion: timeline,
    budget_min: budget.budget_min,
    budget_max: budget.budget_max,
    owner_user_id: ownerUserId,
  };

  let projectId = existingProjectId || null;
  let project = null;

  if (projectId) {
    const { data, error } = await supabase
      .from("projects")
      .update(projectRow)
      .eq("id", projectId)
      .select("*")
      .single();
    if (error) throw error;
    project = data;
  } else {
    const { data, error } = await supabase.from("projects").insert(projectRow).select("*").single();
    if (error) throw error;
    project = data;
    projectId = project.id;
  }

  const briefPayload = {
    ...brief,
    budgetBand: budget.budgetBand,
    budgetInr: brief?.budgetInr ?? budget.budget_max ?? budget.budget_min,
    ownerUserId,
  };

  const { error: briefErr } = await supabase.from("project_briefs").upsert(
    {
      project_id: projectId,
      brief_version: 1,
      brief_json: briefPayload,
      dream_vision: brief?.dreamVision || brief?.homeVision || "",
      inspirations_json: brief?.visionInspirationItems || [],
      last_completed_step: Number(brief?.step || brief?.activeStep || 5),
      flow_status: flowStep === "handoff" || flowStep === "posted" ? "open_for_quotes" : "v0_ready",
      flow_step: flowStep,
    },
    { onConflict: "project_id" }
  );
  if (briefErr) throw briefErr;

  const plan = v0Plan || aiPlan;
  let imagesForStore = v0Images;
  if (v0Images && ownerUserId) {
    try {
      imagesForStore = await persistV0ImagesToStorage({
        userId: ownerUserId,
        projectId,
        imageBundle: v0Images,
      });
    } catch (err) {
      console.warn("v0 image storage mirror failed:", err?.message || err);
    }
  }
  await saveProjectV0Pack(projectId, imagesForStore, plan);
  await ensureProjectStagesAndTasks(projectId, briefPayload, flowType, plan);

  if (ownerUserId) rememberActiveProject(ownerUserId, projectId, source);

  return { projectId, project };
}

/** After v0 generate — saves design + estimate for the user without waiting for handoff. */
export async function persistFlowAfterV0({ projectId, flowType, brief, source, v0Images, v0Plan }) {
  return upsertFlowProject({
    projectId,
    flowType,
    brief,
    source,
    v0Images,
    v0Plan,
    aiPlan: v0Plan,
    flowStep: "v0",
  });
}

export async function createFlowProjectRecord({
  projectId,
  flowType,
  brief,
  source = "flow",
  aiPlan = null,
  v0Images = null,
  v0Plan = null,
}) {
  return upsertFlowProject({
    projectId,
    flowType,
    brief,
    source,
    aiPlan,
    v0Images,
    v0Plan: v0Plan || aiPlan,
    flowStep: "posted",
  });
}

async function loadV0Pack(projectId) {
  const { data, error } = await supabase
    .from("project_v0_packs")
    .select("*")
    .eq("project_id", projectId)
    .limit(1);
  if (!error && data?.[0]) {
    const row = data[0];
    return {
      images: row.images_json,
      floorPlans: row.floor_plans_json,
      estimate: row.estimate_json,
      mock: row.is_mock,
      generatedAt: row.generated_at,
    };
  }
  if (error) {
    console.warn("loadV0Pack (project_v0_packs):", error.message);
  }

  const { data: runs } = await supabase
    .from("project_ai_runs")
    .select("*")
    .eq("project_id", projectId)
    .in("run_type", ["v0_images", "estimate_plan"])
    .eq("status", "completed")
    .order("created_at", { ascending: false });
  if (!runs?.length) return null;

  const imagesRun = runs.find((r) => r.run_type === "v0_images");
  const planRun = runs.find((r) => r.run_type === "estimate_plan");
  return {
    images: imagesRun?.output_json || null,
    floorPlans: imagesRun?.output_json?.floorPlans || imagesRun?.output_json?.floor_plans || null,
    estimate: planRun?.output_json || null,
    mock: Boolean(imagesRun?.output_json?.mock || planRun?.output_json?.mock),
    generatedAt: imagesRun?.created_at || planRun?.created_at,
  };
}

export async function loadProjectBoard({ projectId, source }) {
  if (!supabase) return null;

  const ownerUserId = await getCurrentUserId();
  if (!ownerUserId) return null;

  let resolvedProjectId = projectId || "";
  let project = null;

  if (!resolvedProjectId) {
    const flowType = mapFlowType(source);
    if (flowType) {
      let q = supabase
        .from("projects")
        .select("*")
        .eq("flow_type", flowType)
        .order("created_at", { ascending: false })
        .limit(1);
      q = q.eq("owner_user_id", ownerUserId);
      const { data } = await q;
      project = data?.[0] || null;
      resolvedProjectId = project?.id || "";
    }
  }

  if (!resolvedProjectId) return null;

  if (!project) {
    let q = supabase.from("projects").select("*").eq("id", resolvedProjectId);
    q = q.eq("owner_user_id", ownerUserId);
    const { data } = await q.limit(1);
    project = data?.[0] || null;
  }

  if (!project) return null;

  if (project.owner_user_id && project.owner_user_id !== ownerUserId) {
    return null;
  }

  if (ownerUserId && project?.id) {
    rememberActiveProject(ownerUserId, project.id, source || project.source);
  }

  const { data: briefRows } = await supabase
    .from("project_briefs")
    .select("*")
    .eq("project_id", resolvedProjectId)
    .limit(1);
  const brief = briefRows?.[0]?.brief_json || {};
  const flowType = project?.flow_type || mapFlowType(source) || "new_home";
  const v0Pack = await loadV0Pack(resolvedProjectId);

  const { data: stages } = await supabase
    .from("project_stages")
    .select("*")
    .eq("project_id", resolvedProjectId)
    .order("sort_order", { ascending: true });
  const { data: tasks } = await supabase
    .from("project_tasks")
    .select("*")
    .eq("project_id", resolvedProjectId)
    .order("created_at", { ascending: true });
  const { data: messages } = await supabase
    .from("project_messages")
    .select("*")
    .eq("project_id", resolvedProjectId)
    .order("created_at", { ascending: true });

  if (!stages?.length) {
    const seeded = seedFromBrief(brief, flowType, v0Pack?.estimate);
    return { projectId: resolvedProjectId, project, brief, v0Pack, ...seeded };
  }

  const stageById = Object.fromEntries(stages.map((s) => [s.id, s.name]));
  const phaseRows = stages.map((s) => {
    const pill = stagePill(s.status);
    return {
      name: s.name,
      pct: Number(s.progress_percent || 0),
      color: stageColor(s.status),
      status: pill.label,
      statusColor: pill.color,
    };
  });

  const shortDate = (iso) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } catch {
      return null;
    }
  };

  const taskRows = (tasks || []).map((t) => ({
    id: t.id,
    done: t.status === "done",
    name: t.title,
    phase: stageById[t.stage_id] || "Design & Approval",
    date: shortDate(t.due_date) || shortDate(t.created_at) || "Planned",
    assignee: "Team",
  }));

  const messageRows = (messages || []).map((m) => ({
    id: m.id,
    phase: stageById[m.stage_id] || "Design & Approval",
    role: m.author_role || "Team",
    name: m.author_role || "Team",
    time: shortDate(m.created_at) || "Recent",
    text: m.message,
    color: "#2A6496",
  }));

  return {
    projectId: resolvedProjectId,
    project,
    brief,
    v0Pack,
    phases: phaseRows,
    tasks: taskRows,
    messages: messageRows,
  };
}

/** Persist a new task on the board; returns the inserted row id (or null offline). */
export async function addProjectTask({ projectId, title, phaseName }) {
  if (!supabase || !projectId || !title?.trim()) return null;
  let stageId = null;
  try {
    if (phaseName) {
      const { data: stages } = await supabase
        .from("project_stages")
        .select("id, name")
        .eq("project_id", projectId);
      stageId = (stages || []).find((s) => s.name === phaseName)?.id || null;
    }
    const { data, error } = await supabase
      .from("project_tasks")
      .insert({ project_id: projectId, stage_id: stageId, title: title.trim() })
      .select("id")
      .maybeSingle();
    if (error) throw error;
    return data?.id || null;
  } catch (err) {
    console.warn("addProjectTask:", err?.message || err);
    return null;
  }
}

/** Persist a site-feed message; returns inserted row id (or null offline). */
export async function addProjectMessage({ projectId, text, phaseName, authorRole = "Homeowner" }) {
  if (!supabase || !projectId || !text?.trim()) return null;
  try {
    let stageId = null;
    if (phaseName) {
      const { data: stages } = await supabase
        .from("project_stages")
        .select("id, name")
        .eq("project_id", projectId);
      stageId = (stages || []).find((s) => s.name === phaseName)?.id || null;
    }
    const { data, error } = await supabase
      .from("project_messages")
      .insert({ project_id: projectId, stage_id: stageId, author_role: authorRole, message: text.trim() })
      .select("id")
      .maybeSingle();
    if (error) throw error;
    return data?.id || null;
  } catch (err) {
    console.warn("addProjectMessage:", err?.message || err);
    return null;
  }
}

/** Persist a task done/todo toggle. */
export async function setProjectTaskDone(taskId, done) {
  if (!supabase || !taskId) return;
  try {
    const { error } = await supabase
      .from("project_tasks")
      .update({ status: done ? "done" : "todo", updated_at: new Date().toISOString() })
      .eq("id", taskId);
    if (error) throw error;
  } catch (err) {
    console.warn("setProjectTaskDone:", err?.message || err);
  }
}
