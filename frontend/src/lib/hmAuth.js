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

/** Where homeowners land after sign-in; pros go to pro dashboard. */
export function getPostLoginPath(role) {
  return role === "pro" ? "/pro/dashboard" : "/build";
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
