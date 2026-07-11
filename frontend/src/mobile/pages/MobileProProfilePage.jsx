import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Phone, MapPin, Mail, Calendar, Building2 } from "lucide-react";
import MobileHeader from "../MobileHeader";
import { getPublicProfile } from "../../lib/api";
import { craftLabel, proDisplayName } from "../../components/PublishedProsDirectory";
import { getPortfolioThemeFromRecord } from "../../lib/portfolioThemes";
import { findCraft } from "../../lib/crafts";
import { formatLocationLabel } from "../../lib/formatLocation";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=70";

export default function MobileProProfilePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [pro, setPro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const row = await getPublicProfile(slug);
        if (!cancelled) {
          setPro(row);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <>
        <MobileHeader title="Pro" backTo="/browse" />
        <p style={{ padding: 16, color: "#78716C" }}>Loading…</p>
      </>
    );
  }

  if (notFound || !pro) {
    return (
      <>
        <MobileHeader title="Pro" backTo="/browse" />
        <div className="hm-m-empty">
          <p>Profile not found or not published yet.</p>
          <button type="button" className="hm-m-btn-secondary" onClick={() => navigate("/browse")}>Find pros</button>
        </div>
      </>
    );
  }

  const theme = getPortfolioThemeFromRecord(pro);
  const craft = findCraft(pro.craft);
  const name = proDisplayName(pro);
  const label = craftLabel(pro.craft);
  const photos = Array.isArray(pro.photos) ? pro.photos.filter(Boolean) : [];
  const hero = pro.cover_photo || photos[0] || craft?.hero || FALLBACK_HERO;
  const bio = pro.short_bio || "";
  const business = pro.business_name || "";
  const city = formatLocationLabel(pro.city) || pro.city || "";
  const exp = pro.years_experience ? `${pro.years_experience} yrs experience` : "";
  const email = pro.email || "";
  const specialties =
    Array.isArray(pro.specialties) && pro.specialties.length > 0
      ? pro.specialties
      : (craft?.specialties?.slice(0, 5) || []);

  const meta = [
    city && { icon: MapPin, text: city },
    exp && { icon: Calendar, text: exp },
    business && { icon: Building2, text: business },
    email && { icon: Mail, text: email },
  ].filter(Boolean);

  return (
    <>
      <MobileHeader title={name} subtitle={label} backTo="/browse" />

      {/* Themed hero */}
      <div style={{ position: "relative", minHeight: 220, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${hero})`, backgroundSize: "cover", backgroundPosition: "center", zIndex: 0 }} />
        <div style={{ position: "absolute", inset: 0, zIndex: 1, background: theme.heroOverlay }} />
        <div style={{ position: "relative", zIndex: 2, padding: "0 16px 18px", color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid rgba(255,255,255,0.75)", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {pro.profile_photo ? (
                <img src={pro.profile_photo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.4"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.15, textShadow: "0 2px 8px rgba(0,0,0,0.35)" }}>{name}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, color: theme.accentSoft, filter: "brightness(1.1)" }}>Licensed {label}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {meta.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginBottom: 14 }}>
            {meta.map((m, i) => {
              const Icon = m.icon;
              return (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#57534E" }}>
                  <Icon size={15} color={theme.accent} /> {m.text}
                </span>
              );
            })}
          </div>
        ) : null}

        {bio ? (
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#44403C", margin: "0 0 16px" }}>{bio}</p>
        ) : null}

        {pro.phone || email ? (
          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
            {pro.phone ? (
              <a
                href={`tel:${String(pro.phone).replace(/\s/g, "")}`}
                className="hm-m-btn-primary"
                style={{ textDecoration: "none", flex: 1, background: theme.accent, borderColor: theme.accent }}
              >
                <Phone size={18} /> Call
              </a>
            ) : null}
            {pro.phone ? (
              <a
                href={`https://wa.me/${(() => { const d = String(pro.phone).replace(/\D/g, ""); return d.length === 10 ? `91${d}` : d; })()}`}
                target="_blank"
                rel="noreferrer"
                className="hm-m-btn-secondary"
                style={{ textDecoration: "none", flex: 1 }}
              >
                WhatsApp
              </a>
            ) : email ? (
              <a href={`mailto:${email}`} className="hm-m-btn-secondary" style={{ textDecoration: "none", flex: 1 }}>
                <Mail size={18} /> Email
              </a>
            ) : null}
          </div>
        ) : null}

        {specialties.length > 0 ? (
          <>
            <p className="hm-m-section-title" style={{ padding: 0 }}>Specialties</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {specialties.slice(0, 8).map((s) => (
                <span key={s} style={{ background: theme.accentSoft, color: "#44403C", border: `1px solid ${theme.border}`, fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20 }}>
                  {s}
                </span>
              ))}
            </div>
          </>
        ) : null}

        {photos.length > 0 ? (
          <>
            <p className="hm-m-section-title" style={{ padding: 0 }}>Portfolio</p>
            <div className="hm-m-ideas-grid">
              {photos.slice(0, 6).map((url, i) => (
                <div key={i} className="hm-m-idea-thumb static">
                  <img src={url} alt="" />
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
