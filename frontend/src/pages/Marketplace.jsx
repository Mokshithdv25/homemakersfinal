import React from "react";
import { useLocation } from "react-router-dom";
import LandingNavbar from "../components/landing/LandingNavbar";
import ProjectHubShell from "../components/ProjectHubShell";

const HOUZZ_CATS = [
  { img: "pro_architect.png", title: "Architects & Building Designers" },
  { img: "pro_contractor.png", title: "Civil Contractors" },
  { img: "pro_carpenter.png", title: "Carpenters & Woodwork" },
  { img: "pro_painter.png", title: "Painters & Wall Coverings" },
  { img: "pro_electrician.png", title: "Electricians" },
  { img: "pro_plumber.png", title: "Plumbers" },
];

const POPULAR_SERVICES = [
  { img: "pro_contractor.png", title: "Home Building & Remodeling" },
  { img: "pro_carpenter.png", title: "Modular Kitchen & Wardrobes" },
  { img: "pro_painter.png", title: "Interior Painting" },
  { img: "pro_architect.png", title: "Floor Plans & Drawings" },
];

export default function Marketplace() {
  const location = useLocation();
  // Standalone: /browse. Hub: /marketplace or /project/browse (same content, project sidebar).
  const standalone = location.pathname === "/browse";

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
          <div style={{ display:"flex", background:"#fff", borderRadius:6, overflow:"hidden", padding:6, boxShadow:"0 4px 14px rgba(0,0,0,0.15)" }}>
            <input placeholder="What service do you need?" style={{ flex:2, padding:"14px 16px", border:"none", outline:"none", fontSize:15, color:"#1C1917" }} />
            <div style={{ width:1, background:"#E5E5E5", margin:"8px 0" }} />
            <div style={{ flex:1, display:"flex", alignItems:"center", padding:"0 16px" }}>
              <span style={{ fontSize:16, marginRight:8, opacity:0.6 }}>📍</span>
              <input placeholder="Bengaluru, IN" style={{ width:"100%", border:"none", outline:"none", fontSize:15, color:"#1C1917" }} />
            </div>
            <button type="button" style={{ background:"#C85F2B", color:"#fff", border:"none", padding:"0 32px", fontWeight:600, fontSize:15, borderRadius:4, cursor:"pointer", transition:"opacity 0.2s" }} onMouseEnter={e=>e.currentTarget.style.opacity=0.9} onMouseLeave={e=>e.currentTarget.style.opacity=1}>Get Started</button>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="px-5 md:px-10" style={{ maxWidth: 1200, margin: "0 auto", width: "100%", paddingBottom: 60 }}>
        
        {/* Section 1: Get the Right Pros */}
        <div style={{ marginTop: 40, marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 20, color:"#1C1917" }}>Get the Right Pros for Your Project</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20 }}>
            {HOUZZ_CATS.map((cat) => (
              <div key={cat.title} style={{ cursor:"pointer", group:"true" }}>
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
              <div key={cat.title} style={{ cursor:"pointer" }}>
                <div style={{ width:"100%", aspectRatio:"16/9", borderRadius:6, overflow:"hidden", marginBottom:10, border:"1px solid #E5E5E5" }}>
                  <img src={`${process.env.PUBLIC_URL || ""}/${cat.img}`} alt={cat.title} style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.3s ease" }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color:"#1C1917", textAlign:"center" }}>{cat.title}</div>
              </div>
            ))}
          </div>
        </div>
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

  return <ProjectHubShell>{houzzGrid}</ProjectHubShell>;
}
