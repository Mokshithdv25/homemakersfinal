import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { readHmSession } from "../lib/hmAuth";

/** Reactive homeowner/pro session from localStorage + Supabase auth events. */
export function useHmSession() {
  const [session, setSession] = useState(() => readHmSession());

  useEffect(() => {
    const refresh = () => setSession(readHmSession());
    refresh();

    const sb = getSupabase();
    if (!sb) return undefined;

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(() => {
      refresh();
    });

    const onStorage = (e) => {
      if (!e.key || e.key === "hmSession" || e.key === "hmUser") refresh();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return session;
}
