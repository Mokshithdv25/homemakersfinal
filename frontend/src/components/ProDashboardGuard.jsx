import React from "react";
import { AUTH_UI_ENABLED } from "../lib/authMode";

/** Optional pro dashboard gate — disabled in open-access mode. */
export default function ProDashboardGuard({ children }) {
  if (!AUTH_UI_ENABLED) return children;
  return children;
}
