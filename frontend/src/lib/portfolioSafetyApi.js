import { getSupabase } from "./supabaseClient";

const BLOCKED_KEY = "hm_blocked_portfolios";

function readLocalBlocked() {
  try {
    const parsed = JSON.parse(localStorage.getItem(BLOCKED_KEY) || "[]");
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeLocalBlocked(ids) {
  try {
    localStorage.setItem(BLOCKED_KEY, JSON.stringify([...ids]));
  } catch (_) {
    /* local blocking still applies for the current page lifecycle */
  }
}

export async function loadBlockedPortfolioIds() {
  const ids = readLocalBlocked();
  const sb = getSupabase();
  if (!sb) return ids;
  const { data: authData } = await sb.auth.getSession();
  const userId = authData?.session?.user?.id;
  if (!userId) return ids;
  const { data, error } = await sb
    .from("blocked_portfolios")
    .select("portfolio_id")
    .eq("user_id", userId);
  if (!error) (data || []).forEach((row) => ids.add(String(row.portfolio_id)));
  writeLocalBlocked(ids);
  return ids;
}

export async function blockPortfolio(portfolioId) {
  if (!portfolioId) return;
  const ids = readLocalBlocked();
  ids.add(String(portfolioId));
  writeLocalBlocked(ids);
  const sb = getSupabase();
  if (!sb) return;
  const { data: authData } = await sb.auth.getSession();
  const userId = authData?.session?.user?.id;
  if (!userId) return;
  const { error } = await sb
    .from("blocked_portfolios")
    .insert({ user_id: userId, portfolio_id: String(portfolioId) });
  if (error && error.code !== "23505") throw error;
}

export async function reportPortfolio(portfolioId, reason, details = "") {
  const allowed = new Set([
    "spam",
    "harassment",
    "sexual_content",
    "hate_or_violence",
    "impersonation",
    "other",
  ]);
  if (!portfolioId || !allowed.has(reason)) throw new Error("Choose a valid report reason.");
  const sb = getSupabase();
  if (!sb) throw new Error("Reporting is not available on this deployment.");
  const { data: authData } = await sb.auth.getSession();
  const userId = authData?.session?.user?.id;
  if (!userId) throw new Error("Sign in before reporting a profile.");
  const { error } = await sb.from("portfolio_reports").insert(
    {
      portfolio_id: String(portfolioId),
      reporter_user_id: userId,
      reason,
      details: String(details || "").trim().slice(0, 1000) || null,
    },
  );
  if (error && error.code !== "23505") throw error;
  await blockPortfolio(portfolioId);
}
