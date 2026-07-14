import { Capacitor } from "@capacitor/core";

/** True when running inside the iOS or Android Capacitor shell (not mobile browser). */
export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export function nativePlatform() {
  return Capacitor.getPlatform();
}

/**
 * Status bar, splash, keyboard, and Android hardware back — call once at boot.
 */
export async function initNativeShell() {
  if (!Capacitor.isNativePlatform()) return;

  document.documentElement.classList.add("hm-native", "hm-mobile-app");
  document.body.classList.add("hm-native", "hm-mobile-app");

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Light });
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#FBF7F2" });
    }
  } catch (e) {
    console.warn("StatusBar:", e);
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch (e) {
    console.warn("SplashScreen:", e);
  }

  try {
    const { App } = await import("@capacitor/app");
    const { handleNativeAuthCallback } = await import("./nativeAuth");
    App.addListener("appUrlOpen", ({ url }) => {
      void handleNativeAuthCallback(url).catch((error) => {
        console.warn("Native auth callback:", error?.message || error);
      });
    });
    const launch = await App.getLaunchUrl();
    if (launch?.url) await handleNativeAuthCallback(launch.url);

    if (Capacitor.getPlatform() === "android") {
      App.addListener("backButton", () => {
        if (window.location.pathname === "/") {
          App.minimizeApp();
        } else if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.assign("/");
        }
      });
    }
  } catch (e) {
    console.warn("App lifecycle:", e);
  }
}
