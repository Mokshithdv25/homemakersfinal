import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Search } from "lucide-react";
import MobileHeader from "../MobileHeader";
import { craftLabel, proCardImage, proDisplayName } from "../../components/PublishedProsDirectory";
import { listPublishedPortfolios } from "../../lib/api";

const CATEGORIES = [
  { label: "Architect", craft: "architect", query: "Architect" },
  { label: "Contractor", craft: "contractor", query: "Contractor" },
  { label: "Carpenter", craft: "carpenter", query: "Carpenter" },
  { label: "Painter", craft: "painter", query: "Painter" },
  { label: "Electrician", craft: "electrician", query: "Electrician" },
  { label: "Plumber", craft: "plumber", query: "Plumber" },
];

function filterPros(pros, service, city, craft) {
  let rows = pros;
  const c = String(city || "").trim().replace(/,\s*IN$/i, "").toLowerCase();
  const s = String(service || "").trim().toLowerCase();
  if (craft) rows = rows.filter((p) => p.craft === craft);
  if (c) rows = rows.filter((p) => String(p.city || "").toLowerCase().includes(c));
  if (s) {
    rows = rows.filter((p) => {
      const name = proDisplayName(p).toLowerCase();
      const cr = craftLabel(p.craft).toLowerCase();
      return name.includes(s) || cr.includes(s);
    });
  }
  return rows;
}

export default function MobileProsPage() {
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const [service, setService] = useState(initialQ);
  const [city, setCity] = useState("");
  const [craft, setCraft] = useState(null);
  const [hasSearched, setHasSearched] = useState(true);
  const [loading, setLoading] = useState(false);
  const [all, setAll] = useState([]);
  const [directoryError, setDirectoryError] = useState("");

  const fetchPros = useCallback(async (craftFilter) => {
    setLoading(true);
    setDirectoryError("");
    try {
      const rows = await listPublishedPortfolios({ craft: craftFilter || null, city: city.trim() || null, limit: 100 });
      setAll(rows);
    } catch (err) {
      setDirectoryError(err?.message || "Could not load professionals. Try again.");
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    setHasSearched(true);
    fetchPros(null);
    // Initial directory load intentionally runs once; searches are explicit after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = useMemo(() => filterPros(all, service, city, craft), [all, service, city, craft]);

  const onSearch = (e) => {
    e.preventDefault();
    setHasSearched(true);
    fetchPros(craft);
  };

  const pickCategory = (cat) => {
    setService(cat.query);
    setCraft(cat.craft);
    setHasSearched(true);
    fetchPros(cat.craft);
  };

  return (
    <>
      <MobileHeader title="Marketplace" subtitle="Published professionals" />
      <form className="hm-m-search-bar" onSubmit={onSearch}>
        <Search size={18} color="#78716C" />
        <input placeholder="Service — architect, painter…" value={service} onChange={(e) => setService(e.target.value)} />
      </form>
      <div className="hm-m-search-bar" style={{ marginTop: 0 }}>
        <MapPin size={18} color="#78716C" />
        <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <button type="button" className="hm-m-pill active" style={{ margin: 0 }} onClick={onSearch}>
          Go
        </button>
      </div>
      <div className="hm-m-pill-row" style={{ marginBottom: 12 }}>
        {CATEGORIES.map((cat) => (
          <button key={cat.craft} type="button" className={`hm-m-pill${craft === cat.craft ? " active" : ""}`} onClick={() => pickCategory(cat)}>
            {cat.label}
          </button>
        ))}
      </div>
      {directoryError ? (
        <p role="alert" style={{ padding: 16, color: "#B42318" }}>{directoryError}</p>
      ) : !hasSearched ? (
        <p style={{ padding: "8px 16px 24px", fontSize: 14, color: "#78716C", lineHeight: 1.5 }}>
          Search or tap a trade to see professionals who completed their portfolio on HomeMakers.
        </p>
      ) : loading ? (
        <p style={{ padding: 16, color: "#78716C" }}>Searching…</p>
      ) : results.length === 0 ? (
        <p style={{ padding: 16, color: "#78716C" }}>No matches yet. Try another service or city.</p>
      ) : (
        results.map((pro) => (
          <Link key={pro.id || pro.slug} to={pro.slug ? `/profile/${pro.slug}` : "#"} className="hm-m-pro-card">
            <img src={proCardImage(pro)} alt="" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{proDisplayName(pro)}</div>
              <div style={{ fontSize: 13, color: "#78716C", marginTop: 4 }}>
                {craftLabel(pro.craft)}
                {pro.city ? ` · ${pro.city}` : ""}
              </div>
            </div>
          </Link>
        ))
      )}
    </>
  );
}
