import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "";
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON_KEY || "";
const supabase =
  SUPABASE_URL && SUPABASE_ANON ? createClient(SUPABASE_URL, SUPABASE_ANON) : null;

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

function seedFromBrief(brief, flowType, aiPlan = null) {
  const area = Number(brief?.plotArea || brief?.len || 0) * Number(brief?.breadth || 1);
  const style = Array.isArray(brief?.styles) ? brief.styles.join(" + ") : brief?.style || "selected style";
  const location = brief?.location || brief?.city || "project location";
  const goal = brief?.mainGoal || (Array.isArray(brief?.lifestyle) ? brief.lifestyle[0] : "") || "project goals";

  const phases = [
    { name: "Design & Approval", pct: 20, color: "#C85F2B", status: "In Progress", statusColor: "#F59E0B" },
    { name: "Sourcing", pct: 10, color: "#F59E0B", status: "Upcoming", statusColor: "#9A8F87" },
    { name: "Site & Foundation", pct: 0, color: "#A8A29E", status: "Upcoming", statusColor: "#9A8F87" },
    { name: "Structure", pct: 0, color: "#A8A29E", status: "Upcoming", statusColor: "#9A8F87" },
    { name: "Finishing", pct: 0, color: "#A8A29E", status: "Upcoming", statusColor: "#9A8F87" },
  ];

  const llmMilestones = Array.isArray(aiPlan?.milestones) ? aiPlan.milestones : [];

  const tasks = llmMilestones.length
    ? llmMilestones.slice(0, 5).map((m, idx) => ({
        done: false,
        name: String(m?.title || `Milestone ${idx + 1}`),
        phase: phases[Math.min(idx, phases.length - 1)].name,
        date: String(m?.timeframe || "Planned"),
        assignee: "Team",
      }))
    : [
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
      text: `Primary direction captured: ${goal}.`,
      color: "#2A6496",
    },
  ];

  return { phases, tasks, messages };
}

export async function createFlowProjectRecord({ flowType, brief, source = "flow", aiPlan = null }) {
  if (!supabase) return null;

  const title =
    brief?.title ||
    (flowType === "remodel"
      ? `${brief?.room || "Remodel"} remodel`
      : `${brief?.homeType || "New home"} build`);

  const city = brief?.city || "";
  const location = brief?.location || "";
  const budgetBand = brief?.budgetUnit ? `${brief?.budgetAmount || "0"} ${brief?.budgetUnit}` : null;
  const timeline = brief?.timeline || brief?.completionTime || "";

  const { data: createdProject, error: projectErr } = await supabase
    .from("projects")
    .insert({
      title,
      flow_type: flowType,
      status: "planning",
      source,
      location,
      city,
      timeline_completion: timeline,
      budget_min: null,
      budget_max: null,
    })
    .select("*")
    .single();

  if (projectErr) throw projectErr;

  const projectId = createdProject.id;

  const { error: briefErr } = await supabase.from("project_briefs").upsert(
    {
      project_id: projectId,
      brief_version: 1,
      brief_json: { ...brief, budgetBand },
      dream_vision: brief?.dreamVision || "",
      inspirations_json: brief?.visionInspirationItems || [],
      last_completed_step: Number(brief?.step || brief?.activeStep || 6),
      flow_status: "submitted",
      flow_step: "handoff",
    },
    { onConflict: "project_id" }
  );
  if (briefErr) throw briefErr;

  const seeded = seedFromBrief(brief, flowType, aiPlan);
  const stageRows = seeded.phases.map((p, idx) => ({
    project_id: projectId,
    name: p.name,
    sort_order: idx,
    status: p.status === "Done" ? "done" : p.status === "In Progress" ? "in_progress" : "upcoming",
    progress_percent: p.pct,
  }));

  const { data: stages } = await supabase.from("project_stages").insert(stageRows).select("*");
  const stageIdByName = Object.fromEntries((stages || []).map((s) => [s.name, s.id]));

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

  await supabase.from("project_messages").insert(
    seeded.messages.map((m) => ({
      project_id: projectId,
      stage_id: stageIdByName[m.phase] || null,
      author_role: m.role,
      message: m.text,
    }))
  );

  return { projectId, project: createdProject };
}

export async function loadProjectBoard({ projectId, source }) {
  if (!supabase) return null;

  let resolvedProjectId = projectId || "";
  let project = null;

  if (!resolvedProjectId) {
    const flowType = mapFlowType(source);
    if (flowType) {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("flow_type", flowType)
        .order("created_at", { ascending: false })
        .limit(1);
      project = data?.[0] || null;
      resolvedProjectId = project?.id || "";
    }
  }

  if (!resolvedProjectId) return null;

  if (!project) {
    const { data } = await supabase.from("projects").select("*").eq("id", resolvedProjectId).limit(1);
    project = data?.[0] || null;
  }

  const { data: briefRows } = await supabase
    .from("project_briefs")
    .select("*")
    .eq("project_id", resolvedProjectId)
    .limit(1);
  const brief = briefRows?.[0]?.brief_json || {};
  const flowType = project?.flow_type || mapFlowType(source) || "new_home";

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
      const seeded = seedFromBrief(brief, flowType);
    return { projectId: resolvedProjectId, project, ...seeded };
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

  const taskRows = (tasks || []).map((t) => ({
    done: t.status === "done",
    name: t.title,
    phase: stageById[t.stage_id] || "Design & Approval",
    date: "Planned",
    assignee: "Team",
  }));

  const messageRows = (messages || []).map((m) => ({
    phase: stageById[m.stage_id] || "Design & Approval",
    role: m.author_role || "Team",
    name: m.author_role || "Team",
    time: "Recent",
    text: m.message,
    color: "#2A6496",
  }));

  return {
    projectId: resolvedProjectId,
    project,
    phases: phaseRows,
    tasks: taskRows,
    messages: messageRows,
  };
}
