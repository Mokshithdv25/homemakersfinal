import React from "react";
import { useNavigate } from "react-router-dom";
import LandingNavbar from "../components/landing/LandingNavbar";
import LandingHero from "../components/landing/LandingHero";
import LandingInspirationSection from "../components/landing/LandingInspirationSection";
import LandingHowItWorks from "../components/landing/LandingHowItWorks";
import LandingWhyChooseUs from "../components/landing/LandingWhyChooseUs";
import LandingForProfessionals from "../components/landing/LandingForProfessionals";
import LandingTestimonials from "../components/landing/LandingTestimonials";
import LandingHomeQuickLinks from "../components/landing/LandingHomeQuickLinks";

/**
 * Marketing home — routed to this app’s /build, /shop, /project, /craft.
 */
export default function HomePage() {
  const navigate = useNavigate();

  const scrollToInspiration = () => {
    document.getElementById("landing-inspiration")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="hm-landing-page min-h-screen">
      <LandingNavbar />

      <LandingHero onGetStarted={() => navigate("/build")} onExploreDesigns={scrollToInspiration} />

      <LandingHomeQuickLinks />

      <LandingInspirationSection onExplore={() => navigate("/build")} />
      <LandingHowItWorks />
      <LandingWhyChooseUs />
      <LandingForProfessionals />
      <LandingTestimonials />

      <section className="border-t border-border/40 bg-gradient-to-b from-secondary/25 via-background to-background py-20 md:py-28">
        <div className="container max-w-2xl text-center">
          <p className="mb-1 font-body text-xs font-bold uppercase tracking-[0.16em] text-copper">Professionals</p>
          <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl">
            Architect, designer, engineer, or contractor?
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-body text-sm leading-relaxed text-muted-foreground md:text-base">
            One practice profile, one link for clients, and a portfolio that feels as serious as your work.
          </p>
          <button
            type="button"
            onClick={() => navigate("/craft")}
            className="mt-8 gradient-copper rounded-xl px-10 py-3.5 font-body text-base font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            Set up your practice
          </button>
        </div>
      </section>

      <footer className="py-12 border-t border-border bg-secondary">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="font-display text-xl font-semibold text-foreground">HomeMakers</div>
            <p className="text-muted-foreground font-body text-sm">© 2026 HomeMakers. Build or renovate with clarity.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
