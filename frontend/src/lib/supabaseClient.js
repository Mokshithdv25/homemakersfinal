import { createClient } from "@supabase/supabase-js";

const url = (process.env.REACT_APP_SUPABASE_URL || "").trim();
const key = (process.env.REACT_APP_SUPABASE_ANON_KEY || "").trim();

let client = null;
let initError = null;

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
      },
    });
    return client;
  } catch (err) {
    initError = err;
    console.error("[supabase] createClient failed:", err);
    return null;
  }
}
