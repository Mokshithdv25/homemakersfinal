import { createClient } from "@supabase/supabase-js";

const url = process.env.REACT_APP_SUPABASE_URL || "";
const key = process.env.REACT_APP_SUPABASE_ANON_KEY || "";

let client = null;

/** Single browser client so auth session is shared app-wide. */
export function getSupabase() {
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
