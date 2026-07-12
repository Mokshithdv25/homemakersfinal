import { createClient } from "@supabase/supabase-js";

const url = (process.env.REACT_APP_SUPABASE_URL || "").trim();
const key = (process.env.REACT_APP_SUPABASE_ANON_KEY || "").trim();

let client = null;
let initError = null;
export const SUPABASE_AUTH_STORAGE_KEY = "hm-supabase-auth";

function authStoragePrefixes() {
  const prefixes = [SUPABASE_AUTH_STORAGE_KEY];
  try {
    const projectRef = new URL(url).hostname.split(".")[0];
    if (projectRef) prefixes.push(`sb-${projectRef}-auth-token`);
  } catch (_) {
    /* invalid URL is handled by isConfigured */
  }
  return prefixes;
}

/** Remove both the explicit key and the legacy Supabase default, including PKCE helpers. */
export function clearSupabaseLocalSession() {
  try {
    const prefixes = authStoragePrefixes();
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const keyName = localStorage.key(i);
      if (keyName && prefixes.some((prefix) => keyName.startsWith(prefix))) keys.push(keyName);
    }
    keys.forEach((keyName) => localStorage.removeItem(keyName));
  } catch (_) {
    /* localStorage can be unavailable in hardened browser contexts */
  }
  try {
    client?.auth?.stopAutoRefresh?.();
  } catch (_) {
    /* ignore */
  }
  client = null;
}

function isConfigured() {
  if (!url || !key) return false;
  if (url.includes("undefined") || key.includes("undefined")) return false;
  return url.startsWith("https://") && url.includes(".supabase.co");
}

/** Last init failure (for diagnostics on sign-in). */
export function getSupabaseInitError() {
  return initError;
}

export function isSupabaseConfigured() {
  return isConfigured() && !initError;
}

/** Single browser client so auth session is shared app-wide. */
export function getSupabase() {
  if (!isConfigured()) return null;
  if (client) return client;
  if (initError) return null;
  try {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: SUPABASE_AUTH_STORAGE_KEY,
        flowType: "pkce",
      },
    });
    return client;
  } catch (err) {
    initError = err;
    console.error("[supabase] createClient failed:", err);
    return null;
  }
}
