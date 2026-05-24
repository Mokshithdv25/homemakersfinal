import React from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Home, Paintbrush, Compass } from "lucide-react";
import MobileHeader from "../MobileHeader";
import { useMobileIdeabooks } from "../MobileIdeabooksContext";
import { useMobileHub } from "../hooks/useMobileHub";
import { HM_CORE_FLOWS } from "../mobileIA";

export default function MobileDesignPage() {
  const navigate = useNavigate();
  const { totalSaved, books } = useMobileIdeabooks();
  const { build, remodel, activeProject, resumeCards } = useMobileHub();
  const items = books[0]?.items || [];

  const inProgress =
    resumeCards.find((c) => c.id === "build-resume" || c.id === "remodel-resume") || null;

  return (
    <>
      <MobileHeader title="Design" subtitle="Build · remodel · saved ideas" />

      {inProgress ? (
        <section style={{ padding: "0 16px 12px" }}>
          <button type="button" className="hm-m-start-banner" style={{ width: "100%", border: "none", cursor: "pointer", textAlign: "left" }} onClick={() => navigate(inProgress.path)}>
            <div>
              <p className="hm-m-start-eyebrow">In progress</p>
              <h2 style={{ margin: "0 0 4px", fontSize: 16 }}>{inProgress.label}</h2>
              <p style={{ margin: 0, fontSize: 12, color: "#78716C" }}>{inProgress.sub}</p>
            </div>
            <span style={{ color: "#C85F2B", fontWeight: 700, fontSize: 14 }}>Resume →</span>
          </button>
        </section>
      ) : null}

      <section style={{ padding: "0 16px 16px" }}>
        <p className="hm-m-section-title" style={{ padding: 0, marginBottom: 10 }}>
          HomeMakers flows
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button type="button" className="hm-m-list-row" onClick={() => navigate("/build/new-home")}>
            <span className="hm-m-list-icon"><Home size={20} color="#C85F2B" /></span>
            <span>
              <span className="hm-m-list-title">Build a new home</span>
              <span className="hm-m-list-sub">Plot, lifestyle, AI v0 & ₹ estimate</span>
            </span>
          </button>
          <button type="button" className="hm-m-list-row" onClick={() => navigate("/build/remodel")}>
            <span className="hm-m-list-icon"><Paintbrush size={20} color="#C85F2B" /></span>
            <span>
              <span className="hm-m-list-title">Remodel your home</span>
              <span className="hm-m-list-sub">Room photos, style & AI concepts</span>
            </span>
          </button>
          {activeProject ? (
            <button type="button" className="hm-m-list-row" onClick={() => navigate("/project/journey")}>
              <span className="hm-m-list-icon"><Compass size={20} color="#C85F2B" /></span>
              <span>
                <span className="hm-m-list-title">Design journey</span>
                <span className="hm-m-list-sub">{activeProject.title || "Your saved brief & v0"}</span>
              </span>
            </button>
          ) : null}
        </div>
      </section>

      <p className="hm-m-section-title">Ideabooks · {totalSaved} saved</p>
      {items.length === 0 ? (
        <div className="hm-m-empty" style={{ margin: "0 16px 24px" }}>
          <Bookmark size={32} color="#C85F2B" strokeWidth={1.5} />
          <p>Save pro portfolio photos from Home or Marketplace while you plan.</p>
          <button type="button" className="hm-m-btn-secondary" onClick={() => navigate("/")}>
            Browse pro work
          </button>
        </div>
      ) : (
        <div className="hm-m-ideas-grid">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="hm-m-idea-thumb"
              onClick={() => navigate(`/photo/${item.id}`, { state: { photo: item } })}
            >
              <img src={item.url} alt={item.title} />
              <span>{item.room || item.title}</span>
            </button>
          ))}
        </div>
      )}

      {!build?.v0 && !remodel?.v0 ? (
        <div style={{ padding: "0 16px 24px" }}>
          <button type="button" className="hm-m-btn-primary" onClick={() => navigate(HM_CORE_FLOWS[0].path)}>
            Start new home project
          </button>
        </div>
      ) : null}
    </>
  );
}
