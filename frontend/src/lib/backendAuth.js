import { getSupabase } from "./supabaseClient";

/** Authorization headers for server endpoints that spend money or change billing state. */
export async function getBackendAuthHeaders() {
  const sb = getSupabase();
  if (!sb) throw new Error("Sign-in is not configured on this deployment.");
  const {
    data: { session },
    error,
  } = await sb.auth.getSession();
  if (error) throw error;
  if (!session?.access_token) {
    throw new Error("Your session has expired. Sign in again.");
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function withBackendAuth(config = {}) {
  return {
    ...config,
    headers: {
      ...(config.headers || {}),
      ...(await getBackendAuthHeaders()),
    },
  };
}
