import { getSupabase } from "./supabaseClient";

const LEAD_FIELDS = [
  "project_id",
  "title",
  "flow_type",
  "city",
  "state",
  "budget_min",
  "budget_max",
  "timeline_completion",
  "scope_label",
  "styles_json",
  "posted_at",
  "targeted_to_you",
].join(", ");

const RESPONSE_FIELDS = "id, project_id, portfolio_id, status, response_note, proposed_budget, created_at, updated_at";

function schemaIsMissing(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("schema cache") ||
    message.includes("could not find the table") ||
    (message.includes("relation") && message.includes("does not exist"))
  );
}

function normalizeStyles(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function leadStatusLabel(status) {
  return {
    new: "New",
    viewed: "Viewed",
    interested: "Interested",
    proposal_sent: "Proposal sent",
    won: "Active project",
    declined: "Declined",
  }[status] || "New";
}

export async function listProLeads(portfolioId) {
  const supabase = getSupabase();
  if (!supabase || !portfolioId) {
    return { leads: [], configured: Boolean(supabase), error: portfolioId ? null : "Finish your professional profile to receive leads." };
  }

  const [leadResult, responseResult] = await Promise.all([
    supabase.from("pro_lead_opportunities").select(LEAD_FIELDS).order("posted_at", { ascending: false }),
    supabase.from("project_lead_responses").select(RESPONSE_FIELDS).eq("portfolio_id", portfolioId),
  ]);

  const firstError = leadResult.error || responseResult.error;
  if (firstError) {
    if (schemaIsMissing(firstError)) return { leads: [], configured: false, error: null };
    throw firstError;
  }

  const responses = new Map((responseResult.data || []).map((row) => [String(row.project_id), row]));
  const leads = (leadResult.data || []).map((row) => {
    const response = responses.get(String(row.project_id)) || null;
    return {
      ...row,
      styles: normalizeStyles(row.styles_json),
      response,
      status: response?.status || "new",
    };
  });

  return { leads, configured: true, error: null };
}

export async function updateProLeadResponse({ projectId, portfolioId, status, note = null, proposedBudget = null }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Professional leads are not configured.");
  if (!projectId || !portfolioId) throw new Error("Choose a valid homeowner project.");
  if (!["viewed", "interested", "proposal_sent", "won", "declined"].includes(status)) {
    throw new Error("Choose a valid lead status.");
  }

  const row = {
    project_id: projectId,
    portfolio_id: portfolioId,
    status,
    response_note: note || null,
    proposed_budget: proposedBudget == null || proposedBudget === "" ? null : Number(proposedBudget),
  };

  const { data, error } = await supabase
    .from("project_lead_responses")
    .upsert(row, { onConflict: "project_id,portfolio_id" })
    .select(RESPONSE_FIELDS)
    .single();
  if (error) throw error;
  return data;
}
