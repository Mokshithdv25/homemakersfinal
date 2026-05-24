import React from "react";
import { HM_WORDMARK_TITLE_CLASS } from "../lib/hmBrand";

/** Marketing lockup — HomeMakers.ai on landing nav and footer only. */
export default function HmMarketingWordmark({ className = "", as: Tag = "span" }) {
  return (
    <Tag className={`${HM_WORDMARK_TITLE_CLASS} ${className}`.trim()}>
      HomeMakers
      <span className="text-[0.46em] font-semibold text-[#cfa170] tracking-normal align-baseline">.ai</span>
    </Tag>
  );
}
