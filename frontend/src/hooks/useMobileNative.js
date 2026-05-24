import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

const STORAGE_KEY = "hm_force_mobile";

export function detectMobileNative() {
  if (Capacitor.isNativePlatform()) return true;
  try {
    if (localStorage.getItem(STORAGE_KEY) === "1") return true;
  } catch (_) {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    const q = new URLSearchParams(window.location.search).get("mobile");
    if (q === "1") return true;
    if (q === "0") return false;
  }
  return false;
}

/** Enable mobile-native UI in browser: open `/?mobile=1` once (persists until `?mobile=0`). */
export function useMobileNative() {
  const [mobile, setMobile] = useState(detectMobileNative);

  useEffect(() => {
    const apply = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mobile") === "1") {
        try {
          localStorage.setItem(STORAGE_KEY, "1");
        } catch (_) {
          /* ignore */
        }
      }
      if (params.get("mobile") === "0") {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (_) {
          /* ignore */
        }
      }
      const on = detectMobileNative();
      setMobile(on);
      document.documentElement.classList.toggle("hm-mobile-app", on);
      document.body.classList.toggle("hm-mobile-app", on);
    };
    apply();
    window.addEventListener("storage", apply);
    return () => window.removeEventListener("storage", apply);
  }, []);

  return mobile;
}
