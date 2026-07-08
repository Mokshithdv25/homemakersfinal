import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

const STORAGE_KEY = "hm_force_mobile";
/** Match mobile shell + wizard responsive rules in CSS */
export const MOBILE_VIEWPORT_MAX_PX = 900;

export function isNarrowViewport() {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia(`(max-width: ${MOBILE_VIEWPORT_MAX_PX}px)`).matches;
  } catch (_) {
    return false;
  }
}

export function detectMobileNative() {
  if (Capacitor.isNativePlatform()) return true;

  if (typeof window !== "undefined") {
    const q = new URLSearchParams(window.location.search).get("mobile");
    if (q === "0") return false;
    if (q === "1") return true;
  }

  try {
    if (localStorage.getItem(STORAGE_KEY) === "1") return true;
  } catch (_) {
    /* ignore */
  }

  return isNarrowViewport();
}

/** Mobile-native UI: Capacitor, `?mobile=1`, or viewport ≤ {@link MOBILE_VIEWPORT_MAX_PX}px. Use `?mobile=0` to force desktop on a phone. */
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

    let mq;
    try {
      mq = window.matchMedia(`(max-width: ${MOBILE_VIEWPORT_MAX_PX}px)`);
      mq.addEventListener("change", apply);
    } catch (_) {
      /* ignore */
    }
    window.addEventListener("resize", apply);

    return () => {
      window.removeEventListener("storage", apply);
      window.removeEventListener("resize", apply);
      if (mq) mq.removeEventListener("change", apply);
    };
  }, []);

  return mobile;
}
