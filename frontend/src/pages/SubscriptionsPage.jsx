import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { HM_HEADER_BAR_CHROME_CLASS, HM_WORDMARK_TITLE_CLASS, hmLogoMarkSrc } from "../lib/hmBrand";
import { AUTH_UI_ENABLED } from "../lib/authMode";
import { useHmSession } from "../hooks/useHmSession";
import HmUserMenu from "../components/HmUserMenu";

/**
 * Billing & plan — placeholder until Stripe / India payments are wired.
 */
export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const session = useHmSession();

  React.useEffect(() => {
    if (AUTH_UI_ENABLED && !session) navigate("/sign-in?mode=signin&redirect=/subscriptions", { replace: true });
  }, [session, navigate]);

  if (AUTH_UI_ENABLED && !session) return null;

  const backPath = session?.role === "pro" ? "/pro/dashboard" : "/project";

  return (
    <div className="hm-landing-page min-h-screen bg-background flex flex-col">
      <header className={`flex items-center gap-3 md:gap-4 px-5 md:px-10 py-3 min-h-[4.65rem] ${HM_HEADER_BAR_CHROME_CLASS}`}>
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="inline-flex shrink-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer font-body"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer p-0 min-w-0"
        >
          <img src={hmLogoMarkSrc} alt="HomeMakers" className="w-12 h-12 shrink-0" width={48} height={48} />
          <span className={HM_WORDMARK_TITLE_CLASS}>HomeMakers</span>
        </button>
        <div className="flex-1" aria-hidden />
        <HmUserMenu />
      </header>

      <main className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          <h1 className="font-display text-2xl font-bold text-foreground m-0">My subscription</h1>
          <p className="font-body text-sm text-muted-foreground leading-relaxed m-0">
            You are on the <strong className="text-foreground">HomeMakers Free</strong> plan — AI v0 briefs, project hub, and portfolio basics.
            Paid tiers for unlimited v0 runs, team seats, and pro marketplace boosts are coming soon.
          </p>
          <div className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
            <p className="font-body text-xs font-bold uppercase tracking-wider text-muted-foreground m-0 mb-2">Current plan</p>
            <p className="font-display text-lg font-semibold text-foreground m-0">Free</p>
            <p className="font-body text-sm text-muted-foreground mt-2 m-0">₹0 / month · no card on file</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/account/settings")}
            className="font-body text-sm text-copper hover:underline bg-transparent border-none cursor-pointer p-0"
          >
            Account & settings →
          </button>
        </div>
      </main>
    </div>
  );
}
