import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function MobilePhotoGrid({ photos }) {
  const navigate = useNavigate();
  const [left, right] = useMemo(() => {
    const l = [];
    const r = [];
    photos.forEach((p, i) => (i % 2 === 0 ? l.push(p) : r.push(p)));
    return [l, r];
  }, [photos]);

  const renderTile = (photo) => (
    <button
      key={photo.id}
      type="button"
      className="hm-m-feed-tile"
      style={{ height: photo.h || 240 }}
      onClick={() => navigate(`/photo/${photo.id}`, { state: { photo } })}
    >
      <img src={photo.url} alt={photo.title || photo.room || "Design inspiration"} loading="lazy" />
      <span className="hm-m-feed-tile-label">{photo.room || photo.title}</span>
    </button>
  );

  return (
    <div className="hm-m-feed-grid">
      <div className="hm-m-feed-col">{left.map(renderTile)}</div>
      <div className="hm-m-feed-col">{right.map(renderTile)}</div>
    </div>
  );
}
