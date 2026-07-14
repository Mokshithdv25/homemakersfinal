import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Hammer, Paintbrush, Users, FolderKanban, Sparkles, CalendarClock, WalletCards, Bot, ArrowRight } from "lucide-react";
import MobileCategoryRail from "../components/MobileCategoryRail";
import MobilePhotoGrid from "../components/MobilePhotoGrid";
import MobileSaveToast from "../components/MobileSaveToast";
import { useMobileIdeabooks } from "../MobileIdeabooksContext";
import { useMobileHub } from "../hooks/useMobileHub";
import { HM_CORE_FLOWS, INDIAN_ROOM_FILTERS } from "../mobileIA";
import { listPublishedPortfolios } from "../../lib/api";
import { craftLabel, proCardImage, proDisplayName } from "../../components/PublishedProsDirectory";
import { hmLogoMarkSrc } from "../../lib/hmBrand";
import { publicAsset } from "../../lib/publicAsset";

const FLOW_ICONS = {
  build: Hammer,
  remodel: Paintbrush,
  pros: Users,
  project: FolderKanban,
};

const FLOW_IMAGES = {
  build: publicAsset("mobile_flow_build.jpg"),
  remodel: publicAsset("mobile_flow_remodel.jpg"),
  pros: publicAsset("mobile_flow_pros.jpg"),
  project: publicAsset("mobile_flow_project.jpg"),
};

const MOBILE_INTELLIGENCE = [
  { icon: Sparkles, title: "AI design memory", text: "Briefs, concepts, floor plans and revisions stay attached to the project." },
  { icon: CalendarClock, title: "Timeline awareness", text: "Stages, task progress and delays remain visible without opening desktop." },
  { icon: WalletCards, title: "Budget continuity", text: "Estimates, spending records and receipts live in the same workspace." },
  { icon: Bot, title: "Project-aware Homi", text: "Ask questions with the current project, stage and saved artifacts in context." },
];

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
  const { resumeCards } = useMobileHub({ includeProCount: true });
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
        <div className="hm-m-home-lockup"><img src={hmLogoMarkSrc} alt="" /><div><div className="hm-m-home-brand">HomeMakers</div><p className="hm-m-home-tagline">Design · Build · Manage — for Indian homes</p></div></div>
        <form className="hm-m-home-search" onSubmit={onSearchSubmit}>
          <Search size={18} color="#78716C" />
          <input
            placeholder="Architects, contractors, painters…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search professionals"
          />
          <button type="submit" aria-label="Search"><ArrowRight size={18} /></button>
        </form>
        <p className="hm-m-search-context">Search published portfolios by trade, professional, or city.</p>
      </header>

      <div className="hm-m-section-heading">
        <div><span>Start here</span><h2>Your home, one clear flow</h2><p>Plan, design, find professionals and manage delivery without losing context.</p></div>
      </div>
      <div className="hm-m-grid-2" style={{ padding: "0 16px 8px" }}>
        {HM_CORE_FLOWS.map((flow) => {
          const Icon = FLOW_ICONS[flow.icon];
          return (
            <button key={flow.id} type="button" className="hm-m-quick" onClick={() => navigate(flow.path)}>
              <span className="hm-m-quick-media"><img src={FLOW_IMAGES[flow.id]} alt="" loading={flow.id === "build" ? "eager" : "lazy"} decoding="async" /><span><Icon size={20} /></span></span>
              <span className="hm-m-quick-content"><span className="hm-m-quick-label">{flow.label}</span><span className="hm-m-quick-sub">{flow.sub}</span></span>
            </button>
          );
        })}
      </div>

      <div className="hm-m-section-heading" style={{ marginTop: 8 }}>
        <div><span>Project intelligence</span><h2>One connected project</h2><p>Your decisions remain useful after the first concept is generated.</p></div>
      </div>
      <div className="hm-m-intelligence-rail">
        {MOBILE_INTELLIGENCE.map((item) => {
          const Icon = item.icon;
          return <article key={item.title} className="hm-m-intelligence-card"><Icon size={20} /><strong>{item.title}</strong><p>{item.text}</p></article>;
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

      <div className="hm-m-section-heading" style={{ marginTop: 8 }}>
        <div><span>Portfolio discovery</span><h2>Real work from professionals</h2><p>Save evidence you like, then carry it into your own brief.</p></div>
        <button type="button" onClick={() => navigate("/browse")}>See all</button>
      </div>
      {feedError ? (
        <p role="alert" style={{ padding: "0 16px 24px", fontSize: 14, color: "#B42318" }}>{feedError}</p>
      ) : loadingFeed ? (
        <div className="hm-m-feed-skeleton" role="status" aria-label="Loading professional portfolios">
          {[0, 1, 2, 3].map((item) => <span key={item} />)}
        </div>
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
