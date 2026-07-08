import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { findCraft } from "../lib/crafts";
import {
  getPortfolioBase,
  getPortfolioMedia,
  migrateLegacyPortfolioMedia,
} from "../lib/portfolioStorage";
import { getPublicProfile } from "../lib/api";
import { formatLocationLabel } from "../lib/formatLocation";
import { getPortfolioThemeFromRecord, portfolioThemeCssVars } from "../lib/portfolioThemes";

/* ── Specialty SVG icons ── */
const SPEC_SVG = {
  "House Wiring":        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28"><path d="M16 4L4 14v14h8V20h8v8h8V14Z"/></svg>,
  "Fuse Box / DB Setup": <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28"><rect x="4" y="6" width="24" height="20" rx="2"/><line x1="11" y1="6" x2="11" y2="26"/><rect x="14" y="10" width="4" height="3" rx="0.5"/><rect x="14" y="17" width="4" height="3" rx="0.5"/></svg>,
  "Lighting Solutions":  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28"><circle cx="16" cy="13" r="6"/><path d="M13 19l1 5h4l1-5"/><line x1="16" y1="4" x2="16" y2="2"/><line x1="24" y1="13" x2="26" y2="13"/><line x1="6" y1="13" x2="8" y2="13"/></svg>,
  "Ceiling Fans":        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28"><circle cx="16" cy="16" r="2.5"/><ellipse cx="9" cy="11" rx="6" ry="2.5" transform="rotate(-30 9 11)"/><ellipse cx="23" cy="11" rx="6" ry="2.5" transform="rotate(30 23 11)"/><ellipse cx="9" cy="21" rx="6" ry="2.5" transform="rotate(30 9 21)"/><ellipse cx="23" cy="21" rx="6" ry="2.5" transform="rotate(-30 23 21)"/></svg>,
  "Appliance Repair":    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28"><path d="M22 8s2 4 0 8l-6 8-6-8c-2-4 0-8 4-8"/><circle cx="16" cy="12" r="2.5"/></svg>,
  "Residential":         <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28"><path d="M16 4L4 14v14h8V20h8v8h8V14Z"/></svg>,
  "Commercial":          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28"><rect x="6" y="8" width="20" height="20" rx="1"/><rect x="10" y="12" width="4" height="4"/><rect x="18" y="12" width="4" height="4"/><rect x="12" y="22" width="8" height="6"/><line x1="6" y1="8" x2="16" y2="2"/><line x1="26" y1="8" x2="16" y2="2"/></svg>,
  "Sustainable":         <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28"><path d="M16 28C16 28 6 22 6 14a10 10 0 0 1 20 0c0 8-10 14-10 14Z"/><path d="M16 14v6M13 17l3-3 3 3"/></svg>,
  default:               <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28"><circle cx="16" cy="16" r="10"/><path d="M12 16l3 3 5-5"/></svg>,
};

const FALLBACK_HERO = `${process.env.PUBLIC_URL || ""}/landing-hero.png`;

export default function PortfolioPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const pid = localStorage.getItem("hm_portfolio_id") || "";
    migrateLegacyPortfolioMedia(pid);
    const saved = getPortfolioBase();
    const media = getPortfolioMedia(pid);
    const full = { ...saved, ...media };
    (async () => {
      try {
        const remote = await getPublicProfile(slug);
        setData(remote);
      } catch {
        if (full?.published && full.slug === slug) {
          setData(full);
        } else {
          setNotFound(true);
        }
      }
    })();
  }, [slug]);

  if (notFound) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", background: "#faf9f7" }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>🏠</div>
      <h1 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Profile not found</h1>
      <p style={{ color: "#888", marginBottom: 8, maxWidth: 360, textAlign: "center", lineHeight: 1.5 }}>
        No published profile matches <strong>{slug}</strong>. Check the link or browse live pros.
      </p>
      <p style={{ color: "#aaa", fontSize: 13, marginBottom: 24 }}>Draft portfolios are only visible to their owner until Go Live.</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link to="/browse" style={{ background: "#fff", color: "#E05A20", fontWeight: 700, padding: "12px 24px", borderRadius: 10, border: "2px solid #E05A20", fontSize: 15, textDecoration: "none" }}>
          Browse pros
        </Link>
        <Link to="/craft" style={{ background: "#E05A20", color: "#fff", fontWeight: 700, padding: "12px 32px", borderRadius: 10, fontSize: 15, textDecoration: "none" }}>
          Create your portfolio
        </Link>
      </div>
    </div>
  );

  if (!data) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>Loading…</div>;

  const craft      = findCraft(data.craft);
  const craftLabel = craft?.name || data.craft || "Professional";
  const photos     = Array.isArray(data.photos) ? data.photos.filter(Boolean) : [];
  const hero       = data.cover_photo || photos[0] || craft?.hero || FALLBACK_HERO;
  const name       = data.full_name || "Your Name";
  const city       = data.city || "";
  const exp        = data.years_experience ? `${data.years_experience} yrs experience` : "";
  const business   = data.business_name || "";
  const bio        = data.short_bio || "";
  const specs      = data.specialties?.length > 0 ? data.specialties : (craft?.specialties?.slice(0, 5) || []);

  const email = data.email || "";
  const theme = getPortfolioThemeFromRecord(data);
  const themeVars = portfolioThemeCssVars(theme);
  const heroMinHeight = theme.layout === "compact" ? "48vh" : theme.layout === "editorial" ? "68vh" : "62vh";

  const metaItems = [
    formatLocationLabel(city) && { icon: "📍", text: formatLocationLabel(city) },
    exp && { icon: "🗓", text: exp },
    business && { icon: "🏢", text: business },
    email && { icon: "✉️", text: email },
    data.phone && { icon: "📞", text: data.phone },
  ].filter(Boolean);

  return (
    <div
      style={{
        fontFamily: "'DM Sans','Inter',sans-serif",
        background: "#fff",
        color: "#111",
        minHeight: "100vh",
        ...themeVars,
      }}
    >

      {/* ══ HERO with overlay ══ */}
      <div style={{ position: "relative", minHeight: heroMinHeight, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        {/* Background image */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${hero})`,
          backgroundSize: "cover", backgroundPosition: "center",
          zIndex: 0,
        }} />
        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: theme.heroOverlay,
        }} />

        {/* Top-right Work With Me */}
        <div style={{ position: "absolute", top: 20, right: 24, zIndex: 10 }}>
          <button
            onClick={() => navigate("/build?source=portfolio")}
            style={{
              background: theme.accent, color: "#fff", fontWeight: 700,
              fontSize: 15, padding: "11px 26px", borderRadius: 9,
              border: "none", cursor: "pointer",
              boxShadow: `0 4px 20px ${theme.accent}66`,
            }}
          >
            Work With Me
          </button>
        </div>

        {/* Profile info — overlaid on hero bottom */}
        <div style={{ position: "relative", zIndex: 2, padding: "0 32px 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
            {/* Avatar */}
            <div style={{
              width: 90, height: 90, borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              border: "3px solid rgba(255,255,255,0.7)",
              backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, overflow: "hidden",
            }}>
              {data.profile_photo ? (
                <img
                  src={data.profile_photo}
                  alt={name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.4">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              )}
            </div>

            {/* Name + craft + bio + meta */}
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 30, lineHeight: 1.15, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>{name}</div>
              <div style={{ color: theme.accentSoft, fontWeight: 700, fontSize: 15, marginTop: 3, marginBottom: 8, filter: "brightness(1.15)" }}>Licensed {craftLabel}</div>
              {bio && <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.6, maxWidth: 480, marginBottom: 10 }}>{bio}</p>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
                {metaItems.map((m, i) => (
                  <span key={i} style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
                    <span>{m.icon}</span>{m.text}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Specialties chips — on the hero */}
          {specs.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
              {specs.slice(0, 6).map(s => (
                <span key={s} style={{
                  background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.35)",
                  color: "#fff", fontSize: 12, fontWeight: 600,
                  padding: "5px 14px", borderRadius: 20,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{ opacity: 0.85 }}>{SPEC_SVG[s] || SPEC_SVG.default}</span>
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ MY WORK ══ */}
      <div style={{ padding: "28px 32px 24px", background: "#fff" }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 16, color: "#111", letterSpacing: "-0.3px" }}>My Work</div>
        {photos.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
            {photos.slice(0, 6).map((src, i) => {
              const alt = `Portfolio photo ${i + 1}`;
              return (
                <div key={`${src}-${i}`} style={{ borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
                  <img src={src} alt={alt} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }} />
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              border: "1px solid #E7E5E4",
              borderRadius: 12,
              padding: "18px 16px",
              fontSize: 13,
              color: "#7A6E62",
              background: "#FAFAF9",
            }}
          >
            No work photos uploaded yet.
          </div>
        )}
      </div>

      {/* ══ BOTTOM CTA ══ */}
      <div style={{
        background: "linear-gradient(135deg, #1C1917 0%, #3D2B1F 100%)",
        padding: "28px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 20, marginBottom: 4 }}>Want a portfolio like this?</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>Showcase your work and get discovered by clients.</div>
        </div>
        <Link
          to="/craft"
          style={{
            background: "#E05A20", color: "#fff", fontWeight: 700, fontSize: 15,
            padding: "13px 36px", borderRadius: 10, textDecoration: "none",
            display: "inline-block", whiteSpace: "nowrap",
            boxShadow: "0 4px 20px rgba(224,90,32,0.4)",
          }}
        >
          Get It Here →
        </Link>
      </div>

    </div>
  );
}
