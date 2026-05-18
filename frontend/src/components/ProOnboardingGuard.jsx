import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useHmSession } from "../hooks/useHmSession";

/**
 * Requires pro sign-in before portfolio wizard pages (/craft, /details, /portfolio, /live).
 */
export default function ProOnboardingGuard({ children }) {
  const session = useHmSession();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (session) return;
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}`);
    navigate(`/sign-in?role=pro&mode=signup&redirect=${returnTo}`, { replace: true });
  }, [session, navigate, location.pathname, location.search]);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#FBF7F2] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#C85F2B]" />
      </div>
    );
  }

  if (session.role !== "pro") {
    return (
      <div className="min-h-screen bg-[#FBF7F2] flex items-center justify-center p-6">
        <div className="max-w-md text-center font-body text-sm text-[#57534E]">
          This flow is for professionals.{" "}
          <button
            type="button"
            className="text-[#C85F2B] font-semibold underline bg-transparent border-none cursor-pointer"
            onClick={() => navigate("/build")}
          >
            Go to homeowner projects
          </button>
        </div>
      </div>
    );
  }

  return children;
}
