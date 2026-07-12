import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import LandingNavbar from "../components/landing/LandingNavbar";
import ProjectHubShell from "../components/ProjectHubShell";
import { craftLabel, proCardImage, proDisplayName } from "../components/PublishedProsDirectory";
import { listPublishedPortfolios } from "../lib/api";

const HOUZZ_CATS = [
  { img: "pro_architect.png", title: "Architects & Building Designers", craft: "architect", query: "Architect" },
  { img: "pro_contractor.png", title: "Civil Contractors", craft: "contractor", query: "Contractor" },
  { img: "pro_carpenter.png", title: "Carpenters & Woodwork", craft: "carpenter", query: "Carpenter" },
  { img: "pro_painter.png", title: "Painters & Wall Coverings", craft: "painter", query: "Painter" },
  { img: "pro_electrician.png", title: "Electricians", craft: "electrician", query: "Electrician" },
  { img: "pro_plumber.png", title: "Plumbers", craft: "plumber", query: "Plumber" },
];

const POPULAR_SERVICES = [
  { img: "pro_contractor.png", title: "Home Building & Remodeling", query: "Contractor", craft: "contractor" },
  { img: "pro_carpenter.png", title: "Modular Kitchen & Wardrobes", query: "Carpenter", craft: "carpenter" },
  { img: "pro_painter.png", title: "Interior Painting", query: "Painter", craft: "painter" },
  { img: "pro_architect.png", title: "Floor Plans & Drawings", query: "Architect", craft: "architect" },
];

function filterPublishedPros(pros, serviceQuery, locationQuery, craftFilter) {
  let rows = pros;
  const city = String(locationQuery || "").trim().replace(/,\s*IN$/i, "").toLowerCase();
  const service = String(serviceQuery || "").trim().toLowerCase();
  if (craftFilter) rows = rows.filter((p) => p.craft === craftFilter);
  if (city) rows = rows.filter((p) => String(p.city || "").toLowerCase().includes(city));
  if (service) {
    rows = rows.filter((p) => {
      const name = proDisplayName(p).toLowerCase();
      const craft = craftLabel(p.craft).toLowerCase();
      const specs = Array.isArray(p.specialties) ? p.specialties.map((s) => String(s).toLowerCase()).join(" ") : "";
      return name.includes(service) || craft.includes(service) || specs.includes(service);
    });
  }
  return rows;
}

function ProResultCard({ pro }) {
  const name = proDisplayName(pro);
  const meta = [craftLabel(pro.craft), pro.city].filter(Boolean).join(" · ");
  const card = (
    <div style={{ border: "1px solid #E5E5E5", borderRadius: 8, overflow: "hidden", background: "#fff", height: "100%" }}>
      <div style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden" }}>
        <img src={proCardImage(pro)} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#1C1917", marginBottom: 4 }}>{name}</div>
        <div style={{ fontSize: 13, color: "#78716C" }}>{meta}</div>
      </div>
    </div>
  );
  if (pro.slug) {
    return (
      <Link to={`/profile/${pro.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
        {card}
      </Link>
    );
  }
  return card;
}

export default function Marketplace() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const standalone = location.pathname === "/browse";
  const hubQuery = location.search || "";

  const [serviceQuery, setServiceQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [craftFilter, setCraftFilter] = useState(null);
  const [hasSearched, setHasSearched] = useState(true);
  const [loading, setLoading] = useState(false);
  const [allPublished, setAllPublished] = useState([]);
  const [directoryError, setDirectoryError] = useState("");

  const fetchPublished = useCallback(
    async (craft) => {
      setLoading(true);
      setDirectoryError("");
      try {
        const city = locationQuery?.trim() ? locationQuery.replace(/,\s*IN$/i, "").trim() : null;
        const rows = await listPublishedPortfolios({ craft: craft || null, city, limit: 100 });
        setAllPublished(rows);
      } catch (err) {
        setDirectoryError(err?.message || "Could not load professionals. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [locationQuery]
  );

  useEffect(() => {
    const trade = searchParams.get("trade");
    if (trade) setServiceQuery(trade);
    setHasSearched(true);
    fetchPublished(null);
    // Initial directory load intentionally runs once; searches are explicit after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = useMemo(
    () => filterPublishedPros(allPublished, serviceQuery, locationQuery, craftFilter),
    [allPublished, serviceQuery, locationQuery, craftFilter]
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setCraftFilter(null);
    setHasSearched(true);
    fetchPublished(null);
  };

  const handleCategoryPick = (cat) => {
    setServiceQuery(cat.query || cat.title);
    setCraftFilter(cat.craft || null);
    setHasSearched(true);
    fetchPublished(cat.craft || null);
  };

  const shellFont = { fontFamily: "'DM Sans','Inter',sans-serif", color: "#1C1917" };

  const heroStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL || ""}/pro_hero_banner.png)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    padding: "80px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    textAlign: "center",
    position: "relative"
  };

  const overlayStyle = {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 1
  };

  const houzzGrid = (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#fff" }}>
      {/* Hero Section */}
      <div style={heroStyle}>
        <div style={overlayStyle} />
        <div style={{ position:"relative", zIndex:2, width:"100%", maxWidth:860 }}>
          <h1 style={{ fontSize:"2.2rem", fontWeight:500, marginBottom:32, letterSpacing:"-0.02em" }}>Find the right pro for your project</h1>
          <form onSubmit={handleSearch} style={{ display:"flex", background:"#fff", borderRadius:6, overflow:"hidden", padding:6, boxShadow:"0 4px 14px rgba(0,0,0,0.15)" }}>
            <input
              placeholder="What service do you need?"
              value={serviceQuery}
              onChange={(e) => setServiceQuery(e.target.value)}
              style={{ flex:2, padding:"14px 16px", border:"none", outline:"none", fontSize:15, color:"#1C1917" }}
            />
            <div style={{ width:1, background:"#E5E5E5", margin:"8px 0" }} />
            <div style={{ flex:1, display:"flex", alignItems:"center", padding:"0 16px" }}>
              <span style={{ fontSize:16, marginRight:8, opacity:0.6 }}>📍</span>
              <input
                placeholder="Bengaluru, IN"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                style={{ width:"100%", border:"none", outline:"none", fontSize:15, color:"#1C1917" }}
              />
            </div>
            <button type="submit" style={{ background:"#C85F2B", color:"#fff", border:"none", padding:"0 32px", fontWeight:600, fontSize:15, borderRadius:4, cursor:"pointer", transition:"opacity 0.2s" }} onMouseEnter={e=>e.currentTarget.style.opacity=0.9} onMouseLeave={e=>e.currentTarget.style.opacity=1}>Get Started</button>
          </form>
        </div>
      </div>

      {/* Content Container */}
      <div className="px-5 md:px-10" style={{ maxWidth: 1200, margin: "0 auto", width: "100%", paddingBottom: 60 }}>
        
        {/* Section 1: Get the Right Pros */}
        <div style={{ marginTop: 40, marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 20, color:"#1C1917" }}>Get the Right Pros for Your Project</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20 }}>
            {HOUZZ_CATS.map((cat) => (
              <div key={cat.title} role="button" tabIndex={0} onClick={() => handleCategoryPick(cat)} onKeyDown={(e) => e.key === "Enter" && handleCategoryPick(cat)} style={{ cursor:"pointer" }}>
                <div style={{ width:"100%", aspectRatio:"4/3", borderRadius:6, overflow:"hidden", marginBottom:10, border:"1px solid #E5E5E5" }}>
                  <img src={`${process.env.PUBLIC_URL || ""}/${cat.img}`} alt={cat.title} style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.3s ease" }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color:"#1C1917", textAlign:"center", lineHeight:1.3 }}>{cat.title}</div>
              </div>
            ))}
          </div>
        </div>

        <hr style={{ border:0, borderTop:"1px solid #E5E5E5", margin:"0 0 40px" }} />

        {/* Section 2: Popular Services */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 20, color:"#1C1917" }}>Popular Services</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
            {POPULAR_SERVICES.map((cat) => (
              <div key={cat.title} role="button" tabIndex={0} onClick={() => handleCategoryPick(cat)} onKeyDown={(e) => e.key === "Enter" && handleCategoryPick(cat)} style={{ cursor:"pointer" }}>
                <div style={{ width:"100%", aspectRatio:"16/9", borderRadius:6, overflow:"hidden", marginBottom:10, border:"1px solid #E5E5E5" }}>
                  <img src={`${process.env.PUBLIC_URL || ""}/${cat.img}`} alt={cat.title} style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.3s ease" }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color:"#1C1917", textAlign:"center" }}>{cat.title}</div>
              </div>
            ))}
          </div>
        </div>

        {hasSearched && (
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8, color: "#1C1917" }}>Search results</h2>
            <p style={{ fontSize: 14, color: "#78716C", marginBottom: 20 }}>
              Professionals who completed their portfolio and published their profile.
            </p>
            {directoryError ? (
              <p role="alert" style={{ fontSize: 14, color: "#B42318" }}>{directoryError}</p>
            ) : loading ? (
              <p style={{ fontSize: 14, color: "#78716C" }}>Searching…</p>
            ) : results.length === 0 ? (
              <p style={{ fontSize: 14, color: "#78716C" }}>
                No professionals match your search yet. Try another service or location.
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
                {results.map((pro) => (
                  <ProResultCard key={pro.id || pro.slug} pro={pro} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (standalone) {
    return (
      <div
        className="hm-landing-page"
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#fff", ...shellFont }}
      >
        <LandingNavbar />
        <main style={{ flex: 1, paddingTop: "4.65rem", overflow: "auto", minHeight: 0 }}>{houzzGrid}</main>
      </div>
    );
  }

  return <ProjectHubShell hubQuery={hubQuery}>{houzzGrid}</ProjectHubShell>;
}
