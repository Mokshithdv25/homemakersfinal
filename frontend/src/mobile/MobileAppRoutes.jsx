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
import GoLive from "../pages/GoLive";
import ProDashboard from "../pages/ProDashboard";
import SubscriptionsPage from "../pages/SubscriptionsPage";
import AccountPage from "../pages/AccountPage";
import { AUTH_UI_ENABLED } from "../lib/authMode";
import HomeownerFlowGuard from "../components/HomeownerFlowGuard";

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
            <MobileWizardLayout title="New home" subtitle="Plot → AI v0 → project hub">
              <BuildNewHome />
            </MobileWizardLayout>
          </HomeownerFlowGuard>
        }
      />
      <Route
        path="/build/remodel"
        element={
          <HomeownerFlowGuard>
            <MobileWizardLayout title="Remodel" subtitle="Room vision → AI concepts">
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
      <Route path="/craft" element={<MobileWizardLayout title="Your craft" subtitle="Pro portfolio onboarding" backTo="/account"><CraftSelection /></MobileWizardLayout>} />
      <Route path="/details" element={<MobileWizardLayout title="Your details" subtitle="Business & contact" backTo="/craft"><YourDetails /></MobileWizardLayout>} />
      <Route path="/portfolio" element={<MobileWizardLayout title="Portfolio" subtitle="Photos & specialties" backTo="/details"><YourPortfolio /></MobileWizardLayout>} />
      <Route path="/live" element={<MobileWizardLayout title="Go live" subtitle="Publish to marketplace" backTo="/portfolio"><GoLive /></MobileWizardLayout>} />
      <Route path="/pro" element={withShell(ProDashboard)} />
      <Route path="*" element={withShell(MobileHomePage)} />
    </Routes>
  );
}
