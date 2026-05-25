import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useHmSession } from "../hooks/useHmSession";

/** Requires signed-in professional for /pro/dashboard. */
export default function ProDashboardGuard({ children }) {
  const session = useHmSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate("/sign-in?role=pro&redirect=%2Fpro%2Fdashboard", { replace: true });
      return;
    }
    if (session.role !== "pro") {
      navigate("/build", { replace: true });
    }
  }, [session, navigate]);

  if (!session || session.role !== "pro") {
    return (
      <div className="min-h-screen bg-[#FBF7F2] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#C85F2B]" />
      </div>
    );
  }

  return children;
}
