import { readHmSession } from "./hmAuth";

/**
 * Homeowner flows: signed in with Supabase and active session role is homeowner.
 */
export function isHomeownerSignedIn() {
  const session = readHmSession();
  return Boolean(session?.supabaseUserId) && session.role !== "pro";
}

export function buildSignInRedirect(returnPath) {
  const path = returnPath && returnPath.startsWith("/") ? returnPath : "/build";
  return `/sign-in?mode=signin&role=homeowner&redirect=${encodeURIComponent(path)}`;
}

/** Navigate into a homeowner wizard — sign in as homeowner first if needed. */
export function navigateToHomeownerFlow(navigate, path, options) {
  const target = path && path.startsWith("/") ? path : "/build";
  if (isHomeownerSignedIn()) {
    navigate(target, options);
    return;
  }
  const session = readHmSession();
  if (session?.supabaseUserId && session.role === "pro") {
    navigate("/sign-in?role=homeowner&redirect=" + encodeURIComponent(target), options);
    return;
  }
  navigate(buildSignInRedirect(target), options);
}
