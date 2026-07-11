import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MobileShell from "./MobileShell";
import MobileWizardLayout from "./MobileWizardLayout";
import MobileHomePage from "./pages/MobileHomePage";
import MobileDesignPage from "./pages/MobileDesignPage";
import MobileBuildPage from "./pages/MobileBuildPage";
import MobileProsPage from "./pages/MobileProsPage";
import MobileProjectPage from "./pages/MobileProjectPage";
import MobileAccountPage from "./pages/MobileAccountPage";
import MobilePhotoPage from "./pages/MobilePhotoPage";
import MobileDocumentsPage from "./pages/MobileDocumentsPage";
import MobileTeamPage from "./pages/MobileTeamPage";
import MobileShopPage from "./pages/MobileShopPage";
import MobileDesignJourneyPage from "./pages/MobileDesignJourneyPage";
import MobileProProfilePage from "./pages/MobileProProfilePage";
import SignInPage from "../pages/SignInPage";
import SignInErrorBoundary from "../components/SignInErrorBoundary";
import BuildNewHome from "../pages/BuildNewHome";
import RemodelHome from "../pages/RemodelHome";
import CraftSelection from "../pages/CraftSelection";
import YourDetails from "../pages/YourDetails";
import YourPortfolio from "../pages/YourPortfolio";
import PortfolioThemeStep from "../pages/PortfolioThemeStep";
import GoLive from "../pages/GoLive";
import ProDashboard from "../pages/ProDashboard";
import SubscriptionsPage from "../pages/SubscriptionsPage";
import AccountPage from "../pages/AccountPage";
import LegalPage from "../pages/LegalPage";
import { AUTH_UI_ENABLED } from "../lib/authMode";
import HomeownerFlowGuard from "../components/HomeownerFlowGuard";
import ProOnboardingGuard from "../components/ProOnboardingGuard";
import ProDashboardGuard from "../components/ProDashboardGuard";

function withShell(Page) {
  return (
    <MobileShell>
      <Page />
    </MobileShell>
  );
}

export default function MobileAppRoutes() {
  return (
    <Routes>
      <Route path="/" element={withShell(MobileHomePage)} />
      <Route path="/design" element={withShell(MobileDesignPage)} />
      <Route path="/ideas" element={<Navigate to="/design" replace />} />
      <Route path="/build" element={withShell(MobileBuildPage)} />
      <Route
        path="/build/new-home"
        element={
          <HomeownerFlowGuard>
            <MobileWizardLayout title="New home" subtitle="Brief → AI designs → your project">
              <BuildNewHome />
            </MobileWizardLayout>
          </HomeownerFlowGuard>
        }
      />
      <Route
        path="/build/remodel"
        element={
          <HomeownerFlowGuard>
            <MobileWizardLayout title="Remodel" subtitle="Room photos → AI concepts & costs">
              <RemodelHome />
            </MobileWizardLayout>
          </HomeownerFlowGuard>
        }
      />
      <Route path="/photo/:id" element={withShell(MobilePhotoPage)} />
      <Route path="/browse" element={withShell(MobileProsPage)} />
      <Route path="/marketplace" element={<Navigate to="/browse" replace />} />
      <Route path="/project/browse" element={withShell(MobileProsPage)} />
      <Route path="/project" element={withShell(MobileProjectPage)} />
      <Route path="/account" element={withShell(MobileAccountPage)} />
      <Route
        path="/account/settings"
        element={
          <MobileShell hideTabs>
            <AccountPage />
          </MobileShell>
        }
      />
      <Route path="/subscriptions" element={withShell(SubscriptionsPage)} />
      <Route
        path="/sign-in"
        element={
          AUTH_UI_ENABLED ? (
            <MobileShell hideTabs>
              <SignInErrorBoundary>
                <SignInPage />
              </SignInErrorBoundary>
            </MobileShell>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="/shop" element={withShell(MobileShopPage)} />
      <Route path="/project/shop" element={withShell(MobileShopPage)} />
      <Route path="/documents" element={withShell(MobileDocumentsPage)} />
      <Route path="/team" element={withShell(MobileTeamPage)} />
      <Route path="/project/journey" element={withShell(MobileDesignJourneyPage)} />
      <Route path="/profile/:slug" element={withShell(MobileProProfilePage)} />
      <Route path="/craft" element={<ProOnboardingGuard><MobileWizardLayout title="Your craft" subtitle="Pro portfolio onboarding" backTo="/account"><CraftSelection /></MobileWizardLayout></ProOnboardingGuard>} />
      <Route path="/details" element={<ProOnboardingGuard><MobileWizardLayout title="Your details" subtitle="Business & contact" backTo="/craft"><YourDetails /></MobileWizardLayout></ProOnboardingGuard>} />
      <Route path="/portfolio-theme" element={<ProOnboardingGuard><MobileWizardLayout title="Look & feel" subtitle="Theme & layout" backTo="/details"><PortfolioThemeStep /></MobileWizardLayout></ProOnboardingGuard>} />
      <Route path="/portfolio" element={<ProOnboardingGuard><MobileWizardLayout title="Portfolio" subtitle="Photos & specialties" backTo="/portfolio-theme"><YourPortfolio /></MobileWizardLayout></ProOnboardingGuard>} />
      <Route path="/live" element={<ProOnboardingGuard><MobileWizardLayout title="Go live" subtitle="Publish to marketplace" backTo="/portfolio"><GoLive /></MobileWizardLayout></ProOnboardingGuard>} />
      <Route path="/pro" element={<ProDashboardGuard>{withShell(ProDashboard)}</ProDashboardGuard>} />
      <Route path="/pro/dashboard" element={<ProDashboardGuard>{withShell(ProDashboard)}</ProDashboardGuard>} />
      <Route path="/terms" element={<MobileShell hideTabs><LegalPage kind="terms" /></MobileShell>} />
      <Route path="/privacy" element={<MobileShell hideTabs><LegalPage kind="privacy" /></MobileShell>} />
      <Route path="*" element={withShell(MobileHomePage)} />
    </Routes>
  );
}
