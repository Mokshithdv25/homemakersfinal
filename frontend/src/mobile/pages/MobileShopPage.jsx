import React from "react";
import { useNavigate } from "react-router-dom";
import MobileHeader from "../MobileHeader";

const CATEGORIES = [
  { id: "structural", label: "Structural", sub: "Cement, steel, blocks", img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&q=75" },
  { id: "finishes", label: "Finishes", sub: "Tiles, paint, flooring", img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=75" },
  { id: "mep", label: "MEP", sub: "Electrical & plumbing", img: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=75" },
  { id: "kitchen", label: "Kitchen & bath", sub: "Fixtures & fittings", img: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&q=75" },
];

export default function MobileShopPage() {
  const navigate = useNavigate();
  return (
    <>
      <MobileHeader title="Shop" subtitle="Materials & finishes" backTo={-1} />
      <p style={{ padding: "0 16px", fontSize: 14, color: "#78716C", lineHeight: 1.5 }}>
        Browse departments linked to your estimate. Full checkout coming soon.
      </p>
      <div style={{ padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" className="hm-m-shop-row" onClick={() => navigate("/project")}>
            <img src={c.img} alt="" />
            <span>
              <span className="hm-m-list-title">{c.label}</span>
              <span className="hm-m-list-sub">{c.sub}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
