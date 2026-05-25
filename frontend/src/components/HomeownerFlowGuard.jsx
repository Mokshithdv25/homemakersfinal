import React from "react";
import { AUTH_UI_ENABLED } from "../lib/authMode";

/** Optional homeowner sign-in gate — disabled in open-access mode. */
export default function HomeownerFlowGuard({ children }) {
  if (!AUTH_UI_ENABLED) return children;
  return children;
}
