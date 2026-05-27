import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { HM_SESSION_CLEARED_EVENT, readHmSession } from "../lib/hmAuth";
import { fetchUserProfile } from "../lib/userProfileApi";
import { establishHmSession } from "../lib/hmAuth";

/** Reactive homeowner/pro session from localStorage + Supabase auth events. */
export function useHmSession() {
  const [session, setSession] = useState(() => readHmSession());

  useEffect(() => {
    const refresh = () => setSession(readHmSession());
    refresh();

    let cancelled = false;

    // If Supabase has a session but our local cache is missing/stale, restore it.
    const hydrateFromSupabase = async () => {
      const sb = getSupabase();
      if (!sb) return;
      try {
        const { data: { session: sbSession } } = await sb.auth.getSession();
        if (!sbSession?.user || cancelled) return;
        const cached = readHmSession();
        if (cached?.supabaseUserId === sbSession.user.id) return;
        let profile = null;
        try {
          profile = await fetchUserProfile(sbSession.user.id);
        } catch (_) {
          /* ignore */
        }
        await establishHmSession(sbSession.user, profile);
        if (!cancelled) refresh();
      } catch (_) {
        /* ignore */
      }
    };
    void hydrateFromSupabase();

    const onStorage = (e) => {
      if (!e.key || e.key === "hmSession" || e.key === "hmUser") refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(HM_SESSION_CLEARED_EVENT, refresh);

    const sb = getSupabase();
    const subscription = sb
      ? sb.auth.onAuthStateChange(() => {
          refresh();
        }).data.subscription
      : null;

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(HM_SESSION_CLEARED_EVENT, refresh);
    };
  }, []);

  return session;
}
