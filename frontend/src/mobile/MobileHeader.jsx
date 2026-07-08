import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function MobileHeader({ title, subtitle, backTo, right = null }) {
  const navigate = useNavigate();
  return (
    <header className="hm-m-header">
      {backTo != null ? (
        <button type="button" className="hm-m-icon-btn" aria-label="Back" onClick={() => (backTo === -1 ? navigate(-1) : navigate(backTo))}>
          <ChevronLeft size={22} />
        </button>
      ) : (
        <div style={{ width: 40 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="hm-m-header-title">{title}</div>
        {subtitle ? <div className="hm-m-header-sub">{subtitle}</div> : null}
      </div>
      {right || <div style={{ width: 40 }} />}
    </header>
  );
}
