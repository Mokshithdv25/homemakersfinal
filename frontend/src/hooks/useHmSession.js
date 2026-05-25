import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { HM_SESSION_CLEARED_EVENT, readHmSession } from "../lib/hmAuth";

/** Reactive homeowner/pro session from localStorage + Supabase auth events. */
export function useHmSession() {
  const [session, setSession] = useState(() => readHmSession());

  useEffect(() => {
    const refresh = () => setSession(readHmSession());
    refresh();

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
      subscription?.unsubscribe();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(HM_SESSION_CLEARED_EVENT, refresh);
    };
  }, []);

  return session;
}
