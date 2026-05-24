import "@/App.css";
import "./mobile/mobile.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { getSupabase } from "./lib/supabaseClient";
import { fetchUserProfile, persistHmSessionFromSupabase } from "./lib/userProfileApi";
import { claimAnonymousProjects } from "./lib/projectFlowApi";
import { useMobileNative } from "./hooks/useMobileNative";
import MobileAppRoutes from "./mobile/MobileAppRoutes";
import HomePage from "./pages/HomePage";
import SignInPage from "./pages/SignInPage";
import AccountPage from "./pages/AccountPage";
import SignInErrorBoundary from "./components/SignInErrorBoundary";
import CraftSelection from "./pages/CraftSelection";
import YourDetails from "./pages/YourDetails";
import YourPortfolio from "./pages/YourPortfolio";
import GoLive from "./pages/GoLive";
import PortfolioPage from "./pages/PortfolioPage";
import WhatAreYouBuilding from "./pages/WhatAreYouBuilding";
import BuildNewHome from "./pages/BuildNewHome";
import RemodelHome from "./pages/RemodelHome";
import ProjectDashboard from "./pages/ProjectDashboard";
import Marketplace from "./pages/Marketplace";
import ShopPage from "./pages/ShopPage";
import DocumentVault from "./pages/DocumentVault";
import ProjectDesignJourney from "./pages/ProjectDesignJourney";
import TeamPage from "./pages/TeamPage";
import StageDashboard from "./pages/StageDashboard";
import ProDashboard from "./pages/ProDashboard";
import ProOnboardingGuard from "./components/ProOnboardingGuard";
import ProDashboardGuard from "./components/ProDashboardGuard";

function ScrollToTopOnRouteChange() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const scrollers = document.querySelectorAll("main, [data-scroll-root], .overflow-y-auto, .overflow-auto");
      scrollers.forEach((el) => {
        if (el && typeof el.scrollTo === "function") {
          el.scrollTo({ top: 0, left: 0, behavior: "auto" });
        } else if (el) {
          el.scrollTop = 0;
          el.scrollLeft = 0;
        }
      });
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [pathname, search, hash]);

  return null;
}

function DesktopRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/sign-in"
        element={
          <SignInErrorBoundary>
            <SignInPage />
          </SignInErrorBoundary>
        }
      />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/craft" element={<CraftSelection />} />
      <Route path="/details" element={<YourDetails />} />
      <Route path="/portfolio" element={<YourPortfolio />} />
      <Route path="/live" element={<GoLive />} />
      <Route path="/profile/:slug" element={<PortfolioPage />} />
      <Route path="/build" element={<WhatAreYouBuilding />} />
      <Route path="/build/new-home" element={<BuildNewHome />} />
      <Route path="/build/remodel" element={<RemodelHome />} />
      <Route path="/project" element={<ProjectDashboard />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/browse" element={<Marketplace />} />
      <Route path="/project/browse" element={<Marketplace />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/project/shop" element={<ShopPage />} />
      <Route path="/documents" element={<DocumentVault />} />
      <Route path="/project/journey" element={<ProjectDesignJourney />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/stage" element={<StageDashboard />} />
      <Route
        path="/pro/dashboard"
        element={
          <ProDashboardGuard>
            <ProDashboard />
          </ProDashboardGuard>
        }
      />
    </Routes>
  );
}

function AppRoutes() {
  const mobileNative = useMobileNative();
  if (mobileNative) return <MobileAppRoutes />;
  return <DesktopRoutes />;
}

function App() {
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return undefined;

    const syncSession = async (session) => {
      if (!session?.user) return;
      let profile = null;
      try {
        profile = await fetchUserProfile(session.user.id);
      } catch (_) {
        /* table missing or RLS — still keep auth session */
      }
      persistHmSessionFromSupabase(session.user, profile);
      try {
        await claimAnonymousProjects(session.user.id);
      } catch (_) {
        /* projects table / RLS may not be ready yet */
      }
    };

    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) syncSession(session);
    });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, session) => {
      if (session) syncSession(session);
      else if (event === "SIGNED_OUT") {
        try {
          localStorage.removeItem("hmSession");
          localStorage.removeItem("hmUser");
        } catch (_) {
          /* ignore */
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <ScrollToTopOnRouteChange />
        <AppRoutes />
      </BrowserRouter>
    </div>
  );
}

export default App;
