import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AUTH_UI_ENABLED } from "../lib/authMode";
import { useHmSession } from "../hooks/useHmSession";

/** Pro-only gate for dashboard and marketplace management tools. */
export default function ProDashboardGuard({ children }) {
  const navigate = useNavigate();
  const session = useHmSession();
  const authLoading = session === undefined;
  const signedIn = Boolean(session?.supabaseUserId);

  useEffect(() => {
    if (!AUTH_UI_ENABLED) return;
    if (authLoading) return;
    if (!signedIn) {
      navigate("/sign-in?mode=signin&role=pro&redirect=%2Fpro%2Fdashboard", { replace: true });
      return;
    }
    if (session?.role !== "pro") {
      navigate("/build", { replace: true });
    }
  }, [authLoading, signedIn, session?.role, navigate]);

  if (!AUTH_UI_ENABLED) return children;

  if (authLoading || !signedIn || session?.role !== "pro") {
    return (
      <div className="min-h-screen bg-[#FBF7F2] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#C85F2B]" />
      </div>
    );
  }

  return children;
}
