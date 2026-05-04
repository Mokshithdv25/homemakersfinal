import React from "react";

const OR = "#C85F2B";

export function formatInr(amount) {
  if (amount == null || amount === "") return "—";
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function sumEstimateLines(lines) {
  if (!Array.isArray(lines)) return 0;
  return lines.reduce((s, l) => {
    const v = l?.amount_inr;
    return s + (typeof v === "number" && Number.isFinite(v) ? v : 0);
  }, 0);
}

/**
 * Indicative cost breakdown from plan/estimate API (or mock).
 */
export function V0EstimateSection({ planBundle, title = "Indicative v0 estimate" }) {
  const lines = planBundle?.estimate_lines;
  if (!lines?.length) return null;
  const total =
    typeof planBundle?.total_indicative_inr === "number"
      ? planBundle.total_indicative_inr
      : sumEstimateLines(lines);

  return (
    <div
      style={{
        border: "1px solid #EEDCCB",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 20,
        background: "linear-gradient(180deg,#FFFBF7,#FDFBF8)",
      }}
    >
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #EDE8E0", background: "#FBF6F0" }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: "#1C1917" }}>{title}</div>
        <div style={{ fontSize: 12, color: "#78716C", marginTop: 4, lineHeight: 1.45 }}>
          Ballpark only — not a quote. Your architect validates scope and pricing.
          {planBundle?.mock ? " Dummy totals for demo." : null}
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#78716C", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            <th style={{ padding: "10px 16px", fontWeight: 700, borderBottom: "1px solid #EDE8E0" }}>Line item</th>
            <th style={{ padding: "10px 16px", fontWeight: 700, borderBottom: "1px solid #EDE8E0", textAlign: "right" }}>Indicative</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #F5F0EA" }}>
              <td style={{ padding: "12px 16px", color: "#44403C", verticalAlign: "top" }}>
                <div style={{ fontWeight: 600 }}>{row.label}</div>
                {row.note ? <div style={{ fontSize: 11, color: "#78716C", marginTop: 4, lineHeight: 1.4 }}>{row.note}</div> : null}
              </td>
              <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#1C1917", whiteSpace: "nowrap", verticalAlign: "top" }}>
                {formatInr(row.amount_inr)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: "#FDF8F3" }}>
            <td style={{ padding: "14px 16px", fontWeight: 800, color: "#1C1917" }}>Indicative subtotal (ex-GST)</td>
            <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 800, fontSize: 16, color: OR, fontVariantNumeric: "tabular-nums" }}>
              {formatInr(total)}
            </td>
          </tr>
        </tfoot>
      </table>
      {planBundle?.project_summary ? (
        <div style={{ padding: "12px 16px 16px", fontSize: 12, color: "#57534E", lineHeight: 1.55, borderTop: "1px solid #EDE8E0" }}>
          {planBundle.project_summary}
        </div>
      ) : null}
    </div>
  );
}

function thumbCard(entry, i, { tall, objectFit = "cover" }) {
  const label = entry && typeof entry === "object" ? entry.label || `Item ${i + 1}` : `Item ${i + 1}`;
  const url = entry?.url;
  const hint = entry?.hint;
  return (
    <div
      key={label + i}
      style={{
        borderRadius: 12,
        border: "1px solid #EEDCCB",
        padding: 12,
        minHeight: tall ? 140 : 100,
        background: "linear-gradient(180deg,#FFFBF7,#FDFBF8)",
        overflow: "hidden",
      }}
    >
      {url ? (
        <img
          src={url}
          alt=""
          style={{
            width: "100%",
            height: tall ? 160 : 88,
            objectFit,
            objectPosition: "center",
            borderRadius: 8,
            marginBottom: 8,
            background: "#E7E5E4",
          }}
        />
      ) : null}
      <div style={{ fontSize: 11, fontWeight: 700, color: OR }}>{label}</div>
      <div style={{ fontSize: 11, color: "#78716C", marginTop: 4, lineHeight: 1.35 }}>{hint || ""}</div>
    </div>
  );
}

/**
 * Renders `floor_plans` + `images` from v0 image bundle (mock or API).
 */
export function V0VisualBundleSections({ bundle, floorPlanTitle = "Floor plans (v0, indicative)", elevationTitle = "Elevations & massing" }) {
  let floorPlans = Array.isArray(bundle?.floor_plans) ? bundle.floor_plans : [];
  let elevations = Array.isArray(bundle?.images) ? bundle.images : [];

  /* Older mocks only had `images`; split by label when we can tell plans from elevations */
  if (!floorPlans.length && elevations.length) {
    const planish = (e) => /plan|floor|layout|blueprint/i.test(String(e?.label || ""));
    const fp = elevations.filter(planish);
    const el = elevations.filter((e) => !planish(e));
    if (fp.length) {
      floorPlans = fp;
      elevations = el;
    }
  }

  if (!floorPlans.length && !elevations.length) return null;

  return (
    <>
      {floorPlans.length ? (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6, color: "#1C1917" }}>{floorPlanTitle}</div>
          <p style={{ fontSize: 12, color: "#57534E", margin: "0 0 12px", lineHeight: 1.5 }}>
            Dummy blueprint-style layouts for briefing — not sanction drawings.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {floorPlans.map((e, i) => thumbCard(e, i, { tall: true, objectFit: "cover" }))}
          </div>
        </div>
      ) : null}
      {elevations.length ? (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6, color: "#1C1917" }}>{elevationTitle}</div>
          <p style={{ fontSize: 12, color: "#57534E", margin: "0 0 12px", lineHeight: 1.5 }}>
            Concept renders and façade studies to pair with the plans above.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {elevations.map((e, i) => thumbCard(e, i, { tall: false, objectFit: "cover" }))}
          </div>
        </div>
      ) : null}
    </>
  );
}
