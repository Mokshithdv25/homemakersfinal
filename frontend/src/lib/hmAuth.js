import { fetchOwnedPortfolio } from "./api";
import { getSupabase } from "./supabaseClient";

/** Read cached session written by {@link persistHmSessionFromSupabase}. */
export function readHmSession() {
  try {
    const session = JSON.parse(localStorage.getItem("hmSession") || "null");
    const user = JSON.parse(localStorage.getItem("hmUser") || "null");
    if (!session?.signedInAt) return null;
    return {
      role: session.role || "homeowner",
      signedInAt: session.signedInAt,
      supabaseUserId: session.supabaseUserId || user?.supabaseUserId,
      profile: {
        name: user?.name || session.profile?.name || "",
        email: user?.email || session.profile?.email || "",
        phone: user?.phone || session.profile?.phone || "",
        city: user?.city || session.profile?.city || "",
      },
    };
  } catch {
    return null;
  }
}

export function getProfileInitial(session) {
  const name = session?.profile?.name || session?.profile?.email || "";
  const ch = String(name).trim().charAt(0);
  return ch ? ch.toUpperCase() : "?";
}

/** Portfolio wizard progress from local draft (device). */
export function readProPortfolioState() {
  try {
    const raw = localStorage.getItem("hm_portfolio");
    const parsed = raw ? JSON.parse(raw) : null;
    const hasId = Boolean(localStorage.getItem("hm_portfolio_id"));
    if (parsed?.published) return { status: "published", step: 4 };
    if (parsed?.step) return { status: "draft", step: Number(parsed.step) || 1 };
    if (hasId) return { status: "draft", step: 1 };
    return { status: "none", step: 0 };
  } catch {
    return { status: "none", step: 0 };
  }
}

/** Cache server portfolio row for device-side resume paths. */
export function persistProPortfolioCache(row) {
  if (!row?.id) return;
  try {
    localStorage.setItem("hm_portfolio_id", row.id);
    localStorage.setItem(
      "hm_portfolio",
      JSON.stringify({
        id: row.id,
        craft: row.craft,
        step: row.step ?? 1,
        published: Boolean(row.published),
        slug: row.slug || null,
        full_name: row.full_name || "",
        business_name: row.business_name || "",
        city: row.city || "",
        profile_strength: row.profile_strength,
      }),
    );
  } catch {
    /* ignore */
  }
}

/** Pull the signed-in pro's portfolio from Supabase into localStorage (new device / cleared cache). */
export async function syncProPortfolioFromServer(ownerUserId) {
  if (!ownerUserId) return null;
  const row = await fetchOwnedPortfolio(ownerUserId);
  if (row) persistProPortfolioCache(row);
  return row;
}

export function getProPublicProfilePath() {
  try {
    const raw = localStorage.getItem("hm_portfolio");
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed?.published && parsed?.slug) return `/profile/${parsed.slug}`;
  } catch {
    /* ignore */
  }
  return null;
}

/** Best route for a pro after auth — dashboard if portfolio is live, else continue onboarding. */
export function getProLandingPath() {
  return getProOnboardingResumePath();
}

/** Resume portfolio wizard at the right step. */
export function getProOnboardingResumePath() {
  const { status, step } = readProPortfolioState();
  if (status === "published") return "/pro/dashboard";
  if (step >= 3) return "/portfolio";
  if (step >= 2) return "/portfolio";
  if (step >= 1 || status === "draft") return "/details";
  return "/craft";
}

export function getPostLoginPath(role, redirectPath) {
  if (redirectPath && String(redirectPath).startsWith("/")) {
    return redirectPath;
  }
  if (role === "pro") return getProOnboardingResumePath();
  return "/build";
}

export async function signOutHm() {
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.auth.signOut();
    } catch (_) {
      /* ignore */
    }
  }
  try {
    localStorage.removeItem("hmSession");
    localStorage.removeItem("hmUser");
  } catch (_) {
    /* ignore */
  }
}
