import { fetchOwnedPortfolio } from "./api";
import { getSupabase } from "./supabaseClient";
import { persistHmSessionFromSupabase } from "./userProfileApi";

const LAST_AUTH_USER_KEY = "hm_last_auth_user_id";
export const HM_SESSION_CLEARED_EVENT = "hm-session-cleared";

function notifySessionCleared() {
  try {
    window.dispatchEvent(new Event(HM_SESSION_CLEARED_EVENT));
  } catch {
    /* ignore */
  }
}

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

/** Clear device caches when a different Supabase user signs in (stale name / portfolio). */
export function clearHmUserDeviceCaches() {
  const keys = [
    "hmSession",
    "hmUser",
    "hm_portfolio",
    "hm_portfolio_id",
    "hm_build_new_flow",
    "hm_remodel_flow",
  ];
  keys.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  });
}

export function ensureUserDeviceIsolation(userId) {
  if (!userId) return;
  let previous = null;
  try {
    previous = localStorage.getItem(LAST_AUTH_USER_KEY);
  } catch {
    /* ignore */
  }
  if (previous && previous !== userId) {
    clearHmUserDeviceCaches();
  }
  try {
    localStorage.setItem(LAST_AUTH_USER_KEY, userId);
  } catch {
    /* ignore */
  }
}

/**
 * Role for this session: explicit sign-in intent (homeowner vs pro) wins over DB default.
 */
export function resolveSessionRole({ profile, user, signInIntent }) {
  if (signInIntent === "pro" || signInIntent === "homeowner") return signInIntent;
  const existing = readHmSession();
  if (existing?.supabaseUserId === user?.id && (existing.role === "pro" || existing.role === "homeowner")) {
    return existing.role;
  }
  if (profile?.role === "pro" || profile?.role === "homeowner") return profile.role;
  const meta = user?.user_metadata?.role;
  if (meta === "pro" || meta === "homeowner") return meta;
  return "homeowner";
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
  else {
    try {
      localStorage.removeItem("hm_portfolio");
      localStorage.removeItem("hm_portfolio_id");
    } catch {
      /* ignore */
    }
  }
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

/** Resume portfolio wizard at the right step, or dashboard when live. */
export function getProOnboardingResumePath() {
  const { status, step } = readProPortfolioState();
  if (status === "published") return "/pro/dashboard";
  if (step >= 3) return "/portfolio";
  if (step >= 2) return "/portfolio";
  if (step >= 1 || status === "draft") return "/details";
  return "/craft";
}

export function getProLandingPath() {
  return getProOnboardingResumePath();
}

export function getHomeownerLandingPath() {
  return "/project";
}

/** Where to send the user right after sign-in. */
export function getPostLoginPath(role, redirectPath) {
  const path = String(redirectPath || "").trim();
  if (path.startsWith("/") && !path.startsWith("/sign-in")) {
    return path;
  }
  if (role === "pro") return getProLandingPath();
  return getHomeownerLandingPath();
}

/**
 * After Supabase auth: isolate device caches, persist session role, sync pro portfolio when needed.
 */
export async function establishHmSession(user, profile, { signInIntent } = {}) {
  if (!user?.id) return null;
  ensureUserDeviceIsolation(user.id);
  const activeRole = resolveSessionRole({ profile, user, signInIntent });
  persistHmSessionFromSupabase(user, profile, { activeRole });
  if (activeRole === "pro") {
    try {
      await syncProPortfolioFromServer(user.id);
    } catch (_) {
      /* portfolio table may not be ready */
    }
  }
  return activeRole;
}

/** Clear local session and Supabase auth. Call after navigating away from guarded pages. */
export async function signOutHm() {
  try {
    clearHmUserDeviceCaches();
    localStorage.removeItem(LAST_AUTH_USER_KEY);
  } catch (_) {
    /* ignore */
  }
  notifySessionCleared();

  const sb = getSupabase();
  if (sb) {
    try {
      await sb.auth.signOut({ scope: "local" });
    } catch (_) {
      /* ignore */
    }
  }
  notifySessionCleared();
}
