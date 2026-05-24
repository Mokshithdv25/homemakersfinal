import { readHmSession } from "./hmAuth";

/**
 * Homeowner flows must be signed in before AI v0 (design + estimate persist to Supabase).
 * @returns {boolean} true if signed in with Supabase user id
 */
export function isHomeownerSignedIn() {
  const session = readHmSession();
  return Boolean(session?.supabaseUserId);
}

export function buildSignInRedirect(returnPath) {
  const path = returnPath && returnPath.startsWith("/") ? returnPath : "/build";
  return `/sign-in?mode=signin&redirect=${encodeURIComponent(path)}`;
}

/** Navigate into a homeowner wizard — sign in first if needed. */
export function navigateToHomeownerFlow(navigate, path, options) {
  const target = path && path.startsWith("/") ? path : "/build";
  if (isHomeownerSignedIn()) {
    navigate(target, options);
    return;
  }
  navigate(buildSignInRedirect(target), options);
}
