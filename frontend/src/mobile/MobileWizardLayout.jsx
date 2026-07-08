import React from "react";
import MobileHeader from "./MobileHeader";

export default function MobileWizardLayout({ title, subtitle, backTo = -1, children }) {
  return (
    <div className="hm-m-screen" style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <MobileHeader title={title} subtitle={subtitle} backTo={backTo} />
      <div className="hm-m-scroll no-tabs" style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
}
