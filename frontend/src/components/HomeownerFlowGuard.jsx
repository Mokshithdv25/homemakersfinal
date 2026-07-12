import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AUTH_UI_ENABLED } from "../lib/authMode";
import { useHmSession } from "../hooks/useHmSession";
import { buildSignInRedirect } from "../lib/requireHomeownerAuth";

/** Homeowner-only gate for project creation and project management. */
export default function HomeownerFlowGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useHmSession();
  const authLoading = session === undefined;
  const signedInHomeowner = Boolean(session?.supabaseUserId) && session.role !== "pro";
  const returnPath = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (!AUTH_UI_ENABLED) return;
    if (authLoading) return;
    if (session?.role === "pro") {
      navigate("/pro/dashboard", { replace: true });
      return;
    }
    if (!signedInHomeowner) {
      navigate(buildSignInRedirect(returnPath), { replace: true });
    }
  }, [authLoading, session?.role, signedInHomeowner, navigate, returnPath]);

  if (!AUTH_UI_ENABLED) return children;

  if (authLoading || session?.role === "pro") {
    return (
      <div className="min-h-screen bg-[#FBF7F2] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#C85F2B]" />
      </div>
    );
  }

  if (!signedInHomeowner) return null;
  return children;
}
