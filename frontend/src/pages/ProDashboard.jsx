import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LandingNavbar from "../components/landing/LandingNavbar";
import HmHomiMascot from "../components/HmHomiMascot";
import HmProAssistant from "../components/HmProAssistant";
import { HM_FIXED_NAV_OFFSET_CLASS } from "../lib/hmBrand";
import { useHmSession } from "../hooks/useHmSession";
import { getProOnboardingResumePath, getProPublicProfilePath, readProPortfolioState } from "../lib/hmAuth";
import { unpublishPortfolio } from "../lib/api";
import { getPortfolioMedia, setPortfolioBase } from "../lib/portfolioStorage";
import { findCraft } from "../lib/crafts";
import { publicProfileUrl } from "../lib/publicWebUrl";

const OR = "#C85F2B";

function readPortfolioCache() {
  try {
    const raw = localStorage.getItem("hm_portfolio");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function Metric({ label, value, detail }) {
  return (
    <div style={{ border: "1px solid #E8E4DE", background: "#fff", borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ fontSize: 12, color: "#78716C", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#78716C", marginTop: 5 }}>{detail}</div>
    </div>
  );
}

export default function ProDashboard() {
  const navigate = useNavigate();
  const session = useHmSession();
  const portfolioState = readProPortfolioState();
  const [cache, setCache] = useState(readPortfolioCache);
  const media = cache?.id ? getPortfolioMedia(cache.id) : { photos: [] };
  const firstName = (session?.profile?.name || cache?.full_name || session?.profile?.email?.split("@")[0] || "there").split(" ")[0];
  const isSubmitted = Boolean(cache?.published && cache?.slug);
  const isApproved = isSubmitted;
  const profilePath = isApproved ? getProPublicProfilePath() : null;
  const profileStrength = Math.min(100, Number(cache?.profile_strength) || (isSubmitted ? 100 : portfolioState.step * 20));
  const craft = findCraft(cache?.craft);
  const shareUrl = isApproved ? publicProfileUrl(profilePath?.split("/").filter(Boolean).pop()) : "";
  const galleryCount = Array.isArray(media?.photos) ? media.photos.length : 0;
  const [copied, setCopied] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [unpublishError, setUnpublishError] = useState("");

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy your profile link:", shareUrl);
    }
  };

  const previewProfile = () => {
    if (profilePath) window.open(profilePath, "_blank", "noopener");
    else navigate(isSubmitted ? "/details" : getProOnboardingResumePath());
  };

  const shareProfile = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${firstName} on HomeMakers`, url: shareUrl });
        return;
      } catch {
        return;
      }
    }
    copyLink();
  };

  const handleUnpublish = async () => {
    if (!cache?.id || unpublishing) return;
    if (!window.confirm("Unpublish this portfolio? It will be removed from the public directory.")) return;
    setUnpublishing(true);
    setUnpublishError("");
    try {
      const updated = await unpublishPortfolio(cache.id);
      setPortfolioBase(updated);
      setCache(updated);
    } catch (error) {
      setUnpublishError(error?.response?.data?.detail || error?.message || "Could not unpublish your portfolio.");
    } finally {
      setUnpublishing(false);
    }
  };

  const proContext = {
    signedIn: Boolean(session),
    firstName,
    published: isApproved,
    profileStrength,
    profilePath,
    shareUrl,
    craftLabel: craft?.name || cache?.craft || "",
    businessName: cache?.business_name || "",
    city: cache?.city || "",
    years: cache?.years_experience || "",
    specialties: Array.isArray(cache?.specialties) ? cache.specialties : [],
    leadCount: 0,
  };

  return (
    <div className={HM_FIXED_NAV_OFFSET_CLASS} style={{ minHeight: "100vh", background: "#FBF7F2", color: "#1C1917", fontFamily: "'DM Sans', Inter, system-ui, sans-serif" }}>
      <LandingNavbar />
      <main className="mx-auto max-w-6xl px-5 md:px-8 py-8 md:py-10">
        <section style={{ border: "1px solid #EEDCCB", background: "linear-gradient(135deg, #FFF6EC 0%, #FFFDFB 60%)", borderRadius: 16, padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
            <HmHomiMascot size={48} variant="hero" />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Welcome back, {firstName}</div>
              <div style={{ fontSize: 13, color: "#57534E", marginTop: 4 }}>
                {isApproved
                  ? "Your published portfolio is available in the professional directory."
                  : "Complete and publish your portfolio to appear in the professional directory."}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 16 }}>
            <button type="button" onClick={() => navigate(isSubmitted ? "/details" : getProOnboardingResumePath())} className="rounded-full border border-[#E7D4C4] bg-white px-4 py-2 text-[13px] font-semibold cursor-pointer">
              {isSubmitted ? "Edit portfolio" : "Continue portfolio"}
            </button>
            {isApproved ? (
              <>
                <button type="button" onClick={previewProfile} className="rounded-full border border-[#E7D4C4] bg-white px-4 py-2 text-[13px] font-semibold cursor-pointer">View public profile</button>
                <button type="button" onClick={copyLink} className="rounded-full border border-[#E7D4C4] bg-white px-4 py-2 text-[13px] font-semibold cursor-pointer">{copied ? "Copied" : "Copy link"}</button>
                <button type="button" onClick={shareProfile} className="rounded-full border border-[#E7D4C4] bg-white px-4 py-2 text-[13px] font-semibold cursor-pointer">Share profile</button>
              </>
            ) : null}
            {isSubmitted ? (
              <button type="button" disabled={unpublishing} onClick={handleUnpublish} className="rounded-full border border-[#D7C8BC] bg-transparent px-4 py-2 text-[13px] font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-60">
                {unpublishing ? "Unpublishing…" : "Unpublish"}
              </button>
            ) : null}
          </div>
          {unpublishError ? <div role="alert" style={{ color: "#B42318", fontSize: 13, marginTop: 10 }}>{unpublishError}</div> : null}
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 16 }}>
          <Metric label="Directory status" value={isApproved ? "Live" : "Draft"} detail={isApproved ? "Visible to homeowners" : "Not public yet"} />
          <Metric label="Profile strength" value={`${profileStrength}%`} detail={`${portfolioState.step || 0} of 5 onboarding steps`} />
          <Metric label="Portfolio media" value={String(galleryCount)} detail={galleryCount === 1 ? "gallery image saved" : "gallery images saved"} />
          <Metric label="Location" value={cache?.city || "Not added"} detail={craft?.name || cache?.craft || "Professional"} />
        </div>

        {isApproved ? (
          <section style={{ border: "1px solid #E8E4DE", background: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>Your public directory listing</div>
                <div style={{ color: "#78716C", fontSize: 13, marginTop: 5, overflowWrap: "anywhere" }}>{shareUrl}</div>
              </div>
              <button type="button" onClick={() => navigate("/browse")} style={{ border: `1px solid ${OR}`, color: OR, background: "#fff", borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>
                Open directory
              </button>
            </div>
          </section>
        ) : (
          <section style={{ border: "1px solid #F1C9B5", background: "#FFF8F3", borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
            <div style={{ fontWeight: 800 }}>Your profile is not public yet</div>
            <p style={{ color: "#57534E", fontSize: 14, lineHeight: 1.5, margin: "7px 0 14px" }}>Finish the remaining portfolio steps, add your work, and publish. Only a successful database publish creates a directory listing.</p>
            <button type="button" onClick={() => navigate(getProOnboardingResumePath())} style={{ border: 0, background: OR, color: "#fff", borderRadius: 10, padding: "10px 15px", fontWeight: 700, cursor: "pointer" }}>Continue setup</button>
          </section>
        )}

        <section style={{ border: "1px solid #E8E4DE", background: "#fff", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>What is live in this first version</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginTop: 14 }}>
            {["Portfolio details and media are saved to your account", "Published profiles appear immediately in discovery", "Public links can be viewed and shared across devices"].map((text) => (
              <div key={text} style={{ border: "1px solid #F0E8DF", background: "#FFFCFA", borderRadius: 10, padding: "13px 14px", fontSize: 13, lineHeight: 1.5 }}><span style={{ color: "#16845B", fontWeight: 900 }}>✓</span> {text}</div>
            ))}
          </div>
        </section>
      </main>
      <HmProAssistant context={proContext} onNavigatePath={(path) => navigate(path)} onPreview={previewProfile} onCopyLink={copyLink} />
    </div>
  );
}
