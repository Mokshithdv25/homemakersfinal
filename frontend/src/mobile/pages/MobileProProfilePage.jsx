import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Phone, MapPin } from "lucide-react";
import MobileHeader from "../MobileHeader";
import { getPublicProfile } from "../../lib/api";
import { craftLabel, proCardImage, proDisplayName } from "../../components/PublishedProsDirectory";

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

  const photos = [pro.cover_photo, ...(Array.isArray(pro.photos) ? pro.photos : [])].filter((u) => u && !String(u).startsWith("data:"));

  return (
    <>
      <MobileHeader title={proDisplayName(pro)} subtitle={craftLabel(pro.craft)} backTo="/browse" />
      <div className="hm-m-pro-hero">
        <img src={proCardImage(pro)} alt="" />
      </div>
      <div style={{ padding: 16 }}>
        {pro.city ? (
          <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#78716C", margin: "0 0 12px" }}>
            <MapPin size={16} /> {pro.city}
          </p>
        ) : null}
        {pro.phone ? (
          <a href={`tel:${String(pro.phone).replace(/\s/g, "")}`} className="hm-m-btn-primary" style={{ textDecoration: "none", marginBottom: 16 }}>
            <Phone size={18} /> Contact
          </a>
        ) : null}
        {photos.length > 1 ? (
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
