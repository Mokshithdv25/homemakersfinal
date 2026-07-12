import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Hammer, Paintbrush, Users, FolderKanban } from "lucide-react";
import MobileCategoryRail from "../components/MobileCategoryRail";
import MobilePhotoGrid from "../components/MobilePhotoGrid";
import MobileSaveToast from "../components/MobileSaveToast";
import { useMobileIdeabooks } from "../MobileIdeabooksContext";
import { useMobileHub } from "../hooks/useMobileHub";
import { HM_CORE_FLOWS, INDIAN_ROOM_FILTERS } from "../mobileIA";
import { listPublishedPortfolios } from "../../lib/api";
import { craftLabel, proCardImage, proDisplayName } from "../../components/PublishedProsDirectory";

const FLOW_ICONS = {
  build: Hammer,
  remodel: Paintbrush,
  pros: Users,
  project: FolderKanban,
};

function prosToFeed(pros, craftFilter) {
  const out = [];
  pros.forEach((pro) => {
    if (craftFilter && pro.craft !== craftFilter) return;
    const imgs = [pro.cover_photo, ...(Array.isArray(pro.photos) ? pro.photos : [])].filter(Boolean);
    imgs.slice(0, 2).forEach((url, i) => {
      if (String(url).startsWith("data:")) return;
      out.push({
        id: `pro_${pro.id}_${i}`,
        title: proDisplayName(pro),
        room: craftLabel(pro.craft),
        style: pro.city ? `${pro.city}` : "India",
        url: proCardImage({ ...pro, cover_photo: url }),
        h: 220 + (i % 3) * 36,
        proSlug: pro.slug,
      });
    });
  });
  return out;
}

export default function MobileHomePage() {
  const navigate = useNavigate();
  const { toast, clearToast } = useMobileIdeabooks();
  const { resumeCards } = useMobileHub();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [pros, setPros] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState("");

  const craftFilter = INDIAN_ROOM_FILTERS.find((f) => f.id === filter)?.craft || null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingFeed(true);
      setFeedError("");
      try {
        const rows = await listPublishedPortfolios({ craft: craftFilter, limit: 24 });
        if (!cancelled) setPros(rows);
      } catch (err) {
        if (!cancelled) setFeedError(err?.message || "Could not load professional portfolios.");
      } finally {
        if (!cancelled) setLoadingFeed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [craftFilter]);

  const feed = useMemo(() => prosToFeed(pros, craftFilter), [pros, craftFilter]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/browse?q=${encodeURIComponent(q)}` : "/browse");
  };

  return (
    <>
      <header className="hm-m-home-header">
        <div className="hm-m-home-brand">HomeMakers</div>
        <p className="hm-m-home-tagline">Design · Build · Manage — for Indian homes</p>
        <form className="hm-m-home-search" onSubmit={onSearchSubmit}>
          <Search size={18} color="#78716C" />
          <input
            placeholder="Find architects, contractors, painters…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search professionals"
          />
        </form>
      </header>

      <p className="hm-m-section-title">Your flows</p>
      <div className="hm-m-grid-2" style={{ padding: "0 16px 8px" }}>
        {HM_CORE_FLOWS.map((flow) => {
          const Icon = FLOW_ICONS[flow.icon];
          return (
            <button key={flow.id} type="button" className="hm-m-quick" onClick={() => navigate(flow.path)}>
              <span className="hm-m-quick-icon">
                <Icon size={22} color="#C85F2B" />
              </span>
              <span className="hm-m-quick-label">{flow.label}</span>
              <span className="hm-m-quick-sub">{flow.sub}</span>
            </button>
          );
        })}
      </div>

      {resumeCards.length > 0 ? (
        <>
          <p className="hm-m-section-title">Continue</p>
          <div className="hm-m-latest-scroll">
            {resumeCards.map((card) => (
              <button key={card.id} type="button" className="hm-m-latest-card" onClick={() => navigate(card.path)}>
                <span className="hm-m-latest-title">{card.label}</span>
                <span className="hm-m-latest-sub">{card.sub}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      <MobileCategoryRail categories={INDIAN_ROOM_FILTERS} activeId={filter} onSelect={setFilter} />

      <p className="hm-m-section-title" style={{ marginTop: 8 }}>
        From pros on HomeMakers
      </p>
      {feedError ? (
        <p role="alert" style={{ padding: "0 16px 24px", fontSize: 14, color: "#B42318" }}>{feedError}</p>
      ) : loadingFeed ? (
        <p style={{ padding: "0 16px 24px", fontSize: 14, color: "#78716C" }}>Loading portfolios…</p>
      ) : feed.length === 0 ? (
        <div className="hm-m-empty" style={{ margin: "0 16px 24px" }}>
          <p>No published portfolios yet for this filter. Be the first pro — or start your own project.</p>
          <button type="button" className="hm-m-btn-primary" onClick={() => navigate("/build")}>
            Start a home project
          </button>
        </div>
      ) : (
        <MobilePhotoGrid photos={feed} />
      )}

      <MobileSaveToast toast={toast} onViewIdeas={() => { clearToast(); navigate("/design"); }} />
    </>
  );
}
