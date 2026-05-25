import React from "react";
import { AUTH_UI_ENABLED } from "../lib/authMode";

/** Optional pro sign-in gate — disabled in open-access mode. */
export default function ProOnboardingGuard({ children }) {
  if (!AUTH_UI_ENABLED) return children;
  return children;
}
