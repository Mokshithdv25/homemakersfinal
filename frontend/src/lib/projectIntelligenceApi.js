import { getSupabase } from "./supabaseClient";

const MATERIAL_FIELDS = "id, project_id, category, item_name, quantity, unit, preferred_brand, status, notes, source_artifact, seed_key, sort_order, created_at, updated_at";
const ACTION_FIELDS = "id, project_id, action_type, title, rationale, payload_json, status, approved_by_user_id, approved_at, executed_at, created_at, updated_at";

export const MATERIAL_BRANDS = {
  Cement: ["UltraTech", "ACC", "Ambuja", "Dalmia", "Shree Cement"],
  Steel: ["Tata Tiscon", "JSW Neosteel", "SAIL", "Kamdhenu"],
  Masonry: ["Magicrete", "Siporex", "Biltech", "Local approved vendor"],
  Flooring: ["Kajaria", "Somany", "Johnson", "Orientbell"],
  Paint: ["Asian Paints", "Berger", "Nerolac", "Dulux"],
  Electrical: ["Polycab", "Havells", "Finolex", "RR Kabel"],
  Plumbing: ["Astral", "Ashirvad", "Supreme", "Prince"],
  Waterproofing: ["Dr. Fixit", "Fosroc", "Sika", "MYK Arment"],
  Joinery: ["Greenply", "CenturyPly", "Merino", "Action Tesa"],
  Other: ["To be selected"],
};

function schemaIsMissing(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();
  return code === "42P01" || code === "PGRST205" || message.includes("schema cache") || (message.includes("relation") && message.includes("does not exist"));
}

function positiveNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return 0;
}

function rounded(value, step = 1) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.max(step, Math.ceil(value / step) * step);
}

function makeSeed(projectId, category, itemName, quantity, unit, sortOrder, notes) {
  const slug = `${category}-${itemName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return {
    id: `draft-${slug}`,
    project_id: projectId,
    category,
    item_name: itemName,
    quantity,
    unit,
    preferred_brand: "",
    status: "suggested",
    notes,
    source_artifact: "brief_and_v0_estimate",
    seed_key: slug,
    sort_order: sortOrder,
  };
}

/** Editable planning takeoff derived from the saved brief and AI v0 scope. */
export function deriveMaterialTakeoff({ projectId, brief = {}, v0Pack = null } = {}) {
  const isRemodel = Boolean(brief.room || brief.mainGoal || brief.completionTime) && !brief.homeType;
  const plotArea = positiveNumber(brief.plotArea, brief.area, brief.builtUpArea);
  const roomArea = positiveNumber(
    positiveNumber(brief.len, brief.length) * positiveNumber(brief.breadth, brief.width),
    brief.roomArea,
    brief.area,
  );
  const floors = Math.max(1, positiveNumber(brief.floors, brief.floorCount, 1));
  const workingArea = isRemodel
    ? Math.max(roomArea || 150, 60)
    : Math.max(positiveNumber(brief.builtUpArea, plotArea ? plotArea * Math.min(floors, 4) * 0.72 : 0) || 1200, 400);
  const estimateLabels = (v0Pack?.estimate?.estimate_lines || []).map((line) => String(line?.label || "").toLowerCase());
  const rows = [];
  let index = 0;
  const add = (category, name, quantity, unit, notes) => rows.push(makeSeed(projectId, category, name, rounded(quantity), unit, index++, notes));

  if (isRemodel) {
    add("Flooring", "Floor tiles with 10% cutting allowance", workingArea * 1.1, "sq ft", "Derived from saved room dimensions; confirm tile module and laying pattern.");
    add("Flooring", "Tile adhesive", workingArea / 45, "20 kg bag", "Planning allowance for prepared substrate.");
    add("Paint", "Interior wall paint", workingArea * 0.1, "litre", "Two-coat planning allowance; actual coverage depends on surface and product.");
    add("Electrical", "Copper cable", workingArea * 2.2, "metre", "Draft allowance; electrician must validate circuits and wire sizes.");
    add("Joinery", "Plywood / board", workingArea * 0.22, "sq ft", "Included where the remodel brief indicates storage or carpentry.");
    add("Waterproofing", "Waterproofing system", Math.max(workingArea * 0.18, 25), "sq ft", "Use for wet areas only after site verification.");
  } else {
    add("Cement", "PPC / OPC cement", workingArea * 0.4, "50 kg bag", "Early-stage residential planning coefficient; structural BOQ must govern procurement.");
    add("Steel", "TMT reinforcement steel", workingArea * 4, "kg", "Indicative only; use engineer-issued bar bending schedule before ordering.");
    add("Masonry", "AAC blocks / masonry units", workingArea * 0.8, "unit", "Walling allowance derived from built-up area.");
    add("Flooring", "Floor tiles with wastage", workingArea * 1.08, "sq ft", "Includes an 8% planning allowance for cuts and breakage.");
    add("Paint", "Interior and exterior paint", workingArea * 0.12, "litre", "Planning allowance based on built-up area, coats, and typical wall surface.");
    add("Electrical", "Copper cable", workingArea * 4, "metre", "Electrician must validate circuits, loads, and wire sizes.");
    add("Plumbing", "Water supply and drainage pipe", workingArea * 0.75, "metre", "Draft combined allowance; plumbing drawings take precedence.");
    add("Waterproofing", "Wet-area waterproofing", workingArea * 0.2, "sq ft", "Bathrooms, balconies, utility, and terrace zones require measured quantities.");
  }

  if (estimateLabels.some((label) => label.includes("kitchen") || label.includes("carpentry")) && !rows.some((row) => row.category === "Joinery")) {
    add("Joinery", "Kitchen / storage board allowance", workingArea * 0.12, "sq ft", "Added from the AI v0 estimate scope.");
  }
  return rows;
}

export async function loadProjectIntelligence({ projectId, brief, v0Pack }) {
  const supabase = getSupabase();
  const draft = deriveMaterialTakeoff({ projectId, brief, v0Pack });
  if (!supabase || !projectId) return { materials: draft, actions: [], configured: false };

  const [materialsResult, actionsResult] = await Promise.all([
    supabase.from("project_material_items").select(MATERIAL_FIELDS).eq("project_id", projectId).neq("status", "removed").order("sort_order"),
    supabase.from("project_agent_actions").select(ACTION_FIELDS).eq("project_id", projectId).order("created_at", { ascending: false }),
  ]);
  const firstError = materialsResult.error || actionsResult.error;
  if (firstError) {
    if (schemaIsMissing(firstError)) return { materials: draft, actions: [], configured: false };
    throw firstError;
  }

  let materials = materialsResult.data || [];
  if (!materials.length && draft.length) {
    const rows = draft.map(({ id, ...row }) => row);
    const { data, error } = await supabase
      .from("project_material_items")
      .upsert(rows, { onConflict: "project_id,seed_key", ignoreDuplicates: true })
      .select(MATERIAL_FIELDS);
    if (error) throw error;
    materials = data || [];
  }
  return { materials, actions: actionsResult.data || [], configured: true };
}

export async function listProjectMaterials(projectId) {
  const supabase = getSupabase();
  if (!supabase || !projectId) return [];
  const { data, error } = await supabase
    .from("project_material_items")
    .select(MATERIAL_FIELDS)
    .eq("project_id", projectId)
    .neq("status", "removed")
    .order("sort_order");
  if (error) {
    if (schemaIsMissing(error)) return [];
    throw error;
  }
  return data || [];
}

export async function saveProjectMaterial(projectId, item) {
  const supabase = getSupabase();
  if (!supabase || !projectId) throw new Error("Project material storage is not configured.");
  const payload = {
    project_id: projectId,
    category: item.category || "Other",
    item_name: String(item.item_name || "Material item").trim(),
    quantity: Math.max(0, Number(item.quantity || 0)),
    unit: String(item.unit || "unit").trim(),
    preferred_brand: String(item.preferred_brand || "").trim() || null,
    status: item.status || "suggested",
    notes: String(item.notes || "").trim() || null,
    source_artifact: item.source_artifact || "manual",
    seed_key: item.seed_key || null,
    sort_order: Number(item.sort_order || 0),
  };
  let query;
  if (String(item.id || "").startsWith("draft-") || !item.id) {
    query = supabase.from("project_material_items").upsert(payload, { onConflict: "project_id,seed_key" });
  } else {
    query = supabase.from("project_material_items").update(payload).eq("project_id", projectId).eq("id", item.id);
  }
  const { data, error } = await query.select(MATERIAL_FIELDS).single();
  if (error) throw error;
  return data;
}

export async function removeProjectMaterial(projectId, itemId) {
  const supabase = getSupabase();
  if (!supabase || !projectId || !itemId) throw new Error("Choose a saved material item.");
  const { error } = await supabase.from("project_material_items").update({ status: "removed" }).eq("project_id", projectId).eq("id", itemId);
  if (error) throw error;
}

export async function recordAgentDecision({ projectId, actionType, title, rationale, payload = {}, decision }) {
  const supabase = getSupabase();
  if (!supabase || !projectId) throw new Error("Project approval storage is not configured.");
  const status = decision === "approved" ? "approved" : "rejected";
  const row = {
    project_id: projectId,
    action_type: actionType,
    title,
    rationale: rationale || null,
    payload_json: payload,
    status,
    approved_at: status === "approved" ? new Date().toISOString() : null,
  };
  const { data: authData } = await supabase.auth.getSession();
  if (status === "approved") row.approved_by_user_id = authData?.session?.user?.id || null;
  const { data, error } = await supabase.from("project_agent_actions").insert(row).select(ACTION_FIELDS).single();
  if (error) throw error;
  return data;
}
