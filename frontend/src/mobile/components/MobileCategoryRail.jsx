import React from "react";

export default function MobileCategoryRail({ categories, activeId, onSelect }) {
  return (
    <div className="hm-m-pill-row" role="tablist" aria-label="Room categories">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          role="tab"
          aria-selected={activeId === cat.id}
          className={`hm-m-pill${activeId === cat.id ? " active" : ""}`}
          onClick={() => onSelect(cat.id)}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
